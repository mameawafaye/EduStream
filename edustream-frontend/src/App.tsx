import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import DashboardEtudiant from './pages/etudiant/DashboardEtudiant';
import DashboardEnseignant from './pages/enseignant/DashboardEnseignant';
import DashboardAdmin from './pages/admin/DashboardAdmin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#64748B' }}>Chargement...</div>;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'admin') return <DashboardAdmin />;
  if (user.role === 'enseignant') return <DashboardEnseignant />;
  return <DashboardEtudiant />;
}

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <Layout>
              <DashboardRouter />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
