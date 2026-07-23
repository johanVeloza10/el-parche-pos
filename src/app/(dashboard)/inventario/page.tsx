export const dynamic = "force-dynamic";
export const revalidate = 0;

import InventoryClient from "./InventoryClient";

export const metadata = {
  title: "Inventario | El Parche",
  description: "Galería de inventario de El Parche Diseño",
};

export default function InventoryPage() {
  return <InventoryClient />;
}
