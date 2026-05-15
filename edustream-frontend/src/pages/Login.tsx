import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Panneau gauche */}
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>▶</div>
            <span className={styles.brandName}>EduStream</span>
          </div>
          <h1 className={styles.heroTitle}>
            Apprenez à votre rythme, <br />
            <span className={styles.heroGreen}>où que vous soyez.</span>
          </h1>
          <p className={styles.heroSub}>
            La plateforme de cours vidéo qui connecte enseignants et étudiants.
            Enregistrez, organisez et suivez vos cours facilement.
          </p>
          <div className={styles.features}>
            {[
              { icon: '🎥', text: 'Enregistrement direct depuis le navigateur' },
              { icon: '📁', text: 'Organisation par modules et chapitres' },
              { icon: '📈', text: 'Suivi de progression en temps réel' },
              { icon: '🔒', text: 'Accès sécurisé selon votre rôle' },
            ].map(f => (
              <div key={f.text} className={styles.feature}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>200+</strong><span>Cours disponibles</span></div>
            <div className={styles.statDiv}></div>
            <div className={styles.stat}><strong>1 200+</strong><span>Étudiants actifs</span></div>
            <div className={styles.statDiv}></div>
            <div className={styles.stat}><strong>50+</strong><span>Enseignants</span></div>
          </div>
        </div>
      </div>

      {/* Panneau droit - formulaire */}
      <div className={styles.right}>
        <div className={styles.form}>
          <h2 className={styles.formTitle}>Connexion</h2>
          <p className={styles.formSub}>Accédez à votre espace personnel</p>

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Adresse email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="vous@exemple.sn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Mot de passe</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className={styles.divider}><span>ou</span></div>

          <p className={styles.registerText}>
            Pas encore de compte ?{' '}
            <Link to="/register" className={styles.registerLink}>S'inscrire gratuitement</Link>
          </p>
          <p className={styles.forgotText}>
            <Link to="/forgot-password" className={styles.forgotLink}>Mot de passe oublié ?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
