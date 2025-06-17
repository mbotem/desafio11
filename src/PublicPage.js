// src/HomePage.js
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Trophy, Clock, History } from 'lucide-react'; // Iconos

export default function HomePage() {
  const [topEquipos, setTopEquipos] = useState([]);
  const [proximosPartidos, setProximosPartidos] = useState([]);
  const [ultimosPartidos, setUltimosPartidos] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const equiposSnap = await getDocs(query(collection(db, 'equipos')));
      const equiposOrdenados = equiposSnap.docs
        .map(doc => doc.data())
        .filter(e => e.nombre)
        .sort((a, b) => {
          const diff = (b.elo ?? 1000) - (a.elo ?? 1000);
          return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
        });
      setTopEquipos(equiposOrdenados.slice(0, 10));

      const partidosSnap = await getDocs(query(collection(db, 'partidos'), orderBy('fecha', 'desc'), orderBy('hora', 'desc')));
      const partidos = partidosSnap.docs.map(doc => doc.data());

      const jugados = partidos.filter(p => p.resultado1 !== '' && p.resultado2 !== '').slice(0, 5);
      const pendientes = partidos.filter(p => p.resultado1 === '' && p.resultado2 === '').slice(0, 5);

      setUltimosPartidos(jugados);
      setProximosPartidos(pendientes);
    };

    cargarDatos();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="text-yellow-600" />
          <h2 className="text-xl font-bold">Top 10 del Ranking</h2>
        </div>
        <table className="min-w-full border rounded shadow text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Pos</th>
              <th className="p-2 border text-left">Equipo</th>
              <th className="p-2 border text-right">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {topEquipos.map((e, i) => (
              <tr key={e.nombre} className="hover:bg-gray-50">
                <td className="p-2 border">{i + 1}</td>
                <td className="p-2 border">{e.nombre}</td>
                <td className="p-2 border text-right">{e.elo ?? 1000}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="text-blue-600" />
          <h2 className="text-xl font-bold">Próximos Partidos</h2>
        </div>
        <ul className="space-y-2">
          {proximosPartidos.map((p, i) => (
            <li key={i} className="border p-2 rounded hover:bg-gray-50">
              <div className="text-gray-600 text-sm">{p.fecha} {p.hora} hrs</div>
              <div className="font-medium">{p.equipo1} vs {p.equipo2}</div>
              <div className="text-xs text-gray-500">{p.club} {p.direccion && `(${p.direccion})`}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <History className="text-red-600" />
          <h2 className="text-xl font-bold">Últimos Resultados</h2>
        </div>
        <ul className="space-y-2">
          {ultimosPartidos.map((p, i) => (
            <li key={i} className="border p-2 rounded hover:bg-gray-50">
              <div className="text-gray-600 text-sm">{p.fecha} {p.hora} hrs</div>
              <div className="font-medium">
                {p.equipo1} {p.resultado1} - {p.resultado2} {p.equipo2}
              </div>
              <div className="text-xs text-gray-500">{p.club} {p.direccion && `(${p.direccion})`}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
