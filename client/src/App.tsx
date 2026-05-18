import { useCallback, useEffect, useState, type ReactNode } from "react";
import { generateDrama, regenerateSection, checkHealth } from "./api";
import type { DramaScript, HistoryEntry, Mood, RegenerateSection } from "./types";
import { SituationForm } from "./components/SituationForm";
import { DramaOutput } from "./components/DramaOutput";
import { HistoryPanel } from "./components/HistoryPanel";
import { ErrorBanner } from "./components/ErrorBanner";
import { ShareView } from "./components/ShareView";
import { useHistory } from "./hooks/useHistory";
import { parseShareFromUrl } from "./utils/share";

export default function App() {
  const [situation, setSituation] = useState("");
  const [mood, setMood] = useState<Mood>("masala");
  const [drama, setDrama] = useState<DramaScript | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [sharedDrama, setSharedDrama] = useState<DramaScript | null>(null);
  const [regeneratingSection, setRegeneratingSection] =
    useState<RegenerateSection | null>(null);
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<
    number | null
  >(null);

  const { history, save, update, remove, clear } = useHistory();

  useEffect(() => {
    const shared = parseShareFromUrl();
    if (shared) setSharedDrama(shared);
  }, []);

  useEffect(() => {
    checkHealth()
      .then((h) => setApiReady(h.hasApiKey))
      .catch(() => setApiReady(false));
  }, []);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    setSharedDrama(null);
    window.location.hash = "";
    try {
      const result = await generateDrama(situation.trim(), mood);
      setDrama(result);
      const id = save(result);
      setActiveHistoryId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [situation, mood, save]);

  const handleRegenerate = useCallback(
    async (section: RegenerateSection, sceneIndex?: number) => {
      if (!drama) return;
      setError(null);
      setRegeneratingSection(section);
      setRegeneratingSceneIndex(sceneIndex ?? null);
      try {
        const updated = await regenerateSection(
          section,
          situation.trim() || drama.originalSituation,
          mood,
          drama,
          sceneIndex
        );
        setDrama(updated);
        if (activeHistoryId) update(activeHistoryId, updated);
        else save(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Regeneration failed");
      } finally {
        setRegeneratingSection(null);
        setRegeneratingSceneIndex(null);
      }
    },
    [drama, situation, mood, activeHistoryId, update, save]
  );

  const loadFromHistory = (entry: HistoryEntry) => {
    setDrama(entry.drama);
    setSituation(entry.drama.originalSituation);
    setMood(entry.drama.mood);
    setActiveHistoryId(entry.id);
    setError(null);
    window.location.hash = "";
    setSharedDrama(null);
  };

  if (sharedDrama) {
    return (
      <AppShell apiReady={apiReady}>
        <ShareView
          drama={sharedDrama}
          onBack={() => {
            setSharedDrama(null);
            window.location.hash = "";
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell apiReady={apiReady}>
      <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gold/25 bg-velvet-light/50 p-5 sm:p-6 backdrop-blur-sm">
            <h2 className="font-display text-xl text-gold mb-4">
              Write the situation
            </h2>
            <SituationForm
              situation={situation}
              mood={mood}
              loading={loading || regeneratingSection !== null}
              onSituationChange={setSituation}
              onMoodChange={setMood}
              onSubmit={handleGenerate}
            />
          </div>

          {apiReady === false && (
            <p className="text-sm rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-amber-100">
              ⚙️ Add your OpenRouter API key in <code className="text-gold">.env</code>{" "}
              (see README). Server must be running on port 3001.
            </p>
          )}
        </section>

        <section className="lg:col-span-3 space-y-4 min-w-0">
          {error && (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          )}

          {loading && (
            <div className="rounded-2xl border border-gold/20 bg-velvet-light/30 p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full spin-slow mb-4" />
              <p className="font-display text-xl text-gold">
                The writers&apos; room is screaming...
              </p>
              <p className="text-sm text-[#f5e6d3]/50 mt-2">
                Crafting 5 scenes of pure chaos
              </p>
            </div>
          )}

          {!loading && drama && (
            <DramaOutput
              drama={drama}
              regeneratingSection={regeneratingSection}
              regeneratingSceneIndex={regeneratingSceneIndex}
              onRegenerate={handleRegenerate}
            />
          )}

          {!loading && !drama && (
            <div className="rounded-2xl border border-dashed border-gold/20 p-12 text-center text-[#f5e6d3]/40">
              <p className="text-5xl mb-4" aria-hidden>
                🎥
              </p>
              <p className="font-display text-xl text-[#f5e6d3]/60">
                Your blockbuster appears here
              </p>
              <p className="text-sm mt-2 max-w-sm mx-auto">
                Enter a boring real-world moment. We&apos;ll add rain, betrayal,
                and a unnecessary item number.
              </p>
            </div>
          )}
        </section>
      </div>

      <HistoryPanel
        history={history}
        activeId={activeHistoryId}
        onSelect={loadFromHistory}
        onRemove={remove}
        onClear={clear}
        open={historyOpen}
        onToggle={() => setHistoryOpen((o) => !o)}
      />
    </AppShell>
  );
}

function AppShell({
  children,
  apiReady,
}: {
  children: ReactNode;
  apiReady: boolean | null;
}) {
  return (
    <div className="min-h-dvh relative overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        aria-hidden
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-crimson/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gold/10 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-gold/20 bg-velvet/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl shimmer-text">
              Bollywood Drama Generator
            </h1>
            <p className="text-xs sm:text-sm text-[#f5e6d3]/60 mt-0.5">
              Turn ordinary situations into absurd Bollywood-level drama 😂
            </p>
          </div>
          {apiReady === true && (
            <span className="text-xs rounded-full border border-emerald-500/40 bg-emerald-950/50 text-emerald-200 px-3 py-1 shrink-0">
              AI ready
            </span>
          )}
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {children}
      </main>

      <footer className="relative border-t border-gold/10 py-6 text-center text-xs text-[#f5e6d3]/30">
        Built for DeepShorts assignment · Powered by OpenRouter
      </footer>
    </div>
  );
}
