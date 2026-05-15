import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>EduStream — Connexion</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Email</label><br/>
          <input type="email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: 8, marginTop: 4 }}/>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Mot de passe</label><br/>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: 8, marginTop: 4 }}/>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit"
          style={{ width: '100%', padding: 10, background: '#1D9E75',
            color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}
