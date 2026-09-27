// Real GIS tactical map: MapLibre GL over Carto dark basemap tiles, real
// WGS-84 coordinates, draggable asset markers that record real position fixes.
// When tiles are unreachable the instrument still reports coordinates and the
// rescue solve over the hairline graticule — never a blank box.

import { StatusBadge, useNow } from "@/components/polar/hud";
import { fmtLat, fmtLon } from "@/lib/polar/geo";
import { STATIONS, SUPPLY_NODES } from "@/lib/polar/seed";
import { distanceKm, fmtUtc, type PolarStore } from "@/lib/polar/store";
import type { GeoPos, TrackableKind } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Compass, Crosshair, Move, Navigation, TriangleAlert, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const TILE_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  // No opaque background layer: the graticule div behind the canvas stays
  // visible wherever tiles are missing (offline chart mode).
  layers: [{ id: "carto", type: "raster" as const, source: "carto", paint: { "raster-opacity": 0.92 } }],
};

/** Field region: Maitri sector (11–13°E) through Bharati sector (75–77°E). */
const FIELD_BOUNDS: maplibregl.LngLatBoundsLike = [
  [10.5, -71.2],
  [77.5, -69.0],
];

const ICONS = {
  beacon:
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8c2 2 2.26 5.10.8 7.47"/><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1"/><path d="M12 12v9"/><path d="m9 18 3 3 3-3"/></svg>',
  user:
    '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  truck:
    '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/></svg>',
  tower:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8c2 2 2.26 5.10.8 7.47"/><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1"/><path d="M9.5 18h5"/><path d="m12 13 4 11"/><path d="m12 13-4 11"/></svg>',
  pkg:
    '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
} as const;

type MarkerTone = "good" | "warn" | "accent" | "alert" | "muted";

function buildMarkerEl(opts: {
  icon: string;
  label: string;
  tone: MarkerTone;
  round?: boolean;
  small?: boolean;
}) {
  const el = document.createElement("div");
  el.className = "polar-marker";
  el.dataset.tone = opts.tone;
  el.innerHTML =
    `<span class="polar-marker-icon${opts.round ? " is-round" : ""}${opts.small ? " is-small" : ""}">${opts.icon}</span>` +
    (opts.label ? `<span class="polar-marker-label">${opts.label}</span>` : "");
  return el;
}

function toneForPersonnel(status: string): MarkerTone {
  if (status === "DISTRESS") return "alert";
  if (status === "ACTIVE") return "good";
  if (status === "STANDBY") return "warn";
  return "muted";
}

export type AssetSelection = { kind: TrackableKind; id: string } | null;

export function TacticalMap({
  store,
  onSelectAsset,
  focus,
}: {
  store: PolarStore;
  onSelectAsset: (kind: TrackableKind, id: string) => void;
  focus: { kind: TrackableKind; id: string; nonce: number } | null;
}) {
  const { state, moveAsset, link } = store;
  const now = useNow(1000);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const assetMarkersRef = useRef<Map<string, MlMarker>>(new Map());
  const siteMarkersRef = useRef<MlMarker[]>([]);
  const draggingRef = useRef<string | null>(null);
  const justDraggedRef = useRef(false);
  const selectRef = useRef(onSelectAsset);
  selectRef.current = onSelectAsset;

  const [mapReady, setMapReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [mapCrashed, setMapCrashed] = useState<string | null>(null);
  const [view, setView] = useState<{ lat: number; lon: number; zoom: number }>({
    lat: -70.2,
    lon: 30,
    zoom: 3,
  });

  /* ---------- create / destroy the map ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let map: MlMap;
    try {
      map = new maplibregl.Map({
        container,
        style: TILE_STYLE as maplibregl.StyleSpecification,
        center: [30, -70.2],
        zoom: 3,
        attributionControl: false,
        renderWorldCopies: false,
        maxZoom: 11,
        dragRotate: false,
        touchPitch: false,
      });
    } catch (err) {
      // No WebGL2 in the runtime (some sandboxed preview iframes): report it
      // on the instrument instead of silently rendering an empty box.
      setMapCrashed(
        err instanceof Error
          ? err.message
          : "Map engine failed to start (WebGL unavailable?)",
      );
      return;
    }
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    let tileErrorSeen = false;
    map.on("error", (e: unknown) => {
      const src = (e as { sourceId?: string }).sourceId;
      if (src === "carto") {
        if (!tileErrorSeen) {
          tileErrorSeen = true;
          setTilesFailed(true);
        }
        return;
      }
      console.warn("[POLARIS map]", e);
    });

    const onView = () => {
      const c = map.getCenter();
      setView({ lat: c.lat, lon: c.lng, zoom: map.getZoom() });
    };
    map.on("moveend", onView);
    map.on("zoomend", onView);

    map.on("load", () => {
      setMapReady(true);
      map.fitBounds(FIELD_BOUNDS, { padding: 48, duration: 0, maxZoom: 4 });
      onView();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      assetMarkersRef.current.clear();
      siteMarkersRef.current = [];
      setMapReady(false);
      setTilesFailed(false);
    };
  }, []);

  /* ---------- static site markers (stations + supply nodes) ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const markers: MlMarker[] = [];
    for (const s of STATIONS) {
      const el = buildMarkerEl({ icon: ICONS.tower, label: s.code, tone: "accent" });
      el.classList.add("is-site");
      markers.push(
        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([s.pos.lon, s.pos.lat])
          .addTo(map),
      );
    }
    for (const sn of SUPPLY_NODES) {
      const el = buildMarkerEl({ icon: ICONS.pkg, label: sn.name.split(" ")[0].toUpperCase(), tone: "accent", small: true });
      el.classList.add("is-site");
      markers.push(
        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([sn.pos.lon, sn.pos.lat])
          .addTo(map),
      );
    }
    siteMarkersRef.current = markers;

    return () => {
      for (const m of markers) m.remove();
      siteMarkersRef.current = [];
    };
  }, [mapReady]);

  /* ---------- routes + rescue solve as GeoJSON layers ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const distress = state.personnel.find((p) => p.status === "DISTRESS");
    let rescueCoords: [number, number][] | null = null;
    if (distress) {
      let best: { pos: GeoPos } | null = null;
      let bestKm = Infinity;
      for (const v of state.vehicles) {
        const km = distanceKm(v.pos, distress.pos);
        if (km < bestKm) {
          bestKm = km;
          best = { pos: v.pos };
        }
      }
      if (best) {
        rescueCoords = [
          [best.pos.lon, best.pos.lat],
          [distress.pos.lon, distress.pos.lat],
        ];
      }
    }

    if (!map.getSource("polar-routes")) {
      map.addSource("polar-routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: state.routes
            .filter((r) => r.waypoints.length > 1)
            .map((r) => ({
              type: "Feature" as const,
              properties: { name: r.name },
              geometry: {
                type: "LineString" as const,
                coordinates: r.waypoints.map((w) => [w.pos.lon, w.pos.lat] as [number, number]),
              },
            })),
        },
      });
      map.addSource("polar-rescue", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features:
            rescueCoords !== null
              ? [
                  {
                    type: "Feature" as const,
                    properties: {},
                    geometry: { type: "LineString" as const, coordinates: rescueCoords },
                  },
                ]
              : [],
        },
      });
      map.addLayer({
        id: "polar-routes-line",
        type: "line",
        source: "polar-routes",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#7fb4c9", "line-width": 2, "line-opacity": 0.8 },
      });
      map.addLayer({
        id: "polar-rescue-line",
        type: "line",
        source: "polar-rescue",
        paint: { "line-color": "#d05c4b", "line-width": 2.5, "line-dasharray": [2, 1.5] },
      });
    } else {
      (map.getSource("polar-routes") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: state.routes
          .filter((r) => r.waypoints.length > 1)
          .map((r) => ({
            type: "Feature" as const,
            properties: { name: r.name },
            geometry: {
              type: "LineString" as const,
              coordinates: r.waypoints.map((w) => [w.pos.lon, w.pos.lat] as [number, number]),
            },
          })),
      });
      (map.getSource("polar-rescue") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features:
          rescueCoords !== null
            ? [
                {
                  type: "Feature" as const,
                  properties: {},
                  geometry: { type: "LineString" as const, coordinates: rescueCoords },
                },
              ]
            : [],
      });
    }
  }, [mapReady, state.routes, state.personnel, state.vehicles]);

  /* ---------- draggable asset markers (personnel, vehicles, beacons) ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const want = new Map<
      string,
      { kind: TrackableKind; id: string; label: string; tone: MarkerTone; pos: GeoPos; round: boolean; icon: string }
    >();
    for (const p of state.personnel) {
      want.set(`personnel:${p.id}`, {
        kind: "personnel",
        id: p.id,
        label: p.callsign,
        tone: toneForPersonnel(p.status),
        pos: p.pos,
        round: true,
        icon: ICONS.user,
      });
    }
    for (const v of state.vehicles) {
      want.set(`vehicle:${v.id}`, {
        kind: "vehicle",
        id: v.id,
        label: "",
        tone: v.available ? "accent" : "muted",
        pos: v.pos,
        round: false,
        icon: ICONS.truck,
      });
    }
    for (const b of state.beacons) {
      want.set(`beacon:${b.id}`, {
        kind: "beacon",
        id: b.id,
        label: b.live ? "LIVE GPS" : "",
        tone: b.live ? "good" : "accent",
        pos: b.pos,
        round: false,
        icon: ICONS.beacon,
      });
    }

    for (const [key, spec] of want) {
      let marker = assetMarkersRef.current.get(key);
      if (!marker) {
        const el = buildMarkerEl({
          icon: spec.icon,
          label: spec.label,
          tone: spec.tone,
          round: spec.round,
          small: spec.kind === "beacon",
        });
        el.addEventListener("click", () => {
          if (justDraggedRef.current || draggingRef.current) return;
          selectRef.current(spec.kind, spec.id);
        });
        const m = new maplibregl.Marker({ element: el, draggable: true, anchor: "center" })
          .setLngLat([spec.pos.lon, spec.pos.lat])
          .addTo(map);

        m.on("dragstart", () => {
          draggingRef.current = key;
        });
        m.on("dragend", () => {
          draggingRef.current = null;
          justDraggedRef.current = true;
          window.setTimeout(() => {
            justDraggedRef.current = false;
          }, 120);
          const lngLat = m.getLngLat();
          // Real GPS fix: round-tripped to the store and queued for the server.
          moveAsset(spec.kind, spec.id, {
            lat: Math.round(lngLat.lat * 10000) / 10000,
            lon: Math.round(lngLat.lng * 10000) / 10000,
          });
        });

        assetMarkersRef.current.set(key, m);
        marker = m;
      } else if (draggingRef.current !== key) {
        marker.setLngLat([spec.pos.lon, spec.pos.lat]);
        const el = marker.getElement();
        el.dataset.tone = spec.tone;
        const labelEl = el.querySelector(".polar-marker-label");
        if (labelEl) labelEl.textContent = spec.label;
      }
    }

    for (const [key, marker] of assetMarkersRef.current) {
      if (!want.has(key)) {
        marker.remove();
        assetMarkersRef.current.delete(key);
      }
    }
  }, [mapReady, state.personnel, state.vehicles, state.beacons, moveAsset]);

  /* ---------- locate: fly to a rostered asset on demand ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !focus) return;
    const pos =
      focus.kind === "personnel"
        ? state.personnel.find((p) => p.id === focus.id)?.pos
        : focus.kind === "vehicle"
          ? state.vehicles.find((v) => v.id === focus.id)?.pos
          : state.beacons.find((b) => b.id === focus.id)?.pos;
    if (!pos) return;
    map.flyTo({ center: [pos.lon, pos.lat], zoom: Math.max(map.getZoom(), 8), duration: 900 });
  }, [focus, mapReady, state.personnel, state.vehicles, state.beacons]);

  /* ---------- SOS strip ---------- */
  const rescue = useMemo(() => {
    const distress = state.personnel.filter((p) => p.status === "DISTRESS");
    if (distress.length === 0) return null;
    const target = distress[0];
    let best: { name: string; km: number; speedKmh: number } | null = null;
    for (const v of state.vehicles) {
      const km = distanceKm(v.pos, target.pos);
      if (!best || km < best.km) best = { name: v.name, km, speedKmh: v.speedKmh };
    }
    return best ? { ...best, target } : null;
  }, [state.personnel, state.vehicles]);

  function fmtEta(ms: number) {
    const totalMin = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
  }

  return (
    <div className="fm-panel overflow-hidden">
      {/* Map header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--fm-line-soft)] px-4 py-2.5">
        <Navigation className="size-4 text-[var(--fm-accent)]" />
        <h2 className="fm-mono text-[10.5px] font-semibold tracking-[0.22em] text-[var(--fm-ink)] uppercase">
          Tactical map · WGS-84 · Maitri — Bharati sectors
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge tone="ice">
            <Compass className="size-3" />
            {fmtLat(view.lat)} {fmtLon(view.lon)} · Z{view.zoom.toFixed(1)}
          </StatusBadge>
          <StatusBadge tone="muted">
            <Move className="size-3" /> Drag = GPS fix
          </StatusBadge>
        </div>
      </div>

      {/* The real map */}
      <div className="relative aspect-[16/10] w-full">
        <div className="polar-map-graticule absolute inset-0" />
        <div ref={containerRef} className="absolute inset-0" />

        {!mapReady && (
          <div className="absolute inset-0 grid place-items-center bg-[var(--fm-paper-2)]">
            <span className="fm-label animate-pulse">Acquiring basemap…</span>
          </div>
        )}

        {mapReady && tilesFailed && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
            <span className="fm-chip fm-chip-warn pointer-events-auto">
              <WifiOff className="size-3.5" /> Basemap tiles unreachable — graticule chart mode
            </span>
          </div>
        )}
        {mapReady && !tilesFailed && link === "down" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
            <span className="fm-chip fm-chip-warn pointer-events-auto">
              <WifiOff className="size-3.5" /> Uplink down — showing last cached tiles
            </span>
          </div>
        )}
        {mapCrashed && (
          <div className="absolute inset-0 z-20 grid place-items-center p-4">
            <div className="fm-panel-2 flex max-w-md flex-col items-center gap-2 px-5 py-4 text-center">
              <TriangleAlert className="size-5 text-[var(--fm-warn)]" />
              <span className="fm-mono text-[11px] font-semibold text-[var(--fm-ink)]">
                Map engine offline
              </span>
              <span className="fm-mono text-[10px] leading-relaxed text-[var(--fm-mut)]">
                {mapCrashed} — assets remain listed in the tracker; graticule chart mode active.
              </span>
            </div>
          </div>
        )}

        {/* SOS strip (when active) */}
        {rescue && (
          <div className="absolute top-3 left-3 z-10 flex max-w-lg flex-wrap items-center gap-2 border border-[rgba(208,92,75,0.35)] bg-[rgba(13,16,21,0.88)] px-3 py-2 backdrop-blur-sm">
            <StatusBadge tone="alert" pulse>
              ● SOS — {rescue.target.callsign}
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

        <span className="fm-mono pointer-events-none absolute bottom-2 left-3 z-10 text-[9px] tracking-[0.2em] text-[var(--fm-mut)] uppercase">
          {fmtUtc(now)} UTC · {state.personnel.length + state.vehicles.length + state.beacons.length} assets tracked
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[var(--fm-line-soft)] px-4 py-2">
        <LegendDot color="var(--fm-good)" label="Active" />
        <LegendDot color="var(--fm-warn)" label="Standby" />
        <LegendDot color="var(--fm-accent)" label="Rest / vehicle / beacon / site" />
        <LegendDot color="var(--fm-alert)" label="Distress / SOS" />
        <span className="fm-mono ml-auto text-[9px] tracking-[0.14em] text-[var(--fm-mut)] uppercase">
          Click = inspect · Tiles © OpenStreetMap / CARTO
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
