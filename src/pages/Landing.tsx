import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CloudOff,
  Map,
  Package,
  Radio,
  Route as RouteIcon,
  Satellite,
  ShieldAlert,
  Snowflake,
  Thermometer,
} from "lucide-react";
import { Link } from "react-router";

const FEATURES = [
  {
    icon: Map,
    title: "Tactical Personnel Radar",
    body: "Live grid of every crew member and vehicle on the ice — click any marker for vitals, battery, oxygen and last ping.",
  },
  {
    icon: Package,
    title: "Supply Chain Node",
    body: "Rations, jet fuel, heating oil, solar arrays and medical kits with CRITICAL / OPTIMAL / DEPLETED threshold flags.",
  },
  {
    icon: RouteIcon,
    title: "Expedition Route Planning",
    body: "Multi-waypoint traverses with fuel, cold-factor and ETA math for crew size, payload and temperature drop.",
  },
  {
    icon: CloudOff,
    title: "Offline-First Engine",
    body: "Every action writes to local storage first and queues sync events — built for zero-internet field stations.",
  },
  {
    icon: ShieldAlert,
    title: "SOS Emergency Solve",
    body: "One-tap MAYDAY with instant nearest-asset dispatch calculation, ETA and broadcast state.",
  },
  {
    icon: Radio,
    title: "Mesh / Satellite Modes",
    body: "Simulate SATCOM, VHF mesh and offline local-storage modes and watch the sync queue adapt in real time.",
  },
];

export default function Landing() {
  return (
    <div className="polar-hud flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-[#48cae4]/15 bg-[#0b132b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <img src={logo} alt="POLARIS" className="size-8 rounded-lg" />
          <div className="hud-mono text-[11px] font-bold tracking-[0.18em] text-[#d7f4ff]">
            POLARIS <span className="text-[#48cae4]/70">|</span>{" "}
            <span className="text-[#7be6fa]">EXPEDITION COMMAND</span>{" "}
            <span className="text-[#48cae4]/60">v4.2</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="hud-mono h-9 border-[#48cae4]/40 bg-transparent text-[10px] font-bold tracking-[0.14em] text-[#7be6fa] hover:bg-[#48cae4]/10 hover:text-[#7be6fa]"
            >
              <Link to="/auth">COMMAND SIGN-IN</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24">
          {/* decor */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 right-0 size-96 rounded-full bg-[#48cae4]/8 blur-3xl" />
            <div className="absolute top-40 -left-24 size-80 rounded-full bg-[#00b4d8]/8 blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="hud-mono inline-flex items-center gap-2 rounded-md border border-[#00f5d4]/40 bg-[#00f5d4]/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#00f5d4]">
                <Satellite className="size-3.5" /> OFFLINE-FIRST FIELD GRID
              </span>
              <span className="hud-mono inline-flex items-center gap-2 rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#7be6fa]">
                <Thermometer className="size-3.5" /> −41°C OPERATIONAL
              </span>
              <span className="hud-mono inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#9ec8dc]">
                MoES · SMART AUTOMATION
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-[#eaf8ff] sm:text-6xl">
              Polar expedition command,{" "}
              <span className="bg-gradient-to-r from-[#48cae4] to-[#00f5d4] bg-clip-text text-transparent">
                engineered for the ice.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#9ec8dc] sm:text-lg">
              The integrated logistics and asset management HUD for Antarctic
              stations. Track personnel radar, run the supply node, plan traverses and fire
              emergency solves — all on a tactical grid that keeps working when the link
              doesn't.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="hud-mono h-12 gap-2 border border-[#48cae4]/50 bg-[#48cae4]/15 px-6 text-[11px] font-bold tracking-[0.18em] text-[#7be6fa] hover:bg-[#48cae4]/25"
              >
                <Link to="/auth">
                  ENTER COMMAND <ArrowRight className="size-4" />
                </Link>
              </Button>
              <a
                href="#systems"
                className="hud-mono rounded-md border border-white/15 bg-white/5 px-5 py-3 text-[11px] font-bold tracking-[0.18em] text-[#9ec8dc] transition-colors hover:bg-white/10"
              >
                VIEW SYSTEM PANELS
              </a>
            </div>

            {/* Stat chips */}
            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: "2", v: "Stations linked" },
                { k: "24/7", v: "Mesh telemetry" },
                { k: "100%", v: "Local-first writes" },
                { k: "<1s", v: "Optimistic UI" },
              ].map((s) => (
                <div key={s.v} className="hud-panel px-4 py-3">
                  <div className="hud-mono text-xl font-bold text-[#7be6fa]">{s.k}</div>
                  <div className="hud-label mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Radar strip */}
        <section className="border-y border-[#48cae4]/12 bg-[#0a1024]/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4">
            {["MAITRI", "BHARATI", "FUEL DEPOT F1", "MEDICAL CACHE M2", "RADAR POST R7"].map(
              (n, i) => (
                <span key={n} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      i % 3 === 0 ? "bg-[#00f5d4]" : "bg-[#48cae4]",
                    )}
                    style={{ boxShadow: "0 0 10px currentColor" }}
                  />
                  <span className="hud-mono text-[10px] tracking-[0.22em] text-[#9ec8dc]">{n}</span>
                </span>
              ),
            )}
          </div>
        </section>

        {/* Feature grid */}
        <section id="systems" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="hud-label mb-1">System Panels</div>
              <h2 className="text-2xl font-bold tracking-tight text-[#eaf8ff] sm:text-3xl">
                One HUD. Every expedition system.
              </h2>
            </div>
            <span className="hud-mono text-[10px] tracking-[0.18em] text-[#9ec8dc]/60">
              SECTOR 70S · ENGINE v4.2
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="hud-panel h-full border-[#48cae4]/15 bg-transparent shadow-none">
                  <CardContent className="p-5">
                    <span className="mb-3 grid size-10 place-items-center rounded-lg border border-[#48cae4]/30 bg-[#48cae4]/10 text-[#48cae4]">
                      <f.icon className="size-5" />
                    </span>
                    <h3 className="hud-mono text-[13px] font-bold tracking-[0.08em] text-[#d7f4ff]">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#9ec8dc]">{f.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="hud-panel relative overflow-hidden px-6 py-10 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[#48cae4]/10 blur-3xl" />
            </div>
            <Snowflake className="mx-auto size-8 text-[#48cae4]" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#eaf8ff] sm:text-3xl">
              The ice doesn't wait. Neither should your data.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#9ec8dc]">
              Sign in to the command deck and run a simulated expedition watch — personnel
              radar, supply thresholds, route planning and emergency drills included.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 hud-mono h-12 gap-2 border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-7 text-[11px] font-bold tracking-[0.18em] text-[#00f5d4] hover:bg-[#00f5d4]/25"
            >
              <Link to="/auth">
                ENTER COMMAND <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#48cae4]/12 px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <span className="hud-mono text-[9px] tracking-[0.18em] text-[#9ec8dc]/50">
            POLARIS · EXPEDITION COMMAND
          </span>
          <span className="hud-mono text-[9px] tracking-[0.18em] text-[#9ec8dc]/50">
            v4.2 · SIMULATED FIELD ENVIRONMENT
          </span>
        </div>
      </footer>
    </div>
  );
}
