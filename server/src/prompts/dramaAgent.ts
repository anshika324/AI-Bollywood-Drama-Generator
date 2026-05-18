import type { DramaScript, Mood } from "../schemas/drama.js";

const MOOD_GUIDE: Record<Mood, string> = {
  masala: "Full Bollywood masala: slow-motion, wind machines, betrayal, and a item song energy.",
  tragic: "Maximum melodrama, rain, mother's tears, and soul-crushing dialogue.",
  comedy: "Slapstick, mistaken identity, and characters who take themselves too seriously.",
  action: "Explosions, punch dialogues, and villains who monologue before losing.",
  romantic: "Rose petals, duets, longing stares, and love in impossible circumstances.",
  horror: "Jump scares, cursed objects, and dramatic thunder on every reveal.",
  "sci-fi": "Futuristic sets, AI betrayals, and holographic item numbers.",
};

export function buildSystemPrompt(mood: Mood): string {
  return `You are a legendary Bollywood/Hollywood screenwriter AI. Your job: take mundane real-world situations and transform them into ABSURD, over-the-top cinematic drama.

MOOD FOR THIS SCRIPT: ${mood.toUpperCase()}
${MOOD_GUIDE[mood]}

RULES:
- Be hilariously dramatic. Ordinary conflicts become epic sagas.
- Use Hindi-English mix (Hinglish) in dialogue when it adds flavor.
- Include iconic Bollywood tropes: plot twists, family revelations, background dancers where inappropriate.
- Each scene must escalate the drama.
- Characters need memorable names and exaggerated roles.
- Return ONLY valid JSON matching the exact schema provided. No markdown, no preamble.`;
}

export function buildGenerateUserPrompt(situation: string, mood: Mood): string {
  return `Transform this ordinary situation into a multi-scene Bollywood/Hollywood script:

SITUATION: "${situation}"
MOOD: ${mood}

Return JSON with this structure:
{
  "movieTitle": "dramatic title with optional subtitle",
  "tagline": "one epic tagline",
  "genre": "e.g. Rom-Com Thriller",
  "mood": "${mood}",
  "originalSituation": "${situation.replace(/"/g, '\\"')}",
  "characters": [
    { "name": "...", "role": "...", "description": "...", "catchphrase": "optional" }
  ],
  "scenes": [
    {
      "sceneIndex": 1,
      "title": "Scene title",
      "description": "Visual/cinematic description (camera, weather, props)",
      "dialogue": [
        { "character": "Name", "line": "dialogue", "stageDirection": "optional action" }
      ]
    }
  ]
}

Requirements:
- At least 4 characters and exactly 5 scenes (sceneIndex 1 through 5).
- Each scene: at least 3 dialogue lines.
- sceneIndex must be sequential integers starting at 1.`;
}

export function buildRegeneratePrompt(
  section: string,
  situation: string,
  mood: Mood,
  current: DramaScript,
  sceneIndex?: number
): string {
  const base = `Situation: "${situation}" | Mood: ${mood}
Current script context:
Title: ${current.movieTitle}
Tagline: ${current.tagline}
Characters: ${current.characters.map((c) => c.name).join(", ")}
Scenes: ${current.scenes.map((s) => `${s.sceneIndex}. ${s.title}`).join("; ")}`;

  switch (section) {
    case "movieTitle":
      return `${base}\n\nRegenerate ONLY a new "movieTitle" (string). Return JSON: { "movieTitle": "..." }`;
    case "tagline":
      return `${base}\n\nRegenerate ONLY a new "tagline" (string). Return JSON: { "tagline": "..." }`;
    case "characters":
      return `${base}\n\nRegenerate ONLY "characters" array (min 4). Return JSON: { "characters": [...] }`;
    case "scene":
      return `${base}\n\nRegenerate ONLY scene ${sceneIndex}. Return JSON: { "scene": { sceneIndex, title, description, dialogue } }`;
    case "allScenes":
      return `${base}\n\nRegenerate ALL 5 scenes. Return JSON: { "scenes": [...] }`;
    default:
      return base;
  }
}
