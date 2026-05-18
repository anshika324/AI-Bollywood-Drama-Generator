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
  res.json({
    ok: true,
    model: getActiveModel(),
    modelsToTry: getModelsToTry(),
    hasApiKey: Boolean(
      process.env.OPENROUTER_API_KEY?.trim() &&
        !process.env.OPENROUTER_API_KEY.includes("your-key-here")
    ),
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

app.listen(PORT, () => {
  console.log(`🎬 Drama server running at http://localhost:${PORT}`);
});
