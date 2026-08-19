"use client";

import { useState } from "react";
import ReceptionClient from "./ReceptionClient";
import SalidasClient from "./SalidasClient";
import { PackagePlus, PackageMinus } from "lucide-react";

export default function RecepcionContainer() {
  const [tab, setTab] = useState<"INGRESO" | "SALIDA">("INGRESO");

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-2">
        <div className="flex bg-[var(--color-surface)] border border-[var(--color-surface-elevated)] rounded-xl p-1 w-fit max-w-full overflow-x-auto">
          <button
            onClick={() => setTab("INGRESO")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${tab === "INGRESO" ? "bg-[var(--color-primary)] text-black shadow-md" : "text-[var(--color-text-secondary)] hover:text-white"}`}
          >
            <PackagePlus className="w-5 h-5" /> Ingreso de Mercancía
          </button>
          <button
            onClick={() => setTab("SALIDA")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${tab === "SALIDA" ? "bg-[var(--color-primary)] text-black shadow-md" : "text-[var(--color-text-secondary)] hover:text-white"}`}
          >
            <PackageMinus className="w-5 h-5" /> Devolución a Diseñador
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {tab === "INGRESO" ? <ReceptionClient /> : <SalidasClient />}
      </div>
    </div>
  );
}
