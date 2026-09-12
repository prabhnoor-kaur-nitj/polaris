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
    <div className="hud-panel overflow-hidden">
      {/* Map header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#48cae4]/12 px-4 py-2.5">
        <Navigation className="size-4 text-[#48cae4]" />
        <h2 className="hud-mono text-[11px] font-semibold tracking-[0.22em] text-[#7be6fa] uppercase">
          Tactical Grid · Sector 70S
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge tone="ice">
            <Crosshair className="size-3" /> 120 KM × 120 KM
          </StatusBadge>
          <StatusBadge tone="muted">
            <Move className="size-3" /> DRAG TO REPOSITION
          </StatusBadge>
        </div>
      </div>

      {/* SOS strip (when active) */}
      {rescue && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#ff4d4d]/25 bg-[#ff4d4d]/8 px-4 py-2">
          <StatusBadge tone="alert" pulse>
            ● SOS ACTIVE — {rescue.target.callsign}
          </StatusBadge>
          <span className="hud-mono text-[11px] text-[#ffd7d7]">
            {rescue.name} · {rescue.km} km out · ETA{" "}
            {rescue.speedKmh > 0 ? fmtEta((rescue.km / rescue.speedKmh) * 3_600_000) : "—"}
          </span>
          <button
            type="button"
            onClick={() => store.resolveSos(rescue.target.id)}
            className="hud-mono ml-auto rounded-md border border-[#00f5d4]/40 bg-[#00f5d4]/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[#00f5d4] hover:bg-[#00f5d4]/20"
          >
            MARK RESCUED
          </button>
        </div>
      )}

      {/* The grid */}
      <div
        ref={gridRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative aspect-[16/10] w-full touch-none overflow-hidden select-none"
        style={{ background: "linear-gradient(160deg, #0a1024 0%, #0d1530 50%, #0a1024 100%)" }}
      >
        {/* terrain glow blobs */}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute top-[20%] left-[8%] size-[38%] rounded-full bg-[#48cae4]/5 blur-3xl" />
          <div className="top-[8%] right-[6%] size-[30%] rounded-full bg-[#00b4d8]/6 blur-3xl absolute" />
          <div className="absolute bottom-[4%] left-[30%] size-[36%] rounded-full bg-[#1c2541]/60 blur-3xl" />
        </div>

        {/* radar sweep anchored at Maitri */}
        <div
          className="pointer-events-none absolute size-[56%] overflow-hidden rounded-full"
          style={{
            left: "2%",
            top: "28%",
          }}
        >
          <div
            className="anim-radar absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(72,202,228,0.28), rgba(72,202,228,0.03) 55deg, transparent 90deg)",
            }}
          />
          <div className="absolute inset-0 rounded-full border border-[#48cae4]/15" />
        </div>

        {/* SVG overlays: grid, contours, zones, routes */}
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#00f5d4" />
            </linearGradient>
          </defs>

          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * (VB_W / 12)}
              y1="0"
              x2={i * (VB_W / 12)}
              y2={VB_H}
              stroke="rgba(72,202,228,0.08)"
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
              stroke="rgba(72,202,228,0.08)"
              strokeWidth="0.15"
            />
          ))}

          {/* contours */}
          <ellipse cx="20" cy="16" rx="18" ry="8" fill="none" stroke="rgba(72,202,228,0.10)" strokeWidth="0.2" />
          <ellipse cx="24" cy="17" rx="12" ry="5" fill="none" stroke="rgba(72,202,228,0.08)" strokeWidth="0.2" />
          <ellipse cx="80" cy="46" rx="16" ry="7" fill="none" stroke="rgba(72,202,228,0.10)" strokeWidth="0.2" />
          <ellipse cx="76" cy="47" rx="10" ry="4.5" fill="none" stroke="rgba(72,202,228,0.08)" strokeWidth="0.2" />
          <ellipse cx="55" cy="55" rx="22" ry="9" fill="none" stroke="rgba(72,202,228,0.07)" strokeWidth="0.2" />

          {/* station zones */}
          {STATIONS.map((s) => {
            const { x, y } = toXY(s.pos);
            return (
              <g key={s.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="rgba(72,202,228,0.05)"
                  stroke="rgba(72,202,228,0.25)"
                  strokeWidth="0.2"
                  strokeDasharray="1.2 0.8"
                />
                <text
                  x={x}
                  y={y - 11}
                  textAnchor="middle"
                  fontSize="2.2"
                  fill="rgba(123,230,250,0.75)"
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
              className="anim-route"
              x1={toXY(rescue.pos).x}
              y1={toXY(rescue.pos).y}
              x2={toXY(rescue.target.pos).x}
              y2={toXY(rescue.target.pos).y}
              stroke="#ff4d4d"
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
                opacity="0.8"
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
              <span className="absolute size-14 rounded-full border border-[#48cae4]/20" />
              <span className="grid size-8 place-items-center rounded-md border border-[#48cae4]/45 bg-[#0b132b]/85 text-[#48cae4] shadow-[0_0_16px_-2px_rgba(72,202,228,0.6)]">
                <RadioTower className="size-4" />
              </span>
              <span className="hud-mono absolute top-9 whitespace-nowrap text-[9px] font-bold tracking-[0.18em] text-[#7be6fa]">
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
            <span className="grid size-6 place-items-center rounded border border-[#48cae4]/30 bg-[#0b132b]/80 text-[#7be6fa]">
              <Package className="size-3" />
            </span>
            <span className="hud-mono absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] tracking-[0.14em] text-[#9ec8dc]">
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
              "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#48cae4]",
              p.status === "DISTRESS" && "anim-sos",
            )}
            style={{ left: `${p.pos.x}%`, top: `${p.pos.y}%` }}
            title={`${p.callsign} — drag to reposition, click to inspect`}
          >
            <span
              className={cn(
                "relative grid size-7 place-items-center rounded-full border-2 bg-[#0b132b]/90",
                p.status === "DISTRESS"
                  ? "border-[#ff4d4d] text-[#ff4d4d]"
                  : p.status === "ACTIVE"
                    ? "border-[#00f5d4] text-[#00f5d4]"
                    : p.status === "STANDBY"
                      ? "border-[#ffb703] text-[#ffd166]"
                      : "border-[#48cae4]/60 text-[#9ec8dc]",
              )}
            >
              {p.status === "DISTRESS" && (
                <span className="anim-ping absolute inset-0 rounded-full border-2 border-[#ff4d4d]" />
              )}
              <User className="size-3.5" />
            </span>
            <span
              className={cn(
                "hud-mono absolute top-8 left-1/2 -translate-x-1/2 rounded px-1 text-[8.5px] font-bold tracking-[0.1em] whitespace-nowrap",
                p.status === "DISTRESS"
                  ? "bg-[#ff4d4d]/15 text-[#ff8080]"
                  : "bg-[#0b132b]/70 text-[#9ec8dc]",
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
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#48cae4]"
            style={{ left: `${v.pos.x}%`, top: `${v.pos.y}%` }}
            title={`${v.name} — drag to reposition, click to inspect`}
          >
            <span
              className={cn(
                "grid size-6 place-items-center rounded border-2 bg-[#0b132b]/90",
                v.available ? "border-[#48cae4] text-[#48cae4]" : "border-white/25 text-[#9ec8dc]/70",
              )}
            >
              <Truck className="size-3" />
            </span>
          </button>
        ))}

        {/* corner reticles */}
        <div className="pointer-events-none absolute inset-2">
          <span className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-[#48cae4]/40" />
          <span className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-[#48cae4]/40" />
          <span className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-[#48cae4]/40" />
          <span className="absolute right-0 bottom-0 size-4 border-b-2 border-r-2 border-[#48cae4]/40" />
        </div>
        <span className="hud-mono pointer-events-none absolute bottom-2 left-3 text-[9px] tracking-[0.2em] text-[#9ec8dc]/60">
          {fmtUtc(now)} UTC · SECTOR 70S · 120×120 KM
        </span>
        <span className="hud-mono pointer-events-none absolute right-3 bottom-2 text-[9px] tracking-[0.2em] text-[#9ec8dc]/60">
          {state.personnel.length + state.vehicles.length} ASSETS TRACKED
        </span>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#48cae4]/12 px-4 py-2">
        <LegendDot color="#00f5d4" label="Active" />
        <LegendDot color="#ffb703" label="Standby" />
        <LegendDot color="#48cae4" label="Rest / Vehicle" />
        <LegendDot color="#ff4d4d" label="Distress / SOS" />
        <LegendDot color="#7be6fa" label="Supply node" />
        <span className="hud-mono ml-auto text-[9px] tracking-[0.14em] text-[#9ec8dc]/60">
          DRAG = REPOSITION · CLICK = INSPECT
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="hud-mono text-[9px] tracking-[0.16em] text-[#9ec8dc]">
        {label.toUpperCase()}
      </span>
    </span>
  );
}
