import { Link, useRouterState } from "@tanstack/react-router";
import { requestScrollToLandingHero, scrollToLandingHero } from "@/lib/scroll-to-hero";
import { VentureForgeLogo } from "@/components/venture-forge-logo";

export function Brand() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Link
      to="/"
      onClick={() => {
        if (pathname === "/") {
          scrollToLandingHero();
        } else {
          requestScrollToLandingHero();
        }
      }}
      className="flex items-center gap-2.5 font-sans font-semibold tracking-[0.18em] transition-opacity hover:opacity-80"
      aria-label="Venture Forge — back to home"
    >
      <VentureForgeLogo size={28} />
      <span>VENTURE FORGE</span>
    </Link>
  );
}
