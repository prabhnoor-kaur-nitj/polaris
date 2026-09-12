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

/* ---------- tactical panel ---------- */

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
    <section className={cn("hud-panel hud-panel-hover flex flex-col", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-[#48cae4]/12 px-4 py-2.5">
        <h2 className="hud-mono text-[11px] font-semibold tracking-[0.22em] text-[#7be6fa] uppercase">
          {title}
        </h2>
        <div className="flex items-center gap-2">{actions}</div>
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------- status badge ---------- */

type Tone = "ice" | "alert" | "sync" | "warn" | "muted";

const toneRing: Record<Tone, string> = {
  ice: "border-[#48cae4]/40 bg-[#48cae4]/10 text-[#7be6fa]",
  alert: "border-[#ff4d4d]/50 bg-[#ff4d4d]/10 text-[#ff8080]",
  sync: "border-[#00f5d4]/40 bg-[#00f5d4]/10 text-[#00f5d4]",
  warn: "border-[#ffb703]/40 bg-[#ffb703]/10 text-[#ffd166]",
  muted: "border-white/10 bg-white/5 text-[#9ec8dc]",
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
    <span
      className={cn(
        "hud-mono inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase",
        toneRing[tone],
        pulse && "anim-blink",
        className,
      )}
    >
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
  const auto = pct <= 15 ? "alert" : pct <= 40 ? "warn" : "ice";
  const t = tone ?? auto;

  const barColors: Record<string, string> = {
    ice: "from-[#00b4d8] to-[#48cae4]",
    alert: "from-[#ff4d4d] to-[#ff8080]",
    warn: "from-[#ffb703] to-[#ffd166]",
    sync: "from-[#00b4d8] to-[#00f5d4]",
  };

  return (
    <div className="w-full">
      {(label || unit) && (
        <div className="mb-1 flex items-center justify-between">
          <span className="hud-label">{label}</span>
          <span
            className={cn(
              "hud-mono text-[11px] font-semibold",
              t === "alert" ? "text-[#ff8080]" : t === "warn" ? "text-[#ffd166]" : "text-[#7be6fa]",
            )}
          >
            {Math.round(value)}
            {unit}
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-[#0b132b]/90 ring-1 ring-[#48cae4]/12",
          dense ? "h-1" : "h-1.5",
        )}
      >
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-500", barColors[t])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
