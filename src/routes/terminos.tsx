import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

const sections: LegalSection[] = [
  {
    title: "Servicio",
    body: [
      "Artisan opera actualmente como un proyecto personal de libre uso. Es una herramienta web para registrar ventas, pedidos, clientes, productos, inventario, tickets, pagos pendientes y metricas basicas de negocios locales.",
      "El servicio puede cambiar conforme evolucione el producto. Las funciones en modo demo o beta pueden modificarse, pausarse o retirarse.",
    ],
  },
  {
    title: "Cuenta y acceso",
    body: [
      "El usuario es responsable de mantener la seguridad de sus credenciales, de usar informacion correcta y de avisar si detecta accesos no autorizados.",
      "Artisan puede limitar o suspender el acceso cuando exista uso indebido, riesgo para otros usuarios, abuso tecnico o incumplimiento de estos terminos.",
    ],
  },
  {
    title: "Informacion del negocio",
    body: [
      "El usuario conserva la responsabilidad sobre los datos que captura en Artisan, incluyendo productos, costos, precios, clientes, ventas y pagos.",
      "Artisan ayuda a organizar informacion operativa, pero no sustituye asesoria contable, fiscal, legal o financiera. El usuario debe revisar sus datos antes de tomar decisiones criticas.",
    ],
  },
  {
    title: "Uso permitido",
    body: [
      "El usuario se compromete a usar Artisan para fines legales, sin intentar vulnerar el servicio, extraer informacion de otros usuarios, cargar contenido malicioso o usar la plataforma para actividades prohibidas.",
      "No se permite copiar, revender, sublicenciar o explotar comercialmente la plataforma fuera del uso normal del negocio del usuario sin autorizacion escrita.",
    ],
  },
  {
    title: "Pagos y planes",
    body: [
      "Artisan se ofrece actualmente sin costo. Si en el futuro incorpora planes de pago, precios o suscripciones, esos terminos comerciales deberan informarse antes del cobro. Esta pagina debe actualizarse cuando exista una oferta comercial definida.",
    ],
  },
  {
    title: "Contacto",
    body: [
      "Para dudas sobre estos terminos o sobre el uso de Artisan, el usuario puede escribir a hola@guillermoml.com.",
    ],
  },
  {
    title: "Disponibilidad y responsabilidad",
    body: [
      "Trabajamos para mantener el servicio disponible y seguro, pero pueden existir interrupciones por mantenimiento, proveedores externos, fallas tecnicas o causas fuera de nuestro control.",
      "En la medida permitida por la ley, Artisan no sera responsable por perdidas indirectas derivadas del uso, falta de disponibilidad o interpretacion de la informacion registrada por el usuario.",
    ],
  },
  {
    title: "Cambios",
    body: [
      "Podemos actualizar estos terminos cuando cambie el producto, la operacion o el marco aplicable. La version vigente se publicara en esta pagina.",
    ],
  },
];

export const Route = createFileRoute("/terminos")({
  head: () => ({ meta: [{ title: "Terminos y condiciones - Artisan" }] }),
  component: TermsRoute,
});

function TermsRoute() {
  return (
    <LegalPage
      title="Terminos y condiciones"
      description="Define las reglas base para usar Artisan y la relacion entre la plataforma y sus usuarios."
      updatedAt="23 de agosto de 2026"
      sections={sections}
    />
  );
}
