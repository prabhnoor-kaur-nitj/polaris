import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteLayout } from "@/components/site/SiteChrome";
import { usePageTitle } from "@/hooks/use-page-title";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CloudOff,
  Map,
  Package,
  Radio,
  Route as RouteIcon,
  Satellite,
  ShieldAlert,
  Snowflake,
  Star,
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

const REVIEWS = [
  {
    name: "Cdr. A. Sharma",
    role: "Station Master · Maitri",
    rating: 5,
    quote:
      "The first logistics tool that survived a full whiteout week. The sync queue drained the moment our SATCOM window opened — nothing lost, nothing re-keyed.",
  },
  {
    name: "R. Iyer",
    role: "Logistics Officer · Bharati",
    rating: 5,
    quote:
      "Threshold flags caught our heating oil hitting CRITICAL three days before the manual ledger would have. That call is a season saved.",
  },
  {
    name: "Dr. M. Kaur",
    role: "Medical Lead · Maitri",
    rating: 4,
    quote:
      "Crew vitals and supplies on one radar. During the medevac drill I had the nearest vehicle and ETA before I finished the radio call.",
  },
  {
    name: "J. Okafor",
    role: "Traverse Commander · Fuel Run F1",
    rating: 5,
    quote:
      "Cold-factor and payload math is the real deal. GO/NO-GO per vehicle stopped an underpowered snowcat attempt at −41°C.",
  },
  {
    name: "S. Verma",
    role: "Comms Engineer · Bharati",
    rating: 4,
    quote:
      "VHF mesh mode slowing the sync queue is exactly how the real link behaves. Training drills finally feel like the ice.",
  },
  {
    name: "L. Fischer",
    role: "Winter-Over Scientist · R7 Post",
    rating: 5,
    quote:
      "I joined the waitlist skeptical. The tactical map won over the whole winter-over crew in a week — and it never touched the network once.",
  },
];

const FAQS = [
  {
    q: "How does POLARIS work without internet access?",
    a: "Every write is local-first: inventory movements, route plans and status updates are applied on your device instantly and queued for sync. When a satellite or VHF mesh link returns, the queue drains in order and the pending badge clears. All three link modes can be simulated from the top bar.",
  },
  {
    q: "Who can grant access to a deployment?",
    a: "Access is master-only provisioning. The first commander to initialize the system becomes the master; every other operator account is created by the master from the Access Control panel with an email and a temporary password. Operator, observer and supervisor roles can be changed or revoked at any time, which also terminates that account's live sessions.",
  },
  {
    q: "What does the SOS dispatch solve actually compute?",
    a: "When a distress call is raised, POLARIS computes the nearest available rescue vehicle from the live asset grid, derives distance, route and ETA under current conditions, and shows the uplink state for the active network mode — all computed locally, no link required.",
  },
  {
    q: "Which stations and vehicles are modeled?",
    a: "The build ships with a simulated Maitri / Bharati sector grid: the two stations plus fuel depots, medical caches and radar posts. Personnel, snow vehicles and cargo nodes are draggable markers carrying live vitals, battery and oxygen telemetry.",
  },
  {
    q: "Is my station's data sent anywhere?",
    a: "No. POLARIS is designed for air-gapped deployments — all expedition data persists on-device. The only server traffic on this public site is anonymous page-view counting; there are no third-party trackers or analytics scripts.",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("size-3.5", i < rating ? "fill-[#ffd166] text-[#ffd166]" : "text-white/15")}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  usePageTitle();

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 sm:pt-20">
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
              SIMULATED FIELD BUILD
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

          {/* CTA above the fold */}
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
            <Button
              asChild
              variant="outline"
              size="lg"
              className="hud-mono h-12 border-[#00f5d4]/40 bg-transparent px-6 text-[11px] font-bold tracking-[0.18em] text-[#00f5d4] hover:bg-[#00f5d4]/10 hover:text-[#00f5d4]"
            >
              <Link to="/waitlist">JOIN THE WAITLIST</Link>
            </Button>
            <a
              href="#faq"
              className="hud-mono rounded-md border border-white/15 bg-white/5 px-5 py-3 text-[11px] font-bold tracking-[0.18em] text-[#9ec8dc] transition-colors hover:bg-white/10"
            >
              FAQ
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

      {/* Field reports (reviews) */}
      <section className="border-y border-[#48cae4]/12 bg-[#0a1024]/50">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16" id="reviews">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="hud-label mb-1">Field Reports</div>
              <h2 className="text-2xl font-bold tracking-tight text-[#eaf8ff] sm:text-3xl">
                Reviewed by the crews who ran the watch.
              </h2>
            </div>
            <span className="hud-mono text-[10px] tracking-[0.18em] text-[#9ec8dc]/60">
              6 REPORTS · WINTER-OVER CYCLE 42
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r, i) => (
              <motion.figure
                key={r.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="hud-panel flex flex-col gap-3 p-5"
              >
                <Stars rating={r.rating} />
                <blockquote className="text-[13px] leading-relaxed text-[#d7f4ff]">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-auto border-t border-[#48cae4]/10 pt-3">
                  <div className="hud-mono text-[11px] font-bold tracking-[0.1em] text-[#7be6fa]">
                    {r.name}
                  </div>
                  <div className="hud-label mt-0.5">{r.role}</div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
        <div className="mb-8 text-center">
          <div className="hud-label mb-1">Briefing Deck</div>
          <h2 className="text-2xl font-bold tracking-tight text-[#eaf8ff] sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#9ec8dc]">
            Everything a station commander asks before taking the first watch.
          </p>
        </div>
        <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`faq-${i}`}
              className="hud-panel border-none px-5 py-1"
            >
              <AccordionTrigger className="hud-mono py-4 text-left text-[12px] font-bold tracking-[0.08em] text-[#d7f4ff] hover:no-underline [&>svg]:text-[#48cae4]">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-[13px] leading-relaxed text-[#9ec8dc]">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
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
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="hud-mono h-12 gap-2 border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-7 text-[11px] font-bold tracking-[0.18em] text-[#00f5d4] hover:bg-[#00f5d4]/25"
            >
              <Link to="/auth">
                ENTER COMMAND <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hud-mono h-12 border-white/15 bg-transparent px-6 text-[11px] font-bold tracking-[0.18em] text-[#9ec8dc] hover:bg-white/5 hover:text-[#d7f4ff]"
            >
              <Link to="/waitlist">JOIN THE WAITLIST</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
