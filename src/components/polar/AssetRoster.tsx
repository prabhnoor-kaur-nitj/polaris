import { Meter, Panel, StatusBadge } from "@/components/polar/hud";
import { fmtLat, fmtLon } from "@/lib/polar/geo";
import { deviceFix } from "@/lib/polar/gps";
import { fmtRel, type PolarStore } from "@/lib/polar/store";
import type { TrackableKind } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  LocateFixed,
  Package,
  Plus,
  Radio,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

const KIND_ICON: Record<TrackableKind, typeof User> = {
  personnel: User,
  vehicle: Truck,
  beacon: Package,
};

const KIND_LABEL: Record<TrackableKind, string> = {
  personnel: "Crew member",
  vehicle: "Vehicle",
  beacon: "GPS beacon",
};

/**
 * Tracked-asset roster: register / retire tracked assets, locate any of them
 * on the tactical map, and push real device-GPS fixes into their tracks.
 */
export function AssetRoster({
  store,
  selection,
  onSelect,
  onLocate,
}: {
  store: PolarStore;
  selection: { kind: TrackableKind; id: string } | null;
  onSelect: (sel: { kind: TrackableKind; id: string } | null) => void;
  onLocate: (kind: TrackableKind, id: string) => void;
}) {
  const { state, addAsset, removeAsset, moveAsset, setBeaconLive } = store;
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<TrackableKind>("beacon");
  const [name, setName] = useState("");
  const [meta, setMeta] = useState("");
  const [callsign, setCallsign] = useState("");
  const [posMode, setPosMode] = useState<"gps" | "maitri" | "bharati">("gps");
  const [fixMsg, setFixMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = [
    ...state.personnel.map((p) => ({
      kind: "personnel" as TrackableKind,
      id: p.id,
      name: `${p.callsign} · ${p.name}`,
      meta: p.role,
      pos: p.pos,
      extra:
        p.status === "DISTRESS"
          ? "DISTRESS"
          : p.status === "ACTIVE"
            ? "Active"
            : p.status,
      statusTone:
        p.status === "DISTRESS"
          ? ("alert" as const)
          : p.status === "ACTIVE"
            ? ("sync" as const)
            : ("warn" as const),
      battery: p.battery,
      live: false,
    })),
    ...state.vehicles.map((v) => ({
      kind: "vehicle" as TrackableKind,
      id: v.id,
      name: v.name,
      meta: v.type,
      pos: v.pos,
      extra: v.available ? "Ready" : "Down",
      statusTone: v.available ? ("sync" as const) : ("muted" as const),
      battery: v.fuel,
      live: false,
    })),
    ...state.beacons.map((b) => ({
      kind: "beacon" as TrackableKind,
      id: b.id,
      name: b.name,
      meta: b.kind,
      pos: b.pos,
      extra: b.live ? "Live GPS" : fmtRel(b.lastFix ?? Date.now()),
      statusTone: b.live ? ("sync" as const) : ("ice" as const),
      battery: b.battery ?? 0,
      live: Boolean(b.live),
    })),
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setFixMsg(null);
    try {
      let pos = { lat: -70.6667, lon: 11.8667 };
      if (posMode === "gps") {
        setFixMsg("Acquiring device GPS fix…");
        const fix = await deviceFix();
        pos = { lat: fix.lat, lon: fix.lon };
        setFixMsg(`Registered at device fix ±${fix.accuracyM} m`);
      }
      addAsset({ kind, name, meta, pos, callsign });
      setName("");
      setMeta("");
      setCallsign("");
      setAdding(false);
    } catch (err) {
      setFixMsg(err instanceof Error ? err.message : "GPS fix failed — try station placement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      {/* Roster */}
      <Panel
        title="Tracked asset roster"
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone="muted">{rows.length} tracked</StatusBadge>
            <button
              type="button"
              onClick={() => setAdding((a) => !a)}
              className={cn(
                "fm-btn fm-btn-sm",
                adding ? "fm-btn-quiet" : "fm-btn-solid",
              )}
            >
              {adding ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {adding ? "Cancel" : "Add asset"}
            </button>
          </div>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-[var(--fm-line-soft)]">
          {rows.map((r) => {
            const Icon = KIND_ICON[r.kind];
            const selected = selection?.kind === r.kind && selection.id === r.id;
            return (
              <li
                key={`${r.kind}:${r.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors",
                  selected ? "bg-[rgba(127,180,201,0.07)]" : "hover:bg-[rgba(127,180,201,0.04)]",
                )}
              >
                <span className="fm-plate size-8 shrink-0">
                  <Icon className="size-4 text-[var(--fm-accent)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="fm-mono truncate text-[12px] font-semibold text-[var(--fm-ink)]">
                    {r.name}
                  </div>
                  <div className="fm-mono truncate text-[9.5px] text-[var(--fm-mut)]">
                    {r.meta} · {fmtLat(r.pos.lat)} {fmtLon(r.pos.lon)}
                  </div>
                </div>
                <div className="hidden w-24 shrink-0 sm:block">
                  <Meter value={r.battery} tone={r.battery < 30 ? "alert" : undefined} dense />
                </div>
                <StatusBadge tone={r.statusTone}>{r.extra}</StatusBadge>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Select & inspect"
                    onClick={() => onSelect({ kind: r.kind, id: r.id })}
                    className="fm-mono rounded-sm border border-[var(--fm-line)] px-1.5 py-1 text-[9px] tracking-[0.1em] text-[var(--fm-mut)] uppercase transition-colors hover:text-[var(--fm-ink)]"
                  >
                    Info
                  </button>
                  <button
                    type="button"
                    title="Center map on this asset"
                    onClick={() => onLocate(r.kind, r.id)}
                    className="fm-mono rounded-sm border border-[var(--fm-line)] px-1.5 py-1 text-[9px] tracking-[0.1em] text-[var(--fm-accent)] uppercase transition-colors hover:bg-[rgba(127,180,201,0.1)]"
                  >
                    <LocateFixed className="size-3.5" />
                  </button>
                  {r.kind === "beacon" && (
                    <button
                      type="button"
                      title={r.live ? "Stop live device-GPS tracking" : "Follow this device's GPS live"}
                      onClick={() => setBeaconLive(r.id, !r.live)}
                      className={cn(
                        "fm-mono rounded-sm border px-1.5 py-1 text-[9px] tracking-[0.1em] uppercase transition-colors",
                        r.live
                          ? "border-[rgba(127,174,142,0.5)] text-[var(--fm-good)]"
                          : "border-[var(--fm-line)] text-[var(--fm-mut)] hover:text-[var(--fm-ink)]",
                      )}
                    >
                      <Radio className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    title={
                      r.kind === "beacon"
                        ? "Recover beacon"
                        : r.kind === "personnel"
                          ? "Remove crew member from tracking"
                          : "Retire vehicle"
                    }
                    onClick={() => {
                      removeAsset(r.kind, r.id);
                      if (selected) onSelect(null);
                    }}
                    className="fm-mono rounded-sm border border-[var(--fm-line)] px-1.5 py-1 text-[9px] tracking-[0.1em] text-[var(--fm-mut)] uppercase transition-colors hover:border-[rgba(208,92,75,0.5)] hover:text-[var(--fm-alert)]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* Add / register form */}
      <div className="space-y-4">
        <Panel title={adding ? "Register new asset" : "Quick GPS fix"}>
          {adding ? (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <span className="fm-label-field">Asset type</span>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(KIND_LABEL) as TrackableKind[]).map((k) => {
                    const Icon = KIND_ICON[k];
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        className={cn(
                          "fm-mono flex flex-col items-center gap-1 rounded-sm border px-2 py-2.5 text-[9px] font-bold tracking-[0.12em] uppercase transition-colors",
                          kind === k
                            ? "border-[var(--fm-accent-deep)] bg-[rgba(127,180,201,0.1)] text-[var(--fm-accent)]"
                            : "border-[var(--fm-line)] text-[var(--fm-mut)] hover:text-[var(--fm-ink)]",
                        )}
                      >
                        <Icon className="size-4" />
                        {KIND_LABEL[k]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="fm-label-field" htmlFor="asset-name">
                  Name
                </label>
                <input
                  id="asset-name"
                  className="fm-input"
                  placeholder={
                    kind === "personnel"
                      ? "e.g. R. Menon"
                      : kind === "vehicle"
                        ? "e.g. Sno-Cat 3"
                        : "e.g. Supply Cache SC-4"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {kind === "personnel" && (
                <div>
                  <label className="fm-label-field" htmlFor="asset-callsign">
                    Callsign (optional)
                  </label>
                  <input
                    id="asset-callsign"
                    className="fm-input fm-mono text-[13px]"
                    placeholder="auto: FD-06"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="fm-label-field" htmlFor="asset-meta">
                  {kind === "personnel" ? "Role" : kind === "vehicle" ? "Vehicle type" : "Beacon class"}
                </label>
                <input
                  id="asset-meta"
                  className="fm-input"
                  placeholder={
                    kind === "personnel"
                      ? "e.g. Glaciologist"
                      : kind === "vehicle"
                        ? "e.g. Tracked Transport"
                        : "e.g. Supply cache"
                  }
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                />
              </div>

              <div>
                <span className="fm-label-field">Initial position</span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "gps", label: "Device GPS" },
                      { id: "maitri", label: "Maitri" },
                      { id: "bharati", label: "Bharati" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setPosMode(o.id)}
                      className={cn(
                        "fm-mono rounded-sm border px-2 py-1.5 text-[9px] font-bold tracking-[0.1em] uppercase transition-colors",
                        posMode === o.id
                          ? "border-[var(--fm-accent-deep)] bg-[rgba(127,180,201,0.1)] text-[var(--fm-accent)]"
                          : "border-[var(--fm-line)] text-[var(--fm-mut)] hover:text-[var(--fm-ink)]",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim() || busy}
                className="fm-btn fm-btn-solid w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Crosshair className="size-3.5" />
                {busy ? "Acquiring GPS…" : "Register & track"}
              </button>
              {fixMsg && (
                <p className="fm-mono text-[10px] leading-relaxed text-[var(--fm-accent)]">
                  {fixMsg}
                </p>
              )}
              <p className="fm-mono text-[9px] leading-relaxed text-[var(--fm-mut)] uppercase">
                Registered assets sync to the HQ fleet registry and appear on the tactical map as draggable GPS markers.
              </p>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="fm-body text-[13px] leading-relaxed">
                Push a real device-GPS fix into any tracked asset from its row on
                the left, or open it for full telemetry and live tracking.
              </p>
              <div className="fm-panel-2 space-y-2 p-3">
                <p className="fm-mono text-[10px] leading-relaxed text-[var(--fm-mut)]">
                  · Drag a marker on the map = field GPS fix, queued for HQ sync
                  <br />
                  · Live track = beacon follows this handset continuously
                  <br />
                  · Recover/retire = removed from roster, map and server registry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="fm-btn fm-btn-solid w-full"
              >
                <Plus className="size-3.5" /> Track a new asset
              </button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
