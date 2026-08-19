export const dynamic = "force-dynamic";
export const revalidate = 0;

import RecepcionContainer from "./RecepcionContainer";

export const metadata = {
  title: "Recepción | El Parche",
  description: "Ingreso y Salida de mercancía a El Parche Diseño",
};

export default function ReceptionPage() {
  return <RecepcionContainer />;
}
