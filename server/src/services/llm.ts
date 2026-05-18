import {
  DramaScriptSchema,
  type DramaScript,
  type Mood,
  SceneSchema,
  CharacterSchema,
} from "../schemas/drama.js";
import {
  buildSystemPrompt,
  buildGenerateUserPrompt,
  buildRegeneratePrompt,
} from "../prompts/dramaAgent.js";
import { z } from "zod";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Free models verified to work without extra OpenRouter privacy settings. */
const FALLBACK_MODELS = [
  "deepseek/deepseek-v4-flash:free",
  "openrouter/free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "google/gemma-4-31b-it:free",
] as const;

let lastSuccessfulModel: string | null = null;

export function getActiveModel(): string {
  return (
    lastSuccessfulModel ??
    process.env.OPENROUTER_MODEL?.trim() ??
    FALLBACK_MODELS[0]
  );
}

export function getModelsToTry(): string[] {
  const preferred = process.env.OPENROUTER_MODEL?.trim();
  const list: string[] = [];
  if (preferred) list.push(preferred);
  for (const m of FALLBACK_MODELS) {
    if (!list.includes(m)) list.push(m);
  }
  return list;
}

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 502,
    public readonly code?: string
  ) {
    super(message);
    this.name = "LlmError";
  }
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key || key.includes("your-key-here")) {
    throw new LlmError(
      "OPENROUTER_API_KEY is missing or invalid. Copy .env.example to .env and add your key.",
      503,
      "MISSING_API_KEY"
    );
  }
  return key;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new LlmError("Model did not return valid JSON.", 502, "PARSE_ERROR");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new LlmError("Failed to parse model JSON response.", 502, "PARSE_ERROR");
  }
}

function isRetryableModelError(status: number, body: string): boolean {
  if (status === 429) return true;
  if (status === 404) {
    return (
      body.includes("No endpoints") ||
      body.includes("not found") ||
      body.includes("guardrail") ||
      body.includes("data policy")
    );
  }
  return false;
}

async function chatWithModel(
  model: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<{ ok: true; content: string } | { ok: false; status: number; body: string }> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Bollywood Drama Generator",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.9,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    return { ok: false, status: response.status, body };
  }

  let data: {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  try {
    data = JSON.parse(body) as typeof data;
  } catch {
    return { ok: false, status: 502, body };
  }

  if (data.error?.message) {
    return { ok: false, status: 502, body: data.error.message };
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, status: 502, body: "Empty response" };
  }

  return { ok: true, content };
}

async function chat(
  system: string,
  user: string,
  maxTokens = 4096
): Promise<string> {
  const models = getModelsToTry();

  for (const model of models) {
    const result = await chatWithModel(model, system, user, maxTokens);

    if (result.ok) {
      lastSuccessfulModel = model;
      return result.content;
    }

    if (!isRetryableModelError(result.status, result.body)) {
      if (result.status === 401) {
        throw new LlmError("Invalid OpenRouter API key.", 401, "AUTH_ERROR");
      }
      throw new LlmError(
        `OpenRouter error (${result.status}): ${result.body.slice(0, 220)}`,
        502,
        "UPSTREAM_ERROR"
      );
    }
  }

  throw new LlmError(
    `All models failed. This is usually OpenRouter account settings — open https://openrouter.ai/settings/privacy and allow free model providers, or set OPENROUTER_MODEL=deepseek/deepseek-v4-flash:free in .env. Tried: ${models.join(", ")}`,
    502,
    "ALL_MODELS_FAILED"
  );
}

export async function generateDrama(
  situation: string,
  mood: Mood
): Promise<DramaScript> {
  let lastValidationError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await chat(
      buildSystemPrompt(mood),
      buildGenerateUserPrompt(situation, mood),
      6000
    );
    const parsed = extractJson(raw);
    const result = DramaScriptSchema.safeParse(parsed);
    if (result.success) return result.data;
    lastValidationError = result.error.issues
      .map((i) => i.message)
      .join("; ");
  }

  throw new LlmError(
    `Invalid drama structure: ${lastValidationError}`,
    502,
    "VALIDATION_ERROR"
  );
}

export async function regenerateSection(
  section: string,
  situation: string,
  mood: Mood,
  current: DramaScript,
  sceneIndex?: number
): Promise<Partial<DramaScript>> {
  const userPrompt = buildRegeneratePrompt(
    section,
    situation,
    mood,
    current,
    sceneIndex
  );
  const raw = await chat(buildSystemPrompt(mood), userPrompt, 3000);
  const parsed = extractJson(raw) as Record<string, unknown>;

  switch (section) {
    case "movieTitle": {
      const v = z.object({ movieTitle: z.string().min(1) }).parse(parsed);
      return { movieTitle: v.movieTitle };
    }
    case "tagline": {
      const v = z.object({ tagline: z.string().min(1) }).parse(parsed);
      return { tagline: v.tagline };
    }
    case "characters": {
      const v = z
        .object({ characters: z.array(CharacterSchema).min(2) })
        .parse(parsed);
      return { characters: v.characters };
    }
    case "scene": {
      const v = z.object({ scene: SceneSchema }).parse(parsed);
      if (sceneIndex && v.scene.sceneIndex !== sceneIndex) {
        v.scene.sceneIndex = sceneIndex;
      }
      const scenes = current.scenes.map((s) =>
        s.sceneIndex === v.scene.sceneIndex ? v.scene : s
      );
      return { scenes };
    }
    case "allScenes": {
      const v = z.object({ scenes: z.array(SceneSchema).min(3) }).parse(parsed);
      return { scenes: v.scenes };
    }
    default:
      throw new LlmError("Unknown regenerate section.", 400, "BAD_REQUEST");
  }
}
