interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/50 bg-red-950/60 px-4 py-3 text-red-100 flex items-start gap-3 animate-fade-up"
    >
      <span className="text-xl shrink-0" aria-hidden>
        ⚠️
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Drama interrupted!</p>
        <p className="text-sm mt-0.5 opacity-90 break-words">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-red-200 hover:text-white text-sm underline"
          aria-label="Dismiss error"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
