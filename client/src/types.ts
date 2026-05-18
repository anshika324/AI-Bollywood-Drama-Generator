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

export interface DialogueLine {
  character: string;
  line: string;
  stageDirection?: string;
}

export interface Scene {
  sceneIndex: number;
  title: string;
  description: string;
  dialogue: DialogueLine[];
}

export interface Character {
  name: string;
  role: string;
  description: string;
  catchphrase?: string;
}

export interface DramaScript {
  movieTitle: string;
  tagline: string;
  genre: string;
  mood: Mood;
  originalSituation: string;
  characters: Character[];
  scenes: Scene[];
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  drama: DramaScript;
}

export type RegenerateSection =
  | "movieTitle"
  | "tagline"
  | "characters"
  | "scene"
  | "allScenes";

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}
