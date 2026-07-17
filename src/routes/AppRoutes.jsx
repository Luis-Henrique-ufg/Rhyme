import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import StudentMap from '../pages/StudentMap';
import DriverDashboard from '../pages/DriverDashboard';
import Loader from '../components/Loader';

// Componente explícito e lógico para Proteção de Rota (Private Route)
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Verificando acesso..." />;
  }

  // Regra de Roteamento (Fallback): se loading for falso e não houver usuário, redireciona.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// StudentMap mock foi substituído pelo componente importado

// DriverDashboard mock removido, utilizando o importado de pages

export function AppRoutes() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
