import { Meter, StatusBadge, useNow } from "@/components/polar/hud";
import { fmtLat, fmtLon } from "@/lib/polar/geo";
import { deviceFix } from "@/lib/polar/gps";
import { fmtRel, fmtUtc, type PolarStore } from "@/lib/polar/store";
import type { Beacon, Personnel, PersonnelStatus, TrackableKind, Vehicle } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  BatteryCharging,
  Clock,
  Crosshair,
  Flame,
  Gauge,
  Radio,
  Satellite,
  ShieldAlert,
  Thermometer,
  User,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

const STATUS_TONE: Record<PersonnelStatus, "alert" | "sync" | "warn" | "muted"> = {
  DISTRESS: "alert",
  ACTIVE: "sync",
  STANDBY: "warn",
  REST: "muted",
};

export function MarkerInspector({
  store,
  selection,
  onClose,
}: {
  store: PolarStore;
  selection: { kind: TrackableKind; id: string } | null;
  onClose: () => void;
}) {
  const now = useNow(1000);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const person: Personnel | undefined =
    selection?.kind === "personnel"
      ? store.state.personnel.find((p) => p.id === selection.id)
      : undefined;
  const vehicle: Vehicle | undefined =
    selection?.kind === "vehicle"
      ? store.state.vehicles.find((v) => v.id === selection.id)
      : undefined;
  const beacon: Beacon | undefined =
    selection?.kind === "beacon"
      ? store.state.beacons.find((b) => b.id === selection.id)
      : undefined;

  const open = Boolean(person || vehicle || beacon);

  async function gpsFixNow(kind: TrackableKind, id: string) {
    setGpsMsg("Acquiring fix…");
    try {
      const fix = await deviceFix();
      store.moveAsset(kind, id, { lat: fix.lat, lon: fix.lon });
      setGpsMsg(`Fix ±${fix.accuracyM} m — ${fix.lat.toFixed(4)}, ${fix.lon.toFixed(4)}`);
    } catch (err) {
      setGpsMsg(err instanceof Error ? err.message : "GPS fix failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {person && selection?.kind === "personnel" && (
        <DialogContent className="fm max-w-md border-[var(--fm-line)] bg-[var(--fm-paper)] p-6 text-[var(--fm-ink)]" showCloseButton>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <span className="fm-plate size-10">
                <User className="size-5 text-[var(--fm-accent)]" />
              </span>
              <div>
                <DialogTitle className="fm-mono text-base font-bold tracking-[0.12em] text-[var(--fm-ink)]">
                  {person.callsign} · {person.name.toUpperCase()}
                </DialogTitle>
                <DialogDescription className="fm-mono text-[11px] text-[var(--fm-mut)]">
                  {person.role} · {fmtLat(person.pos.lat)} {fmtLon(person.pos.lon)}
                </DialogDescription>
              </div>
              <span className="ml-auto">
                <StatusBadge tone={STATUS_TONE[person.status]} pulse={person.status === "DISTRESS"}>
                  {person.status}
                </StatusBadge>
              </span>
            </div>
          </DialogHeader>

          {/* Vitals */}
          <div className="grid grid-cols-1 gap-3">
            <Meter label="Battery" value={person.battery} tone={person.battery < 25 ? "alert" : undefined} />
            <Meter label="Oxygen" value={person.oxygen} tone={person.oxygen < 70 ? "warn" : undefined} />
            <Meter label="Supplies" value={person.supplies} tone={person.supplies < 30 ? "alert" : undefined} />
          </div>

          {/* Telemetry grid */}
          <div className="fm-panel-2 grid grid-cols-2 gap-x-4 gap-y-2.5 p-3">
            <Telemetry icon={Clock} label="Last Ping" value={`${fmtRel(person.lastPing)} · ${fmtUtc(person.lastPing)}Z`} />
            <Telemetry icon={Radio} label="Link" value={store.link === "down" ? "LOCAL STORE" : store.link === "lowband" ? "NARROWBAND QUEUE" : "SATCOM LIVE"} />
            <Telemetry icon={Gauge} label="Latitude" value={fmtLat(person.pos.lat)} />
            <Telemetry icon={Gauge} label="Longitude" value={fmtLon(person.pos.lon)} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => gpsFixNow("personnel", person.id)}
              className="fm-btn fm-btn-quiet fm-btn-sm"
            >
              <Crosshair className="size-3.5" /> GPS fix
            </button>
            {(["ACTIVE", "STANDBY", "REST"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => store.setPersonnelStatus(person.id, s)}
                disabled={person.status === s}
                className="fm-btn fm-btn-quiet fm-btn-sm disabled:opacity-40"
              >
                {s}
              </button>
            ))}
            {person.status === "DISTRESS" ? (
              <button
                type="button"
                onClick={() => store.resolveSos(person.id)}
                className="fm-btn fm-btn-good fm-btn-sm ml-auto"
              >
                Resolve SOS
              </button>
            ) : (
              <button
                type="button"
                onClick={() => store.raiseSos(person.id)}
                className="fm-btn fm-btn-alert fm-btn-sm ml-auto"
              >
                <ShieldAlert className="size-3.5" />
                SOS
              </button>
            )}
          </div>
          {gpsMsg && <p className="fm-mono text-[10px] text-[var(--fm-accent)]">{gpsMsg}</p>}

          <p className="fm-mono text-[9px] tracking-[0.1em] text-[var(--fm-mut)] uppercase">
            Edits write to the local store first{store.link === "down" ? " · uplink down, queued for sync" : " · streaming to expedition HQ"}
          </p>
        </DialogContent>
      )}

      {beacon && selection?.kind === "beacon" && (
        <DialogContent className="fm max-w-md border-[var(--fm-line)] bg-[var(--fm-paper)] p-6 text-[var(--fm-ink)]" showCloseButton>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <span className="fm-plate size-10">
                <Satellite className="size-5 text-[var(--fm-accent)]" />
              </span>
              <div>
                <DialogTitle className="fm-mono text-base font-bold tracking-[0.12em] text-[var(--fm-ink)]">
                  {beacon.name.toUpperCase()}
                </DialogTitle>
                <DialogDescription className="fm-mono text-[11px] text-[var(--fm-mut)]">
                  {beacon.kind} · {fmtLat(beacon.pos.lat)} {fmtLon(beacon.pos.lon)}
                </DialogDescription>
              </div>
              <span className="ml-auto">
                <StatusBadge tone={beacon.live ? "sync" : "ice"} pulse={beacon.live}>
                  {beacon.live ? "Live GPS" : "Deployed"}
                </StatusBadge>
              </span>
            </div>
          </DialogHeader>

          <div className="fm-panel-2 grid grid-cols-2 gap-x-4 gap-y-2.5 p-3">
            <Telemetry
              icon={Clock}
              label="Last Fix"
              value={beacon.lastFix ? `${fmtRel(beacon.lastFix)} · ${fmtUtc(beacon.lastFix)}Z` : "—"}
            />
            <Telemetry
              icon={BatteryCharging}
              label="Battery"
              value={beacon.battery !== undefined ? `${beacon.battery}%` : "—"}
            />
            <Telemetry icon={Gauge} label="Latitude" value={fmtLat(beacon.pos.lat)} />
            <Telemetry icon={Gauge} label="Longitude" value={fmtLon(beacon.pos.lon)} />
          </div>

          <Meter label="Beacon cell" value={beacon.battery ?? 0} tone={(beacon.battery ?? 100) < 30 ? "alert" : undefined} />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => gpsFixNow("beacon", beacon.id)}
              className="fm-btn fm-btn-quiet fm-btn-sm"
            >
              <Crosshair className="size-3.5" /> GPS fix now
            </button>
            <button
              type="button"
              onClick={() => store.setBeaconLive(beacon.id, !beacon.live)}
              className={cn("fm-btn fm-btn-sm", beacon.live ? "fm-btn-quiet" : "fm-btn-good")}
            >
              <Radio className="size-3.5" />
              {beacon.live ? "Stop live track" : "Live device track"}
            </button>
            <button
              type="button"
              onClick={() => {
                store.removeAsset("beacon", beacon.id);
                onClose();
              }}
              className="fm-btn fm-btn-alert fm-btn-sm ml-auto"
            >
              Recover
            </button>
          </div>
          {gpsMsg && (
            <p className="fm-mono text-[10px] text-[var(--fm-accent)]">{gpsMsg}</p>
          )}
          <p className="fm-mono text-[9px] tracking-[0.1em] text-[var(--fm-mut)] uppercase">
            Standalone beacon · device GPS writes through the local store to HQ
          </p>
        </DialogContent>
      )}

      {vehicle && (
        <DialogContent className="fm max-w-md border-[var(--fm-line)] bg-[var(--fm-paper)] p-6 text-[var(--fm-ink)]" showCloseButton>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <span className="fm-plate size-10">
                <Wrench className="size-5 text-[var(--fm-accent)]" />
              </span>
              <div>
                <DialogTitle className="fm-mono text-base font-bold tracking-[0.12em] text-[var(--fm-ink)]">
                  {vehicle.name.toUpperCase()}
                </DialogTitle>
                <DialogDescription className="fm-mono text-[11px] text-[var(--fm-mut)]">
                  {vehicle.type} · {fmtLat(vehicle.pos.lat)} {fmtLon(vehicle.pos.lon)}
                </DialogDescription>
              </div>
              <span className="ml-auto">
                <StatusBadge tone={vehicle.available ? "sync" : "muted"}>
                  {vehicle.available ? "Ready" : "Down"}
                </StatusBadge>
              </span>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <Meter label="Fuel" value={vehicle.fuel} />
          </div>

          <div className="fm-panel-2 grid grid-cols-2 gap-x-4 gap-y-2.5 p-3">
            <Telemetry icon={Gauge} label="Cruise" value={`${vehicle.speedKmh} KM/H`} />
            <Telemetry icon={Clock} label="Range" value={`${Math.round(vehicle.fuel * 4.2)} KM EST`} />
            <Telemetry icon={Thermometer} label="Block Heater" value={vehicle.available ? "CYCLING" : "FAULT"} />
            <Telemetry icon={BatteryCharging} label="Starter Cells" value={vehicle.available ? "NOMINAL" : "DISCHARGED"} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => gpsFixNow("vehicle", vehicle.id)}
              className="fm-btn fm-btn-quiet fm-btn-sm"
            >
              <Crosshair className="size-3.5" /> GPS fix
            </button>
            <span className="ml-auto">
              <StatusBadge tone="ice">
                <Flame className="size-3" /> Arctic spec
              </StatusBadge>
            </span>
          </div>
          {gpsMsg && <p className="fm-mono text-[10px] text-[var(--fm-accent)]">{gpsMsg}</p>}

          <p className="fm-mono text-[9px] tracking-[0.1em] text-[var(--fm-mut)] uppercase">
            Fleet node · position fixes stream to HQ when the uplink allows
          </p>
        </DialogContent>
      )}
    </Dialog>
  );
}

function Telemetry({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-[var(--fm-mut)]" />
      <div className="min-w-0 leading-tight">
        <div className="fm-label">{label}</div>
        <div className="fm-mono truncate text-[11px] font-semibold text-[var(--fm-ink)]">{value}</div>
      </div>
    </div>
  );
}

