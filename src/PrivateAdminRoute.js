import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PrivateAdminRoute({ children }) {
  const { user, isAdmin } = useAuth();

  // Asegurar que no se redirige mientras aún no se conoce el estado
  if (user === undefined || isAdmin === undefined) {
    return null; // o puedes retornar un spinner
  }

  if (!user) return <Navigate to="/admin" />;
  if (!isAdmin) return <Navigate to="/" />;

  return children;
}
