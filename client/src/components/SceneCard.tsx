import type { Scene } from "../types";

interface SceneCardProps {
  scene: Scene;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function SceneCard({ scene, onRegenerate, regenerating }: SceneCardProps) {
  return (
    <article
      id={`scene-${scene.sceneIndex}`}
      className="rounded-xl border border-gold/25 bg-gradient-to-br from-velvet-light/90 to-velvet/90 overflow-hidden animate-fade-up scroll-mt-24"
    >
      <header className="bg-crimson/40 border-b border-gold/20 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-9 h-9 rounded-full bg-gold text-velvet font-bold flex items-center justify-center text-sm">
            {scene.sceneIndex}
          </span>
          <h4 className="font-display text-lg text-gold truncate">
            {scene.title}
          </h4>
        </div>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="text-xs rounded-lg border border-gold/30 px-2.5 py-1 hover:bg-gold/10 disabled:opacity-50 shrink-0"
          >
            {regenerating ? "Reshooting..." : "↻ Reshoot scene"}
          </button>
        )}
      </header>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold/70 mb-1">
            Scene description
          </p>
          <p className="text-sm leading-relaxed text-[#f5e6d3]/90 italic">
            {scene.description}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-gold/70 mb-2">
            Dialogue
          </p>
          <ul className="space-y-3">
            {scene.dialogue.map((d, i) => (
              <li
                key={`${d.character}-${i}`}
                className="rounded-lg bg-black/20 px-3 py-2 border-l-2 border-gold/50"
              >
                <p className="font-semibold text-gold text-sm">{d.character}</p>
                {d.stageDirection && (
                  <p className="text-xs text-[#f5e6d3]/50 mb-0.5">
                    ({d.stageDirection})
                  </p>
                )}
                <p className="text-sm text-[#f5e6d3]">&ldquo;{d.line}&rdquo;</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
