"use client";

import React, { useState, useEffect } from "react";
import { Search, Receipt, CreditCard, Banknote, Landmark, X, Plus, CheckCircle, Clock } from "lucide-react";

interface Prenda {
  id: string;
  codigo: string;
  descripcion: string;
}

interface Apartado {
  id: string;
  fecha: string;
  clienteNombre: string;
  clienteId: string;
  prenda: Prenda;
  total: number;
  abono: number;
  estado: "VIGENTE" | "COMPLETADO";
}

type ModalAction = "ABONAR" | "LIQUIDAR" | null;

export default function ApartadosClient() {
  const [apartados, setApartados] = useState<Apartado[]>([]);
  const [filteredApartados, setFilteredApartados] = useState<Apartado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [selectedApartado, setSelectedApartado] = useState<Apartado | null>(null);
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [medioPago, setMedioPago] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA">("EFECTIVO");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApartados = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/apartados");
      if (res.ok) {
        const data = await res.json();
        setApartados(data);
        setFilteredApartados(data);
      }
    } catch (error) {
      console.error("Error fetching apartados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartados();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredApartados(
      apartados.filter(
        (a) =>
          a.clienteNombre.toLowerCase().includes(term) ||
          a.clienteId.toLowerCase().includes(term) ||
          a.prenda.codigo.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, apartados]);

  const openModal = (apartado: Apartado, action: ModalAction) => {
    setSelectedApartado(apartado);
    setModalAction(action);
    setMedioPago("EFECTIVO");
    if (action === "LIQUIDAR") {
      setMontoAbono(apartado.total - apartado.abono);
    } else {
      setMontoAbono("");
    }
  };

  const closeModal = () => {
    setModalAction(null);
    setSelectedApartado(null);
    setMontoAbono("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApartado || !modalAction) return;

    const monto = Number(montoAbono);
    if (isNaN(monto) || monto <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/apartados/${selectedApartado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nuevoAbono: monto,
          medioPago,
          liquidar: modalAction === "LIQUIDAR",
        }),
      });

      if (res.ok) {
        await fetchApartados();
        closeModal();
      } else {
        console.error("Error updating apartado");
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 text-[#F8FAFC] min-h-screen bg-[#0F0F1A] font-inter">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-[#F8FAFC]">Apartados</h1>
          <p className="text-[#94A3B8] mt-1">Gestión de prendas separadas y abonos</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#94A3B8]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-[#252540] rounded-xl leading-5 bg-[#1A1A2E] text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:border-[#D4A017] transition-colors sm:text-sm"
            placeholder="Buscar por cliente, ID o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-[#1A1A2E] rounded-2xl border border-[#252540] overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-10 text-center text-[#94A3B8]">Cargando apartados...</div>
        ) : filteredApartados.length === 0 ? (
          <div className="p-10 text-center text-[#94A3B8]">No se encontraron apartados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#252540]">
              <thead className="bg-[#252540]/50">
                <tr>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha / Estado</th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Prenda</th>
                  <th scope="col" className="px-4 py-4 text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-4 py-4 text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Abono / Saldo</th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252540]">
                {filteredApartados.map((apartado) => {
                  const saldo = apartado.total - apartado.abono;
                  return (
                    <tr key={apartado.id} className="hover:bg-[#252540]/30 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#F8FAFC]">
                          {new Date(apartado.fecha).toLocaleDateString("es-CO")}
                        </div>
                        <div className="mt-1 flex items-center">
                          {apartado.estado === "COMPLETADO" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#10B981]/20 text-[#10B981]">
                              <CheckCircle className="w-3 h-3 mr-1" /> COMPLETADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F59E0B]/20 text-[#F59E0B]">
                              <Clock className="w-3 h-3 mr-1" /> VIGENTE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#F8FAFC]">{apartado.clienteNombre}</div>
                        <div className="text-xs text-[#94A3B8]">ID: {apartado.clienteId}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-[#F8FAFC]">{apartado.prenda.codigo}</div>
                        <div className="text-xs text-[#94A3B8] truncate max-w-[150px]">{apartado.prenda.descripcion}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-[#F8FAFC]">
                        {formatMoney(apartado.total)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-[#10B981]">{formatMoney(apartado.abono)}</div>
                        <div className="text-xs text-[#EF4444] mt-1 font-medium">{formatMoney(saldo)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => window.open(`/api/apartados/${apartado.id}/ticket`, "_blank")}
                            className="p-2 bg-[#252540] hover:bg-[#D4A017] hover:text-white text-[#D4A017] rounded-lg transition-colors group"
                            title="Ver Ticket"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          
                          {apartado.estado === "VIGENTE" && (
                            <>
                              <button
                                onClick={() => openModal(apartado, "ABONAR")}
                                className="px-3 py-2 bg-[#252540] hover:bg-[#0891B2] text-[#0891B2] hover:text-white rounded-lg transition-colors text-xs flex items-center h-10"
                                title="Abonar"
                              >
                                <Plus className="w-3 h-3 md:mr-1" /> <span className="hidden md:inline">Abonar</span>
                              </button>
                              <button
                                onClick={() => openModal(apartado, "LIQUIDAR")}
                                className="px-3 py-2 bg-[#C41E3A] hover:bg-[#E63946] active:bg-[#8B1425] text-white rounded-lg transition-colors text-xs flex items-center shadow-lg shadow-[#C41E3A]/20 h-10"
                                title="Liquidar"
                              >
                                <CheckCircle className="w-3 h-3 md:mr-1" /> <span className="hidden md:inline">Liquidar</span>
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
      </div>

      {/* Modal */}
      {modalAction && selectedApartado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#252540] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#252540] flex justify-between items-center bg-[#252540]/30">
              <h3 className="text-xl font-outfit font-bold text-[#F8FAFC]">
                {modalAction === "ABONAR" ? "Registrar Abono" : "Liquidar Apartado"}
              </h3>
              <button onClick={closeModal} className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="mb-6 p-4 bg-[#252540]/50 rounded-xl border border-[#252540]">
                <p className="text-sm text-[#94A3B8] mb-1">Prenda: <span className="text-[#F8FAFC] font-medium">{selectedApartado.prenda.codigo}</span></p>
                <p className="text-xs text-[#94A3B8] mb-3">{selectedApartado.prenda.descripcion}</p>
                <div className="flex justify-between items-center pt-3 border-t border-[#252540]/50">
                  <span className="text-sm text-[#94A3B8]">Saldo Pendiente:</span>
                  <span className="text-lg font-bold text-[#EF4444]">
                    {formatMoney(selectedApartado.total - selectedApartado.abono)}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Monto {modalAction === "ABONAR" ? "del Abono" : "a Pagar"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#94A3B8]">$</span>
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedApartado.total - selectedApartado.abono}
                      value={montoAbono}
                      onChange={(e) => setMontoAbono(Number(e.target.value))}
                      readOnly={modalAction === "LIQUIDAR"}
                      className={`block w-full pl-8 pr-3 py-3 border border-[#252540] rounded-xl leading-5 bg-[#0F0F1A] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4A017] transition-colors sm:text-sm ${
                        modalAction === "LIQUIDAR" ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Medio de Pago</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setMedioPago("EFECTIVO")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all h-20 ${
                        medioPago === "EFECTIVO"
                          ? "border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]"
                          : "border-[#252540] bg-[#0F0F1A] text-[#94A3B8] hover:border-[#D4A017]/50"
                      }`}
                    >
                      <Banknote className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedioPago("TARJETA")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all h-20 ${
                        medioPago === "TARJETA"
                          ? "border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]"
                          : "border-[#252540] bg-[#0F0F1A] text-[#94A3B8] hover:border-[#D4A017]/50"
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Tarjeta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedioPago("TRANSFERENCIA")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all h-20 ${
                        medioPago === "TRANSFERENCIA"
                          ? "border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]"
                          : "border-[#252540] bg-[#0F0F1A] text-[#94A3B8] hover:border-[#D4A017]/50"
                      }`}
                    >
                      <Landmark className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Transf.</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting || !montoAbono}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-[#C41E3A] hover:bg-[#E63946] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C41E3A] focus:ring-offset-[#1A1A2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-inter min-h-[48px] items-center"
                >
                  {isSubmitting ? "Procesando..." : modalAction === "ABONAR" ? "Confirmar Abono" : "Confirmar Liquidación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
