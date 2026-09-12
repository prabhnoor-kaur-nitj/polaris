import { Panel, StatusBadge } from "@/components/polar/hud";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Check,
  KeyRound,
  Mail,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

type GrantableRole = "member" | "user" | "admin";

const ROLE_LABEL: Record<GrantableRole, string> = {
  member: "OPERATOR",
  user: "OBSERVER",
  admin: "SUPERVISOR",
};

/** Master-only: provision crew credentials and manage who holds portal access. */
export function AccessControl() {
  const { user } = useAuth();
  const isMaster = user?.role === "master";
  const accounts = useQuery(api.access.listAccounts);
  const createCrewAccount = useAction(api.access.createCrewAccount);
  const setUserRole = useAction(api.access.setUserRole);
  const deleteCrewAccount = useAction(api.access.deleteCrewAccount);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<GrantableRole>("member");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isMaster) {
    return (
      <Panel title="Access Control">
        <div className="flex items-center gap-3 py-6 text-center">
          <TriangleAlert className="size-5 shrink-0 text-[#ffd166]" />
          <p className="hud-mono text-[11px] leading-relaxed text-[#9ec8dc]">
            MASTER AUTHORITY REQUIRED — portal access is provisioned exclusively by
            the station master. Your account holds command duties only.
          </p>
        </div>
      </Panel>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await createCrewAccount({ email, name, password, role });
      toast.success(`Account created: ${email}`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("member");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Account creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(userId: Id<"users">, nextRole: GrantableRole) {
    try {
      await setUserRole({ userId, role: nextRole });
      toast.success("Role updated. Live sessions were refreshed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Role update failed.");
    }
  }

  async function handleDelete(account: { id: Id<"users">; email: string; name: string | null }) {
    const label = account.name ?? account.email;
    const confirmed = window.confirm(
      `Remove ${label} (${account.email}) from the portal? Their sessions terminate immediately.`,
    );
    if (!confirmed) return;
    try {
      await deleteCrewAccount({ userId: account.id });
      toast.success(`${label} removed from the portal.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Account removal failed.");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Panel title="Grant Portal Access">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="hud-label mb-1 block" htmlFor="ac-name">
              Crew name
            </label>
            <input
              id="ac-name"
              className="hud-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. R. Iyer"
              disabled={busy}
            />
          </div>
          <div>
            <label className="hud-label mb-1 block" htmlFor="ac-email">
              Email (login ID)
            </label>
            <input
              id="ac-email"
              className="hud-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={busy}
              required
            />
          </div>
          <div>
            <label className="hud-label mb-1 block" htmlFor="ac-password">
              Temporary password
            </label>
            <input
              id="ac-password"
              className="hud-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              disabled={busy}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="hud-label mb-1 block">Access level</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_LABEL) as GrantableRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "hud-mono rounded-md border px-2 py-2 text-[10px] font-bold tracking-[0.14em] transition-colors",
                    role === r
                      ? "border-[#00f5d4]/50 bg-[#00f5d4]/12 text-[#00f5d4]"
                      : "border-[#48cae4]/20 bg-white/3 text-[#9ec8dc] hover:bg-white/8",
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
          {formError && <p className="hud-mono text-[11px] text-[#ff8080]">{formError}</p>}
          <button
            type="submit"
            disabled={busy}
            className="hud-mono flex w-full items-center justify-center gap-2 rounded-md border border-[#00f5d4]/50 bg-[#00f5d4]/15 px-3 py-2.5 text-[11px] font-bold tracking-[0.18em] text-[#00f5d4] transition-colors hover:bg-[#00f5d4]/25 disabled:opacity-40"
          >
            <UserPlus className="size-4" />
            {busy ? "PROVISIONING…" : "CREATE CREW ACCOUNT"}
          </button>
          <p className="hud-mono text-[9px] leading-relaxed text-[#9ec8dc]/60">
            Passwords are hashed server-side (scrypt). Share the temporary password
            over a secure channel; the crew member signs in with email + password.
          </p>
        </form>
      </Panel>

      <Panel
        title="Provisioned Accounts"
        actions={
          <StatusBadge tone="muted">
            <Users className="size-3" />
            {accounts ? `${accounts.length} TOTAL` : "…"}
          </StatusBadge>
        }
        bodyClassName="p-0"
      >
        {!accounts ? (
          <div className="px-4 py-8 text-center">
            <p className="hud-mono text-[10px] tracking-[0.14em] text-[#9ec8dc]/60">
              LOADING ACCOUNT DIRECTORY…
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#48cae4]/8">
            {accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg border",
                    a.isMaster
                      ? "border-[#00f5d4]/40 bg-[#00f5d4]/10 text-[#00f5d4]"
                      : "border-[#48cae4]/30 bg-[#48cae4]/8 text-[#7be6fa]",
                  )}
                >
                  {a.isMaster ? <ShieldCheck className="size-4" /> : <KeyRound className="size-4" />}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="hud-mono truncate text-[12px] font-semibold text-[#d7f4ff]">
                    {a.name ?? a.email}
                  </div>
                  <div className="hud-mono flex items-center gap-1 truncate text-[10px] text-[#9ec8dc]/70">
                    <Mail className="size-3" /> {a.email}
                  </div>
                </div>
                {a.isMaster ? (
                  <StatusBadge tone="sync" pulse>
                    <ShieldCheck className="size-3" /> MASTER
                  </StatusBadge>
                ) : (
                  <div className="flex items-center gap-2">
                    {(Object.keys(ROLE_LABEL) as GrantableRole[]).map((r) => (
                      <RoleChip
                        key={r}
                        active={a.role === r}
                        label={ROLE_LABEL[r]}
                        onClick={() => handleRoleChange(a.id, r)}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => handleDelete(a)}
                      title={`Remove ${a.name ?? a.email}`}
                      className="rounded border border-[#ff4d4d]/30 px-1.5 py-1.5 text-[#ff8080] transition-colors hover:bg-[#ff4d4d]/15"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function RoleChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hud-mono flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-bold tracking-[0.14em] transition-colors",
        active
          ? "border-[#00f5d4]/45 bg-[#00f5d4]/12 text-[#00f5d4]"
          : "border-white/12 bg-white/4 text-[#9ec8dc]/70 hover:bg-white/10",
      )}
    >
      {active ? <Check className="size-3" /> : <X className="size-3 opacity-50" />}
      {label}
    </button>
  );
}
