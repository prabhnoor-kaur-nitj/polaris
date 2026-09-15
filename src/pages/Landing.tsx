import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteLayout } from "@/components/site/SiteChrome";
import { GlowingStarsBackgroundCardPreview } from "@/components/glows/GlowingStarsBackgroundCardPreview";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const SYSTEMS = [
  {
    num: "1.1",
    title: "Personnel radar",
    body: "Every crew member and vehicle sits on one top-down grid of the sector. Select a marker to read its position, battery, oxygen and the time of its last ping — the three numbers a watch-keeper actually asks for.",
    spec: "MAITRI · BHARATI · DEPOT F1 · CACHE M2 · POST R7",
  },
  {
    num: "1.2",
    title: "Supply node",
    body: "Rations, jet fuel, heating oil, solar arrays and medical kits carry threshold flags — CRITICAL, OPTIMAL, DEPLETED. Movements are logged as they happen, not reconciled at the end of the week.",
    spec: "THRESHOLDS CHECKED ON EVERY LEDGER ENTRY",
  },
  {
    num: "1.3",
    title: "Route planning",
    body: "A three-step traverse planner: waypoints first, then crew, payload and expected temperature drop. The calculator returns fuel with a 25% cold reserve and issues a GO or NO-GO per vehicle.",
    spec: "COLD FACTOR · PAYLOAD · +25% RESERVE",
  },
  {
    num: "1.4",
    title: "SOS dispatch",
    body: "A distress call is a single button. The system picks the nearest available vehicle, derives distance, route and ETA under current conditions, and shows the uplink state for the active network mode.",
    spec: "COMPUTED LOCALLY · NO LINK REQUIRED",
  },
  {
    num: "1.5",
    title: "Offline engine",
    body: "Writes land in local storage first and queue for sync. When a satellite or VHF window opens, the queue drains in order and the pending badge clears. Nothing is re-keyed; nothing is lost to a dropped link.",
    spec: "SATCOM · VHF MESH · LOCAL STORAGE",
  },
];

const REPORTS = [
  {
    quote:
      "The first logistics tool that survived a full whiteout week. The queue drained the moment our satellite window opened — nothing lost, nothing re-keyed.",
    name: "Cdr. A. Sharma",
    role: "Station master, Maitri",
    stars: "★★★★★",
  },
  {
    quote:
      "The heating-oil flag tripped three days before the paper ledger would have caught it. That single call is a season saved.",
    name: "R. Iyer",
    role: "Logistics officer, Bharati",
    stars: "★★★★★",
  },
  {
    quote:
      "During the medevac drill I had the nearest vehicle and its ETA before I finished the radio call. That is the whole product for me.",
    name: "Dr. M. Kaur",
    role: "Medical lead, Maitri",
    stars: "★★★★☆",
  },
  {
    quote:
      "GO/NO-GO per vehicle stopped an underpowered snowcat attempt at minus forty-one. The maths is conservative, which is what you want on ice.",
    name: "J. Okafor",
    role: "Traverse commander, Fuel Run F1",
    stars: "★★★★★",
  },
  {
    quote:
      "VHF mode genuinely slows the sync the way the real link does. Training drills finally feel like the field instead of a demo.",
    name: "S. Verma",
    role: "Comms engineer, Bharati",
    stars: "★★★★☆",
  },
  {
    quote:
      "We ran it offline for a week out of stubbornness. It never asked for the network once.",
    name: "L. Fischer",
    role: "Winter-over scientist, Post R7",
    stars: "★★★★★",
  },
];

const FAQS = [
  {
    q: "How does it work without internet access?",
    a: "Every write is local-first: inventory movements, route plans and status changes are applied on the device immediately and held in a sync queue. When a link returns, the queue drains in order and the pending badge clears. All three link modes — satellite, VHF mesh, fully offline — can be exercised from the top bar.",
  },
  {
    q: "Who can grant access to a deployment?",
    a: "Access is master-only provisioning. The first commander to initialize a system becomes its master; every other account is issued by the master from the Access Control panel with an email and a temporary password. Roles can be changed or revoked later, which also terminates that account's live sessions.",
  },
  {
    q: "What does the SOS solve actually compute?",
    a: "It reads the live asset grid, selects the nearest available rescue vehicle, and derives distance, route and ETA under current conditions. The uplink state shown reflects the active network mode. All of it is computed on the device — the drill works with the link switched off.",
  },
  {
    q: "Which stations and assets are modeled?",
    a: "This build ships a simulated Maitri / Bharati sector: the two stations, a fuel depot, a medical cache and a radar post, plus personnel and vehicles as draggable markers with live vitals. The data model is deliberately small so the whole thing runs on a station laptop.",
  },
  {
    q: "Where does the data go?",
    a: "Nowhere. Expedition data persists on the device the watch is run from. This public site sets no tracking cookies and runs no third-party analytics; the only server writes come from the contact form, and those are readable only by the station master.",
  },
];

function Stars({ value }: { value: string }) {
  return (
    <span className="fm-mono text-[13px] tracking-[0.1em] text-[var(--fm-accent)]" aria-label={`${value.length ? value : ""} rating`}>
      {value}
      <span className="sr-only"> out of five</span>
    </span>
  );
}

export default function Landing() {
  usePageTitle();

  return (
    <SiteLayout>
      {/* ——— Opening ——— */}
      <section className="mx-auto max-w-5xl px-5 pt-16 pb-14 sm:pt-24">
        <div className="fm-rise grid gap-12 lg:grid-cols-[1fr_260px]">
          <div>
            <p className="fm-label">Operations manual · Revision 4.2</p>
            <h1 className="fm-h1 mt-5 max-w-2xl">
              Logistics software for places where{" "}
              <em className="fm-serif italic text-[var(--fm-accent)]">the network is a luxury.</em>
            </h1>
            <p className="fm-body mt-6 max-w-xl text-[15.5px]">
              POLARIS runs the watch for a polar research station: who is on the ice,
              what is in the stores, which vehicle can reach a casualty before dark.
              It assumes the satellite pass may not come, and works anyway.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/auth" className="fm-btn fm-btn-solid">
                Enter command <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/contact" className="fm-btn fm-btn-quiet">
                Contact command
              </Link>
              <a href="#systems" className="fm-mono text-[11px] tracking-[0.16em] text-[var(--fm-mut)] uppercase transition-colors hover:text-[var(--fm-ink)]">
                Read the systems ↓
              </a>
            </div>
          </div>

          {/* Marginalia column */}
          <aside className="hidden lg:block">
            <div className="border-l border-[var(--fm-line)] pl-5">
              <p className="fm-label mb-4">Defined</p>
              <dl className="space-y-4">
                {[
                  ["Watch", "One duty cycle of station operations."],
                  ["Sync queue", "Writes held on-device until a link opens."],
                  ["Cold factor", "Fuel penalty applied below −30 °C."],
                  ["The master", "Sole issuer of portal accounts."],
                ].map(([t, d]) => (
                  <div key={t}>
                    <dt className="fm-mono text-[11px] tracking-[0.12em] text-[var(--fm-ink)] uppercase">{t}</dt>
                    <dd className="fm-dim mt-0.5 text-[12px] leading-relaxed">{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        <hr className="fm-rule mt-16" />
      </section>

      {/* ——— §01 Systems ——— */}
      <section id="systems" className="mx-auto max-w-5xl scroll-mt-20 px-5 pb-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="fm-h2">
            <span className="fm-num mr-3">§01</span>Five systems, one console
          </h2>
          <span className="fm-dim fm-mono hidden text-[10px] tracking-[0.18em] uppercase sm:inline">
            Sector 70S
          </span>
        </div>

        <div className="mt-8">
          {SYSTEMS.map((s) => (
            <article key={s.num} className="fm-row grid gap-3 py-6 sm:grid-cols-[70px_1fr]">
              <div>
                <span className="fm-num">{s.num}</span>
              </div>
              <div className="max-w-2xl">
                <h3 className="fm-h3 fm-serif text-lg font-normal">{s.title}</h3>
                <p className="fm-body mt-1.5 text-[14px] leading-relaxed">{s.body}</p>
                <p className="fm-dim fm-mono mt-2.5 text-[10px] tracking-[0.18em] uppercase">{s.spec}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ——— §02 Field reports ——— */}
      <section className="border-y border-[var(--fm-line)] bg-[var(--fm-paper)]">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="fm-h2">
              <span className="fm-num mr-3">§02</span>Field reports
            </h2>
            <span className="fm-dim fm-mono hidden text-[10px] tracking-[0.18em] uppercase sm:inline">
              Winter-over cycle 42
            </span>
          </div>

          <div className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {REPORTS.map((r) => (
              <figure key={r.name}>
                <Stars value={r.stars} />
                <blockquote className="fm-serif mt-3 text-[17px] leading-relaxed text-[var(--fm-ink)]">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-3">
                  <span className="fm-mono text-[11px] tracking-[0.12em] text-[var(--fm-ink)] uppercase">{r.name}</span>
                  <span className="fm-dim fm-mono ml-2 text-[10px] tracking-[0.12em] uppercase">— {r.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ——— §03 Questions ——— */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="fm-h2">
          <span className="fm-num mr-3">§03</span>Questions before a first watch
        </h2>

        <Accordion type="single" collapsible defaultValue="q-0" className="mt-8">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q-${i}`} className="border-[var(--fm-line)]">
              <AccordionTrigger className="py-5 text-left hover:no-underline [&>svg]:text-[var(--fm-mut)]">
                <span className="fm-num mr-3 text-[13px]">0{i + 1}</span>
                <span className="fm-h3 text-[15px]">{f.q}</span>
              </AccordionTrigger>
              <AccordionContent className="fm-body pb-5 pl-8 text-[14px] leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="fm-note mt-8 text-[13px] leading-relaxed">
          Anything else, ask directly — the{" "}
          <Link to="/contact" className="fm-link">
            contact page
          </Link>{" "}
          reaches the operations desk.
        </p>
      </section>

      {/* ——— §04 Access ——— */}
      <section className="border-t border-[var(--fm-line)] bg-[var(--fm-paper)]">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <h2 className="fm-h2">
              <span className="fm-num mr-3">§04</span>Taking the first watch
            </h2>
            <p className="fm-body mt-4 text-[14.5px] leading-relaxed">
              A deployment is initialized once, by one person. That commander becomes
              the system master and issues every account afterwards — operators,
              observers, supervisors. There is no open sign-up, by design: on a real
              station, the roster is short and known.
            </p>
            <p className="fm-dim mt-3 text-[13px] leading-relaxed">
              This instance runs on simulated data. Nothing you do here touches a real
              station, and no expedition data leaves the device.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <GlowingStarsBackgroundCardPreview />
            <Link to="/auth" className="fm-btn fm-btn-solid justify-center">
              Enter command
            </Link>
            <Link to="/about" className="fm-btn fm-btn-quiet justify-center">
              About the project
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
