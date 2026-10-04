/**
 * Thin typed wrapper over the admin REST API (`/api/games`). Every call rejects
 * with an `Error` whose message is the server's `error` field when present, so
 * callers can show it directly.
 */
import type { RawGame } from "@/types/raw";
import type { GameInput } from "@/validation/gameValidator";

/**
 * Fetches JSON from the API, converting any non-2xx response into a thrown
 * `Error` (preferring the server's `error` message over the bare status).
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** All stored games, unvalidated, as the server read them from disk. */
export async function fetchGames(): Promise<RawGame[]> {
  return request<RawGame[]>("/api/games");
}

/** Adds a game; the server assigns and returns its `game_id`. Rejects with validation messages on 400. */
export async function createGame(game: GameInput): Promise<RawGame> {
  return request<RawGame>("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
}

/** Replaces game `id` wholesale; rejects on 404 (missing) or 400 (invalid). */
export async function updateGame(id: number, game: GameInput): Promise<RawGame> {
  return request<RawGame>(`/api/games/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
}

/** Permanently removes game `id`; rejects on 404. */
export async function deleteGame(id: number): Promise<void> {
  await request<void>(`/api/games/${id}`, { method: "DELETE" });
}

