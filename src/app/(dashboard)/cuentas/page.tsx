export const dynamic = "force-dynamic";
export const revalidate = 0;

import CuentasClarasClient from "./CuentasClarasClient";

export const metadata = {
  title: "Cuentas Claras | El Parche",
  description: "Dashboard financiero artístico de El Parche Diseño",
};

export default function CuentasPage() {
  return <CuentasClarasClient />;
}
