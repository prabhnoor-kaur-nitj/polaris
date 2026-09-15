// Cookie consent banner. Choice persists in localStorage; everything stored is
// session-essential (auth token, expedition state, the consent choice itself),
// but the banner keeps the disclosure explicit. Styled to the field-manual
// system: flat panel, hairline border, mono labels.
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
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-5 sm:max-w-sm">
      <div className="fm fm-panel fm-rise p-4 shadow-xl shadow-black/40">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-4 shrink-0 text-[var(--fm-accent)]" />
          <div className="min-w-0">
            <p className="fm-label">Cookie notice</p>
            <p className="fm-body mt-1.5 text-[12.5px] leading-relaxed">
              This site stores only session-essential data in your browser (sign-in and
              expedition state). No third-party trackers. Questions? Use the{" "}
              <Link to="/contact" className="fm-link">
                contact page
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => choose("accepted")} className="fm-btn fm-btn-solid flex-1 justify-center px-3 py-2 text-[10px]">
            Accept all
          </button>
          <button type="button" onClick={() => choose("essential")} className="fm-btn fm-btn-quiet flex-1 justify-center px-3 py-2 text-[10px]">
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
