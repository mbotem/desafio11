import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fetchAdmins = async () => {
    const snapshot = await getDocs(collection(db, 'admins'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAdmins(data);
  };

  const createAdmin = async () => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'admins', cred.user.uid), {
      email,
      createdAt: new Date()
    });
    setEmail('');
    setPassword('');
    fetchAdmins();
  };

  const removeAdmin = async (uid) => {
    await deleteDoc(doc(db, 'admins', uid));
    // Deberías tener una Cloud Function o backend para eliminar el usuario desde auth si es necesario
    fetchAdmins();
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
    alert("Correo de restablecimiento enviado");
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Administrar usuarios</h2>
      <div className="mb-4">
        <input className="border p-2 mr-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" />
        <input className="border p-2 mr-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" />
        <button onClick={createAdmin} className="bg-green-500 text-white p-2 rounded">Crear Admin</button>
      </div>

      <ul>
        {admins.map(admin => (
          <li key={admin.id} className="flex justify-between items-center border-b py-2">
            <span>{admin.email}</span>
            <div>
              <button onClick={() => resetPassword(admin.email)} className="text-blue-500 mr-4">Reiniciar clave</button>
              <button onClick={() => removeAdmin(admin.id)} className="text-red-500">Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
