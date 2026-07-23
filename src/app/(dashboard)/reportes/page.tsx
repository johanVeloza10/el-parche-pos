export const dynamic = "force-dynamic";
export const revalidate = 0;

import ReportesClient from "./ReportesClient";

export const metadata = {
  title: "Reportes e Indicadores | El Parche",
  description: "Indicadores comerciales, rotación de inventarios y exportes contables para El Parche Diseño",
};

export default function ReportesPage() {
  return <ReportesClient />;
}
