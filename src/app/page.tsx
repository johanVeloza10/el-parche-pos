import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Redirección inteligente basada en el rol
  if (session.user.rol === "VENDEDORA") {
    redirect("/pos");
  } else {
    redirect("/reportes"); // ADMIN y CONTADOR van al dashboard de reportes/cuentas
  }

  return null;
}
