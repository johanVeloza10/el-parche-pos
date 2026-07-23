"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Users,
  Bell,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from "recharts";

// --- Types ---
interface DatoMensual {
  mes: string;
  mesNombre: string;
  ventas: number;
  pagosProveedores: number;
  ingresoReal: number;
  gastos: number;
  ganancia: number;
  detallesDia: any[];
}

interface ProveedorRanking {
  id: string;
  nombre: string;
  prendasVendidas: number;
  prendasEnVitrina: number;
  totalVentas: number;
  totalComision: number;
  totalParaProveedor: number;
  comisionPct: number;
}

interface Alerta {
  tipo: string;
  icono: string;
  titulo: string;
  mensaje: string;
  urgencia: "alta" | "media" | "baja";
}

// --- Helpers ---
const formatCOP = (num: number) => `$${Math.round(num).toLocaleString("es-CO")}`;

const calcCambio = (actual: number, anterior: number) => {
  if (anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
};

// --- Custom Tooltip for Recharts ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel rounded-xl p-4 text-sm shadow-xl border border-zinc-700">
        <p className="font-heading font-bold text-white mb-2">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }} className="font-sans">
            {entry.name}: {formatCOP(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function CuentasClarasClient() {
  const [datosMensuales, setDatosMensuales] = useState<DatoMensual[]>([]);
  const [cargando, setCargando] = useState(true);
  const [indexMesSeleccionado, setIndexMesSeleccionado] = useState(0);
  const [verDetalleDia, setVerDetalleDia] = useState(false);
  const [proveedoresRanking, setProveedoresRanking] = useState<ProveedorRanking[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/cuentas", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/cuentas/proveedores-ranking", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/cuentas/alertas", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([cuentas, ranking, alertasData]) => {
        setDatosMensuales(cuentas);
        if (cuentas.length > 0) setIndexMesSeleccionado(cuentas.length - 1);
        setProveedoresRanking(Array.isArray(ranking) ? ranking : []);
        setAlertas(Array.isArray(alertasData) ? alertasData : []);
      })
      .catch((err) => console.error("Error cargando dashboard:", err))
      .finally(() => setCargando(false));
  }, []);

  // --- Loading ---
  if (cargando) {
    return (
      <div className="flex h-96 justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
          <p className="font-heading text-lg text-[var(--color-text-secondary)] italic">
            Tejiendo los números...
          </p>
        </div>
      </div>
    );
  }

  // --- Empty ---
  if (datosMensuales.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-text-muted)]">
        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-heading text-xl">No hay datos financieros registrados aún.</p>
        <p className="text-sm mt-2">
          Los datos aparecerán aquí automáticamente cuando se registren ventas desde el Punto de Venta.
        </p>
      </div>
    );
  }

  const mesActivo = datosMensuales[indexMesSeleccionado];
  const mesAnterior = indexMesSeleccionado > 0 ? datosMensuales[indexMesSeleccionado - 1] : null;

  // Datos para la gráfica
  const datosGrafica = datosMensuales.map((m) => ({
    name: m.mesNombre.substring(0, 3),
    Ventas: m.ventas,
    Gastos: m.pagosProveedores + m.gastos,
    Ganancia: m.ganancia,
  }));

  // Totales históricos
  const totalVentasHistorico = datosMensuales.reduce((s, m) => s + m.ventas, 0);
  const totalGananciaHistorica = datosMensuales.reduce((s, m) => s + m.ganancia, 0);

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <div>
        <h1 className="font-heading text-4xl font-light italic text-white tracking-wide flex items-center gap-3 select-none">
          Cuentas{" "}
          <span className="font-bold not-italic bg-gradient-to-r from-[#FCD116] to-[#FFE700] bg-clip-text text-transparent">
            Claras
          </span>
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1 font-sans">
          El estado financiero real de El Parche, en lenguaje simple.
        </p>
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 1: HERO CARDS — RESUMEN DEL MES */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ventas del Mes */}
        <div className="border-stitch-gold rounded-2xl p-4 sm:p-5 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-sans uppercase tracking-wider font-bold">
            Ventas del Mes
          </span>
          <span className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            {formatCOP(mesActivo.ventas)}
          </span>
          {mesAnterior && (
            <CambioIndicator actual={mesActivo.ventas} anterior={mesAnterior.ventas} />
          )}
        </div>

        {/* Ganancia Real */}
        <div className="border-stitch-colombia rounded-2xl p-4 sm:p-5 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-sans uppercase tracking-wider font-bold">
            Ganancia Real
          </span>
          <span
            className={`font-heading text-xl sm:text-2xl lg:text-3xl font-bold ${
              mesActivo.ganancia >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatCOP(mesActivo.ganancia)}
          </span>
          {mesAnterior && (
            <CambioIndicator actual={mesActivo.ganancia} anterior={mesAnterior.ganancia} />
          )}
        </div>

        {/* Pagado a Proveedores */}
        <div className="border-stitch-white rounded-2xl p-4 sm:p-5 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-sans uppercase tracking-wider font-bold">
            Pagado Proveedores
          </span>
          <span className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-red-400">
            {formatCOP(mesActivo.pagosProveedores)}
          </span>
        </div>

        {/* Gastos del Mes */}
        <div className="border-stitch-white rounded-2xl p-4 sm:p-5 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-sans uppercase tracking-wider font-bold">
            Gastos del Mes
          </span>
          <span className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-orange-400">
            {formatCOP(mesActivo.gastos)}
          </span>
        </div>
      </div>

      {/* Selector de mes debajo de las tarjetas */}
      <div className="flex justify-center items-center gap-4">
        <button
          disabled={indexMesSeleccionado === 0}
          onClick={() => setIndexMesSeleccionado((p) => p - 1)}
          className="p-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-[var(--color-surface-elevated)]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-heading text-lg font-bold text-[var(--color-primary)] uppercase tracking-wider select-none">
          {mesActivo.mesNombre} {mesActivo.mes.split("-")[0]}
        </span>
        <button
          disabled={indexMesSeleccionado === datosMensuales.length - 1}
          onClick={() => setIndexMesSeleccionado((p) => p + 1)}
          className="p-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-[var(--color-surface-elevated)]"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 2: GRÁFICA DE TENDENCIA MENSUAL */}
      {/* ============================================================ */}
      <div className="border-stitch-gold rounded-3xl p-4 sm:p-6 shadow-xl">
        <h2 className="font-heading text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[var(--color-logo-cyan)]" /> Tendencia Mensual
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] font-sans mb-6">
          Ventas brutas vs gastos totales vs ganancia real
        </p>

        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={datosGrafica} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "var(--font-cormorant)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-inter)", color: "#94A3B8" }}
              />
              <Bar dataKey="Ventas" fill="#FCD116" radius={[6, 6, 0, 0]} barSize={28} opacity={0.85} />
              <Bar dataKey="Gastos" fill="#003893" radius={[6, 6, 0, 0]} barSize={28} opacity={0.7} />
              <Line
                type="monotone"
                dataKey="Ganancia"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981", r: 5, strokeWidth: 2, stroke: "#070707" }}
                activeDot={{ r: 7, stroke: "#10B981", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 3: LIBRO CONTABLE DEL MES + DETALLE DÍA A DÍA */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Libro Contable */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="border-stitch-colombia rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-[var(--color-surface-elevated)]/50 px-6 py-4 border-b border-[var(--color-surface-elevated)]">
              <h3 className="font-heading text-xl font-bold text-white">
                📒 Libro del Mes — {mesActivo.mesNombre}
              </h3>
            </div>
            <div className="p-5 sm:p-6 flex flex-col gap-3 text-white bg-[var(--color-surface)]">
              <LineaLibro
                titulo="Ventas totales del mes"
                subtitulo="Todo lo cobrado en caja"
                valor={formatCOP(mesActivo.ventas)}
                color="text-white"
                bold
              />
              <LineaLibro
                titulo="(–) Lo que pertenece a proveedores"
                subtitulo="Comisiones de diseñadores por consignación"
                valor={`-${formatCOP(mesActivo.pagosProveedores)}`}
                color="text-red-400"
              />
              <div className="border-t border-dashed border-zinc-700 my-1" />
              <div className="bg-[var(--color-surface-elevated)]/30 px-4 py-3 rounded-2xl">
                <LineaLibro
                  titulo="LO QUE ENTRÓ A LA TIENDA"
                  subtitulo="Margen bruto antes de gastos"
                  valor={formatCOP(mesActivo.ingresoReal)}
                  color="text-[var(--color-logo-cyan)]"
                  bold
                />
              </div>
              <LineaLibro
                titulo="(–) Gastos del mes"
                subtitulo="Arriendo, servicios, nóminas, etc."
                valor={`-${formatCOP(mesActivo.gastos)}`}
                color="text-red-400"
              />
              <div className="border-t-2 border-zinc-700 my-2" />
              <div
                className={`px-5 py-4 rounded-2xl ${
                  mesActivo.ganancia >= 0
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p
                      className={`font-extrabold text-sm uppercase tracking-wider ${
                        mesActivo.ganancia >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {mesActivo.ganancia >= 0 ? "✅ GANANCIA REAL DEL MES" : "⚠️ PÉRDIDA DEL MES"}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      Lo que te queda libre a ti como dueña
                    </p>
                  </div>
                  <span
                    className={`font-heading text-3xl font-bold ${
                      mesActivo.ganancia >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatCOP(mesActivo.ganancia)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón ver detalle día a día */}
          <button
            onClick={() => setVerDetalleDia(!verDetalleDia)}
            className="w-full border-stitch-white rounded-2xl py-4 text-white font-bold transition-all duration-300 flex justify-center items-center gap-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            {verDetalleDia ? (
              <EyeOff className="w-5 h-5 text-[var(--color-logo-cyan)]" />
            ) : (
              <Eye className="w-5 h-5 text-[var(--color-logo-cyan)]" />
            )}
            {verDetalleDia ? "Ocultar reporte diario" : "Ver reporte detallado día a día"}
          </button>
        </div>

        {/* Acumulado Histórico (derecha) */}
        <div className="flex flex-col gap-4">
          <div className="border-stitch-gold rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
            <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-700 pb-3">
              <TrendingUp className="w-5 h-5 text-[var(--color-logo-cyan)]" /> Acumulado Total
            </h3>
            <div className="bg-[var(--color-surface-elevated)]/30 p-4 rounded-2xl">
              <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold font-sans">
                Ventas Brutas Totales
              </p>
              <p className="font-heading text-2xl font-bold text-white mt-1">
                {formatCOP(totalVentasHistorico)}
              </p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl">
              <p className="text-[10px] text-green-400 uppercase tracking-wider font-bold font-sans">
                Ganancia Neta Total
              </p>
              <p className="font-heading text-2xl font-bold text-green-400 mt-1">
                {formatCOP(totalGananciaHistorica)}
              </p>
            </div>
          </div>

          {/* SECCIÓN 5: ALERTAS INTELIGENTES */}
          {alertas.length > 0 && (
            <div className="border-stitch-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-700 pb-3">
                <Bell className="w-5 h-5 text-[var(--color-primary)]" /> Alertas
              </h3>
              {alertas.map((alerta, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-sm font-sans ${
                    alerta.urgencia === "alta"
                      ? "border-red-500/30 bg-red-500/5"
                      : alerta.urgencia === "media"
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-green-500/30 bg-green-500/5"
                  }`}
                >
                  <p className="font-bold text-white flex items-center gap-2">
                    <span>{alerta.icono}</span> {alerta.titulo}
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-xs mt-1">{alerta.mensaje}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DETALLE DÍA A DÍA (COLAPSIBLE) */}
      {verDetalleDia && mesActivo.detallesDia && (
        <div className="border-stitch-colombia rounded-3xl p-5 sm:p-6 shadow-xl">
          <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-primary)]" /> Detalle Diario —{" "}
            {mesActivo.mesNombre}
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-[10px] sm:text-xs uppercase font-bold font-sans">
                  <th className="p-3 sm:p-4">Fecha</th>
                  <th className="p-3 sm:p-4 text-right">Ventas</th>
                  <th className="p-3 sm:p-4 text-right">Prov.</th>
                  <th className="p-3 sm:p-4 text-right">Ingreso</th>
                  <th className="p-3 sm:p-4 text-right">Gastos</th>
                  <th className="p-3 sm:p-4 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-white font-sans">
                {mesActivo.detallesDia.map((dia: any, idx: number) => (
                  <tr
                    key={idx}
                    className="hover:bg-[var(--color-surface-elevated)]/20 transition-colors"
                  >
                    <td className="p-3 sm:p-4 font-mono text-xs">{dia.fecha}</td>
                    <td className="p-3 sm:p-4 text-right font-mono text-xs">
                      {formatCOP(dia.ventasBrutas)}
                    </td>
                    <td className="p-3 sm:p-4 text-right font-mono text-xs text-red-400/80">
                      -{formatCOP(dia.pagosTerceros)}
                    </td>
                    <td className="p-3 sm:p-4 text-right font-mono text-xs text-[var(--color-logo-cyan)]">
                      {formatCOP(dia.ingresoReal)}
                    </td>
                    <td className="p-3 sm:p-4 text-right font-mono text-xs text-red-400">
                      -{formatCOP(dia.gastos)}
                    </td>
                    <td
                      className={`p-3 sm:p-4 text-right font-mono text-xs font-bold ${
                        dia.saldoDia >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {dia.saldoDia < 0 ? "-" : ""}
                      {formatCOP(Math.abs(dia.saldoDia))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECCIÓN 4: RANKING DE PROVEEDORES */}
      {/* ============================================================ */}
      {proveedoresRanking.length > 0 && (
        <div className="border-stitch-gold rounded-3xl p-5 sm:p-6 shadow-xl">
          <h3 className="font-heading text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--color-primary)]" /> Ranking de Proveedores
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] font-sans mb-6">
            Ordenados por comisión generada para la boutique (de mayor a menor)
          </p>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-[10px] sm:text-xs uppercase font-bold font-sans">
                  <th className="p-3 sm:p-4">#</th>
                  <th className="p-3 sm:p-4">Proveedor</th>
                  <th className="p-3 sm:p-4 text-right">Vendidas</th>
                  <th className="p-3 sm:p-4 text-right">En Vitrina</th>
                  <th className="p-3 sm:p-4 text-right">Venta Total</th>
                  <th className="p-3 sm:p-4 text-right">Comisión Boutique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-white font-sans">
                {proveedoresRanking.map((prov, idx) => (
                  <tr
                    key={prov.id}
                    className="hover:bg-[var(--color-surface-elevated)]/20 transition-colors"
                  >
                    <td className="p-3 sm:p-4 font-heading text-lg font-bold text-[var(--color-primary)]">
                      {idx + 1}
                    </td>
                    <td className="p-3 sm:p-4 font-bold">{prov.nombre}</td>
                    <td className="p-3 sm:p-4 text-right font-mono">{prov.prendasVendidas}</td>
                    <td className="p-3 sm:p-4 text-right">
                      <span
                        className={`font-mono ${
                          prov.prendasEnVitrina > 10
                            ? "text-orange-400"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {prov.prendasEnVitrina}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-right font-mono">{formatCOP(prov.totalVentas)}</td>
                    <td className="p-3 sm:p-4 text-right font-mono font-bold text-green-400">
                      {formatCOP(prov.totalComision)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial comparativo mensual */}
      <div className="border-stitch-white rounded-3xl p-5 sm:p-6 shadow-xl">
        <h3 className="font-heading text-xl font-bold text-white mb-6 flex items-center gap-2">
          📊 Historial de Cuentas por Mes
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-[10px] sm:text-xs uppercase font-bold font-sans">
                <th className="p-3 sm:p-4">Mes</th>
                <th className="p-3 sm:p-4 text-right">Ventas</th>
                <th className="p-3 sm:p-4 text-right">Pago Prov.</th>
                <th className="p-3 sm:p-4 text-right">Ingreso</th>
                <th className="p-3 sm:p-4 text-right">Gastos</th>
                <th className="p-3 sm:p-4 text-right">Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm text-white font-sans">
              {datosMensuales.map((m, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[var(--color-surface-elevated)]/30 transition-colors cursor-pointer ${
                    idx === indexMesSeleccionado
                      ? "bg-[var(--color-primary)]/5 border-l-4 border-[var(--color-primary)]"
                      : ""
                  }`}
                  onClick={() => setIndexMesSeleccionado(idx)}
                >
                  <td className="p-3 sm:p-4 font-heading font-bold text-[var(--color-primary)]">
                    {m.mesNombre} {m.mes.split("-")[0]}
                  </td>
                  <td className="p-3 sm:p-4 text-right font-mono text-xs">{formatCOP(m.ventas)}</td>
                  <td className="p-3 sm:p-4 text-right font-mono text-xs text-red-400/80">
                    -{formatCOP(m.pagosProveedores)}
                  </td>
                  <td className="p-3 sm:p-4 text-right font-mono text-xs text-[var(--color-logo-cyan)]">
                    {formatCOP(m.ingresoReal)}
                  </td>
                  <td className="p-3 sm:p-4 text-right font-mono text-xs text-red-400">
                    -{formatCOP(m.gastos)}
                  </td>
                  <td className="p-3 sm:p-4 text-right font-mono text-xs font-bold text-green-400">
                    {formatCOP(m.ganancia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function LineaLibro({
  titulo,
  subtitulo,
  valor,
  color,
  bold,
}: {
  titulo: string;
  subtitulo?: string;
  valor: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-2 ${color}`}>
      <div>
        <p className={`${bold ? "font-bold text-sm uppercase tracking-wide" : "font-medium text-sm"}`}>
          {titulo}
        </p>
        {subtitulo && (
          <p className="text-xs opacity-60">{subtitulo}</p>
        )}
      </div>
      <span className={`font-heading text-lg ${bold ? "font-bold" : ""}`}>{valor}</span>
    </div>
  );
}

function CambioIndicator({ actual, anterior }: { actual: number; anterior: number }) {
  const cambio = calcCambio(actual, anterior);
  if (cambio === null) return null;

  const esPositivo = cambio >= 0;
  return (
    <div className={`flex items-center gap-1 text-xs font-sans font-bold ${esPositivo ? "text-green-400" : "text-red-400"}`}>
      {esPositivo ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{esPositivo ? "+" : ""}{cambio}% vs mes anterior</span>
    </div>
  );
}
