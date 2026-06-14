import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { requestScrollToLandingHero, scrollToLandingHero } from "@/lib/scroll-to-hero";

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
      className="flex items-center gap-2 font-sans font-semibold tracking-[0.18em] transition-opacity hover:opacity-80"
      aria-label="Venture Forge — back to home"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </span>
      <span>VENTURE FORGE</span>
    </Link>
  );
}
