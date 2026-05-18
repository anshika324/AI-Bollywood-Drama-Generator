import type { Character } from "../types";

interface CharacterCardsProps {
  characters: Character[];
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function CharacterCards({
  characters,
  onRegenerate,
  regenerating,
}: CharacterCardsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-display text-xl text-gold">Cast</h3>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="text-xs rounded-lg border border-gold/30 px-3 py-1 hover:bg-gold/10 disabled:opacity-50"
          >
            {regenerating ? "Recasting..." : "↻ Regenerate cast"}
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {characters.map((c) => (
          <article
            key={c.name}
            className="rounded-xl border border-gold/20 bg-velvet-light/60 p-4 animate-fade-up"
          >
            <div className="flex items-start gap-3">
              <span
                className="w-10 h-10 rounded-full bg-crimson/80 border border-gold/40 flex items-center justify-center text-lg shrink-0"
                aria-hidden
              >
                🎭
              </span>
              <div className="min-w-0">
                <h4 className="font-semibold text-gold truncate">{c.name}</h4>
                <p className="text-xs text-[#e8b4c4] font-medium uppercase tracking-wide">
                  {c.role}
                </p>
              </div>
            </div>
            <p className="text-sm mt-2 text-[#f5e6d3]/80 leading-relaxed">
              {c.description}
            </p>
            {c.catchphrase && (
              <p className="mt-2 text-xs italic border-l-2 border-gold/40 pl-2 text-gold/90">
                &ldquo;{c.catchphrase}&rdquo;
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
