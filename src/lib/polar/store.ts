import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { routeDistanceKm } from "./geo";
import { SEED_CARGO, SEED_PERSONNEL, SEED_ROUTES, SEED_VEHICLES } from "./seed";
import type {
  CargoItem,
  CargoLogEntry,
  GeoPos,
  LinkStatus,
  PersonnelStatus,
  PlannedRoute,
  PolarState,
  QueuedEvent,
  RouteWaypoint,
  StockStatus,
} from "./types";
import { useNetworkStatus } from "./use-network-status";

const STORAGE_KEY = "ncpor.polar.engine.v2";

/* ---------- formatting helpers (public API preserved) ---------- */

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function fmtUtc(d: Date | number) {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toISOString().slice(11, 19);
}

export function fmtRel(ms: number) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function fmtDuration(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function stockStatus(item: CargoItem): StockStatus {
  if (item.stock <= 0) return "DEPLETED";
  if (item.stock <= item.threshold) return "CRITICAL";
  if (item.stock >= item.capacity * 0.85) return "SURPLUS";
  return "OPTIMAL";
}

export { distanceKm, routeDistanceKm } from "./geo";

export interface FuelEstimate {
  distanceKm: number;
  etaMin: number;
  fuelLiters: number;
  tempFactor: number;
  perKm: number;
}

export function estimateRoute(opts: {
  distanceKm: number;
  crew: number;
  payloadKg: number;
  tempC: number;
  speedKmh: number;
}): FuelEstimate {
  const { distanceKm, crew, payloadKg, tempC, speedKmh } = opts;
  const tempFactor = tempC <= -50 ? 1.55 : tempC <= -35 ? 1.35 : tempC <= -20 ? 1.2 : 1.08;
  const perKm = 0.9 + crew * 0.06 + payloadKg * 0.004;
  const fuelLiters = Math.round(distanceKm * perKm * tempFactor * 10) / 10;
  const etaMin = speedKmh > 0 ? (distanceKm / speedKmh) * 60 : 0;
  return { distanceKm, etaMin, fuelLiters, tempFactor, perKm };
}

/* ---------- persistence ---------- */

function seedState(): PolarState {
  return {
    v: 2,
    drillMode: null,
    personnel: SEED_PERSONNEL,
    vehicles: SEED_VEHICLES,
    cargo: SEED_CARGO,
    cargoLog: [],
    pending: [],
    routes: SEED_ROUTES,
    lastSync: null,
    expeditionStart: Date.now() - 51_840_000, // D+60 flavor for the topbar clock
    sos: [],
  };
}

function loadState(): PolarState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PolarState;
      if (parsed && parsed.v === 2 && Array.isArray(parsed.personnel)) {
        return { ...seedState(), ...parsed };
      }
    }
  } catch {
    // corrupted store — fall through to reseed
  }
  return seedState();
}

type ConvexClient = ReturnType<typeof useConvex>;

/** Send one queued event to its expedition mutation on the server. */
async function sendEvent(client: ConvexClient, evt: QueuedEvent) {
  switch (evt.kind) {
    case "CARGO_LOG":
      if (!evt.cargo) return;
      await client.mutation(api.expedition.logCargo, {
        itemId: evt.cargo.itemId,
        itemName: evt.cargo.itemName,
        kind: evt.cargo.kind,
        qty: evt.cargo.qty,
        note: evt.cargo.note,
        at: evt.at,
        clientId: evt.clientId,
      });
      return;
    case "STATUS":
      if (!evt.status) return;
      await client.mutation(api.expedition.setPersonnelStatus, {
        personnelId: evt.status.personnelId,
        callsign: evt.status.callsign,
        status: evt.status.status,
        at: evt.at,
      });
      return;
    case "ASSET_MOVE":
      if (!evt.move) return;
      await client.mutation(api.expedition.recordAssetPosition, {
        assetKind: evt.move.assetKind,
        assetId: evt.move.assetId,
        label: evt.move.label,
        pos: evt.move.pos,
        at: evt.at,
      });
      return;
    case "ROUTE":
      if (!evt.route) return;
      await client.mutation(api.expedition.saveRoute, {
        name: evt.route.name,
        waypoints: evt.route.waypoints.map((w) => ({
          kind: w.kind,
          refId: w.refId,
          label: w.label,
          pos: w.pos,
        })),
        at: evt.at,
      });
      return;
    case "SOS":
      if (!evt.sos) return;
      await client.mutation(api.expedition.reportSos, {
        personnelId: evt.sos.personnelId,
        callsign: evt.sos.callsign,
        pos: evt.sos.pos,
        resolved: evt.sos.resolved,
        at: evt.at,
      });
      return;
    default:
      await client.mutation(api.expedition.pushEvent, {
        clientId: evt.clientId,
        kind: evt.kind,
        label: evt.label,
        at: evt.at,
      });
  }
}

/* ---------- store hook ---------- */

export function usePolarStore() {
  const [state, setState] = useState<PolarState>(() => loadState());
  const [syncing, setSyncing] = useState(false);
  const convex = useConvex();

  // Real uplink measurement + the commander's drill override.
  // "checking" (first paint, no measurement yet) is treated optimistically as
  // good — a failed flush just stays queued and retries when the probe lands.
  const measured = useNetworkStatus();
  const link: LinkStatus = state.drillMode ?? (measured === "checking" ? "good" : measured);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Local-first persistence (debounced write to localStorage).
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage full/unavailable — UI keeps working in memory
      }
    }, 150);
    return () => window.clearTimeout(t);
  }, [state]);

  /**
   * Real flush: walks the queue oldest-first and pushes each event through its
   * Convex mutation. `synced` flags flip only after the server acknowledges;
   * a failed event stops the pass and stays queued for the next retry.
   * Re-runs on link change, queue change and when the previous pass releases.
   */
  useEffect(() => {
    if (link === "down" || syncing || state.pending.length === 0) return;

    let cancelled = false;
    setSyncing(true);
    (async () => {
      try {
        // Snapshot the queue — events enqueued during the flush are picked up
        // when this effect re-runs after `syncing` releases.
        const queue = [...stateRef.current.pending].reverse(); // oldest first
        for (const evt of queue) {
          if (cancelled) return;
          try {
            await sendEvent(convex, evt);
          } catch (err) {
            console.warn("[POLARIS sync] event failed, still queued:", evt.kind, err);
            break; // stop the pass; the effect re-runs to retry
          }
          if (cancelled) return;
          setState((s) => ({
            ...s,
            pending: s.pending.filter((p) => p.clientId !== evt.clientId),
            cargoLog: s.cargoLog.map((e) =>
              e.clientId === evt.clientId ? { ...e, synced: true } : e,
            ),
            routes: s.routes.map((r) =>
              r.clientId === evt.clientId ? { ...r, synced: true } : r,
            ),
            sos: s.sos.map((i) =>
              i.clientId === evt.clientId
                ? { ...i, synced: true }
                : i.resolvedClientId === evt.clientId
                  ? { ...i, resolvedSynced: true }
                  : i,
            ),
            lastSync: Date.now(),
          }));
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [convex, link, syncing, state.pending.length]);

  const setDrillMode = useCallback((mode: LinkStatus | null) => {
    setState((s) => ({ ...s, drillMode: mode }));
  }, []);

  const forceSync = useCallback(() => {
    // Flush is reactive; retried immediately via a state touch.
    setState((s) => ({ ...s }));
  }, []);

  const logCargo = useCallback(
    (itemId: string, kind: CargoLogEntry["kind"], qty: number, note: string) => {
      setState((s) => {
        const item = s.cargo.find((c) => c.id === itemId);
        if (!item || qty <= 0) return s;
        const delta = kind === "INCOMING" ? qty : -qty;
        const stock = Math.max(0, Math.min(item.capacity, item.stock + delta));
        const clientId = uid("log");
        const entry: CargoLogEntry = {
          id: clientId,
          itemId,
          itemName: item.name,
          kind,
          qty,
          note,
          at: Date.now(),
          synced: false,
          clientId,
        };
        return {
          ...s,
          cargo: s.cargo.map((c) =>
            c.id === itemId ? { ...c, stock, updatedAt: Date.now() } : c,
          ),
          cargoLog: [entry, ...s.cargoLog].slice(0, 40),
          pending: [
            {
              clientId,
              at: Date.now(),
              kind: "CARGO_LOG",
              label: `${kind === "INCOMING" ? "+" : "−"}${qty} ${item.unit} · ${item.name}`,
              cargo: { itemId, itemName: item.name, kind, qty, note },
            },
            ...s.pending,
          ],
        };
      });
    },
    [],
  );

  const setPersonnelStatus = useCallback((personnelId: string, status: PersonnelStatus) => {
    setState((s) => {
      const p = s.personnel.find((x) => x.id === personnelId);
      if (!p) return s;
      const clientId = uid("st");
      return {
        ...s,
        personnel: s.personnel.map((x) =>
          x.id === personnelId ? { ...x, status, lastPing: Date.now() } : x,
        ),
        pending: [
          {
            clientId,
            at: Date.now(),
            kind: "STATUS",
            label: `${p.callsign} → ${status}`,
            status: { personnelId, callsign: p.callsign, status },
          },
          ...s.pending,
        ],
      };
    });
  }, []);

  const moveAsset = useCallback(
    (kind: "personnel" | "vehicle", id: string, pos: GeoPos) => {
      setState((s) => {
        const label =
          kind === "personnel"
            ? s.personnel.find((x) => x.id === id)?.callsign ?? id
            : s.vehicles.find((x) => x.id === id)?.name ?? id;
        const clientId = uid("mv");
        return {
          ...s,
          personnel:
            kind === "personnel"
              ? s.personnel.map((x) =>
                  x.id === id ? { ...x, pos, lastPing: Date.now() } : x,
                )
              : s.personnel,
          vehicles:
            kind === "vehicle"
              ? s.vehicles.map((x) => (x.id === id ? { ...x, pos } : x))
              : s.vehicles,
          pending: [
            {
              clientId,
              at: Date.now(),
              kind: "ASSET_MOVE",
              label: `${label} position fix ${pos.lat.toFixed(4)}, ${pos.lon.toFixed(4)}`,
              move: { assetKind: kind, assetId: id, label, pos },
            },
            ...s.pending,
          ],
        };
      });
    },
    [],
  );

  const raiseSos = useCallback((personnelId: string) => {
    setState((s) => {
      const p = s.personnel.find((x) => x.id === personnelId);
      if (!p) return s;
      const clientId = uid("sos");
      const incident = { id: clientId, personnelId, at: Date.now(), resolved: false, clientId };
      return {
        ...s,
        personnel: s.personnel.map((x) =>
          x.id === personnelId ? { ...x, status: "DISTRESS" as const, lastPing: Date.now() } : x,
        ),
        pending: [
          {
            clientId,
            at: Date.now(),
            kind: "SOS",
            label: `MAYDAY · ${p.callsign}`,
            sos: { personnelId, callsign: p.callsign, pos: p.pos, resolved: false },
          },
          ...s.pending,
        ],
        sos: [incident, ...s.sos],
      };
    });
  }, []);

  const resolveSos = useCallback((personnelId: string) => {
    setState((s) => {
      const p = s.personnel.find((x) => x.id === personnelId);
      if (!p) return s;
      const clientId = uid("sosr");
      return {
        ...s,
        personnel: s.personnel.map((x) =>
          x.id === personnelId && x.status === "DISTRESS"
            ? { ...x, status: "STANDBY" as PersonnelStatus }
            : x,
        ),
        pending: [
          {
            clientId,
            at: Date.now(),
            kind: "SOS",
            label: `Stand down · ${p.callsign}`,
            sos: { personnelId, callsign: p.callsign, pos: p.pos, resolved: true },
          },
          ...s.pending,
        ],
        sos: s.sos.map((i) =>
          i.personnelId === personnelId && !i.resolved
            ? { ...i, resolved: true, resolvedClientId: clientId }
            : i,
        ),
      };
    });
  }, []);

  const saveRoute = useCallback((name: string, waypoints: RouteWaypoint[]) => {
    setState((s) => {
      const clientId = uid("r");
      const route: PlannedRoute = {
        id: clientId,
        clientId,
        name: name.trim() || "Unnamed Traverse",
        waypoints,
        createdAt: Date.now(),
        synced: false,
      };
      return {
        ...s,
        routes: [route, ...s.routes].slice(0, 12),
        pending: [
          {
            clientId,
            at: Date.now(),
            kind: "ROUTE",
            label: `Route planned · ${route.name}`,
            route: { name: route.name, waypoints },
          },
          ...s.pending,
        ],
      };
    });
  }, []);

  const meshRttMs = useMemo(() => {
    if (link === "down") return null;
    return link === "lowband" ? 4200 : 320;
  }, [link]);

  return {
    state,
    link,
    measured,
    syncing,
    meshRttMs,
    setDrillMode,
    forceSync,
    logCargo,
    setPersonnelStatus,
    moveAsset,
    raiseSos,
    resolveSos,
    saveRoute,
  };
}

export type PolarStore = ReturnType<typeof usePolarStore>;
