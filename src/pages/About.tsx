import { SiteLayout } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowRight, CloudOff, Radio, ShieldCheck, Snowflake } from "lucide-react";
import { Link } from "react-router";

const CREW = [
  { name: "Cdr. A. Sharma", role: "Station Master · Mission Lead", tag: "MASTER" },
  { name: "R. Iyer", role: "Logistics & Supply Chain", tag: "OPERATOR" },
  { name: "Dr. M. Kaur", role: "Medical & Crew Welfare", tag: "SUPERVISOR" },
  { name: "J. Okafor", role: "Traverse & Route Planning", tag: "OPERATOR" },
  { name: "S. Verma", role: "Comms, Mesh & SATCOM", tag: "OPERATOR" },
  { name: "L. Fischer", role: "Field Telemetry & Sensors", tag: "OBSERVER" },
];

const PRINCIPLES = [
  {
    icon: CloudOff,
    title: "Offline is the default",
    body: "Antarctica doesn't negotiate on bandwidth. Every POLARIS feature works with the network switch in the OFFLINE position — that's not a degradation, it's the design baseline.",
  },
  {
    icon: Radio,
    title: "One grid, every asset",
    body: "People, vehicles, fuel, medicine and power live on the same tactical map, because on the ice a missing reading in any one of them is an emergency in all of them.",
  },
  {
    icon: ShieldCheck,
    title: "Master-controlled access",
    body: "No open sign-ups. A single station master provisions every account, and role changes revoke live sessions instantly — the same chain of command as the station itself.",
  },
];

export default function About() {
  usePageTitle("About the Expedition");

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <span className="hud-mono inline-flex items-center gap-2 rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#7be6fa]">
          <Snowflake className="size-3.5" /> MISSION BRIEFING
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-[#eaf8ff] sm:text-5xl">
          Built for the stations where the{" "}
          <span className="bg-gradient-to-r from-[#48cae4] to-[#00f5d4] bg-clip-text text-transparent">
            link never comes first.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#9ec8dc]">
          POLARIS | Expedition Command is a tactical logistics and asset-management HUD for
          polar research stations. It exists for one reason: during a whiteout, logistics
          software that needs the internet is not software at all. Every write lands on your
          device first, syncs when a window opens, and never blocks the operator.
        </p>
      </section>

      {/* Team photo */}
      <section className="mx-auto max-w-6xl px-4">
        <figure className="hud-panel overflow-hidden">
          <img
            src="/team-photo.svg"
            alt="The POLARIS expedition team — six crew members standing in front of an Antarctic research station under an aurora sky"
            className="aspect-[900/440] w-full object-cover"
            loading="lazy"
          />
          <figcaption className="border-t border-[#48cae4]/10 px-4 py-3">
            <span className="hud-mono text-[10px] tracking-[0.16em] text-[#9ec8dc]">
              WINTER-OVER CREW · CYCLE 42 · MAITRI STATION
            </span>
          </figcaption>
        </figure>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-[#eaf8ff] sm:text-3xl">
          Operating principles
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="hud-panel p-5">
              <span className="mb-3 grid size-10 place-items-center rounded-lg border border-[#48cae4]/30 bg-[#48cae4]/10 text-[#48cae4]">
                <p.icon className="size-5" />
              </span>
              <h3 className="hud-mono text-[13px] font-bold tracking-[0.08em] text-[#d7f4ff]">
                {p.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#9ec8dc]">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Crew roster */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="text-2xl font-bold tracking-tight text-[#eaf8ff] sm:text-3xl">
          The command crew
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CREW.map((c) => (
            <li key={c.name} className="hud-panel flex items-center gap-3 p-4">
              <span
                className={
                  c.tag === "MASTER"
                    ? "grid size-10 shrink-0 place-items-center rounded-lg border border-[#00f5d4]/40 bg-[#00f5d4]/10 text-[#00f5d4]"
                    : "grid size-10 shrink-0 place-items-center rounded-lg border border-[#48cae4]/30 bg-[#48cae4]/8 text-[#7be6fa]"
                }
              >
                <ShieldCheck className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="hud-mono truncate text-[12px] font-bold text-[#d7f4ff]">
                  {c.name}
                </div>
                <div className="hud-label truncate">{c.role}</div>
              </div>
              <span className="hud-mono ml-auto rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.14em] text-[#9ec8dc]">
                {c.tag}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="hud-panel flex flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#eaf8ff]">
              Run your station on the same grid.
            </h2>
            <p className="mt-1 text-sm text-[#9ec8dc]">
              File a message to command or sign straight into the simulated command deck.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              className="hud-mono h-11 border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-5 text-[10px] font-bold tracking-[0.18em] text-[#00f5d4] hover:bg-[#00f5d4]/25"
            >
              <Link to="/contact">CONTACT COMMAND</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hud-mono h-11 border-[#48cae4]/40 bg-transparent px-5 text-[10px] font-bold tracking-[0.18em] text-[#7be6fa] hover:bg-[#48cae4]/10 hover:text-[#7be6fa]"
            >
              <Link to="/auth">
                ENTER COMMAND <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
