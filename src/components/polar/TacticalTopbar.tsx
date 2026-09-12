import { Button } from "@/components/ui/button";
import { useNow } from "@/components/polar/hud";
import { fmtDuration, fmtUtc, type PolarStore } from "@/lib/polar/store";
import type { NetworkMode } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  CloudOff,
  RadioTower,
  RefreshCw,
  Satellite,
  Signal,
  Snowflake,
  Timer,
} from "lucide-react";

const MODE_META: Record<
  NetworkMode,
  { label: string; sub: string; tone: string; icon: typeof Satellite; next: NetworkMode }
> = {
  online: {
    label: "ONLINE",
    sub: "SATELLITE",
    tone: "text-[#00f5d4] border-[#00f5d4]/40 bg-[#00f5d4]/10",
    icon: Satellite,
    next: "lowband",
  },
  lowband: {
    label: "LOW-BANDWIDTH",
    sub: "VHF MESH",
    tone: "text-[#ffd166] border-[#ffb703]/40 bg-[#ffb703]/10",
    icon: RadioTower,
    next: "offline",
  },
  offline: {
    label: "OFFLINE",
    sub: "LOCAL STORAGE",
    tone: "text-[#ff8080] border-[#ff4d4d]/50 bg-[#ff4d4d]/10",
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
  const now = useNow(1000);
  const meta = MODE_META[state.networkMode];
  const Icon = meta.icon;
  const queued = state.pending.length;
  const pumping = queued > 0 && state.networkMode !== "offline";
  const uptimeMin = Math.floor((now - state.expeditionStart) / 60_000);

  return (
    <header className="sticky top-0 z-40 border-b border-[#48cae4]/15 bg-[#0b132b]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-5">
        {/* Identity */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#48cae4]/40 bg-[#48cae4]/10 text-[#48cae4]">
            <Snowflake className="size-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="hud-mono truncate text-[12px] font-bold tracking-[0.18em] text-[#d7f4ff]">
              NCPOR <span className="text-[#48cae4]/70">|</span>{" "}
              <span className="text-[#7be6fa]">POLAR LOGISTICS ENGINE</span>{" "}
              <span className="text-[#48cae4]/60">v4.2</span>
            </div>
            <div className="hud-label mt-0.5 hidden sm:block">
              MoES · Integrated Expedition Command · Bharati/Maitri Grid
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Clocks */}
          <div className="hud-panel hidden items-center gap-3 px-3 py-1.5 md:flex">
            <div className="leading-tight">
              <div className="hud-label">UTC Polar</div>
              <div className="hud-mono text-[13px] font-semibold text-[#7be6fa] tabular-nums">
                {fmtUtc(now)}
              </div>
            </div>
            <div className="h-6 w-px bg-[#48cae4]/15" />
            <div className="flex items-center gap-1.5 leading-tight">
              <Timer className="size-3.5 text-[#48cae4]/70" />
              <div>
                <div className="hud-label">Expedition</div>
                <div className="hud-mono text-[13px] font-semibold text-[#d7f4ff] tabular-nums">
                  D+{Math.floor(uptimeMin / 1440)} · {fmtDuration(uptimeMin)}
                </div>
              </div>
            </div>
          </div>

          {/* Network mode + toggle */}
          <Button
            type="button"
            onClick={() => setNetworkMode(meta.next)}
            title="Cycle simulated network mode"
            className={cn(
              "hud-mono h-9 gap-2 rounded-lg border px-3 text-[10px] font-bold tracking-[0.14em]",
              "transition-shadow hover:shadow-[0_0_18px_-4px_rgba(72,202,228,0.5)]",
              meta.tone,
            )}
          >
            <Icon className={cn("size-3.5", pumping && "anim-blink")} />
            <span className="flex flex-col items-start leading-none">
              <span>{meta.label}</span>
              <span className="mt-0.5 text-[8px] opacity-70">({meta.sub}) · TAP TO CYCLE</span>
            </span>
          </Button>

          {/* Sync queue */}
          <div
            className={cn(
              "hud-mono flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold tracking-[0.14em]",
              queued > 0
                ? "border-[#ffb703]/40 bg-[#ffb703]/10 text-[#ffd166]"
                : "border-[#00f5d4]/30 bg-[#00f5d4]/8 text-[#00f5d4]",
            )}
            title={
              state.lastSync
                ? `Last sync ${fmtUtc(state.lastSync)} UTC`
                : "Never synced"
            }
          >
            <Signal className={cn("size-3.5", pumping && "anim-blink")} />
            <span className="whitespace-nowrap">
              {queued > 0 ? `SYNC QUEUE: ${queued}` : "ALL SYNCED"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={queued === 0}
              onClick={forceSync}
              className="hud-mono ml-1 h-6 rounded-md border-[#48cae4]/40 bg-[#48cae4]/10 px-2 text-[9px] font-bold tracking-[0.14em] text-[#7be6fa] hover:bg-[#48cae4]/20"
            >
              <RefreshCw className={cn("size-3", pumping && "animate-spin")} />
              FORCE SYNC
            </Button>
          </div>

          {/* Commander chip */}
          <Button
            type="button"
            variant="ghost"
            onClick={onSignOut}
            title="End command session"
            className="hud-mono h-9 gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-bold tracking-[0.12em] text-[#9ec8dc] hover:bg-white/10 hover:text-[#d7f4ff]"
          >
            <span className="grid size-5 place-items-center rounded-full bg-[#48cae4]/20 text-[8px] text-[#7be6fa]">
              SC
            </span>
            <span className="hidden sm:inline">SC-01 · CMDR</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
