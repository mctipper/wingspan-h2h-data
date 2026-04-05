import { Router } from "express";
import { readGames, writeGames } from "../lib/gamesFile.js";
import { parseGame } from "../../src/data/parser.js";
import type { RawGame } from "../../src/types/raw.js";

export const gamesRouter = Router();

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
    const games = await readGames();
    const nextId = games.length > 0 ? Math.max(...games.map((g) => g.game_id)) + 1 : 1;
    const newGame: RawGame = { ...req.body, game_id: nextId };
    try {
      parseGame(newGame);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
      return;
    }
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

// PUT /api/games/:id — update existing game
gamesRouter.put("/:id", async (req, res) => {
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
    const updated: RawGame = { ...req.body, game_id: id };
    try {
      parseGame(updated);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
      return;
    }
    games[idx] = updated;
    await writeGames(games);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
