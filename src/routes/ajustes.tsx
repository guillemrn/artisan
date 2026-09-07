import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  Bug,
  Check,
  ChevronRight,
  Copy,
  Download,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { USER_NAME } from "@/lib/artisan-data";
import { fetchArtisanData } from "@/lib/artisan-persistence";
import { useAuth } from "@/core/auth/auth-context";
import { supabase } from "@/core/supabase/client";
import { ModalSuccessState } from "@/components/ui/ModalSuccessState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes — Artisan" }] }),
  component: Ajustes,
});

const SUPPORT_EMAIL = "hola@guillermoml.com";
const BUSINESS_TYPES = [
  "Panadería",
  "Repostería",
  "Conservas",
  "Bebidas",
  "Artesanías",
  "Otros",
] as const;

function Ajustes() {
  const { user, signOut, isDemo, requestPasswordReset } = useAuth();

  const profileDefaults = useMemo(
    () => ({
      fullName: user?.user_metadata?.full_name ?? USER_NAME,
      businessName: user?.user_metadata?.business_name ?? "Mi negocio",
      phone: user?.user_metadata?.phone ?? "",
      businessType: user?.user_metadata?.business_type ?? "Panadería",
    }),
    [user],
  );

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [discardProfileOpen, setDiscardProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(profileDefaults.fullName);
  const [businessName, setBusinessName] = useState(profileDefaults.businessName);
  const [phone, setPhone] = useState(profileDefaults.phone);
  const [businessType, setBusinessType] = useState(profileDefaults.businessType);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugDesc, setBugDesc] = useState("");
  const [sendingBug, setSendingBug] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);
  const [bugError, setBugError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? USER_NAME;
  const displayBusiness = user?.user_metadata?.business_name ?? "Mi emprendimiento";
  const displayEmail = user?.email ?? (isDemo ? "demo@artisan.app" : "");
  const initials = displayName.slice(0, 2).toUpperCase();
  const profileDirty =
    fullName !== profileDefaults.fullName ||
    businessName !== profileDefaults.businessName ||
    phone !== profileDefaults.phone ||
    businessType !== profileDefaults.businessType;

  const resetProfileDraft = () => {
    setFullName(profileDefaults.fullName);
    setBusinessName(profileDefaults.businessName);
    setPhone(profileDefaults.phone);
    setBusinessType(profileDefaults.businessType);
    setProfileError(null);
    setProfileSuccess(false);
  };

  const openProfile = () => {
    resetProfileDraft();
    setProfileModalOpen(true);
  };

  const requestProfileClose = () => {
    if (savingProfile) return;
    if (!profileSuccess && profileDirty) {
      setDiscardProfileOpen(true);
      return;
    }
    setProfileModalOpen(false);
    resetProfileDraft();
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingProfile || !fullName.trim() || !businessName.trim()) return;

    setSavingProfile(true);
    setProfileError(null);
    try {
      if (!isDemo) {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            business_name: businessName.trim(),
            phone: phone.trim(),
            business_type: businessType,
          },
        });
        if (error) throw error;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setProfileSuccess(true);
    } catch {
      setProfileError("No pudimos guardar los cambios. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendBug = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = bugDesc.trim();
    if (!message || sendingBug) return;

    setSendingBug(true);
    setBugError(null);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        const { error } = await supabase.from("feedback").insert({
          user_id: user?.id,
          email: user?.email,
          message,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      setBugSuccess(true);
      setBugDesc("");
    } catch {
      setBugError(
        "No pudimos enviar el reporte desde Artisan. Puedes copiarlo o abrir tu correo para enviarlo sin perder el texto.",
      );
    } finally {
      setSendingBug(false);
    }
  };

  const copyBugReport = async () => {
    try {
      await navigator.clipboard.writeText(bugDesc.trim());
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 1800);
    } catch {
      setBugError("No pudimos copiar el texto. Selecciónalo manualmente antes de cerrar.");
    }
  };

  const handlePasswordReset = async () => {
    if (!displayEmail || sendingReset) return;
    if (isDemo) {
      setPasswordNotice({
        tone: "error",
        message: "El cambio de contraseña no está disponible en la cuenta de demostración.",
      });
      return;
    }

    setSendingReset(true);
    setPasswordNotice(null);
    try {
      const { error } = await requestPasswordReset(displayEmail);
      if (error) throw error;
      setPasswordNotice({
        tone: "success",
        message: `Enviamos un enlace seguro a ${displayEmail}.`,
      });
    } catch {
      setPasswordNotice({
        tone: "error",
        message: "No pudimos enviar el enlace. Espera un momento e inténtalo nuevamente.",
      });
    } finally {
      setSendingReset(false);
    }
  };

  const handleExportData = async () => {
    if (exportingData) return;
    setExportingData(true);
    try {
      const { products, clients, sales } = await fetchArtisanData(isDemo ? undefined : user?.id);
      const payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          account: { name: displayName, business: displayBusiness, email: displayEmail },
          products,
          clients,
          sales,
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `artisan_datos_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success("Tus datos están listos para descargar");
    } catch {
      toast.error("No pudimos preparar tus datos. Inténtalo nuevamente.");
    } finally {
      setExportingData(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  };

  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Reporte de problema en Artisan",
  )}&body=${encodeURIComponent(bugDesc.trim())}`;

  return (
    <div className="page-shell mx-auto max-w-5xl pb-10 md:px-0 md:pt-8">
      <header>
        <h1 className="font-display text-[30px] font-bold leading-tight text-text-primary">
          Ajustes
        </h1>
        <p className="mt-1 max-w-[58ch] text-[14px] leading-6 text-text-secondary">
          Administra la información de tu negocio, tu cuenta y tus datos.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-x-10 gap-y-9 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-[13px] font-bold text-text-primary">Negocio</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-[15px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[16px] font-bold text-text-primary">
                {displayBusiness}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-text-secondary">{displayName}</p>
              <p className="truncate text-[12px] text-text-muted">{displayEmail}</p>
            </div>
            <button
              type="button"
              onClick={openProfile}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-bold text-text-primary transition hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Editar
            </button>
          </div>
        </section>

        <SettingsGroup title="Ayuda">
          <SettingsRow
            icon={<Bug />}
            title="Reportar un problema"
            description="Cuéntanos qué falló sin salir de Artisan"
            actionLabel="Abrir"
            onClick={() => {
              setBugError(null);
              setBugSuccess(false);
              setBugModalOpen(true);
            }}
          />
          <SettingsRow
            icon={<Mail />}
            title="Contactar a soporte"
            description={SUPPORT_EMAIL}
            actionLabel="Correo"
            href={`mailto:${SUPPORT_EMAIL}`}
          />
        </SettingsGroup>

        <SettingsGroup title="Cuenta y datos" className="lg:col-span-2">
          <div className="grid lg:grid-cols-2 lg:gap-x-10">
            <div className="divide-y divide-border lg:border-r lg:border-border lg:pr-10">
              <SettingsRow
                icon={<KeyRound />}
                title="Cambiar contraseña"
                description="Recibe un enlace seguro en tu correo"
                actionLabel={sendingReset ? "Enviando…" : "Enviar enlace"}
                onClick={handlePasswordReset}
                disabled={sendingReset}
              />
              <SettingsRow
                icon={<Download />}
                title="Descargar mis datos"
                description="Ventas, clientes y productos en un archivo"
                actionLabel={exportingData ? "Preparando…" : "Descargar"}
                onClick={handleExportData}
                disabled={exportingData}
              />
            </div>
            <div className="divide-y divide-border border-t border-border lg:border-t-0">
              <SettingsRow
                icon={<ShieldCheck />}
                title="Privacidad y uso de datos"
                description="Consulta cómo protegemos tu información"
                actionLabel="Consultar"
                to="/privacidad"
              />
              <SettingsRow
                icon={<Activity />}
                title="Historial de actividad"
                description="Revisa ventas y movimientos recientes"
                actionLabel="Ver historial"
                to="/actividad"
              />
            </div>
          </div>
          {passwordNotice && (
            <div
              role={passwordNotice.tone === "error" ? "alert" : "status"}
              className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px] ${
                passwordNotice.tone === "success"
                  ? "bg-primary-light text-primary"
                  : "bg-red-50 text-danger"
              }`}
            >
              {passwordNotice.tone === "success" ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{passwordNotice.message}</span>
            </div>
          )}
        </SettingsGroup>
      </div>

      <footer className="mt-10 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <Info className="h-4 w-4" aria-hidden="true" />
          <span>Artisan Beta</span>
        </div>
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-bold text-danger transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </footer>

      <Dialog
        open={profileModalOpen}
        onOpenChange={(open) => {
          if (open) setProfileModalOpen(true);
          else requestProfileClose();
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border-border bg-white p-0">
          {profileSuccess ? (
            <div className="p-5 sm:p-6">
              <ModalSuccessState
                badgeText="Perfil del negocio"
                title="Perfil actualizado"
                description="Los cambios ya están disponibles en tu cuenta."
                details={[
                  { label: "Responsable", value: fullName.trim() },
                  { label: "Negocio", value: businessName.trim() },
                  { label: "Categoría", value: businessType },
                ]}
                onDone={() => {
                  setProfileModalOpen(false);
                  setProfileSuccess(false);
                }}
                actionText="Listo"
              />
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <DialogHeader className="border-b border-border px-5 py-5 pr-12 text-left sm:px-6">
                <DialogTitle className="font-display text-[19px] font-bold text-text-primary">
                  Editar perfil del negocio
                </DialogTitle>
                <DialogDescription className="text-[13px] leading-5 text-text-muted">
                  Esta información identifica tu cuenta y tu negocio dentro de Artisan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                {profileError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-danger/20 bg-red-50 px-3 py-2.5 text-[13px] text-danger"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>{profileError}</p>
                  </div>
                )}

                <FormField label="Tu nombre" htmlFor="settings-full-name">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="settings-full-name"
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="name"
                    disabled={savingProfile}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </FormField>

                <FormField label="Nombre del negocio" htmlFor="settings-business-name">
                  <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="settings-business-name"
                    type="text"
                    required
                    maxLength={120}
                    autoComplete="organization"
                    disabled={savingProfile}
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Teléfono" htmlFor="settings-phone">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      id="settings-phone"
                      type="tel"
                      maxLength={24}
                      autoComplete="tel"
                      inputMode="tel"
                      disabled={savingProfile}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-12 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                    />
                  </FormField>

                  <FormField label="Categoría" htmlFor="settings-business-type">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <select
                      id="settings-business-type"
                      disabled={savingProfile}
                      value={businessType}
                      onChange={(event) => setBusinessType(event.target.value)}
                      className="h-12 w-full appearance-none rounded-lg border border-border bg-white pl-10 pr-3 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              <DialogFooter className="gap-2 border-t border-border bg-muted/35 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={requestProfileClose}
                  className="h-11 cursor-pointer rounded-lg border border-border bg-white px-4 text-[13px] font-bold text-text-secondary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    savingProfile || !profileDirty || !fullName.trim() || !businessName.trim()
                  }
                  className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-bold text-white transition hover:bg-[#246448] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {savingProfile && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {savingProfile ? "Guardando…" : "Guardar cambios"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={discardProfileOpen} onOpenChange={setDiscardProfileOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg border-border bg-white">
          <DialogHeader className="text-left">
            <DialogTitle>¿Descartar los cambios?</DialogTitle>
            <DialogDescription>
              La información que modificaste todavía no se ha guardado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <button
              type="button"
              onClick={() => setDiscardProfileOpen(false)}
              className="h-11 cursor-pointer rounded-lg border border-border px-4 text-[13px] font-bold text-text-secondary hover:bg-muted"
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={() => {
                setDiscardProfileOpen(false);
                setProfileModalOpen(false);
                resetProfileDraft();
              }}
              className="h-11 cursor-pointer rounded-lg bg-danger px-4 text-[13px] font-bold text-white hover:bg-red-700"
            >
              Descartar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bugModalOpen}
        onOpenChange={(open) => {
          if (!sendingBug) setBugModalOpen(open);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border-border bg-white p-0">
          {bugSuccess ? (
            <div className="p-5 sm:p-6">
              <ModalSuccessState
                badgeText="Soporte Artisan"
                title="Reporte recibido"
                description="Gracias. Revisaremos la información para entender qué ocurrió."
                onDone={() => {
                  setBugSuccess(false);
                  setBugModalOpen(false);
                }}
                actionText="Listo"
              />
            </div>
          ) : (
            <form onSubmit={handleSendBug}>
              <DialogHeader className="border-b border-border px-5 py-5 pr-12 text-left sm:px-6">
                <DialogTitle className="font-display text-[19px] font-bold text-text-primary">
                  Reportar un problema
                </DialogTitle>
                <DialogDescription className="text-[13px] leading-5 text-text-muted">
                  Describe qué estabas haciendo, qué esperabas y qué ocurrió.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                {bugError && (
                  <div
                    role="alert"
                    className="space-y-3 rounded-lg border border-danger/20 bg-red-50 p-3 text-[13px] text-danger"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <p>{bugError}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      <button
                        type="button"
                        onClick={copyBugReport}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-danger/20 bg-white px-3 font-bold text-danger"
                      >
                        {copiedReport ? <Check /> : <Copy />}
                        {copiedReport ? "Copiado" : "Copiar reporte"}
                      </button>
                      <a
                        href={supportMailto}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-danger px-3 font-bold text-white"
                      >
                        <Mail /> Enviar por correo
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="settings-bug-description"
                    className="mb-1.5 block text-[13px] font-bold text-text-primary"
                  >
                    Cuéntanos qué pasó
                  </label>
                  <textarea
                    id="settings-bug-description"
                    required
                    rows={6}
                    maxLength={1000}
                    disabled={sendingBug}
                    placeholder="Ejemplo: estaba registrando una venta y…"
                    value={bugDesc}
                    onChange={(event) => {
                      setBugDesc(event.target.value);
                      setBugError(null);
                    }}
                    className="min-h-36 w-full resize-y rounded-lg border border-border bg-white p-3 text-base leading-6 text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                  <p className="mt-1 text-right text-[11px] text-text-muted">
                    {bugDesc.length}/1000
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 border-t border-border bg-muted/35 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  disabled={sendingBug}
                  onClick={() => setBugModalOpen(false)}
                  className="h-11 cursor-pointer rounded-lg border border-border bg-white px-4 text-[13px] font-bold text-text-secondary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={sendingBug || !bugDesc.trim()}
                  className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-bold text-white transition hover:bg-[#246448] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {sendingBug && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {sendingBug ? "Enviando…" : "Enviar reporte"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={signOutOpen} onOpenChange={(open) => !signingOut && setSignOutOpen(open)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg border-border bg-white">
          <DialogHeader className="text-left">
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription>
              Tendrás que volver a ingresar con tu correo y contraseña para usar Artisan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <button
              type="button"
              disabled={signingOut}
              onClick={() => setSignOutOpen(false)}
              className="h-11 cursor-pointer rounded-lg border border-border px-4 text-[13px] font-bold text-text-secondary hover:bg-muted disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-danger px-4 text-[13px] font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {signingOut ? "Cerrando…" : "Cerrar sesión"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsGroup({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      <h2 className="mb-2 text-[13px] font-bold text-text-primary">{title}</h2>
      <div className="divide-y divide-border border-y border-border">{children}</div>
    </section>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  actionLabel,
  onClick,
  to,
  href,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onClick?: () => void;
  to?: "/privacidad" | "/actividad";
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-light text-primary [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-text-primary">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-5 text-text-muted">{description}</span>
      </span>
      {actionLabel && (
        <span className="hidden shrink-0 text-[12px] font-bold text-primary sm:block">
          {actionLabel}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
    </>
  );
  const className =
    "flex min-h-16 w-full cursor-pointer items-center gap-3 py-3 text-left transition hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-55 sm:px-2";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-bold text-text-primary">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}
