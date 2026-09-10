import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

// Lazy loading das páginas para máxima performance em redes móveis
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const StudentMap = lazy(() => import('../pages/StudentMap'));
const DriverDashboard = lazy(() => import('../pages/DriverDashboard'));

// Componente para Proteção de Rota (Private Route)
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Verificando acesso..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader message="Carregando..." />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          
          {/* Rotas Privadas */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/aluno/mapa" replace />} />
            <Route path="/aluno/mapa" element={<StudentMap />} />
            <Route path="/motorista/dashboard" element={<DriverDashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
