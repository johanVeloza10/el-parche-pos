import CarteraClient from "./CarteraClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CarteraPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return <CarteraClient />;
}
