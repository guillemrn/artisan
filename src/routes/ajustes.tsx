import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronRight,
  Store,
  LogOut,
  Info,
  Bug,
  User as UserIcon,
  Phone,
  Tag,
  X,
} from "lucide-react";
import { USER_NAME } from "@/lib/artisan-data";
import { useAuth } from "@/core/auth/auth-context";
import { Logo } from "@/components/ui/logo";
import { supabase } from "@/core/supabase/client";

export const Route = createFileRoute("/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes — Artisan" }] }),
  component: Ajustes,
});

function Ajustes() {
  const { user, signOut, isDemo } = useAuth();
  
  // Profile edit states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? USER_NAME);
  const [businessName, setBusinessName] = useState(user?.user_metadata?.business_name ?? "Mi Negocio");
  const [phone, setPhone] = useState(user?.user_metadata?.phone ?? "");
  const [businessType, setBusinessType] = useState(user?.user_metadata?.business_type ?? "Panadería");
  const [savingProfile, setSavingProfile] = useState(false);

  // Bug report states
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugDesc, setBugDesc] = useState("");
  const [sendingBug, setSendingBug] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? USER_NAME;
  const displayBusiness = user?.user_metadata?.business_name ?? "Mi Emprendimiento";
  const displayEmail = user?.email ?? (isDemo ? "demo@artisan.app" : "");
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (!isDemo) {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            business_name: businessName,
            phone: phone,
            business_type: businessType,
          },
        });
      }
      setProfileModalOpen(false);
      // Reload page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error("Error updating profile", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendBug = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingBug(true);
    try {
      if (isDemo) {
        // Mock send
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        // Write to Supabase feedback table if it exists, or mailto fallback
        // To be safe, we insert into a feedback table
        await supabase.from("feedback").insert({
          user_id: user?.id,
          email: user?.email,
          message: bugDesc,
          created_at: new Date().toISOString(),
        });
      }
      setBugSuccess(true);
      setBugDesc("");
      setTimeout(() => {
        setBugSuccess(false);
        setBugModalOpen(false);
      }, 2000);
    } catch (err) {
      // Fallback to mailto link if insert fails (e.g. table doesn't exist)
      const subject = encodeURIComponent("Bug Report - Artisan App");
      const body = encodeURIComponent(bugDesc);
      window.location.href = `mailto:soporte@artisan.app?subject=${subject}&body=${body}`;
      setBugModalOpen(false);
    } finally {
      setSendingBug(false);
    }
  };

  return (
    <div className="page-shell pb-10 md:px-0 md:pt-8">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-wide text-primary">Configuración</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight text-text-primary">Ajustes</h1>
        <p className="mt-1 text-[14px] text-text-muted">
          Administra tu perfil, tu negocio y reporta errores.
        </p>
      </div>

      {/* Profile Card */}
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-lg font-bold text-white">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[16px] font-bold text-text-primary">{displayName}</p>
          <p className="truncate text-[13px] text-text-secondary">
            {displayBusiness} ({displayEmail})
          </p>
        </div>
        <Logo variant="icon" className="h-8 w-8 opacity-60 shrink-0" />
      </div>

      <div className="mt-6 space-y-4">
        {/* NEGOCIO */}
        <div>
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Negocio</p>
          <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <li>
              <button
                onClick={() => setProfileModalOpen(true)}
                className="w-full flex items-center gap-3 border-b border-border/70 px-4 py-3.5 text-left last:border-b-0 hover:bg-muted transition"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                  <Store className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary">Perfil del negocio</p>
                  <p className="text-[12px] text-text-muted truncate">Editar nombre, negocio y categoría</p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </button>
            </li>
          </ul>
        </div>

        {/* SOPORTE */}
        <div>
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Ayuda & Soporte</p>
          <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <li>
              <button
                onClick={() => setBugModalOpen(true)}
                className="w-full flex items-center gap-3 border-b border-border/70 px-4 py-3.5 text-left last:border-b-0 hover:bg-muted transition"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                  <Bug className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary">Reportar un problema / Bug</p>
                  <p className="text-[12px] text-text-muted truncate">Envíanos comentarios para mejorar la app</p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </button>
            </li>
            <li>
              <div className="w-full flex items-center gap-3 px-4 py-3.5 text-left last:border-b-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                  <Info className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary">Versión de aplicación</p>
                  <p className="text-[12px] text-text-muted truncate">0.2.0 — MVP Connect</p>
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* CUENTA */}
        <div>
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Cuenta</p>
          <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <li>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted transition text-danger"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-danger">
                  <LogOut className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold">Cerrar sesión</p>
                </div>
                <ChevronRight className="h-4 w-4 text-danger/50" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* PROFILE EDIT MODAL */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-border p-6 shadow-xl relative">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-[18px] font-bold text-text-primary mb-4">Editar Perfil del Negocio</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-text-primary mb-1">Tu Nombre</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[14px]"
                  />
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-text-primary mb-1">Nombre del Negocio</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[14px]"
                  />
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-text-primary mb-1">Teléfono</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[14px]"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-text-primary mb-1">Categoría</label>
                  <div className="relative">
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full h-10 pl-9 pr-8 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[14px] bg-white appearance-none"
                    >
                      <option value="Panadería">Panadería</option>
                      <option value="Repostería">Repostería</option>
                      <option value="Conservas">Conservas</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Artesanías">Artesanías</option>
                      <option value="Otros">Otros</option>
                    </select>
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full h-10 rounded-lg bg-primary text-white text-[14px] font-bold hover:bg-[#246448] transition mt-2"
              >
                {savingProfile ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BUG REPORT MODAL */}
      {bugModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-border p-6 shadow-xl relative">
            <button
              onClick={() => {
                setBugModalOpen(false);
                setBugSuccess(false);
              }}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-[18px] font-bold text-text-primary mb-2">Reportar un problema</h3>
            <p className="text-[12px] text-text-muted mb-4">
              Cuéntanos qué falló o qué podemos mejorar para ayudarte en tu día a día.
            </p>
            {bugSuccess ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-[13px] text-green-700 font-semibold text-center">
                ¡Reporte recibido! Gracias por ayudarnos a mejorar.
              </div>
            ) : (
              <form onSubmit={handleSendBug} className="space-y-4">
                <div>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe el problema detalladamente..."
                    value={bugDesc}
                    onChange={(e) => setBugDesc(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[14px] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingBug}
                  className="w-full h-10 rounded-lg bg-primary text-white text-[14px] font-bold hover:bg-[#246448] transition"
                >
                  {sendingBug ? "Enviando..." : "Enviar reporte"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

