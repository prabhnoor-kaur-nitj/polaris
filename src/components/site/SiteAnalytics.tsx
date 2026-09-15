// Master-only site analytics: anonymous traffic summary, waitlist manifest and
// the contact inbox. All queries return null for non-masters (server-side RLS
// in src/convex/site.ts), so this panel degrades to an access notice.
import { api } from "@/convex/_generated/api";
import { Panel, StatusBadge } from "@/components/polar/hud";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Eye,
  Inbox,
  ListChecks,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";

export function SiteAnalytics() {
  const { user } = useAuth();
  const isMaster = user?.role === "master";

  const summary = useQuery(api.site.analyticsSummary, isMaster ? {} : "skip");
  const waitlist = useQuery(api.site.listWaitlist, isMaster ? {} : "skip");
  const messages = useQuery(api.site.listContactMessages, isMaster ? {} : "skip");

  const dismissMessage = useAction(api.site.dismissContactMessage);
  const removeWaitlistEntry = useAction(api.site.removeWaitlistEntry);

  if (!isMaster) {
    return (
      <Panel title="Site Analytics">
        <div className="flex items-center gap-3 py-4">
          <TriangleAlert className="size-5 shrink-0 text-[#ffd166]" />
          <p className="hud-mono text-[11px] leading-relaxed text-[#9ec8dc]">
            MASTER AUTHORITY REQUIRED — site traffic, waitlist and contact telemetry are
            restricted to the station master.
          </p>
        </div>
      </Panel>
    );
  }

  const maxDaily = Math.max(1, ...(summary?.daily.map((d) => d.count) ?? [1]));

  return (
    <div className="space-y-4">
      <Panel
        title="Site Analytics"
        actions={
          <StatusBadge tone="muted">
            <Activity className="size-3" />
            {summary ? `${summary.viewsLast24h} LAST 24H` : "…"}
          </StatusBadge>
        }
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="TOTAL PAGE VIEWS" value={summary?.totalViews} icon={Eye} />
          <Stat label="WAITLIST SEATS" value={summary?.waitlistCount} icon={ListChecks} />
          <Stat label="CONTACT MESSAGES" value={summary?.messageCount} icon={Inbox} />
          <Stat label="VIEWS LAST 24H" value={summary?.viewsLast24h} icon={BarChart3} />
        </div>

        {/* 7-day traffic bars */}
        <div className="mt-5">
          <p className="hud-label mb-2">Traffic · last 7 days (UTC)</p>
          <div className="flex h-24 items-end gap-2">
            {(summary?.daily ?? []).map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t border-t border-x border-[#48cae4]/40 bg-[#48cae4]/15"
                  style={{ height: `${Math.max(6, (d.count / maxDaily) * 72)}px` }}
                  title={`${d.label}: ${d.count} views`}
                />
                <span className="hud-mono text-[8px] text-[#9ec8dc]/60">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top paths */}
        <div className="mt-5">
          <p className="hud-label mb-2">Top routes</p>
          {summary && summary.topPaths.length > 0 ? (
            <ul className="space-y-1.5">
              {summary.topPaths.map((p) => (
                <li key={p.path} className="flex items-center gap-2">
                  <span className="hud-mono flex-1 truncate text-[10px] text-[#9ec8dc]">
                    {p.path}
                  </span>
                  <span className="hud-mono rounded border border-[#48cae4]/25 bg-[#48cae4]/8 px-1.5 py-0.5 text-[9px] font-bold text-[#7be6fa]">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hud-mono text-[10px] text-[#9ec8dc]/60">
              NO TRAFFIC RECORDED YET — VIEWS APPEAR AS VISITORS NAVIGATE THE SITE.
            </p>
          )}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Waitlist manifest */}
        <Panel
          title="Waitlist Manifest"
          actions={
            <StatusBadge tone="sync">{waitlist ? `${waitlist.length} SEATS` : "…"}</StatusBadge>
          }
          bodyClassName="p-0"
        >
          {!waitlist || waitlist.length === 0 ? (
            <p className="hud-mono px-4 py-6 text-[10px] tracking-[0.14em] text-[#9ec8dc]/60">
              NO WAITLIST ENTRIES YET.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-[#48cae4]/8 overflow-auto">
              {waitlist.map((w) => (
                <li key={w.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="hud-mono truncate text-[11px] font-semibold text-[#d7f4ff]">
                      {w.email}
                    </div>
                    <div className="hud-label truncate">
                      {w.org ?? "—"}
                      {w.station ? ` · ${w.station}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Remove from waitlist"
                    onClick={async () => {
                      try {
                        await removeWaitlistEntry({ id: w.id });
                        toast.success("Waitlist entry removed.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Removal failed.");
                      }
                    }}
                    className="rounded border border-[#ff4d4d]/30 px-1.5 py-1.5 text-[#ff8080] transition-colors hover:bg-[#ff4d4d]/15"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Contact inbox */}
        <Panel
          title="Contact Inbox"
          actions={
            <StatusBadge tone="muted">{messages ? `${messages.length} FILED` : "…"}</StatusBadge>
          }
          bodyClassName="p-0"
        >
          {!messages || messages.length === 0 ? (
            <p className="hud-mono px-4 py-6 text-[10px] tracking-[0.14em] text-[#9ec8dc]/60">
              INBOX CLEAR — NO TRANSMISSIONS.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-[#48cae4]/8 overflow-auto">
              {messages.map((m) => (
                <li key={m.id} className="px-4 py-2.5">
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
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#9ec8dc]">
                    {m.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Eye;
}) {
  return (
    <div className="rounded-lg border border-[#48cae4]/15 bg-[#48cae4]/5 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[#48cae4]">
        <Icon className="size-3.5" />
        <span className="hud-mono text-xl font-bold text-[#7be6fa]">
          {value ?? "—"}
        </span>
      </div>
      <div className={cn("hud-label mt-1")}>{label}</div>
    </div>
  );
}
