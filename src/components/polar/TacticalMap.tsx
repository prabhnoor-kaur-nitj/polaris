import { StatusBadge, useNow } from "@/components/polar/hud";
import { STATIONS, SUPPLY_NODES } from "@/lib/polar/seed";
import { distanceKm, fmtUtc, type PolarStore } from "@/lib/polar/store";
import type { MapPos } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  Move,
  Navigation,
  Package,
  RadioTower,
  Truck,
  User,
} from "lucide-react";
import { useMemo, useRef } from "react";

const VB_W = 100;
const VB_H = 62.5; // 16:10 aspect

function toXY(pos: MapPos) {
  return { x: (pos.x / 100) * VB_W, y: (pos.y / 100) * VB_H };
}

function fmtEta(ms: number) {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export function TacticalMap({
  store,
  onSelectAsset,
}: {
  store: PolarStore;
  onSelectAsset: (kind: "personnel" | "vehicle", id: string) => void;
}) {
  const { state, moveAsset } = store;
  const now = useNow(1000);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<
    | null
    | {
        kind: "personnel" | "vehicle";
        id: string;
        moved: boolean;
      }
  >(null);
  const justDraggedRef = useRef(false);

  const distress = state.personnel.filter((p) => p.status === "DISTRESS");

  /* Nearest rescue asset (any distress on the grid). */
  const rescue = useMemo(() => {
    if (distress.length === 0) return null;
    const target = distress[0];
    let best: { name: string; km: number; speedKmh: number; pos: MapPos } | null = null;
    for (const v of state.vehicles) {
      const km = distanceKm(v.pos, target.pos);
      if (!best || km < best.km) best = { name: v.name, km, speedKmh: v.speedKmh, pos: v.pos };
    }
    return best ? { ...best, target } : null;
  }, [distress, state.vehicles]);

  function handlePointerDown(e: React.PointerEvent, kind: "personnel" | "vehicle", id: string) {
    dragRef.current = { kind, id, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const grid = gridRef.current;
    if (!drag || !grid) return;
    const rect = grid.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    dragRef.current = { ...drag, moved: true };
    moveAsset(drag.kind, drag.id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  function handlePointerUp() {
    if (dragRef.current) {
      justDraggedRef.current = dragRef.current.moved;
      dragRef.current = null;
    }
  }

  return (
    <div className="fm-panel overflow-hidden">
      {/* Map header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--fm-line-soft)] px-4 py-2.5">
        <Navigation className="size-4 text-[var(--fm-accent)]" />
        <h2 className="fm-mono text-[10.5px] font-semibold tracking-[0.22em] text-[var(--fm-ink)] uppercase">
          Tactical grid · Sector 70S
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge tone="ice">
            <Crosshair className="size-3" /> 120 km × 120 km
          </StatusBadge>
          <StatusBadge tone="muted">
            <Move className="size-3" /> Drag to reposition
          </StatusBadge>
        </div>
      </div>

      {/* SOS strip (when active) */}
      {rescue && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[rgba(208,92,75,0.35)] bg-[rgba(208,92,75,0.07)] px-4 py-2">
          <StatusBadge tone="alert" pulse>
            ● SOS active — {rescue.target.callsign}
          </StatusBadge>
          <span className="fm-mono text-[11px] text-[var(--fm-ink)]">
            {rescue.name} · {rescue.km} km out · ETA{" "}
            {rescue.speedKmh > 0 ? fmtEta((rescue.km / rescue.speedKmh) * 3_600_000) : "—"}
          </span>
          <button
            type="button"
            onClick={() => store.resolveSos(rescue.target.id)}
            className="fm-btn fm-btn-good fm-btn-sm ml-auto"
          >
            Mark rescued
          </button>
        </div>
      )}

      {/* The grid — flat chart on paper */}
      <div
        ref={gridRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative aspect-[16/10] w-full touch-none overflow-hidden select-none"
        style={{ background: "var(--fm-paper-2)" }}
      >
        {/* SVG chart: grid, contours, zones, routes */}
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4e7d92" />
              <stop offset="100%" stopColor="#7fb4c9" />
            </linearGradient>
          </defs>

          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * (VB_W / 12)}
              y1="0"
              x2={i * (VB_W / 12)}
              y2={VB_H}
              stroke="var(--fm-line-soft)"
              strokeWidth="0.15"
            />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * (VB_H / 8)}
              x2={VB_W}
              y2={i * (VB_H / 8)}
              stroke="var(--fm-line-soft)"
              strokeWidth="0.15"
            />
          ))}

          {/* contours — ice-shelf isolines */}
          <ellipse cx="20" cy="16" rx="18" ry="8" fill="none" stroke="var(--fm-line)" strokeWidth="0.2" />
          <ellipse cx="24" cy="17" rx="12" ry="5" fill="none" stroke="var(--fm-line-soft)" strokeWidth="0.2" />
          <ellipse cx="80" cy="46" rx="16" ry="7" fill="none" stroke="var(--fm-line)" strokeWidth="0.2" />
          <ellipse cx="76" cy="47" rx="10" ry="4.5" fill="none" stroke="var(--fm-line-soft)" strokeWidth="0.2" />
          <ellipse cx="55" cy="55" rx="22" ry="9" fill="none" stroke="var(--fm-line-soft)" strokeWidth="0.2" />

          {/* station zones */}
          {STATIONS.map((s) => {
            const { x, y } = toXY(s.pos);
            return (
              <g key={s.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="rgba(127,180,201,0.05)"
                  stroke="rgba(127,180,201,0.3)"
                  strokeWidth="0.2"
                  strokeDasharray="1.2 0.8"
                />
                <text
                  x={x}
                  y={y - 11}
                  textAnchor="middle"
                  fontSize="2.2"
                  fill="var(--fm-mut)"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="0.5"
                >
                  {s.code}
                </text>
              </g>
            );
          })}

          {/* rescue route */}
          {rescue && (
            <line
              className="fm-dash"
              x1={toXY(rescue.pos).x}
              y1={toXY(rescue.pos).y}
              x2={toXY(rescue.target.pos).x}
              y2={toXY(rescue.target.pos).y}
              stroke="var(--fm-alert)"
              strokeWidth="0.5"
            />
          )}

          {/* saved routes preview */}
          {state.routes.map((r) =>
            r.waypoints.length > 1 ? (
              <polyline
                key={r.id}
                points={r.waypoints
                  .map((w) => {
                    const c = toXY(w.pos);
                    return `${c.x},${c.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="0.45"
                opacity="0.85"
              />
            ) : null,
          )}
        </svg>

        {/* station markers */}
        {STATIONS.map((s) => (
          <div
            key={s.id}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.pos.x}%`, top: `${s.pos.y}%` }}
          >
            <div className="relative grid place-items-center">
              <span className="grid size-8 place-items-center rounded-sm border border-[rgba(127,180,201,0.45)] bg-[var(--fm-paper)] text-[var(--fm-accent)]">
                <RadioTower className="size-4" />
              </span>
              <span className="fm-mono absolute top-9 whitespace-nowrap text-[9px] font-bold tracking-[0.18em] text-[var(--fm-ink)] uppercase">
                {s.name.toUpperCase()}
              </span>
            </div>
          </div>
        ))}

        {/* supply nodes */}
        {SUPPLY_NODES.map((sn) => (
          <div
            key={sn.id}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${sn.pos.x}%`, top: `${sn.pos.y}%` }}
          >
            <span className="fm-plate grid size-6 place-items-center text-[var(--fm-accent)]">
              <Package className="size-3" />
            </span>
            <span className="fm-mono absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] tracking-[0.14em] text-[var(--fm-mut)]">
              {sn.name.toUpperCase()}
            </span>
          </div>
        ))}

        {/* personnel markers (draggable + clickable) */}
        {state.personnel.map((p) => (
          <button
            key={p.id}
            type="button"
            onPointerDown={(e) => handlePointerDown(e, "personnel", p.id)}
            onClick={() => {
              if (!justDraggedRef.current) onSelectAsset("personnel", p.id);
            }}
            className={cn(
              "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--fm-accent)]",
              p.status === "DISTRESS" && "fm-blink",
            )}
            style={{ left: `${p.pos.x}%`, top: `${p.pos.y}%` }}
            title={`${p.callsign} — drag to reposition, click to inspect`}
          >
            <span
              className={cn(
                "relative grid size-7 place-items-center rounded-full border-2 bg-[var(--fm-paper)]",
                p.status === "DISTRESS"
                  ? "border-[var(--fm-alert)] text-[var(--fm-alert)]"
                  : p.status === "ACTIVE"
                    ? "border-[var(--fm-good)] text-[var(--fm-good)]"
                    : p.status === "STANDBY"
                      ? "border-[var(--fm-warn)] text-[var(--fm-warn)]"
                      : "border-[var(--fm-accent-deep)] text-[var(--fm-mut)]",
              )}
            >
              <User className="size-3.5" />
            </span>
            <span
              className={cn(
                "fm-mono absolute top-8 left-1/2 -translate-x-1/2 rounded-sm bg-[var(--fm-paper)] px-1 text-[8.5px] font-bold tracking-[0.1em] whitespace-nowrap",
                p.status === "DISTRESS"
                  ? "text-[var(--fm-alert)]"
                  : "text-[var(--fm-mut)]",
              )}
            >
              {p.callsign}
            </span>
          </button>
        ))}

        {/* vehicle markers (draggable + clickable) */}
        {state.vehicles.map((v) => (
          <button
            key={v.id}
            type="button"
            onPointerDown={(e) => handlePointerDown(e, "vehicle", v.id)}
            onClick={() => {
              if (!justDraggedRef.current) onSelectAsset("vehicle", v.id);
            }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--fm-accent)]"
            style={{ left: `${v.pos.x}%`, top: `${v.pos.y}%` }}
            title={`${v.name} — drag to reposition, click to inspect`}
          >
            <span
              className={cn(
                "fm-plate grid size-6 place-items-center border-2",
                v.available
                  ? "border-[var(--fm-accent)] text-[var(--fm-accent)]"
                  : "border-[var(--fm-line)] text-[var(--fm-mut)]",
              )}
            >
              <Truck className="size-3" />
            </span>
          </button>
        ))}

        {/* corner ticks */}
        <div className="pointer-events-none absolute inset-2">
          <span className="absolute top-0 left-0 size-4 border-t border-l border-[var(--fm-line)]" />
          <span className="absolute top-0 right-0 size-4 border-t border-r border-[var(--fm-line)]" />
          <span className="absolute bottom-0 left-0 size-4 border-b border-l border-[var(--fm-line)]" />
          <span className="absolute right-0 bottom-0 size-4 border-b border-r border-[var(--fm-line)]" />
        </div>
        <span className="fm-mono pointer-events-none absolute bottom-2 left-3 text-[9px] tracking-[0.2em] text-[var(--fm-mut)] uppercase">
          {fmtUtc(now)} UTC · Sector 70S · 120×120 km
        </span>
        <span className="fm-mono pointer-events-none absolute right-3 bottom-2 text-[9px] tracking-[0.2em] text-[var(--fm-mut)] uppercase">
          {state.personnel.length + state.vehicles.length} assets tracked
        </span>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[var(--fm-line-soft)] px-4 py-2">
        <LegendDot color="var(--fm-good)" label="Active" />
        <LegendDot color="var(--fm-warn)" label="Standby" />
        <LegendDot color="var(--fm-accent)" label="Rest / vehicle" />
        <LegendDot color="var(--fm-alert)" label="Distress / SOS" />
        <LegendDot color="var(--fm-accent)" label="Supply node" />
        <span className="fm-mono ml-auto text-[9px] tracking-[0.14em] text-[var(--fm-mut)] uppercase">
          Drag = reposition · Click = inspect
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full border border-[var(--fm-line)]" style={{ background: color }} />
      <span className="fm-mono text-[9px] tracking-[0.16em] text-[var(--fm-mut)] uppercase">
        {label.toUpperCase()}
      </span>
    </span>
  );
}
