import { SiteLayout } from "@/components/site/SiteChrome";
import { usePageTitle } from "@/hooks/use-page-title";
import { api } from "@/convex/_generated/api";
import { Antenna, Clock, Mail, MapPin, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const CHANNELS = [
  {
    icon: Antenna,
    title: "VHF MESH RELAY",
    body: "Priority channel for station operations and SOS-adjacent logistics queries.",
    meta: "CH 16 · WATCH 24/7",
  },
  {
    icon: Mail,
    title: "SATCOM UPLINK",
    body: "Batched twice daily during pass windows. Include your station ID in the subject.",
    meta: "ops@polaris.example.com",
  },
  {
    icon: MapPin,
    title: "FIELD COORDINATION",
    body: "Deployment planning, training and station onboarding questions.",
    meta: "SECTOR 70S · MAITRI GRID",
  },
];

export default function Contact() {
  usePageTitle("Contact Command");
  const navigate = useNavigate();
  const submit = useMutation(api.site.submitContact);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await submit({ name, email, subject, message });
      toast.success("Message filed. Command will respond on the next pass.");
      navigate("/thank-you?kind=contact");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transmission failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <span className="hud-mono inline-flex items-center gap-2 rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#7be6fa]">
          <Clock className="size-3.5" /> COMMS WINDOW OPEN
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#eaf8ff] sm:text-5xl">
          Contact command.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#9ec8dc]">
          File a message to the POLARIS operations desk. Messages are queued locally on this
          device and transmitted immediately — no stamp, no courier, no icebreaker required.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="hud-panel space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="hud-label mb-1 block" htmlFor="ct-name">
                Operator name
              </label>
              <input
                id="ct-name"
                className="hud-input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. R. Iyer"
                required
                disabled={busy}
              />
            </div>
            <div>
              <label className="hud-label mb-1 block" htmlFor="ct-email">
                Return frequency (email)
              </label>
              <input
                id="ct-email"
                className="hud-input w-full"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <label className="hud-label mb-1 block" htmlFor="ct-subject">
              Subject
            </label>
            <input
              id="ct-subject"
              className="hud-input w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Deployment window for Bharati Q3"
              required
              disabled={busy}
            />
          </div>
          <div>
            <label className="hud-label mb-1 block" htmlFor="ct-message">
              Message
            </label>
            <textarea
              id="ct-message"
              className="hud-input min-h-36 w-full resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Transmit your message…"
              required
              maxLength={4000}
              disabled={busy}
            />
            <p className="hud-mono mt-1 text-right text-[9px] text-[#9ec8dc]/50">
              {message.length}/4000
            </p>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="hud-mono flex items-center justify-center gap-2 rounded-md border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-5 py-3 text-[11px] font-bold tracking-[0.18em] text-[#00f5d4] transition-colors hover:bg-[#00f5d4]/25 disabled:opacity-40"
          >
            <Send className="size-4" />
            {busy ? "TRANSMITTING…" : "TRANSMIT MESSAGE"}
          </button>
        </form>

        {/* Channels */}
        <aside className="space-y-3">
          {CHANNELS.map((c) => (
            <div key={c.title} className="hud-panel p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg border border-[#48cae4]/30 bg-[#48cae4]/10 text-[#48cae4]">
                  <c.icon className="size-4" />
                </span>
                <h2 className="hud-mono text-[11px] font-bold tracking-[0.12em] text-[#d7f4ff]">
                  {c.title}
                </h2>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[#9ec8dc]">{c.body}</p>
              <p className="hud-mono mt-2 text-[9px] tracking-[0.14em] text-[#7be6fa]">
                {c.meta}
              </p>
            </div>
          ))}
        </aside>
      </section>
    </SiteLayout>
  );
}
