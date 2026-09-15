import { usePageTitle } from "@/hooks/use-page-title";
import { cn } from "@/lib/utils";
import { Compass, Info, Mail, Snowflake } from "lucide-react";
import { Link } from "react-router";

const ESCAPE_ROUTES = [
  { to: "/", label: "HOME", icon: Snowflake },
  { to: "/about", label: "ABOUT", icon: Info },
  { to: "/contact", label: "CONTACT", icon: Mail },
] as const;

export default function NotFound() {
  usePageTitle("404 · Sector Not Found");

  return (
    <div className="polar-hud flex min-h-screen flex-col items-center justify-center px-4">
      <span className="grid size-14 place-items-center rounded-xl border border-[#48cae4]/30 bg-[#48cae4]/10 text-[#48cae4]">
        <Snowflake className="size-7" />
      </span>
      <h1 className="hud-mono mt-5 text-4xl font-bold tracking-[0.2em] text-[#eaf8ff]">404</h1>
      <p className="hud-mono mt-2 text-[11px] tracking-[0.22em] text-[#9ec8dc]">
        GRID SECTOR NOT FOUND
      </p>
      <p className="mt-3 max-w-sm text-center text-[12px] leading-relaxed text-[#9ec8dc]/70">
        This coordinate is off the tactical map. Re-anchor with one of the routes below.
      </p>

      <nav aria-label="Recovery routes" className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {ESCAPE_ROUTES.map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className={cn(
              "hud-mono flex items-center gap-1.5 rounded-md border border-[#48cae4]/30 bg-[#48cae4]/8 px-3.5 py-2.5",
              "text-[10px] font-bold tracking-[0.16em] text-[#7be6fa] transition-colors hover:bg-[#48cae4]/18",
            )}
          >
            <r.icon className="size-3.5" />
            {r.label}
          </Link>
        ))}
      </nav>

      <Link
        to="/"
        className="hud-mono mt-6 flex items-center gap-1.5 text-[9px] tracking-[0.18em] text-[#9ec8dc]/60 transition-colors hover:text-[#7be6fa]"
      >
        <Compass className="size-3" />
        RETURN TO COMMAND
      </Link>
    </div>
  );
}
