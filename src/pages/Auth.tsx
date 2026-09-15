import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { Link } from "react-router";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  usePageTitle("Command Sign-In");
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);

  const hasMaster = useQuery(api.access.hasMaster);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "bootstrap">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bootstrapMaster = useAction(api.access.bootstrapMaster);

  // First run: no master exists yet -> force one-time system bootstrap.
  const systemNeedsBootstrap = hasMaster === false;
  const effectiveMode = systemNeedsBootstrap || mode === "bootstrap" ? "bootstrap" : "signin";

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect, { replace: true });
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", email.trim());
      formData.set("password", password);
      formData.set("flow", "signIn");
      await signIn("password", formData);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Check credentials and try again.");
      setIsLoading(false);
    }
  };

  const handleBootstrap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passphrases do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Master passphrase must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    try {
      await bootstrapMaster({ email: "master@ncpor.gov.in", name: name.trim() || "Station Commander", password });
      const formData = new FormData();
      formData.set("email", "master@ncpor.gov.in");
      formData.set("password", password);
      formData.set("flow", "signIn");
      await signIn("password", formData);
      toast.success("Master account created. Command authority granted.");
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bootstrap failed.";
      setError(
        msg.includes("MASTER_EXISTS")
          ? "A master account already exists. Sign in instead."
          : msg,
      );
      setIsLoading(false);
    }
  };

  const backToSignIn = () => {
    setMode("signin");
    setError(null);
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="fm flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <Link
          to="/"
          className="fm-mono inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-[var(--fm-mut)] uppercase transition-colors hover:text-[var(--fm-ink)]"
        >
          <ArrowLeft className="size-3.5" /> Back to the index
        </Link>
      </div>

      <div className="flex flex-1 items-start justify-center px-5 pt-10 pb-16 sm:items-center">
        <div className="fm-panel fm-rise w-full max-w-md p-8">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="POLARIS expedition command logo"
              width={40}
              height={40}
              className="size-10 rounded-sm"
            />
            <div>
              <p className="fm-mono text-[12px] font-semibold tracking-[0.26em] text-[var(--fm-ink)]">
                POLARIS
              </p>
              <p className="fm-serif text-[13px] italic text-[var(--fm-mut)]">
                expedition command
              </p>
            </div>
          </div>

          {effectiveMode === "bootstrap" ? (
            <>
              <hr className="fm-rule mt-6" />
              <p className="fm-label mt-6">First run · System initialization</p>
              <h1 className="fm-h2 mt-2 text-[1.6rem]">
                Initialize <em className="fm-serif italic text-[var(--fm-accent)]">the system.</em>
              </h1>
              <p className="fm-body mt-3 text-[13.5px] leading-relaxed">
                No master account exists. The first commander to initialize becomes the
                system master — only the master can issue portal accounts afterwards.
              </p>

              <form onSubmit={handleBootstrap} className="mt-7 space-y-5">
                <div>
                  <label className="fm-label-field" htmlFor="boot-name">
                    Commander name
                  </label>
                  <input
                    id="boot-name"
                    className="fm-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cdr. A. Sharma"
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="fm-label-field" htmlFor="boot-pass">
                    Master passphrase
                  </label>
                  <input
                    id="boot-pass"
                    className="fm-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="fm-label-field" htmlFor="boot-confirm">
                    Confirm passphrase
                  </label>
                  <input
                    id="boot-confirm"
                    className="fm-input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat passphrase"
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                  />
                </div>

                {error && <p className="fm-mono text-[12px] text-[var(--fm-alert)]">{error}</p>}

                <button type="submit" className="fm-btn fm-btn-solid w-full justify-center" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Initializing…
                    </>
                  ) : (
                    "Create master account"
                  )}
                </button>
                {!systemNeedsBootstrap && (
                  <button
                    type="button"
                    onClick={backToSignIn}
                    disabled={isLoading}
                    className="fm-mono w-full text-center text-[11px] tracking-[0.12em] text-[var(--fm-mut)] uppercase transition-colors hover:text-[var(--fm-ink)]"
                  >
                    A master exists — back to sign-in
                  </button>
                )}
              </form>
            </>
          ) : (
            <>
              <hr className="fm-rule mt-6" />
              <p className="fm-label mt-6">Access · Command deck</p>
              <h1 className="fm-h2 mt-2 text-[1.6rem]">
                Sign in to <em className="fm-serif italic text-[var(--fm-accent)]">the console.</em>
              </h1>
              <p className="fm-body mt-3 text-[13.5px] leading-relaxed">
                Accounts are issued by the station master. Sign in with the credentials
                you were given.
              </p>

              <form onSubmit={handlePasswordSignIn} className="mt-7 space-y-5">
                <div>
                  <label className="fm-label-field" htmlFor="si-email">
                    Email
                  </label>
                  <input
                    id="si-email"
                    className="fm-input"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label className="fm-label-field" htmlFor="si-password">
                    Password
                  </label>
                  <input
                    id="si-password"
                    className="fm-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                  />
                </div>

                {error && <p className="fm-mono text-[12px] text-[var(--fm-alert)]">{error}</p>}

                <button type="submit" className="fm-btn fm-btn-solid w-full justify-center" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Authenticating…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("bootstrap");
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="fm-mono w-full text-center text-[11px] tracking-[0.12em] text-[var(--fm-mut)] uppercase transition-colors hover:text-[var(--fm-ink)]"
                >
                  Initializing a new system?
                </button>
                <p className="fm-dim border-t border-[var(--fm-line-soft)] pt-4 text-[12px] leading-relaxed">
                  No credentials yet? The station master issues accounts from the Access
                  Control panel after sign-in.
                </p>
              </form>
            </>
          )}
        </div>

        <p className="fm-dim fm-mono fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.16em] uppercase">
          Secured by freebuff.com
        </p>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
