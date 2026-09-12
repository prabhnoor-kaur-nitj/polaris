// Domain types for the NCPOR Polar Logistics Engine UI.
// All state is client-side and localStorage-persisted (offline-first).

export type NetworkMode = "online" | "lowband" | "offline";

export type StockStatus = "CRITICAL" | "OPTIMAL" | "DEPLETED" | "SURPLUS";

export type PersonnelStatus = "ACTIVE" | "STANDBY" | "REST" | "DISTRESS";

export type AssetKind = "PERSONNEL" | "VEHICLE" | "SUPPLY_NODE" | "STATION";

export interface MapPos {
  x: number; // percent 0-100
  y: number; // percent 0-100
}

export interface Station {
  id: string;
  name: string;
  code: string;
  pos: MapPos;
}

export interface SupplyNode {
  id: string;
  name: string;
  pos: MapPos;
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
  pos: MapPos;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  fuel: number; // %
  speedKmh: number;
  pos: MapPos;
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
  synced: boolean;
}

export interface RouteWaypoint {
  id: string;
  kind: "STATION" | "SUPPLY_NODE" | "CUSTOM";
  refId?: string;
  label: string;
  pos: MapPos;
}

export interface PlannedRoute {
  id: string;
  name: string;
  waypoints: RouteWaypoint[];
  createdAt: number;
}

export interface PendingEvent {
  id: string;
  at: number;
  kind: string;
  label: string;
}

export interface SosIncident {
  id: string;
  personnelId: string;
  at: number;
  resolved: boolean;
}

export interface PolarState {
  v: 1;
  networkMode: NetworkMode;
  personnel: Personnel[];
  vehicles: Vehicle[];
  cargo: CargoItem[];
  cargoLog: CargoLogEntry[];
  pending: PendingEvent[];
  routes: PlannedRoute[];
  sos: SosIncident[];
  lastSync: number | null;
  expeditionStart: number;
}
