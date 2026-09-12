import { Panel, StatusBadge } from "@/components/polar/hud";
import { STATIONS, SUPPLY_NODES } from "@/lib/polar/seed";
import {
  estimateRoute,
  fmtDuration,
  fmtUtc,
  routeDistanceKm,
  uid,
  type PolarStore,
} from "@/lib/polar/store";
import type { RouteWaypoint } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  CircleDot,
  Flag,
  Gauge,
  MapPin,
  Package,
  Play,
  Route as RouteIcon,
  Thermometer,
  Timer,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const STEPS = ["WAYPOINTS", "MISSION PARAMS", "REVIEW & COMMIT"] as const;

export function RoutePlannerTab({ store }: { store: PolarStore }) {
  const { state, saveRoute } = store;
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Ice Corridor Traverse");
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([
    { id: uid("w"), kind: "STATION", refId: "st-maitri", label: "Maitri Station", pos: STATIONS[0].pos },
  ]);
  const [crew, setCrew] = useState(4);
  const [payload, setPayload] = useState(800);
  const [temp, setTemp] = useState(-38);
  const [speed, setSpeed] = useState(18);
  const [committed, setCommitted] = useState<{ name: string; fuel: number; eta: string } | null>(null);

  const distance = useMemo(
    () => routeDistanceKm(waypoints.map((w) => w.pos)),
    [waypoints],
  );
  const estimate = useMemo(
    () => estimateRoute({ distanceKm: distance, crew, payloadKg: payload, tempC: temp, speedKmh: speed }),
    [distance, crew, payload, temp, speed],
  );

  function addWaypoint(kind: RouteWaypoint["kind"], refId?: string) {
    const label =
      kind === "STATION"
        ? STATIONS.find((s) => s.id === refId)?.name
        : kind === "SUPPLY_NODE"
          ? SUPPLY_NODES.find((s) => s.id === refId)?.name
          : `Waypoint ${waypoints.length + 1}`;
    const base =
      kind === "STATION"
        ? STATIONS.find((s) => s.id === refId)?.pos
        : kind === "SUPPLY_NODE"
          ? SUPPLY_NODES.find((s) => s.id === refId)?.pos
          : {
              x: 20 + Math.random() * 60,
              y: 20 + Math.random() * 60,
            };
    if (!label || !base) return;
    setWaypoints((w) => [...w, { id: uid("w"), kind, refId, label, pos: base }]);
    setCommitted(null);
  }

  function removeWaypoint(id: string) {
    setWaypoints((w) => w.filter((x) => x.id !== id));
    setCommitted(null);
  }

  function moveWaypoint(idx: number, dir: -1 | 1) {
    setWaypoints((w) => {
      const next = [...w];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return w;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setCommitted(null);
  }

  function commit() {
    saveRoute(name, waypoints);
    setCommitted({
      name: name.trim() || "Unnamed Traverse",
      fuel: estimate.fuelLiters,
      eta: fmtDuration(estimate.etaMin),
    });
    setStep(0);
    setWaypoints([
      { id: uid("w"), kind: "STATION", refId: "st-maitri", label: "Maitri Station", pos: STATIONS[0].pos },
    ]);
  }

  const canNext = waypoints.length >= 2;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      {/* Wizard column */}
      <div className="space-y-4">
        {/* Stepper */}
        <div className="hud-panel flex flex-wrap items-center gap-2 px-4 py-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "hud-mono flex items-center gap-2 rounded-md border px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] transition-colors",
                  i === step
                    ? "border-[#48cae4]/60 bg-[#48cae4]/15 text-[#7be6fa]"
                    : i < step
                      ? "border-[#00f5d4]/30 bg-[#00f5d4]/8 text-[#00f5d4]"
                      : "border-white/10 bg-white/3 text-[#9ec8dc]",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded-full text-[8px]",
                    i <= step ? "bg-[#48cae4]/25 text-[#d7f4ff]" : "bg-white/10 text-[#9ec8dc]",
                  )}
                >
                  {i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="size-3.5 text-[#48cae4]/40" />}
            </div>
          ))}
          <StatusBadge tone="ice" className="ml-auto">
            <RouteIcon className="size-3" /> {distance.toFixed(1)} KM PLANNED
          </StatusBadge>
        </div>

        {step === 0 && (
          <Panel
            title="Waypoint Builder"
            actions={
              <StatusBadge tone={canNext ? "sync" : "warn"}>
                {canNext ? "ROUTE VALID" : "MIN 2 WAYPOINTS"}
              </StatusBadge>
            }
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addWaypoint("STATION", "st-bharati")}
                className="hud-mono flex items-center gap-1.5 rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-[#7be6fa] hover:bg-[#48cae4]/18"
              >
                <MapPin className="size-3.5" /> ADD BHARATI
              </button>
              <button
                type="button"
                onClick={() => addWaypoint("STATION", "st-maitri")}
                className="hud-mono flex items-center gap-1.5 rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-[#7be6fa] hover:bg-[#48cae4]/18"
              >
                <MapPin className="size-3.5" /> ADD MAITRI
              </button>
              {SUPPLY_NODES.map((sn) => (
                <button
                  key={sn.id}
                  type="button"
                  onClick={() => addWaypoint("SUPPLY_NODE", sn.id)}
                  className="hud-mono flex items-center gap-1.5 rounded-md border border-[#48cae4]/20 bg-white/4 px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-[#9ec8dc] hover:bg-[#48cae4]/12 hover:text-[#7be6fa]"
                >
                  <Package className="size-3.5" /> {sn.name.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addWaypoint("CUSTOM")}
                className="hud-mono flex items-center gap-1.5 rounded-md border border-[#00f5d4]/30 bg-[#00f5d4]/8 px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-[#00f5d4] hover:bg-[#00f5d4]/16"
              >
                <CircleDot className="size-3.5" /> CUSTOM ICE WP
              </button>
            </div>

            <ol className="mt-4 space-y-2">
              {waypoints.map((w, i) => (
                <li
                  key={w.id}
                  className="hud-panel flex items-center gap-3 px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border text-[9px] font-bold",
                      i === 0
                        ? "border-[#00f5d4]/50 bg-[#00f5d4]/10 text-[#00f5d4]"
                        : i === waypoints.length - 1
                          ? "border-[#ff4d4d]/50 bg-[#ff4d4d]/10 text-[#ff8080]"
                          : "border-[#48cae4]/40 bg-[#48cae4]/10 text-[#7be6fa]",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="hud-mono truncate text-[12px] font-semibold text-[#d7f4ff]">
                      {w.label}
                    </div>
                    <div className="hud-mono text-[9.5px] text-[#9ec8dc]/70">
                      {w.kind.replace("_", " ")} · {w.pos.x.toFixed(1)}E {w.pos.y.toFixed(1)}S
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveWaypoint(i, -1)}
                      disabled={i === 0}
                      className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[#9ec8dc] hover:bg-white/10 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWaypoint(i, 1)}
                      disabled={i === waypoints.length - 1}
                      className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[#9ec8dc] hover:bg-white/10 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWaypoint(w.id)}
                      disabled={waypoints.length <= 1}
                      className="rounded border border-[#ff4d4d]/30 px-1.5 py-0.5 text-[#ff8080] hover:bg-[#ff4d4d]/15 disabled:opacity-30"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={!canNext}
                className="hud-mono flex items-center gap-1.5 rounded-md border border-[#48cae4]/50 bg-[#48cae4]/15 px-4 py-2 text-[10px] font-bold tracking-[0.18em] text-[#7be6fa] hover:bg-[#48cae4]/25 disabled:opacity-40"
              >
                NEXT: MISSION PARAMS <ChevronRight className="size-3.5" />
              </button>
            </div>
          </Panel>
        )}

        {step === 1 && (
          <Panel title="Mission Parameters">
            <div className="grid gap-5 sm:grid-cols-2">
              <ParamField label="Route Name" icon={Flag}>
                <input
                  className="hud-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Traverse designation"
                />
              </ParamField>
              <ParamField label="Cruise Speed (km/h)" icon={Gauge}>
                <input
                  className="hud-input"
                  type="number"
                  min={5}
                  max={60}
                  value={speed}
                  onChange={(e) => setSpeed(Math.max(5, Math.min(60, Number(e.target.value) || 5)))}
                />
              </ParamField>
              <ParamField label={`Crew Size — ${crew}`} icon={Users}>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={crew}
                  onChange={(e) => setCrew(Number(e.target.value))}
                  className="hud-range w-full accent-[#48cae4]"
                />
              </ParamField>
              <ParamField label={`Payload — ${payload} kg`} icon={Truck}>
                <input
                  type="range"
                  min={0}
                  max={4000}
                  step={50}
                  value={payload}
                  onChange={(e) => setPayload(Number(e.target.value))}
                  className="hud-range w-full accent-[#48cae4]"
                />
              </ParamField>
              <ParamField label={`Temperature Drop — ${temp}°C`} icon={Thermometer}>
                <input
                  type="range"
                  min={-55}
                  max={-10}
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="hud-range w-full accent-[#48cae4]"
                />
              </ParamField>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <QuickStat label="Distance" value={`${distance.toFixed(1)} km`} />
              <QuickStat label="Est. Drive Time" value={fmtDuration(estimate.etaMin)} />
              <QuickStat
                label="Cold Factor"
                value={`×${estimate.tempFactor.toFixed(2)}`}
                tone={estimate.tempFactor >= 1.5 ? "warn" : "ice"}
              />
            </div>

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="hud-mono rounded-md border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-[0.18em] text-[#9ec8dc] hover:bg-white/10"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="hud-mono flex items-center gap-1.5 rounded-md border border-[#48cae4]/50 bg-[#48cae4]/15 px-4 py-2 text-[10px] font-bold tracking-[0.18em] text-[#7be6fa] hover:bg-[#48cae4]/25"
              >
                NEXT: REVIEW <ChevronRight className="size-3.5" />
              </button>
            </div>
          </Panel>
        )}

        {step === 2 && (
          <Panel
            title="Mission Review"
            actions={
              <StatusBadge tone="sync">
                <Play className="size-3" /> READY TO COMMIT
              </StatusBadge>
            }
          >
            <div className="hud-panel grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              <BigStat label="Total Distance" value={`${distance.toFixed(1)} km`} />
              <BigStat label="Fuel Required" value={`${estimate.fuelLiters} L`} tone="warn" />
              <BigStat label="Est. Duration" value={fmtDuration(estimate.etaMin)} />
              <BigStat label="Waypoints" value={String(waypoints.length)} />
            </div>

            <div className="hud-panel mt-3 px-4 py-3">
              <div className="hud-label mb-2">Sequence</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {waypoints.map((w, i) => (
                  <span key={w.id} className="flex items-center gap-1.5">
                    <span className="hud-mono rounded border border-[#48cae4]/25 bg-[#48cae4]/8 px-2 py-1 text-[10px] font-semibold text-[#d7f4ff]">
                      {i + 1}. {w.label}
                    </span>
                    {i < waypoints.length - 1 && <ChevronRight className="size-3 text-[#48cae4]/50" />}
                  </span>
                ))}
              </div>
              <p className="hud-mono mt-3 text-[10px] leading-relaxed text-[#9ec8dc]/75">
                Fuel burn assumes {estimate.perKm.toFixed(2)} L/km baseline ×{estimate.tempFactor.toFixed(2)}{" "}
                cold factor for {temp}°C operations, {crew} crew, {payload} kg payload. Carry +25% reserve
                before commit.
              </p>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hud-mono rounded-md border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-[0.18em] text-[#9ec8dc] hover:bg-white/10"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={commit}
                className="hud-mono flex items-center gap-1.5 rounded-md border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-5 py-2 text-[10px] font-bold tracking-[0.18em] text-[#00f5d4] hover:bg-[#00f5d4]/25"
              >
                COMMIT ROUTE TO EXPEDITION PLAN
              </button>
            </div>
          </Panel>
        )}
      </div>

      {/* Right rail: calculator + saved routes */}
      <div className="space-y-4">
        <Panel title="Fuel & Asset Calculator">
          <div className="space-y-3">
            <BigStat label="Fuel Required" value={`${estimate.fuelLiters} L`} tone="warn" big />
            <div className="grid grid-cols-2 gap-2">
              <QuickStat label="Distance" value={`${distance.toFixed(1)} km`} />
              <QuickStat label="Drive Time" value={fmtDuration(estimate.etaMin)} />
              <QuickStat label="Cold Factor" value={`×${estimate.tempFactor.toFixed(2)}`} />
              <QuickStat label="Reserve (+25%)" value={`${Math.round(estimate.fuelLiters * 1.25)} L`} />
            </div>
            <div className="hud-panel px-3 py-2.5">
              <div className="hud-label mb-1">Fleet Fit</div>
              {state.vehicles
                .filter((v) => v.available)
                .map((v) => {
                  const range = Math.round(v.fuel * 4.2);
                  const ok = range >= distance;
                  return (
                    <div
                      key={v.id}
                      className="mt-1.5 flex items-center justify-between gap-2 rounded border border-[#48cae4]/12 bg-[#0b132b]/60 px-2.5 py-1.5"
                    >
                      <div className="min-w-0">
                        <div className="hud-mono truncate text-[11px] font-semibold text-[#d7f4ff]">
                          {v.name}
                        </div>
                        <div className="hud-mono text-[9px] text-[#9ec8dc]/70">
                          RANGE {range} KM · {v.speedKmh} KM/H
                        </div>
                      </div>
                      <StatusBadge tone={ok ? "sync" : "alert"}>{ok ? "FIT" : "NO-GO"}</StatusBadge>
                    </div>
                  );
                })}
            </div>
          </div>
        </Panel>

        <Panel
          title="Saved Expedition Routes"
          actions={<StatusBadge tone="muted">{state.routes.length} STORED</StatusBadge>}
          bodyClassName="p-0"
        >
          <ul className="max-h-80 divide-y divide-[#48cae4]/8 overflow-y-auto">
            {state.routes.map((r) => {
              const km = routeDistanceKm(r.waypoints.map((w) => w.pos));
              return (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RouteIcon className="size-3.5 shrink-0 text-[#48cae4]" />
                    <span className="hud-mono flex-1 truncate text-[12px] font-semibold text-[#d7f4ff]">
                      {r.name}
                    </span>
                    <span className="hud-mono text-[9.5px] text-[#9ec8dc]/70">
                      {fmtUtc(r.createdAt)}Z
                    </span>
                  </div>
                  <div className="hud-mono mt-1 text-[9.5px] tracking-[0.08em] text-[#9ec8dc]/70">
                    {r.waypoints.map((w) => w.label).join(" → ")} · {km.toFixed(1)} KM
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Committed toast */}
      {committed && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="anim-sos-in hud-mono flex items-center gap-3 rounded-lg border border-[#00f5d4]/50 bg-[#0b132b]/95 px-4 py-3 shadow-[0_0_40px_-8px_rgba(0,245,212,0.4)]">
            <Timer className="size-4 text-[#00f5d4]" />
            <span className="text-[11px] font-bold tracking-[0.1em] text-[#00f5d4]">
              ROUTE "{committed.name}" COMMITTED · {committed.fuel} L · {committed.eta}
            </span>
            <button
              type="button"
              onClick={() => setCommitted(null)}
              className="text-[#9ec8dc] hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ParamField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Gauge;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="hud-mono mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-[#9ec8dc]">
        <Icon className="size-3.5 text-[#48cae4]" />
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function QuickStat({
  label,
  value,
  tone = "ice",
}: {
  label: string;
  value: string;
  tone?: "ice" | "warn";
}) {
  return (
    <div className="rounded-md border border-[#48cae4]/15 bg-[#0b132b]/70 px-2.5 py-2">
      <div className="hud-label">{label}</div>
      <div
        className={cn(
          "hud-mono text-[12px] font-bold tabular-nums",
          tone === "warn" ? "text-[#ffd166]" : "text-[#7be6fa]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  tone = "ice",
  big = false,
}: {
  label: string;
  value: string;
  tone?: "ice" | "warn";
  big?: boolean;
}) {
  return (
    <div>
      <div className="hud-label">{label}</div>
      <div
        className={cn(
          "hud-mono font-bold tabular-nums",
          big ? "text-2xl" : "text-lg",
          tone === "warn" ? "text-[#ffd166]" : "text-[#7be6fa]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
