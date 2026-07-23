export const dynamic = "force-dynamic";
export const revalidate = 0;

import CajaDiariaClient from "./CajaDiariaClient";

export const metadata = {
  title: "Caja Diaria | El Parche",
  description: "Apertura, cierre y arqueo de caja diaria",
};

export default function CajaDiariaPage() {
  return <CajaDiariaClient />;
}
