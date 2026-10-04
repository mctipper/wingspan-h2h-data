import express from "express";
import { gamesRouter } from "@server/routes/games";

const app = express();
app.use(express.json());

app.use("/api/games", gamesRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on :${PORT}`);
});
