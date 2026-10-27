import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"])
import { connectDB, isDBConnected } from "./config/db";
import gamesRouter from "./routes/games";


const PORT = Number(process.env.PORT) || 4000;
// Comma-separated list of allowed frontend origins, e.g. "http://localhost:3000,https://your-frontend.com"
const CORS_ORIGIN = process.env.CORS_ORIGIN;

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: CORS_ORIGIN ? CORS_ORIGIN.split(",").map((o) => o.trim()) : true }));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.json({ name: "Tic-Tac-Toe API", status: "ok", endpoints: ["GET /api/health", "GET /api/games", "POST /api/games"] });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", db: isDBConnected() ? "connected" : "disconnected" });
});

app.use("/api/games", gamesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Express 5 forwards errors thrown in async handlers here automatically.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError) return void res.status(400).json({ error: "Invalid JSON body" });
  if (err && typeof err === "object" && (err as { name?: string }).name === "ValidationError") {
    return void res.status(400).json({ error: (err as Error).message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function main() {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 API listening on http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error("Failed to start server:", err instanceof Error ? err.message : err);
  process.exit(1);
});
