import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const styles = {
  wrap: { display: 'flex', minHeight: '100vh', fontFamily: "'Source Sans 3', sans-serif" } as React.CSSProperties,
  side: { width: 220, background: '#085041', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', gap: '1.25rem' },
  logo: { width: 52, height: 52, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#9FE1CB', fontFamily: 'Georgia, serif', fontSize: 22, textAlign: 'center' as const, lineHeight: 1.3 },
  tagline: { color: '#5DCAA5', fontSize: 12, textAlign: 'center' as const, lineHeight: 1.6 },
  divider: { width: 32, height: 1, background: '#0F6E56' },
  badge: { background: '#0F6E56', color: '#9FE1CB', fontSize: 11, padding: '4px 10px', borderRadius: 20 },
  main: { flex: 1, background: '#fff', padding: '0 2.5rem', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', maxWidth: 420 },
  heading: { fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1a', margin: '0 0 6px' },
  sub: { fontSize: 13, color: '#666', margin: '0 0 2rem' },
  label: { display: 'block', fontSize: 11, fontWeight: 500, color: '#555', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' as const },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit' },
  btn: { width: '100%', padding: 12, background: '#085041', color: '#E1F5EE', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 8, letterSpacing: '0.03em' },
  err: { fontSize: 12, color: '#E24B4A', margin: '0 0 8px' },
  footer: { fontSize: 11, color: '#aaa', textAlign: 'center' as const, marginTop: '2rem' },
  separator: { display: 'flex', alignItems: 'center', gap: 8, margin: '1.5rem 0' },
  sepLine: { flex: 1, height: 1, background: '#eee' },
  sepText: { fontSize: 11, color: '#bbb' },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    }
  };

  return (
    <div style={styles.wrap}>
      {/* Panneau gauche */}
      <div style={styles.side}>
        <div style={styles.logo}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="9" r="5" stroke="#E1F5EE" strokeWidth="1.5"/>
            <path d="M6 22c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#E1F5EE" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={styles.brand}>Edu<br/>Stream</div>
        <div style={styles.divider}></div>
        <div style={styles.tagline}>Plateforme académique de gestion des cours</div>
        <div style={styles.badge}>Groupe 6 — 2025–2026</div>
      </div>

      {/* Formulaire */}
      <div style={styles.main}>
        <h2 style={styles.heading}>Connexion</h2>
        <p style={styles.sub}>Accédez à votre espace académique</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Adresse e-mail</label>
            <input style={styles.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              placeholder="etudiant@edustream.com"/>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Mot de passe</label>
            <input style={styles.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)} required/>
          </div>

          {error && <p style={styles.err}>{error}</p>}

          <button type="submit" style={styles.btn}>Se connecter</button>
        </form>

        <div style={styles.separator}>
          <div style={styles.sepLine}></div>
          <span style={styles.sepText}>EduStream · UML 2025–2026</span>
          <div style={styles.sepLine}></div>
        </div>

        <p style={styles.footer}>Accès réservé aux membres inscrits — Groupe 6</p>
      </div>
    </div>
  );
}
