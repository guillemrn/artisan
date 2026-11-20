import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * La página propia de cada producto se quitó: ahora se edita en una hoja dentro de Productos.
 * Esta ruta se queda para que los enlaces viejos (búsqueda, favoritos) sigan funcionando.
 */
export const Route = createFileRoute("/productos_/$productId")({
  component: ProductRedirect,
});

function ProductRedirect() {
  const { productId } = Route.useParams();
  return <Navigate to="/productos" search={{ editar: productId } as never} replace />;
}
