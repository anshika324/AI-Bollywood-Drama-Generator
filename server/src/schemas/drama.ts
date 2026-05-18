import { z } from "zod";

export const MOODS = [
  "masala",
  "tragic",
  "comedy",
  "action",
  "romantic",
  "horror",
  "sci-fi",
] as const;

export type Mood = (typeof MOODS)[number];

export const SceneSchema = z.object({
  sceneIndex: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  dialogue: z.array(
    z.object({
      character: z.string().min(1),
      line: z.string().min(1),
      stageDirection: z.string().optional(),
    })
  ),
});

export const CharacterSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  catchphrase: z.string().optional(),
});

export const DramaScriptSchema = z.object({
  movieTitle: z.string().min(1),
  tagline: z.string().min(1),
  genre: z.string().min(1),
  mood: z.enum(MOODS),
  originalSituation: z.string().min(1),
  characters: z.array(CharacterSchema).min(2),
  scenes: z.array(SceneSchema).min(3),
});

export type DramaScript = z.infer<typeof DramaScriptSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Character = z.infer<typeof CharacterSchema>;

export const GenerateRequestSchema = z.object({
  situation: z.string().min(3).max(2000),
  mood: z.enum(MOODS).default("masala"),
});

export const RegenerateSectionSchema = z.object({
  section: z.enum([
    "movieTitle",
    "tagline",
    "characters",
    "scene",
    "allScenes",
  ]),
  situation: z.string().min(3),
  mood: z.enum(MOODS),
  currentDrama: DramaScriptSchema,
  sceneIndex: z.number().int().positive().optional(),
});

export type RegenerateRequest = z.infer<typeof RegenerateSectionSchema>;
