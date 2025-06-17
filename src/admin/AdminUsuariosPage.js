import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth, deleteUser } from 'firebase/auth';
import { db } from '../firebase';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', password: '', nombre: '' });
  const [editando, setEditando] = useState(null);
  const auth = getAuth();

  const cargarUsuarios = async () => {
    const snapshot = await getDocs(collection(db, 'usuarios'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsuarios(data);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrearUsuario = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, nuevoUsuario.email, nuevoUsuario.password);
      await addDoc(collection(db, 'usuarios'), {
        uid: cred.user.uid,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: 'admin'
      });
      alert('Usuario creado correctamente');
      setNuevoUsuario({ email: '', password: '', nombre: '' });
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      alert('Error creando usuario');
    }
  };

  const handleEditarUsuario = async (id) => {
    const nuevoNombre = prompt('Nuevo nombre de usuario');
    if (!nuevoNombre) return;
    await updateDoc(doc(db, 'usuarios', id), { nombre: nuevoNombre });
    cargarUsuarios();
  };

  const handleReiniciarPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Correo de reinicio enviado a ${email}`);
    } catch (err) {
      console.error(err);
      alert('No se pudo enviar el correo');
    }
  };

  const handleEliminarUsuario = async (usuario) => {
    if (!window.confirm(`¿Eliminar usuario ${usuario.email}?`)) return;
    try {
      // Solo borra de la colección, no de Auth (requiere backend con privilegios)
      await deleteDoc(doc(db, 'usuarios', usuario.id));
      alert('Usuario eliminado de Firestore. Eliminar de Auth requiere backend.');
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      alert('Error eliminando usuario');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Administrar Usuarios</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Crear Usuario</h2>
        <input
          type="text"
          placeholder="Nombre"
          className="border p-2 w-full mb-2"
          value={nuevoUsuario.nombre}
          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          className="border p-2 w-full mb-2"
          value={nuevoUsuario.email}
          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="border p-2 w-full mb-2"
          value={nuevoUsuario.password}
          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
        />
        <button
          onClick={handleCrearUsuario}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Crear Usuario
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Listado de Usuarios</h2>
      <table className="min-w-full border bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="p-2 border">{u.nombre}</td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => handleEditarUsuario(u.id)}
                  className="text-blue-600 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleReiniciarPassword(u.email)}
                  className="text-orange-600 text-sm"
                >
                  Reiniciar Clave
                </button>
                <button
                  onClick={() => handleEliminarUsuario(u)}
                  className="text-red-600 text-sm"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
