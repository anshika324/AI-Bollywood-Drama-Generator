import type { DramaScript, Mood, RegenerateSection, ApiError } from "./types";


const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError;
    return body.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function generateDrama(
  situation: string,
  mood: Mood
): Promise<DramaScript> {
  const res = await fetch(`${API_BASE}/api/drama/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ situation, mood }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const json = (await res.json()) as { data: DramaScript };
  return json.data;
}

export async function regenerateSection(
  section: RegenerateSection,
  situation: string,
  mood: Mood,
  currentDrama: DramaScript,
  sceneIndex?: number
): Promise<DramaScript> {
  const res = await fetch(`${API_BASE}/api/drama/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      section,
      situation,
      mood,
      currentDrama,
      sceneIndex,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const json = (await res.json()) as { data: DramaScript };
  return json.data;
}

export async function checkHealth(): Promise<{
  ok: boolean;
  hasApiKey: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) return { ok: false, hasApiKey: false };
  return res.json();
}
