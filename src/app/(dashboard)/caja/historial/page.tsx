import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Banknote, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistorialCajaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cajas = await db.cierreCaja.findMany({
    where: { estado: "CERRADA" },
    orderBy: { fecha: "desc" },
    include: { usuario: true },
    take: 50 // Last 50 closures
  });

  const formatCOP = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Banknote className="w-8 h-8 text-[var(--color-primary)]" />
            Historial de Cierres de Caja
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Registro de los últimos 50 arqueos de caja para reimprimir recibos PDF.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl overflow-hidden shadow-xl mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha de Cierre</th>
                <th className="p-4 font-semibold">Cajero</th>
                <th className="p-4 font-semibold">Ventas Totales</th>
                <th className="p-4 font-semibold">Efectivo Contado</th>
                <th className="p-4 font-semibold">Diferencia</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-elevated)] text-sm">
              {cajas.map((caja) => (
                <tr key={caja.id} className="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
                  <td className="p-4 whitespace-nowrap text-white font-medium">
                    {new Date(caja.updatedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}
                  </td>
                  <td className="p-4 text-[var(--color-text-secondary)]">
                    {caja.usuario?.nombre || "N/A"}
                  </td>
                  <td className="p-4 text-white font-bold">
                    {formatCOP(caja.totalVentasSistema)}
                  </td>
                  <td className="p-4 text-[var(--color-text-secondary)]">
                    {formatCOP(caja.efectivoContado || 0)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-bold px-2 py-1 rounded-md ${
                        (caja.diferencia || 0) === 0
                          ? "bg-green-500/10 text-green-400"
                          : (caja.diferencia || 0) > 0
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {formatCOP(caja.diferencia || 0)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={`/api/caja/${caja.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black font-semibold py-2 px-3 rounded-lg transition-colors text-xs"
                    >
                      <FileText className="w-4 h-4" /> Imprimir Arqueo
                    </a>
                  </td>
                </tr>
              ))}
              {cajas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">
                    No hay cierres de caja registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
