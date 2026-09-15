import { AccessControl } from "@/components/polar/AccessControl";
import { ContactInbox } from "@/components/site/ContactInbox";
import { usePageTitle } from "@/hooks/use-page-title";
import { MarkerInspector } from "@/components/polar/MarkerInspector";
import { InventoryTab } from "@/components/polar/InventoryTab";
import { RoutePlannerTab } from "@/components/polar/RoutePlannerTab";
import { SosOverlay } from "@/components/polar/SosOverlay";
import { StatStrip } from "@/components/polar/StatStrip";
import { TacticalMap } from "@/components/polar/TacticalMap";
import { TacticalTopbar } from "@/components/polar/TacticalTopbar";
import { useAuth } from "@/hooks/use-auth";
import { usePolarStore } from "@/lib/polar/store";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Map,
  Package,
  Route as RouteIcon,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

type TabId = "map" | "inventory" | "routes" | "access" | "site";

const TABS: { id: TabId; label: string; icon: typeof Map }[] = [
  { id: "map", label: "TACTICAL MAP & PERSONNEL RADAR", icon: Map },
  { id: "inventory", label: "INVENTORY & SUPPLY NODE", icon: Package },
  { id: "routes", label: "EXPEDITION & ROUTE PLANNING", icon: RouteIcon },
  { id: "access", label: "ACCESS CONTROL", icon: ShieldCheck },
  { id: "site", label: "CONTACT INBOX", icon: Inbox },
];

export default function Dashboard() {
  usePageTitle("Command Deck");
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const store = usePolarStore();
  const [tab, setTab] = useState<TabId>("map");
  const [selection, setSelection] = useState<{ kind: "personnel" | "vehicle"; id: string } | null>(null);
  const [sosOpen, setSosOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const distress = store.state.personnel.filter((p) => p.status === "DISTRESS");
  const distressCount = distress.length;
  const hasActiveSos = store.state.sos.some((i) => !i.resolved);

  /** SOS button: monitor an active incident, or simulate a new field emergency. */
  const triggerSos = () => {
    if (hasActiveSos) {
      setSosOpen(true);
      return;
    }
    const candidates = store.state.personnel.filter((p) => p.status !== "DISTRESS");
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (pick) {
      store.raiseSos(pick.id);
      setSosOpen(true);
    }
  };

  return (
    <div className="polar-hud min-h-screen">
      <TacticalTopbar store={store} onSignOut={handleSignOut} />

      <main className="mx-auto w-full max-w-7xl px-3 pt-4 pb-24 sm:px-5">
        <StatStrip store={store} />

        {/* Primary ops tabs + SOS trigger */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="hud-panel flex flex-wrap gap-1 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "hud-mono flex items-center gap-2 rounded-md px-3.5 py-2 text-[10px] font-bold tracking-[0.14em] transition-colors",
                    tab === t.id
                      ? "bg-[#48cae4]/15 text-[#7be6fa] shadow-[inset_0_0_0_1px_rgba(72,202,228,0.4)]"
                      : "text-[#9ec8dc] hover:bg-white/5 hover:text-[#d7f4ff]",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={triggerSos}
            className={cn(
              "anim-sos hud-mono ml-auto flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-[11px] font-bold tracking-[0.18em] transition-colors",
              hasActiveSos
                ? "border-[#ff4d4d] bg-[#ff4d4d]/20 text-[#ff8080]"
                : "border-[#ff4d4d]/60 bg-[#ff4d4d]/10 text-[#ff4d4d] hover:bg-[#ff4d4d]/20",
            )}
            title="Declare expedition emergency (simulated drill)"
          >
            <Siren className="size-4" />
            SOS ALERT
            {distressCount > 0 && (
              <span className="rounded bg-[#ff4d4d] px-1.5 text-[9px] text-[#0b132b]">
                {distressCount}
              </span>
            )}
          </button>
        </div>

        {/* Panel body */}
        <div className="mt-4">
          {tab === "map" && (
            <TacticalMap
              store={store}
              onSelectAsset={(kind, id) => setSelection({ kind, id })}
            />
          )}
          {tab === "inventory" && <InventoryTab store={store} />}
          {tab === "routes" && <RoutePlannerTab store={store} />}
          {tab === "access" && <AccessControl />}
          {tab === "site" && <ContactInbox />}
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#48cae4]/10 pt-3">
          <span className="hud-mono text-[9px] tracking-[0.18em] text-[#9ec8dc]/50">
            POLARIS · EXPEDITION COMMAND · SIMULATED FIELD BUILD
          </span>
          <span className="hud-mono text-[9px] tracking-[0.18em] text-[#9ec8dc]/50">
            ENGINE v4.2 · LOCAL-FIRST · SECTOR 70S
          </span>
        </footer>
      </main>

      <MarkerInspector store={store} selection={selection} onClose={() => setSelection(null)} />
      <SosOverlay store={store} onClose={() => setSosOpen(false)} />
    </div>
  );
}
