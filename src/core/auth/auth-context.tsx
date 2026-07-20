import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/core/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthCtx = {
  user: User | null;
  session: Session | null;
  /** true while we're resolving the initial session */
  loading: boolean;
  /** true when env vars are missing and we're running in local demo mode */
  isDemo: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: {
      full_name: string;
      phone?: string;
      business_name: string;
      business_type: string;
    }
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const HAS_SUPABASE =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  import.meta.env.VITE_SUPABASE_URL !== "https://placeholder.supabase.co";

/** A synthetic demo user shown when Supabase credentials are not configured */
const DEMO_USER: User = {
  id: "demo-user",
  aud: "authenticated",
  role: "authenticated",
  email: "demo@artisan.app",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    full_name: "María (demo)",
    avatar_url: "",
    business_name: "Pan Pita Artesanal",
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!HAS_SUPABASE) {
      // Demo mode: start NOT logged in so the login screen is visible
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!HAS_SUPABASE) {
      // Demo mode — skip OAuth and jump straight in
      setUser(DEMO_USER);
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!HAS_SUPABASE) {
      if (email === "demo@artisan.app") {
        setUser(DEMO_USER);
        return { error: null };
      }
      return { error: new Error("Credenciales inválidas en modo Demo. Usa: demo@artisan.app") };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error };

    setSession(data.session);
    setUser(data.user);
    return { error: null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: {
      full_name: string;
      phone?: string;
      business_name: string;
      business_type: string;
    }
  ) => {
    if (!HAS_SUPABASE) {
      return { error: new Error("El registro no está disponible en modo Demo.") };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) return { error };

    setSession(data.session);
    setUser(data.user);
    return { error: null };
  };


  const signOut = async () => {
    if (!HAS_SUPABASE) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemo: !HAS_SUPABASE,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

