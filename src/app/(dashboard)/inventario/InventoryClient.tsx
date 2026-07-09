"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Tag, 
  Package, 
  User, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Plus, 
  Barcode, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Calendar
} from "lucide-react";

const formatCOP = (num: number) => `$${Math.round(num).toLocaleString("es-CO")}`;

export default function InventoryClient() {
  const [prendas, setPrendas] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filters
  const [query, setQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  
  // Pagination
  const [pagina, setPagina] = useState(1);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [totalPrendas, setTotalPrendas] = useState(0);

  // Quick edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrecioVenta, setEditPrecioVenta] = useState("");
  const [editValorProveedor, setEditValorProveedor] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Stats
  const [totalEnVitrina, setTotalEnVitrina] = useState(0);
  const [valorTotalVitrina, setValorTotalVitrina] = useState(0);

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    cargarInventario();
  }, [pagina, filtroEstado, filtroProveedor]);

  const cargarProveedores = async () => {
    try {
      const res = await fetch("/api/proveedores");
      if (res.ok) {
        const data = await res.json();
        setProveedores(data);
      }
    } catch (err) {
      console.error("Error cargando proveedores:", err);
    }
  };

  const cargarInventario = async () => {
    setCargando(true);
    try {
      const url = new URL("/api/prendas", window.location.origin);
      url.searchParams.append("page", pagina.toString());
      if (filtroEstado) url.searchParams.append("estado", filtroEstado);
      if (filtroProveedor) url.searchParams.append("proveedorId", filtroProveedor);
      if (query) url.searchParams.append("q", query);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setPrendas(data.prendas);
        setPaginasTotales(data.meta.totalPages || 1);
        setTotalPrendas(data.meta.total || 0);

        // Calculate simple stats based on loaded page or overall if provided (here we estimate)
        // In production, we'd query a dashboard endpoint, but let's approximate or calculate from current batch
        const enVitrina = data.prendas.filter((p: any) => p.estado === "EN_VITRINA");
        setTotalEnVitrina(data.meta.total); // Approximation of inventory count
        const totalVal = data.prendas.reduce((sum: number, p: any) => p.estado === "EN_VITRINA" ? sum + p.precioVenta : sum, 0);
        setValorTotalVitrina(totalVal);
      }
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    cargarInventario();
  };

  const iniciarEdicion = (prenda: any) => {
    setEditId(prenda.id);
    setEditPrecioVenta(prenda.precioVenta.toString());
    setEditValorProveedor((prenda.valorProveedor || prenda.costoProduccion || 0).toString());
    setEditEstado(prenda.estado);
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditPrecioVenta("");
    setEditValorProveedor("");
    setEditEstado("");
  };

  const guardarEdicion = async (id: string) => {
    setGuardandoEdicion(true);
    try {
      const res = await fetch(`/api/prendas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precioVenta: parseInt(editPrecioVenta),
          valorProveedor: parseInt(editValorProveedor),
          estado: editEstado
        })
      });

      if (res.ok) {
        setEditId(null);
        cargarInventario();
      } else {
        const data = await res.json();
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Error guardando cambios: " + err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const eliminarPrenda = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta prenda del inventario?")) return;
    try {
      const res = await fetch(`/api/prendas/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        cargarInventario();
      } else {
        const data = await res.json();
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Error eliminando prenda: " + err.message);
    }
  };

  // Semáforo de antigüedad
  const getAntiguedadBadge = (fechaIngreso: string) => {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - ingreso.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return (
        <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold font-sans">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          Novedad ({diffDays}d)
        </span>
      );
    } else if (diffDays <= 60) {
      return (
        <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold font-sans">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          Rotación ({diffDays}d)
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold font-sans">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Estancado ({diffDays}d)
        </span>
      );
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "EN_VITRINA":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "VENDIDA":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "APARTADA":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "DEVUELTA_PROVEEDOR":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-4xl font-light italic text-white tracking-wide flex items-center gap-3 select-none">
            Inventario{" "}
            <span className="font-bold not-italic bg-gradient-to-r from-[#FCD116] to-[#FFE700] bg-clip-text text-transparent">
              General
            </span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 font-sans">
            Control completo de prendas, precios de venta, costos de consignación y marcas.
          </p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/recepcion"
            className="flex-1 sm:flex-initial bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold px-5 py-3 rounded-xl transition-all duration-300 text-sm shadow-sm flex justify-center items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ingreso de Mercancía
          </Link>
          <Link
            href="/inventario/etiquetas"
            className="flex-1 sm:flex-initial border border-zinc-700 bg-[var(--color-surface-elevated)]/30 hover:bg-[var(--color-surface-elevated)] text-white font-bold px-5 py-3 rounded-xl transition-all duration-300 text-sm flex justify-center items-center gap-2"
          >
            <Barcode className="w-4 h-4" /> Imprimir Etiquetas
          </Link>
        </div>
      </div>

      {/* STATS HERO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border-stitch-gold rounded-2xl p-5 flex items-center gap-4 bg-[var(--color-surface)]">
          <div className="p-3 rounded-xl bg-yellow-400/10 text-yellow-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold font-sans">Total Prendas</p>
            <p className="font-heading text-2xl font-bold text-white mt-0.5">{totalPrendas}</p>
          </div>
        </div>

        <div className="border-stitch-colombia rounded-2xl p-5 flex items-center gap-4 bg-[var(--color-surface)]">
          <div className="p-3 rounded-xl bg-green-400/10 text-green-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold font-sans">Valor Estimado en Página</p>
            <p className="font-heading text-2xl font-bold text-green-400 mt-0.5">{formatCOP(valorTotalVitrina)}</p>
          </div>
        </div>

        <div className="border-stitch-white rounded-2xl p-5 flex items-center gap-4 bg-[var(--color-surface)]">
          <div className="p-3 rounded-xl bg-blue-400/10 text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold font-sans">Página Actual</p>
            <p className="font-heading text-2xl font-bold text-white mt-0.5">{pagina} de {paginasTotales}</p>
          </div>
        </div>
      </div>

      {/* FILTROS DE BÚSQUEDA */}
      <div className="border-stitch-white rounded-3xl p-5 shadow-xl flex flex-col gap-4 bg-[var(--color-surface)]">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
            <input 
              type="text" 
              placeholder="Buscar por código (ej: DP1C003) o descripción..." 
              className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none transition-colors font-sans text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro Estado */}
            <select 
              className="bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none font-sans text-sm"
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
            >
              <option value="">Todos los Estados</option>
              <option value="EN_VITRINA">En Vitrina</option>
              <option value="VENDIDA">Vendida</option>
              <option value="APARTADA">Apartada</option>
              <option value="DEVUELTA_PROVEEDOR">Devuelta a Proveedor</option>
            </select>

            {/* Filtro Proveedor */}
            <select 
              className="bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[var(--color-primary)] focus:outline-none font-sans text-sm max-w-xs"
              value={filtroProveedor}
              onChange={(e) => { setFiltroProveedor(e.target.value); setPagina(1); }}
            >
              <option value="">Todas las Marcas / Diseñadores</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            <button 
              type="submit" 
              className="bg-[var(--color-surface-elevated)] border border-zinc-700 hover:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 text-sm"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE INVENTARIO */}
      <div className="border-stitch-gold rounded-3xl overflow-hidden shadow-2xl bg-[var(--color-surface)]">
        {cargando ? (
          <div className="py-24 flex flex-col justify-center items-center gap-4">
            <div className="animate-spin h-10 w-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
            <p className="font-heading text-lg text-[var(--color-text-secondary)] italic">Cargando inventario...</p>
          </div>
        ) : prendas.length === 0 ? (
          <div className="py-24 text-center text-[var(--color-text-secondary)] font-sans">
            <Package className="w-16 h-16 mx-auto mb-3 opacity-40 text-yellow-400" />
            <p className="text-lg font-bold">No se encontraron prendas</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Prueba cambiando los filtros o agregando prendas nuevas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] text-[10px] sm:text-xs uppercase font-bold font-sans border-b border-zinc-800">
                  <th className="p-4">Código</th>
                  <th className="p-4">Prenda / Referencia</th>
                  <th className="p-4">Proveedor</th>
                  <th className="p-4 text-right">Precio Venta</th>
                  <th className="p-4 text-right">Consignación / Costo</th>
                  <th className="p-4">Ingreso</th>
                  <th className="p-4">Antigüedad</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-white font-sans">
                {prendas.map((prenda) => {
                  const esEditando = editId === prenda.id;
                  return (
                    <tr 
                      key={prenda.id} 
                      className={`hover:bg-[var(--color-surface-elevated)]/20 transition-colors ${esEditando ? 'bg-[var(--color-primary)]/5' : ''}`}
                    >
                      {/* Código */}
                      <td className="p-4 font-mono text-xs font-bold text-yellow-400 select-all">
                        {prenda.codigo}
                      </td>

                      {/* Descripción */}
                      <td className="p-4">
                        <p className="font-medium text-white max-w-xs truncate" title={prenda.descripcion}>
                          {prenda.descripcion}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">{prenda.categoria}</p>
                      </td>

                      {/* Proveedor / Marca */}
                      <td className="p-4 font-semibold text-zinc-300">
                        {prenda.origen === "PRODUCCION_PROPIA" ? (
                          <span className="text-[var(--color-logo-cyan)] font-heading italic">El Parche (Propia)</span>
                        ) : (
                          prenda.proveedor?.nombre
                        )}
                      </td>

                      {/* Precio Venta */}
                      <td className="p-4 text-right">
                        {esEditando ? (
                          <input 
                            type="number" 
                            className="bg-black border border-zinc-700 rounded px-2 py-1 w-24 text-right text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                            value={editPrecioVenta}
                            onChange={(e) => setEditPrecioVenta(e.target.value)}
                          />
                        ) : (
                          <span className="font-bold text-white">{formatCOP(prenda.precioVenta)}</span>
                        )}
                      </td>

                      {/* Costo / Consignación */}
                      <td className="p-4 text-right">
                        {esEditando ? (
                          <input 
                            type="number" 
                            className="bg-black border border-zinc-700 rounded px-2 py-1 w-24 text-right text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                            value={editValorProveedor}
                            onChange={(e) => setEditValorProveedor(e.target.value)}
                          />
                        ) : (
                          <span className="text-zinc-400 font-mono text-xs">
                            {formatCOP(prenda.valorProveedor || prenda.costoProduccion || 0)}
                          </span>
                        )}
                      </td>

                      {/* Fecha de ingreso */}
                      <td className="p-4 font-mono text-xs text-zinc-400">
                        {new Date(prenda.fechaIngreso).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit"
                        })}
                      </td>

                      {/* Antigüedad */}
                      <td className="p-4">
                        {getAntiguedadBadge(prenda.fechaIngreso)}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        {esEditando ? (
                          <select
                            className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]"
                            value={editEstado}
                            onChange={(e) => setEditEstado(e.target.value)}
                          >
                            <option value="EN_VITRINA">En Vitrina</option>
                            <option value="APARTADA">Apartada</option>
                            <option value="VENDIDA">Vendida</option>
                            <option value="DEVUELTA_PROVEEDOR">Devuelta a Proveedor</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getEstadoColor(prenda.estado)}`}>
                            {prenda.estado.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {esEditando ? (
                            <>
                              <button 
                                onClick={() => guardarEdicion(prenda.id)}
                                disabled={guardandoEdicion}
                                className="p-1.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={cancelarEdicion}
                                className="p-1.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => iniciarEdicion(prenda)}
                                className="p-1.5 rounded bg-[var(--color-surface-elevated)] text-zinc-300 border border-zinc-700 hover:border-white/20 hover:text-white"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => eliminarPrenda(prenda.id)}
                                className="p-1.5 rounded bg-red-500/10 text-red-400/80 border border-red-500/20 hover:bg-red-500/20 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* PAGINATION CONTROLS */}
        {!cargando && paginasTotales > 1 && (
          <div className="p-4 bg-[var(--color-surface-elevated)]/30 border-t border-zinc-800 flex justify-between items-center text-xs font-sans text-[var(--color-text-secondary)]">
            <p>
              Mostrando página <span className="font-bold text-white">{pagina}</span> de <span className="font-bold text-white">{paginasTotales}</span> ({totalPrendas} prendas en total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-zinc-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                disabled={pagina === paginasTotales}
                onClick={() => setPagina(p => Math.min(paginasTotales, p + 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-zinc-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
