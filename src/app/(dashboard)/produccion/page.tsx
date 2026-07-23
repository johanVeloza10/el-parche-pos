export const dynamic = "force-dynamic";
export const revalidate = 0;

import ProduccionClient from "./ProduccionClient";

export const metadata = {
  title: "Producción | El Parche",
  description: "Taller, consumo de insumos y órdenes de producción de El Parche Diseño",
};

export default function ProduccionPage() {
  return <ProduccionClient />;
}
