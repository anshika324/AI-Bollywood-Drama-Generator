import { Router, type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import {
  GenerateRequestSchema,
  RegenerateSectionSchema,
} from "../schemas/drama.js";
import { generateDrama, regenerateSection, LlmError } from "../services/llm.js";

export const dramaRouter = Router();

function handleError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.flatten().fieldErrors,
    });
    return;
  }
  if (err instanceof LlmError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code ?? "LLM_ERROR",
    });
    return;
  }
  next(err);
}

dramaRouter.post(
  "/generate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = GenerateRequestSchema.parse(req.body);
      const drama = await generateDrama(body.situation, body.mood);
      res.json({ success: true, data: drama });
    } catch (err) {
      handleError(err, res, next);
    }
  }
);

dramaRouter.post(
  "/regenerate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = RegenerateSectionSchema.parse(req.body);
      if (body.section === "scene" && !body.sceneIndex) {
        res.status(400).json({
          error: "sceneIndex required when regenerating a single scene",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      const patch = await regenerateSection(
        body.section,
        body.situation,
        body.mood,
        body.currentDrama,
        body.sceneIndex
      );
      const updated = { ...body.currentDrama, ...patch };
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(err, res, next);
    }
  }
);
