import { SiteLayout } from "@/components/site/SiteChrome";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const PRINCIPLES = [
  {
    num: "a.",
    title: "Offline is the baseline, not the fallback",
    body: "Antarctica does not negotiate on bandwidth. Every POLARIS feature is exercised with the network switch in the OFFLINE position during testing — that is the design condition, not a degraded mode.",
  },
  {
    num: "b.",
    title: "One grid, every asset",
    body: "People, vehicles, fuel, medicine and power share the same tactical map. On the ice, a missing reading in any one of them becomes an emergency in all of them within hours.",
  },
  {
    num: "c.",
    title: "The roster is short and known",
    body: "There is no open sign-up. One master provisions every account and can revoke them, terminating live sessions immediately — the same chain of command as the station itself.",
  },
];

const CREW = [
  { name: "Cdr. A. Sharma", role: "Station master · mission lead", tag: "Master" },
  { name: "R. Iyer", role: "Logistics & supply chain", tag: "Operator" },
  { name: "Dr. M. Kaur", role: "Medical & crew welfare", tag: "Supervisor" },
  { name: "J. Okafor", role: "Traverse & route planning", tag: "Operator" },
  { name: "S. Verma", role: "Comms, mesh & SATCOM", tag: "Operator" },
  { name: "L. Fischer", role: "Field telemetry & sensors", tag: "Observer" },
];

export default function About() {
  usePageTitle("About the Expedition");

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <p className="fm-label">Dossier · POLARIS project</p>
        <h1 className="fm-h1 mt-5 max-w-3xl">
          Built for stations where{" "}
          <em className="fm-serif italic text-[var(--fm-accent)]">
            the link never comes first.
          </em>
        </h1>
        <div className="mt-8 max-w-2xl space-y-5 text-[15px] leading-relaxed">
          <p className="fm-body">
            POLARIS began as a question from a winter-over crew: why does every piece of
            logistics software we are handed assume we can see a satellite? During a
            whiteout, a tool that needs the internet is not a tool — it is a liability
            with a login screen.
          </p>
          <p className="fm-body">
            So the system was written backwards from the worst week of the season: no
            link, no resupply, four people awake and one decision that matters. Every
            write lands on the device first, syncs when a window opens, and never
            blocks the operator standing in front of it.
          </p>
          <p className="fm-dim">
            This public build is a simulated field environment — a full station model
            with generated telemetry, safe to drill against.
          </p>
        </div>
      </section>

      {/* Team plate */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <figure>
          <div className="fm-panel overflow-hidden">
            <img
              src="/team-photo.svg"
              alt="The POLARIS expedition team — six crew members standing in front of an Antarctic research station under an aurora sky"
              className="aspect-[900/440] w-full object-cover"
              loading="lazy"
            />
          </div>
          <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
            <span className="fm-dim fm-mono text-[10px] tracking-[0.18em] uppercase">
              Plate 1 — Winter-over crew, cycle 42, Maitri station
            </span>
            <span className="fm-serif text-[12px] italic text-[var(--fm-mut)]">
              Illustration: station north face, 21:40 local
            </span>
          </figcaption>
        </figure>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="fm-h2">
          <span className="fm-num mr-3">§02</span>Operating principles
        </h2>
        <div className="mt-8 max-w-3xl">
          {PRINCIPLES.map((p) => (
            <article key={p.num} className="fm-row grid gap-2 py-6 sm:grid-cols-[70px_1fr]">
              <span className="fm-num">{p.num}</span>
              <div className="max-w-2xl">
                <h3 className="fm-h3 fm-serif text-lg font-normal">{p.title}</h3>
                <p className="fm-body mt-1.5 text-[14px] leading-relaxed">{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Roster */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <h2 className="fm-h2">
          <span className="fm-num mr-3">§03</span>The command crew
        </h2>
        <div className="fm-panel mt-8 max-w-3xl overflow-hidden">
          <ul>
            {CREW.map((c) => (
              <li key={c.name} className="fm-row flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3.5">
                <span className="fm-mono min-w-0 text-[13px] text-[var(--fm-ink)]">{c.name}</span>
                <span className="fm-dim flex-1 text-[12.5px]">{c.role}</span>
                <span className="fm-tag">{c.tag}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next steps */}
        <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-[var(--fm-line)] pt-8">
          <p className="fm-body max-w-md flex-1 text-[14px]">
            Run your station on the same grid — message the operations desk, or take a
            simulated watch.
          </p>
          <Link to="/contact" className="fm-btn fm-btn-quiet">
            Contact command
          </Link>
          <Link to="/auth" className="fm-btn fm-btn-solid">
            Enter command <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
