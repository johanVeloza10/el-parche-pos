"use client";

import { useState, useEffect } from "react";
import { Users, Banknote, Calendar, CheckCircle, Clock } from "lucide-react";

const formatCOP = (num: number) => `$${Math.round(num).toLocaleString("es-CO")}`;

export default function CarteraClient() {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modal de Abono
  const [modalAbono, setModalAbono] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<any>(null);
  const [montoAbono, setMontoAbono] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    fetchCartera();
  }, []);

  const fetchCartera = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/cartera", { cache: "no-store" });
      if (res.ok) {
        setCuentas(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const handleAbonar = async (e: React.FormEvent) => {
    e.preventDefault();
    const abonoVal = parseInt(montoAbono.replace(/\D/g, "") || "0");
    if (abonoVal <= 0) return;

    setProcesando(true);
    try {
      const res = await fetch("/api/cartera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuentaId: cuentaSeleccionada.id,
          abono: abonoVal
        })
      });

      if (res.ok) {
        setModalAbono(false);
        setMontoAbono("");
        setCuentaSeleccionada(null);
        await fetchCartera();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Error al procesar el abono");
      }
    } catch (error) {
      console.error(error);
      alert("Error al procesar el abono");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 pb-16 h-full">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Banknote className="w-8 h-8 text-[var(--color-primary)]" /> Cuentas por Cobrar
          </h1>
          <p className="text-[var(--color-text-secondary)]">Gestión de cartera y ventas a crédito.</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-zinc-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col min-h-0">
        
        {cargando ? (
          <div className="flex flex-1 justify-center items-center">
            <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
          </div>
        ) : cuentas.length === 0 ? (
          <div className="flex flex-1 justify-center items-center flex-col gap-2 text-zinc-500">
            <CheckCircle className="w-12 h-12 text-green-500/50" />
            <p>No hay cuentas por cobrar pendientes.</p>
          </div>
        ) : (
          <div className="overflow-auto border border-zinc-800 rounded-2xl flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 sticky top-0 z-10 text-zinc-400">
                <tr>
                  <th className="p-4 font-medium uppercase text-[10px] tracking-wider">Cliente</th>
                  <th className="p-4 font-medium uppercase text-[10px] tracking-wider text-center">Estado</th>
                  <th className="p-4 font-medium uppercase text-[10px] tracking-wider text-right">Deuda Total</th>
                  <th className="p-4 font-medium uppercase text-[10px] tracking-wider text-right">Abonado</th>
                  <th className="p-4 font-medium uppercase text-[10px] tracking-wider text-right">Saldo Pendiente</th>
                  <th className="p-4 font-medium uppercase text-[10px] tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {cuentas.map(c => {
                  const totalAbonado = c.abonos;
                  
                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-zinc-500" />
                          {c.cliente?.nombre || "Desconocido"}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          {c.cliente?.tipoDocumento} {c.cliente?.numeroDocumento}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          <Clock className="w-3 h-3" /> {c.estado}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-medium">{formatCOP(c.saldoInicial)}</td>
                      <td className="p-4 text-right font-mono text-green-400">{formatCOP(totalAbonado)}</td>
                      <td className="p-4 text-right font-mono font-bold text-[var(--color-primary)]">{formatCOP(c.saldoPendiente)}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setCuentaSeleccionada(c);
                            setMontoAbono("");
                            setModalAbono(true);
                          }}
                          className="bg-[var(--color-primary)] hover:opacity-90 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Abonar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL ABONO */}
      {modalAbono && cuentaSeleccionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--color-surface-elevated)]">
              <h3 className="font-heading text-2xl font-bold text-white">Registrar Abono</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Cliente: <strong className="text-white">{cuentaSeleccionada.cliente?.nombre}</strong>
              </p>
            </div>
            
            <form onSubmit={handleAbonar} className="p-6 flex flex-col gap-6">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                <span className="text-sm text-zinc-400">Saldo Pendiente:</span>
                <span className="font-mono text-xl font-bold text-[var(--color-primary)]">
                  {formatCOP(cuentaSeleccionada.saldoPendiente)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Monto a Abonar ($ COP)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-black border border-[var(--color-surface-elevated)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[var(--color-primary)] font-mono text-xl"
                  value={montoAbono}
                  onChange={e => {
                    const val = parseInt(e.target.value.replace(/\D/g, "") || "0");
                    if (val > cuentaSeleccionada.saldoPendiente) {
                      setMontoAbono(cuentaSeleccionada.saldoPendiente.toLocaleString("es-CO"));
                    } else {
                      setMontoAbono(val === 0 ? "" : val.toLocaleString("es-CO"));
                    }
                  }}
                  placeholder="Ej: 50.000"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--color-surface-elevated)]">
                <button
                  type="button"
                  onClick={() => setModalAbono(false)}
                  className="flex-1 py-3 bg-[var(--color-surface-elevated)] hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando || !montoAbono}
                  className="flex-1 py-3 bg-[var(--color-primary)] hover:opacity-90 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {procesando ? "Procesando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
