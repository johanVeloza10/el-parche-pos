"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Smartphone, X, UserPlus, CheckCircle, AlertTriangle, Layers, RotateCcw } from "lucide-react";

export default function POSClient() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  
  const [carrito, setCarrito] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  
  const [medioPago, setMedioPago] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "MIXTO">("EFECTIVO");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  
  // Pago mixto
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTarjeta, setMontoTarjeta] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");

  // Clientes
  const [clienteQuery, setClienteQuery] = useState("");
  const [clientesResultados, setClientesResultados] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", tipoDocumento: "CC", numeroDocumento: "", email: "", telefono: "" });
  const [creandoCliente, setCreandoCliente] = useState(false);

  // Anulación
  const [modalAnular, setModalAnular] = useState(false);
  const [anularVentaId, setAnularVentaId] = useState("");
  const [anularMotivo, setAnularMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [anularMensaje, setAnularMensaje] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

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
        const filtradas = data.filter((p: any) => !carrito.some(c => c.id === p.id));
        setResultados(filtradas);
        
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

  const buscarClientes = async (q: string) => {
    setClienteQuery(q);
    if (q.length < 3) {
      setClientesResultados([]);
      return;
    }
    setBuscandoCliente(true);
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setClientesResultados(data);
      }
    } catch (error) {
      console.error("Error buscando clientes:", error);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const crearCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.numeroDocumento) return;
    setCreandoCliente(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoCliente),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClienteSeleccionado(data);
      setModalCliente(false);
      setNuevoCliente({ nombre: "", tipoDocumento: "CC", numeroDocumento: "", email: "", telefono: "" });
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setCreandoCliente(false);
    }
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return;
    
    let desglosePago = null;
    if (medioPago === "MIXTO") {
      const e = parseInt(montoEfectivo || "0");
      const t = parseInt(montoTarjeta || "0");
      const tr = parseInt(montoTransferencia || "0");
      if (e + t + tr !== total) {
        alert("En pago mixto, la suma de los montos debe ser igual al total exacto.");
        return;
      }
      desglosePago = { efectivo: e, tarjeta: t, transferencia: tr };
    }

    setProcesando(true);
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito.map(c => ({ id: c.id, descuento: c.descuento })),
          medioPago,
          desglosePago,
          clienteId: clienteSeleccionado?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.open(`/api/ventas/${data.ventaId}/ticket`, '_blank');
      
      // Reset state
      setCarrito([]);
      setModalAbierto(false);
      setEfectivoRecibido("");
      setMontoEfectivo("");
      setMontoTarjeta("");
      setMontoTransferencia("");
      setClienteSeleccionado(null);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setProcesando(false);
      inputRef.current?.focus();
    }
  };

  const anularVenta = async () => {
    if (!anularVentaId || !anularMotivo) return;
    setAnulando(true);
    setAnularMensaje("");
    try {
      const res = await fetch("/api/ventas/anular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ventaId: anularVentaId, motivo: anularMotivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnularMensaje("✅ Venta anulada exitosamente");
      setTimeout(() => {
        setModalAnular(false);
        setAnularVentaId("");
        setAnularMotivo("");
        setAnularMensaje("");
      }, 2000);
    } catch (error: any) {
      setAnularMensaje("❌ " + error.message);
    } finally {
      setAnulando(false);
    }
  };

  const subtotal = carrito.reduce((sum, item) => sum + item.precioVenta, 0);
  const totalDescuentos = carrito.reduce((sum, item) => sum + (item.descuento || 0), 0);
  const total = subtotal - totalDescuentos;
  const vueltas = (parseInt(efectivoRecibido || "0") || 0) - total;

  const sumaMixto = (parseInt(montoEfectivo || "0") || 0) + (parseInt(montoTarjeta || "0") || 0) + (parseInt(montoTransferencia || "0") || 0);
  const restanteMixto = total - sumaMixto;

  return (
    <div className="h-auto md:h-full flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-16 md:pb-0">
      
      {/* LADO IZQUIERDO: Buscador y Resultados */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-end mb-2">
          <h1 className="font-heading text-4xl font-light italic text-white tracking-wide flex items-center gap-3 select-none">
            Punto de <span className="font-bold not-italic bg-gradient-to-r from-[#FCD116] to-[#FFE700] bg-clip-text text-transparent">Venta</span>
          </h1>
          <button 
            onClick={() => setModalAnular(true)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors border border-red-500/30 bg-red-500/10 px-3 py-2 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" /> Anular Venta
          </button>
        </div>
        
        {/* Input Lector */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-[var(--color-text-muted)]" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-2xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-logo-yellow)] transition-colors shadow-sm font-sans"
            placeholder="Escanea el código de barras o busca prenda..."
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
          <div className="border-stitch-white rounded-2xl p-3 sm:p-4 shadow-lg overflow-y-auto flex-1 max-h-64 md:max-h-none">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">Resultados ({resultados.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resultados.map(prenda => (
                <div key={prenda.id} onClick={() => agregarAlCarrito(prenda)} className="flex gap-3 sm:gap-4 items-center p-2 sm:p-3 rounded-xl border border-transparent hover:border-stitch-gold cursor-pointer transition-all duration-300 bg-[var(--color-surface-elevated)]/40 hover:bg-[var(--color-surface-elevated)] hover:translate-x-0.5">
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
      <div className="w-full md:w-96 border-stitch-colombia rounded-3xl flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 bg-[var(--color-surface-elevated)]/50 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" /> Caja Actual
          </h2>
          <span className="text-sm font-bold text-[var(--color-primary)]">{carrito.length} items</span>
        </div>

        {/* Cliente Select */}
        <div className="p-4 border-b border-[var(--color-surface-elevated)] bg-black/20">
          {clienteSeleccionado ? (
            <div className="flex justify-between items-center bg-[var(--color-surface-elevated)] p-3 rounded-xl border border-[var(--color-primary)]/30">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {clienteSeleccionado.nombre}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{clienteSeleccionado.tipoDocumento} {clienteSeleccionado.numeroDocumento}</p>
              </div>
              <button onClick={() => setClienteSeleccionado(null)} className="text-red-400 p-1 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Cliente (Opcional FE)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    value={clienteQuery}
                    onChange={(e) => buscarClientes(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  {clientesResultados.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {clientesResultados.map(c => (
                        <div key={c.id} onClick={() => { setClienteSeleccionado(c); setClientesResultados([]); setClienteQuery(""); }} className="p-2 border-b border-zinc-800 hover:bg-[var(--color-surface-elevated)] cursor-pointer text-sm text-white">
                          <p className="font-bold">{c.nombre}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{c.numeroDocumento}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setModalCliente(true)} className="bg-[var(--color-surface-elevated)] hover:bg-zinc-700 text-white p-2 rounded-xl border border-zinc-700">
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 bg-[var(--color-surface)]">
          {carrito.length === 0 ? (
            <div className="text-center text-[var(--color-text-secondary)] py-10 flex flex-col items-center gap-3">
              <ShoppingCart className="w-12 h-12 text-[var(--color-surface-elevated)]" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl border-stitch-white bg-black/30">
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
            className="w-full mt-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold py-4 rounded-xl transition-all duration-300 text-lg shadow-[0_0_20px_rgba(252,209,22,0.15)] hover:shadow-[0_0_25px_rgba(252,209,22,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Cobrar ${total.toLocaleString('es-CO')}
          </button>
        </div>
      </div>

      {/* MODAL CREAR CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
          <div className="border-stitch-white bg-[var(--color-surface)] rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-heading text-xl font-bold text-white">Nuevo Cliente</h3>
              <button onClick={() => setModalCliente(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex flex-col gap-4 font-sans text-sm">
              <div>
                <label className="block text-zinc-400 mb-1">Nombre Completo *</label>
                <input type="text" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-[var(--color-primary)] outline-none" />
              </div>
              <div className="flex gap-3">
                <div className="w-1/3">
                  <label className="block text-zinc-400 mb-1">Doc *</label>
                  <select value={nuevoCliente.tipoDocumento} onChange={e => setNuevoCliente({...nuevoCliente, tipoDocumento: e.target.value})} className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-[var(--color-primary)] outline-none">
                    <option value="CC">CC</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">PAS.</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-zinc-400 mb-1">Número *</label>
                  <input type="text" value={nuevoCliente.numeroDocumento} onChange={e => setNuevoCliente({...nuevoCliente, numeroDocumento: e.target.value})} className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-[var(--color-primary)] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Email</label>
                <input type="email" value={nuevoCliente.email} onChange={e => setNuevoCliente({...nuevoCliente, email: e.target.value})} className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-[var(--color-primary)] outline-none" />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Teléfono</label>
                <input type="text" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-[var(--color-primary)] outline-none" />
              </div>
              <button 
                onClick={crearCliente}
                disabled={creandoCliente || !nuevoCliente.nombre || !nuevoCliente.numeroDocumento}
                className="w-full mt-2 bg-white text-black font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {creandoCliente ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANULAR VENTA */}
      {modalAnular && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
          <div className="border-stitch-colombia bg-[var(--color-surface)] rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/> Anular Venta</h3>
              <button onClick={() => setModalAnular(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            {anularMensaje ? (
              <div className="text-center py-6 text-white font-bold">{anularMensaje}</div>
            ) : (
              <div className="flex flex-col gap-4 font-sans text-sm">
                <p className="text-zinc-400 text-xs">Esta acción regresará las prendas a vitrina y descontará el dinero de la caja actual.</p>
                <div>
                  <label className="block text-zinc-400 mb-1">ID de Venta (o Ticket)</label>
                  <input type="text" placeholder="Ej: cmr4hg..." value={anularVentaId} onChange={e => setAnularVentaId(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Motivo de Anulación</label>
                  <textarea rows={2} value={anularMotivo} onChange={e => setAnularMotivo(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-red-500 outline-none resize-none" />
                </div>
                <button 
                  onClick={anularVenta}
                  disabled={anulando || !anularVentaId || !anularMotivo}
                  className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {anulando ? "Anulando..." : "Confirmar Anulación"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE PAGO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="border-stitch-gold rounded-3xl w-full max-w-md overflow-hidden shadow-2xl bg-[var(--color-surface)]">
            <div className="p-4 sm:p-6 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Finalizar Venta</h2>
              <button onClick={() => setModalAbierto(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div>
                <p className="text-center text-[var(--color-text-secondary)] mb-1 font-sans text-xs uppercase tracking-wider">Total a cobrar</p>
                <p className="text-center text-4xl font-heading font-bold text-[var(--color-primary)]">${total.toLocaleString('es-CO')}</p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setMedioPago("EFECTIVO")}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${medioPago === 'EFECTIVO' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-white/20'}`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Efectivo</span>
                </button>
                <button 
                  onClick={() => setMedioPago("TARJETA")}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${medioPago === 'TARJETA' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-white/20'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Tarjeta</span>
                </button>
                <button 
                  onClick={() => setMedioPago("TRANSFERENCIA")}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${medioPago === 'TRANSFERENCIA' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-white/20'}`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Nequi</span>
                </button>
                <button 
                  onClick={() => setMedioPago("MIXTO")}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${medioPago === 'MIXTO' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-white/20'}`}
                >
                  <Layers className="w-6 h-6" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Mixto</span>
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

              {medioPago === "MIXTO" && (
                <div className="bg-black/30 p-3 sm:p-5 rounded-2xl border border-[var(--color-surface-elevated)] flex flex-col gap-3">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">Distribuye el pago. Faltan <span className="font-bold text-white">${restanteMixto.toLocaleString('es-CO')}</span></p>
                  
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-zinc-500" />
                    <input type="number" placeholder="Efectivo" value={montoEfectivo} onChange={e => setMontoEfectivo(e.target.value)} className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[var(--color-primary)] text-right" />
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-zinc-500" />
                    <input type="number" placeholder="Tarjeta" value={montoTarjeta} onChange={e => setMontoTarjeta(e.target.value)} className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[var(--color-primary)] text-right" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-zinc-500" />
                    <input type="number" placeholder="Nequi/Tx" value={montoTransferencia} onChange={e => setMontoTransferencia(e.target.value)} className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[var(--color-primary)] text-right" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)]">
              <button 
                disabled={
                  procesando || 
                  (medioPago === 'EFECTIVO' && vueltas < 0 && efectivoRecibido !== '') ||
                  (medioPago === 'MIXTO' && restanteMixto !== 0)
                }
                onClick={procesarVenta}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold py-4 rounded-xl transition-all duration-300 text-lg flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(252,209,22,0.15)]"
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
