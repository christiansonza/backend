export type Mark = "X" | "O";
export type RoundResult = Mark | "draw";
type Cell = Mark | null;

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const other = (m: Mark): Mark => (m === "X" ? "O" : "X");

function getOutcome(board: Cell[]): { result: RoundResult; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { result: board[a] as Mark, line };
    }
  }
  if (board.every(Boolean)) return { result: "draw", line: [] };
  return null;
}

/**
 * Replays a full list of moves (cell indexes 0-8) and returns the outcome.
 * The server never trusts the client's claimed winner - it re-computes it here.
 */
export function evaluateMoves(
  moves: unknown,
  starter: Mark,
): { ok: true; moves: number[]; result: RoundResult; line: number[] } | { ok: false; error: string } {
  if (!Array.isArray(moves) || moves.length < 5 || moves.length > 9) {
    return { ok: false, error: "Invalid move list" };
  }
  const board: Cell[] = Array(9).fill(null);
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (!Number.isInteger(m) || m < 0 || m > 8 || board[m] !== null) {
      return { ok: false, error: "Illegal move detected" };
    }
    if (getOutcome(board)) return { ok: false, error: "Moves continue after the round ended" };
    board[m] = i % 2 === 0 ? starter : other(starter);
  }
  const outcome = getOutcome(board);
  if (!outcome) return { ok: false, error: "Round is not finished" };
  return { ok: true, moves: moves as number[], ...outcome };
}
