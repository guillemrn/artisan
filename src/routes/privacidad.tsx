import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

const sections: LegalSection[] = [
  {
    title: "Responsable",
    body: [
      "Artisan opera actualmente como un proyecto personal de libre uso. La persona responsable del tratamiento de los datos personales asociados al proyecto es Guillermo Moreno.",
      "Contacto para temas de privacidad y derechos sobre datos personales: hola@guillermoml.com.",
    ],
  },
  {
    title: "Datos que podemos tratar",
    body: [
      "Podemos tratar datos de cuenta como nombre, correo electronico, telefono, negocio, categoria, preferencias de acceso y datos tecnicos necesarios para iniciar sesion.",
      "Dentro del producto, el usuario puede registrar informacion operativa de su negocio: productos, costos, precios, inventario, clientes, puntos de venta, ventas, pedidos, tickets, metodos de pago, estados de entrega y saldos pendientes.",
      "Tambien podemos registrar datos tecnicos basicos como dispositivo, navegador, errores, fecha de acceso y eventos de uso cuando el usuario acepta medicion.",
    ],
  },
  {
    title: "Finalidades",
    body: [
      "Usamos los datos para crear y proteger la cuenta, operar el punto de venta, guardar inventario, generar tickets, mostrar metricas del negocio, sincronizar informacion y dar soporte.",
      "Si el usuario acepta medicion, usamos eventos agregados para entender que partes del producto funcionan mejor, detectar friccion y mejorar Artisan. Esta finalidad no es necesaria para usar la plataforma.",
    ],
  },
  {
    title: "Servicios de apoyo",
    body: [
      "Artisan puede usar proveedores de infraestructura, autenticacion, base de datos, hosting, analitica y correo para prestar el servicio. Estos proveedores solo deben tratar la informacion necesaria para operar la plataforma.",
      "No vendemos la informacion del negocio del usuario. Cualquier transferencia distinta a la operacion normal del servicio debera informarse y, cuando aplique, solicitar consentimiento.",
    ],
  },
  {
    title: "Derechos y control",
    body: [
      "El titular puede solicitar acceso, rectificacion, cancelacion u oposicion respecto de sus datos personales, asi como revocar consentimiento cuando proceda.",
      "Para ejercer estos derechos, el usuario puede escribir a hola@guillermoml.com indicando nombre, cuenta asociada y la solicitud concreta.",
    ],
  },
  {
    title: "Cambios al aviso",
    body: [
      "Podemos actualizar este aviso cuando cambie el producto, los proveedores o las obligaciones aplicables. La version vigente se publicara en esta misma pagina con su fecha de actualizacion.",
    ],
  },
];

export const Route = createFileRoute("/privacidad")({
  head: () => ({ meta: [{ title: "Aviso de privacidad - Artisan" }] }),
  component: PrivacyRoute,
});

function PrivacyRoute() {
  return (
    <LegalPage
      title="Aviso de privacidad"
      description="Explica que datos trata Artisan, para que los usa y como puede el usuario ejercer control sobre su informacion."
      updatedAt="23 de agosto de 2026"
      sections={sections}
    />
  );
}
