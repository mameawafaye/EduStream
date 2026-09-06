import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ConfirmDialog from './ConfirmDialog';
import styles from './Layout.module.css';

interface NavItem {
  icon: string;
  label: string;
  path: string;
  badge?: number;
}

const navByRole: Record<string, NavItem[]> = {
  etudiant: [
    { icon: '⊞', label: 'Tableau de bord', path: '/dashboard' },
    { icon: '📚', label: 'Mes cours', path: '/dashboard/mes-cours' },
    { icon: '▶', label: 'Continuer', path: '/dashboard/continuer' },
    { icon: '📈', label: 'Ma progression', path: '/dashboard/progression' },
    { icon: '🔍', label: 'Explorer', path: '/dashboard/explorer' },
    { icon: '🔔', label: 'Notifications', path: '/dashboard/notifications' },
  ],
  enseignant: [
    { icon: '⊞', label: 'Tableau de bord', path: '/dashboard' },
    { icon: '🎥', label: 'Enregistrer', path: '/dashboard/enregistrer' },
    { icon: '📁', label: 'Mes modules', path: '/dashboard/mes-modules' },
    { icon: '👥', label: 'Mes étudiants', path: '/dashboard/etudiants' },
    { icon: '📊', label: 'Statistiques', path: '/dashboard/stats' },
  ],
  admin: [
    { icon: '⊞', label: 'Tableau de bord', path: '/dashboard' },
    { icon: '👥', label: 'Utilisateurs', path: '/dashboard/utilisateurs' },
    { icon: '📚', label: 'Modules', path: '/dashboard/modules' },
    { icon: '🎥', label: 'Vidéos', path: '/dashboard/videos' },
    { icon: '📊', label: 'Statistiques', path: '/dashboard/statistiques' },
    { icon: '⚙', label: 'Paramètres', path: '/dashboard/parametres' },
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = navByRole[user?.role || 'etudiant'] || [];
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post('/logout'); } catch {}
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className={styles.app}>
      {/* TOPBAR */}
      <header className={styles.topbar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>▶</div>
          <span>EduStream</span>
        </div>
        <div className={styles.topRight}>
          {user?.role === 'etudiant' && (
            <Link to="/dashboard/notifications" className={styles.notifBtn}>
              🔔
            </Link>
          )}
          <div className={styles.userChip}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <div className={styles.navSection}>Menu</div>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className={styles.badge}>{item.badge}</span>}
              </Link>
            ))}
          </nav>
          <div className={styles.sidebarBottom}>
            <Link to="/dashboard/profil" className={styles.navItem}>
              <span className={styles.navIcon}>👤</span>
              <span>Mon profil</span>
            </Link>
            <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={() => setShowLogoutConfirm(true)}>
              <span className={styles.navIcon}>🚪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className={styles.main}>{children}</main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Se déconnecter ?"
        message="Vous allez quitter votre session. Vous devrez vous reconnecter pour accéder à nouveau à EduStream."
        confirmLabel="Se déconnecter"
        danger
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => !loggingOut && setShowLogoutConfirm(false)}
      />
    </div>
  );
}
