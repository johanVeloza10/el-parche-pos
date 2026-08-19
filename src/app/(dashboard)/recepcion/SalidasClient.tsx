"use client";

import { useState, useRef, useEffect } from "react";
import { Search, PackageMinus, X, FileText, CheckCircle2, Barcode, Printer } from "lucide-react";

export default function SalidasClient() {
  const [escaneado, setEscaneado] = useState("");
  const [prendas, setPrendas] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [actaGenerada, setActaGenerada] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Mantener foco en el input del escáner
    if (!actaGenerada) {
      inputRef.current?.focus();
    }
  }, [actaGenerada]);

  const buscarPrenda = async (codigo: string) => {
    if (!codigo.trim()) return;
    setBuscando(true);
    try {
      const res = await fetch(`/api/prendas/buscar?q=${encodeURIComponent(codigo.trim())}`);
      if (res.ok) {
        const data = await res.json();
        
        // Filtrar match exacto de código o código de barras
        const match = data.find((p: any) => 
          p.codigo.toUpperCase() === codigo.trim().toUpperCase() || 
          p.codigoBarras === codigo.trim()
        );

        if (match) {
          if (match.estado !== "EN_VITRINA") {
            alert(`La prenda ${match.codigo} no está disponible en vitrina. Estado actual: ${match.estado}`);
            setEscaneado("");
            return;
          }

          if (prendas.some(p => p.id === match.id)) {
            alert(`La prenda ${match.codigo} ya está en la lista.`);
            setEscaneado("");
            return;
          }

          setPrendas(prev => [...prev, match]);
          setEscaneado("");
        } else {
          alert(`No se encontró ninguna prenda exacta con el código: ${codigo}`);
        }
      }
    } catch (err) {
      console.error("Error buscando prenda:", err);
      alert("Error buscando prenda");
    } finally {
      setBuscando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleEnterScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarPrenda(escaneado);
    }
  };

  const removerPrenda = (id: string) => {
    setPrendas(prev => prev.filter(p => p.id !== id));
  };

  const registrarSalida = async () => {
    if (prendas.length === 0) return;
    if (!confirm(`¿Estás segura de registrar la salida de ${prendas.length} prendas hacia el diseñador?`)) return;

    setGuardando(true);
    try {
      const res = await fetch("/api/prendas/salida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prendasIds: prendas.map(p => p.id),
          observaciones
        })
      });

      if (res.ok) {
        setActaGenerada(true);
      } else {
        const data = await res.json();
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Error registrando salida: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const resetear = () => {
    setPrendas([]);
    setObservaciones("");
    setActaGenerada(false);
    setEscaneado("");
  };

  const imprimirActa = () => {
    const ventana = window.open("", "_blank");
    if (!ventana) return;

    const fecha = new Date().toLocaleString("es-CO");
    const prendasHtml = prendas.map((p, i) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${p.codigo}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.descripcion}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.proveedor?.nombre || '-'}</td>
      </tr>
    `).join("");

    ventana.document.write(`
      <html>
        <head>
          <title>Acta de Devolución - El Parche</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #000; }
            h1 { text-align: center; margin-bottom: 5px; }
            h3 { text-align: center; margin-top: 0; color: #555; font-weight: normal; }
            .info { margin: 30px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { text-align: left; padding: 10px 8px; background: #eee; border-bottom: 2px solid #ccc; }
            .firmas { margin-top: 80px; display: flex; justify-content: space-between; }
            .firma-box { width: 45%; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>EL PARCHE DISEÑO</h1>
          <h3>Acta de Devolución a Diseñador</h3>
          
          <div class="info">
            <p><strong>Fecha y Hora:</strong> ${fecha}</p>
            <p><strong>Total Prendas:</strong> ${prendas.length}</p>
            <p><strong>Observaciones:</strong> ${observaciones || 'Ninguna'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Marca / Proveedor</th>
              </tr>
            </thead>
            <tbody>
              ${prendasHtml}
            </tbody>
          </table>

          <div class="firmas">
            <div class="firma-box">
              Firma Entrega (El Parche)
              <br><br><br>C.C.
            </div>
            <div class="firma-box">
              Firma Recibe (Diseñador)
              <br><br><br>C.C.
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  if (actaGenerada) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[70vh]">
        <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-2">¡Salida Registrada!</h2>
        <p className="text-[var(--color-text-secondary)] mb-8 text-center max-w-md">
          Las prendas han sido marcadas como devueltas. Imprime el acta para que quede constancia física de la entrega.
        </p>

        <div className="flex gap-4">
          <button
            onClick={imprimirActa}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform"
          >
            <Printer className="w-5 h-5" /> Imprimir Acta
          </button>
          
          <button
            onClick={resetear}
            className="flex items-center gap-2 bg-[var(--color-surface-elevated)] text-white font-bold px-8 py-4 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            <PackageMinus className="w-5 h-5" /> Nueva Salida
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col lg:flex-row gap-6">
      
      {/* SCANNER Y OBSERVACIONES */}
      <div className="lg:w-1/3 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Devolución</h1>
          <p className="text-[var(--color-text-secondary)]">Salida de mercancía a diseñadores</p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Escanea el código de barras</label>
          <div className="relative">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-text-muted)]" />
            <input 
              ref={inputRef}
              type="text" 
              className="w-full bg-black border-2 border-[var(--color-surface-elevated)] rounded-xl pl-12 pr-4 py-4 text-white focus:border-[var(--color-primary)] focus:outline-none text-xl font-mono"
              value={escaneado}
              onChange={e => setEscaneado(e.target.value)}
              onKeyDown={handleEnterScan}
              placeholder="Escanea o escribe aquí..."
              disabled={buscando || guardando}
              autoFocus
            />
          </div>
          <button 
            onClick={() => buscarPrenda(escaneado)}
            disabled={!escaneado.trim() || buscando || guardando}
            className="w-full mt-3 bg-[var(--color-surface-elevated)] text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {buscando ? "Buscando..." : "Agregar a Lista"}
          </button>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex-1">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Constancia / Observaciones
          </label>
          <textarea 
            className="w-full bg-black/40 border border-zinc-800 rounded-xl p-4 text-white focus:border-[var(--color-primary)] focus:outline-none h-32 resize-none"
            placeholder="Ej: Se devuelve temporada anterior. Recibe persona encargada."
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            disabled={guardando}
          />
          
          <button
            onClick={registrarSalida}
            disabled={prendas.length === 0 || guardando}
            className="w-full mt-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-2"
          >
            {guardando ? "Registrando..." : "Registrar Salida"}
          </button>
        </div>
      </div>

      {/* LISTA DE PRENDAS */}
      <div className="lg:w-2/3 bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-3xl p-6 shadow-xl flex flex-col">
        <h3 className="text-xl font-bold text-white mb-4 flex justify-between items-center">
          <span>Prendas a Devolver</span>
          <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-3 py-1 rounded-lg text-sm">
            {prendas.length} Items
          </span>
        </h3>

        {prendas.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-[var(--color-text-muted)] opacity-50 py-20">
            <PackageMinus className="w-16 h-16 mb-4" />
            <p className="text-lg">No has escaneado ninguna prenda</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[60vh]">
            {prendas.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between bg-black/40 border border-zinc-800 p-4 rounded-xl group hover:border-[var(--color-primary)]/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-mono font-bold text-[var(--color-primary)] text-sm">{p.codigo}</p>
                    <p className="text-white font-medium">{p.descripcion}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{p.proveedor?.nombre || "Sin marca"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => removerPrenda(p.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Quitar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
