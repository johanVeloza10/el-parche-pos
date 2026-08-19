"use client";

import { useState, useEffect } from "react";
import { PlusCircle, User, Factory, Tag, Barcode, Printer, Plus, X, Building, Phone, Mail } from "lucide-react";

const CATEGORIAS_DEFAULT = ["Chaquetas", "Blusas", "Pantalones", "Accesorios", "Joyas", "Vestidos", "Faldas"];

export default function ReceptionClient() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [ultimaPrenda, setUltimaPrenda] = useState<any>(null);
  const [ultimasPrendas, setUltimasPrendas] = useState<any[]>([]);

  // Form State
  const [origen, setOrigen] = useState<"CONSIGNACION" | "PRODUCCION_PROPIA">("CONSIGNACION");
  const [proveedorId, setProveedorId] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_DEFAULT[0]);
  const [descripcion, setDescripcion] = useState("");
  const [codigoPropio, setCodigoPropio] = useState("");
  const [talla, setTalla] = useState("UNICA");
  const [color, setColor] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [cantidad, setCantidad] = useState("1");
  
  // Dynamic fields
  const [comisionPct, setComisionPct] = useState("");
  const [valorProveedor, setValorProveedor] = useState("");
  const [modoComision, setModoComision] = useState<"PORCENTAJE" | "VALOR_FIJO">("PORCENTAJE");
  const [costoProduccion, setCostoProduccion] = useState("");

  // Modal Proveedor Rápido
  const [modalProvRapido, setModalProvRapido] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoDoc, setNuevoDoc] = useState("");
  const [nuevoTel, setNuevoTel] = useState("");
  const [nuevoComision, setNuevoComision] = useState("30");
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async (selectNewId?: string) => {
    try {
      const res = await fetch("/api/proveedores", { cache: "no-store" });
      const data = await res.json();
      setProveedores(data);
      if (selectNewId) {
        seleccionarProveedor(selectNewId, data);
      } else if (data.length > 0 && !proveedorId) {
        seleccionarProveedor(data[0].id, data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoProveedores(false);
    }
  };

  const handleCrearProveedorRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoDoc) return;
    setCreandoProveedor(true);
    try {
      const res = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre,
          tipoDocumento: "CC",
          numeroDocumento: nuevoDoc,
          telefono: nuevoTel || "PENDIENTE",
          comisionDefaultPct: parseFloat(nuevoComision || "30"),
          modoComisionDefault: "PORCENTAJE",
          plazoMaxVitrinaDias: 90
        })
      });
      if (res.ok) {
        const data = await res.json();
        setModalProvRapido(false);
        setNuevoNombre("");
        setNuevoDoc("");
        setNuevoTel("");
        setNuevoComision("30");
        await fetchProveedores(data.id);
      } else {
        const errData = await res.json();
        alert("Error creando proveedor: " + errData.error);
      }
    } catch (error) {
      console.error("Error creating provider:", error);
    } finally {
      setCreandoProveedor(false);
    }
  };

  const seleccionarProveedor = (id: string, lista = proveedores) => {
    setProveedorId(id);
    const prov = lista.find(p => p.id === id);
    if (prov) {
      setModoComision(prov.modoComisionDefault);
      if (prov.modoComisionDefault === "PORCENTAJE") {
        setComisionPct(prov.comisionDefaultPct.toString());
        setValorProveedor("");
      } else {
        setComisionPct("");
      }
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        origen,
        proveedorId: origen === "CONSIGNACION" ? proveedorId : null,
        descripcion,
        categoria,
        talla,
        color,
        precioVenta: parseInt(precioVenta.replace(/\D/g, '') || "0"),
        comisionPct: null,
        valorProveedor: origen === "CONSIGNACION" ? parseInt(valorProveedor.replace(/\D/g, '') || "0") : null,
        costoProduccion: origen === "PRODUCCION_PROPIA" ? parseInt(costoProduccion.replace(/\D/g, '') || "0") : null,
        codigoPropio: codigoPropio.trim() || undefined,
        cantidad: parseInt(cantidad || "1"),
      };

      const res = await fetch("/api/prendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUltimasPrendas(data);
      setUltimaPrenda(data[0]);
      
      // Limpiar formulario básico pero mantener configuración
      setDescripcion("");
      setCodigoPropio("");
      setColor("");
      setPrecioVenta("");
      setCantidad("1");
      if (origen === "PRODUCCION_PROPIA") setCostoProduccion("");
      
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Recepción de Prendas</h1>
        <p className="text-[var(--color-text-secondary)]">Ingresa nueva mercancía al inventario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        
        {/* FORMULARIO */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl">
            
            {/* ORIGEN TOGGLE */}
            <div className="flex bg-[var(--color-surface-elevated)] rounded-xl p-1 mb-8">
              <button 
                type="button"
                onClick={() => setOrigen("CONSIGNACION")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${origen === 'CONSIGNACION' ? 'bg-[var(--color-primary)] text-black shadow-md' : 'text-[var(--color-text-secondary)] hover:text-white'}`}
              >
                <User className="w-4 h-4" /> Consignación (Proveedor)
              </button>
              <button 
                type="button"
                onClick={() => setOrigen("PRODUCCION_PROPIA")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${origen === 'PRODUCCION_PROPIA' ? 'bg-[var(--color-secondary)] text-black shadow-md' : 'text-[var(--color-text-secondary)] hover:text-white'}`}
              >
                <Factory className="w-4 h-4" /> Producción Propia
              </button>
            </div>

            <form onSubmit={handleGuardar} className="flex flex-col gap-5">
              
              {/* CAMBIOS SEGÚN ORIGEN */}
              {origen === "CONSIGNACION" ? (
                <div className="grid grid-cols-2 gap-4 bg-[var(--color-surface-elevated)]/30 p-4 rounded-xl border border-[var(--color-surface-elevated)]">
                  <div className="col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Proveedor</label>
                      <button
                        type="button"
                        onClick={() => setModalProvRapido(true)}
                        className="text-[var(--color-primary)] hover:text-white transition-colors text-xs flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Nuevo
                      </button>
                    </div>
                    <select 
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none"
                      value={proveedorId}
                      onChange={(e) => seleccionarProveedor(e.target.value)}
                      disabled={cargandoProveedores}
                    >
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Costo Consignación ($ COP) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-[var(--color-text-muted)]">$</span>
                      <input 
                        type="text" required
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl pl-8 pr-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none"
                        value={valorProveedor} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setValorProveedor(val ? parseInt(val).toLocaleString("es-CO") : "");
                          if (val) {
                            const venta = Math.round(parseInt(val) * 1.75);
                            setPrecioVenta(venta.toLocaleString("es-CO"));
                          } else {
                            setPrecioVenta("");
                          }
                        }}
                        placeholder="Ej: 90000"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--color-secondary)]/10 p-4 rounded-xl border border-[var(--color-secondary)]/20">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 text-[var(--color-secondary)]">Costo de Producción (Tus materiales/mano de obra)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-[var(--color-secondary)]/50">$</span>
                    <input 
                      type="text" required
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-secondary)]/30 rounded-xl pl-8 pr-4 py-3 text-white focus:border-[var(--color-secondary)] focus:outline-none"
                      value={costoProduccion} onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCostoProduccion(val ? parseInt(val).toLocaleString("es-CO") : "");
                      }}
                      placeholder="Ej: 45000"
                    />
                  </div>
                </div>
              )}

              {/* DETALLES DE LA PRENDA */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Referencia / Código (Opcional)</label>
                <div className="relative">
                  <input 
                    type="text" maxLength={50}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none mb-4 uppercase"
                    value={codigoPropio} 
                    onChange={async (e) => {
                      const val = e.target.value;
                      setCodigoPropio(val);
                      if (val.trim().length >= 4) {
                        try {
                          const res = await fetch(`/api/prendas/buscar?q=${encodeURIComponent(val.trim())}`);
                          if (res.ok) {
                            const data = await res.json();
                            const match = data.find((p: any) => p.codigo.split('-')[0].toUpperCase() === val.trim().toUpperCase() || p.codigo.toUpperCase() === val.trim().toUpperCase());
                            if (match) {
                              if (match.descripcion) setDescripcion(match.descripcion);
                              if (match.precioVenta) setPrecioVenta(match.precioVenta.toLocaleString('es-CO'));
                              if (match.valorProveedor) setValorProveedor(match.valorProveedor.toLocaleString('es-CO'));
                              if (match.categoria) setCategoria(match.categoria);
                              if (match.color) setColor(match.color);
                              if (match.proveedorId) setProveedorId(match.proveedorId);
                            }
                          }
                        } catch (err) {
                          console.error("Auto-lookup error:", err);
                        }
                      }
                    }}
                    placeholder="Ej: DP1C001 (Escribe o escanea para auto-completar)"
                  />
                </div>

                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Descripción corta de la prenda</label>
                <input 
                  type="text" required maxLength={100}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none"
                  value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  placeholder="Ej: Chaqueta de jean reciclado con bordado"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Categoría</label>
                  <select 
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none"
                    value={categoria} onChange={e => setCategoria(e.target.value)}
                  >
                    {CATEGORIAS_DEFAULT.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Color Principal</label>
                  <input 
                    type="text" required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none"
                    value={color} onChange={e => setColor(e.target.value)}
                    placeholder="Ej: Azul Oscuro"
                  />
                </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-primary)] mb-1">Precio Venta Público (+75%)</label>
                      <input 
                        type="text" required readOnly={origen === "CONSIGNACION"}
                        className={`w-full border rounded-xl py-2 px-3 text-white focus:outline-none font-mono text-lg ${origen === "CONSIGNACION" ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'bg-black border-[var(--color-surface-elevated)] focus:border-[var(--color-primary)]'}`}
                        value={precioVenta}
                        onChange={e => {
                          if (origen === "CONSIGNACION") return;
                          const val = e.target.value.replace(/\D/g, '');
                          setPrecioVenta(val ? parseInt(val).toLocaleString("es-CO") : "");
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cantidad *</label>
                      <input 
                        type="number" min="1" max="100" required
                        className="w-full bg-black border border-[var(--color-surface-elevated)] rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[var(--color-primary)] font-mono text-lg"
                        value={cantidad}
                        onChange={e => setCantidad(e.target.value)}
                      />
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Talla</label>
                  <select 
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none"
                    value={talla} onChange={e => setTalla(e.target.value)}
                  >
                    <option value="UNICA">ÚNICA</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" disabled={guardando}
                className="mt-4 w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold py-4 rounded-xl transition-colors text-lg flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : <><PlusCircle className="w-5 h-5" /> Registrar Prenda</>}
              </button>
            </form>
          </div>
        </div>

        {/* FEEDBACK & ETIQUETAS */}
        <div className="flex flex-col gap-6">
          {ultimasPrendas.length > 0 ? (
            <div className="bg-[var(--color-surface)] border border-green-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-green-400" /> ¡Guardada(s)!
              </h3>
              
              <div className="bg-[var(--color-surface-elevated)] p-4 rounded-xl mb-6">
                <p className="text-[var(--color-text-secondary)] text-xs mb-1 font-bold">
                  {ultimasPrendas.length === 1 ? "CÓDIGO ÚNICO" : `${ultimasPrendas.length} CÓDIGOS GENERADOS`}
                </p>
                {ultimasPrendas.length === 1 ? (
                  <p className="font-mono text-2xl text-white tracking-widest">{ultimasPrendas[0].codigo}</p>
                ) : (
                  <div className="max-h-28 overflow-y-auto divide-y divide-zinc-800 custom-scrollbar pr-2 mt-1">
                    {ultimasPrendas.map((p, idx) => (
                      <p key={idx} className="font-mono text-sm text-white py-1">{p.codigo}</p>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">{ultimasPrendas[0].descripcion}</p>
              </div>

              {ultimasPrendas.length === 1 ? (
                <button 
                  onClick={() => window.open(`/etiqueta/${ultimasPrendas[0].id}`, '_blank')}
                  className="w-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  <Printer className="w-5 h-5" /> Imprimir Etiqueta
                </button>
              ) : (
                <a 
                  href="/inventario/etiquetas"
                  className="w-full border-2 border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:text-black font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 text-center"
                >
                  <Printer className="w-5 h-5" /> Imprimir Etiquetas en Lote
                </a>
              )}
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center opacity-50 h-full min-h-[300px]">
              <Barcode className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
              <p className="text-[var(--color-text-secondary)]">Registra una prenda para generar su código de barras</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal Proveedor Rápido */}
      {modalProvRapido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-surface-elevated)] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-surface-elevated)] flex justify-between items-center bg-[var(--color-surface-elevated)]/30">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[var(--color-primary)]" /> Registrar Proveedor Rápido
              </h3>
              <button 
                type="button" 
                onClick={() => setModalProvRapido(false)} 
                className="text-[var(--color-text-secondary)] hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCrearProveedorRapido} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nombre / Marca del Diseñador *</label>
                <input 
                  type="text" required
                  value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Ají Picaflor"
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--color-primary)] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Número de Documento / NIT *</label>
                <input 
                  type="text" required
                  value={nuevoDoc} onChange={e => setNuevoDoc(e.target.value)}
                  placeholder="Ej: 10203040 o 52157597-9"
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--color-primary)] focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Teléfono</label>
                  <input 
                    type="text"
                    value={nuevoTel} onChange={e => setNuevoTel(e.target.value)}
                    placeholder="315..."
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--color-primary)] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Comisión Boutique (%)</label>
                  <input 
                    type="number" required
                    value={nuevoComision} onChange={e => setNuevoComision(e.target.value)}
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--color-primary)] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creandoProveedor}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold py-3 rounded-xl transition-all duration-300 text-sm mt-2 disabled:opacity-50"
              >
                {creandoProveedor ? "Registrando..." : "Registrar y Seleccionar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
