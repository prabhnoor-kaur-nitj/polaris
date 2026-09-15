// Shared chrome for the public marketing pages: navigation bar, breadcrumbs,
// footer and a layout wrapper so every public route is consistent.
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Info, Mail, Radio, Snowflake } from "lucide-react";
import { Link, useLocation } from "react-router";

const NAV_LINKS = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/waitlist", label: "Waitlist" },
] as const;

/** Sticky navigation bar with internal links to every public page. */
export function SiteNav() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-[#48cae4]/15 bg-[#0b132b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="POLARIS home">
          <img src={logo} alt="POLARIS expedition command logo" className="size-8 rounded-lg" />
          <span className="hud-mono text-[11px] font-bold tracking-[0.18em] text-[#d7f4ff]">
            POLARIS <span className="text-[#48cae4]/70">|</span>{" "}
            <span className="hidden text-[#7be6fa] sm:inline">EXPEDITION COMMAND</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "hud-mono hidden rounded-md px-2.5 py-2 text-[10px] font-bold tracking-[0.14em] transition-colors sm:inline-block",
                  active
                    ? "bg-[#48cae4]/15 text-[#7be6fa]"
                    : "text-[#9ec8dc] hover:bg-white/5 hover:text-[#d7f4ff]",
                )}
              >
                {l.label.toUpperCase()}
              </Link>
            );
          })}
          <Link
            to="/auth"
            className="hud-mono ml-1 rounded-md border border-[#48cae4]/40 bg-transparent px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-[#7be6fa] transition-colors hover:bg-[#48cae4]/10"
          >
            SIGN IN
          </Link>
        </nav>
      </div>
      {/* Mobile secondary row — nav links are hidden on the smallest screens. */}
      <div className="flex items-center justify-center gap-4 border-t border-[#48cae4]/10 py-1.5 sm:hidden">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            aria-current={pathname.startsWith(l.to) ? "page" : undefined}
            className={cn(
              "hud-mono text-[9px] font-bold tracking-[0.16em]",
              pathname.startsWith(l.to) ? "text-[#7be6fa]" : "text-[#9ec8dc]",
            )}
          >
            {l.label.toUpperCase()}
          </Link>
        ))}
      </div>
    </header>
  );
}

const CRUMB_LABELS: Record<string, string> = {
  about: "About",
  contact: "Contact",
  waitlist: "Waitlist",
  "thank-you": "Thank You",
};

/** Breadcrumbs trail: Home / Section / Page, rendered from the current path. */
export function SiteBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <Breadcrumb className="mx-auto max-w-6xl px-4 pt-5">
      <BreadcrumbList className="hud-mono text-[10px] tracking-[0.14em]">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="text-[#9ec8dc] hover:text-[#7be6fa]">
              HOME
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const label = CRUMB_LABELS[seg] ?? seg;
          const to = `/${segments.slice(0, i + 1).join("/")}`;
          return (
            <BreadcrumbItem key={to}>
              <BreadcrumbSeparator className="[&>svg]:size-3 [&>svg]:text-[#48cae4]/50" />
              {isLast ? (
                <BreadcrumbPage className="hud-mono text-[10px] font-bold tracking-[0.14em] text-[#d7f4ff]">
                  {label.toUpperCase()}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={to} className="text-[#9ec8dc] hover:text-[#7be6fa]">
                    {label.toUpperCase()}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Footer with internal links to every public route. */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#48cae4]/12 px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-2">
            <Snowflake className="size-4 text-[#48cae4]" />
            <span className="hud-mono text-[10px] font-bold tracking-[0.18em] text-[#d7f4ff]">
              POLARIS · EXPEDITION COMMAND
            </span>
          </div>
          <p className="mt-2 max-w-md text-[11px] leading-relaxed text-[#9ec8dc]/70">
            Offline-first logistics &amp; asset management for polar expedition stations.
            Simulated field environment — all telemetry is generated on-device.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-6 gap-y-2">
          <FooterLink to="/" icon={Snowflake}>Home</FooterLink>
          <FooterLink to="/about" icon={Info}>About</FooterLink>
          <FooterLink to="/contact" icon={Mail}>Contact</FooterLink>
          <FooterLink to="/waitlist" icon={Radio}>Waitlist</FooterLink>
        </nav>
      </div>
      <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span className="hud-mono text-[9px] tracking-[0.18em] text-[#9ec8dc]/50">
          v4.2 · SIMULATED FIELD ENVIRONMENT
        </span>
        <span className="hud-mono text-[9px] tracking-[0.18em] text-[#9ec8dc]/50">
          SECTOR 70S · ENGINE v4.2
        </span>
      </div>
    </footer>
  );
}

function FooterLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: typeof Snowflake;
  children: string;
}) {
  return (
    <Link
      to={to}
      className="hud-mono flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-[#9ec8dc] transition-colors hover:text-[#7be6fa]"
    >
      <Icon className="size-3.5 text-[#48cae4]/70" />
      {children.toUpperCase()}
    </Link>
  );
}

/** Standard layout for every public page: nav, breadcrumbs, content, footer. */
export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="polar-hud flex min-h-screen flex-col">
      <SiteNav />
      <SiteBreadcrumbs />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
