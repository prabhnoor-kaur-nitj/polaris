import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/* ---------- re-render ticker ---------- */

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

/* ---------- flat instrument panel ---------- */

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("fm-panel flex flex-col", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-[var(--fm-line-soft)] px-4 py-2.5">
        <h2 className="fm-mono text-[10.5px] font-semibold tracking-[0.22em] text-[var(--fm-ink)] uppercase">
          {title}
        </h2>
        <div className="flex items-center gap-2">{actions}</div>
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------- status chip ---------- */

type Tone = "ice" | "alert" | "sync" | "warn" | "muted";

const toneClass: Record<Tone, string> = {
  ice: "fm-chip-ok",
  sync: "fm-chip-good",
  warn: "fm-chip-warn",
  alert: "fm-chip-alert",
  muted: "",
};

export function StatusBadge({
  tone,
  children,
  className,
  pulse = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span className={cn("fm-chip", toneClass[tone], pulse && "fm-blink", className)}>
      {children}
    </span>
  );
}

/* ---------- horizontal meter ---------- */

export function Meter({
  label,
  value,
  max = 100,
  unit = "%",
  tone,
  dense = false,
}: {
  label?: string;
  value: number;
  max?: number;
  unit?: string;
  tone?: "ice" | "alert" | "warn" | "sync";
  dense?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const auto = pct <= 15 ? "alert" : pct <= 40 ? "warn" : undefined;
  const t = tone ?? auto;
  const fillClass =
    t === "alert" ? "tone-alert" : t === "warn" ? "tone-warn" : t === "sync" ? "tone-good" : undefined;
  const valueColor =
    t === "alert"
      ? "text-[var(--fm-alert)]"
      : t === "warn"
        ? "text-[var(--fm-warn)]"
        : "text-[var(--fm-accent)]";

  return (
    <div className="w-full">
      {(label || unit) && (
        <div className="mb-1 flex items-center justify-between">
          <span className="fm-label">{label}</span>
          <span className={cn("fm-mono text-[11px] font-semibold tabular-nums", valueColor)}>
            {Math.round(value)}
            {unit}
          </span>
        </div>
      )}
      <div className={cn("fm-meter-track", dense && "h-[3px]")}>
        <span className={cn("fm-meter-fill", fillClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
