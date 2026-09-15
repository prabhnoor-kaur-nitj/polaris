import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "react-router";

const ROUTES = [
  { num: "01", to: "/", label: "Index" },
  { num: "02", to: "/about", label: "About" },
  { num: "03", to: "/contact", label: "Contact" },
];

export default function NotFound() {
  usePageTitle("404 · Off the Map");

  return (
    <div className="fm flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-20">
        <p className="fm-label fm-rise">Notice · Uncharted coordinate</p>
        <h1 className="fm-h1 fm-rise mt-5">
          This coordinate is{" "}
          <em className="fm-serif italic text-[var(--fm-accent)]">off the map.</em>
        </h1>
        <p className="fm-body fm-rise mt-5 max-w-lg text-[15px] leading-relaxed">
          The page you asked for isn't plotted in this build of the manual. Re-anchor
          with one of the routes below.
        </p>

        <div className="mt-10 max-w-md">
          {ROUTES.map((r) => (
            <Link key={r.to} to={r.to} className="fm-row group grid grid-cols-[50px_1fr_auto] items-baseline gap-3 py-4">
              <span className="fm-num">{r.num}</span>
              <span className="fm-mono text-[13px] tracking-[0.08em] text-[var(--fm-ink)] uppercase transition-colors group-hover:text-[var(--fm-accent)]">
                {r.label}
              </span>
              <span className="fm-dim fm-mono text-[11px]">→</span>
            </Link>
          ))}
        </div>

        <hr className="fm-rule mt-12" />
        <p className="fm-serif mt-6 text-[13px] italic text-[var(--fm-mut)]">
          Field manual, appendix C — lost-party procedure: stay where you are and make
          yourself visible.
        </p>
      </div>
    </div>
  );
}
