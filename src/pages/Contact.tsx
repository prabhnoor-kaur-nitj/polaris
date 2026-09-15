import { SiteLayout } from "@/components/site/SiteChrome";
import { usePageTitle } from "@/hooks/use-page-title";
import { api } from "@/convex/_generated/api";
import { Send } from "lucide-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const CHANNELS = [
  {
    title: "Operations desk",
    body: "Deployment planning, training, press. Answered within one station day.",
    meta: "ops@polaris.example.com",
  },
  {
    title: "Station liaison",
    body: "Onboarding for a specific station. Include the station ID in the subject line.",
    meta: "Sector 70S · Maitri grid",
  },
  {
    title: "Field trials",
    body: "Running the console against your own traverse logs during a season.",
    meta: "By arrangement",
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
      toast.success("Message filed.");
      navigate("/thank-you");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transmission failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <p className="fm-label">Transmissions · Comms window open</p>
        <h1 className="fm-h1 mt-5">
          Write to <em className="fm-serif italic text-[var(--fm-accent)]">the operations desk.</em>
        </h1>
        <p className="fm-body mt-6 max-w-xl text-[15px]">
          One form, read by one person. No ticket numbers, no auto-replies — messages
          are answered during the next comms window.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-12 px-5 pb-20 lg:grid-cols-[1fr_300px]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="fm-rise max-w-xl space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="fm-label-field" htmlFor="ct-name">
                Name
              </label>
              <input
                id="ct-name"
                className="fm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who is transmitting"
                required
                disabled={busy}
              />
            </div>
            <div>
              <label className="fm-label-field" htmlFor="ct-email">
                Email
              </label>
              <input
                id="ct-email"
                className="fm-input"
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
            <label className="fm-label-field" htmlFor="ct-subject">
              Subject
            </label>
            <input
              id="ct-subject"
              className="fm-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Deployment window for Bharati, Q3"
              required
              disabled={busy}
            />
          </div>
          <div>
            <label className="fm-label-field" htmlFor="ct-message">
              Message
            </label>
            <textarea
              id="ct-message"
              className="fm-input min-h-40 resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Transmit your message…"
              required
              maxLength={4000}
              disabled={busy}
            />
            <p className="fm-dim fm-mono mt-1.5 text-right text-[10px]">{message.length}/4000</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-[var(--fm-line)] pt-6">
            <button type="submit" disabled={busy} className="fm-btn fm-btn-solid">
              <Send className="size-3.5" />
              {busy ? "Transmitting…" : "Transmit message"}
            </button>
            <p className="fm-dim text-[12px]">
              Delivered to the station master's inbox, and to no one else.
            </p>
          </div>
        </form>

        {/* Channels */}
        <aside>
          <p className="fm-label mb-4">Channels</p>
          <div className="space-y-5">
            {CHANNELS.map((c) => (
              <div key={c.title} className="border-l border-[var(--fm-line)] pl-4">
                <h2 className="fm-mono text-[12px] tracking-[0.1em] text-[var(--fm-ink)] uppercase">
                  {c.title}
                </h2>
                <p className="fm-body mt-1 text-[12.5px] leading-relaxed">{c.body}</p>
                <p className="fm-dim fm-mono mt-1.5 text-[10px] tracking-[0.14em] uppercase">{c.meta}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
