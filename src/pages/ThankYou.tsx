import { SiteLayout } from "@/components/site/SiteChrome";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowRight, CheckCircle2, Mail, Radio } from "lucide-react";
import { Link } from "react-router";

const NEXT_STEPS = [
  {
    icon: Radio,
    title: "Watch your frequency",
    body: "Command responds during the next transmission window — usually within one station day.",
  },
  {
    icon: Mail,
    title: "Keep the channel clear",
    body: "Check spam filters for uplinks from the polaris.example.com domain.",
  },
];

/** Post-action confirmation page for the contact form. */
export default function ThankYou() {
  usePageTitle("Transmission Received");

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-20">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-[#00f5d4]/40 bg-[#00f5d4]/10 text-[#00f5d4]">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#eaf8ff] sm:text-4xl">
          Message received. Channel closing.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#9ec8dc]">
          Your transmission is in the queue. The operations desk responds during the next
          comms window.
        </p>

        <div className="mt-10 space-y-3 text-left">
          {NEXT_STEPS.map((s) => (
            <div key={s.title} className="hud-panel flex items-start gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#48cae4]/30 bg-[#48cae4]/10 text-[#48cae4]">
                <s.icon className="size-4" />
              </span>
              <div>
                <h2 className="hud-mono text-[11px] font-bold tracking-[0.12em] text-[#d7f4ff]">
                  {s.title.toUpperCase()}
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-[#9ec8dc]">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="hud-mono rounded-md border border-[#48cae4]/40 bg-[#48cae4]/10 px-5 py-2.5 text-[10px] font-bold tracking-[0.18em] text-[#7be6fa] transition-colors hover:bg-[#48cae4]/20"
          >
            BACK TO COMMAND
          </Link>
          <Link
            to="/contact"
            className="hud-mono flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-2.5 text-[10px] font-bold tracking-[0.18em] text-[#9ec8dc] transition-colors hover:bg-white/10"
          >
            SEND ANOTHER <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
