import { useNow } from "@/components/polar/hud";
import { useAuth } from "@/hooks/use-auth";
import { fmtDuration, fmtUtc, type PolarStore } from "@/lib/polar/store";
import type { NetworkMode } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  CloudOff,
  LogOut,
  RadioTower,
  RefreshCw,
  Satellite,
  ShieldCheck,
  Signal,
  Timer,
} from "lucide-react";

const MODE_META: Record<
  NetworkMode,
  { label: string; sub: string; chip: string; icon: typeof Satellite; next: NetworkMode }
> = {
  online: {
    label: "Online",
    sub: "Satellite",
    chip: "fm-chip-good",
    icon: Satellite,
    next: "lowband",
  },
  lowband: {
    label: "Low-bandwidth",
    sub: "VHF mesh",
    chip: "fm-chip-warn",
    icon: RadioTower,
    next: "offline",
  },
  offline: {
    label: "Offline",
    sub: "Local storage",
    chip: "fm-chip-alert",
    icon: CloudOff,
    next: "online",
  },
};

export function TacticalTopbar({
  store,
  onSignOut,
}: {
  store: PolarStore;
  onSignOut: () => void;
}) {
  const { state, setNetworkMode, forceSync } = store;
  const { user } = useAuth();
  const isMaster = user?.role === "master";
  const now = useNow(1000);
  const meta = MODE_META[state.networkMode];
  const Icon = meta.icon;
  const queued = state.pending.length;
  const pumping = queued > 0 && state.networkMode !== "offline";
  const uptimeMin = Math.floor((now - state.expeditionStart) / 60_000);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--fm-line)] bg-[var(--fm-bg)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        {/* Identity */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="fm-mono text-[13px] font-semibold tracking-[0.28em] text-[var(--fm-ink)]">
            POLARIS
          </span>
          <span className="fm-serif hidden text-sm italic text-[var(--fm-mut)] sm:inline">
            expedition command
          </span>
          <span className="fm-tag hidden md:inline">v4.2</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Clocks */}
          <div className="fm-panel hidden items-center gap-3 px-3 py-1.5 md:flex">
            <div className="leading-tight">
              <div className="fm-label">UTC Polar</div>
              <div className="fm-mono text-[13px] font-semibold text-[var(--fm-ink)] tabular-nums">
                {fmtUtc(now)}
              </div>
            </div>
            <div className="h-6 w-px bg-[var(--fm-line)]" />
            <div className="flex items-center gap-1.5 leading-tight">
              <Timer className="size-3.5 text-[var(--fm-mut)]" />
              <div>
                <div className="fm-label">Expedition</div>
                <div className="fm-mono text-[13px] font-semibold text-[var(--fm-ink)] tabular-nums">
                  D+{Math.floor(uptimeMin / 1440)} · {fmtDuration(uptimeMin)}
                </div>
              </div>
            </div>
          </div>

          {/* Network mode + toggle */}
          <button
            type="button"
            onClick={() => setNetworkMode(meta.next)}
            title="Cycle simulated network mode"
            className={cn("fm-chip px-2.5 py-1.5", meta.chip)}
          >
            <Icon className={cn("size-3.5", pumping && "fm-blink")} />
            <span className="flex flex-col items-start leading-none">
              <span>{meta.label}</span>
              <span className="mt-0.5 text-[8px] opacity-70">({meta.sub}) · cycle</span>
            </span>
          </button>

          {/* Sync queue */}
          <div
            className={cn("fm-chip py-1.5", queued > 0 ? "fm-chip-warn" : "fm-chip-good")}
            title={state.lastSync ? `Last sync ${fmtUtc(state.lastSync)} UTC` : "Never synced"}
          >
            <Signal className={cn("size-3.5", pumping && "fm-blink")} />
            <span>{queued > 0 ? `Sync queue: ${queued}` : "All synced"}</span>
            <button
              type="button"
              disabled={queued === 0}
              onClick={forceSync}
              className={cn(
                "fm-mono ml-1 flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] tracking-[0.14em] uppercase transition-colors",
                queued === 0
                  ? "border-[var(--fm-line)] text-[var(--fm-mut)] opacity-40"
                  : "border-[var(--fm-accent-deep)] text-[var(--fm-accent)] hover:bg-[rgba(127,180,201,0.1)]",
              )}
            >
              <RefreshCw className={cn("size-3", pumping && "animate-spin")} />
              Sync
            </button>
          </div>

          {/* Commander chip */}
          <button
            type="button"
            onClick={onSignOut}
            title="End command session"
            className="fm-chip py-1.5"
          >
            <span className="fm-plate fm-mono size-5 rounded-full text-[8px] text-[var(--fm-accent)]">
              {(user?.name ?? user?.email ?? "CMDR")
                .split(/[\s@.]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]!.toUpperCase())
                .join("")}
            </span>
            <span className="hidden sm:inline">
              {isMaster ? "Master" : (user?.name ?? user?.email ?? "Operator")}
            </span>
            {isMaster && <ShieldCheck className="size-3.5" />}
            <LogOut className="size-3 text-[var(--fm-mut)]" />
          </button>
        </div>
      </div>
    </header>
  );
}
