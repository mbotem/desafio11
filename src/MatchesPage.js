// src/PartidosPage.js
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function PartidosPage() {
  const [partidos, setPartidos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    cargarEquipos();
    cargarPartidos();
  }, []);

  const cargarEquipos = async () => {
    const snap = await getDocs(collection(db, 'equipos'));
    const nombres = snap.docs.map(d => d.data().nombre).filter(Boolean);
    setEquipos(nombres);
  };

  const cargarPartidos = async () => {
    const q = query(
      collection(db, 'partidos'),
      orderBy('fecha', 'desc'),
      orderBy('hora', 'desc')
    );
    const snap = await getDocs(q);
    setPartidos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const destacar = (a, b) => {
    if (a === '' || b === '') return '';
    if (parseInt(a, 10) > parseInt(b, 10)) return 'text-green-600 font-bold';
    return '';
  };

  const partidosFiltrados = partidos.filter(p => {
    const texto = `${p.equipo1} ${p.equipo2} ${p.club} ${p.fecha}`.toLowerCase();
    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    const esJugado = p.resultado1 !== '' && p.resultado2 !== '';
    if (filtro === 'pendientes') return coincideBusqueda && !esJugado;
    if (filtro === 'jugados') return coincideBusqueda && esJugado;
    return coincideBusqueda;
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar por equipo, club o fecha"
          className="border p-2 rounded w-full md:w-2/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${filtro === 'pendientes' ? 'bg-blue-600 text-white' : 'border-gray-400'}`}
            onClick={() => setFiltro('pendientes')}
          >Pendientes</button>
          <button
            className={`px-3 py-1 rounded border ${filtro === 'jugados' ? 'bg-blue-600 text-white' : 'border-gray-400'}`}
            onClick={() => setFiltro('jugados')}
          >Jugados</button>
          <button
            className={`px-3 py-1 rounded border ${filtro === 'todos' ? 'bg-blue-600 text-white' : 'border-gray-400'}`}
            onClick={() => setFiltro('todos')}
          >Todos</button>
        </div>
      </div>

      <div className="space-y-4">
        {partidosFiltrados.map((p) => {
          const RA = 1000;
          const RB = 1000;
          const EA = 1 / (1 + 10 ** ((RB - RA) / 400));
          const EB = 1 - EA;
          const K = 32;
          const winA = Math.round(K * (1 - EA));
          const loseA = Math.round(K * (0 - EA));
          const winB = Math.round(K * (1 - EB));
          const loseB = Math.round(K * (0 - EB));

          return (
            <div key={p.id} className="bg-white shadow rounded-lg p-4 border hover:bg-gray-50">
              <div className="text-sm text-gray-500 mb-1">{p.fecha} - {p.hora} hrs</div>
              <div className="text-xs text-gray-700 mb-2">Cancha: {p.club} {p.direccion && `(${p.direccion})`}</div>
              <div className="grid grid-cols-3 items-center mb-1">
                <div className={`text-lg ${destacar(p.resultado1, p.resultado2)}`}>{p.equipo1}</div>
                <div className="text-2xl font-bold text-center">
                  {p.resultado1 ?? '-'} <span className="text-sm">vs</span> {p.resultado2 ?? '-'}
                </div>
                <div className={`text-lg text-right ${destacar(p.resultado2, p.resultado1)}`}>{p.equipo2}</div>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Puntos en juego:</strong> {p.equipo1}: +{winA}/{loseA} | {p.equipo2}: +{winB}/{loseB}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
