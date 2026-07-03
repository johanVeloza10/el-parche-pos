"use client";

import { useState, useEffect } from "react";
import { Scissors, Package, Tag, Plus, CheckCircle, Calculator, ChevronRight, X, AlertTriangle, FileText } from "lucide-react";

export default function ProduccionClient() {
  const [activeTab, setActiveTab] = useState<"ordenes" | "materiales" | "costos">("ordenes");
  const [materiales, setMateriales] = useState<any[]>([]);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [costos, setCostos] = useState<any[]>([]);
  const [mesCosto, setMesCosto] = useState("2026-06");
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalNuevoMaterial, setModalNuevoMaterial] = useState(false);
  const [modalCompraMaterial, setModalCompraMaterial] = useState(false);
  const [modalNuevaOrden, setModalNuevaOrden] = useState(false);
  const [modalCostoNegocio, setModalCostoNegocio] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any>(null);

  // Formulario Nuevo Material
  const [nomMat, setNomMat] = useState("");
  const [uniMat, setUniMat] = useState("METRO");
  const [exMat, setExMat] = useState("");
  const [coMat, setCoMat] = useState("");

  // Formulario Compra Material
  const [idMatCompra, setIdMatCompra] = useState("");
  const [cantMatCompra, setCantMatCompra] = useState("");
  const [totalMatCompra, setTotalMatCompra] = useState("");
  const [provMatCompra, setProvMatCompra] = useState("");

  // Formulario Nueva Orden
  const [disenoOrden, setDisenoOrden] = useState("");
  const [cantPrendasOrden, setCantPrendasOrden] = useState("1");
  const [margenOrden, setMargenOrden] = useState("60.0"); // 60% margen = 2.5x PVP markup

  // Formulario Consumo
  const [idMatConsumo, setIdMatConsumo] = useState("");
  const [cantMatConsumo, setCantMatConsumo] = useState("");

  // Formulario Mano de Obra
  const [conceptoMO, setConceptoMO] = useState("");
  const [valorMO, setValorMO] = useState("");
  const [manoDeObraLista, setManoDeObraLista] = useState<any[]>([]);

  // Formulario Cierre
  const [costosIndirectos, setCostosIndirectos] = useState("0");
  const [ordenResultado, setOrdenResultado] = useState<any>(null);

  // Formulario Costo Negocio
  const [tipoCosto, setTipoCosto] = useState("FIJO");
  const [conceptoCosto, setConceptoCosto] = useState("");
  const [valorCosto, setValorCosto] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [activeTab, mesCosto]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (activeTab === "materiales") {
        const res = await fetch("/api/produccion/materiales");
        if (res.ok) setMateriales(await res.json());
      } else if (activeTab === "ordenes") {
        const res = await fetch("/api/produccion/ordenes");
        if (res.ok) {
          const data = await res.json();
          setOrdenes(data);
          if (ordenSeleccionada) {
            const act = data.find((o: any) => o.id === ordenSeleccionada.id);
            setOrdenSeleccionada(act || null);
          }
        }
      } else if (activeTab === "costos") {
        const res = await fetch(`/api/produccion/costos?mes=${mesCosto}`);
        if (res.ok) setCostos(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/produccion/materiales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nomMat, unidad: uniMat, existenciaInicial: exMat, costoInicial: coMat })
      });
      if (res.ok) {
        setModalNuevoMaterial(false);
        setNomMat("");
        cargarDatos();
      }
    } catch (e) { console.error(e); }
  };

  const handleRegistrarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/produccion/materiales/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiaPrimaId: idMatCompra,
          cantidad: cantMatCompra,
          costoTotal: totalMatCompra,
          proveedorInsumo: provMatCompra
        })
      });
      if (res.ok) {
        setModalCompraMaterial(false);
        setCantMatCompra("");
        setTotalMatCompra("");
        setProvMatCompra("");
        cargarDatos();
      }
    } catch (e) { console.error(e); }
  };

  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/produccion/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreDiseno: disenoOrden,
          cantidadPrendas: cantPrendasOrden,
          margenObjetivo: margenOrden
        })
      });
      if (res.ok) {
        setModalNuevaOrden(false);
        setDisenoOrden("");
        cargarDatos();
      }
    } catch (e) { console.error(e); }
  };

  const handleRegistrarConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/produccion/ordenes/${ordenSeleccionada.id}/consumos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiaPrimaId: idMatConsumo,
          cantidad: cantMatConsumo
        })
      });
      if (res.ok) {
        setCantMatConsumo("");
        cargarDatos();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) { console.error(e); }
  };

  const handleAgregarManoObra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptoMO || !valorMO) return;
    const nueva = { concepto: conceptoMO, valor: parseInt(valorMO) };
    setManoDeObraLista([...manoDeObraLista, nueva]);
    setConceptoMO("");
    setValorMO("");
  };

  const handleCerrarOrden = async () => {
    const confirmar = confirm("¿Deseas cerrar la orden? Esto descontará los insumos de bodega, calculará costos y creará las prendas para vitrina.");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/produccion/ordenes/${ordenSeleccionada.id}/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manoDeObra: manoDeObraLista,
          costosIndirectos: costosIndirectos
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOrdenResultado(data);
        setManoDeObraLista([]);
        setCostosIndirectos("0");
        cargarDatos();
      } else {
        alert(data.error);
      }
    } catch (e) { console.error(e); }
  };

  const handleCrearCosto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/produccion/costos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoCosto,
          concepto: conceptoCosto,
          valor: valorCosto,
          mes: mesCosto
        })
      });
      if (res.ok) {
        setModalCostoNegocio(false);
        setConceptoCosto("");
        setValorCosto("");
        cargarDatos();
      }
    } catch (e) { console.error(e); }
  };

  const formatCOP = (num: number) => {
    return `$${Math.round(num).toLocaleString("es-CO")}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Scissors className="w-8 h-8 text-[var(--color-primary)]" /> Taller y Producción Propia
          </h1>
          <p className="text-[var(--color-text-secondary)]">Control de costos de taller, insumos y confección de prendas únicas.</p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACION */}
      <div className="flex border-b border-[var(--color-surface-elevated)] text-sm">
        <button 
          onClick={() => { setActiveTab("ordenes"); setOrdenSeleccionada(null); setOrdenResultado(null); }}
          className={`py-3 px-6 font-bold transition-all border-b-2 ${activeTab === "ordenes" ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-transparent text-[var(--color-text-secondary)] hover:text-white"}`}
        >
          Órdenes de Producción
        </button>
        <button 
          onClick={() => { setActiveTab("materiales"); setOrdenSeleccionada(null); }}
          className={`py-3 px-6 font-bold transition-all border-b-2 ${activeTab === "materiales" ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-transparent text-[var(--color-text-secondary)] hover:text-white"}`}
        >
          Materia Prima
        </button>
        <button 
          onClick={() => { setActiveTab("costos"); setOrdenSeleccionada(null); }}
          className={`py-3 px-6 font-bold transition-all border-b-2 ${activeTab === "costos" ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-transparent text-[var(--color-text-secondary)] hover:text-white"}`}
        >
          Gastos del Local
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LADO IZQUIERDO Y CENTRO (VISTAS PRINCIPALES SEGUN TABS) */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          
          {/* TAB ÓRDENES */}
          {activeTab === "ordenes" && (
            <>
              <div className="flex justify-between items-center border-b border-[var(--color-surface-elevated)] pb-3">
                <h3 className="font-bold text-lg text-white">Órdenes de Trabajo Activas</h3>
                <button 
                  onClick={() => setModalNuevaOrden(true)}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Crear Órden
                </button>
              </div>

              {cargando ? (
                <div className="py-12 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {ordenes.map(o => (
                    <div 
                      key={o.id}
                      onClick={() => { setOrdenSeleccionada(o); setManoDeObraLista(o.manoDeObra ? JSON.parse(o.manoDeObra) : []); setOrdenResultado(null); }}
                      className={`flex justify-between items-center p-4 rounded-2xl border transition-all cursor-pointer ${ordenSeleccionada?.id === o.id ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/50' : 'bg-[var(--color-surface-elevated)]/20 border-[var(--color-surface-elevated)] hover:border-white/10'}`}
                    >
                      <div>
                        <h4 className="font-bold text-white text-base">{o.nombreDiseno}</h4>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Prendas a confeccionar: {o.cantidadPrendas} | Acento: Margen {o.margenObjetivo}%</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${o.estado === 'CERRADA' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                          {o.estado}
                        </span>
                        <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB MATERIA PRIMA */}
          {activeTab === "materiales" && (
            <>
              <div className="flex justify-between items-center border-b border-[var(--color-surface-elevated)] pb-3">
                <h3 className="font-bold text-lg text-white">Inventario de Materiales</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (materiales.length === 0) {
                        alert("Primero crea un material para poder comprar existencias");
                        return;
                      }
                      setIdMatCompra(materiales[0].id);
                      setModalCompraMaterial(true);
                    }}
                    className="border border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 font-bold text-xs py-2 px-4 rounded-xl transition-colors"
                  >
                    Registrar Compra
                  </button>
                  <button 
                    onClick={() => setModalNuevoMaterial(true)}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Crear Insumo
                  </button>
                </div>
              </div>

              {cargando ? (
                <div className="py-12 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div></div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--color-surface-elevated)] text-white text-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-xs font-semibold">
                        <th className="p-4">Material</th>
                        <th className="p-4">Unidad</th>
                        <th className="p-4 text-right">Existencias</th>
                        <th className="p-4 text-right">Costo Promedio (COP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-surface-elevated)]">
                      {materiales.map(m => (
                        <tr key={m.id} className="hover:bg-[var(--color-surface-elevated)]/25 transition-colors">
                          <td className="p-4 font-bold">{m.nombre}</td>
                          <td className="p-4">{m.unidad}</td>
                          <td className="p-4 text-right font-mono">{m.existencia}</td>
                          <td className="p-4 text-right font-mono">{formatCOP(m.costoPromedioActual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TAB GASTOS LOCAL */}
          {activeTab === "costos" && (
            <>
              <div className="flex justify-between items-center border-b border-[var(--color-surface-elevated)] pb-3">
                <h3 className="font-bold text-lg text-white">Gastos Operativos del Mes</h3>
                <div className="flex gap-4 items-center">
                  <input 
                    type="month"
                    className="bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] text-white text-xs px-3 py-2 rounded-xl focus:outline-none"
                    value={mesCosto} onChange={e => setMesCosto(e.target.value)}
                  />
                  <button 
                    onClick={() => setModalCostoNegocio(true)}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Registrar Gasto
                  </button>
                </div>
              </div>

              {cargando ? (
                <div className="py-12 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div></div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--color-surface-elevated)] text-white text-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-xs font-semibold">
                        <th className="p-4">Concepto</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-surface-elevated)]">
                      {costos.map(c => (
                        <tr key={c.id} className="hover:bg-[var(--color-surface-elevated)]/25 transition-colors">
                          <td className="p-4 font-bold">{c.concepto}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${c.tipo === 'FIJO' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {c.tipo}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-bold">{formatCOP(c.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>

        {/* LADO DERECHO (CONSOLA DE CONTROL PARA LA ORDEN DE PRODUCCIÓN) */}
        <div className="flex flex-col gap-6">
          {ordenSeleccionada ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col gap-6 text-white text-sm">
              <div className="flex justify-between items-start border-b border-[var(--color-surface-elevated)] pb-4">
                <div>
                  <h3 className="font-black text-xl">{ordenSeleccionada.nombreDiseno}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Confección: {ordenSeleccionada.cantidadPrendas} prendas</p>
                </div>
                <button onClick={() => setOrdenSeleccionada(null)} className="text-[var(--color-text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {ordenSeleccionada.estado === "ABIERTA" ? (
                <>
                  {/* CONSUMIR MATERIALES */}
                  <div>
                    <h4 className="font-bold text-xs text-[var(--color-secondary)] uppercase tracking-wider mb-3">1. Consumir Telas / Insumos</h4>
                    <form onSubmit={handleRegistrarConsumo} className="flex gap-2">
                      <select 
                        required
                        className="flex-1 bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                        value={idMatConsumo} onChange={e => setIdMatConsumo(e.target.value)}
                      >
                        <option value="">Selecciona insumo...</option>
                        {materiales.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.existencia} {m.unidad})</option>)}
                      </select>
                      <input 
                        type="number" step="0.1" required placeholder="Cant"
                        className="w-16 bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-2 py-2 text-xs focus:outline-none text-center"
                        value={cantMatConsumo} onChange={e => setCantMatConsumo(e.target.value)}
                      />
                      <button type="submit" className="bg-[var(--color-secondary)] hover:bg-[#00BCCC] text-black font-bold p-2.5 rounded-xl text-xs"><Plus className="w-4 h-4" /></button>
                    </form>

                    {/* LISTA DE CONSUMIDOS */}
                    <div className="mt-3 flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {ordenSeleccionada.consumos.length === 0 ? (
                        <p className="text-[11px] text-[var(--color-text-muted)] italic">Aún no se han consumido insumos.</p>
                      ) : (
                        ordenSeleccionada.consumos.map((c: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-[11px] p-2 bg-black/15 rounded-lg border border-[var(--color-surface-elevated)]">
                            <span className="truncate flex-1 pr-2">{c.materiaPrima.nombre} ({c.cantidad})</span>
                            <span className="font-mono text-[var(--color-text-secondary)]">{formatCOP(c.costoTotal)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* MANO DE OBRA */}
                  <div>
                    <h4 className="font-bold text-xs text-[var(--color-secondary)] uppercase tracking-wider mb-3">2. Mano de Obra (Taller)</h4>
                    <form onSubmit={handleAgregarManoObra} className="flex gap-2">
                      <input 
                        type="text" required placeholder="Concepto (ej: Confección)"
                        className="flex-1 bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                        value={conceptoMO} onChange={e => setConceptoMO(e.target.value)}
                      />
                      <input 
                        type="number" required placeholder="Valor"
                        className="w-20 bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-2 py-2 text-xs focus:outline-none text-right"
                        value={valorMO} onChange={e => setValorMO(e.target.value)}
                      />
                      <button type="submit" className="bg-[var(--color-secondary)] hover:bg-[#00BCCC] text-black font-bold p-2.5 rounded-xl text-xs"><Plus className="w-4 h-4" /></button>
                    </form>

                    {/* LISTA MANO DE OBRA */}
                    <div className="mt-3 flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {manoDeObraLista.length === 0 ? (
                        <p className="text-[11px] text-[var(--color-text-muted)] italic">Aún no hay mano de obra cargada.</p>
                      ) : (
                        manoDeObraLista.map((m, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] p-2 bg-black/15 rounded-lg border border-[var(--color-surface-elevated)]">
                            <span>{m.concepto}</span>
                            <span className="font-mono text-[var(--color-text-secondary)]">{formatCOP(m.valor)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CIERRE DE ORDEN */}
                  <div className="border-t border-[var(--color-surface-elevated)] pt-4 mt-2">
                    <h4 className="font-bold text-xs text-[var(--color-primary)] uppercase tracking-wider mb-3">3. Finalizar y Costear</h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Costos Indirectos (servicios, empaques taller)</label>
                        <input 
                          type="number"
                          className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          value={costosIndirectos} onChange={e => setCostosIndirectos(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={handleCerrarOrden}
                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold py-3 rounded-xl text-xs transition-colors flex justify-center items-center gap-1.5"
                      >
                        <Calculator className="w-4 h-4" /> Cerrar Órden y Costear
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl">
                    <p className="text-xs text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> ÓRDEN LIQUIDADA Y CERRADA</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Fecha de cierre: {new Date(ordenSeleccionada.fechaCierre).toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs border-b border-[var(--color-surface-elevated)] py-1.5">
                      <span>Costo Total Confección:</span>
                      <span className="font-mono font-bold text-white">{formatCOP(ordenSeleccionada.costoTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[var(--color-surface-elevated)] py-1.5">
                      <span>Costo Unitario Real:</span>
                      <span className="font-mono font-bold text-white">{formatCOP(ordenSeleccionada.costoPorPrenda)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-[var(--color-surface-elevated)] py-2 bg-[var(--color-primary)]/5 px-2 rounded-lg">
                      <span className="text-[var(--color-primary)] font-bold">PVP Sugerido al Público:</span>
                      <span className="font-mono font-bold text-[var(--color-primary)]">{formatCOP(ordenSeleccionada.precioSugerido)}</span>
                    </div>
                  </div>

                  <div className="bg-[var(--color-surface-elevated)]/30 p-3 rounded-xl">
                    <h5 className="font-bold text-xs text-[var(--color-secondary)] mb-2">Prendas creadas en inventario:</h5>
                    <div className="flex flex-col gap-1">
                      {ordenSeleccionada.prendas.map((pr: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[11px] font-mono text-[var(--color-text-secondary)]">
                          <span>{pr.codigo}</span>
                          <span>{formatCOP(pr.precioVenta)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RESULTADO AL CERRAR LA ORDEN ACTUAL */}
              {ordenResultado && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex flex-col gap-2">
                  <span className="text-xs font-bold text-green-400">¡Órden Liquidada con éxito!</span>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Se crearon {ordenResultado.prendasCreadas.length} prendas nuevas con código `{ordenResultado.prendasCreadas[0]?.codigo}` en el inventario.</p>
                  <p className="text-xs text-white">Costo por Prenda: <span className="font-bold">{formatCOP(ordenResultado.ordenCerrada.costoPorPrenda)}</span></p>
                  <p className="text-xs text-[var(--color-primary)] font-bold">Precio Sugerido Venta: {formatCOP(ordenResultado.ordenCerrada.precioSugerido)}</p>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center opacity-50 min-h-[300px]">
              <Scissors className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
              <p className="text-sm text-[var(--color-text-secondary)]">Selecciona una orden de producción de la lista para ver su flujo y realizar el costeo.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL NUEVA ORDEN */}
      {modalNuevaOrden && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-[var(--color-primary)]" /> Crear Órden de Trabajo
              </h2>
              <button onClick={() => setModalNuevaOrden(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCrearOrden} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre del Diseño / Colección</label>
                <input 
                  type="text" required
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  value={disenoOrden} onChange={e => setDisenoOrden(e.target.value)}
                  placeholder="Ej: Chaqueta Jean Bordado Flores"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Prendas a Producir</label>
                  <input 
                    type="number" required min="1"
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:outline-none text-center"
                    value={cantPrendasOrden} onChange={e => setCantPrendasOrden(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Margen Objetivo (%)</label>
                  <input 
                    type="number" required step="0.1"
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:outline-none text-center"
                    value={margenOrden} onChange={e => setMargenOrden(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)] flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button 
                  type="button" onClick={() => setModalNuevaOrden(false)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--color-surface-elevated)] text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
                >
                  Crear Órden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO MATERIAL */}
      {modalNuevoMaterial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-[var(--color-primary)]" /> Crear Material / Insumo
              </h2>
              <button onClick={() => setModalNuevoMaterial(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCrearMaterial} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre del Material</label>
                <input 
                  type="text" required
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  value={nomMat} onChange={e => setNomMat(e.target.value)}
                  placeholder="Ej: Hilo Gusanito Verde"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Unidad</label>
                  <select 
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-3 py-2.5 text-white focus:outline-none"
                    value={uniMat} onChange={e => setUniMat(e.target.value)}
                  >
                    <option value="METRO">Metro</option>
                    <option value="UNIDAD">Unidad</option>
                    <option value="CONO">Cono</option>
                    <option value="ROLLO">Rollo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cant. Inicial</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-3 py-2 text-white focus:outline-none text-center"
                    value={exMat} onChange={e => setExMat(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Costo Promedio</label>
                  <input 
                    type="number" required
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-3 py-2 text-white focus:outline-none text-right"
                    value={coMat} onChange={e => setCoMat(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)] flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button 
                  type="button" onClick={() => setModalNuevoMaterial(false)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--color-surface-elevated)] text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
                >
                  Crear Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR COMPRA MATERIAL */}
      {modalCompraMaterial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-[var(--color-primary)]" /> Registrar Compra Insumo
              </h2>
              <button onClick={() => setModalCompraMaterial(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleRegistrarCompra} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Insumo a Abastecer</label>
                <select 
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  value={idMatCompra} onChange={e => setIdMatCompra(e.target.value)}
                >
                  {materiales.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.existencia} {m.unidad})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cantidad Comprada</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:outline-none text-center"
                    value={cantMatCompra} onChange={e => setCantMatCompra(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Costo Total Compra (COP)</label>
                  <input 
                    type="number" required
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:outline-none text-right font-mono"
                    value={totalMatCompra} onChange={e => setTotalMatCompra(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Proveedor de Insumos</label>
                <input 
                  type="text" required
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  value={provMatCompra} onChange={e => setProvMatCompra(e.target.value)}
                  placeholder="Ej: Distribuidora de Hilos S.A.S."
                />
              </div>

              <div className="p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)] flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button 
                  type="button" onClick={() => setModalCompraMaterial(false)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--color-surface-elevated)] text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
                >
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR COSTO DE NEGOCIO */}
      {modalCostoNegocio && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--color-surface-elevated)] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-[var(--color-primary)]" /> Registrar Gasto Mensual
              </h2>
              <button onClick={() => setModalCostoNegocio(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCrearCosto} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Tipo de Gasto</label>
                <select 
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  value={tipoCosto} onChange={e => setTipoCosto(e.target.value)}
                >
                  <option value="FIJO">Fijo (Arriendo, Servicios, Nómina)</option>
                  <option value="VARIABLE">Variable (Empaques, Publicidad, Transporte)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Concepto / Descripción</label>
                <input 
                  type="text" required
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  value={conceptoCosto} onChange={e => setConceptoCosto(e.target.value)}
                  placeholder="Ej: Pago arriendo local Junio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Valor Gasto (COP)</label>
                <input 
                  type="number" required
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:outline-none text-right font-mono"
                  value={valorCosto} onChange={e => setValorCosto(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="p-6 bg-[var(--color-surface-elevated)]/30 border-t border-[var(--color-surface-elevated)] flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button 
                  type="button" onClick={() => setModalCostoNegocio(false)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--color-surface-elevated)] text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
