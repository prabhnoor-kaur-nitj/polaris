import { SiteLayout } from "@/components/site/SiteChrome";
import { usePageTitle } from "@/hooks/use-page-title";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, Radio, Snowflake } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const PRIORITIES = [
  {
    title: "Station deployment",
    body: "Full HUD provisioning for one station: radar, supply node, route planner and SOS solve.",
  },
  {
    title: "Traverse fleet trial",
    body: "Route planning + telemetry for a traverse season, evaluated against your fuel logs.",
  },
  {
    title: "Field assessment",
    body: "Offline-first audit of your current logistics workflow, with a POLARIS readiness report.",
  },
];

export default function Waitlist() {
  usePageTitle("Join the Waitlist");
  const join = useMutation(api.site.joinWaitlist);

  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [station, setStation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Reactive check: as soon as a valid email is typed, this reflects whether
  // it is already on the list (public, own-email-only RLS query).
  const trimmed = email.trim().toLowerCase();
  const known = useQuery(
    api.site.checkWaitlist,
    trimmed.includes("@") && trimmed.includes(".") ? { email: trimmed } : "skip",
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await join({ email, org: org || undefined, station: station || undefined });
      if (res.duplicate) {
        toast.info("You're already on the manifest — position held.");
      } else {
        toast.success("Seat secured on the deployment manifest.");
      }
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done || known?.joined) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-xl border border-[#00f5d4]/40 bg-[#00f5d4]/10 text-[#00f5d4]">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#eaf8ff]">
            You're on the manifest.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#9ec8dc]">
            {done
              ? "Your seat is held for the next deployment window. Command will reach out with provisioning details before the season opens."
              : "This frequency is already registered — your earlier position stands. Command will reach out with provisioning details before the season opens."}
          </p>
          <a
            href="/"
            className="hud-mono mt-7 inline-block rounded-md border border-[#48cae4]/40 bg-[#48cae4]/10 px-5 py-2.5 text-[10px] font-bold tracking-[0.18em] text-[#7be6fa] transition-colors hover:bg-[#48cae4]/20"
          >
            BACK TO COMMAND
          </a>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <span className="hud-mono inline-flex items-center gap-2 rounded-md border border-[#00f5d4]/40 bg-[#00f5d4]/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#00f5d4]">
          <Radio className="size-3.5" /> DEPLOYMENT WINDOW OPENS SOON
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-[#eaf8ff] sm:text-5xl">
          Reserve your station's slot on the{" "}
          <span className="bg-gradient-to-r from-[#48cae4] to-[#00f5d4] bg-clip-text text-transparent">
            POLARIS manifest.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#9ec8dc]">
          Deployments are provisioned per station, in seasonal order. Join the waitlist and
          command will contact you before the next window opens.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="hud-panel space-y-4 p-6">
          <div>
            <label className="hud-label mb-1 block" htmlFor="wl-email">
              Command frequency (email)
            </label>
            <input
              id="wl-email"
              className="hud-input w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={busy}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="hud-label mb-1 block" htmlFor="wl-org">
                Organisation
              </label>
              <input
                id="wl-org"
                className="hud-input w-full"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. Polar Research Division"
                disabled={busy}
              />
            </div>
            <div>
              <label className="hud-label mb-1 block" htmlFor="wl-station">
                Station / post
              </label>
              <input
                id="wl-station"
                className="hud-input w-full"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder="e.g. Bharati"
                disabled={busy}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="hud-mono flex w-full items-center justify-center gap-2 rounded-md border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-5 py-3 text-[11px] font-bold tracking-[0.18em] text-[#00f5d4] transition-colors hover:bg-[#00f5d4]/25 disabled:opacity-40"
          >
            <Snowflake className="size-4" />
            {busy ? "RESERVING…" : "RESERVE DEPLOYMENT SLOT"}
          </button>
          <p className="hud-mono text-[9px] leading-relaxed text-[#9ec8dc]/60">
            One entry per frequency. Stored on the POLARIS server, readable only by the station
            master — never shared, never sold.
          </p>
        </form>

        <aside className="space-y-3">
          <p className="hud-mono text-[10px] tracking-[0.16em] text-[#9ec8dc]/70">
            MANIFEST TIERS
          </p>
          {PRIORITIES.map((p) => (
            <div key={p.title} className="hud-panel p-4">
              <h2 className="hud-mono text-[11px] font-bold tracking-[0.12em] text-[#d7f4ff]">
                {p.title.toUpperCase()}
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[#9ec8dc]">{p.body}</p>
            </div>
          ))}
        </aside>
      </section>
    </SiteLayout>
  );
}
