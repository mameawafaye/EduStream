import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Layout
import Layout from './components/Layout';

// Commun
import Profil from './pages/Profil';

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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#64748B' }}>
      Chargement...
    </div>
  );
  return token ? <>{children}</> : <Navigate to="/login" replace />;
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
      <Route path="/login"    element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />

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
                <Route path="mes-cours"   element={<MesCours />} />
                <Route path="continuer"   element={<MesCours />} />
                <Route path="progression" element={<Progression />} />
                <Route path="explorer"    element={<Explorer />} />

                {/* ── Enseignant ── */}
                <Route path="enregistrer"  element={<DashboardEnseignant />} />
                <Route path="mes-modules"  element={<MesModules />} />
                <Route path="etudiants"    element={<MesEtudiants />} />
                <Route path="stats"        element={<StatsEnseignant />} />

                {/* ── Admin ── */}
                <Route path="utilisateurs" element={<DashboardAdmin />} />
                <Route path="modules"      element={<AdminModules />} />
                <Route path="videos"       element={<AdminVideos />} />
                <Route path="statistiques" element={<AdminStats />} />

                {/* ── Commun ── */}
                <Route path="profil"        element={<Profil />} />
                <Route path="notifications" element={<Profil />} />
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
