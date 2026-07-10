"use client";

import { useEffect } from "react";
import Barcode from "react-barcode";

interface ClientLabelPrinterProps {
  prenda: any;
}

export default function ClientLabelPrinter({ prenda }: ClientLabelPrinterProps) {
  useEffect(() => {
    // Pequeño delay para asegurar que el código de barras se haya renderizado en el DOM
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatCOP = (num: number) => `$${Math.round(num).toLocaleString('es-CO')}`;

  return (
    <div className="label-container">
      <style jsx global>{`
        @media print {
          @page {
            size: 40mm 25mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #000000;
          }
          .no-print {
            display: none !important;
          }
        }
        
        /* Estilos de visualización en pantalla simulando la etiqueta física */
        .label-card {
          width: 40mm;
          height: 25mm;
          padding: 1.5mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          background-color: #ffffff;
          color: #000000;
          overflow: hidden;
          font-family: 'Courier New', Courier, monospace;
        }

        .label-header {
          font-size: 6.5px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
          margin-bottom: 0.5mm;
        }

        .label-desc {
          font-size: 6px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          font-weight: bold;
        }

        .barcode-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: -1mm;
          margin-bottom: -1mm;
        }

        .label-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          font-size: 7px;
          font-weight: bold;
          padding: 0 1mm;
        }
      `}</style>

      {/* Botón flotante para imprimir manualmente si no se autodispara */}
      <div className="no-print fixed top-4 right-4 bg-zinc-900 text-white p-3 rounded-lg shadow-lg border border-zinc-800 flex gap-2 items-center">
        <button
          onClick={() => window.print()}
          className="bg-[var(--color-primary)] text-black font-bold px-4 py-2 rounded text-sm hover:opacity-90"
        >
          🖨️ Imprimir Etiqueta
        </button>
        <button
          onClick={() => window.close()}
          className="bg-zinc-800 text-white font-bold px-4 py-2 rounded text-sm hover:bg-zinc-700"
        >
          Cerrar
        </button>
      </div>

      {/* Contenedor de la Etiqueta */}
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center no-print">
        <div className="border border-dashed border-zinc-700 p-2 rounded-lg bg-zinc-900">
          <div className="text-zinc-400 text-[10px] text-center mb-1.5 font-sans">Vista Previa Etiqueta (40x25mm)</div>
          <div className="label-card shadow-2xl">
            <div className="label-header">EL PARCHE BOUTIQUE</div>
            <div className="label-desc">{prenda.descripcion}</div>
            <div className="barcode-wrapper">
              <Barcode
                value={prenda.codigo}
                width={1.0}
                height={28}
                fontSize={7}
                margin={0}
                background="#ffffff"
                lineColor="#000000"
              />
            </div>
            <div className="label-footer">
              <span>Talla: {prenda.talla}</span>
              <span>{formatCOP(prenda.precioVenta)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Versión limpia que se imprimirá */}
      <div className="hidden print:block">
        <div className="label-card">
          <div className="label-header">EL PARCHE BOUTIQUE</div>
          <div className="label-desc">{prenda.descripcion}</div>
          <div className="barcode-wrapper">
            <Barcode
              value={prenda.codigo}
              width={1.0}
              height={28}
              fontSize={7}
              margin={0}
              background="#ffffff"
              lineColor="#000000"
            />
          </div>
          <div className="label-footer">
            <span>Talla: {prenda.talla}</span>
            <span>{formatCOP(prenda.precioVenta)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
