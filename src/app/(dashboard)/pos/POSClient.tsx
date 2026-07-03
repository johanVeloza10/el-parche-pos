"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Smartphone, X } from "lucide-react";

export default function POSClient() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [medioPago, setMedioPago] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA">("EFECTIVO");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [procesando, setProcesando] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus al input principal para el lector de código de barras
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buscarPrendas = async (q: string) => {
    setQuery(q);
    if (q.length < 3) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(`/api/prendas/buscar?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        // Filtrar las que ya están en el carrito
        const filtradas = data.filter((p: any) => !carrito.some(c => c.id === p.id));
        setResultados(filtradas);
        
        // Si el lector lee un código de barras exacto y hay 1 resultado, agregarlo directo
        if (filtradas.length === 1 && (filtradas[0].codigoBarras === q || filtradas[0].codigo === q)) {
          agregarAlCarrito(filtradas[0]);
          setQuery("");
          setResultados([]);
        }
      }
    } catch (error) {
      console.error("Error buscando:", error);
    } finally {
      setBuscando(false);
    }
  };

  const agregarAlCarrito = (prenda: any) => {
    setCarrito([...carrito, { ...prenda, descuento: 0 }]);
    setQuery("");
    setResultados([]);
    inputRef.current?.focus();
  };

  const quitarDelCarrito = (id: string) => {
    setCarrito(carrito.filter(c => c.id !== id));
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return;
    setProcesando(true);
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito.map(c => ({ id: c.id, descuento: c.descuento })),
          medioPago,
          desglosePago: null,
          clienteId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.open(`/api/ventas/${data.ventaId}/ticket`, '_blank');
      setCarrito([]);
      setModalAbierto(false);
      setEfectivoRecibido("");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setProcesando(false);
      inputRef.current?.focus();
    }
  };

  const subtotal = carrito.reduce((sum, item) => sum + item.precioVenta, 0);
  const totalDescuentos = carrito.reduce((sum, item) => sum + (item.descuento || 0), 0);
  const total = subtotal - totalDescuentos;

  const vueltas = (parseInt(efectivoRecibido || "0") || 0) - total;

  return (
    <div className="h-auto md:h-full flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-7xl mx-auto">
      
      {/* LADO IZQUIERDO: Buscador y Resultados */}
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-white mb-2">Punto de Venta</h1>
        
        {/* Input Lector */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-[var(--color-text-muted)]" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-2xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-sm"
            placeholder="Escanea el código de barras o busca por nombre..."
            value={query}
            onChange={(e) => buscarPrendas(e.target.value)}
          />
          {buscando && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="animate-spin h-5 w-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Resultados Búsqueda */}
        {resultados.length > 0 && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-2xl p-3 sm:p-4 shadow-lg overflow-y-auto flex-1 max-h-64 md:max-h-none">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">Resultados ({resultados.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resultados.map(prenda => (
                <div key={prenda.id} onClick={() => agregarAlCarrito(prenda)} className="flex gap-3 sm:gap-4 items-center p-2 sm:p-3 rounded-xl border border-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] cursor-pointer transition-colors bg-[var(--color-surface-elevated)]/30 hover:bg-[var(--color-surface-elevated)]">
                  <div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs text-[var(--color-text-muted)]">Foto</span>
                  </div>
                  <div>
                    <p className="font-medium text-white line-clamp-1">{prenda.descripcion}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{prenda.codigo}</p>
                    <p className="font-semibold text-[var(--color-primary)] mt-1">${prenda.precioVenta.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LADO DERECHO: Carrito */}
      <div className="w-full md:w-96 bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 bg-[var(--color-surface-elevated)]/50 border-b border-[var(--color-surface-elevated)]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" /> Caja Actual
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
          {carrito.length === 0 ? (
            <div className="text-center text-[var(--color-text-secondary)] py-10 flex flex-col items-center gap-3">
              <ShoppingCart className="w-12 h-12 text-[var(--color-surface-elevated)]" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl border border-[var(--color-surface-elevated)] bg-black/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{item.descripcion}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{item.codigo}</p>
                  </div>
                  <button onClick={() => quitarDelCarrito(item.id)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">Precio</span>
                  <span className="font-medium text-white">${item.precioVenta.toLocaleString('es-CO')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 sm:p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)] flex flex-col gap-2 sm:gap-3">
          <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          {totalDescuentos > 0 && (
            <div className="flex justify-between text-sm text-[var(--color-primary)]">
              <span>Descuentos</span>
              <span>-${totalDescuentos.toLocaleString('es-CO')}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-white mt-2 pt-2 border-t border-[var(--color-surface-elevated)]">
            <span>Total</span>
            <span>${total.toLocaleString('es-CO')}</span>
          </div>
          
          <button 
            disabled={carrito.length === 0}
            onClick={() => setModalAbierto(true)}
            className="w-full mt-4 bg-[var(--color-primary)] hover:bg-[#9E3A5A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg"
          >
            Cobrar ${total.toLocaleString('es-CO')}
          </button>
        </div>
      </div>

      {/* MODAL DE PAGO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Finalizar Venta</h2>
              <button onClick={() => setModalAbierto(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div>
                <p className="text-center text-[var(--color-text-secondary)] mb-1">Total a cobrar</p>
                <p className="text-center text-4xl font-black text-white">${total.toLocaleString('es-CO')}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setMedioPago("EFECTIVO")}
                  className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-xl border-2 transition-all ${medioPago === 'EFECTIVO' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-white/20 hover:text-white'}`}
                >
                  <Banknote className="w-8 h-8" />
                  <span className="text-sm font-medium">Efectivo</span>
                </button>
                <button 
                  onClick={() => setMedioPago("TARJETA")}
                  className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-xl border-2 transition-all ${medioPago === 'TARJETA' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-white/20 hover:text-white'}`}
                >
                  <CreditCard className="w-8 h-8" />
                  <span className="text-sm font-medium">Tarjeta</span>
                </button>
                <button 
                  onClick={() => setMedioPago("TRANSFERENCIA")}
                  className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-xl border-2 transition-all ${medioPago === 'TRANSFERENCIA' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-white/20 hover:text-white'}`}
                >
                  <Smartphone className="w-8 h-8" />
                  <span className="text-sm font-medium">Nequi/Tx</span>
                </button>
              </div>

              {medioPago === "EFECTIVO" && (
                <div className="bg-black/30 p-3 sm:p-5 rounded-2xl border border-[var(--color-surface-elevated)]">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Efectivo Recibido</label>
                  <input
                    type="number"
                    value={efectivoRecibido}
                    onChange={(e) => setEfectivoRecibido(e.target.value)}
                    placeholder={total.toString()}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-3 px-4 text-white text-xl focus:outline-none focus:border-[var(--color-primary)] text-right"
                  />
                  
                  {vueltas > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-surface-elevated)] flex justify-between items-center text-green-400">
                      <span className="font-medium">Cambio (Vueltas):</span>
                      <span className="text-2xl font-bold">${vueltas.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)]">
              <button 
                disabled={procesando || (medioPago === 'EFECTIVO' && vueltas < 0 && efectivoRecibido !== '')}
                onClick={procesarVenta}
                className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-xl transition-colors text-lg flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {procesando ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                    Procesando...
                  </>
                ) : (
                  'Confirmar Pago'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
