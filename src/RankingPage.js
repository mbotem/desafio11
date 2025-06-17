// src/RankingPage.js
import React, { useEffect, useState, useRef } from 'react';
import { db } from './firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import Select from 'react-select';

export default function RankingPage() {
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [equipo1, setEquipo1] = useState(null);
  const [equipo2, setEquipo2] = useState(null);
  const modalRef = useRef();

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'equipos'));
      const snap = await getDocs(q);
      const datos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      datos.sort((a, b) => {
        if (b.elo !== a.elo) return b.elo - a.elo;
        return a.nombre.localeCompare(b.nombre);
      });
      setEquipos(datos);
    })();

    const esc = (e) => e.key === 'Escape' && setModalAbierto(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);

  const equiposFiltrados = equipos.filter(eq =>
    eq.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const opciones = equipos.map(eq => ({ label: eq.nombre, value: eq.nombre }));

  const calcularPuntos = () => {
    if (!equipo1 || !equipo2) return null;
    const eq1 = equipos.find(e => e.nombre === equipo1.value);
    const eq2 = equipos.find(e => e.nombre === equipo2.value);
    const RA = eq1?.elo ?? 1000;
    const RB = eq2?.elo ?? 1000;
    const EA = 1 / (1 + 10 ** ((RB - RA) / 400));
    const EB = 1 - EA;
    const K = 32;
    return {
      winA: Math.round(K * (1 - EA)),
      loseA: Math.round(K * (0 - EA)),
      winB: Math.round(K * (1 - EB)),
      loseB: Math.round(K * (0 - EB)),
    };
  };

  const puntos = calcularPuntos();

  return (
    <div className="p-4">

      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar equipo..."
          className="border p-2 flex-grow"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Simular Partido
        </button>
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Equipo</th>
            <th className="p-2 text-right">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {equiposFiltrados.map((eq, i) => (
            <tr key={eq.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{eq.nombre}</td>
              <td className="p-2 text-right font-bold">{eq.elo}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50 overflow-y-auto">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded w-full max-w-md relative max-h-screen overflow-y-auto"
          >
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-2 right-4 text-gray-500 text-lg"
            >✕</button>
            <h2 className="text-lg font-bold mb-4">Simulador de Puntos</h2>
            <div className="space-y-3">
              <Select
                options={opciones.filter(o => o.value !== equipo2?.value)}
                value={equipo1}
                onChange={setEquipo1}
                placeholder="Equipo 1"
              />
              <Select
                options={opciones.filter(o => o.value !== equipo1?.value)}
                value={equipo2}
                onChange={setEquipo2}
                placeholder="Equipo 2"
              />
              {puntos && (
                <div className="text-sm text-gray-700 mt-2">
                  <p><strong>{equipo1.value}</strong>: +{puntos.winA} / {puntos.loseA}</p>
                  <p><strong>{equipo2.value}</strong>: +{puntos.winB} / {puntos.loseB}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
