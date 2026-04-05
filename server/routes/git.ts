import { Router } from "express";
import { gitPush } from "../lib/gitOps.js";

export const gitRouter = Router();

// POST /api/git/push — commit and push games.json to git remote
gitRouter.post("/push", async (req, res) => {
  const message =
    (req.body?.message as string | undefined) ??
    `Add game data ${new Date().toISOString()}`;
  try {
    await gitPush(message);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
