import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardAdmin.module.css';

interface Video {
  id: number;
  titre: string;
  duree?: number;
  statut: string;
  url_stockage: string;
  created_at: string;
  enseignant?: { name: string };
  chapitre?: { titre: string; module?: { titre: string } };
}

function fmtDuree(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/videos')
      .then(res => setVideos(res.data.data || res.data))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = videos.filter(v =>
    v.titre.toLowerCase().includes(search.toLowerCase()) ||
    (v.enseignant?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vidéos</h1>
          <p className={styles.subtitle}>Toutes les vidéos de la plateforme</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Toutes les vidéos ({videos.length})</h2>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Module / Chapitre</th>
                <th>Enseignant</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 500 }}>{v.titre}</td>
                  <td className={styles.email}>
                    <div>{v.chapitre?.module?.titre || '—'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{v.chapitre?.titre}</div>
                  </td>
                  <td className={styles.email}>{v.enseignant?.name || '—'}</td>
                  <td className={styles.date}>{fmtDuree(v.duree)}</td>
                  <td>
                    <span className={`${styles.pill} ${v.statut === 'disponible' ? styles.pill_etudiant : styles.pill_enseignant}`}>
                      {v.statut === 'disponible' ? 'Disponible' : 'En traitement'}
                    </span>
                  </td>
                  <td className={styles.date}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
