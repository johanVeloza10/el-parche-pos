import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function TiquetePosPage({ params }: { params: { id: string } }) {
  const venta = await db.venta.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          prenda: true,
        }
      },
      cliente: true,
      usuario: true,
      documentoFiscal: true,
    }
  });

  if (!venta) {
    redirect("/pos");
  }

  // Tiquete de 80mm: Aprox 300px o 80mm width.
  return (
    <div className="bg-white text-black min-h-screen flex justify-center p-4 print:p-0 print:bg-transparent">
      <div className="w-[80mm] max-w-[80mm] print:w-[80mm] text-xs font-mono">
        
        {/* Encabezado */}
        <div className="text-center mb-4 flex flex-col items-center">
          {/* Logo placeholder o texto */}
          <div className="font-bold text-lg mb-1">EL PARCHE BOUTIQUE</div>
          <div>NIT: 123456789-0</div>
          <div>Bogotá, Colombia</div>
          <div>Régimen Simplificado (No responsable de IVA)</div>
          <div className="mt-2 font-bold uppercase">
            {venta.documentoFiscal?.tipo === "FACTURA_ELECTRONICA" 
              ? `Factura Electrónica` 
              : `Documento Equivalente POS`}
          </div>
          <div className="font-bold text-sm">
            N° {venta.documentoFiscal?.numero || "Borrador"}
          </div>
        </div>

        {/* Datos Venta */}
        <div className="border-t border-dashed border-black py-2 mb-2">
          <div>Fecha: {venta.fechaHora.toLocaleString('es-CO')}</div>
          <div>Cajero: {venta.usuario.nombre}</div>
          {venta.cliente && (
            <>
              <div>Cliente: {venta.cliente.nombre}</div>
              <div>CC/NIT: {venta.cliente.numeroDocumento}</div>
            </>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-b border-dashed border-black py-2 mb-2">
          <table className="w-full text-left">
            <thead>
              <tr className="font-bold">
                <th className="w-8">Cant</th>
                <th>Descripción</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="pt-1">1</td>
                  <td className="pt-1">
                    {item.prenda.descripcion}
                    <div className="text-[10px] text-gray-600">Cod: {item.prenda.codigo}</div>
                    {item.descuentoItem > 0 && (
                      <div className="text-[10px] italic">- Dcto: ${item.descuentoItem.toLocaleString('es-CO')}</div>
                    )}
                  </td>
                  <td className="text-right pt-1">${item.precioVenta.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="text-right space-y-1 mb-4">
          <div>Subtotal: ${venta.subtotal.toLocaleString('es-CO')}</div>
          {venta.descuento > 0 && (
            <div>Descuento Total: -${venta.descuento.toLocaleString('es-CO')}</div>
          )}
          <div className="font-bold text-lg">TOTAL: ${venta.total.toLocaleString('es-CO')}</div>
          <div className="text-[10px] mt-1 uppercase">Medio de pago: {venta.medioPago}</div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] mt-4 border-t border-dashed border-black pt-4">
          <p className="font-bold mb-1">¡Gracias por tu compra en El Parche!</p>
          <p>Para cambios o garantías conserva este recibo.</p>
          <p>Plazo máximo de cambio: 30 días.</p>
        </div>

        {/* Imprimir Script (Auto-print al cargar) */}
        <script dangerouslySetInnerHTML={{
          __html: `window.onload = function() { window.print(); }`
        }} />
      </div>
    </div>
  );
}
