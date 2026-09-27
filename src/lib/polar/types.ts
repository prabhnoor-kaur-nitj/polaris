// Domain types for the POLARIS expedition logistics system.
// Field state is offline-first (localStorage) and syncs to the Convex
// expedition backend when a real uplink is available.

/** Real geographic position in decimal degrees (WGS-84). */
export interface GeoPos {
  lat: number; // negative = southern hemisphere
  lon: number; // negative = western hemisphere
}

/**
 * Real uplink status, measured — not simulated:
 * - "good": navigator.onLine AND heartbeat round-trip under HIGHBAND_MS
 * - "lowband": navigator.onLine AND heartbeat succeeded but slowly
 * - "down": navigator offline or heartbeat fetch failed
 */
export type LinkStatus = "good" | "lowband" | "down";

export type StockStatus = "CRITICAL" | "OPTIMAL" | "DEPLETED" | "SURPLUS";

export type PersonnelStatus = "ACTIVE" | "STANDBY" | "REST" | "DISTRESS";

export type AssetKind = "PERSONNEL" | "VEHICLE" | "SUPPLY_NODE" | "STATION";

export interface Station {
  id: string;
  name: string;
  code: string;
  pos: GeoPos;
}

export interface SupplyNode {
  id: string;
  name: string;
  pos: GeoPos;
}

export interface Personnel {
  id: string;
  callsign: string;
  name: string;
  role: string;
  status: PersonnelStatus;
  battery: number; // %
  oxygen: number; // %
  supplies: number; // %
  lastPing: number; // epoch ms
  pos: GeoPos;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  fuel: number; // %
  speedKmh: number;
  pos: GeoPos;
  available: boolean;
}

export interface CargoItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  threshold: number;
  capacity: number;
  updatedAt: number;
}

export interface CargoLogEntry {
  id: string;
  itemId: string;
  itemName: string;
  kind: "OUTGOING" | "INCOMING";
  qty: number;
  note: string;
  at: number;
  /** True only after the Convex mutation that recorded this row succeeded. */
  synced: boolean;
  /** Idempotency key used for the server write. */
  clientId: string;
}

export interface RouteWaypoint {
  id: string;
  kind: "STATION" | "SUPPLY_NODE" | "CUSTOM";
  refId?: string;
  label: string;
  pos: GeoPos;
}

export interface PlannedRoute {
  id: string;
  name: string;
  waypoints: RouteWaypoint[];
  createdAt: number;
  /** Idempotency key for the server write (empty for seed routes). */
  clientId?: string;
  /** True once the server write has been acknowledged. */
  synced?: boolean;
}

/** One queued outbound field event, flushed to Convex in order. */
export interface QueuedEvent {
  /** Idempotency key — same value is sent to the server mutation. */
  clientId: string;
  at: number;
  kind: "CARGO_LOG" | "STATUS" | "ASSET_MOVE" | "ROUTE" | "SOS";
  label: string;
  cargo?: {
    itemId: string;
    itemName: string;
    kind: "OUTGOING" | "INCOMING";
    qty: number;
    note: string;
  };
  status?: { personnelId: string; callsign: string; status: PersonnelStatus };
  move?: {
    assetKind: "personnel" | "vehicle";
    assetId: string;
    label: string;
    pos: GeoPos;
  };
  route?: { name: string; waypoints: RouteWaypoint[] };
  sos?: { personnelId: string; callsign: string; pos: GeoPos; resolved: boolean };
}

/** A committed server event, as returned by the expedition feed. */
export interface SyncedEvent {
  _id: string;
  kind: string;
  label: string;
  at: number;
}

export interface SosIncident {
  id: string;
  personnelId: string;
  at: number;
  resolved: boolean;
  /** Idempotency key of the raise event ("" for seed data). */
  clientId?: string;
  /** True once the raise event has been acknowledged by the server. */
  synced?: boolean;
  /** Idempotency key of the resolve event, once resolved. */
  resolvedClientId?: string;
  /** True once the resolve event has been acknowledged by the server. */
  resolvedSynced?: boolean;
}

export interface PolarState {
  v: 2;
  /** Manual drill override — null means "use the measured link status". */
  drillMode: LinkStatus | null;
  personnel: Personnel[];
  vehicles: Vehicle[];
  cargo: CargoItem[];
  cargoLog: CargoLogEntry[];
  pending: QueuedEvent[];
  routes: PlannedRoute[];
  sos: SosIncident[];
  lastSync: number | null;
  expeditionStart: number;
}
