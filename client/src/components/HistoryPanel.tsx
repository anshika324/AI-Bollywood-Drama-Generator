import type { HistoryEntry } from "../types";

interface HistoryPanelProps {
  history: HistoryEntry[];
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  open: boolean;
  onToggle: () => void;
}

export function HistoryPanel({
  history,
  activeId,
  onSelect,
  onRemove,
  onClear,
  open,
  onToggle,
}: HistoryPanelProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-crimson border border-gold/40 px-4 py-2.5 shadow-xl text-gold font-medium text-sm hover:brightness-110 md:bottom-6 md:right-6"
        aria-expanded={open}
      >
        📜 History ({history.length})
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onToggle}
            aria-label="Close history"
          />
          <aside
            className="fixed z-50 bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:left-auto md:w-96 max-h-[70vh] md:max-h-none bg-velvet-light border-t md:border-t-0 md:border-l border-gold/30 shadow-2xl flex flex-col rounded-t-2xl md:rounded-none"
            aria-label="Generation history"
          >
            <div className="flex items-center justify-between p-4 border-b border-gold/20">
              <h2 className="font-display text-lg text-gold">Past Dramas</h2>
              <button
                type="button"
                onClick={onToggle}
                className="text-[#f5e6d3]/60 hover:text-white p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {history.length === 0 ? (
              <p className="p-6 text-sm text-[#f5e6d3]/50 text-center">
                No dramas yet. Generate your first blockbuster!
              </p>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto p-3 space-y-2">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(entry);
                          onToggle();
                        }}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          activeId === entry.id
                            ? "border-gold bg-gold/10"
                            : "border-gold/20 hover:border-gold/40 hover:bg-white/5"
                        }`}
                      >
                        <p className="font-medium text-sm text-gold truncate">
                          {entry.drama.movieTitle}
                        </p>
                        <p className="text-xs text-[#f5e6d3]/50 truncate mt-0.5">
                          {entry.drama.originalSituation}
                        </p>
                        <p className="text-xs text-[#f5e6d3]/40 mt-1">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(entry.id);
                        }}
                        className="text-xs text-red-400/80 hover:text-red-300 mt-1 ml-1"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="p-3 border-t border-gold/20">
                  <button
                    type="button"
                    onClick={onClear}
                    className="w-full text-sm text-red-400/80 hover:text-red-300 py-2"
                  >
                    Clear all history
                  </button>
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </>
  );
}
