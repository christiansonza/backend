import mongoose from "mongoose";

/**
 * MongoDB connection (Mongoose).
 * Set MONGODB_URI in backend/.env, e.g.
 *   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/tictactoe
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and add your MongoDB connection string.");
  }

  mongoose.connection.on("connected", () => console.log(" MongoDB connected"));
  mongoose.connection.on("disconnected", () => console.warn("  MongoDB disconnected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
