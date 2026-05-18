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
import { normalizeDramaPayload } from "../normalizeDrama.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 120_000;

/** Most reliable first — OpenRouter picks an available free model. */
const FALLBACK_MODELS = [
  "deepseek/deepseek-v4-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openrouter/free",
] as const;

/** Invalid / deprecated IDs that appear in old .env files. */
const BLOCKED_MODELS = new Set([
  "deepseek/deepseek-chat:free",
  "google/gemma-3-27b-it:free",
]);

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

  if (preferred && !BLOCKED_MODELS.has(preferred)) {
    list.push(preferred);
  } else if (preferred && BLOCKED_MODELS.has(preferred)) {
    console.warn(
      `[llm] Ignoring blocked OPENROUTER_MODEL="${preferred}" — update .env`
    );
  }

  // One backup only — saves free-tier quota per click
  const backup = "nvidia/nemotron-3-super-120b-a12b:free";
  if (!list.includes(backup)) list.push(backup);

  if (list.length === 0) return [...FALLBACK_MODELS];
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
  const jsonSlice = extractJsonObject(candidate);
  if (!jsonSlice) {
    throw new LlmError("Model did not return valid JSON.", 502, "PARSE_ERROR");
  }
  try {
    return JSON.parse(jsonSlice);
  } catch {
    const repaired = jsonSlice
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    try {
      return JSON.parse(repaired);
    } catch {
      throw new LlmError("Failed to parse model JSON response.", 502, "PARSE_ERROR");
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableModelError(status: number, body: string): boolean {
  const b = body.toLowerCase();
  if (status === 429 || b.includes("rate limit")) return true;
  if (status === 408 || b.includes("timeout") || b.includes("abort")) return true;
  if (status === 404) {
    return (
      b.includes("no endpoints") ||
      b.includes("not found") ||
      b.includes("guardrail") ||
      b.includes("data policy")
    );
  }
  if (status === 502 || status === 503) {
    return (
      b.includes("empty") ||
      b.includes("provider") ||
      b.includes("temporarily") ||
      b.includes("overloaded")
    );
  }
  return false;
}

type ContentPart = { type?: string; text?: string };
type OpenRouterMessage = {
  content?: string | ContentPart[] | null;
  reasoning?: string | null;
  refusal?: string | null;
};

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function extractMessageContent(message: OpenRouterMessage | undefined): string | null {
  if (!message) return null;

  if (typeof message.content === "string" && message.content.trim()) {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    const text = message.content
      .map((p) => (typeof p === "string" ? p : p.text ?? ""))
      .join("");
    if (text.trim()) return text;
  }

  if (typeof message.reasoning === "string" && message.reasoning.trim()) {
    const fromReasoning = extractJsonObject(message.reasoning);
    if (fromReasoning) return fromReasoning;
  }

  return null;
}

async function chatWithModel(
  model: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<{ ok: true; content: string } | { ok: false; status: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
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
        temperature: 0.85,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      return { ok: false, status: response.status, body };
    }

    let data: {
      choices?: { message?: OpenRouterMessage; finish_reason?: string }[];
      error?: { message?: string };
    };
    try {
      data = JSON.parse(body) as typeof data;
    } catch {
      return { ok: false, status: 502, body: "Invalid JSON from OpenRouter" };
    }

    if (data.error?.message) {
      return { ok: false, status: 502, body: data.error.message };
    }

    const content = extractMessageContent(data.choices?.[0]?.message);
    if (!content) {
      const reason = data.choices?.[0]?.finish_reason ?? "unknown";
      return {
        ok: false,
        status: 502,
        body: `Empty response (finish_reason=${reason})`,
      };
    }

    return { ok: true, content };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, status: 408, body: "Request timeout" };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function chat(
  system: string,
  user: string,
  maxTokens = 4096
): Promise<string> {
  const models = getModelsToTry();
  const failures: string[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const result = await chatWithModel(model, system, user, maxTokens);

    if (result.ok) {
      lastSuccessfulModel = model;
      console.log(`[llm] success with ${model}`);
      return result.content;
    }

    failures.push(`${model} (${result.status}: ${result.body.slice(0, 80)})`);
    console.warn(`[llm] failed ${model}:`, result.status, result.body.slice(0, 120));

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

    if (i < models.length - 1) await sleep(1200);
  }

  const allRateLimited = failures.every((f) => f.includes("429") || f.includes("Rate limit"));
  if (allRateLimited) {
    throw new LlmError(
      "OpenRouter free daily limit reached on this key. If you just changed .env, run: npm run kill-ports && npm run dev. Otherwise wait until tomorrow (UTC), add credits at https://openrouter.ai/credits, or use a new account key.",
      429,
      "RATE_LIMIT"
    );
  }

  throw new LlmError(
    `All models failed. Open https://openrouter.ai/settings/privacy and allow free providers. Details: ${failures.slice(0, 3).join(" | ")}`,
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
    let raw: string;
    try {
      raw = await chat(
        buildSystemPrompt(mood),
        buildGenerateUserPrompt(situation, mood),
        4096
      );
    } catch (err) {
      if (err instanceof LlmError && err.code === "PARSE_ERROR") continue;
      throw err;
    }

    let parsed: unknown;
    try {
      parsed = extractJson(raw);
    } catch (err) {
      console.warn(`[llm] JSON parse failed (attempt ${attempt + 1}):`, raw.slice(0, 120));
      if (err instanceof LlmError && attempt < 1) continue;
      throw err;
    }

    const normalized = normalizeDramaPayload(parsed);
    const result = DramaScriptSchema.safeParse(normalized);
    if (result.success) return result.data;
    lastValidationError = result.error.issues
      .map((i) => i.message)
      .join("; ");
    console.warn(`[llm] validation failed (attempt ${attempt + 1}):`, lastValidationError);
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
  const raw = await chat(buildSystemPrompt(mood), userPrompt, 2048);
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
