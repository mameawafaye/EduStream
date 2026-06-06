import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      const res = await api.post('/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
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
            Rejoignez notre <br />
            <span className={styles.heroGreen}>communauté d'apprentissage.</span>
          </h1>
          <p className={styles.heroSub}>
            Créez votre compte en quelques secondes et commencez à apprendre ou enseigner dès aujourd'hui.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>200+</strong><span>Cours</span></div>
            <div className={styles.statDiv}></div>
            <div className={styles.stat}><strong>1 200+</strong><span>Étudiants</span></div>
            <div className={styles.statDiv}></div>
            <div className={styles.stat}><strong>Gratuit</strong><span>Pour commencer</span></div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.form}>
          <h2 className={styles.formTitle}>Créer un compte</h2>
          <p className={styles.formSub}>Rejoignez EduStream gratuitement</p>

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Nom complet</label>
              <input className={styles.input} name="name" type="text" placeholder="Mame Awa Faye" value={form.name} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Adresse email</label>
              <input className={styles.input} name="email" type="email" placeholder="vous@exemple.sn" value={form.email} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Mot de passe</label>
              <input className={styles.input} name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Confirmer le mot de passe</label>
              <input className={styles.input} name="password_confirmation" type="password" placeholder="••••••••" value={form.password_confirmation} onChange={handleChange} required />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className={styles.registerText} style={{ marginTop: 20 }}>
            Déjà un compte ?{' '}
            <Link to="/login" className={styles.registerLink}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
