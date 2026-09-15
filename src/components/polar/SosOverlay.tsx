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
      <div className="absolute inset-0 bg-[#0d1015]/85" />

      <div className="fm-rise fm-panel relative w-full max-w-2xl overflow-hidden border-[rgba(208,92,75,0.6)] bg-[var(--fm-paper)]">
        {/* red rule header */}
        <div className="flex items-center gap-3 border-b border-[rgba(208,92,75,0.4)] bg-[rgba(208,92,75,0.08)] px-5 py-3.5">
          <span className="fm-plate size-10 border-[rgba(208,92,75,0.5)]">
            <ShieldAlert className={cn("size-5 text-[var(--fm-alert)]", "fm-blink")} />
          </span>
          <div>
            <div className="fm-mono text-sm font-bold tracking-[0.2em] text-[var(--fm-alert)] uppercase">
              Mayday · Mayday · Mayday
            </div>
            <div className="fm-label mt-0.5">
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
              <span className="fm-label">Casualty telemetry</span>
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
            <div className="fm-panel-2 px-3 py-2">
              <div className="fm-label">Position</div>
              <div className="fm-mono mt-0.5 text-[12px] font-semibold text-[var(--fm-ink)]">
                {coord(target.pos.x)}E {coord(target.pos.y)}S · {fmtRelShort(elapsedSec)} since beacon
              </div>
            </div>
          </div>

          {/* Rescue solve */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="fm-label">Nearest rescue solve</span>
              <StatusBadge tone="ice">
                <Radio className="size-3" /> Auto-dispatch
              </StatusBadge>
            </div>
            <div className="fm-panel-2 space-y-2.5 p-3">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-[var(--fm-accent)]" />
                <div className="min-w-0">
                  <div className="fm-mono text-[13px] font-bold text-[var(--fm-ink)]">
                    {rescue?.name ?? "NO ASSET AVAILABLE"}
                  </div>
                  <div className="fm-label">Primary response vehicle</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SolveStat label="Distance" value={`${rescue?.km ?? "—"} KM`} />
                <SolveStat label="ETA" value={etaMin > 0 ? `${Math.round(etaMin)} MIN` : "—"} />
                <SolveStat label="Route" value="ICE CORRIDOR C2" />
                <SolveStat label="O2 Loss Est." value={`${oxygenDrop}%`} />
              </div>
            </div>
            <div className="fm-panel-2 px-3 py-2.5">
              <div className="fm-label mb-1">Dispatch uplink</div>
              <p className="fm-mono text-[10.5px] leading-relaxed text-[var(--fm-mut)]">
                {store.state.networkMode === "offline"
                  ? "OFFLINE — incident queued in local store. Rescue solve cached on-device; will broadcast when link restores."
                  : store.state.networkMode === "lowband"
                    ? "VHF MESH — narrowband burst queued. Repeat may take up to 5s per hop."
                    : "SATCOM LIVE — incident broadcasting to POLARIS HQ and both station medics now."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--fm-line)] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="fm-btn fm-btn-quiet fm-btn-sm"
          >
            Keep monitoring (close)
          </button>
          <button
            type="button"
            onClick={() => {
              store.resolveSos(target.id);
              onClose();
            }}
            className="fm-btn fm-btn-good fm-btn-sm"
          >
            Confirm crew safe · Stand down
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
        "flex items-center gap-2.5 rounded-sm border px-3 py-2",
        critical
          ? "border-[rgba(208,92,75,0.4)] bg-[rgba(208,92,75,0.07)]"
          : "border-[var(--fm-line)] bg-[var(--fm-paper-2)]",
      )}
    >
      <Icon className={cn("size-4", critical ? "text-[var(--fm-alert)]" : "text-[var(--fm-accent)]")} />
      <span className="fm-label flex-1">{label}</span>
      <span
        className={cn(
          "fm-mono text-[13px] font-bold tabular-nums",
          critical ? "text-[var(--fm-alert)]" : "text-[var(--fm-accent)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SolveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-[var(--fm-line)] bg-[var(--fm-paper)] px-2.5 py-1.5">
      <div className="fm-label">{label}</div>
      <div className="fm-mono text-[11px] font-bold text-[var(--fm-ink)]">{value}</div>
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
