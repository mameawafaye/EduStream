import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardEnseignant.module.css';

interface Module {
  id: number;
  titre: string;
  statut: string;
  nb_chapitres?: number;
  nb_videos?: number;
  nb_etudiants?: number;
}

export default function StatsEnseignant() {
  const [modules, setModules] = useState<Module[]>([]);
  const [visionnages, setVisionnages] = useState({ total_visionnages: 0, termines: 0 });

  useEffect(() => {
    api.get('/modules').then(res => setModules(res.data.data || res.data)).catch(() => {});
    api.get('/stats/visionnages').then(res => setVisionnages(res.data)).catch(() => {});
  }, []);

  const totalVideos    = modules.reduce((s, m) => s + (m.nb_videos || 0), 0);
  const totalEtudiants = modules.reduce((s, m) => s + (m.nb_etudiants || 0), 0);
  const publies        = modules.filter(m => m.statut === 'publie').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Statistiques</h1>
          <p className={styles.subtitle}>Vue d'ensemble de votre activité</p>
        </div>
      </div>

      <div className={styles.stats}>
        {[
          { icon: '📁', val: modules.length, label: 'Modules créés', color: styles.green },
          { icon: '✅', val: publies, label: 'Modules publiés', color: styles.blue },
          { icon: '🎥', val: totalVideos, label: 'Vidéos publiées', color: styles.purple },
          { icon: '👥', val: totalEtudiants, label: 'Étudiants inscrits', color: styles.orange },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.color}`}>{s.icon}</div>
            <div className={styles.statNum}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Visionnages</h3>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>{visionnages.total_visionnages}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Total visionnages</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{visionnages.termines}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Vidéos terminées</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Modules par statut</h3>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{publies}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Publiés</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{modules.length - publies}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Brouillons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des modules */}
      {modules.length > 0 && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 15 }}>
            Détail par module
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Module', 'Statut', 'Chapitres', 'Vidéos', 'Étudiants'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: 14 }}>{m.titre}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: m.statut === 'publie' ? '#dcfce7' : '#fef3c7',
                      color: m.statut === 'publie' ? '#16a34a' : '#d97706',
                    }}>
                      {m.statut === 'publie' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>{m.nb_chapitres || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>{m.nb_videos || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>{m.nb_etudiants || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
