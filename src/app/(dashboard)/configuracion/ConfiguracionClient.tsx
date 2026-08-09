"use client";

import { useState, useEffect } from "react";
import { Settings, FileText, Server, AlertCircle, RefreshCw } from "lucide-react";

export default function ConfiguracionClient() {
  const [config, setConfig] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab] = useState<"general" | "dian">("dian"); // Default to DIAN per user request
  
  // Forms
  const [regimenIva, setRegimenIva] = useState(false);
  const [numeracionFactura, setNumeracionFactura] = useState(0);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/configuracion", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setRegimenIva(data.regimenIva);
        setNumeracionFactura(data.numeracionFactura);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regimenIva,
          numeracionFactura
        })
      });
      if (res.ok) {
        alert("Configuración guardada");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleExportarLibroFiscal = () => {
    // Reutilizar el endpoint de reportes/exportar o crear uno específico para DIAN
    window.open(`/api/reportes/exportar?mes=${new Date().toISOString().substring(0, 7)}`, "_blank");
  };

  if (cargando) {
    return (
      <div className="flex h-96 justify-center items-center">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 pb-16 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-[var(--color-primary)]" /> Configuración
          </h1>
          <p className="text-[var(--color-text-secondary)]">Ajustes generales, tributarios y de sistema.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-zinc-800 pb-2">
        <button 
          onClick={() => setTab("general")}
          className={`px-4 py-2 font-bold text-sm rounded-t-xl transition-colors ${tab === "general" ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-zinc-400 hover:text-white"}`}
        >
          General
        </button>
        <button 
          onClick={() => setTab("dian")}
          className={`px-4 py-2 font-bold text-sm rounded-t-xl transition-colors ${tab === "dian" ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-zinc-400 hover:text-white"}`}
        >
          DIAN y Libro Fiscal
        </button>
      </div>

      {tab === "dian" && (
        <div className="bg-[var(--color-surface)] border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col gap-8">
          
          <div className="flex items-start gap-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-bold mb-1">Camino A: Libro Fiscal (Régimen Simple)</h4>
              <p className="text-sm text-zinc-300">
                Actualmente El Parche no es responsable de IVA (Régimen Simple). La DIAN exige llevar un <strong>Libro Fiscal de Registro de Operaciones Diarias</strong>. Aquí puedes configurar la numeración y exportar el libro en el formato oficial. La integración con Siigo (Camino B) está preparada para cuando se vuelva responsable de IVA.
              </p>
            </div>
          </div>

          <form onSubmit={handleGuardar} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-white border-b border-zinc-800 pb-2">Parámetros Tributarios</h3>
              
              <label className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                <input 
                  type="checkbox"
                  checked={regimenIva}
                  onChange={e => setRegimenIva(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-black"
                />
                <div>
                  <p className="font-bold text-white text-sm">Responsable de IVA</p>
                  <p className="text-xs text-zinc-500">Marcar si la DIAN cambia la condición tributaria.</p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Consecutivo Actual Libro Fiscal</label>
                <input
                  type="number"
                  value={numeracionFactura}
                  onChange={e => setNumeracionFactura(parseInt(e.target.value) || 0)}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[var(--color-primary)] font-mono"
                />
              </div>

              <button 
                type="submit"
                disabled={guardando}
                className="mt-2 bg-[var(--color-primary)] text-black font-bold py-3 rounded-xl transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--color-secondary)]" /> Exportación DIAN
              </h3>
              
              <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col gap-3">
                <p className="text-sm text-zinc-300">
                  Descarga el libro fiscal oficial para enviarlo a contabilidad o subirlo a los portales de la DIAN.
                </p>
                <button 
                  type="button"
                  onClick={handleExportarLibroFiscal}
                  className="w-full bg-[var(--color-secondary)] hover:bg-[#00BCCC] text-black font-bold py-3 rounded-xl text-sm transition-colors flex justify-center items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Exportar Libro Fiscal (Excel)
                </button>
              </div>

              <h3 className="font-bold text-white border-b border-zinc-800 pb-2 mt-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-zinc-400" /> Integración SIIGO (Futuro)
              </h3>
              
              <div className="p-4 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 flex flex-col gap-3 opacity-60">
                <p className="text-xs text-zinc-400">
                  La API de conexión con SIIGO Nube está lista en la arquitectura del sistema. Cuando sea requerido facturar electrónicamente (Camino B), se habilitarán los campos para los tokens de API.
                </p>
                <button type="button" disabled className="w-full bg-zinc-800 text-zinc-500 font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-2 cursor-not-allowed">
                  <RefreshCw className="w-4 h-4" /> Conectar con SIIGO (Inactivo)
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {tab === "general" && (
        <div className="bg-[var(--color-surface)] border border-zinc-800 rounded-3xl p-6 shadow-xl flex items-center justify-center min-h-[300px] text-zinc-500">
          Opciones generales del negocio (Nombre, NIT, Colores, etc.)
        </div>
      )}

    </div>
  );
}
