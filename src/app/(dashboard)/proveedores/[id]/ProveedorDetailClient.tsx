"use client";

import { useState, useEffect } from "react";
import { 
  Building, Phone, Mail, Landmark, FileText, CheckCircle, Clock,
  ArrowLeft, Tag, ShoppingBag, DollarSign, Calendar, Filter
} from "lucide-react";
import Link from "next/link";

interface ProveedorDetailClientProps {
  proveedorId: string;
}

const formatCOP = (num: number) => `$${Math.round(num).toLocaleString("es-CO")}`;

export default function ProveedorDetailClient({ proveedorId }: ProveedorDetailClientProps) {
  const [proveedor, setProveedor] = useState<any>(null);
  const [prendas, setPrendas] = useState<any[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<any[]>([]);
  
  const [tab, setTab] = useState<"prendas" | "liquidaciones">("prendas");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetchData();
  }, [proveedorId]);

  const fetchData = async () => {
    setCargando(true);
    try {
      const [resProv, resPrendas, resLiq] = await Promise.all([
        fetch(`/api/proveedores/${proveedorId}`),
        fetch(`/api/prendas?proveedorId=${proveedorId}&limit=100`),
        fetch(`/api/liquidaciones?proveedorId=${proveedorId}`)
      ]);

      if (resProv.ok) setProveedor(await resProv.json());
      if (resPrendas.ok) {
        const data = await resPrendas.json();
        setPrendas(data.prendas || []);
      }
      if (resLiq.ok) setLiquidaciones(await resLiq.json());

    } catch (error) {
      console.error("Error fetching proveedor data:", error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!proveedor) {
    return <div className="p-6 text-white">Proveedor no encontrado</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-8 pb-16">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/proveedores" className="bg-zinc-800 p-2 rounded-xl hover:bg-zinc-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-white flex items-center gap-3">
            {proveedor.nombre}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 font-sans">
            {proveedor.tipoDocumento}: {proveedor.numeroDocumento}
          </p>
        </div>
      </div>

      {/* STATS & INFO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 border-stitch-colombia rounded-3xl p-6 shadow-xl bg-[var(--color-surface)]">
          <h3 className="font-heading text-xl font-bold text-white mb-4">Información General</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-sans text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-[var(--color-text-muted)]">Teléfono</span>
              <span className="text-white flex items-center gap-2"><Phone className="w-4 h-4" /> {proveedor.telefono || "N/A"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[var(--color-text-muted)]">Email</span>
              <span className="text-white flex items-center gap-2"><Mail className="w-4 h-4" /> {proveedor.email || "N/A"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[var(--color-text-muted)]">Comisión Base</span>
              <span className="text-[var(--color-secondary)] font-bold">{proveedor.comisionDefaultPct}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[var(--color-text-muted)]">Condición Tributaria</span>
              <span className="text-white">{proveedor.responsableIva ? "Responsable IVA" : "Régimen Simple"}</span>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-[var(--color-text-muted)]">Datos Bancarios</span>
              <span className="text-white font-mono bg-black/30 p-2 rounded-lg border border-zinc-800">{proveedor.datosBancarios || "No registrados"}</span>
            </div>
          </div>
        </div>

        <div className="border-stitch-gold rounded-3xl p-6 shadow-xl bg-[var(--color-surface)] flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-xl font-bold text-white mb-2">Resumen Financiero</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-sans">Ventas pendientes por liquidar.</p>
          </div>
          <div className="my-6">
            <p className="text-4xl font-mono font-bold text-[var(--color-primary)]">
              {formatCOP(proveedor.saldoPorPagar || 0)}
            </p>
          </div>
          <Link href="/proveedores" className="text-center w-full bg-[var(--color-primary)] text-black font-bold py-2 rounded-xl text-sm transition-colors hover:opacity-90">
            Ir a Liquidar
          </Link>
        </div>

      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-zinc-800 pb-2">
        <button 
          onClick={() => setTab("prendas")}
          className={`px-4 py-2 font-bold text-sm rounded-t-xl transition-colors ${tab === "prendas" ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-zinc-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Prendas ({prendas.length})</div>
        </button>
        <button 
          onClick={() => setTab("liquidaciones")}
          className={`px-4 py-2 font-bold text-sm rounded-t-xl transition-colors ${tab === "liquidaciones" ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-zinc-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Cuentas de Cobro ({liquidaciones.length})</div>
        </button>
      </div>

      {/* TAB CONTENT */}
      {tab === "prendas" && (
        <div className="bg-[var(--color-surface)] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-zinc-900/50 text-zinc-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 font-medium">Código</th>
                  <th className="p-4 font-medium">Descripción</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Precio Venta</th>
                  <th className="p-4 font-medium text-right">Comisión (%)</th>
                  <th className="p-4 font-medium text-right">Ingresado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {prendas.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-zinc-500">No hay prendas registradas para este proveedor.</td></tr>
                ) : prendas.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4 font-mono text-white">{p.codigo}</td>
                    <td className="p-4">{p.descripcion}</td>
                    <td className="p-4">
                      {p.estado === "EN_VITRINA" && <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full font-bold">EN VITRINA</span>}
                      {p.estado === "VENDIDA" && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full font-bold">VENDIDA</span>}
                      {p.estado === "APARTADA" && <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full font-bold">APARTADA</span>}
                    </td>
                    <td className="p-4 text-right font-mono text-white">{formatCOP(p.precioVenta)}</td>
                    <td className="p-4 text-right">{p.comisionPct || proveedor.comisionDefaultPct}%</td>
                    <td className="p-4 text-right text-xs text-zinc-500">{new Date(p.fechaIngreso).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "liquidaciones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liquidaciones.length === 0 ? (
            <div className="col-span-full p-6 text-center text-zinc-500 bg-[var(--color-surface)] border border-zinc-800 rounded-3xl">
              No hay cuentas de cobro generadas.
            </div>
          ) : liquidaciones.map((liq: any) => (
            <div key={liq.id} className="bg-[var(--color-surface)] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 shadow-lg hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Periodo</p>
                  <p className="text-sm text-white font-medium">
                    {new Date(liq.periodoInicio).toLocaleDateString()} - {new Date(liq.periodoFin).toLocaleDateString()}
                  </p>
                </div>
                {liq.estado === "PAGADA" ? (
                  <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full font-bold">
                    <CheckCircle className="w-3 h-3" /> PAGADA
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full font-bold">
                    <Clock className="w-3 h-3" /> PENDIENTE
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 font-sans text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Ventas Brutas:</span>
                  <span className="font-mono text-white">{formatCOP(liq.totalVentas)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Comisión El Parche:</span>
                  <span className="font-mono text-white">-{formatCOP(liq.totalComision)}</span>
                </div>
                <div className="flex justify-between text-green-400 font-bold border-t border-zinc-800 mt-1 pt-2 text-sm">
                  <span>Neto Pagado:</span>
                  <span className="font-mono">{formatCOP(liq.netoAPagar)}</span>
                </div>
              </div>

              <div className="mt-2 pt-3 border-t border-zinc-800">
                <button 
                  onClick={() => window.open(`/api/liquidaciones/${liq.id}/pdf`, "_blank")}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-zinc-400" /> Descargar PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
