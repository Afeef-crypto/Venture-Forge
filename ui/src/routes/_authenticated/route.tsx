import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Demo mode — no auth gate; evaluations live in localStorage. */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
