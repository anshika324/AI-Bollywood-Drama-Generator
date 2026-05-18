import type { DramaScript } from "../types";
import { DramaOutput } from "./DramaOutput";

interface ShareViewProps {
  drama: DramaScript;
  onBack: () => void;
}

export function ShareView({ drama, onBack }: ShareViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gold">
          🎞️ You&apos;re viewing a shared drama card
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm rounded-lg border border-gold/40 px-4 py-1.5 hover:bg-gold/10"
        >
          Create your own drama
        </button>
      </div>
      <DramaOutput
        drama={drama}
        regeneratingSection={null}
        regeneratingSceneIndex={null}
        onRegenerate={() => {}}
        readOnly
      />
    </div>
  );
}
