import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import PublicPage from './PublicPage';
import EquiposPage from './EquiposPage';
import MatchesPage from './MatchesPage';
import RankingPage from './RankingPage';
import AdminLogin from './AdminLogin';
import AdminEquiposPage from './admin/AdminEquiposPage';
import AdminPartidosPage from './admin/AdminPartidosPage';
import PrivateAdminRoute from './PrivateAdminRoute';
import { useAuth } from './AuthContext';

function AppRoutes() {
  const { isAdmin, user } = useAuth();

  // Mostrar pantalla en blanco mientras se determina el estado de autenticación
  if (user === undefined) {
    return null;
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<PublicPage />} />
        <Route path="/equipos" element={<EquiposPage />} />
        <Route path="/partidos" element={<MatchesPage />} />
        <Route path="/ranking" element={<RankingPage />} />

        {/* Página de login si no es admin, redirige si ya lo es */}
        <Route
          path="/admin"
          element={isAdmin ? <Navigate to="/admin/equipos" /> : <AdminLogin />}
        />

        {/* Rutas protegidas */}
        <Route
          path="/admin/equipos"
          element={
            <PrivateAdminRoute>
              <AdminEquiposPage />
            </PrivateAdminRoute>
          }
        />
        <Route
          path="/admin/partidos"
          element={
            <PrivateAdminRoute>
              <AdminPartidosPage />
            </PrivateAdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
