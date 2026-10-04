import { open, readFile, rename, unlink } from "fs/promises";
import { basename, dirname, join, resolve } from "path";
import type { RawGame } from "../../src/types/raw.js";

/** What a transaction decided: persist a new game list, or leave the file untouched. */
export type TransactionOutcome<T> =
  | { commit: RawGame[]; result: T }
  | { rollback: T };

/**
 * A unit of work over the current games. Receives a snapshot it may freely
 * copy from; must not rely on mutating it in place.
 */
export type Transaction<T> = (games: readonly RawGame[]) => TransactionOutcome<T> | Promise<TransactionOutcome<T>>;

/**
 * File-backed game storage that is safe under concurrent requests.
 *
 * - **Serialised transactions:** each read-modify-write runs to completion
 *   before the next starts, so overlapping POSTs cannot both read the same
 *   state and silently drop a game (e.g. by assigning the same next id).
 * - **Atomic writes:** data goes to a temp file in the same directory, is
 *   fsynced, then renamed over the target; a crash mid-write leaves either the
 *   old or the new file, never a truncated one.
 *
 * Reads bypass the queue: atomic rename means a reader always sees a complete
 * file. Serialisation is in-process only — one server must own the file.
 */
export class GamesStore {
  /** Tail of the transaction queue; always settles (never rejects) so one failure can't wedge the queue. */
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly path: string) {}

  /** Current games as stored. */
  async read(): Promise<RawGame[]> {
    return JSON.parse(await readFile(this.path, "utf-8")) as RawGame[];
  }

  /**
   * Runs `transaction` exclusively against the latest stored games, persisting
   * its `commit` (sorted by game_id) or nothing on `rollback`.
   *
   * @returns the transaction's result once any write has completed.
   * @throws whatever the read, the transaction or the write throws; the file is
   * unchanged in that case and later transactions still run.
   */
  transact<T>(transaction: Transaction<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const outcome = await transaction(await this.read());
      if ("rollback" in outcome) return outcome.rollback;
      await this.writeAtomically(outcome.commit);
      return outcome.result;
    });
    this.queue = run.then(() => undefined, () => undefined);
    return run;
  }

  /** Write-to-temp, fsync, rename. Cleans up the temp file if any step fails. */
  private async writeAtomically(games: RawGame[]): Promise<void> {
    const sorted = [...games].sort((a, b) => a.game_id - b.game_id);
    const contents = JSON.stringify(sorted, null, 2) + "\n";
    // Same directory as the target: rename is only atomic within one filesystem
    const tempPath = join(dirname(this.path), `.${basename(this.path)}.${process.pid}.${Date.now()}.tmp`);

    try {
      const handle = await open(tempPath, "w");
      try {
        await handle.writeFile(contents, "utf-8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      await rename(tempPath, this.path);
    } catch (e) {
      await unlink(tempPath).catch(() => undefined);
      throw e;
    }
  }
}

/** The store backing the API: the bundled dataset the public build reads. */
export const gamesStore = new GamesStore(resolve(import.meta.dirname, "../../src/assets/games.json"));
