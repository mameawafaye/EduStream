import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Layout
import Layout from './components/Layout';

// Commun
import Profil from './pages/Profil';
import Notifications from './pages/Notifications';

// Admin
import DashboardAdmin   from './pages/admin/DashboardAdmin';
import AdminModules     from './pages/admin/AdminModules';
import AdminVideos      from './pages/admin/AdminVideos';
import AdminStats       from './pages/admin/AdminStats';

// Enseignant
import DashboardEnseignant from './pages/enseignant/DashboardEnseignant';
import MesModules          from './pages/enseignant/MesModules';
import MesEtudiants        from './pages/enseignant/MesEtudiants';
import StatsEnseignant     from './pages/enseignant/StatsEnseignant';

// Étudiant
import DashboardEtudiant from './pages/etudiant/DashboardEtudiant';
import MesCours          from './pages/etudiant/MesCours';
import Explorer          from './pages/etudiant/Explorer';
import Progression       from './pages/etudiant/Progression';

// ─── Guards ──────────────────────────────────────────────────────────────────

type Role = 'admin' | 'enseignant' | 'etudiant';

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#64748B' }}>
      Chargement...
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Restreint l'accès aux rôles autorisés, redirige vers le dashboard sinon */
function RoleRoute({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

/** Redirige vers le bon dashboard selon le rôle */
function DashboardIndex() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'admin')      return <DashboardAdmin />;
  if (user.role === 'enseignant') return <DashboardEnseignant />;
  return <DashboardEtudiant />;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* Racine */}
      <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />

      {/* Auth publique */}
      <Route path="/login"           element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register"        element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
      <Route path="/reset-password"  element={token ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />

      {/* Zone protégée */}
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                {/* Dashboard principal (redirige selon rôle) */}
                <Route index element={<DashboardIndex />} />

                {/* ── Étudiant ── */}
                <Route path="mes-cours"   element={<RoleRoute roles={['etudiant']}><MesCours /></RoleRoute>} />
                <Route path="continuer"   element={<RoleRoute roles={['etudiant']}><MesCours /></RoleRoute>} />
                <Route path="progression" element={<RoleRoute roles={['etudiant']}><Progression /></RoleRoute>} />
                <Route path="explorer"    element={<RoleRoute roles={['etudiant']}><Explorer /></RoleRoute>} />

                {/* ── Enseignant ── */}
                <Route path="enregistrer"  element={<RoleRoute roles={['enseignant']}><DashboardEnseignant /></RoleRoute>} />
                <Route path="mes-modules"  element={<RoleRoute roles={['enseignant']}><MesModules /></RoleRoute>} />
                <Route path="etudiants"    element={<RoleRoute roles={['enseignant']}><MesEtudiants /></RoleRoute>} />
                <Route path="stats"        element={<RoleRoute roles={['enseignant']}><StatsEnseignant /></RoleRoute>} />

                {/* ── Admin ── */}
                <Route path="utilisateurs" element={<RoleRoute roles={['admin']}><DashboardAdmin /></RoleRoute>} />
                <Route path="modules"      element={<RoleRoute roles={['admin']}><AdminModules /></RoleRoute>} />
                <Route path="videos"       element={<RoleRoute roles={['admin']}><AdminVideos /></RoleRoute>} />
                <Route path="statistiques" element={<RoleRoute roles={['admin']}><AdminStats /></RoleRoute>} />

                {/* ── Commun ── */}
                <Route path="profil"        element={<Profil />} />
                <Route path="notifications" element={<RoleRoute roles={['etudiant']}><Notifications /></RoleRoute>} />
                <Route path="parametres"    element={<Profil />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Toute autre URL → accueil */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
