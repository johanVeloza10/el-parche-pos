"use client";

import { useState, useEffect } from "react";
import { PlusCircle, User, Factory, Tag, Barcode, Printer } from "lucide-react";

const CATEGORIAS_DEFAULT = ["Chaquetas", "Blusas", "Pantalones", "Accesorios", "Joyas", "Vestidos", "Faldas"];

export default function ReceptionClient() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [ultimaPrenda, setUltimaPrenda] = useState<any>(null);

  // Form State
  const [origen, setOrigen] = useState<"CONSIGNACION" | "PRODUCCION_PROPIA">("CONSIGNACION");
  const [proveedorId, setProveedorId] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_DEFAULT[0]);
  const [descripcion, setDescripcion] = useState("");
  const [talla, setTalla] = useState("UNICA");
  const [color, setColor] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  
  // Dynamic fields
  const [comisionPct, setComisionPct] = useState("");
  const [valorProveedor, setValorProveedor] = useState("");
  const [modoComision, setModoComision] = useState<"PORCENTAJE" | "VALOR_FIJO">("PORCENTAJE");
  const [costoProduccion, setCostoProduccion] = useState("");

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await fetch("/api/proveedores");
      const data = await res.json();
      setProveedores(data);
      if (data.length > 0) {
        seleccionarProveedor(data[0].id, data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoProveedores(false);
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
        comisionPct: origen === "CONSIGNACION" && modoComision === "PORCENTAJE" ? parseFloat(comisionPct) : null,
        valorProveedor: origen === "CONSIGNACION" && modoComision === "VALOR_FIJO" ? parseInt(valorProveedor.replace(/\D/g, '') || "0") : null,
        costoProduccion: origen === "PRODUCCION_PROPIA" ? parseInt(costoProduccion.replace(/\D/g, '') || "0") : null,
      };

      const res = await fetch("/api/prendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUltimaPrenda(data);
      
      // Limpiar formulario básico pero mantener configuración
      setDescripcion("");
      setColor("");
      setPrecioVenta("");
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
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Proveedor</label>
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
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Acuerdo Comercial</label>
                    {modoComision === "PORCENTAJE" ? (
                      <div className="relative">
                        <input 
                          type="number" step="0.1" required
                          className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none pr-8"
                          value={comisionPct} onChange={e => setComisionPct(e.target.value)}
                        />
                        <span className="absolute right-4 top-3 text-[var(--color-text-muted)]">%</span>
                        <span className="text-xs text-[var(--color-text-muted)] mt-1 block">Comisión que gana el proveedor</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-[var(--color-text-muted)]">$</span>
                        <input 
                          type="text" required
                          className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl pl-8 pr-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none"
                          value={valorProveedor} onChange={e => setValorProveedor(e.target.value)}
                          placeholder="Valor fijo"
                        />
                        <span className="text-xs text-[var(--color-text-muted)] mt-1 block">Lo que se le pagará al proveedor</span>
                      </div>
                    )}
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
                      value={costoProduccion} onChange={e => setCostoProduccion(e.target.value)}
                      placeholder="Ej: 45000"
                    />
                  </div>
                </div>
              )}

              {/* DETALLES DE LA PRENDA */}
              <div>
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
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary)] mb-1">Precio de Venta al Público</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-[var(--color-primary)]">$</span>
                    <input 
                      type="text" required
                      className="w-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl pl-8 pr-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none text-lg font-bold"
                      value={precioVenta} onChange={e => setPrecioVenta(e.target.value)}
                      placeholder="85000"
                    />
                  </div>
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
          {ultimaPrenda ? (
            <div className="bg-[var(--color-surface)] border border-green-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-green-400" /> ¡Guardada!
              </h3>
              
              <div className="bg-[var(--color-surface-elevated)] p-4 rounded-xl mb-6">
                <p className="text-[var(--color-text-secondary)] text-xs mb-1">CÓDIGO ÚNICO</p>
                <p className="font-mono text-2xl text-white tracking-widest">{ultimaPrenda.codigo}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">{ultimaPrenda.descripcion}</p>
              </div>

              <button 
                onClick={() => window.open(`/api/prendas/${ultimaPrenda.id}/label`, '_blank')}
                className="w-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                <Printer className="w-5 h-5" /> Imprimir Etiqueta
              </button>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center opacity-50 h-full min-h-[300px]">
              <Barcode className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
              <p className="text-[var(--color-text-secondary)]">Registra una prenda para generar su código de barras</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
