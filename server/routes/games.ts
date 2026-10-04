import { Router, type Response } from "express";
import { gamesStore } from "@server/lib/gamesStore";
import { validateGameInput, type ValidationError } from "@/validation/gameValidator";
import type { RawGame } from "@/types/raw";

export const gamesRouter = Router();

/**
 * Sends a 400 with both a human-readable summary (consumed by the admin
 * client's toast) and the structured errors (for field-level display).
 */
function sendValidationErrors(res: Response, errors: ValidationError[]): void {
  res.status(400).json({ error: errors.map((e) => e.message).join("; "), errors });
}

/** Parses a positive integer route id; null when malformed. */
function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/games — full game list
gamesRouter.get("/", async (_req, res) => {
  try {
    res.json(await gamesStore.read());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/games — add new game (game_id assigned by server)
gamesRouter.post("/", async (req, res) => {
  try {
    // Validate before queuing: rejects are cheap and never hold the lock
    const result = validateGameInput(req.body);
    if (!result.valid) {
      sendValidationErrors(res, result.errors);
      return;
    }
    // Id assignment happens inside the transaction so concurrent POSTs can't collide
    const newGame = await gamesStore.transact((games) => {
      const nextId = games.length > 0 ? Math.max(...games.map((g) => g.game_id)) + 1 : 1;
      const game: RawGame = { game_id: nextId, ...result.game };
      return { commit: [...games, game], result: game };
    });
    res.status(201).json(newGame);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// DELETE /api/games/:id — remove a game
gamesRouter.delete("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: "Invalid game id" });
      return;
    }
    const found = await gamesStore.transact((games) =>
      games.some((g) => g.game_id === id)
        ? { commit: games.filter((g) => g.game_id !== id), result: true }
        : { rollback: false },
    );
    if (!found) {
      res.status(404).json({ error: `Game ${id} not found` });
      return;
    }
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// PUT /api/games/:id — update existing game (path id is authoritative; any body game_id is ignored)
gamesRouter.put("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: "Invalid game id" });
      return;
    }
    const result = validateGameInput(req.body);
    if (!result.valid) {
      sendValidationErrors(res, result.errors);
      return;
    }
    const updated: RawGame = { game_id: id, ...result.game };
    const found = await gamesStore.transact((games) =>
      games.some((g) => g.game_id === id)
        ? { commit: games.map((g) => (g.game_id === id ? updated : g)), result: true }
        : { rollback: false },
    );
    if (!found) {
      res.status(404).json({ error: `Game ${id} not found` });
      return;
    }
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
