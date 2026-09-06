import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import styles from './Login.module.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: searchParams.get('email') ?? '',
    token: searchParams.get('token') ?? '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reset-password', form);
      navigate('/login', { state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Lien invalide ou expiré.');
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
            Choisissez un nouveau <br />
            <span className={styles.heroGreen}>mot de passe.</span>
          </h1>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.form}>
          <h2 className={styles.formTitle}>Nouveau mot de passe</h2>
          <p className={styles.formSub}>Minimum 8 caractères</p>

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Adresse email</label>
              <input
                className={styles.input}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Nouveau mot de passe</label>
              <input
                className={styles.input}
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Confirmer le mot de passe</label>
              <input
                className={styles.input}
                name="password_confirmation"
                type="password"
                placeholder="••••••••"
                value={form.password_confirmation}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Réinitialiser'}
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
