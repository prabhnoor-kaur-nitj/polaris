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
      <Panel title="Contact Inbox">
        <div className="flex items-center gap-3 py-4">
          <TriangleAlert className="size-5 shrink-0 text-[#ffd166]" />
          <p className="hud-mono text-[11px] leading-relaxed text-[#9ec8dc]">
            MASTER AUTHORITY REQUIRED — contact transmissions are restricted to the
            station master.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Contact Inbox"
      actions={
        <StatusBadge tone="muted">
          <Inbox className="size-3" />
          {messages ? `${messages.length} FILED` : "…"}
        </StatusBadge>
      }
      bodyClassName="p-0"
    >
      {!messages || messages.length === 0 ? (
        <p className="hud-mono px-4 py-6 text-[10px] tracking-[0.14em] text-[#9ec8dc]/60">
          INBOX CLEAR — NO TRANSMISSIONS.
        </p>
      ) : (
        <ul className="divide-y divide-[#48cae4]/8">
          {messages.map((m) => (
            <li key={m.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="hud-mono min-w-0 flex-1 truncate text-[11px] font-semibold text-[#d7f4ff]">
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
                  className="rounded border border-[#ff4d4d]/30 px-1.5 py-1.5 text-[#ff8080] transition-colors hover:bg-[#ff4d4d]/15"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="hud-label mt-0.5 truncate">
                {m.name} · {m.email}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#9ec8dc]">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
