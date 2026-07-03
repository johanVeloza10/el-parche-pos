"use client";

import { useState, useEffect } from "react";
import { Wallet, Calendar, ArrowRightLeft, TrendingUp, AlertTriangle, ArrowLeft, ArrowRight, Eye } from "lucide-react";

export default function CuentasClient() {
  const [datosMensuales, setDatosMensuales] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [indexMesSeleccionado, setIndexMesSeleccionado] = useState(0);
  const [verDetalleDia, setVerDetalleDia] = useState(false);

  useEffect(() => {
    fetchCuentas();
  }, []);

  const fetchCuentas = async () => {
    try {
      const res = await fetch("/api/cuentas");
      if (res.ok) {
        const data = await res.json();
        setDatosMensuales(data);
        // Seleccionamos el último mes disponible por defecto
        if (data.length > 0) {
          setIndexMesSeleccionado(data.length - 1);
        }
      }
    } catch (error) {
      console.error("Error cargando cuentas:", error);
    } finally {
      setCargando(false);
    }
  };

  const formatCOP = (num: number) => {
    return `$${Math.round(num).toLocaleString("es-CO")}`;
  };

  if (cargando) {
    return (
      <div className="flex h-96 justify-center items-center">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (datosMensuales.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-text-muted)]">
        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay datos financieros registrados en el sistema.</p>
      </div>
    );
  }

  const mesActivo = datosMensuales[indexMesSeleccionado];

  // Calculamos totales históricos
  const totalVentasHistorico = datosMensuales.reduce((sum, m) => sum + m.ventas, 0);
  const totalIngresoHistorico = datosMensuales.reduce((sum, m) => sum + m.ingresoReal, 0);
  const totalGastosHistorico = datosMensuales.reduce((sum, m) => sum + m.gastos, 0);
  const totalGananciaHistorica = datosMensuales.reduce((sum, m) => sum + m.ganancia, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 pb-16">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Wallet className="w-8 h-8 text-[var(--color-primary)]" /> Cuentas Claras
        </h1>
        <p className="text-[var(--color-text-secondary)]">El estado financiero real de El Parche en lenguaje simple.</p>
      </div>

      {/* DASHBOARD PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TARJETA DE LIBRO CONTABLE (LADO IZQUIERDO Y CENTRO) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl overflow-hidden shadow-xl">
            
            {/* SELECTOR DE MES */}
            <div className="bg-[var(--color-surface-elevated)]/50 px-6 py-4 flex justify-between items-center border-b border-[var(--color-surface-elevated)]">
              <button 
                disabled={indexMesSeleccionado === 0}
                onClick={() => setIndexMesSeleccionado(prev => prev - 1)}
                className="p-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Mostrando Mes</span>
                <h2 className="text-xl font-bold text-[var(--color-primary)]">{mesActivo.mesNombre.toUpperCase()} {mesActivo.mes.split("-")[0]}</h2>
              </div>

              <button 
                disabled={indexMesSeleccionado === datosMensuales.length - 1}
                onClick={() => setIndexMesSeleccionado(prev => prev + 1)}
                className="p-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* CUERPO DEL LIBRO FISCAL */}
            <div className="p-6 flex flex-col gap-4 text-white">
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-semibold text-lg text-white">Ventas totales del mes</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Todo lo cobrado en caja</p>
                </div>
                <span className="text-xl font-mono">{formatCOP(mesActivo.ventas)}</span>
              </div>

              <div className="flex justify-between items-center py-2 text-red-400">
                <div>
                  <p className="font-medium text-sm">(–) Lo que pertenece a proveedores</p>
                  <p className="text-xs text-red-400/70">Comisiones de diseñadores por consignación</p>
                </div>
                <span className="text-lg font-mono">-{formatCOP(mesActivo.pagosProveedores)}</span>
              </div>

              <div className="border-t border-dashed border-[var(--color-surface-elevated)] my-2"></div>

              <div className="flex justify-between items-center py-3 bg-[var(--color-surface-elevated)]/30 px-4 rounded-2xl">
                <div>
                  <p className="font-bold text-white uppercase tracking-wide text-sm">Lo que entró a la tienda</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Margen bruto antes de costos y gastos</p>
                </div>
                <span className="text-xl font-mono font-bold text-[var(--color-secondary)]">{formatCOP(mesActivo.ingresoReal)}</span>
              </div>

              <div className="flex justify-between items-center py-2 text-red-400/80">
                <div>
                  <p className="font-medium text-sm">(–) Costo de prendas propias vendidas</p>
                  <p className="text-xs text-red-400/60">Materiales y confección de la marca</p>
                </div>
                <span className="text-md font-mono">-$0</span>
              </div>

              <div className="border-t border-dashed border-[var(--color-surface-elevated)] my-2"></div>

              <div className="flex justify-between items-center py-2 text-[var(--color-text-secondary)]">
                <div>
                  <p className="font-semibold text-sm text-white">Ganancia antes de gastos</p>
                </div>
                <span className="text-md font-mono">{formatCOP(mesActivo.ingresoReal)}</span>
              </div>

              <div className="flex justify-between items-center py-2 text-red-400">
                <div>
                  <p className="font-medium text-sm">(–) Gastos del mes</p>
                  <p className="text-xs text-red-400/70">Arriendo, servicios públicos, nóminas, etc.</p>
                </div>
                <span className="text-lg font-mono">-{formatCOP(mesActivo.gastos)}</span>
              </div>

              <div className="border-t-2 border-[var(--color-surface-elevated)] my-3"></div>

              <div className="flex justify-between items-center py-4 bg-green-500/10 border border-green-500/20 px-6 rounded-2xl">
                <div>
                  <p className="font-extrabold text-lg text-green-400 flex items-center gap-2">
                    ✅ GANANCIA REAL DEL MES
                  </p>
                  <p className="text-xs text-green-400/70">Lo que te queda libre a ti como dueña</p>
                </div>
                <span className="text-3xl font-mono font-black text-green-400">{formatCOP(mesActivo.ganancia)}</span>
              </div>

            </div>
          </div>
          
          {/* BOTÓN MOSTRAR DETALLE DÍA A DÍA */}
          <button 
            onClick={() => setVerDetalleDia(!verDetalleDia)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] hover:border-[var(--color-primary)]/50 rounded-2xl py-4 text-white font-bold transition-colors flex justify-center items-center gap-2"
          >
            <Eye className="w-5 h-5 text-[var(--color-secondary)]" /> 
            {verDetalleDia ? "Ocultar reporte diario" : "Ver reporte detallado día a día"}
          </button>
        </div>

        {/* HISTORIAL COMPARATIVO MENSUAL (DERECHA) */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-[var(--color-surface-elevated)] pb-3">
              <TrendingUp className="w-5 h-5 text-[var(--color-secondary)]" /> Acumulado Histórico
            </h3>

            <div className="flex flex-col gap-4">
              <div className="bg-[var(--color-surface-elevated)]/30 p-4 rounded-2xl">
                <p className="text-xs text-[var(--color-text-secondary)]">VENTAS BRUTAS TOTALES</p>
                <p className="text-2xl font-mono font-bold text-white mt-1">{formatCOP(totalVentasHistorico)}</p>
              </div>

              <div className="bg-[var(--color-surface-elevated)]/30 p-4 rounded-2xl">
                <p className="text-xs text-[var(--color-text-secondary)]">INGRESO REAL TIENDA</p>
                <p className="text-2xl font-mono font-bold text-[var(--color-secondary)] mt-1">{formatCOP(totalIngresoHistorico)}</p>
              </div>

              <div className="bg-[var(--color-surface-elevated)]/30 p-4 rounded-2xl">
                <p className="text-xs text-[var(--color-text-secondary)]">GASTOS GENERALES</p>
                <p className="text-2xl font-mono font-bold text-red-400 mt-1">{formatCOP(totalGastosHistorico)}</p>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl">
                <p className="text-xs text-green-400">GANANCIA NETA TOTAL (Libre)</p>
                <p className="text-3xl font-mono font-black text-green-400 mt-1">{formatCOP(totalGananciaHistorica)}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* DETALLE DÍA A DÍA (COLAPSIBLE) */}
      {verDetalleDia && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-primary)]" /> Detalle Diario — {mesActivo.mesNombre}
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-surface-elevated)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-xs uppercase font-semibold">
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-right">Ventas Brutas</th>
                  <th className="p-4 text-right">Pago Prov. (Consignación)</th>
                  <th className="p-4 text-right">Ingreso Tienda</th>
                  <th className="p-4 text-right">Gastos</th>
                  <th className="p-4 text-right">Saldo Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-surface-elevated)] text-sm text-white">
                {mesActivo.detallesDia.map((dia: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--color-surface-elevated)]/20 transition-colors">
                    <td className="p-4 font-mono">{dia.fecha}</td>
                    <td className="p-4 text-right font-mono">{formatCOP(dia.ventasBrutas)}</td>
                    <td className="p-4 text-right font-mono text-red-400/80">-{formatCOP(dia.pagosTerceros)}</td>
                    <td className="p-4 text-right font-mono text-[var(--color-secondary)]">{formatCOP(dia.ingresoReal)}</td>
                    <td className="p-4 text-right font-mono text-red-400">-{formatCOP(dia.gastos)}</td>
                    <td className={`p-4 text-right font-mono font-bold ${dia.saldoDia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dia.saldoDia < 0 ? "-" : ""}{formatCOP(Math.abs(dia.saldoDia))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPARATIVA HISTÓRICA COMPLETA */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl">
        <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-[var(--color-secondary)]" /> Historial de Cuentas por Mes
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-surface-elevated)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-xs uppercase font-semibold">
                <th className="p-4">Mes</th>
                <th className="p-4 text-right">Ventas</th>
                <th className="p-4 text-right">Pago Proveedores</th>
                <th className="p-4 text-right">Ingreso Tienda</th>
                <th className="p-4 text-right">Gastos</th>
                <th className="p-4 text-right">Ganancia Libre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-elevated)] text-sm text-white">
              {datosMensuales.map((m, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-[var(--color-surface-elevated)]/30 transition-colors cursor-pointer ${idx === indexMesSeleccionado ? 'bg-[var(--color-primary)]/5 border-l-4 border-[var(--color-primary)]' : ''}`}
                  onClick={() => setIndexMesSeleccionado(idx)}
                >
                  <td className="p-4 font-bold text-[var(--color-primary)]">{m.mesNombre} {m.mes.split("-")[0]}</td>
                  <td className="p-4 text-right font-mono">{formatCOP(m.ventas)}</td>
                  <td className="p-4 text-right font-mono text-red-400/80">-{formatCOP(m.pagosProveedores)}</td>
                  <td className="p-4 text-right font-mono text-[var(--color-secondary)]">{formatCOP(m.ingresoReal)}</td>
                  <td className="p-4 text-right font-mono text-red-400">-{formatCOP(m.gastos)}</td>
                  <td className="p-4 text-right font-mono font-black text-green-400">{formatCOP(m.ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
