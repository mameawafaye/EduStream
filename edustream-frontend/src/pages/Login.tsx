import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

type Role = 'etudiant' | 'enseignant' | 'administrateur';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('etudiant');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/login', { email, password, role });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    }
  };

  const roles: { key: Role; label: string }[] = [
    { key: 'etudiant', label: 'Étudiant' },
    { key: 'enseignant', label: 'Enseignant' },
    { key: 'administrateur', label: 'Administrateur' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* Panneau gauche vert */}
      <div style={{ width: 260, flexShrink: 0, background: '#2d5a27', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', gap: '1.5rem' }}>
        <div style={{ background: '#3d7a35', borderRadius: 20, width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <rect x="4" y="8" width="30" height="22" rx="4" stroke="#fff" strokeWidth="2"/>
            <polygon points="15,13 15,27 27,20" fill="#fff"/>
          </svg>
        </div>
        <div style={{ color: '#fff', fontSize: 26, fontWeight: 600, textAlign: 'center', fontFamily: 'Georgia, serif' }}>EduStream</div>
        <div style={{ color: '#a8c8a0', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>Plateforme de gestion et diffusion de cours vidéo</div>
        <div style={{ width: 40, height: 1, background: '#3d7a35' }}></div>
        
      </div>

      {/* Formulaire droite */}
      <div style={{ flex: 1, background: '#f7f5f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2.5rem 3rem' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1a', margin: '0 0 4px' }}>Connexion</h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 1.75rem' }}>Accédez à votre espace personnel.</p>

        <form onSubmit={handleSubmit}>

          {/* Sélection rôle */}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Je suis</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
            {roles.map(r => (
              <button key={r.key} type="button" onClick={() => setRole(r.key)}
                style={{ flex: 1, padding: '10px 6px', borderRadius: 10, border: role === r.key ? '1.5px solid #2d5a27' : '1.5px solid #d0ccc4', background: '#f7f5f0', color: role === r.key ? '#2d5a27' : '#444', fontSize: 14, cursor: 'pointer', fontWeight: role === r.key ? 500 : 400 }}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Email */}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Adresse email</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="prenom.nom@universite.sn"
            style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: 'none', background: '#2a2a2a', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none', marginBottom: '1rem' }}/>

          {/* Mot de passe */}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Mot de passe</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="••••••••"
            style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: 'none', background: '#2a2a2a', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none', marginBottom: '0.75rem' }}/>

          <div style={{ textAlign: 'right', fontSize: 13, color: '#2d5a27', marginBottom: '1rem', cursor: 'pointer' }}>Mot de passe oublié ?</div>

          {error && <p style={{ color: '#E24B4A', fontSize: 13, margin: '0 0 0.75rem' }}>{error}</p>}

          <button type="submit"
            style={{ width: '100%', padding: 14, background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>
            Se connecter
          </button>
        </form>

        {/* Bas de page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.5rem 0 1rem' }}>
          <div style={{ flex: 1, height: 1, background: '#ddd' }}></div>
          <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>Pas encore de compte ?</span>
          <div style={{ flex: 1, height: 1, background: '#ddd' }}></div>
        </div>
        <p style={{ fontSize: 13, color: '#777', textAlign: 'center', margin: 0 }}>
          Contactez votre <span style={{ color: '#2d5a27', fontWeight: 500 }}>administrateur</span> pour créer un accès.
        </p>
      </div>
    </div>
  );
}
