import { Router, type Request } from "express";
import { isValidObjectId } from "mongoose";
import { validateGamePayload } from "../lib/validateGame";
import { Game } from "../models/Game";

const router = Router();

/**
 * GET /api/games
 * Match history sorted newest first. Optional ?limit=1..500 (default 100).
 */
router.get("/", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const games = await Game.find().sort({ createdAt: -1 }).limit(limit);
  res.json(games);
});

/** GET /api/games/:id - a single saved game (used for replays / sharing). */
router.get("/:id", async (req: Request<{ id: string }>, res) => {
  if (!isValidObjectId(req.params.id)) return void res.status(400).json({ error: "Invalid game id" });
  const game = await Game.findById(req.params.id);
  if (!game) return void res.status(404).json({ error: "Game not found" });
  res.json(game);
});

/**
 * POST /api/games
 * Save a completed game session (called when the players press "Stop").
 * Body: { player1, player2, roundsPlayed, player1Wins, player2Wins, draws,
 *         vsComputer?, difficulty?, startedAt?, rounds?: [{ moves: number[] }] }
 */
router.post("/", async (req, res) => {
  const result = validateGamePayload(req.body);
  if (!result.ok) return void res.status(result.status).json({ error: result.error });
  const game = await Game.create(result.value);
  res.status(201).json(game);
});

export default router;
