export const dynamic = "force-dynamic";
export const revalidate = 0;

import ReceptionClient from "./ReceptionClient";

export const metadata = {
  title: "Recepción | El Parche",
  description: "Ingreso de mercancía a El Parche Diseño",
};

export default function ReceptionPage() {
  return <ReceptionClient />;
}
