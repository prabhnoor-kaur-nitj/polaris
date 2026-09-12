import { StatusBadge, useNow } from "@/components/polar/hud";
import { distanceKm, fmtUtc } from "@/lib/polar/store";
import type { PolarStore } from "@/lib/polar/store";
import type { Personnel } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  BatteryCharging,
  HeartPulse,
  Radio,
  ShieldAlert,
  Truck,
  Wind,
} from "lucide-react";

export function SosOverlay({
  store,
  onClose,
}: {
  store: PolarStore;
  onClose: () => void;
}) {
  const now = useNow(1000);
  const incident = store.state.sos.find((i) => !i.resolved);
  const target: Personnel | undefined = incident
    ? store.state.personnel.find((p) => p.id === incident.personnelId)
    : undefined;

  if (!incident || !target) return null;

  /* Nearest rescue asset calculation (simulated dispatch solve). */
  let rescue: { name: string; km: number; speedKmh: number } | null = null;
  for (const v of store.state.vehicles) {
    const km = distanceKm(v.pos, target.pos);
    if (!rescue || km < rescue.km) rescue = { name: v.name, km, speedKmh: v.speedKmh };
  }
  const etaMin = rescue && rescue.speedKmh > 0 ? (rescue.km / rescue.speedKmh) * 60 : 0;
  const elapsedSec = Math.floor((now - incident.at) / 1000);
  const oxygenDrop = Math.max(0, Math.round((elapsedSec / 60) * 1.8));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* flashing backdrop */}
      <div className="anim-flash absolute inset-0 bg-[#ff4d4d]/20 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-[#0b132b]/80" />

      <div className="anim-sos-in relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-[#ff4d4d]/60 bg-[#0b132b] shadow-[0_0_80px_-16px_rgba(255,77,77,0.55)]">
        {/* scanline */}
        <div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#ff4d4d]/10 to-transparent anim-scan" />

        <div className="relative flex items-center gap-3 border-b border-[#ff4d4d]/30 bg-[#ff4d4d]/8 px-5 py-3.5">
          <span className="anim-sos grid size-10 place-items-center rounded-lg border border-[#ff4d4d]/60 bg-[#ff4d4d]/15 text-[#ff4d4d]">
            <ShieldAlert className="size-5" />
          </span>
          <div>
            <div className="hud-mono text-sm font-bold tracking-[0.2em] text-[#ff8080]">
              MAYDAY · MAYDAY · MAYDAY
            </div>
            <div className="hud-label mt-0.5">
              Priority override · Expedition broadcast channel 1
            </div>
          </div>
          <span className="ml-auto">
            <StatusBadge tone="alert" pulse>
              {fmtUtc(incident.at)}Z
            </StatusBadge>
          </span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {/* Casualty telemetry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="hud-label">Casualty Telemetry</span>
              <StatusBadge tone="alert">{target.callsign}</StatusBadge>
            </div>
            <Vital
              icon={BatteryCharging}
              label="Battery"
              value={`${target.battery}%`}
              critical={target.battery < 25}
            />
            <Vital icon={Wind} label="Oxygen" value={`${target.oxygen}%`} critical={target.oxygen < 70} />
            <Vital
              icon={HeartPulse}
              label="Supplies"
              value={`${target.supplies}%`}
              critical={target.supplies < 30}
            />
            <div className="hud-panel px-3 py-2">
              <div className="hud-label">Position</div>
              <div className="hud-mono mt-0.5 text-[12px] font-semibold text-[#d7f4ff]">
                {coord(target.pos.x)}E {coord(target.pos.y)}S · {fmtRelShort(elapsedSec)} since beacon
              </div>
            </div>
          </div>

          {/* Rescue solve */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="hud-label">Nearest Rescue Solve</span>
              <StatusBadge tone="ice">
                <Radio className="size-3" /> AUTO-DISPATCH
              </StatusBadge>
            </div>
            <div className="hud-panel space-y-2.5 p-3">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-[#48cae4]" />
                <div className="min-w-0">
                  <div className="hud-mono text-[13px] font-bold text-[#d7f4ff]">
                    {rescue?.name ?? "NO ASSET AVAILABLE"}
                  </div>
                  <div className="hud-label">Primary response vehicle</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SolveStat label="Distance" value={`${rescue?.km ?? "—"} KM`} />
                <SolveStat label="ETA" value={etaMin > 0 ? `${Math.round(etaMin)} MIN` : "—"} />
                <SolveStat label="Route" value="ICE CORRIDOR C2" />
                <SolveStat label="O2 Loss Est." value={`${oxygenDrop}%`} />
              </div>
            </div>
            <div className="hud-panel px-3 py-2.5">
              <div className="hud-label mb-1">Dispatch Uplink</div>
              <p className="hud-mono text-[10.5px] leading-relaxed text-[#9ec8dc]">
                {store.state.networkMode === "offline"
                  ? "OFFLINE — incident queued in local store. Rescue solve cached on-device; will broadcast when link restores."
                  : store.state.networkMode === "lowband"
                    ? "VHF MESH — narrowband burst queued. Repeat may take up to 5s per hop."
                    : "SATCOM LIVE — incident broadcasting to POLARIS HQ and both station medics now."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#ff4d4d]/30 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="hud-mono rounded-md border border-white/15 bg-white/5 px-3.5 py-2 text-[10px] font-bold tracking-[0.14em] text-[#9ec8dc] hover:bg-white/10"
          >
            KEEP MONITORING (CLOSE)
          </button>
          <button
            type="button"
            onClick={() => {
              store.resolveSos(target.id);
              onClose();
            }}
            className="hud-mono rounded-md border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-3.5 py-2 text-[10px] font-bold tracking-[0.14em] text-[#00f5d4] hover:bg-[#00f5d4]/25"
          >
            CONFIRM CREW SAFE · STAND DOWN
          </button>
        </div>
      </div>
    </div>
  );
}

function Vital({
  icon: Icon,
  label,
  value,
  critical,
}: {
  icon: typeof BatteryCharging;
  label: string;
  value: string;
  critical?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2",
        critical ? "border-[#ff4d4d]/40 bg-[#ff4d4d]/8" : "border-[#48cae4]/20 bg-[#48cae4]/5",
      )}
    >
      <Icon className={cn("size-4", critical ? "text-[#ff4d4d]" : "text-[#48cae4]")} />
      <span className="hud-label flex-1">{label}</span>
      <span
        className={cn(
          "hud-mono text-[13px] font-bold tabular-nums",
          critical ? "text-[#ff8080]" : "text-[#7be6fa]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SolveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#48cae4]/15 bg-[#0b132b]/70 px-2.5 py-1.5">
      <div className="hud-label">{label}</div>
      <div className="hud-mono text-[11px] font-bold text-[#d7f4ff]">{value}</div>
    </div>
  );
}

function coord(v: number) {
  const deg = Math.floor(v / 2) / 10;
  return `${(deg + 69).toFixed(1)}°`;
}

function fmtRelShort(sec: number) {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`;
}
