"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  Landmark, 
  FileText, 
  ChevronRight, 
  Printer, 
  X, 
  CheckSquare, 
  AlertCircle,
  Percent,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check,
  Building
} from "lucide-react";

interface Proveedor {
  id: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string | null;
  email: string | null;
  datosBancarios: string | null;
  comisionDefaultPct: number;
  modoComisionDefault: string;
  plazoMaxVitrinaDias: number;
  responsableIva: boolean;
  emiteFactura: boolean;
  notas: string | null;
  activo: boolean;
  prendasEnVitrina: number;
  prendasVendidasSinLiquidar: number;
  saldoPorPagar: number;
}

const formatCOP = (num: number) => `$${Math.round(num).toLocaleString("es-CO")}`;

export default function ProveedoresClient() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevoProv, setModalNuevoProv] = useState(false);
  const [provSeleccionado, setProvSeleccionado] = useState<Proveedor | null>(null);
  
  // Formulario nuevo proveedor
  const [nombre, setNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CC");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [datosBancarios, setDatosBancarios] = useState("");
  const [comisionDefaultPct, setComisionDefaultPct] = useState("30");
  const [modoComisionDefault, setModoComisionDefault] = useState("PORCENTAJE");
  const [plazoMaxVitrinaDias, setPlazoMaxVitrinaDias] = useState("90");
  const [responsableIva, setResponsableIva] = useState(false);
  const [emiteFactura, setEmiteFactura] = useState(false);
  const [notas, setNotas] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [creando, setCreando] = useState(false);

  // Formulario de liquidación
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [procesandoLiquidacion, setProcesandoLiquidacion] = useState(false);
  const [ultimaLiquidacionCreada, setUltimaLiquidacionCreada] = useState<any>(null);
  const [historialLiquidaciones, setHistorialLiquidaciones] = useState<any[]>([]);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/proveedores");
      if (res.ok) {
        const data = await res.json();
        setProveedores(data);
        if (provSeleccionado) {
          const actualizado = data.find((p: any) => p.id === provSeleccionado.id);
          setProvSeleccionado(actualizado || null);
        }
      }
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    } finally {
      setCargando(false);
    }
  };

  const fetchHistorialLiquidaciones = async (proveedorId: string) => {
    try {
      const res = await fetch(`/api/liquidaciones?proveedorId=${proveedorId}`);
      if (res.ok) {
        const data = await res.json();
        setHistorialLiquidaciones(data);
      }
    } catch (error) {
      console.error("Error historial liquidaciones:", error);
    }
  };

  const handleSeleccionarProveedor = (p: Proveedor) => {
    setProvSeleccionado(p);
    setUltimaLiquidacionCreada(null);
    fetchHistorialLiquidaciones(p.id);
    
    // Configurar fechas automáticas (del 1 al actual del mes en curso)
    const hoy = new Date();
    const primeroMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaInicio(primeroMes.toISOString().split("T")[0]);
    setFechaFin(hoy.toISOString().split("T")[0]);
  };

  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setErrorForm("");
    try {
      const res = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          tipoDocumento,
          numeroDocumento,
          telefono,
          email,
          datosBancarios,
          comisionDefaultPct,
          modoComisionDefault,
          plazoMaxVitrinaDias,
          responsableIva,
          emiteFactura,
          notas
        })
      });

      if (res.ok) {
        setModalNuevoProv(false);
        // Limpiar
        setNombre("");
        setNumeroDocumento("");
        setTelefono("");
        setEmail("");
        setDatosBancarios("");
        setComisionDefaultPct("30");
        setPlazoMaxVitrinaDias("90");
        setResponsableIva(false);
        setEmiteFactura(false);
        setNotas("");
        
        fetchProveedores();
      } else {
        const data = await res.json();
        setErrorForm(data.error || "Error creando proveedor");
      }
    } catch (err: any) {
      setErrorForm(err.message || "Error de red");
    } finally {
      setCreando(false);
    }
  };

  const handleGenerarLiquidacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provSeleccionado) return;
    setProcesandoLiquidacion(true);
    try {
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorId: provSeleccionado.id,
          periodoInicio: new Date(fechaInicio).toISOString(),
          periodoFin: new Date(fechaFin).toISOString(),
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUltimaLiquidacionCreada(data);
        fetchProveedores();
        fetchHistorialLiquidaciones(provSeleccionado.id);
      } else {
        alert("Error al liquidar: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcesandoLiquidacion(false);
    }
  };

  const handleRegistrarPago = async (id: string) => {
    if (!confirm("¿Deseas marcar esta liquidación como PAGADA? Se asumirá que realizaste la transferencia bancaria.")) return;
    try {
      const res = await fetch(`/api/liquidaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "PAGADA" })
      });
      if (res.ok) {
        if (provSeleccionado) {
          fetchProveedores();
          fetchHistorialLiquidaciones(provSeleccionado.id);
        }
        setUltimaLiquidacionCreada(null);
      }
    } catch (err: any) {
      alert("Error pagando: " + err.message);
    }
  };

  const getSemaforoColor = (saldo: number) => {
    if (saldo === 0) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (saldo > 0 && saldo <= 200000) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-4xl font-light italic text-white tracking-wide flex items-center gap-3 select-none">
            Proveedores y{" "}
            <span className="font-bold not-italic bg-gradient-to-r from-[#FCD116] to-[#FFE700] bg-clip-text text-transparent">
              Diseñadores
            </span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 font-sans">
            Manejo de diseñadores en consignación, tasas de comisión, información tributaria para la DIAN y soportes de pago.
          </p>
        </div>
        
        <button 
          onClick={() => setModalNuevoProv(true)}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold px-6 py-3 rounded-xl transition-all duration-300 text-sm shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Registrar Proveedor
        </button>
      </div>

      {/* BODY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LISTADO DE PROVEEDORES */}
        <div className="lg:col-span-2 border-stitch-colombia rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-4 bg-[var(--color-surface)]">
          <h3 className="font-heading text-xl font-bold text-white border-b border-zinc-800 pb-3">
            Lista de Diseñadores / Aliados
          </h3>
          
          {cargando ? (
            <div className="py-24 flex flex-col justify-center items-center gap-4">
              <div className="animate-spin h-10 w-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
              <p className="font-heading text-lg text-[var(--color-text-secondary)] italic">Cargando aliados...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
              {proveedores.map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleSeleccionarProveedor(p)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${provSeleccionado?.id === p.id ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/50' : 'bg-[var(--color-surface-elevated)]/20 border-zinc-800 hover:border-white/10'}`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base font-sans">{p.nombre}</h4>
                      {p.responsableIva ? (
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">IVA</span>
                      ) : (
                        <span className="text-[9px] bg-zinc-500/10 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-full font-bold">R-SIMPLE</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] font-mono">{p.tipoDocumento}: {p.numeroDocumento}</p>
                    <div className="flex gap-4 text-xs text-[var(--color-text-muted)] mt-1.5 font-sans">
                      <span>📦 Vitrina: <strong className="text-white">{p.prendasEnVitrina}</strong></span>
                      <span>💸 Por liquidar: <strong className="text-white">{p.prendasVendidasSinLiquidar}</strong></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 sm:mt-0 justify-between">
                    <div className="text-right">
                      <p className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider font-sans">Saldo Acumulado</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-mono font-bold mt-1 border ${getSemaforoColor(p.saldoPorPagar)}`}>
                        {formatCOP(p.saldoPorPagar)}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETALLE Y LIQUIDACIÓN (DERECHA) */}
        <div className="flex flex-col gap-6">
          {provSeleccionado ? (
            <div className="border-stitch-gold rounded-3xl p-6 shadow-xl flex flex-col gap-6 bg-[var(--color-surface)]">
              
              {/* HEADER FICHA */}
              <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-white leading-tight">{provSeleccionado.nombre}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="inline-flex items-center rounded-lg bg-[var(--color-secondary)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-wide">
                      Comisión: {provSeleccionado.comisionDefaultPct}%
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                      Plazo: {provSeleccionado.plazoMaxVitrinaDias}d
                    </span>
                  </div>
                </div>
                <button onClick={() => setProvSeleccionado(null)} className="text-[var(--color-text-muted)] hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TRIBUTARIO DIAN */}
              <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Declaración IVA</span>
                  <p className="font-bold text-white">
                    {provSeleccionado.responsableIva ? "✅ Responsable IVA" : "❌ No responsable"}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Factura Legal</span>
                  <p className="font-bold text-white">
                    {provSeleccionado.emiteFactura ? "📄 Requiere Facturar" : "🧾 Cuenta de Cobro"}
                  </p>
                </div>
              </div>

              {/* DATOS DE CONTACTO */}
              <div className="flex flex-col gap-3 text-xs text-zinc-300 font-sans border-b border-zinc-800 pb-4">
                {provSeleccionado.telefono && (
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-zinc-500" /> {provSeleccionado.telefono}</p>
                )}
                {provSeleccionado.email && (
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-zinc-500" /> {provSeleccionado.email}</p>
                )}
                {provSeleccionado.datosBancarios && (
                  <div className="bg-black/25 p-3 rounded-xl border border-zinc-800 mt-1">
                    <p className="text-[10px] text-[var(--color-text-muted)] font-bold flex items-center gap-1.5 mb-1.5"><Landmark className="w-3.5 h-3.5 text-[var(--color-primary)]" /> TRANSFERENCIA</p>
                    <p className="font-mono text-xs text-white leading-relaxed">{provSeleccionado.datosBancarios}</p>
                  </div>
                )}
              </div>

              {/* ACTA DE INGRESO DE HOY */}
              <div className="border-b border-zinc-800 pb-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/proveedores/${provSeleccionado.id}/ingresos-hoy`);
                      if (!res.ok) {
                        const errData = await res.json();
                        alert(errData.error || "No hay prendas ingresadas hoy para este proveedor");
                        return;
                      }
                      const data = await res.json();
                      if (data.prendas && data.prendas.length > 0) {
                        window.open(`/api/proveedores/${provSeleccionado.id}/acta-hoy/pdf`, "_blank");
                      } else {
                        alert("No hay prendas ingresadas hoy para este proveedor");
                      }
                    } catch (err) {
                      alert("Error al verificar los ingresos de hoy");
                    }
                  }}
                  className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-bold py-3 rounded-xl border border-zinc-800 transition-colors text-xs flex justify-center items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" /> Acta de Ingresos de Hoy (PDF)
                </button>
              </div>

              {/* SECCIÓN GENERAR LIQUIDACIÓN */}
              <div className="bg-[var(--color-surface-elevated)]/30 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3">
                <h4 className="font-heading text-sm font-bold text-[var(--color-primary)] uppercase tracking-wide">Generar Liquidación</h4>
                
                {provSeleccionado.prendasVendidasSinLiquidar === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] font-sans">No hay ventas registradas pendientes de liquidación.</p>
                ) : (
                  <form onSubmit={handleGenerarLiquidacion} className="flex flex-col gap-3 font-sans text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">Desde</label>
                        <input 
                          type="date" required
                          className="w-full bg-[var(--color-surface)] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                          value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">Hasta</label>
                        <input 
                          type="date" required
                          className="w-full bg-[var(--color-surface)] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                          value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" disabled={procesandoLiquidacion}
                      className="w-full bg-white text-black font-extrabold py-3 rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      {procesandoLiquidacion ? "Procesando..." : "Generar Cuenta de Cobro"}
                    </button>
                  </form>
                )}
              </div>

              {/* ULTIMA LIQUIDACION CREADA */}
              {ultimaLiquidacionCreada && (
                <div className="bg-green-500/5 border border-green-500/25 p-4 rounded-2xl flex flex-col gap-3 font-sans">
                  <div className="flex justify-between items-center text-xs text-white">
                    <span className="font-bold">Liquidación Generada</span>
                    <span className="font-mono bg-green-500/20 px-2 py-0.5 rounded text-green-400 text-[10px]">#{ultimaLiquidacionCreada.id.substring(0,8).toUpperCase()}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 bg-black/20 p-3 rounded-xl border border-zinc-800 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Ventas Brutas:</span>
                      <span className="font-mono text-white">{formatCOP(ultimaLiquidacionCreada.totalVentas)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Comisión El Parche:</span>
                      <span className="font-mono text-white">-{formatCOP(ultimaLiquidacionCreada.totalComision)}</span>
                    </div>
                    <div className="flex justify-between text-green-400 font-bold border-t border-zinc-800 mt-2 pt-2 text-sm">
                      <span>Neto a Pagar:</span>
                      <span className="font-mono">{formatCOP(ultimaLiquidacionCreada.netoAPagar)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.open(`/api/liquidaciones/${ultimaLiquidacionCreada.id}/pdf`, "_blank")}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF Soporte
                    </button>
                    {ultimaLiquidacionCreada.estado === "BORRADOR" && (
                      <button 
                        onClick={() => handleRegistrarPago(ultimaLiquidacionCreada.id)}
                        className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black text-xs font-extrabold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5"
                      >
                        Registrar Transferencia
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* HISTORIAL DE LIQUIDACIONES DEL PROVEEDOR */}
              <div className="flex flex-col gap-3 mt-2 border-t border-zinc-800 pt-4">
                <h4 className="font-heading text-sm font-bold text-white mb-1">Historial de Liquidaciones</h4>
                {historialLiquidaciones.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] font-sans">No hay liquidaciones previas creadas.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {historialLiquidaciones.map(l => (
                      <div key={l.id} className="flex justify-between items-center p-3 rounded-xl bg-black/15 border border-zinc-800 text-xs font-sans">
                        <div>
                          <p className="font-mono font-bold text-white">#{l.id.substring(0,8).toUpperCase()}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Neto: {formatCOP(l.netoAPagar)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${l.estado === 'PAGADA' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : l.estado === 'APROBADA' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                            {l.estado}
                          </span>
                          <button 
                            onClick={() => window.open(`/api/liquidaciones/${l.id}/pdf`, "_blank")}
                            className="p-2 rounded bg-zinc-850 hover:bg-zinc-800 text-white"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="border-stitch-white rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center opacity-40 min-h-[300px] bg-[var(--color-surface)]">
              <Users className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
              <p className="text-sm font-sans text-[var(--color-text-secondary)]">Selecciona un proveedor de la lista para ver su información y gestionar sus liquidaciones.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL REGISTRAR PROVEEDOR */}
      {modalNuevoProv && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="border-stitch-gold bg-[var(--color-surface)] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-heading">
                <Users className="w-6 h-6 text-[var(--color-secondary)]" /> Crear Diseñador / Proveedor
              </h2>
              <button onClick={() => setModalNuevoProv(false)} className="text-[var(--color-text-secondary)] hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCrearProveedor} className="p-6 flex flex-col gap-4 font-sans text-sm">
              {errorForm && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {errorForm}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Nombre Completo o Razón Social *</label>
                <input 
                  type="text" required
                  className="w-full bg-[var(--color-surface-elevated)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                  value={nombre} onChange={e => setNombre(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Tipo de Documento</label>
                  <select 
                    className="w-full bg-[var(--color-surface-elevated)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                    value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)}
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="NIT">NIT / RUT</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Número de Documento *</label>
                  <input 
                    type="text" required
                    className="w-full bg-[var(--color-surface-elevated)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                    value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Teléfono</label>
                  <input 
                    type="text"
                    className="w-full bg-[var(--color-surface-elevated)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                    value={telefono} onChange={e => setTelefono(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Correo Electrónico</label>
                  <input 
                    type="email"
                    className="w-full bg-[var(--color-surface-elevated)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Datos Bancarios para Transferencias</label>
                <input 
                  type="text"
                  placeholder="Banco, Tipo cuenta, Número, Titular"
                  className="w-full bg-[var(--color-surface-elevated)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none font-mono text-xs focus:border-[var(--color-primary)]"
                  value={datosBancarios} onChange={e => setDatosBancarios(e.target.value)}
                />
              </div>

              {/* DIAN TRIBUTARIO */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    className="w-4.5 h-4.5 accent-[var(--color-primary)] cursor-pointer"
                    checked={responsableIva}
                    onChange={(e) => setResponsableIva(e.target.checked)}
                  />
                  <div>
                    <p className="font-bold text-white text-xs">Declara IVA / Responsable</p>
                    <p className="text-[10px] text-zinc-500">¿Es responsable del impuesto sobre las ventas?</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    className="w-4.5 h-4.5 accent-[var(--color-primary)] cursor-pointer"
                    checked={emiteFactura}
                    onChange={(e) => setEmiteFactura(e.target.checked)}
                  />
                  <div>
                    <p className="font-bold text-white text-xs">Requiere Factura Legal</p>
                    <p className="text-[10px] text-zinc-500">¿Necesita soporte factura en vez de cuenta cobro?</p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-zinc-850">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Comisión Boutique (%)</label>
                  <input 
                    type="number" required
                    className="w-full bg-[var(--color-surface)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                    value={comisionDefaultPct} onChange={e => setComisionDefaultPct(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Plazo Vitrina (Días)</label>
                  <input 
                    type="number" required
                    className="w-full bg-[var(--color-surface)] border border-zinc-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)]"
                    value={plazoMaxVitrinaDias} onChange={e => setPlazoMaxVitrinaDias(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 bg-[var(--color-surface-elevated)]/30 border-t border-zinc-850 flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button 
                  type="button" 
                  onClick={() => setModalNuevoProv(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-800 text-white hover:bg-white/5 transition-all text-xs font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={creando}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold px-6 py-2.5 rounded-xl transition-all text-xs"
                >
                  {creando ? "Registrando..." : "Registrar Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
