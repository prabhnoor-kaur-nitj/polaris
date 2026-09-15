import { useNow } from "@/components/polar/hud";
import type { PolarStore } from "@/lib/polar/store";
import { cn } from "@/lib/utils";
import {
  Activity,
  BatteryCharging,
  Package,
  ShieldAlert,
  Thermometer,
  Wind,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  pulse = false,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub: string;
  tone: "ice" | "alert" | "sync" | "warn";
  pulse?: boolean;
}) {
  const toneText: Record<string, string> = {
    ice: "text-[var(--fm-accent)]",
    alert: "text-[var(--fm-alert)]",
    sync: "text-[var(--fm-good)]",
    warn: "text-[var(--fm-warn)]",
  };

  return (
    <div
      className={cn(
        "fm-panel flex items-center gap-3 px-3.5 py-3",
        pulse && "fm-blink",
      )}
    >
      <span className="fm-plate size-9 shrink-0">
        <Icon className={cn("size-4", toneText[tone])} />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="fm-label truncate">{label}</div>
        <div className={cn("fm-mono text-lg font-bold tabular-nums", toneText[tone])}>{value}</div>
        <div className="fm-dim fm-mono truncate text-[10px]">{sub}</div>
      </div>
    </div>
  );
}

export function StatStrip({ store }: { store: PolarStore }) {
  const { state } = store;
  const now = useNow(5000);

  const active = state.personnel.filter((p) => p.status === "ACTIVE").length;
  const distress = state.personnel.filter((p) => p.status === "DISTRESS").length;
  const avgBattery = Math.round(
    state.personnel.reduce((a, p) => a + p.battery, 0) / Math.max(1, state.personnel.length),
  );
  const criticalStock = state.cargo.filter(
    (c) => c.stock <= c.threshold && c.stock > 0,
  ).length;
  const depleted = state.cargo.filter((c) => c.stock <= 0).length;
  const lastPing = Math.max(...state.personnel.map((p) => p.lastPing));

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={Activity}
        label="Field Team"
        value={`${active}/${state.personnel.length}`}
        sub={`${distress} distress · ${state.personnel.filter((p) => p.status === "STANDBY").length} standby`}
        tone={distress > 0 ? "alert" : "sync"}
        pulse={distress > 0}
      />
      <StatCard
        icon={BatteryCharging}
        label="Avg Battery"
        value={`${avgBattery}%`}
        sub="Heated pack units"
        tone={avgBattery < 40 ? "warn" : "ice"}
      />
      <StatCard
        icon={ShieldAlert}
        label="Stock Alerts"
        value={`${criticalStock + depleted}`}
        sub={`${criticalStock} critical · ${depleted} depleted`}
        tone={criticalStock + depleted > 0 ? "warn" : "sync"}
        pulse={depleted > 0}
      />
      <StatCard
        icon={Package}
        label="Vehicles Ready"
        value={`${state.vehicles.filter((v) => v.available).length}/${state.vehicles.length}`}
        sub="Fleet on the ice grid"
        tone="ice"
      />
      <StatCard
        icon={Thermometer}
        label="Ext. Temp"
        value="−41°C"
        sub="Wind-chill −57°C"
        tone="ice"
      />
      <StatCard
        icon={Wind}
        label="Mesh Latency"
        value={state.networkMode === "offline" ? "——" : state.networkMode === "lowband" ? "4.2s" : "320ms"}
        sub={`Last ping ${Math.round((now - lastPing) / 1000)}s ago`}
        tone={state.networkMode === "offline" ? "alert" : "sync"}
      />
    </div>
  );
}
