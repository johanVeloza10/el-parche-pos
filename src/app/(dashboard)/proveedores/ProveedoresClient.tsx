"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Phone, Mail, Award, Landmark, FileText, ChevronRight, CheckCircle, Printer, X, Trash2 } from "lucide-react";

export default function ProveedoresClient() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevoProv, setModalNuevoProv] = useState(false);
  const [provSeleccionado, setProvSeleccionado] = useState<any>(null);
  
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
  const [notas, setNotas] = useState("");

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
        // Si hay un proveedor seleccionado, actualizar su info en tiempo real
        if (provSeleccionado) {
          const actualizado = data.find((p: any) => p.id === provSeleccionado.id);
          setProvSeleccionado(actualizado || null);
        }
      }
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  };

  const handleSeleccionarProveedor = (p: any) => {
    setProvSeleccionado(p);
    setUltimaLiquidacionCreada(null);
    fetchHistorialLiquidaciones(p.id);
    // Inicializar fechas por defecto (del 1 del mes actual al día de hoy)
    const hoy = new Date();
    const primeroMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaInicio(primeroMes.toISOString().split("T")[0]);
    setFechaFin(hoy.toISOString().split("T")[0]);
  };

  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
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
          notas
        })
      });

      if (res.ok) {
        setModalNuevoProv(false);
        // Limpiar campos
        setNombre("");
        setNumeroDocumento("");
        setTelefono("");
        setEmail("");
        setDatosBancarios("");
        setNotas("");
        fetchProveedores();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerarLiquidacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesandoLiquidacion(true);
    try {
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorId: provSeleccionado.id,
          fechaInicio,
          fechaFin
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUltimaLiquidacionCreada(data);
        fetchProveedores(); // Actualiza los saldos acumulados
        fetchHistorialLiquidaciones(provSeleccionado.id);
      } else {
        alert(data.error || "No se pudo generar la liquidación");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcesandoLiquidacion(false);
    }
  };

  const handleRegistrarPago = async (liqId: string) => {
    const confirmar = confirm("¿Confirmas que ya realizaste la transferencia y deseas marcar esta liquidación como PAGADA?");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/liquidaciones/${liqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "PAGADA",
          fechaPago: new Date().toISOString()
        })
      });

      if (res.ok) {
        fetchProveedores();
        fetchHistorialLiquidaciones(provSeleccionado.id);
        if (ultimaLiquidacionCreada?.id === liqId) {
          setUltimaLiquidacionCreada((prev: any) => prev ? { ...prev, estado: "PAGADA" } : null);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAprobarBorrador = async (liqId: string) => {
    try {
      const res = await fetch(`/api/liquidaciones/${liqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "APROBADA"
        })
      });

      if (res.ok) {
        fetchHistorialLiquidaciones(provSeleccionado.id);
        if (ultimaLiquidacionCreada?.id === liqId) {
          setUltimaLiquidacionCreada((prev: any) => prev ? { ...prev, estado: "APROBADA" } : null);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEliminarBorrador = async (liqId: string) => {
    const confirmar = confirm("¿Deseas anular esta liquidación en borrador y liberar las prendas para que puedan ser reliquidadas en otra fecha?");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/liquidaciones/${liqId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setUltimaLiquidacionCreada(null);
        fetchProveedores();
        fetchHistorialLiquidaciones(provSeleccionado.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getSemaforoColor = (saldo: number) => {
    if (saldo === 0) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (saldo > 0 && saldo <= 200000) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-[var(--color-secondary)]" /> Proveedores y Diseñadores
          </h1>
          <p className="text-[var(--color-text-secondary)]">Consignaciones, comisiones y saldos pendientes.</p>
        </div>
        <button 
          onClick={() => setModalNuevoProv(true)}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Proveedor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LISTADO DE PROVEEDORES */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <h3 className="font-bold text-lg text-white border-b border-[var(--color-surface-elevated)] pb-3">
            Lista de Proveedores Activos
          </h3>
          
          {cargando ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-[var(--color-secondary)] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {proveedores.map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleSeleccionarProveedor(p)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${provSeleccionado?.id === p.id ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/50' : 'bg-[var(--color-surface-elevated)]/20 border-[var(--color-surface-elevated)] hover:border-white/10'}`}
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-white text-base">{p.nombre}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">{p.tipoDocumento}: {p.numeroDocumento}</p>
                    <div className="flex gap-4 text-xs text-[var(--color-text-muted)] mt-1">
                      <span>🏷️ Vitrina: {p.prendasEnVitrina}</span>
                      <span>💰 Por liquidar: {p.prendasVendidasSinLiquidar} prendas</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 sm:mt-0">
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-muted)] font-semibold">SALDO PENDIENTE</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-mono font-bold mt-1 border ${getSemaforoColor(p.saldoPorPagar)}`}>
                        ${p.saldoPorPagar.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETALLE Y LIQUIDACIÓN (LADO DERECHO) */}
        <div className="flex flex-col gap-6">
          {provSeleccionado ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-6">
              
              {/* HEADER FICHA */}
              <div className="flex justify-between items-start border-b border-[var(--color-surface-elevated)] pb-4">
                <div>
                  <h3 className="font-black text-xl text-white">{provSeleccionado.nombre}</h3>
                  <span className="inline-flex items-center rounded-full bg-[var(--color-secondary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-secondary)] mt-1">
                    Comisión: {provSeleccionado.comisionDefaultPct}%
                  </span>
                </div>
                <button onClick={() => setProvSeleccionado(null)} className="text-[var(--color-text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DATOS DE CONTACTO */}
              <div className="flex flex-col gap-3 text-sm text-white">
                {provSeleccionado.telefono && (
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[var(--color-text-muted)]" /> {provSeleccionado.telefono}</p>
                )}
                {provSeleccionado.email && (
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[var(--color-text-muted)]" /> {provSeleccionado.email}</p>
                )}
                {provSeleccionado.datosBancarios && (
                  <div className="bg-black/20 p-3 rounded-xl border border-[var(--color-surface-elevated)] mt-2">
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mb-1"><Landmark className="w-3.5 h-3.5" /> DATOS DE TRANSFERENCIA</p>
                    <p className="font-mono text-xs text-white">{provSeleccionado.datosBancarios}</p>
                  </div>
                )}
              </div>

              {/* SECCIÓN GENERAR LIQUIDACIÓN */}
              <div className="bg-[var(--color-surface-elevated)]/30 border border-[var(--color-surface-elevated)] p-4 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--color-primary)] mb-3 uppercase tracking-wide">Generar Liquidación</h4>
                
                {provSeleccionado.prendasVendidasSinLiquidar === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">No tiene ventas acumuladas pendientes por liquidar.</p>
                ) : (
                  <form onSubmit={handleGenerarLiquidacion} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Desde</label>
                        <input 
                          type="date" required
                          className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Hasta</label>
                        <input 
                          type="date" required
                          className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" disabled={procesandoLiquidacion}
                      className="w-full mt-2 bg-[var(--color-secondary)] hover:bg-[#00BCCC] text-black font-bold py-2 rounded-xl text-xs transition-colors flex justify-center items-center gap-1.5"
                    >
                      {procesandoLiquidacion ? "Calculando..." : <><FileText className="w-4 h-4" /> Generar Borrador</>}
                    </button>
                  </form>
                )}
              </div>

              {/* RESULTADO DE LA LIQUIDACIÓN GENERADA */}
              {ultimaLiquidacionCreada && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-green-400">LIQUIDACIÓN GENERADA</span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">#{ultimaLiquidacionCreada.id.substring(0,6)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white">
                    <span>Neto a pagar:</span>
                    <span className="font-mono font-bold">${ultimaLiquidacionCreada.netoAPagar.toLocaleString("es-CO")}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => window.open(`/api/liquidaciones/${ultimaLiquidacionCreada.id}/pdf`, "_blank")}
                      className="flex-1 bg-white hover:bg-gray-150 text-black text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                    {ultimaLiquidacionCreada.estado === "BORRADOR" && (
                      <>
                        <button 
                          onClick={() => handleAprobarBorrador(ultimaLiquidacionCreada.id)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1"
                        >
                          Aprobar
                        </button>
                        <button 
                          onClick={() => handleEliminarBorrador(ultimaLiquidacionCreada.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {ultimaLiquidacionCreada.estado === "APROBADA" && (
                      <button 
                        onClick={() => handleRegistrarPago(ultimaLiquidacionCreada.id)}
                        className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black text-xs font-bold py-2 rounded-lg transition-colors"
                      >
                        Registrar Pago
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* HISTORIAL DE LIQUIDACIONES DEL PROVEEDOR */}
              <div className="flex flex-col gap-2 mt-2">
                <h4 className="font-bold text-xs text-white border-t border-[var(--color-surface-elevated)] pt-4 mb-2">Historial de Liquidaciones</h4>
                {historialLiquidaciones.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">No hay liquidaciones previas creadas.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                    {historialLiquidaciones.map(l => (
                      <div key={l.id} className="flex justify-between items-center p-2 rounded-xl bg-black/15 border border-[var(--color-surface-elevated)] text-[11px]">
                        <div>
                          <p className="font-mono text-white">#{l.id.substring(0,8).toUpperCase()}</p>
                          <p className="text-[9px] text-[var(--color-text-muted)]">Neto: ${l.netoAPagar.toLocaleString("es-CO")}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${l.estado === 'PAGADA' ? 'bg-green-500/10 text-green-400' : l.estado === 'APROBADA' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {l.estado}
                          </span>
                          <button 
                            onClick={() => window.open(`/api/liquidaciones/${l.id}/pdf`, "_blank")}
                            className="p-1 rounded bg-[var(--color-surface-elevated)] hover:bg-white/10 text-white"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center opacity-50 min-h-[300px]">
              <Users className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
              <p className="text-sm text-[var(--color-text-secondary)]">Selecciona un proveedor de la lista para ver su información y gestionar sus liquidaciones.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL NUEVO PROVEEDOR */}
      {modalNuevoProv && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-[var(--color-secondary)]" /> Crear Diseñador / Proveedor
              </h2>
              <button onClick={() => setModalNuevoProv(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCrearProveedor} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre Completo o Razón Social</label>
                <input 
                  type="text" required
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  value={nombre} onChange={e => setNombre(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Tipo de Documento</label>
                  <select 
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                    value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)}
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Número de Documento</label>
                  <input 
                    type="text" required
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                    value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Teléfono</label>
                  <input 
                    type="text"
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                    value={telefono} onChange={e => setTelefono(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Correo Electrónico</label>
                  <input 
                    type="email"
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Datos Bancarios para Transferencias</label>
                <input 
                  type="text"
                  placeholder="Banco, Tipo cuenta, Número, Titular"
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none font-mono text-sm"
                  value={datosBancarios} onChange={e => setDatosBancarios(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-black/15 p-4 rounded-xl border border-[var(--color-surface-elevated)]">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Comisión Boutique (%)</label>
                  <input 
                    type="number" required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:outline-none"
                    value={comisionDefaultPct} onChange={e => setComisionDefaultPct(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Plazo Vitrina (Días)</label>
                  <input 
                    type="number" required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:outline-none"
                    value={plazoMaxVitrinaDias} onChange={e => setPlazoMaxVitrinaDias(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)] flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button 
                  type="button" 
                  onClick={() => setModalNuevoProv(false)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--color-surface-elevated)] text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
