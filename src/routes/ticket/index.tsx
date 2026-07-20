import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy /ticket URL — redirect to home (sale id required). */
export const Route = createFileRoute("/ticket/")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
