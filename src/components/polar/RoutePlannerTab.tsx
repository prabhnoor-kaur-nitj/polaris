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

const STEPS = ["Waypoints", "Mission params", "Review & commit"] as const;

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
        <div className="fm-panel flex flex-wrap items-center gap-2 px-4 py-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "fm-mono flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors",
                  i === step
                    ? "border-[var(--fm-accent-deep)] bg-[rgba(127,180,201,0.1)] text-[var(--fm-accent)]"
                    : i < step
                      ? "border-[rgba(127,174,142,0.4)] text-[var(--fm-good)]"
                      : "border-[var(--fm-line)] text-[var(--fm-mut)]",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded-full text-[8px]",
                    i <= step
                      ? "bg-[rgba(127,180,201,0.2)] text-[var(--fm-ink)]"
                      : "bg-[var(--fm-line-soft)] text-[var(--fm-mut)]",
                  )}
                >
                  {i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="size-3.5 text-[var(--fm-line)]" />}
            </div>
          ))}
          <StatusBadge tone="ice" className="ml-auto">
            <RouteIcon className="size-3" /> {distance.toFixed(1)} km planned
          </StatusBadge>
        </div>

        {step === 0 && (
          <Panel
            title="Waypoint builder"
            actions={
              <StatusBadge tone={canNext ? "sync" : "warn"}>
                {canNext ? "Route valid" : "Min 2 waypoints"}
              </StatusBadge>
            }
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addWaypoint("STATION", "st-bharati")}
                className="fm-btn fm-btn-quiet fm-btn-sm"
              >
                <MapPin className="size-3.5" /> Add Bharati
              </button>
              <button
                type="button"
                onClick={() => addWaypoint("STATION", "st-maitri")}
                className="fm-btn fm-btn-quiet fm-btn-sm"
              >
                <MapPin className="size-3.5" /> Add Maitri
              </button>
              {SUPPLY_NODES.map((sn) => (
                <button
                  key={sn.id}
                  type="button"
                  onClick={() => addWaypoint("SUPPLY_NODE", sn.id)}
                  className="fm-btn fm-btn-quiet fm-btn-sm"
                >
                  <Package className="size-3.5" /> {sn.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addWaypoint("CUSTOM")}
                className="fm-btn fm-btn-good fm-btn-sm"
              >
                <CircleDot className="size-3.5" /> Custom ice WP
              </button>
            </div>

            <ol className="mt-4 space-y-2">
              {waypoints.map((w, i) => (
                <li
                  key={w.id}
                  className="fm-panel-2 flex items-center gap-3 px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border text-[9px] font-bold",
                      i === 0
                        ? "border-[rgba(127,174,142,0.5)] text-[var(--fm-good)]"
                        : i === waypoints.length - 1
                          ? "border-[rgba(208,92,75,0.5)] text-[var(--fm-alert)]"
                          : "border-[rgba(127,180,201,0.4)] text-[var(--fm-accent)]",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="fm-mono truncate text-[12px] font-semibold text-[var(--fm-ink)]">
                      {w.label}
                    </div>
                    <div className="fm-mono text-[9.5px] text-[var(--fm-mut)]">
                      {w.kind.replace("_", " ")} · {w.pos.x.toFixed(1)}E {w.pos.y.toFixed(1)}S
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveWaypoint(i, -1)}
                      disabled={i === 0}
                      className="rounded-sm border border-[var(--fm-line)] px-1.5 py-0.5 text-[10px] text-[var(--fm-mut)] hover:text-[var(--fm-ink)] disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWaypoint(i, 1)}
                      disabled={i === waypoints.length - 1}
                      className="rounded-sm border border-[var(--fm-line)] px-1.5 py-0.5 text-[10px] text-[var(--fm-mut)] hover:text-[var(--fm-ink)] disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWaypoint(w.id)}
                      disabled={waypoints.length <= 1}
                      className="rounded-sm border border-[rgba(208,92,75,0.35)] px-1.5 py-0.5 text-[var(--fm-alert)] hover:bg-[rgba(208,92,75,0.1)] disabled:opacity-30"
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
                className="fm-btn fm-btn-solid fm-btn-sm disabled:opacity-40"
              >
                Next: Mission params <ChevronRight className="size-3.5" />
              </button>
            </div>
          </Panel>
        )}

        {step === 1 && (
          <Panel title="Mission parameters">
            <div className="grid gap-5 sm:grid-cols-2">
              <ParamField label="Route name" icon={Flag}>
                <input
                  className="fm-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Traverse designation"
                />
              </ParamField>
              <ParamField label="Cruise speed (km/h)" icon={Gauge}>
                <input
                  className="fm-input fm-mono text-[13px]"
                  type="number"
                  min={5}
                  max={60}
                  value={speed}
                  onChange={(e) => setSpeed(Math.max(5, Math.min(60, Number(e.target.value) || 5)))}
                />
              </ParamField>
              <ParamField label={`Crew size — ${crew}`} icon={Users}>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={crew}
                  onChange={(e) => setCrew(Number(e.target.value))}
                  className="fm-range mt-2"
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
                  className="fm-range mt-2"
                />
              </ParamField>
              <ParamField label={`Temperature drop — ${temp}°C`} icon={Thermometer}>
                <input
                  type="range"
                  min={-55}
                  max={-10}
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="fm-range mt-2"
                />
              </ParamField>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <QuickStat label="Distance" value={`${distance.toFixed(1)} km`} />
              <QuickStat label="Est. drive time" value={fmtDuration(estimate.etaMin)} />
              <QuickStat
                label="Cold factor"
                value={`×${estimate.tempFactor.toFixed(2)}`}
                tone={estimate.tempFactor >= 1.5 ? "warn" : "ice"}
              />
            </div>

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="fm-btn fm-btn-quiet fm-btn-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="fm-btn fm-btn-solid fm-btn-sm"
              >
                Next: Review <ChevronRight className="size-3.5" />
              </button>
            </div>
          </Panel>
        )}

        {step === 2 && (
          <Panel
            title="Mission review"
            actions={
              <StatusBadge tone="sync">
                <Play className="size-3" /> Ready to commit
              </StatusBadge>
            }
          >
            <div className="fm-panel-2 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              <BigStat label="Total distance" value={`${distance.toFixed(1)} km`} />
              <BigStat label="Fuel required" value={`${estimate.fuelLiters} L`} tone="warn" />
              <BigStat label="Est. duration" value={fmtDuration(estimate.etaMin)} />
              <BigStat label="Waypoints" value={String(waypoints.length)} />
            </div>

            <div className="fm-panel-2 mt-3 px-4 py-3">
              <div className="fm-label mb-2">Sequence</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {waypoints.map((w, i) => (
                  <span key={w.id} className="flex items-center gap-1.5">
                    <span className="fm-mono rounded-sm border border-[var(--fm-line)] bg-[var(--fm-paper)] px-2 py-1 text-[10px] font-semibold text-[var(--fm-ink)]">
                      {i + 1}. {w.label}
                    </span>
                    {i < waypoints.length - 1 && <ChevronRight className="size-3 text-[var(--fm-line)]" />}
                  </span>
                ))}
              </div>
              <p className="fm-mono mt-3 text-[10px] leading-relaxed text-[var(--fm-mut)] uppercase">
                Fuel burn assumes {estimate.perKm.toFixed(2)} L/km baseline ×{estimate.tempFactor.toFixed(2)}{" "}
                cold factor for {temp}°C operations, {crew} crew, {payload} kg payload. Carry +25% reserve
                before commit.
              </p>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="fm-btn fm-btn-quiet fm-btn-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={commit}
                className="fm-btn fm-btn-good"
              >
                Commit route to expedition plan
              </button>
            </div>
          </Panel>
        )}
      </div>

      {/* Right rail: calculator + saved routes */}
      <div className="space-y-4">
        <Panel title="Fuel & asset calculator">
          <div className="space-y-3">
            <BigStat label="Fuel required" value={`${estimate.fuelLiters} L`} tone="warn" big />
            <div className="grid grid-cols-2 gap-2">
              <QuickStat label="Distance" value={`${distance.toFixed(1)} km`} />
              <QuickStat label="Drive time" value={fmtDuration(estimate.etaMin)} />
              <QuickStat label="Cold factor" value={`×${estimate.tempFactor.toFixed(2)}`} />
              <QuickStat label="Reserve (+25%)" value={`${Math.round(estimate.fuelLiters * 1.25)} L`} />
            </div>
            <div className="fm-panel-2 px-3 py-2.5">
              <div className="fm-label mb-1">Fleet fit</div>
              {state.vehicles
                .filter((v) => v.available)
                .map((v) => {
                  const range = Math.round(v.fuel * 4.2);
                  const ok = range >= distance;
                  return (
                    <div
                      key={v.id}
                      className="mt-1.5 flex items-center justify-between gap-2 rounded-sm border border-[var(--fm-line)] bg-[var(--fm-paper)] px-2.5 py-1.5"
                    >
                      <div className="min-w-0">
                        <div className="fm-mono truncate text-[11px] font-semibold text-[var(--fm-ink)]">
                          {v.name}
                        </div>
                        <div className="fm-mono text-[9px] text-[var(--fm-mut)]">
                          RANGE {range} KM · {v.speedKmh} KM/H
                        </div>
                      </div>
                      <StatusBadge tone={ok ? "sync" : "alert"}>{ok ? "Fit" : "No-go"}</StatusBadge>
                    </div>
                  );
                })}
            </div>
          </div>
        </Panel>

        <Panel
          title="Saved expedition routes"
          actions={<StatusBadge tone="muted">{state.routes.length} stored</StatusBadge>}
          bodyClassName="p-0"
        >
          <ul className="max-h-80 divide-y divide-[var(--fm-line-soft)] overflow-y-auto">
            {state.routes.map((r) => {
              const km = routeDistanceKm(r.waypoints.map((w) => w.pos));
              return (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RouteIcon className="size-3.5 shrink-0 text-[var(--fm-accent)]" />
                    <span className="fm-mono flex-1 truncate text-[12px] font-semibold text-[var(--fm-ink)]">
                      {r.name}
                    </span>
                    <span className="fm-mono text-[9.5px] text-[var(--fm-mut)]">
                      {fmtUtc(r.createdAt)}Z
                    </span>
                  </div>
                  <div className="fm-mono mt-1 text-[9.5px] tracking-[0.08em] text-[var(--fm-mut)]">
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
          <div className="fm-rise fm-panel fm-mono flex items-center gap-3 px-4 py-3">
            <Timer className="size-4 text-[var(--fm-good)]" />
            <span className="text-[11px] font-bold tracking-[0.1em] text-[var(--fm-ink)] uppercase">
              Route "{committed.name}" committed · {committed.fuel} L · {committed.eta}
            </span>
            <button
              type="button"
              onClick={() => setCommitted(null)}
              className="text-[var(--fm-mut)] hover:text-[var(--fm-ink)]"
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
      <div className="fm-mono mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-[var(--fm-mut)] uppercase">
        <Icon className="size-3.5 text-[var(--fm-accent)]" />
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
    <div className="rounded-sm border border-[var(--fm-line)] bg-[var(--fm-paper-2)] px-2.5 py-2">
      <div className="fm-label">{label}</div>
      <div
        className={cn(
          "fm-mono text-[12px] font-bold tabular-nums",
          tone === "warn" ? "text-[var(--fm-warn)]" : "text-[var(--fm-accent)]",
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
      <div className="fm-label">{label}</div>
      <div
        className={cn(
          "fm-mono font-bold tabular-nums",
          big ? "text-2xl" : "text-lg",
          tone === "warn" ? "text-[var(--fm-warn)]" : "text-[var(--fm-accent)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
