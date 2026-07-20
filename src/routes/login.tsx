import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/auth/LoginPage";

// Direct /login access (e.g. OAuth redirect). AuthGate renders this route when unauthenticated.
export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Artisan" }] }),
  component: LoginPage,
});
