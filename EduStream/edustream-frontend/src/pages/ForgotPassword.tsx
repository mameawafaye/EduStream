import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import styles from './Login.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);

    try {
      const res = await api.post('/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.reset_url) {
        setResetUrl(res.data.reset_url);
      }
    } catch {
      setError('Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>▶</div>
            <span className={styles.brandName}>EduStream</span>
          </div>
          <h1 className={styles.heroTitle}>
            Retrouvez l'accès à <br />
            <span className={styles.heroGreen}>votre compte.</span>
          </h1>
          <p className={styles.heroSub}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.form}>
          <h2 className={styles.formTitle}>Mot de passe oublié</h2>
          <p className={styles.formSub}>Réinitialisez votre accès en toute sécurité</p>

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

            {error && <div className={styles.error}>{error}</div>}
            {message && (
              <div style={{ color: '#16a34a', fontSize: 14, marginBottom: 12 }}>
                {message}
              </div>
            )}
            {resetUrl && (
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, wordBreak: 'break-all' }}>
                Lien de dev :{' '}
                <Link to={new URL(resetUrl).pathname + new URL(resetUrl).search} className={styles.registerLink}>
                  Réinitialiser le mot de passe
                </Link>
              </div>
            )}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>

          <p className={styles.registerText} style={{ marginTop: 20 }}>
            <Link to="/login" className={styles.registerLink}>← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
