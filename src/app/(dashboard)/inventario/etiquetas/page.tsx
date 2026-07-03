"use client";

import { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { Printer, X, Tag } from "lucide-react";

type PrendaResumen = {
  id: string;
  codigo: string;
  descripcion: string;
  precioVenta: number;
};

export default function EtiquetasPage() {
  const [prendas, setPrendas] = useState<PrendaResumen[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<PrendaResumen[]>([]);
  const [formato, setFormato] = useState<"TERMO" | "A4">("TERMO");
  const [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => {
    // Fetch last 50 garments for easy selection
    fetch("/api/prendas")
      .then(r => r.json())
      .then(data => {
        if (data.prendas) setPrendas(data.prendas);
        else if (Array.isArray(data)) setPrendas(data);
      })
      .catch(e => console.error("Error fetching prendas:", e));
  }, []);

  const toggleSeleccion = (prenda: PrendaResumen) => {
    if (seleccionadas.find(p => p.id === prenda.id)) {
      setSeleccionadas(seleccionadas.filter(p => p.id !== prenda.id));
    } else {
      setSeleccionadas([...seleccionadas, prenda]);
    }
  };

  const handleImprimir = () => {
    setImprimiendo(true);
    setTimeout(() => {
      window.print();
      setImprimiendo(false);
    }, 500);
  };

  // VISTA DE IMPRESIÓN (Oculta todo lo demás)
  if (imprimiendo) {
    return (
      <div className={`print-container bg-white text-black min-h-screen ${formato === "TERMO" ? "w-[50mm]" : "w-[210mm] p-[10mm] mx-auto grid grid-cols-4 gap-4"}`}>
        {seleccionadas.map((p, idx) => (
          <div key={idx} className={
            formato === "TERMO" 
              ? "w-[50mm] h-[25mm] overflow-hidden flex flex-col items-center justify-center p-1 border-b border-dashed border-gray-300 page-break-after"
              : "border border-gray-300 p-2 flex flex-col items-center justify-center h-[35mm] rounded"
          }>
            <div className="font-bold text-[10px] text-center leading-tight truncate w-full px-1 mb-1">
              EL PARCHE
            </div>
            {/* Barcode EAN-13 style using CODE128 for alphanumeric codes like PAR-2026-0001 */}
            <div className="scale-75 origin-top mb-1">
              <Barcode 
                value={p.codigo} 
                format="CODE128"
                width={1.5} 
                height={30} 
                displayValue={true}
                fontSize={12}
                margin={0}
              />
            </div>
            <div className="font-bold text-[11px]">
              ${p.precioVenta.toLocaleString('es-CO')}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // VISTA DE CONFIGURACIÓN
  return (
    <div className="p-6 max-w-4xl mx-auto print:hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2">
            <Tag className="w-6 h-6" /> Generador de Etiquetas
          </h1>
          <p className="text-zinc-400 mt-1">
            Selecciona las prendas recién ingresadas para generar sus códigos de barras.
          </p>
        </div>
        
        {seleccionadas.length > 0 && (
          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 bg-[var(--color-secondary)] text-white px-6 py-3 rounded-lg font-bold hover:brightness-110 transition"
          >
            <Printer className="w-5 h-5" />
            Imprimir {seleccionadas.length} Etiquetas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[var(--color-bg-light)] p-4 rounded-xl border border-zinc-800">
          <h2 className="font-bold mb-4">Últimos Ingresos ({prendas.length})</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {prendas.map(p => {
              const isSelected = seleccionadas.some(s => s.id === p.id);
              return (
                <div 
                  key={p.id}
                  onClick={() => toggleSeleccion(p)}
                  className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition border ${
                    isSelected 
                      ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/10' 
                      : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
                  }`}
                >
                  <div>
                    <div className="font-bold">{p.codigo}</div>
                    <div className="text-sm text-zinc-400 line-clamp-1">{p.descripcion}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--color-primary)]">
                      ${p.precioVenta.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--color-bg-light)] p-4 rounded-xl border border-zinc-800 h-fit">
          <h2 className="font-bold mb-4">Formato de Impresión</h2>
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition">
              <input 
                type="radio" 
                name="formato" 
                className="mt-1"
                checked={formato === "TERMO"}
                onChange={() => setFormato("TERMO")}
              />
              <div>
                <div className="font-bold">Impresora Térmica Pequeña</div>
                <div className="text-sm text-zinc-400">Rollo de stickers individuales. Medida recomendada: 50mm x 25mm.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition">
              <input 
                type="radio" 
                name="formato" 
                className="mt-1"
                checked={formato === "A4"}
                onChange={() => setFormato("A4")}
              />
              <div>
                <div className="font-bold">Hojas Tamaño Carta (A4)</div>
                <div className="text-sm text-zinc-400">Planchas de etiquetas para imprimir en impresora láser o tinta normal.</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
