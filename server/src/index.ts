import { loadEnv } from "./loadEnv.js";
loadEnv();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dramaRouter } from "./routes/drama.js";
import { getActiveModel, getModelsToTry } from "./services/llm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 3001;

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      process.env.CLIENT_ORIGIN,
    ].filter(Boolean) as string[],
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  const key = process.env.OPENROUTER_API_KEY?.trim() ?? "";
  res.json({
    ok: true,
    model: getActiveModel(),
    modelsToTry: getModelsToTry(),
    hasApiKey: Boolean(key && !key.includes("your-key-here")),
    keyHint: key ? `${key.slice(0, 10)}…${key.slice(-4)}` : null,
    port: PORT,
    hint:
      "Dev UI: http://localhost:5173 (Vite). API: http://localhost:" +
      PORT +
      ". Prod: npm run build && npm start",
  });
});

app.use("/api/drama", dramaRouter);

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
);

const server = app.listen(PORT, () => {
  console.log(`🎬 Drama server running at http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n❌ Port ${PORT} is in use. Run: npm run kill-ports\n   Then: npm run dev\n`
    );
    process.exit(1);
  }
  throw err;
});
