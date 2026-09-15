// Shared chrome for the public pages, set in the "field manual" editorial
// style: flat ink surfaces, hairline rules, mono labels, serif accents.
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
import { Link, useLocation } from "react-router";

const NAV_LINKS = [
  { to: "/about", label: "About", num: "01" },
  { to: "/contact", label: "Contact", num: "02" },
] as const;

/** Top navigation: flat bar, hairline rules, mono links. */
export function SiteNav() {
  const { pathname } = useLocation();
  return (
    <header className="border-b border-[var(--fm-line)] bg-[var(--fm-bg)]">
      <div className="mx-auto flex h-16 max-w-5xl items-baseline gap-6 px-5">
        <Link to="/" className="flex items-baseline gap-3" aria-label="POLARIS home">
          <img
            src={logo}
            alt="POLARIS expedition command logo"
            className="size-7 self-center rounded-sm"
          />
          <span className="fm-mono text-[13px] font-semibold tracking-[0.28em] text-[var(--fm-ink)]">
            POLARIS
          </span>
          <span className="fm-serif hidden text-sm italic text-[var(--fm-mut)] sm:inline">
            expedition command
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              aria-current={pathname.startsWith(l.to) ? "page" : undefined}
              className="fm-navlink hidden sm:inline"
            >
              <span className="fm-num mr-1.5 text-[10px]">{l.num}</span>
              {l.label}
            </Link>
          ))}
          <Link
            to="/auth"
            className={cn(
              "fm-mono border border-[var(--fm-accent-deep)] px-3 py-1.5 text-[11px] tracking-[0.16em] uppercase",
              "text-[var(--fm-accent)] transition-colors hover:bg-[rgba(127,180,201,0.08)] hover:text-[var(--fm-ink)]",
            )}
          >
            Sign in
          </Link>
        </nav>
      </div>
      {/* Mobile row — nav links collapse below the bar on small screens. */}
      <div className="flex items-center justify-center gap-8 border-t border-[var(--fm-line-soft)] py-2 sm:hidden">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            aria-current={pathname.startsWith(l.to) ? "page" : undefined}
            className="fm-navlink"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

const CRUMB_LABELS: Record<string, string> = {
  about: "About",
  contact: "Contact",
  "thank-you": "Thank You",
};

/** Breadcrumbs: hairline strip under the nav, mono, slash-separated. */
export function SiteBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <div className="border-b border-[var(--fm-line-soft)]">
      <Breadcrumb className="mx-auto max-w-5xl px-5 py-3">
        <BreadcrumbList className="fm-mono text-[10px] tracking-[0.2em] uppercase">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="text-[var(--fm-mut)] hover:text-[var(--fm-ink)]">
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const label = CRUMB_LABELS[seg] ?? seg;
            const to = `/${segments.slice(0, i + 1).join("/")}`;
            return (
              <BreadcrumbItem key={to}>
                <BreadcrumbSeparator className="[&>svg]:size-3 [&>svg]:text-[var(--fm-line)]" />
                {isLast ? (
                  <BreadcrumbPage className="fm-mono text-[10px] tracking-[0.2em] text-[var(--fm-ink)] uppercase">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to} className="text-[var(--fm-mut)] hover:text-[var(--fm-ink)]">
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

/** Footer: typeset colophon with numbered link groups. */
export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--fm-line)] bg-[var(--fm-bg)]">
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="fm-mono text-[13px] font-semibold tracking-[0.28em] text-[var(--fm-ink)]">
              POLARIS
            </span>
            <span className="fm-serif text-sm italic text-[var(--fm-mut)]">
              expedition command
            </span>
          </div>
          <p className="fm-body mt-3 max-w-sm text-[13px] leading-relaxed">
            A logistics and asset-management system for polar research stations, built
            on the assumption that the network is a luxury. All field telemetry in this
            build is simulated on-device.
          </p>
        </div>

        <nav aria-label="Site">
          <p className="fm-label mb-3">Site</p>
          <ul className="space-y-2">
            <li><FooterLink to="/">Index</FooterLink></li>
            <li><FooterLink to="/about">About</FooterLink></li>
            <li><FooterLink to="/contact">Contact</FooterLink></li>
          </ul>
        </nav>

        <nav aria-label="Access">
          <p className="fm-label mb-3">Access</p>
          <ul className="space-y-2">
            <li><FooterLink to="/auth">Sign in</FooterLink></li>
            <li><FooterLink to="/dashboard">Command deck</FooterLink></li>
          </ul>
          <p className="fm-dim mt-4 text-[12px] leading-relaxed">
            The command deck requires an account issued by the station master.
          </p>
        </nav>
      </div>

      <div className="border-t border-[var(--fm-line-soft)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-2 px-5 py-4">
          <span className="fm-dim fm-mono text-[10px] tracking-[0.18em] uppercase">
            POLARIS v4.2 — simulated field build
          </span>
          <span className="fm-serif text-[12px] italic text-[var(--fm-mut)]">
            Set in Newsreader, Inter &amp; JetBrains Mono
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="fm-mono text-[12px] tracking-[0.06em] text-[var(--fm-ink-dim)] transition-colors hover:text-[var(--fm-accent)]"
    >
      {children}
    </Link>
  );
}

/** Standard layout for every public page: nav, breadcrumbs, content, footer. */
export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fm flex min-h-screen flex-col">
      <SiteNav />
      <SiteBreadcrumbs />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
