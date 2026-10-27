import { Schema, model, type InferSchemaType } from "mongoose";

/** One finished round (optional detail used for replays + server-side verification). */
const roundSchema = new Schema(
  {
    number: { type: Number, required: true },
    starter: { type: String, enum: ["X", "O"], required: true },
    moves: { type: [Number], required: true },
    result: { type: String, enum: ["X", "O", "draw"], required: true },
    winLine: { type: [Number], default: [] },
  },
  { _id: false },
);

/**
 * A completed game session.
 * Core fields: player1, player2, roundsPlayed, player1Wins, player2Wins, draws, createdAt.
 * (Player 1 losses = player2Wins, Player 2 losses = player1Wins.)
 */
const gameSchema = new Schema(
  {
    player1: { type: String, required: true, trim: true, maxlength: 24 },
    player2: { type: String, required: true, trim: true, maxlength: 24 },
    roundsPlayed: { type: Number, required: true, min: 1 },
    player1Wins: { type: Number, required: true, min: 0, default: 0 },
    player2Wins: { type: Number, required: true, min: 0, default: 0 },
    draws: { type: Number, required: true, min: 0, default: 0 },

    // Extras
    vsComputer: { type: Boolean, default: false },
    difficulty: { type: String, enum: ["easy", "medium", "hard", null], default: null },
    rounds: { type: [roundSchema], default: [] },
    startedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

gameSchema.index({ createdAt: -1 });

export type GameDoc = InferSchemaType<typeof gameSchema>;
export const Game = model("Game", gameSchema);
