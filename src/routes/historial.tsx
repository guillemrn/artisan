import { createFileRoute, redirect } from "@tanstack/react-router";

// Historial was merged into Inicio (/).
// Keep this route so any deep-link or bookmark still works.
export const Route = createFileRoute("/historial")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
