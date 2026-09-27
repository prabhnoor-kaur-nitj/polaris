import type {
  Beacon,
  CargoItem,
  Personnel,
  PlannedRoute,
  Station,
  SupplyNode,
  Vehicle,
} from "./types";

// Real coordinates. Maitri and Bharati are the Indian Antarctic stations;
// supply nodes are sited on realistic shelf/ice terrain near them.
export const STATIONS: Station[] = [
  {
    id: "st-maitri",
    name: "Maitri Station",
    code: "MAITRI",
    pos: { lat: -70.6667, lon: 11.8667 },
  },
  {
    id: "st-bharati",
    name: "Bharati Station",
    code: "BHARATI",
    pos: { lat: -69.4008, lon: 76.1864 },
  },
];

export const SUPPLY_NODES: SupplyNode[] = [
  {
    id: "sn-fuel",
    name: "Fuel Depot F1",
    pos: { lat: -70.7, lon: 12.1 }, // shelf edge near Maitri
  },
  {
    id: "sn-med",
    name: "Medical Cache M2",
    pos: { lat: -70.6, lon: 11.5 }, // inland west of Maitri
  },
  {
    id: "sn-radar",
    name: "Radar Post R7",
    pos: { lat: -69.55, lon: 75.9 }, // Approach to Bharati
  },
];

export const SEED_PERSONNEL: Personnel[] = [
  {
    id: "p-01",
    callsign: "SC-01",
    name: "Cdr. A. Sharma",
    role: "Station Commander",
    status: "ACTIVE",
    battery: 92,
    oxygen: 98,
    supplies: 84,
    lastPing: Date.now() - 40_000,
    pos: { lat: -70.6712, lon: 11.9281 },
  },
  {
    id: "p-02",
    callsign: "MT-04",
    name: "R. Iyer",
    role: "Meteorologist",
    status: "ACTIVE",
    battery: 61,
    oxygen: 95,
    supplies: 55,
    lastPing: Date.now() - 120_000,
    pos: { lat: -70.6554, lon: 11.7955 },
  },
  {
    id: "p-03",
    callsign: "GL-07",
    name: "T. Norphel",
    role: "Glaciologist",
    status: "STANDBY",
    battery: 34,
    oxygen: 91,
    supplies: 40,
    lastPing: Date.now() - 300_000,
    pos: { lat: -70.5891, lon: 11.6317 },
  },
  {
    id: "p-04",
    callsign: "ME-12",
    name: "S. Banerjee",
    role: "Mechanic",
    status: "REST",
    battery: 78,
    oxygen: 99,
    supplies: 70,
    lastPing: Date.now() - 90_000,
    pos: { lat: -70.6823, lon: 11.8412 },
  },
  {
    id: "p-05",
    callsign: "CM-09",
    name: "L. Tsering",
    role: "Comms Officer",
    status: "ACTIVE",
    battery: 55,
    oxygen: 96,
    supplies: 62,
    lastPing: Date.now() - 60_000,
    pos: { lat: -70.6601, lon: 11.9032 },
  },
];

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: "v-01",
    name: "Sno-Cat 1",
    type: "Tracked Transport",
    fuel: 82,
    speedKmh: 18,
    pos: { lat: -70.669, lon: 11.8995 },
    available: true,
  },
  {
    id: "v-02",
    name: "Sno-Cat 2",
    type: "Tracked Transport",
    fuel: 27,
    speedKmh: 18,
    pos: { lat: -70.6745, lon: 11.8533 },
    available: true,
  },
  {
    id: "v-03",
    name: "Skidoo Alpha",
    type: "Light Recon",
    fuel: 64,
    speedKmh: 45,
    pos: { lat: -70.648, lon: 11.9102 },
    available: true,
  },
  {
    id: "v-04",
    name: "Kamaz Resupply",
    type: "Heavy Haul",
    fuel: 0,
    speedKmh: 0,
    pos: { lat: -70.6621, lon: 11.8203 },
    available: false,
  },
];

export const SEED_BEACONS: Beacon[] = [
  {
    id: "b-sc3",
    name: "Supply Cache SC-3",
    kind: "Supply cache",
    pos: { lat: -70.6431, lon: 11.782 },
    lastFix: Date.now() - 600_000,
    battery: 71,
  },
  {
    id: "b-w2",
    name: "Weather Mast W-2",
    kind: "Weather mast",
    pos: { lat: -70.5955, lon: 11.964 },
    lastFix: Date.now() - 1_800_000,
    battery: 44,
  },
];

export const SEED_CARGO: CargoItem[] = [
  {
    id: "c-01",
    name: "Emergency Rations",
    category: "Survival",
    unit: "crates",
    stock: 46,
    threshold: 20,
    capacity: 120,
    updatedAt: Date.now() - 3_600_000,
  },
  {
    id: "c-02",
    name: "Jet Fuel A-1",
    category: "Fuel",
    unit: "barrels",
    stock: 14,
    threshold: 18,
    capacity: 80,
    updatedAt: Date.now() - 1_800_000,
  },
  {
    id: "c-03",
    name: "Heating Oil",
    category: "Fuel",
    unit: "drums",
    stock: 9,
    threshold: 10,
    capacity: 60,
    updatedAt: Date.now() - 900_000,
  },
  {
    id: "c-04",
    name: "Solar Array Panels",
    category: "Power",
    unit: "units",
    stock: 12,
    threshold: 4,
    capacity: 20,
    updatedAt: Date.now() - 7_200_000,
  },
  {
    id: "c-05",
    name: "Medical Kits",
    category: "Medical",
    unit: "kits",
    stock: 3,
    threshold: 5,
    capacity: 25,
    updatedAt: Date.now() - 540_000,
  },
  {
    id: "c-06",
    name: "Thermal Batteries",
    category: "Power",
    unit: "cells",
    stock: 0,
    threshold: 8,
    capacity: 40,
    updatedAt: Date.now() - 300_000,
  },
];

export const SEED_ROUTES: PlannedRoute[] = [
  {
    id: "r-01",
    name: "Maitri → Bharati Convoy",
    createdAt: Date.now() - 86_400_000,
    waypoints: [
      {
        id: "w-1",
        kind: "STATION",
        refId: "st-maitri",
        label: "Maitri Station",
        pos: STATIONS[0].pos,
      },
      {
        id: "w-2",
        kind: "SUPPLY_NODE",
        refId: "sn-fuel",
        label: "Fuel Depot F1",
        pos: SUPPLY_NODES[0].pos,
      },
      {
        id: "w-3",
        kind: "STATION",
        refId: "st-bharati",
        label: "Bharati Station",
        pos: STATIONS[1].pos,
      },
    ],
  },
];
