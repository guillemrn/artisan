import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  Navigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { ArtisanProvider } from "@/lib/artisan-store";
import { AppShell } from "@/components/artisan/AppShell";
import { AuthProvider, useAuth } from "@/core/auth/auth-context";
import { LoginPage } from "@/components/auth/LoginPage";
import { CookieBanner } from "@/components/legal/CookieBanner";

// ─── Error & 404 ──────────────────────────────────────────────────────────────

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="mt-2 text-sm text-text-secondary">Página no encontrada.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("Root Error boundary caught error:", error);
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm text-white"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// ─── Root component ───────────────────────────────────────────────────────────

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** Renders the login screen or the full app depending on auth state. */
function AuthGate() {
  const { user, session, loading, isDemo } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthenticated = isDemo ? Boolean(user) : Boolean(session?.user);

  if (loading) return <SplashScreen />;

  if (isLegalPath(pathname)) {
    return (
      <>
        <Outlet />
        <CookieBanner />
      </>
    );
  }

  if (pathname === "/reset-password") {
    return (
      <>
        <Outlet />
        <CookieBanner />
      </>
    );
  }

  if (!isAuthenticated) {
    if (pathname === "/" || pathname === "/login") {
      return (
        <>
          <Outlet />
          <CookieBanner />
        </>
      );
    }
    return <Navigate to="/login" replace />;
  }

  if (pathname === "/login") {
    return <Navigate to="/app" replace />;
  }

  if (pathname === "/") {
    return (
      <>
        <Outlet />
        <CookieBanner />
      </>
    );
  }

  return (
    <ArtisanProvider>
      <AppShell>
        <Outlet />
      </AppShell>
      <CookieBanner />
    </ArtisanProvider>
  );
}

function isLegalPath(pathname: string) {
  return pathname === "/privacidad" || pathname === "/terminos" || pathname === "/cookies";
}

// ─── Splash screen ────────────────────────────────────────────────────────────

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4">
      <img src="/isotipo.png" alt="Artisan" className="h-16 w-16 animate-pulse" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="splash-dot h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
