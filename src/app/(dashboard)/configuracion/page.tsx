import ConfiguracionClient from "./ConfiguracionClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    redirect("/auth/login");
  }

  return <ConfiguracionClient />;
}
