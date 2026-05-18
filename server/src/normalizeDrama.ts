/** Coerce common LLM JSON mistakes before Zod validation. */
export function normalizeDramaPayload(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return normalizeDramaPayload(JSON.parse(raw));
    } catch {
      return raw;
    }
  }
  if (!raw || typeof raw !== "object") return raw;

  const o = { ...(raw as Record<string, unknown>) };

  o.characters = coerceArray(o.characters);
  o.scenes = coerceArray(o.scenes)?.map(normalizeScene);

  return o;
}

function coerceArray(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function normalizeScene(scene: unknown): unknown {
  if (!scene || typeof scene !== "object") return scene;
  const s = { ...(scene as Record<string, unknown>) };

  if (typeof s.sceneIndex === "string") {
    s.sceneIndex = parseInt(s.sceneIndex, 10);
  }

  if (typeof s.dialogue === "string") {
    try {
      s.dialogue = JSON.parse(s.dialogue);
    } catch {
      s.dialogue = [{ character: "Narrator", line: s.dialogue }];
    }
  }

  if (Array.isArray(s.dialogue)) {
    s.dialogue = s.dialogue.map((line) => {
      if (typeof line === "string") {
        return { character: "Unknown", line };
      }
      if (line && typeof line === "object") {
        const d = line as Record<string, unknown>;
        return {
          character: String(d.character ?? d.name ?? "Unknown"),
          line: String(d.line ?? d.text ?? d.dialogue ?? ""),
          ...(d.stageDirection ? { stageDirection: String(d.stageDirection) } : {}),
        };
      }
      return line;
    });
  }

  return s;
}
