"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Banknote,
  CreditCard,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface CajaData {
  id: string;
  fecha: string;
  estado: string;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  fondoInicial: number;
  gastosEfectivo: number;
  abonosApartados: number;
  totalVentasSistema: number;
  efectivoContado: number | null;
  diferencia: number | null;
  observacion: string | null;
  _count?: { ventas: number };
  usuario?: { nombre: string } | null;
}

const formatCOP = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

export default function CajaDiariaClient() {
  const [caja, setCaja] = useState<CajaData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abriendo, setAbriendo] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [efectivoContado, setEfectivoContado] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");
  const [fondoInicial, setFondoInicial] = useState("");
  
  // Nuevo Gasto
  const [modalGasto, setModalGasto] = useState(false);
  const [gastoConcepto, setGastoConcepto] = useState("");
  const [gastoMonto, setGastoMonto] = useState("");
  const [guardandoGasto, setGuardandoGasto] = useState(false);

  const fetchCaja = async () => {
    try {
      const res = await fetch("/api/caja", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCaja(data.caja || null);
      }
    } catch (err) {
      console.error("Error cargando caja:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchCaja();
  }, []);

  const abrirCaja = async () => {
    setAbriendo(true);
    setError("");
    try {
      const res = await fetch("/api/caja", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fondoInicial: parseInt(fondoInicial || "0") })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCaja(data.caja);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAbriendo(false);
    }
  };

  const registrarGasto = async () => {
    if (!gastoConcepto || !gastoMonto) return;
    setGuardandoGasto(true);
    try {
      const res = await fetch("/api/caja/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concepto: gastoConcepto, monto: gastoMonto })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setModalGasto(false);
      setGastoConcepto("");
      setGastoMonto("");
      fetchCaja(); // recargar
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGuardandoGasto(false);
    }
  };

  const cerrarCaja = async () => {
    if (!efectivoContado) {
      setError("Debes contar el efectivo de la caja para cerrarla");
      return;
    }
    setCerrando(true);
    setError("");
    try {
      const res = await fetch("/api/caja", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          efectivoContado: parseInt(efectivoContado),
          observacion: observacion || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCaja(data.caja);
      setMostrarCierre(false);
      setEfectivoContado("");
      setObservacion("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCerrando(false);
    }
  };

  const cajaEsperada = caja
    ? caja.fondoInicial + caja.ventasEfectivo + caja.abonosApartados - caja.gastosEfectivo
    : 0;

  const diferencia = efectivoContado
    ? parseInt(efectivoContado) - cajaEsperada
    : null;

  if (cargando) {
    return (
      <div className="flex h-96 justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
          <p className="font-heading text-lg text-[var(--color-text-secondary)] italic">
            Consultando caja...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-3xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="font-heading text-4xl font-light italic text-white tracking-wide flex items-center gap-3 select-none">
          Caja{" "}
          <span className="font-bold not-italic bg-gradient-to-r from-[#FCD116] to-[#FFE700] bg-clip-text text-transparent">
            Diaria
          </span>
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1 font-sans">
          Abre la caja al iniciar el día, y ciérrala al finalizar con el arqueo de efectivo.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm font-sans flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* ============================================================ */}
      {/* NO HAY CAJA ABIERTA */}
      {/* ============================================================ */}
      {!caja || caja.estado === "CERRADA" ? (
        <div className="border-stitch-colombia rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
            <Lock className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">
              La caja está cerrada
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm font-sans max-w-md">
              Abre la caja para comenzar a registrar ventas del día. Todas las
              ventas que hagas se asociarán automáticamente a esta caja.
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2 font-sans text-left">
              Fondo Inicial (Sencillo para cambios)
            </label>
            <input
              type="number"
              value={fondoInicial}
              onChange={(e) => setFondoInicial(e.target.value)}
              placeholder="Ej: 200000"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-3 px-4 text-white text-xl font-sans focus:outline-none focus:border-[var(--color-primary)] text-center mb-4"
            />
          </div>
          <button
            onClick={abrirCaja}
            disabled={abriendo}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-[0_0_20px_rgba(252,209,22,0.15)] hover:shadow-[0_0_25px_rgba(252,209,22,0.3)] disabled:opacity-40 flex items-center gap-2"
          >
            {abriendo ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
            {abriendo ? "Abriendo..." : "Abrir Caja del Día"}
          </button>

          {/* Mostrar última caja cerrada si existe */}
          {caja && caja.estado === "CERRADA" && (
            <div className="border-stitch-white rounded-2xl p-5 w-full max-w-md text-left mt-4">
              <h4 className="font-heading text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                Último cierre
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                <div>
                  <p className="text-[var(--color-text-muted)] text-xs">Ventas del día</p>
                  <p className="text-white font-bold">{formatCOP(caja.totalVentasSistema)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] text-xs">Diferencia</p>
                  <p
                    className={`font-bold ${
                      (caja.diferencia || 0) === 0
                        ? "text-green-400"
                        : (caja.diferencia || 0) > 0
                          ? "text-blue-400"
                          : "text-red-400"
                    }`}
                  >
                    {formatCOP(caja.diferencia || 0)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => window.open(`/api/caja/${caja.id}/pdf`, '_blank')}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-zinc-700"
                >
                  Imprimir Arqueo
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `*Cierre de Caja - El Parche*\n` +
                    `Fecha: ${new Date(caja.fecha).toLocaleDateString("es-CO")}\n` +
                    `Cajero: ${caja.usuario?.nombre || "N/A"}\n` +
                    `---------------------------------\n` +
                    `• Ventas Totales: ${formatCOP(caja.totalVentasSistema)}\n` +
                    `  - Efectivo: ${formatCOP(caja.ventasEfectivo)}\n` +
                    `  - Tarjeta: ${formatCOP(caja.ventasTarjeta)}\n` +
                    `  - Transferencias: ${formatCOP(caja.ventasTransferencia)}\n` +
                    `• Fondo Inicial: ${formatCOP(caja.fondoInicial)}\n` +
                    `• Abonos Apartados: ${formatCOP(caja.abonosApartados)}\n` +
                    `• Gastos Efectivo: ${formatCOP(caja.gastosEfectivo)}\n` +
                    `---------------------------------\n` +
                    `• Efectivo Esperado: ${formatCOP(caja.fondoInicial + caja.ventasEfectivo + caja.abonosApartados - caja.gastosEfectivo)}\n` +
                    `• Efectivo Contado: ${formatCOP(caja.efectivoContado || 0)}\n` +
                    `• Diferencia: ${formatCOP(caja.diferencia || 0)}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-green-700 flex justify-center items-center gap-1.5"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* CAJA ABIERTA */
        /* ============================================================ */
        <div className="flex flex-col gap-6">
          {/* Estado de la caja */}
          <div className="border-stitch-gold rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-white">Caja Abierta</h2>
                  <p className="text-xs text-[var(--color-text-secondary)] font-sans">
                    {new Date(caja.fecha).toLocaleDateString("es-CO", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-sans border border-green-500/30">
                Activa
              </span>
            </div>

            {/* Totales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <TotalCard
                icon={<Banknote className="w-5 h-5" />}
                label="Efectivo"
                valor={caja.ventasEfectivo}
                color="text-green-400"
              />
              <TotalCard
                icon={<CreditCard className="w-5 h-5" />}
                label="Tarjeta"
                valor={caja.ventasTarjeta}
                color="text-blue-400"
              />
              <TotalCard
                icon={<Smartphone className="w-5 h-5" />}
                label="Nequi/Tx"
                valor={caja.ventasTransferencia}
                color="text-purple-400"
              />
              <TotalCard
                icon={<CheckCircle className="w-5 h-5" />}
                label="Total Ventas"
                valor={caja.totalVentasSistema}
                color="text-[var(--color-primary)]"
                bold
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <TotalCard
                icon={<Banknote className="w-5 h-5" />}
                label="Fondo Inicial"
                valor={caja.fondoInicial}
                color="text-zinc-400"
              />
              <TotalCard
                icon={<Banknote className="w-5 h-5" />}
                label="Abonos (Aptdos)"
                valor={caja.abonosApartados}
                color="text-orange-400"
              />
              <TotalCard
                icon={<Banknote className="w-5 h-5" />}
                label="Gastos Día"
                valor={caja.gastosEfectivo}
                color="text-red-400"
              />
              <div className="bg-[var(--color-surface-elevated)]/30 rounded-2xl p-4 flex flex-col justify-center border border-[var(--color-primary)]/30 shadow-[0_0_15px_rgba(252,209,22,0.05)]">
                <span className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-bold mb-1">
                  Efectivo Esperado
                </span>
                <span className="font-heading text-xl font-bold text-white">
                  {formatCOP(cajaEsperada)}
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-[var(--color-text-muted)] font-sans">
              {caja._count?.ventas || 0} venta(s) registrada(s) en esta caja
            </p>
          </div>

          {/* Botón de gastos */}
          <button
            onClick={() => setModalGasto(true)}
            className="w-full border-stitch-white rounded-2xl py-4 text-white font-bold transition-all duration-300 flex justify-center items-center gap-2 hover:bg-[var(--color-surface-elevated)]"
          >
            Registrar Gasto en Efectivo
          </button>

          {/* Botón de cerrar caja */}
          {!mostrarCierre ? (
            <button
              onClick={() => setMostrarCierre(true)}
              className="w-full border-stitch-colombia rounded-2xl py-4 text-white font-bold transition-all duration-300 flex justify-center items-center gap-2 hover:shadow-[0_0_15px_rgba(206,17,38,0.1)]"
            >
              <Lock className="w-5 h-5 text-[var(--color-colombia-red)]" />
              Cerrar Caja y Hacer Arqueo
            </button>
          ) : (
            /* Panel de cierre / arqueo */
            <div className="border-stitch-colombia rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
              <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-[var(--color-colombia-red)]" /> Cierre de Caja
              </h3>

              <div className="bg-[var(--color-surface-elevated)]/30 p-4 rounded-2xl border border-[var(--color-primary)]/30">
                <p className="text-xs text-[var(--color-text-secondary)] font-sans mb-1">
                  Efectivo total que deberías tener en caja (Fondo + Efectivo + Abonos - Gastos):
                </p>
                <p className="font-heading text-3xl font-bold text-[var(--color-primary)]">
                  {formatCOP(cajaEsperada)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 font-sans">
                  ¿Cuánto efectivo contaste? *
                </label>
                <input
                  type="number"
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(e.target.value)}
                  placeholder="Ej: 450000"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-3 px-4 text-white text-xl font-sans focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-right"
                />
              </div>

              {diferencia !== null && (
                <div
                  className={`p-4 rounded-2xl border ${
                    diferencia === 0
                      ? "bg-green-500/10 border-green-500/30"
                      : diferencia > 0
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <p className="text-xs text-[var(--color-text-secondary)] font-sans mb-1">
                    Diferencia:
                  </p>
                  <p
                    className={`font-heading text-2xl font-bold ${
                      diferencia === 0
                        ? "text-green-400"
                        : diferencia > 0
                          ? "text-blue-400"
                          : "text-red-400"
                    }`}
                  >
                    {diferencia === 0
                      ? "✅ Cuadra perfecto"
                      : diferencia > 0
                        ? `↑ Sobrante de ${formatCOP(diferencia)}`
                        : `↓ Faltante de ${formatCOP(Math.abs(diferencia))}`}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-white mb-2 font-sans">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej: Se le dio cambio de $5.000 a un cliente sin registrar"
                  rows={2}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarCierre(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-white font-bold text-sm hover:bg-[var(--color-surface-elevated)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={cerrarCaja}
                  disabled={cerrando || !efectivoContado}
                  className="flex-1 bg-[var(--color-colombia-red)] hover:bg-red-700 text-white font-extrabold py-3 rounded-xl transition-all duration-300 text-sm disabled:opacity-40 flex justify-center items-center gap-2"
                >
                  {cerrando ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {cerrando ? "Cerrando..." : "Confirmar Cierre"}
                </button>
              </div>
            </div>
          )}
        {/* MODAL DE GASTO */}
        {modalGasto && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
            <div className="border-stitch-white bg-[var(--color-surface)] rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-xl font-bold text-white">Registrar Gasto</h3>
                <button onClick={() => setModalGasto(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
              <div className="flex flex-col gap-4 font-sans text-sm">
                <div>
                  <label className="block text-zinc-400 mb-1">Concepto *</label>
                  <input type="text" value={gastoConcepto} onChange={e => setGastoConcepto(e.target.value)} placeholder="Ej: Compra de bolsas, pasajes..." className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Valor en Efectivo *</label>
                  <input type="number" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} placeholder="Ej: 15000" className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-[var(--color-primary)] outline-none" />
                </div>
                <button 
                  onClick={registrarGasto}
                  disabled={guardandoGasto || !gastoConcepto || !gastoMonto}
                  className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold py-3 rounded-xl mt-2 transition-all disabled:opacity-40"
                >
                  {guardandoGasto ? "Guardando..." : "Guardar Gasto"}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}

// Sub-component for total cards
function TotalCard({
  icon,
  label,
  valor,
  color,
  bold,
}: {
  icon: React.ReactNode;
  label: string;
  valor: number;
  color: string;
  bold?: boolean;
}) {
  return (
    <div className="bg-[var(--color-surface-elevated)]/30 p-3 sm:p-4 rounded-2xl flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 text-xs ${color}`}>
        {icon}
        <span className="font-sans font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`font-heading text-lg sm:text-xl ${bold ? "font-bold" : ""} text-white`}>
        {formatCOP(valor)}
      </p>
    </div>
  );
}
