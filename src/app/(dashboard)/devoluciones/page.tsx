export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from "next";
import DevolucionesClient from "./DevolucionesClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Devoluciones y Cambios | El Parche POS",
};

export default async function DevolucionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  if (session.user.rol === "CONTADOR") {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <DevolucionesClient />
    </div>
  );
}
