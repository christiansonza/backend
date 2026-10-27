import { evaluateMoves, type Mark, type RoundResult } from "./game";

type Difficulty = "easy" | "medium" | "hard";

export type GameInput = {
  player1: string;
  player2: string;
  roundsPlayed: number;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  vsComputer: boolean;
  difficulty: Difficulty | null;
  startedAt: Date | null;
  rounds: { number: number; starter: Mark; moves: number[]; result: RoundResult; winLine: number[] }[];
};

type Result = { ok: true; value: GameInput } | { ok: false; status: number; error: string };

const MAX_ROUNDS = 500;
const fail = (status: number, error: string): Result => ({ ok: false, status, error });
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_ROUNDS;
const cleanName = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
const isDifficulty = (v: unknown): v is Difficulty => v === "easy" || v === "medium" || v === "hard";

/**
 * Validates the body of POST /api/games.
 * The counters must add up, and if per-round moves are supplied the server replays every
 * round to make sure the reported score is legitimate.
 */
export function validateGamePayload(body: unknown): Result {
  if (!body || typeof body !== "object") return fail(400, "Request body must be a JSON object");
  const b = body as Record<string, unknown>;

  const player1 = cleanName(b.player1);
  const player2 = cleanName(b.player2);
  if (!player1 || !player2) return fail(400, "player1 and player2 are required");
  if (player1.length > 24 || player2.length > 24) return fail(400, "Names must be 24 characters or fewer");
  if (player1.toLowerCase() === player2.toLowerCase()) return fail(400, "Players need different names");

  const { roundsPlayed, player1Wins, player2Wins, draws } = b;
  if (!isCount(roundsPlayed) || !isCount(player1Wins) || !isCount(player2Wins) || !isCount(draws)) {
    return fail(400, "roundsPlayed, player1Wins, player2Wins and draws must be non-negative integers");
  }
  if (roundsPlayed < 1) return fail(400, "A game must have at least one round");
  if (player1Wins + player2Wins + draws !== roundsPlayed) {
    return fail(422, "player1Wins + player2Wins + draws must equal roundsPlayed");
  }

  const vsComputer = b.vsComputer === true;
  const difficulty = vsComputer ? (isDifficulty(b.difficulty) ? b.difficulty : "hard") : null;

  let startedAt: Date | null = null;
  if (typeof b.startedAt === "string") {
    const d = new Date(b.startedAt);
    if (!Number.isNaN(d.getTime()) && d.getTime() <= Date.now() + 60_000) startedAt = d;
  }

  const rounds: GameInput["rounds"] = [];
  if (b.rounds !== undefined) {
    if (!Array.isArray(b.rounds) || b.rounds.length !== roundsPlayed) {
      return fail(422, "rounds must contain exactly one entry per round played");
    }
    const tally = { X: 0, O: 0, draw: 0 };
    for (let i = 0; i < b.rounds.length; i++) {
      // Player 1 is X, Player 2 is O, and the opening move alternates every round.
      const starter: Mark = i % 2 === 0 ? "X" : "O";
      const round = b.rounds[i] as { moves?: unknown } | null;
      const evaluation = evaluateMoves(round?.moves, starter);
      if (!evaluation.ok) return fail(422, `Round ${i + 1}: ${evaluation.error}`);
      tally[evaluation.result]++;
      rounds.push({
        number: i + 1,
        starter,
        moves: evaluation.moves,
        result: evaluation.result,
        winLine: evaluation.line,
      });
    }
    if (tally.X !== player1Wins || tally.O !== player2Wins || tally.draw !== draws) {
      return fail(422, "Reported scores don't match the recorded rounds");
    }
  }

  return {
    ok: true,
    value: { player1, player2, roundsPlayed, player1Wins, player2Wins, draws, vsComputer, difficulty, startedAt, rounds },
  };
}
