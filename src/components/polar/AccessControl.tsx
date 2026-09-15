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
  member: "Operator",
  user: "Observer",
  admin: "Supervisor",
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
      <Panel title="Access control">
        <div className="flex items-center gap-3 py-6">
          <TriangleAlert className="size-5 shrink-0 text-[var(--fm-warn)]" />
          <p className="fm-mono text-[11px] leading-relaxed text-[var(--fm-mut)]">
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
      <Panel title="Grant portal access">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="fm-label-field" htmlFor="ac-name">
              Crew name
            </label>
            <input
              id="ac-name"
              className="fm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. R. Iyer"
              disabled={busy}
            />
          </div>
          <div>
            <label className="fm-label-field" htmlFor="ac-email">
              Email (login ID)
            </label>
            <input
              id="ac-email"
              className="fm-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={busy}
              required
            />
          </div>
          <div>
            <label className="fm-label-field" htmlFor="ac-password">
              Temporary password
            </label>
            <input
              id="ac-password"
              className="fm-input"
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
            <label className="fm-label-field">Access level</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_LABEL) as GrantableRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "fm-mono rounded-sm border px-2 py-2 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors",
                    role === r
                      ? "border-[rgba(127,174,142,0.5)] bg-[rgba(127,174,142,0.1)] text-[var(--fm-good)]"
                      : "border-[var(--fm-line)] text-[var(--fm-mut)] hover:text-[var(--fm-ink)]",
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
          {formError && <p className="fm-mono text-[11px] text-[var(--fm-alert)]">{formError}</p>}
          <button
            type="submit"
            disabled={busy}
            className="fm-btn fm-btn-solid w-full disabled:opacity-40"
          >
            <UserPlus className="size-3.5" />
            {busy ? "Provisioning…" : "Create crew account"}
          </button>
          <p className="fm-mono text-[9px] leading-relaxed text-[var(--fm-mut)] uppercase">
            Passwords are hashed server-side (scrypt). Share the temporary password
            over a secure channel; the crew member signs in with email + password.
          </p>
        </form>
      </Panel>

      <Panel
        title="Provisioned accounts"
        actions={
          <StatusBadge tone="muted">
            <Users className="size-3" />
            {accounts ? `${accounts.length} total` : "…"}
          </StatusBadge>
        }
        bodyClassName="p-0"
      >
        {!accounts ? (
          <div className="px-4 py-8 text-center">
            <p className="fm-mono text-[10px] tracking-[0.14em] text-[var(--fm-mut)] uppercase">
              Loading account directory…
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--fm-line-soft)]">
            {accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "fm-plate size-9",
                    a.isMaster
                      ? "border-[rgba(127,174,142,0.4)] text-[var(--fm-good)]"
                      : "text-[var(--fm-accent)]",
                  )}
                >
                  {a.isMaster ? <ShieldCheck className="size-4" /> : <KeyRound className="size-4" />}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="fm-mono truncate text-[12px] font-semibold text-[var(--fm-ink)]">
                    {a.name ?? a.email}
                  </div>
                  <div className="fm-mono flex items-center gap-1 truncate text-[10px] text-[var(--fm-mut)]">
                    <Mail className="size-3" /> {a.email}
                  </div>
                </div>
                {a.isMaster ? (
                  <StatusBadge tone="sync" pulse>
                    <ShieldCheck className="size-3" /> Master
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
                      className="rounded-sm border border-[rgba(208,92,75,0.35)] px-1.5 py-1.5 text-[var(--fm-alert)] transition-colors hover:bg-[rgba(208,92,75,0.1)]"
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
        "fm-mono flex items-center gap-1 rounded-sm border px-2 py-1 text-[9px] font-bold tracking-[0.14em] uppercase transition-colors",
        active
          ? "border-[rgba(127,174,142,0.5)] bg-[rgba(127,174,142,0.1)] text-[var(--fm-good)]"
          : "border-[var(--fm-line)] text-[var(--fm-mut)] hover:text-[var(--fm-ink)]",
      )}
    >
      {active ? <Check className="size-3" /> : <X className="size-3 opacity-50" />}
      {label}
    </button>
  );
}
