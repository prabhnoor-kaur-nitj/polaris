import { useCallback, useEffect, useState } from "react";
import { SEED_CARGO, SEED_PERSONNEL, SEED_ROUTES, SEED_VEHICLES } from "./seed";
import type {
  CargoItem,
  CargoLogEntry,
  MapPos,
  NetworkMode,
  Personnel,
  PersonnelStatus,
  PlannedRoute,
  PolarState,
  RouteWaypoint,
  StockStatus,
} from "./types";

const STORAGE_KEY = "ncpor.polar.engine.v1";

/* ---------- helpers ---------- */

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

/** 1% of map ≈ 1.2 km, so the full grid spans ~120 km of ice. */
export function distanceKm(a: MapPos, b: MapPos) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 1.2 * 10) / 10;
}

export function routeDistanceKm(points: MapPos[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceKm(points[i - 1], points[i]);
  return Math.round(total * 10) / 10;
}

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
    v: 1,
    networkMode: "online",
    personnel: SEED_PERSONNEL,
    vehicles: SEED_VEHICLES,
    cargo: SEED_CARGO,
    cargoLog: [],
    pending: [],
    routes: SEED_ROUTES,
    lastSync: Date.now(),
    expeditionStart: Date.now() - 51_840_000, // D+60 for flavor
    sos: [],
  };
}

function loadState(): PolarState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PolarState;
      if (parsed && parsed.v === 1 && Array.isArray(parsed.personnel)) {
        return { ...seedState(), ...parsed };
      }
    }
  } catch {
    // corrupted store — fall through to reseed
  }
  return seedState();
}

/* ---------- store hook ---------- */

export function usePolarStore() {
  const [state, setState] = useState<PolarState>(() => loadState());

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

  // Background sync pump: drains the queue when a link is available.
  useEffect(() => {
    if (state.networkMode === "offline" || state.pending.length === 0) return;
    const interval = state.networkMode === "lowband" ? 5000 : 1600;
    const t = window.setTimeout(() => {
      setState((s) => {
        if (s.networkMode === "offline" || s.pending.length === 0) return s;
        const [flushed, ...rest] = s.pending;
        return {
          ...s,
          pending: rest,
          cargoLog: s.cargoLog.map((e) =>
            e.kind && !e.synced && e.at <= flushed.at ? { ...e, synced: true } : e,
          ),
          lastSync: Date.now(),
        };
      });
    }, interval);
    return () => window.clearTimeout(t);
  }, [state.networkMode, state.pending.length]);

  // Field telemetry drift: batteries drain, distress vitals fall, actives re-ping.
  useEffect(() => {
    const t = window.setInterval(() => {
      setState((s) => ({
        ...s,
        personnel: s.personnel.map((p) =>
          p.status === "DISTRESS"
            ? {
                ...p,
                battery: Math.max(2, p.battery - 1),
                oxygen: Math.max(52, p.oxygen - 2),
                supplies: Math.max(5, p.supplies - 3),
                lastPing: Date.now(),
              }
            : p.status === "ACTIVE"
              ? { ...p, lastPing: Date.now() - Math.floor(Math.random() * 25_000) }
              : p,
        ),
      }));
    }, 10_000);
    return () => window.clearInterval(t);
  }, []);

  const setNetworkMode = useCallback((mode: NetworkMode) => {
    setState((s) => ({ ...s, networkMode: mode }));
  }, []);

  const forceSync = useCallback(() => {
    setState((s) => ({
      ...s,
      pending: [],
      cargoLog: s.cargoLog.map((e) => ({ ...e, synced: true })),
      lastSync: Date.now(),
    }));
  }, []);

  const logCargo = useCallback(
    (itemId: string, kind: CargoLogEntry["kind"], qty: number, note: string) => {
      setState((s) => {
        const item = s.cargo.find((c) => c.id === itemId);
        if (!item || qty <= 0) return s;
        const delta = kind === "INCOMING" ? qty : -qty;
        const stock = Math.max(0, Math.min(item.capacity, item.stock + delta));
        const entry: CargoLogEntry = {
          id: uid("log"),
          itemId,
          itemName: item.name,
          kind,
          qty,
          note,
          at: Date.now(),
          synced: s.networkMode !== "offline",
        };
        return {
          ...s,
          cargo: s.cargo.map((c) =>
            c.id === itemId ? { ...c, stock, updatedAt: Date.now() } : c,
          ),
          cargoLog: [entry, ...s.cargoLog].slice(0, 40),
          pending:
            s.networkMode === "offline"
              ? [
                  {
                    id: uid("evt"),
                    at: Date.now(),
                    kind: "CARGO_LOG",
                    label: `${kind === "INCOMING" ? "+" : "−"}${qty} ${item.unit} · ${item.name}`,
                  },
                  ...s.pending,
                ]
              : s.pending,
        };
      });
    },
    [],
  );

  const setPersonnelStatus = useCallback((personnelId: string, status: PersonnelStatus) => {
    setState((s) => {
      const p = s.personnel.find((x) => x.id === personnelId);
      if (!p) return s;
      return {
        ...s,
        personnel: s.personnel.map((x) =>
          x.id === personnelId ? { ...x, status, lastPing: Date.now() } : x,
        ),
        pending:
          s.networkMode === "offline"
            ? [
                {
                  id: uid("evt"),
                  at: Date.now(),
                  kind: "STATUS",
                  label: `${p.callsign} → ${status}`,
                },
                ...s.pending,
              ]
            : s.pending,
      };
    });
  }, []);

  const moveAsset = useCallback(
    (kind: "personnel" | "vehicle", id: string, pos: MapPos) => {
      setState((s) => {
        const label =
          kind === "personnel"
            ? s.personnel.find((x) => x.id === id)?.callsign ?? id
            : s.vehicles.find((x) => x.id === id)?.name ?? id;
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
          pending:
            s.networkMode === "offline"
              ? [
                  {
                    id: uid("evt"),
                    at: Date.now(),
                    kind: "ASSET_MOVE",
                    label: `${label} repositioned`,
                  },
                  ...s.pending,
                ]
              : s.pending,
        };
      });
    },
    [],
  );

  const raiseSos = useCallback((personnelId: string) => {
    setState((s) => {
      const p = s.personnel.find((x) => x.id === personnelId);
      if (!p) return s;
      const incident = { id: uid("sos"), personnelId, at: Date.now(), resolved: false };
      return {
        ...s,
        personnel: s.personnel.map((x) =>
          x.id === personnelId ? { ...x, status: "DISTRESS" as const, lastPing: Date.now() } : x,
        ),
        pending:
          s.networkMode === "offline"
            ? [
                {
                  id: uid("evt"),
                  at: Date.now(),
                  kind: "SOS",
                  label: `MAYDAY · ${p.callsign}`,
                },
                ...s.pending,
              ]
            : s.pending,
        sos: [incident, ...s.sos],
      };
    });
  }, []);

  const resolveSos = useCallback((personnelId: string) => {
    setState((s) => ({
      ...s,
      personnel: s.personnel.map((x) =>
        x.id === personnelId && x.status === "DISTRESS"
          ? { ...x, status: "STANDBY" as PersonnelStatus }
          : x,
      ),
      sos: s.sos.map((i) => (i.personnelId === personnelId ? { ...i, resolved: true } : i)),
    }));
  }, []);

  const saveRoute = useCallback((name: string, waypoints: RouteWaypoint[]) => {
    setState((s) => {
      const route: PlannedRoute = {
        id: uid("r"),
        name: name.trim() || "Unnamed Traverse",
        waypoints,
        createdAt: Date.now(),
      };
      return {
        ...s,
        routes: [route, ...s.routes].slice(0, 12),
        pending:
          s.networkMode === "offline"
            ? [
                {
                  id: uid("evt"),
                  at: Date.now(),
                  kind: "ROUTE",
                  label: `Route planned · ${route.name}`,
                },
                ...s.pending,
              ]
            : s.pending,
      };
    });
  }, []);

  return {
    state,
    setNetworkMode,
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
