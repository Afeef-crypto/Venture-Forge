import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/evaluations")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
