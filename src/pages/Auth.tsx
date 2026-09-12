import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
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
      setError("Passwords do not match.");
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
    <div className="polar-hud dark flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="min-w-[350px] max-w-md border-[#48cae4]/30 bg-[#0b132b]/90 pb-0 shadow-md shadow-black/40 backdrop-blur-xl">
          {effectiveMode === "bootstrap" ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <img src={logo} alt="NCPOR" width={64} height={64} className="mb-4 mt-4 rounded-lg" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <ShieldCheck className="size-5 text-[#00f5d4]" /> Initialize Command System
                </CardTitle>
                <CardDescription>
                  No master account exists. The first commander to initialize becomes the
                  system master — only the master can grant portal access afterwards.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleBootstrap}>
                <CardContent className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium" htmlFor="boot-name">
                      Commander name
                    </label>
                    <Input
                      id="boot-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cdr. A. Sharma"
                      autoComplete="name"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium" htmlFor="boot-pass">
                      Master passphrase
                    </label>
                    <Input
                      id="boot-pass"
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
                    <label className="mb-1 block text-xs font-medium" htmlFor="boot-confirm">
                      Confirm passphrase
                    </label>
                    <Input
                      id="boot-confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat passphrase"
                      autoComplete="new-password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </CardContent>
                <CardFooter className="flex-col gap-2 pb-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Initializing…
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 size-4" /> Create Master Account
                      </>
                    )}
                  </Button>
                  {!systemNeedsBootstrap && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={backToSignIn}
                      disabled={isLoading}
                    >
                      A master exists — back to sign-in
                    </Button>
                  )}
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <img
                    src={logo}
                    alt="NCPOR"
                    width={64}
                    height={64}
                    className="mb-4 mt-4 cursor-pointer rounded-lg"
                    onClick={() => navigate("/")}
                  />
                </div>
                <CardTitle className="text-xl">Command Sign-In</CardTitle>
                <CardDescription>
                  Portal access is granted by the master commander. Sign in with your
                  issued credentials.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordSignIn}>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute top-3 left-3 size-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute top-3 left-3 size-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {error && (
                    <p className={cn("text-sm text-red-500")}>{error}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    No credentials yet? The station master issues accounts from the
                    Access Control panel after sign-in.
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2 pb-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Authenticating…
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 size-4" /> Sign In
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setMode("bootstrap");
                      setError(null);
                    }}
                    disabled={isLoading}
                  >
                    <UserX className="mr-2 size-4" /> Initializing a new system?
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="rounded-b-lg border-t border-[#48cae4]/15 bg-white/5 px-6 py-4 text-center text-xs text-muted-foreground">
            Secured by{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-primary"
            >
              freebuff.com
            </a>
          </div>
        </Card>
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
