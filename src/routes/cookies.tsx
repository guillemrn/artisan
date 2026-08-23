import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

const sections: LegalSection[] = [
  {
    title: "Que son",
    body: [
      "Las cookies y tecnologias similares permiten recordar preferencias, mantener una sesion, guardar decisiones locales y entender el uso del producto cuando el usuario lo permite.",
    ],
  },
  {
    title: "Uso esencial",
    body: [
      "Artisan usa almacenamiento local y tecnologias necesarias para mantener la experiencia funcionando: sesion, datos de demo, preferencias de interfaz y decisiones como el consentimiento de cookies.",
      "Estas tecnologias son necesarias para operar el producto y no dependen de aceptar medicion.",
    ],
  },
  {
    title: "Medicion opcional",
    body: [
      "Si el usuario acepta, Artisan puede activar herramientas de medicion como Vercel Analytics y Microsoft Clarity para entender navegacion, errores, rendimiento y uso agregado.",
      "La medicion ayuda a mejorar el producto, pero no es necesaria para registrar ventas, gestionar inventario o usar el panel.",
    ],
  },
  {
    title: "Como cambiar la preferencia",
    body: [
      "La preferencia se guarda en el navegador con la clave artisan_cookie_consent. Para cambiarla, el usuario puede borrar los datos del sitio desde el navegador y volver a elegir cuando aparezca el banner.",
      "Si se elige solo esenciales, la medicion no se activa desde la aplicacion.",
    ],
  },
  {
    title: "Cambios",
    body: [
      "Si Artisan agrega nuevas herramientas de medicion, publicidad o integraciones, esta politica debera actualizarse antes de activarlas.",
      "Para dudas sobre esta politica, el usuario puede escribir a hola@guillermoml.com.",
    ],
  },
];

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Politica de cookies - Artisan" }] }),
  component: CookiesRoute,
});

function CookiesRoute() {
  return (
    <LegalPage
      title="Politica de cookies"
      description="Describe que tecnologias usa Artisan, cuales son necesarias y cuales dependen del consentimiento."
      updatedAt="23 de agosto de 2026"
      sections={sections}
    >
      <CookiePreferencePanel />
    </LegalPage>
  );
}

function CookiePreferencePanel() {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);

  useEffect(() => {
    setChoice(getCookieConsent());
  }, []);

  const choose = (nextChoice: CookieConsentChoice) => {
    setCookieConsent(nextChoice);
    setChoice(nextChoice);
  };

  return (
    <section className="rounded-xl border border-[#1d2723]/10 bg-[#17231e] p-5 text-white sm:p-6">
      <h2 className="text-xl font-black">Preferencia actual</h2>
      <p className="mt-3 text-sm leading-7 text-[#c4d2ca]">
        {choice === "accepted"
          ? "La medicion opcional esta activa en este navegador."
          : "Este navegador esta usando solo tecnologias esenciales."}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-[#17231e] transition hover:bg-[#fffaf0]"
          onClick={() => choose("accepted")}
        >
          Aceptar medicion
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/18 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          onClick={() => choose("essential")}
        >
          Usar solo esenciales
        </button>
      </div>
    </section>
  );
}
