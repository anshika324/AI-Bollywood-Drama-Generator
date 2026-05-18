import type { DramaScript, RegenerateSection } from "../types";
import { CharacterCards } from "./CharacterCards";
import { SceneCard } from "./SceneCard";
import { buildShareUrl } from "../utils/share";
import { useState } from "react";

interface DramaOutputProps {
  drama: DramaScript;
  regeneratingSection: RegenerateSection | null;
  regeneratingSceneIndex: number | null;
  onRegenerate: (section: RegenerateSection, sceneIndex?: number) => void;
  readOnly?: boolean;
}

export function DramaOutput({
  drama,
  regeneratingSection,
  regeneratingSceneIndex,
  onRegenerate,
  readOnly = false,
}: DramaOutputProps) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const copyScript = async () => {
    const text = formatScriptAsText(drama);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = async () => {
    const url = buildShareUrl(drama);
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <header className="text-center space-y-3 pb-6 border-b border-gold/20">
        <p className="text-xs uppercase tracking-[0.2em] text-gold/70">
          {drama.genre} · {drama.mood}
        </p>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl shimmer-text leading-tight px-2">
          {drama.movieTitle}
        </h2>
        <p className="text-lg italic text-[#f5e6d3]/80 max-w-2xl mx-auto">
          &ldquo;{drama.tagline}&rdquo;
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => onRegenerate("movieTitle")}
                disabled={regeneratingSection === "movieTitle"}
                className="text-xs rounded-lg border border-gold/30 px-3 py-1 hover:bg-gold/10 disabled:opacity-50"
              >
                {regeneratingSection === "movieTitle" ? "…" : "↻ New title"}
              </button>
              <button
                type="button"
                onClick={() => onRegenerate("tagline")}
                disabled={regeneratingSection === "tagline"}
                className="text-xs rounded-lg border border-gold/30 px-3 py-1 hover:bg-gold/10 disabled:opacity-50"
              >
                {regeneratingSection === "tagline" ? "…" : "↻ New tagline"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={copyScript}
            className="text-xs rounded-lg border border-gold/30 px-3 py-1 hover:bg-gold/10"
          >
            {copied ? "✓ Copied!" : "📋 Copy script"}
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            className="text-xs rounded-lg border border-gold/30 px-3 py-1 hover:bg-gold/10 bg-gold/5"
          >
            {shareCopied ? "✓ Link copied!" : "🔗 Share drama card"}
          </button>
        </div>
        <p className="text-xs text-[#f5e6d3]/40 max-w-md mx-auto">
          Share link encodes your drama in the URL — anyone with the link can view it.
        </p>
      </header>

      <blockquote className="rounded-xl border border-gold/15 bg-black/20 px-4 py-3 text-sm text-[#f5e6d3]/70">
        <span className="text-gold font-medium">Original situation:</span>{" "}
        {drama.originalSituation}
      </blockquote>

      <CharacterCards
        characters={drama.characters}
        onRegenerate={readOnly ? undefined : () => onRegenerate("characters")}
        regenerating={regeneratingSection === "characters"}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-display text-xl text-gold">Scenes</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={() => onRegenerate("allScenes")}
              disabled={regeneratingSection === "allScenes"}
              className="text-xs rounded-lg border border-gold/30 px-3 py-1 hover:bg-gold/10 disabled:opacity-50"
            >
              {regeneratingSection === "allScenes"
                ? "Rewriting all scenes..."
                : "↻ Regenerate all scenes"}
            </button>
          )}
        </div>
        <div className="space-y-4">
          {drama.scenes
            .slice()
            .sort((a, b) => a.sceneIndex - b.sceneIndex)
            .map((scene) => (
              <SceneCard
                key={scene.sceneIndex}
                scene={scene}
                onRegenerate={
                  readOnly
                    ? undefined
                    : () => onRegenerate("scene", scene.sceneIndex)
                }
                regenerating={
                  regeneratingSection === "scene" &&
                  regeneratingSceneIndex === scene.sceneIndex
                }
              />
            ))}
        </div>
      </section>
    </div>
  );
}

function formatScriptAsText(drama: DramaScript): string {
  const lines: string[] = [
    `🎬 ${drama.movieTitle}`,
    `"${drama.tagline}"`,
    `Genre: ${drama.genre} | Mood: ${drama.mood}`,
    "",
    "--- CAST ---",
    ...drama.characters.map(
      (c) => `${c.name} (${c.role}): ${c.description}`
    ),
    "",
  ];
  for (const scene of drama.scenes.sort(
    (a, b) => a.sceneIndex - b.sceneIndex
  )) {
    lines.push(`--- SCENE ${scene.sceneIndex}: ${scene.title} ---`);
    lines.push(scene.description);
    lines.push("");
    for (const d of scene.dialogue) {
      const dir = d.stageDirection ? ` [${d.stageDirection}]` : "";
      lines.push(`${d.character}${dir}: "${d.line}"`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
