// src/admin/AdminEquiposPage.js
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

export default function AdminEquiposPage() {
  const [equipos, setEquipos] = useState([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [equipoActual, setEquipoActual] = useState(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(null);
  const modalRef = useRef();

  const [nuevoEquipo, setNuevoEquipo] = useState({
    nombre: '',
    barrio: '',
    club: '',
    categoria: 'sub-10',
    capitan: '',
    telefono: '',
    jugadores: [''],
  });

  const categorias = [
    'sub-10', 'sub-14', 'sub-17', 'sub-19', 'sub-21',
    'sub-23', 'sub-35', 'sub-40', 'sub-45', 'sub-50',
  ];

  // Carga inicial de equipos y escucha de ESC
  useEffect(() => {
    cargarEquipos();
    const handleKeyDown = (e) => e.key === 'Escape' && cerrarModal();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

    const cargarEquipos = async () => {
        const snap = await getDocs(collection(db, 'equipos'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Ordenar alfabéticamente por nombre (A-Z)
        data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        setEquipos(data);
    };

  const abrirModal = (equipo = null) => {
    setEquipoActual(equipo);
    setNuevoEquipo(equipo || {
      nombre: '',
      barrio: '',
      club: '',
      categoria: 'sub-10',
      capitan: '',
      telefono: '',
      jugadores: [''],
    });
    setModalAbierto(true);
  };
  const cerrarModal = () => {
    setModalAbierto(false);
    setEquipoActual(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoEquipo(prev => ({ ...prev, [name]: value }));
  };
  const handleJugadorChange = (i, val) => {
    const arr = [...nuevoEquipo.jugadores];
    arr[i] = val;
    // si completo la última, agrego otro input
    if (i === arr.length - 1 && val.trim() !== '') arr.push('');
    setNuevoEquipo(prev => ({ ...prev, jugadores: arr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombreTrim = nuevoEquipo.nombre.trim().toLowerCase();

    const yaExiste = equipos.some(eq =>
        eq.nombre.trim().toLowerCase() === nombreTrim &&
        (!equipoActual || eq.id !== equipoActual.id)
    );

    if (yaExiste) {
        alert('Ya existe un equipo con ese nombre. Debe ser único.');
        return;
    }
    
    const jugadores = nuevoEquipo.jugadores.filter(j => j.trim() !== '');
    // al crear nuevo: elo = 1000; al editar, mantiene el que ya estaba
    const data = {
      ...nuevoEquipo,
      jugadores,
      ...(equipoActual ? {} : { elo: 1000 })
    };

    if (equipoActual) {
      await updateDoc(doc(db, 'equipos', equipoActual.id), data);
    } else {
      await addDoc(collection(db, 'equipos'), data);
    }
    cerrarModal();
    cargarEquipos();
  };

  const handleEliminarEquipo = async () => {
    await deleteDoc(doc(db, 'equipos', confirmarEliminacion.id));
    setConfirmarEliminacion(null);
    cargarEquipos();
  };

  // click fuera del modal
  const handleOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) cerrarModal();
  };
  useEffect(() => {
    if (modalAbierto) document.addEventListener('mousedown', handleOutside);
    else document.removeEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [modalAbierto]);

  // filtro de búsqueda en cualquier campo string o array de strings
  const equiposFiltrados = equipos.filter(e =>
    Object.values(e)
      .flatMap(v => Array.isArray(v) ? v : [v])
      .some(c => typeof c === 'string' && c.toLowerCase().includes(busquedaTexto.toLowerCase()))
  );

  return (
    <div className="p-4">
      {/* Buscador */}
      <div className="flex items-center gap-2 mb-2">
        <input
          className="border p-2 flex-grow"
          placeholder="Buscar equipo..."
          value={busquedaTexto}
          onChange={e => setBusquedaTexto(e.target.value)}
        />
        {busquedaTexto && (
          <button
            className="px-2 text-sm text-gray-600 border rounded"
            onClick={() => setBusquedaTexto('')}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Botón Crear */}
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => abrirModal()}
      >
        Crear Nuevo Equipo
      </button>

      {/* Tabla */}
      <div className="overflow-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              {['Nombre','Barrio','Club','Categoría','Capitán','Teléfono','Jugadores','Acciones']
                .map(h => <th key={h} className="p-2 border">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {equiposFiltrados.map(eq => (
              <tr key={eq.id} className="hover:bg-gray-100">
                <td className="p-2 border">{eq.nombre}</td>
                <td className="p-2 border">{eq.barrio}</td>
                <td className="p-2 border">{eq.club}</td>
                <td className="p-2 border">{eq.categoria}</td>
                <td className="p-2 border">{eq.capitan}</td>
                <td className="p-2 border">{eq.telefono}</td>
                <td className="p-2 border">{(eq.jugadores||[]).join(', ')}</td>
                <td className="p-2 border flex gap-2">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => abrirModal(eq)}
                  >Editar</button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    onClick={() => setConfirmarEliminacion(eq)}
                  >Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal creación/edición */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50 overflow-y-auto">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded w-full max-w-xl relative max-h-screen overflow-y-auto"
          >
            <button
              className="absolute top-2 right-4 text-gray-500 text-lg"
              onClick={cerrarModal}
            >✕</button>
            <h2 className="text-lg font-bold mb-4">
              {equipoActual ? 'Editar equipo' : 'Nuevo equipo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="nombre"
                placeholder="Nombre del equipo"
                value={nuevoEquipo.nombre}
                onChange={handleChange}
                className="w-full border p-2"
                required
              />
              <input
                name="barrio"
                placeholder="Barrio localía"
                value={nuevoEquipo.barrio}
                onChange={handleChange}
                className="w-full border p-2"
              />
              <input
                name="club"
                placeholder="Club localía"
                value={nuevoEquipo.club}
                onChange={handleChange}
                className="w-full border p-2"
              />
              <select
                name="categoria"
                value={nuevoEquipo.categoria}
                onChange={handleChange}
                className="w-full border p-2"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                name="capitan"
                placeholder="Nombre del capitán"
                value={nuevoEquipo.capitan}
                onChange={handleChange}
                className="w-full border p-2"
              />
              <input
                name="telefono"
                placeholder="Teléfono del capitán"
                value={nuevoEquipo.telefono}
                onChange={handleChange}
                className="w-full border p-2"
              />
              <div>
                <label className="font-semibold block mb-1">Jugadores:</label>
                {nuevoEquipo.jugadores.map((j, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Jugador ${i+1}`}
                    value={j}
                    onChange={e => handleJugadorChange(i, e.target.value)}
                    className="w-full border p-2 mb-1"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded"
              >
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación eliminación */}
      {confirmarEliminacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm text-center">
            <p className="mb-4">
              ¿Seguro que quieres eliminar el equipo{' '}
              <strong>{confirmarEliminacion.nombre}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setConfirmarEliminacion(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={handleEliminarEquipo}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
