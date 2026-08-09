import ProveedorDetailClient from "./ProveedorDetailClient";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProveedorPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return <ProveedorDetailClient proveedorId={params.id} />;
}
