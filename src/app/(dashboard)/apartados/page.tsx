export const dynamic = "force-dynamic";
export const revalidate = 0;

import ApartadosClient from "./ApartadosClient";

export const metadata = {
  title: "Apartados - El Parche POS",
};

export default function ApartadosPage() {
  return <ApartadosClient />;
}
