// Master-only contact inbox. The backing query returns null for non-masters
// (server-side RLS in src/convex/site.ts), so this panel degrades to an
// access notice for every other role.
import { api } from "@/convex/_generated/api";
import { Panel, StatusBadge } from "@/components/polar/hud";
import { useAuth } from "@/hooks/use-auth";
import { Inbox, Trash2, TriangleAlert } from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";

export function ContactInbox() {
  const { user } = useAuth();
  const isMaster = user?.role === "master";

  const messages = useQuery(api.site.listContactMessages, isMaster ? {} : "skip");
  const dismissMessage = useAction(api.site.dismissContactMessage);

  if (!isMaster) {
    return (
      <Panel title="Contact inbox">
        <div className="flex items-center gap-3 py-4">
          <TriangleAlert className="size-5 shrink-0 text-[var(--fm-warn)]" />
          <p className="fm-mono text-[11px] leading-relaxed text-[var(--fm-mut)]">
            MASTER AUTHORITY REQUIRED — contact transmissions are restricted to the
            station master.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Contact inbox"
      actions={
        <StatusBadge tone="muted">
          <Inbox className="size-3" />
          {messages ? `${messages.length} filed` : "…"}
        </StatusBadge>
      }
      bodyClassName="p-0"
    >
      {!messages || messages.length === 0 ? (
        <p className="fm-mono px-4 py-6 text-[10px] tracking-[0.14em] text-[var(--fm-mut)] uppercase">
          Inbox clear — no transmissions.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--fm-line-soft)]">
          {messages.map((m) => (
            <li key={m.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="fm-mono min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--fm-ink)]">
                  {m.subject}
                </span>
                <button
                  type="button"
                  title="Dismiss message"
                  onClick={async () => {
                    try {
                      await dismissMessage({ id: m.id });
                      toast.success("Message dismissed.");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Dismiss failed.");
                    }
                  }}
                  className="rounded-sm border border-[rgba(208,92,75,0.35)] px-1.5 py-1.5 text-[var(--fm-alert)] transition-colors hover:bg-[rgba(208,92,75,0.1)]"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="fm-label mt-0.5 truncate">
                {m.name} · {m.email}
              </p>
              <p className="fm-body mt-1 text-[11px] leading-relaxed">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
