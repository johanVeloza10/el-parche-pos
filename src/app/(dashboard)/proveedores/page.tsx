export const dynamic = "force-dynamic";
export const revalidate = 0;

import ProveedoresClient from "./ProveedoresClient";

export const metadata = {
  title: "Proveedores | El Parche",
  description: "Gestión de proveedores y liquidación de consignaciones en El Parche Diseño",
};

export default function ProveedoresPage() {
  return <ProveedoresClient />;
}
