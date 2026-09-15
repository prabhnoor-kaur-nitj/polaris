import { SiteLayout } from "@/components/site/SiteChrome";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const NEXT_STEPS = [
  {
    num: "01",
    title: "Watch your frequency",
    body: "The operations desk answers during the next comms window — usually within one station day.",
  },
  {
    num: "02",
    title: "Keep the channel clear",
    body: "Check spam filters for uplinks from the polaris.example.com domain.",
  },
];

/** Post-action confirmation page for the contact form. */
export default function ThankYou() {
  usePageTitle("Transmission Received");

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-5 py-20 sm:py-28">
        <p className="fm-label fm-rise">Receipt · Logged at station time</p>
        <h1 className="fm-h1 fm-rise mt-5">
          Message received. <em className="fm-serif italic text-[var(--fm-accent)]">Channel closing.</em>
        </h1>
        <p className="fm-body fm-rise mt-5 max-w-lg text-[15px]">
          Your transmission is in the queue. No auto-reply will follow — the next thing
          you see should be a human answer.
        </p>

        <div className="mt-12">
          {NEXT_STEPS.map((s) => (
            <div key={s.num} className="fm-row grid grid-cols-[50px_1fr] gap-3 py-5">
              <span className="fm-num">{s.num}</span>
              <div>
                <h2 className="fm-h3">{s.title}</h2>
                <p className="fm-body mt-1 text-[13.5px] leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-[var(--fm-line)] pt-8">
          <Link to="/" className="fm-btn fm-btn-quiet">
            Back to the index
          </Link>
          <Link to="/contact" className="fm-mono text-[11px] tracking-[0.16em] text-[var(--fm-accent)] uppercase transition-colors hover:text-[var(--fm-ink)]">
            Send another <ArrowRight className="inline size-3" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
