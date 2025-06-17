import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  where,
} from 'firebase/firestore';
import Select from 'react-select';

export default function AdminPartidosPage() {
  const [partidos, setPartidos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [partidoActual, setPartidoActual] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const modalRef = useRef();

  const [nuevoPartido, setNuevoPartido] = useState({
    equipo1: '',
    equipo2: '',
    club: '',
    direccion: '',
    fecha: '',
    hora: '',
    resultado1: '',
    resultado2: '',
  });

  useEffect(() => {
    cargarEquipos();
    cargarPartidos();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') cerrarModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cargarEquipos = async () => {
    const snapshot = await getDocs(collection(db, 'equipos'));
    const equiposData = snapshot.docs
        .map((doc) => doc.data().nombre)
        .filter(Boolean) // por si hay nombres vacíos o undefined
        .sort((a, b) => a.localeCompare(b));
    setEquipos(equiposData);
    };


  const cargarPartidos = async () => {
    const q = query(
      collection(db, 'partidos'),
      orderBy('fecha', 'desc'),
      orderBy('hora', 'desc')
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPartidos(data);
  };

  const abrirModal = (partido = null) => {
    setPartidoActual(partido);
    setNuevoPartido(
      partido || {
        equipo1: '',
        equipo2: '',
        club: '',
        direccion: '',
        fecha: '',
        hora: '',
        resultado1: '',
        resultado2: '',
      }
    );
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPartidoActual(null);
  };

  const handleChangeSelect = (name, option) => {
    setNuevoPartido((prev) => ({ ...prev, [name]: option ? option.value : '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPartido((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nuevoPartido.equipo1 || !nuevoPartido.equipo2) {
        alert('Debes seleccionar ambos equipos antes de guardar el partido.');
        return;
    }
    if (
        nuevoPartido.resultado1 !== '' &&
        nuevoPartido.resultado2 !== '' &&
        nuevoPartido.fecha &&
        nuevoPartido.hora
    ) {
        const partidoDateTime = new Date(`${nuevoPartido.fecha}T${nuevoPartido.hora}`);
        const ahora = new Date();
        if (partidoDateTime > ahora) {
        alert('No puedes ingresar resultados para un partido que aún no ha ocurrido.');
        return;
        }
    } 

    // 1) Guardar o actualizar partido
    let partidoId = partidoActual?.id || null;

    if (partidoActual) {
        await updateDoc(doc(db, 'partidos', partidoId), nuevoPartido);
    } else {
        const nuevoDoc = await addDoc(collection(db, 'partidos'), nuevoPartido);
        partidoId = nuevoDoc.id;
    }

    // 2) Si hay resultados, ajustar ELO
    if (
      nuevoPartido.resultado1 !== '' &&
      nuevoPartido.resultado2 !== '' &&
      nuevoPartido.equipo1 &&
      nuevoPartido.equipo2
    ) {
      // Obtener documentos de ambos equipos
      const qTeams = query(
        collection(db, 'equipos'),
        where('nombre', 'in', [nuevoPartido.equipo1, nuevoPartido.equipo2])
      );
      const snapTeams = await getDocs(qTeams);
      let docA, docB;
      snapTeams.forEach((d) => {
        if (d.data().nombre === nuevoPartido.equipo1) docA = d;
        if (d.data().nombre === nuevoPartido.equipo2) docB = d;
      });
      if (docA && docB) {
        const RA = docA.data().elo ?? 1000;
        const RB = docB.data().elo ?? 1000;
        const score1 = parseInt(nuevoPartido.resultado1, 10);
        const score2 = parseInt(nuevoPartido.resultado2, 10);
        const SA = score1 > score2 ? 1 : score1 < score2 ? 0 : 0.5;
        const SB = 1 - SA;
        const EA = 1 / (1 + 10 ** ((RB - RA) / 400));
        const EB = 1 - EA;
        const K = 32;
        const newA = Math.round(RA + K * (SA - EA));
        const newB = Math.round(RB + K * (SB - EB));
        
        // Dentro del if (docA && docB)
        const deltaA = Math.round(K * (SA - EA));
        const deltaB = Math.round(K * (SB - EB));

        // Si es nuevo partido:
        await updateDoc(doc(db, 'partidos', partidoId), {
            ...nuevoPartido,
            eloDeltaEquipo1: deltaA,
            eloDeltaEquipo2: deltaB,
        });

        // Luego actualiza los equipos
        const batch = writeBatch(db);
        batch.update(doc(db, 'equipos', docA.id), { elo: RA + deltaA });
        batch.update(doc(db, 'equipos', docB.id), { elo: RB + deltaB });
        await batch.commit();
      }
    }

    cerrarModal();
    cargarPartidos();
  };

  const confirmarEliminacion = (partido) => setConfirmarEliminar(partido);
  const cancelarEliminacion = () => setConfirmarEliminar(null);

    const eliminarPartido = async () => {
        if (!confirmarEliminar) return;
        const p = confirmarEliminar;

        if (
            p.resultado1 !== '' &&
            p.resultado2 !== '' &&
            typeof p.eloDeltaEquipo1 === 'number' &&
            typeof p.eloDeltaEquipo2 === 'number'
        ) {
            const qTeams = query(
            collection(db, 'equipos'),
            where('nombre', 'in', [p.equipo1, p.equipo2])
            );
            const snapTeams = await getDocs(qTeams);
            let docA, docB;
            snapTeams.forEach((d) => {
            if (d.data().nombre === p.equipo1) docA = d;
            if (d.data().nombre === p.equipo2) docB = d;
            });

            if (docA && docB) {
            const RA = docA.data().elo ?? 1000;
            const RB = docB.data().elo ?? 1000;
            const batch = writeBatch(db);
            batch.update(doc(db, 'equipos', docA.id), { elo: RA - p.eloDeltaEquipo1 });
            batch.update(doc(db, 'equipos', docB.id), { elo: RB - p.eloDeltaEquipo2 });
            await batch.commit();
            }
        }

        await deleteDoc(doc(db, 'partidos', p.id));
        setConfirmarEliminar(null);
        cargarPartidos();
    };


  const destacar = (a, b) => {
    if (a === '' || b === '') return '';
    if (parseInt(a, 10) > parseInt(b, 10)) return 'text-green-600 font-bold';
    return '';
  };

  const partidosFiltrados = partidos.filter((p) => {
    const texto = `${p.equipo1} ${p.equipo2} ${p.club} ${p.fecha}`.toLowerCase();
    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    const esJugado = p.resultado1 !== '' && p.resultado2 !== '';
    if (filtro === 'pendientes') return coincideBusqueda && !esJugado;
    if (filtro === 'jugados') return coincideBusqueda && esJugado;
    return coincideBusqueda;
  });

  const opcionesEquipos = equipos.map((nombre) => ({ label: nombre, value: nombre }));

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
          >
            Pendientes
          </button>
          <button
            className={`px-3 py-1 rounded border ${filtro === 'jugados' ? 'bg-blue-600 text-white' : 'border-gray-400'}`}
            onClick={() => setFiltro('jugados')}
          >
            Jugados
          </button>
          <button
            className={`px-3 py-1 rounded border ${filtro === 'todos' ? 'bg-blue-600 text-white' : 'border-gray-400'}`}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
        </div>
      </div>

      <button
        onClick={() => abrirModal()}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Crear Partido
      </button>

      <div className="space-y-4">
        {partidosFiltrados.map((p) => (
          <div key={p.id} className="bg-white shadow rounded-lg p-4 border hover:bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">{p.fecha} - {p.hora} hrs</div>
            <div className="text-xs text-gray-700 mb-2">
              Cancha: {p.club} {p.direccion && `(${p.direccion})`}
            </div>
            <div className="grid grid-cols-3 items-center mb-1">
              <div className={`text-lg ${destacar(p.resultado1, p.resultado2)}`}>{p.equipo1}</div>
              <div className="text-2xl font-bold text-center">
                {p.resultado1 ?? '-'} <span className="text-sm">vs</span> {p.resultado2 ?? '-'}
              </div>
              <div className={`text-lg text-right ${destacar(p.resultado2, p.resultado1)}`}>{p.equipo2}</div>
            </div>
            {(() => {
                const RA = equipos.find(eq => eq.nombre === p.equipo1)?.elo ?? 1000;
                const RB = equipos.find(eq => eq.nombre === p.equipo2)?.elo ?? 1000;
                const EA = 1 / (1 + 10 ** ((RB - RA) / 400));
                const EB = 1 - EA;
                const K = 32;
                const winA = Math.round(K * (1 - EA));
                const loseA = Math.round(K * (0 - EA));
                const winB = Math.round(K * (1 - EB));
                const loseB = Math.round(K * (0 - EB));
                return (
                    <div className="text-sm text-gray-600 mb-2">
                    <strong>Puntos en juego:</strong> {p.equipo1}: +{winA}/{loseA} | {p.equipo2}: +{winB}/{loseB}
                    </div>
                );
            })()}
            <div className="flex gap-2">
              <button
                onClick={() => abrirModal(p)}
                className="text-yellow-600 border border-yellow-600 px-2 py-1 text-sm rounded"
              >
                Editar Partido
              </button>
              <button
                onClick={() => confirmarEliminacion(p)}
                className="text-red-600 border border-red-600 px-2 py-1 text-sm rounded"
              >
                Eliminar Partido
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md text-center">
            <p className="mb-4">
              ¿Seguro que quieres eliminar el partido entre <strong>{confirmarEliminar.equipo1}</strong> y <strong>{confirmarEliminar.equipo2}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelarEliminacion}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >Cancelar</button>
              <button
                onClick={eliminarPartido}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50 overflow-y-auto">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded w-full max-w-xl relative max-h-screen overflow-y-auto"
          >
            <button
              onClick={cerrarModal}
              className="absolute top-2 right-4 text-gray-500 text-lg"
            >✕</button>
            <h2 className="text-lg font-bold mb-4">
              {partidoActual ? 'Editar Partido' : 'Nuevo Partido'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Select
                options={opcionesEquipos.filter(e => e.value !== nuevoPartido.equipo2)}
                value={opcionesEquipos.find(e => e.value === nuevoPartido.equipo1)}
                onChange={(option) => handleChangeSelect('equipo1', option)}
                placeholder="Selecciona equipo 1"
              />
              <Select
                options={opcionesEquipos.filter(e => e.value !== nuevoPartido.equipo1)}
                value={opcionesEquipos.find(e => e.value === nuevoPartido.equipo2)}
                onChange={(option) => handleChangeSelect('equipo2', option)}
                placeholder="Selecciona equipo 2"
              />
              <input
                name="club"
                placeholder="Club"
                value={nuevoPartido.club}
                onChange={handleChange}
                className="w-full border p-2"
              />
              <input
                name="direccion"
                placeholder="Dirección (opcional)"
                value={nuevoPartido.direccion}
                onChange={handleChange}
                className="w-full border p-2"
              />
              <input
                name="fecha"
                type="date"
                value={nuevoPartido.fecha}
                onChange={handleChange}
                className="w-full border p-2"
              />
              <input
                name="hora"
                type="time"
                value={nuevoPartido.hora}
                onChange={handleChange}
                className="w-full border p-2"
              />
              {nuevoPartido.equipo1 && nuevoPartido.equipo2 && nuevoPartido.fecha && nuevoPartido.hora ? (
                <div className="flex gap-2">
                    <input
                        name="resultado1"
                        type="number"
                        min="0"
                        max="20"
                        value={nuevoPartido.resultado1 === '' ? null : nuevoPartido.resultado1}
                        onChange={handleChange}
                        className="w-full border p-2"
                        placeholder="Goles equipo 1"
                    />
                    <input
                        name="resultado2"
                        type="number"
                        min="0"
                        max="20"
                        value={nuevoPartido.resultado2 === '' ? null : nuevoPartido.resultado2}
                        onChange={handleChange}
                        className="w-full border p-2"
                        placeholder="Goles equipo 2"
                        />
                </div>
                ) : (
                <div className="text-sm text-gray-500 italic">
                    Selecciona ambos equipos, la fecha y la hora para poder ingresar los resultados.
                </div>
                )}
              <button
                type="submit"
                disabled={!nuevoPartido.equipo1 || !nuevoPartido.equipo2}
                className={`w-full py-2 rounded ${
                    !nuevoPartido.equipo1 || !nuevoPartido.equipo2
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                >
                Guardar Partido
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
