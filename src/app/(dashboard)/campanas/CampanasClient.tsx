'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Tag, Calendar, Plus, X, AlertCircle } from 'lucide-react';

interface Bono {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  usoMaximo: number | null;
  usosActuales: number;
  activo: boolean;
  createdAt: string;
}

export default function CampanasClient() {
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'PORCENTAJE' | 'VALOR_FIJO'>('PORCENTAJE');
  const [valor, setValor] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [usoMaximo, setUsoMaximo] = useState('');

  const fetchBonos = async () => {
    try {
      const res = await fetch('/api/bonos');
      if (res.ok) {
        const data = await res.json();
        setBonos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/bonos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          nombre,
          tipo,
          valor: parseFloat(valor),
          fechaFin: fechaFin || null,
          usoMaximo: usoMaximo ? parseInt(usoMaximo) : null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || 'Error al crear el bono');
        return;
      }

      setShowModal(false);
      fetchBonos();
      // Reset form
      setCodigo('');
      setNombre('');
      setTipo('PORCENTAJE');
      setValor('');
      setFechaFin('');
      setUsoMaximo('');
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const formatearValor = (tipo: string, valor: number) => {
    if (tipo === 'PORCENTAJE') {
      return `${valor}%`;
    }
    return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
  };

  const obtenerEstado = (bono: Bono) => {
    if (!bono.activo) return { texto: 'Inactivo', color: 'text-red-500' };
    const now = new Date();
    if (bono.fechaFin && new Date(bono.fechaFin) < now) return { texto: 'Vencido', color: 'text-yellow-500' };
    if (bono.usoMaximo !== null && bono.usosActuales >= bono.usoMaximo) return { texto: 'Agotado', color: 'text-orange-500' };
    return { texto: 'Activo', color: 'text-green-500' };
  };

  if (loading) {
    return <div className="p-8 text-[#F8FAFC]">Cargando...</div>;
  }

  return (
    <div className="p-8 bg-[#0F0F1A] min-h-screen text-[#F8FAFC]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="text-[#FCD116] h-8 w-8" />
            Campañas y Bonos
          </h1>
          <p className="text-gray-400 mt-2">Gestiona los códigos de descuento y promociones</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#FCD116] hover:bg-[#D4A017] text-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Bono
        </button>
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-[#252540] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#252540] text-gray-300">
            <tr>
              <th className="py-4 px-6 font-semibold">Código</th>
              <th className="py-4 px-6 font-semibold">Campaña</th>
              <th className="py-4 px-6 font-semibold">Valor</th>
              <th className="py-4 px-6 font-semibold">Usos</th>
              <th className="py-4 px-6 font-semibold">Vencimiento</th>
              <th className="py-4 px-6 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252540]">
            {bonos.map((bono) => {
              const estado = obtenerEstado(bono);
              return (
                <tr key={bono.id} className="hover:bg-[#2A2A4A] transition-colors">
                  <td className="py-4 px-6">
                    <span className="bg-[#252540] px-2 py-1 rounded text-[#FCD116] font-mono border border-[#353550]">
                      {bono.codigo}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium">{bono.nombre}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-gray-400" />
                      {formatearValor(bono.tipo, bono.valor)}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {bono.usosActuales} / {bono.usoMaximo === null ? '∞' : bono.usoMaximo}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {bono.fechaFin ? new Date(bono.fechaFin).toLocaleDateString('es-CO') : 'Sin fecha'}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold">
                    <span className={estado.color}>{estado.texto}</span>
                  </td>
                </tr>
              );
            })}
            {bonos.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No hay bonos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A2E] rounded-xl border border-[#252540] w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#252540]">
              <h2 className="text-xl font-bold">Crear Nuevo Bono</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Campaña</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#0F0F1A] border border-[#252540] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FCD116]"
                  placeholder="Ej: Descuento Navidad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Código Promocional</label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="w-full bg-[#0F0F1A] border border-[#252540] rounded-lg px-4 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#FCD116]"
                  placeholder="NAVIDAD24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as 'PORCENTAJE' | 'VALOR_FIJO')}
                    className="w-full bg-[#0F0F1A] border border-[#252540] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FCD116]"
                  >
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="VALOR_FIJO">Valor Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step={tipo === 'PORCENTAJE' ? '0.1' : '100'}
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full bg-[#0F0F1A] border border-[#252540] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FCD116]"
                    placeholder={tipo === 'PORCENTAJE' ? '10' : '5000'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Límite de Usos (Opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={usoMaximo}
                    onChange={(e) => setUsoMaximo(e.target.value)}
                    className="w-full bg-[#0F0F1A] border border-[#252540] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FCD116]"
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Límite (Opcional)</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full bg-[#0F0F1A] border border-[#252540] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FCD116]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FCD116] hover:bg-[#D4A017] text-black font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Crear Bono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
