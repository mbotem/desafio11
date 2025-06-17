import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export default function EquiposPage() {
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargarEquipos = async () => {
      const snapshot = await getDocs(query(collection(db, 'equipos')));
      const equiposData = snapshot.docs.map((doc) => doc.data());

      const equiposOrdenados = equiposData
        .filter((e) => e.nombre)
        .sort((a, b) => {
          const diff = (b.elo ?? 1000) - (a.elo ?? 1000);
          if (diff !== 0) return diff;
          return a.nombre.localeCompare(b.nombre);
        })
        .map((equipo, index) => ({ ...equipo, posicion: index + 1 }));

      setEquipos(equiposOrdenados);
    };

    cargarEquipos();
  }, []);

  const equiposFiltrados = equipos.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <input
        type="text"
        placeholder="Buscar equipo"
        className="border p-2 rounded mb-4 w-full"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Posición</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Barrio</th>
              <th className="p-2 border">Club</th>
              <th className="p-2 border">Categoría</th>
              <th className="p-2 border">Capitán</th>
              <th className="p-2 border">Teléfono</th>
              <th className="p-2 border">Jugadores</th>
              <th className="p-2 border">Puntos Ranking</th>
            </tr>
          </thead>
          <tbody>
            {equiposFiltrados.map((eq) => (
              <tr key={eq.nombre} className="hover:bg-gray-50">
                <td className="p-2 border">{eq.posicion}</td>
                <td className="p-2 border">{eq.nombre}</td>
                <td className="p-2 border">{eq.barrio}</td>
                <td className="p-2 border">{eq.club}</td>
                <td className="p-2 border">{eq.categoria}</td>
                <td className="p-2 border">{eq.capitan}</td>
                <td className="p-2 border">{eq.telefono}</td>
                <td className="p-2 border">{(eq.jugadores || []).join(', ')}</td>
                <td className="p-2 border font-semibold">{eq.elo ?? 1000}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
