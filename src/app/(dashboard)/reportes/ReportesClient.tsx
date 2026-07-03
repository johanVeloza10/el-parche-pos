"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, RefreshCw, Calendar, TrendingUp, AlertOctagon, Scale, Percent, FileSpreadsheet } from "lucide-react";

export default function ReportesClient() {
  const [mesConsultado, setMesConsultado] = useState(new Date().toISOString().substring(0, 7)); // Ej: "2026-05"
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetchIndicadores();
  }, [mesConsultado]);

  const fetchIndicadores = async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/reportes?mes=${mesConsultado}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error("Error obteniendo reportes:", e);
    } finally {
      setCargando(false);
    }
  };

  const handleExportarExcel = () => {
    window.open(`/api/reportes/exportar?mes=${mesConsultado}`, "_blank");
  };

  const formatCOP = (num: number) => {
    return `$${Math.round(num).toLocaleString("es-CO")}`;
  };

  if (cargando && !data) {
    return (
      <div className="flex h-96 justify-center items-center">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[var(--color-secondary)]" /> Reportes e Indicadores
          </h1>
          <p className="text-[var(--color-text-secondary)]">Inteligencia comercial, rotación y exportación de datos contables.</p>
        </div>

        {/* SELECTOR DE MES */}
        <div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] p-2.5 rounded-2xl">
          <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
          <input 
            type="month"
            className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
            value={mesConsultado}
            onChange={e => setMesConsultado(e.target.value)}
          />
        </div>
      </div>

      {cargando ? (
        <div className="flex h-64 justify-center items-center">
          <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* SECCIÓN 1: PUNTO DE EQUILIBRIO Y METRICAS DE CONTROL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* TARJETA PUNTO EQUILIBRIO */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4">
              <div>
                <span className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider block mb-1">Punto de Equilibrio</span>
                <h3 className="text-3xl font-black text-white font-mono mt-1">{formatCOP(data.puntoEquilibrio)}</h3>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Necesitas vender esta suma al mes para cubrir tus gastos fijos de <span className="font-bold text-white">{formatCOP(data.totalCostosFijos)}</span>, calculado sobre la tasa de comisión real actual de la boutique.
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--color-secondary)] font-bold">
                <Scale className="w-4 h-4" /> Margen de Sostenibilidad
              </div>
            </div>

            {/* COMISIÓN PROMEDIO REAL */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4">
              <div>
                <span className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider block mb-1">Comisión Promedio Real</span>
                <h3 className="text-3xl font-black text-[var(--color-primary)] font-mono mt-1">{data.comisionPromedioReal}%</h3>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Es la comisión efectiva que se queda la boutique después de descontar rebajas y promociones. Históricamente ronda el 41%.
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--color-primary)] font-bold">
                <Percent className="w-4 h-4" /> Rentabilidad Operativa
              </div>
            </div>

            {/* EXPORTE PARA CONTADOR */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] hover:border-[var(--color-secondary)]/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 transition-all">
              <div>
                <span className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider block mb-1">Exporte Libro Fiscal</span>
                <h3 className="text-xl font-extrabold text-white mt-1">Exportar para Contador</h3>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Descarga el balance contable del mes en archivo Excel (.xlsx) estructurado con el formato oficial del libro fiscal.
              </p>
              <button 
                onClick={handleExportarExcel}
                className="w-full bg-[var(--color-secondary)] hover:bg-[#00BCCC] text-black font-bold py-3 rounded-xl text-xs transition-colors flex justify-center items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Descargar Excel
              </button>
            </div>

          </div>

          {/* SECCIÓN 2: RANKING Y ROTACIÓN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* RANKING DE DISEÑADORES / PROVEEDORES */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="font-bold text-lg text-white border-b border-[var(--color-surface-elevated)] pb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--color-secondary)]" /> Ranking de Diseñadores (Ventas)
              </h3>
              
              {data.rankingProveedores.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">No hay ventas registradas por proveedores aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-white border-collapse">
                    <thead>
                      <tr className="text-[var(--color-text-secondary)] font-semibold border-b border-[var(--color-surface-elevated)]">
                        <th className="pb-2">Diseñador</th>
                        <th className="pb-2 text-right">Ventas Totales</th>
                        <th className="pb-2 text-right">Comisión Boutique</th>
                        <th className="pb-2 text-center">Devoluciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-surface-elevated)]/50">
                      {data.rankingProveedores.map((p: any, idx: number) => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 font-bold flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-[var(--color-surface-elevated)] text-[10px] text-[var(--color-text-secondary)] flex items-center justify-center font-mono">{idx + 1}</span>
                            {p.nombre}
                          </td>
                          <td className="py-2.5 text-right font-mono font-medium">{formatCOP(p.ventasTotales)}</td>
                          <td className="py-2.5 text-right font-mono text-green-400">{formatCOP(p.comisionTienda)}</td>
                          <td className="py-2.5 text-center font-mono">{p.devoluciones}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ROTACIÓN PROMEDIO POR CATEGORÍA */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="font-bold text-lg text-white border-b border-[var(--color-surface-elevated)] pb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[var(--color-primary)] animate-spin-slow" /> Rotación de Inventario (Días en vitrina)
              </h3>
              
              {data.rotacionPromedio.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">No hay prendas vendidas registradas para promediar la rotación.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-white border-collapse">
                    <thead>
                      <tr className="text-[var(--color-text-secondary)] font-semibold border-b border-[var(--color-surface-elevated)]">
                        <th className="pb-2">Categoría</th>
                        <th className="pb-2 text-center">Prendas Vendidas</th>
                        <th className="pb-2 text-right">Días Promedio en Vitrina</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-surface-elevated)]/50">
                      {data.rotacionPromedio.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 font-bold">{r.categoria}</td>
                          <td className="py-2.5 text-center font-mono">{r.cantidadVendida}</td>
                          <td className="py-2.5 text-right font-mono">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${r.diasPromedio <= 30 ? 'bg-green-500/10 text-green-400' : r.diasPromedio <= 60 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                              {r.diasPromedio} días
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* SECCIÓN 3: PRENDAS ENVEJECIDAS (>60 DÍAS) */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[var(--color-surface-elevated)] pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" /> Alerta: Prendas Envejecidas en Vitrina (&gt;60 Días)
              </h3>
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold">
                {data.prendasEnvejecidas.length} prendas por devolver
              </span>
            </div>

            {data.prendasEnvejecidas.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">🎉 ¡Excelente! No tienes prendas estancadas en vitrina por más de 60 días.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--color-surface-elevated)]">
                <table className="w-full text-left text-xs text-white border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-surface-elevated)]/30 text-[var(--color-text-secondary)] font-semibold">
                      <th className="p-3">Código</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3 text-center">Días en Vitrina</th>
                      <th className="p-3 text-right">Precio Venta</th>
                      <th className="p-3">Diseñador / Proveedor</th>
                      <th className="p-3">Teléfono Diseñador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-surface-elevated)]">
                    {data.prendasEnvejecidas.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-[var(--color-primary)]">{p.codigo}</td>
                        <td className="p-3">{p.descripcion}</td>
                        <td className="p-3 text-center font-mono">
                          <span className="text-red-400 font-bold">{p.diasEnVitrina} días</span>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">{formatCOP(p.precioVenta)}</td>
                        <td className="p-3 font-medium">{p.proveedor}</td>
                        <td className="p-3 font-mono text-[var(--color-text-secondary)]">{p.telefonoProveedor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
