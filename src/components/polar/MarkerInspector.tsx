import { Meter, StatusBadge, useNow } from "@/components/polar/hud";
import { fmtRel, fmtUtc, type PolarStore } from "@/lib/polar/store";
import type { Personnel, PersonnelStatus, Vehicle } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  BatteryCharging,
  Clock,
  Flame,
  Gauge,
  Radio,
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
  selection: { kind: "personnel" | "vehicle"; id: string } | null;
  onClose: () => void;
}) {
  const now = useNow(1000);
  const person: Personnel | undefined =
    selection?.kind === "personnel"
      ? store.state.personnel.find((p) => p.id === selection.id)
      : undefined;
  const vehicle: Vehicle | undefined =
    selection?.kind === "vehicle"
      ? store.state.vehicles.find((v) => v.id === selection.id)
      : undefined;

  const open = Boolean(person || vehicle);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {person && selection?.kind === "personnel" && (
        <DialogContent className="polar-hud max-w-md border-[#48cae4]/30 bg-[#0b132b] text-[#d7f4ff]" showCloseButton>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-lg border",
                  person.status === "DISTRESS"
                    ? "border-[#ff4d4d]/50 bg-[#ff4d4d]/10 text-[#ff4d4d]"
                    : "border-[#48cae4]/40 bg-[#48cae4]/10 text-[#48cae4]",
                )}
              >
                <User className="size-5" />
              </span>
              <div>
                <DialogTitle className="hud-mono text-base font-bold tracking-[0.12em] text-[#d7f4ff]">
                  {person.callsign} · {person.name.toUpperCase()}
                </DialogTitle>
                <DialogDescription className="hud-mono text-[11px] text-[#9ec8dc]">
                  {person.role} · GRID {fmtCoord(person.pos.x)}E {fmtCoord(person.pos.y)}S
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
          <div className="hud-panel grid grid-cols-2 gap-x-4 gap-y-2.5 p-3">
            <Telemetry icon={Clock} label="Last Ping" value={`${fmtRel(person.lastPing)} · ${fmtUtc(person.lastPing)}Z`} />
            <Telemetry icon={Radio} label="Link" value={store.state.networkMode === "offline" ? "LOCAL STORE" : store.state.networkMode === "lowband" ? "VHF MESH" : "SATCOM"} />
            <Telemetry icon={Gauge} label="Grid X" value={`${fmtCoord(person.pos.x)}E`} />
            <Telemetry icon={Gauge} label="Grid Y" value={`${fmtCoord(person.pos.y)}S`} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {(["ACTIVE", "STANDBY", "REST"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => store.setPersonnelStatus(person.id, s)}
                disabled={person.status === s}
                className="hud-mono rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#7be6fa] transition-colors hover:bg-[#48cae4]/20 disabled:opacity-40"
              >
                SET {s}
              </button>
            ))}
            {person.status === "DISTRESS" ? (
              <button
                type="button"
                onClick={() => store.resolveSos(person.id)}
                className="hud-mono ml-auto rounded-md border border-[#00f5d4]/40 bg-[#00f5d4]/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#00f5d4] hover:bg-[#00f5d4]/20"
              >
                RESOLVE SOS
              </button>
            ) : (
              <button
                type="button"
                onClick={() => store.raiseSos(person.id)}
                className="hud-mono anim-sos ml-auto rounded-md border border-[#ff4d4d]/60 bg-[#ff4d4d]/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#ff8080] hover:bg-[#ff4d4d]/25"
              >
                <ShieldAlert className="mr-1 inline size-3.5" />
                DECLARE SOS
              </button>
            )}
          </div>

          <p className="hud-mono text-[9px] tracking-[0.1em] text-[#9ec8dc]/60">
            EDITS WRITE TO LOCAL STORE FIRST{store.state.networkMode === "offline" ? " · QUEUED FOR SYNC" : " · SYNC ENGINE ACTIVE"}
          </p>
        </DialogContent>
      )}

      {vehicle && (
        <DialogContent className="polar-hud max-w-md border-[#48cae4]/30 bg-[#0b132b] text-[#d7f4ff]" showCloseButton>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-lg border border-[#48cae4]/40 bg-[#48cae4]/10 text-[#48cae4]">
                <Wrench className="size-5" />
              </span>
              <div>
                <DialogTitle className="hud-mono text-base font-bold tracking-[0.12em] text-[#d7f4ff]">
                  {vehicle.name.toUpperCase()}
                </DialogTitle>
                <DialogDescription className="hud-mono text-[11px] text-[#9ec8dc]">
                  {vehicle.type} · GRID {fmtCoord(vehicle.pos.x)}E {fmtCoord(vehicle.pos.y)}S
                </DialogDescription>
              </div>
              <span className="ml-auto">
                <StatusBadge tone={vehicle.available ? "sync" : "muted"}>
                  {vehicle.available ? "READY" : "DOWN"}
                </StatusBadge>
              </span>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <Meter label="Fuel" value={vehicle.fuel} />
          </div>

          <div className="hud-panel grid grid-cols-2 gap-x-4 gap-y-2.5 p-3">
            <Telemetry icon={Gauge} label="Cruise" value={`${vehicle.speedKmh} KM/H`} />
            <Telemetry icon={Clock} label="Range" value={`${Math.round(vehicle.fuel * 4.2)} KM EST`} />
            <Telemetry icon={Thermometer} label="Block Heater" value={vehicle.available ? "CYCLING" : "FAULT"} />
            <Telemetry icon={BatteryCharging} label="Starter Cells" value={vehicle.available ? "NOMINAL" : "DISCHARGED"} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => store.moveAsset("vehicle", vehicle.id, vehicle.pos)}
              className="hud-mono rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#7be6fa] hover:bg-[#48cae4]/20"
            >
              REPOSITION VIA MAP DRAG
            </button>
            <span className="ml-auto">
              <StatusBadge tone="ice">
                <Flame className="size-3" /> ARCTIC SPEC
              </StatusBadge>
            </span>
          </div>

          <p className="hud-mono text-[9px] tracking-[0.1em] text-[#9ec8dc]/60">
            FLEET NODE · TELEMETRY FROM LOCAL BUFFER
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
      <Icon className="size-3.5 shrink-0 text-[#48cae4]/70" />
      <div className="min-w-0 leading-tight">
        <div className="hud-label">{label}</div>
        <div className="hud-mono truncate text-[11px] font-semibold text-[#d7f4ff]">{value}</div>
      </div>
    </div>
  );
}

function fmtCoord(v: number) {
  const deg = Math.floor(v / 2) / 10; // map % → pseudo-degrees
  return `${(deg + 69).toFixed(1)}°`; // sector 70S flavor around 69–70°E
}
