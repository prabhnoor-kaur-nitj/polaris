import { api } from "@/convex/_generated/api";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeartbeatState = "checking" | "good" | "lowband" | "down";

/**
 * Real connectivity probe. `navigator.onLine` only tells you the NIC thinks
 * it has a route — in the field (and in previews) that lies. So we combine:
 *   1. navigator.onLine + browser online/offline events (instant signals)
 *   2. a real heartbeat fetch to the Convex site origin every 20 s
 * Heartbeat round-trip time decides good (SATCOM-grade) vs lowband (VHF mesh).
 */
export function useNetworkStatus(): HeartbeatState {
  const [state, setState] = useState<HeartbeatState>("checking");
  const inflight = useRef(false);
  const mounted = useRef(true);

  const probe = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      // The Convex HTTP routes live at the same origin as the WS endpoint.
      const siteUrl = (import.meta.env.VITE_CONVEX_URL as string).replace(
        /\.cloud\b/,
        ".site",
      );
      const t0 = performance.now();
      // no-cors + cache-buster: measures real reachability without CORS setup,
      // and the opaque response still resolves only if the network path works.
      await fetch(`${siteUrl}/?hb=${Date.now()}`, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
      });
      const rtt = performance.now() - t0;
      if (!mounted.current) return;
      setState(rtt < 1000 ? "good" : "lowband");
    } catch {
      if (mounted.current) setState("down");
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setState("down");
    } else {
      void probe();
    }

    const goOffline = () => setState("down");
    const goOnline = () => {
      setState("checking");
      void probe();
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const t = window.setInterval(() => {
      if (typeof navigator === "undefined" || navigator.onLine) void probe();
    }, 20_000);

    return () => {
      mounted.current = false;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.clearInterval(t);
    };
  }, [probe]);

  return state;
}
