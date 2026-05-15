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

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: 24 }}>
      <h2>Tableau de bord EduStream</h2>
      {user ? (
        <>
          <p>Bonjour <strong>{user.name}</strong> 👋</p>
          <p>Rôle : <strong>{user.role}</strong></p>
          <button onClick={handleLogout}
            style={{ padding: '8px 16px', background: '#E24B4A',
              color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </>
      ) : <p>Chargement...</p>}
    </div>
  );
}
