// Anonymous first-party page-view tracking. Fires one insert per navigation;
// the referrer is captured once per session. Rows land in the `pageviews`
// table and are only readable by the master via the Site Analytics panel.
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

export function AnalyticsTracker() {
  const { pathname } = useLocation();
  const track = useMutation(api.site.trackPageview);
  const referrer = useRef<string | undefined>(
    typeof document !== "undefined" && document.referrer ? document.referrer : undefined,
  );
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    void track({ path: pathname, referrer: referrer.current }).catch(() => {
      // Analytics must never break navigation.
    });
  }, [pathname, track]);

  return null;
}
