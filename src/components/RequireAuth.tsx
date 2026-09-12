import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldX } from "lucide-react";
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
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
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
    <main className="polar-hud dark flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-2xl border border-[#ffb703]/40 bg-[#ffb703]/10">
          <ShieldX className="size-8 text-[#ffd166]" />
        </span>
        <div className="max-w-md space-y-2">
          <h1 className="hud-mono text-lg font-bold tracking-[0.14em] text-[#d7f4ff]">
            ACCESS PENDING
          </h1>
          <p className="text-sm leading-relaxed text-[#9ec8dc]">
            Your credentials are valid, but the station master has not granted this
            account access to the command portal yet
            {email ? (
              <>
                {" "}
                (<span className="hud-mono text-[#7be6fa]">{email}</span>)
              </>
            ) : null}
            . Contact the master commander to be provisioned, then sign in again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="hud-mono rounded-md border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-[0.18em] text-[#9ec8dc] transition-colors hover:bg-white/10"
        >
          SIGN OUT
        </button>
      </div>
    </main>
  );
}
