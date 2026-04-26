import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.post('/logout');
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", background: '#f5f5f3', minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ background: '#085041', padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#9FE1CB', fontFamily: 'Georgia, serif', fontSize: 18 }}>EduStream</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#5DCAA5', fontSize: 13 }}>{user?.name}</span>
          <button onClick={handleLogout}
            style={{ background: '#E24B4A', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Titre */}
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1a1a1a', margin: '0 0 4px' }}>Tableau de bord</h2>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 1.5rem' }}>Année académique 2025–2026 — Groupe 6</p>

        {/* Profil */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9FE1CB', fontWeight: 500, fontSize: 15, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Rôle : {user?.role} · {user?.email}</div>
          </div>
        </div>

        {/* Cartes stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'Cours inscrits', value: '6', note: 'Semestre en cours' },
            { label: 'Devoirs à rendre', value: '3', note: 'Cette semaine' },
            { label: 'Moyenne générale', value: '14.2', note: 'Sur 20' },
          ].map((c) => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a' }}>{c.value}</div>
              <div style={{ fontSize: 11, color: '#1D9E75', marginTop: 2 }}>{c.note}</div>
            </div>
          ))}
        </div>

        {/* Cours récents */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>Cours récents</p>
          {[
            { code: 'UML', nom: 'Modélisation UML', prof: 'Prof. Mbaye · Lundi 09h', statut: 'En cours', vert: true },
            { code: 'BDD', nom: 'Bases de données', prof: 'Prof. Sow · Mardi 14h', statut: 'En cours', vert: true },
            { code: 'WEB', nom: 'Développement Web', prof: 'Prof. Diop · Jeudi 10h', statut: 'Devoir dû', vert: false },
          ].map((c, i, arr) => (
            <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#085041' }}>{c.code}</div>
                <div>
                  <div style={{ fontSize: 13, color: '#1a1a1a' }}>{c.nom}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{c.prof}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: c.vert ? '#E1F5EE' : '#FAEEDA', color: c.vert ? '#085041' : '#633806' }}>{c.statut}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
