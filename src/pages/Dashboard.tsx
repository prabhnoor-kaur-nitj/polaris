import { AccessControl } from "@/components/polar/AccessControl";
import { AssetRoster } from "@/components/polar/AssetRoster";
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
import { deviceFixWatch } from "@/lib/polar/gps";
import { usePolarStore } from "@/lib/polar/store";
import type { TrackableKind } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Map,
  Package,
  Radar,
  Route as RouteIcon,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

type TabId = "map" | "assets" | "inventory" | "routes" | "access" | "site";

const TABS: { id: TabId; label: string; num: string; icon: typeof Map }[] = [
  { id: "map", num: "01", label: "Tactical map & personnel radar", icon: Map },
  { id: "assets", num: "02", label: "Tracked assets & GPS roster", icon: Radar },
  { id: "inventory", num: "03", label: "Inventory & supply node", icon: Package },
  { id: "routes", num: "04", label: "Expedition & route planning", icon: RouteIcon },
  { id: "access", num: "05", label: "Access control", icon: ShieldCheck },
  { id: "site", num: "06", label: "Contact inbox", icon: Inbox },
];

export default function Dashboard() {
  usePageTitle("Command Deck");
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const store = usePolarStore();
  const [tab, setTab] = useState<TabId>("map");
  const [selection, setSelection] = useState<{ kind: TrackableKind; id: string } | null>(null);
  const [focus, setFocus] = useState<{ kind: TrackableKind; id: string; nonce: number } | null>(null);
  const [sosOpen, setSosOpen] = useState(false);

  /** Locate an asset: jump to the map tab and fly to its marker. */
  const locateAsset = (kind: TrackableKind, id: string) => {
    setTab("map");
    setFocus({ kind, id, nonce: Date.now() });
  };

  /**
   * Live device-GPS tracking: every beacon flagged `live` gets a real
   * Geolocation watch whose fixes stream through the store (and on to HQ).
   * Lives here so watches survive tab switches.
   */
  const liveKey = store.state.beacons
    .filter((b) => b.live)
    .map((b) => b.id)
    .join(",");
  const { moveAsset } = store;
  useEffect(() => {
    if (!liveKey) return;
    const stops = liveKey.split(",").map((id) =>
      deviceFixWatch(
        (fix) => moveAsset("beacon", id, { lat: fix.lat, lon: fix.lon }),
        (msg) => console.warn("[POLARIS gps]", id, msg),
      ),
    );
    return () => stops.forEach((stop) => stop());
  }, [liveKey, moveAsset]);

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
    <div className="fm min-h-screen">
      <TacticalTopbar store={store} onSignOut={handleSignOut} />

      <main className="mx-auto w-full max-w-7xl px-4 pt-5 pb-24 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="fm-h2">
            <span className="fm-num mr-3">Deck</span>Station command
          </h1>
          <span className="fm-dim fm-mono hidden text-[10px] tracking-[0.18em] uppercase sm:inline">
            Winter-over cycle 42
          </span>
        </div>

        <div className="mt-5">
          <StatStrip store={store} />
        </div>

        {/* Primary ops tabs + SOS trigger */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="fm-panel flex flex-wrap gap-0.5 p-1" role="tablist" aria-label="Command sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "fm-mono flex items-center gap-2 rounded-sm px-3.5 py-2 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors",
                    active
                      ? "bg-[var(--fm-paper-2)] text-[var(--fm-ink)] shadow-[inset_0_0_0_1px_var(--fm-line)]"
                      : "text-[var(--fm-mut)] hover:text-[var(--fm-ink)]",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="fm-num mr-1 text-[10px]">{t.num}</span>
                  <span className="hidden md:inline">{t.label}</span>
                  <span className="md:hidden">{t.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={triggerSos}
            className={cn(
              "fm-btn fm-btn-alert fm-mono ml-auto",
              hasActiveSos && "fm-blink",
            )}
            title="Declare expedition emergency (simulated drill)"
          >
            <Siren className="size-3.5" />
            SOS
            {distressCount > 0 && (
              <span className="fm-mono rounded-sm border border-[var(--fm-alert)]/50 px-1.5 text-[9px]">
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
              focus={focus}
            />
          )}
          {tab === "assets" && (
            <AssetRoster
              store={store}
              selection={selection}
              onSelect={setSelection}
              onLocate={locateAsset}
            />
          )}
          {tab === "inventory" && <InventoryTab store={store} />}
          {tab === "routes" && <RoutePlannerTab store={store} />}
          {tab === "access" && <AccessControl />}
          {tab === "site" && <ContactInbox />}
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--fm-line-soft)] pt-3">
          <span className="fm-mono text-[9px] tracking-[0.18em] text-[var(--fm-mut)] uppercase">
            POLARIS · Expedition command · Field-linked build
          </span>
          <span className="fm-mono text-[9px] tracking-[0.18em] text-[var(--fm-mut)] uppercase">
            Engine v4.2 · Local-first sync to HQ · WGS-84 Maitri—Bharati sectors
          </span>
        </footer>
      </main>

      <MarkerInspector store={store} selection={selection} onClose={() => setSelection(null)} />
      <SosOverlay store={store} onClose={() => setSosOpen(false)} />
    </div>
  );
}
