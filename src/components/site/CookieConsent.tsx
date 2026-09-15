// Cookie consent banner. Choice persists in localStorage; everything stored is
// session-essential (auth token, expedition state, the consent choice itself),
// but the banner keeps the disclosure explicit.
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const STORAGE_KEY = "polaris.cookie-consent";

type Choice = "accepted" | "essential";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable — don't nag.
    }
  }, []);

  function choose(choice: Choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:max-w-sm">
      <div className="hud-panel p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#48cae4]/30 bg-[#48cae4]/10 text-[#48cae4]">
            <Cookie className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="hud-mono text-[10px] font-bold tracking-[0.16em] text-[#d7f4ff]">
              COOKIE NOTICE
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#9ec8dc]">
              POLARIS stores only session-essential data in your browser (sign-in and
              expedition state). No third-party trackers. Questions? Reach us via the{" "}
              <Link to="/contact" className="text-[#7be6fa] underline-offset-2 hover:underline">
                contact channel
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => choose("accepted")}
            className="hud-mono h-8 flex-1 border border-[#00f5d4]/50 bg-[#00f5d4]/15 text-[10px] font-bold tracking-[0.14em] text-[#00f5d4] hover:bg-[#00f5d4]/25"
          >
            ACCEPT ALL
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => choose("essential")}
            className="hud-mono h-8 flex-1 border-[#48cae4]/30 bg-transparent text-[10px] font-bold tracking-[0.14em] text-[#9ec8dc] hover:bg-white/5 hover:text-[#d7f4ff]"
          >
            ESSENTIAL ONLY
          </Button>
        </div>
      </div>
    </div>
  );
}
