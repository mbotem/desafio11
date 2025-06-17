import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setIsAdmin } = useAuth();
  const navigate = useNavigate(); // ✅ Hook para navegación programática

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log("Iniciando sesión con:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Autenticado correctamente:", userCredential.user.email);

      const q = query(collection(db, 'admin_users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      console.log("Resultado Firestore:", querySnapshot.empty ? 'No existe' : 'Existe');

      if (!querySnapshot.empty) {
        localStorage.setItem('isAdmin', 'true');
        setIsAdmin(true);
        navigate('/admin/equipos'); // ✅ Navegación sin recarga
      } else {
        setError('No tienes permisos de administrador');
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError('Correo o contraseña inválidos');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl mb-4 font-bold">Acceso Administrador</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 mb-3"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 mb-4"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          Ingresar
        </button>
      </form>
    </div>
  );
}
