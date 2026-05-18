import { MOODS, type Mood } from "../types";

const EXAMPLES = [
  "Two founders fighting over putting sugar in coffee",
  "Claude Mythos (robot form) entering an AI conference to fight Sam Altman and Elon Musk",
  "Roommate ate the last samosa without asking",
];

interface SituationFormProps {
  situation: string;
  mood: Mood;
  loading: boolean;
  onSituationChange: (v: string) => void;
  onMoodChange: (m: Mood) => void;
  onSubmit: () => void;
}

export function SituationForm({
  situation,
  mood,
  loading,
  onSituationChange,
  onMoodChange,
  onSubmit,
}: SituationFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="situation"
          className="block text-sm font-medium text-gold mb-1.5"
        >
          Your ordinary situation
        </label>
        <textarea
          id="situation"
          value={situation}
          onChange={(e) => onSituationChange(e.target.value)}
          placeholder="Describe something hilariously mundane..."
          rows={4}
          maxLength={2000}
          disabled={loading}
          className="w-full rounded-xl border border-gold/30 bg-velvet-light/80 px-4 py-3 text-[#f5e6d3] placeholder:text-[#f5e6d3]/40 focus:outline-none focus:ring-2 focus:ring-gold/50 resize-y min-h-[100px] disabled:opacity-60"
        />
        <p className="text-xs text-[#f5e6d3]/50 mt-1 text-right">
          {situation.length}/2000
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="mood"
            className="block text-sm font-medium text-gold mb-1.5"
          >
            Scene mood
          </label>
          <select
            id="mood"
            value={mood}
            onChange={(e) => onMoodChange(e.target.value as Mood)}
            disabled={loading}
            className="w-full rounded-xl border border-gold/30 bg-velvet-light/80 px-4 py-2.5 capitalize focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-60"
          >
            {MOODS.map((m) => (
              <option key={m} value={m} className="capitalize bg-velvet">
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || situation.trim().length < 3}
            className="w-full rounded-xl bg-gradient-to-r from-crimson to-crimson-dark border border-gold/40 px-6 py-3 font-semibold text-gold shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <span className="inline-block w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full spin-slow" />
                Rolling cameras...
              </span>
            ) : (
              "🎬 Action! Generate Drama"
            )}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs text-[#f5e6d3]/50 mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => onSituationChange(ex)}
              className="text-xs rounded-full border border-gold/20 px-3 py-1.5 hover:border-gold/50 hover:bg-gold/10 transition-colors disabled:opacity-50 text-left"
            >
              {ex.length > 55 ? `${ex.slice(0, 55)}…` : ex}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
