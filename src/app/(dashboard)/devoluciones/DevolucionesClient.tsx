"use client";

import { useState } from "react";
import { Search, RotateCcw, AlertTriangle, CheckCircle, Ticket } from "lucide-react";

export default function DevolucionesClient() {
  const [ventaIdQuery, setVentaIdQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [ventaResult, setVentaResult] = useState<any>(null);
  const [error, setError] = useState("");

  const [procesando, setProcesando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [tipo, setTipo] = useState("CAMBIO"); // CAMBIO | DEVOLUCION

  const buscarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventaIdQuery) return;
    setBuscando(true);
    setError("");
    setVentaResult(null);

    try {
      const res = await fetch(`/api/ventas/${ventaIdQuery}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Venta no encontrada");
      setVentaResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  };

  const procesarDevolucion = async (prendaId: string) => {
    if (!motivo) {
      alert("Debes ingresar un motivo para la devolución/cambio.");
      return;
    }
    if (!confirm(`¿Estás seguro de procesar este ${tipo.toLowerCase()}? La prenda volverá a vitrina.`)) return;

    setProcesando(true);
    try {
      const res = await fetch("/api/devoluciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ventaId: ventaResult.id,
          prendaId,
          motivo,
          tipo
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ Nota de crédito generada exitosamente por ${tipo}.`);
      
      // En un caso ideal aquí se podría abrir un pdf de la nota de crédito
      // window.open(`/api/devoluciones/${data.notaCredito.id}/pdf`, '_blank');
      
      setVentaResult(null);
      setVentaIdQuery("");
      setMotivo("");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const formatCOP = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="font-heading text-4xl font-bold text-white mb-2 flex items-center gap-3">
          Devoluciones y <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent italic">Cambios</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">Busca la venta original para devolver una prenda a vitrina y generar una nota de crédito.</p>
      </div>

      <div className="border-stitch-white p-6 rounded-3xl bg-black/30">
        <form onSubmit={buscarVenta} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold text-zinc-400 mb-2">ID de la Venta (Aparece en el recibo)</label>
            <input 
              type="text" 
              value={ventaIdQuery} 
              onChange={e => setVentaIdQuery(e.target.value)}
              placeholder="Ej: cm4t..."
              className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white focus:border-[var(--color-primary)] outline-none font-mono"
            />
          </div>
          <button 
            type="submit" 
            disabled={buscando || !ventaIdQuery}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl transition-all h-[50px] flex items-center gap-2"
          >
            {buscando ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <Search className="w-5 h-5"/>}
            Buscar
          </button>
        </form>
        {error && <p className="text-red-400 mt-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {error}</p>}
      </div>

      {ventaResult && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xl text-white">Detalles de la Venta</h2>
          <div className="border-stitch-gold p-6 rounded-3xl bg-[var(--color-surface)]">
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-[var(--color-text-secondary)]">
              <div><span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Cliente</span><span className="text-white font-bold">{ventaResult.cliente?.nombre || "Consumidor Final"}</span></div>
              <div><span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Fecha</span><span className="text-white font-bold">{new Date(ventaResult.fechaHora).toLocaleString('es-CO')}</span></div>
              <div><span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Total Venta</span><span className="text-white font-bold">{formatCOP(ventaResult.total)}</span></div>
              <div><span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Estado</span>
                {ventaResult.anulada ? <span className="text-red-400 font-bold">ANULADA</span> : <span className="text-green-400 font-bold">VIGENTE</span>}
              </div>
            </div>

            <h3 className="font-bold text-white mb-4">Items comprados:</h3>
            <div className="flex flex-col gap-4">
              {ventaResult.items.map((item: any) => (
                <div key={item.prendaId} className="bg-black/30 p-4 rounded-2xl border border-[var(--color-surface-elevated)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="font-bold text-white">{item.prenda.descripcion}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">Ref: {item.prenda.codigo} | Valor: {formatCOP(item.precioVenta - item.descuentoItem)}</p>
                  </div>
                  
                  {item.prenda.estado === "VENDIDA" && !ventaResult.anulada ? (
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <select value={tipo} onChange={e => setTipo(e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm">
                        <option value="CAMBIO">Es un Cambio</option>
                        <option value="DEVOLUCION">Es Devolución</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Motivo..." 
                        value={motivo} 
                        onChange={e => setMotivo(e.target.value)}
                        className="bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm"
                      />
                      <button 
                        onClick={() => procesarDevolucion(item.prendaId)}
                        disabled={procesando || !motivo}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4"/> Procesar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-orange-400 border border-orange-500/30 bg-orange-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      Ya devuelta / No disponible
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
