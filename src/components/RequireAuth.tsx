import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

/**
 * Portal guard: the user must be signed in AND hold a portal role granted by
 * the master. Authenticated users without a role are held on an access-pending
 * screen instead of bouncing between /auth and /dashboard (their credentials
 * work; their access does not exist yet).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fm flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--fm-mut)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  const role = user?.role ?? null;
  if (role !== "master" && role !== "member" && role !== "user" && role !== "admin") {
    return <AccessPending email={user?.email ?? null} />;
  }

  return children;
}

/** Shown to signed-in users the master has not granted a portal role yet. */
function AccessPending({ email }: { email: string | null }) {
  const { signOut } = useAuth();

  return (
    <div className="fm flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16">
        <p className="fm-label fm-rise">Access · Awaiting provisioning</p>
        <h1 className="fm-h1 fm-rise mt-5">
          Credentials valid.{" "}
          <em className="fm-serif italic text-[var(--fm-accent)]">
            Clearance pending.
          </em>
        </h1>
        <p className="fm-body fm-rise mt-5 max-w-lg text-[15px] leading-relaxed">
          This account signs in, but the station master has not issued it a portal
          role yet{email ? (
            <>
              {" "}
              (<span className="fm-mono text-[var(--fm-accent)]">{email}</span>)
            </>
          ) : null}
          . The master provisions access from the Access Control panel on the command
          deck — ask them to add this email, then sign in again.
        </p>

        <div className="mt-10 border-t border-[var(--fm-line)] pt-6">
          <button
            type="button"
            onClick={() => void signOut()}
            className="fm-btn fm-btn-quiet"
          >
            Sign out
          </button>
        </div>

        <p className="fm-serif mt-8 text-[13px] italic text-[var(--fm-mut)]">
          Field manual, appendix A — the roster is short and known. No account is
          granted without the master's word.
        </p>
      </div>
    </div>
  );
}
