/**
 * The page-level frame for login/signup — printer's registration marks at
 * each corner and a faint ruled-paper ground carry the lab-report world
 * into the viewport itself, not just the card floating on it. Without this
 * the intake card reads as any other centered-card auth screen.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ground px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgb(var(--color-rule) / 0.4) 0, rgb(var(--color-rule) / 0.4) 1px, transparent 1px, transparent 32px)",
        }}
        aria-hidden="true"
      />

      <RegistrationMark className="left-6 top-6" />
      <RegistrationMark className="right-6 top-6" />
      <RegistrationMark className="bottom-6 left-6" />
      <RegistrationMark className="bottom-6 right-6" />

      <span className="pointer-events-none absolute left-5 top-1/2 hidden -translate-y-1/2 -rotate-90 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted/60 sm:block">
        Form GH-01 · Intake
      </span>

      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}

function RegistrationMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute h-5 w-5 text-accent/60 ${className}`}
      aria-hidden="true"
    >
      <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}
