"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Tag, Package, User } from "lucide-react";

export default function InventoryClient() {
  const [prendas, setPrendas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    cargarInventario();
  }, [filtroEstado]);

  const cargarInventario = async () => {
    setCargando(true);
    try {
      const url = new URL("/api/prendas", window.location.origin);
      if (filtroEstado) url.searchParams.append("estado", filtroEstado);
      if (query) url.searchParams.append("q", query);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setPrendas(data.prendas);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    cargarInventario();
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case "EN_VITRINA": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "VENDIDA": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "APARTADA": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventario</h1>
          <p className="text-[var(--color-text-secondary)]">Gestiona las prendas de El Parche</p>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input 
              type="text" 
              placeholder="Buscar código o nombre..." 
              className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl pl-10 pr-4 py-2 text-white focus:border-[var(--color-secondary)] focus:outline-none transition-colors"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          
          <select 
            className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl px-4 py-2 text-white focus:border-[var(--color-secondary)] focus:outline-none appearance-none"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="EN_VITRINA">En Vitrina</option>
            <option value="VENDIDA">Vendidas</option>
            <option value="APARTADA">Apartadas</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-2 border-[var(--color-secondary)] border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pb-10">
          {prendas.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[var(--color-text-muted)]">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron prendas</p>
            </div>
          ) : (
            prendas.map(prenda => (
              <div key={prenda.id} className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-2xl overflow-hidden shadow-lg hover:border-[var(--color-secondary)]/50 transition-colors group">
                <div className="aspect-square bg-[var(--color-surface-elevated)]/50 p-6 flex flex-col items-center justify-center relative">
                  <span className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium border ${getEstadoColor(prenda.estado)}`}>
                    {prenda.estado.replace("_", " ")}
                  </span>
                  <Tag className="w-12 h-12 text-[var(--color-text-muted)] group-hover:text-[var(--color-secondary)] transition-colors" />
                  <span className="mt-3 font-mono text-sm text-[var(--color-text-secondary)]">{prenda.codigo}</span>
                </div>
                
                <div className="p-5 flex flex-col gap-2">
                  <h3 className="font-semibold text-white line-clamp-1" title={prenda.descripcion}>{prenda.descripcion}</h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <User className="w-3 h-3" />
                    <span className="truncate">{prenda.origen === "PRODUCCION_PROPIA" ? "Producción Propia" : prenda.proveedor?.nombre}</span>
                  </div>
                  <div className="mt-2 pt-3 border-t border-[var(--color-surface-elevated)] flex justify-between items-center">
                    <span className="text-xs text-[var(--color-text-muted)]">{prenda.categoria}</span>
                    <span className="font-bold text-[var(--color-primary)]">${prenda.precioVenta.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
