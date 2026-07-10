import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientLabelPrinter from "./ClientLabelPrinter";

export default async function EtiquetaPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await props.params;

  const prenda = await db.prenda.findUnique({
    where: { id },
    include: {
      proveedor: true,
    },
  });

  if (!prenda) {
    notFound();
  }

  return <ClientLabelPrinter prenda={prenda} />;
}
