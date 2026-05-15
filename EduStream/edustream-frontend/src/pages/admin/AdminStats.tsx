import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardAdmin.module.css';

export default function AdminStats() {
  const [stats, setStats] = useState({ total: 0, etudiants: 0, enseignants: 0, admins: 0 });
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
    api.get('/modules').then(res => setModules(res.data.data || res.data)).catch(() => {});
  }, []);

  const publies = modules.filter(m => m.statut === 'publie').length;
  const totalVideos = modules.reduce((s: number, m: any) => s + (m.nb_videos || 0), 0);
  const totalEtudiants = modules.reduce((s: number, m: any) => s + (m.nb_etudiants || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Statistiques globales</h1>
          <p className={styles.subtitle}>Vue d'ensemble de la plateforme EduStream</p>
        </div>
      </div>

      <div className={styles.stats}>
        {[
          { icon: '👥', val: stats.total, label: 'Utilisateurs total', color: styles.purple },
          { icon: '🎓', val: stats.etudiants, label: 'Étudiants', color: styles.blue },
          { icon: '👨‍🏫', val: stats.enseignants, label: 'Enseignants', color: styles.green },
          { icon: '⚙', val: stats.admins, label: 'Administrateurs', color: styles.orange },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.color}`}>{s.icon}</div>
            <div className={styles.statNum}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 8 }}>
        {[
          { icon: '📚', val: modules.length, label: 'Modules créés', sub: `${publies} publiés`, color: '#6366f1' },
          { icon: '🎥', val: totalVideos, label: 'Vidéos disponibles', sub: 'sur la plateforme', color: '#3b82f6' },
          { icon: '📝', val: totalEtudiants, label: 'Inscriptions', sub: 'au total', color: '#22c55e' },
        ].map(c => (
          <div key={c.label} style={{
            background: '#fff', borderRadius: 14, padding: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
