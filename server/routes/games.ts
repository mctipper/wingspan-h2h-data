import { Router, type Response } from "express";
import { readGames, writeGames } from "../lib/gamesFile.js";
import { validateGameInput, type ValidationError } from "../../src/validation/gameValidator.js";
import type { RawGame } from "../../src/types/raw.js";

export const gamesRouter = Router();

/**
 * Sends a 400 with both a human-readable summary (consumed by the admin
 * client's toast) and the structured errors (for field-level display).
 */
function sendValidationErrors(res: Response, errors: ValidationError[]): void {
  res.status(400).json({ error: errors.map((e) => e.message).join("; "), errors });
}

// GET /api/games — full game list
gamesRouter.get("/", async (_req, res) => {
  try {
    const games = await readGames();
    res.json(games);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/games — add new game (game_id assigned by server)
gamesRouter.post("/", async (req, res) => {
  try {
    // Validate before touching disk: rejects are cheap and never read stale state
    const result = validateGameInput(req.body);
    if (!result.valid) {
      sendValidationErrors(res, result.errors);
      return;
    }
    const games = await readGames();
    const nextId = games.length > 0 ? Math.max(...games.map((g) => g.game_id)) + 1 : 1;
    const newGame: RawGame = { game_id: nextId, ...result.game };
    await writeGames([...games, newGame]);
    res.status(201).json(newGame);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// DELETE /api/games/:id — remove a game
gamesRouter.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid game id" });
      return;
    }
    const games = await readGames();
    const idx = games.findIndex((g) => g.game_id === id);
    if (idx === -1) {
      res.status(404).json({ error: `Game ${id} not found` });
      return;
    }
    games.splice(idx, 1);
    await writeGames(games);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// PUT /api/games/:id — update existing game (path id is authoritative; any body game_id is ignored)
gamesRouter.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid game id" });
      return;
    }
    const result = validateGameInput(req.body);
    if (!result.valid) {
      sendValidationErrors(res, result.errors);
      return;
    }
    const games = await readGames();
    const idx = games.findIndex((g) => g.game_id === id);
    if (idx === -1) {
      res.status(404).json({ error: `Game ${id} not found` });
      return;
    }
    const updated: RawGame = { game_id: id, ...result.game };
    games[idx] = updated;
    await writeGames(games);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
