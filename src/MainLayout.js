import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Menu } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

export default function MainLayout() {
  const { isAdmin, setIsAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/', label: 'Inicio' },
    { path: '/equipos', label: 'Equipos' },
    { path: '/partidos', label: 'Partidos' },
    { path: '/ranking', label: 'Ranking' },
  ];

  const adminItems = [
    { path: '/admin/equipos', label: 'Administrar Equipos' },
    { path: '/admin/partidos', label: 'Administrar Partidos' },
  //  { path: '/admin/usuarios', label: 'Administrar Usuarios' },
  ];

  const getPageName = () => {
    const allItems = [...menuItems, ...adminItems];
    return allItems.find(item => item.path === location.pathname)?.label || '';
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 640) setSidebarOpen(false); // cerrar en móvil
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="bg-gray-800 text-white p-4 w-64 sm:block transition-transform duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Desafío11</h2>
            <button onClick={() => setSidebarOpen(false)} className="sm:hidden text-white">
              ✕
            </button>
          </div>
          <nav className="space-y-2">
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={`block px-2 py-1 rounded ${location.pathname === item.path ? 'bg-gray-700 font-bold' : 'hover:bg-gray-700'}`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="mt-4 border-t border-gray-600 pt-2 font-bold">Administración</div>
                {adminItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`block px-2 py-1 rounded ${location.pathname === item.path ? 'bg-gray-700 font-bold' : 'hover:bg-gray-700'}`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="mt-4 block w-full text-left px-2 py-1 rounded bg-red-600 hover:bg-red-700"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{getPageName()}</h1>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="sm:hidden">
              <Menu size={24} />
            </button>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
