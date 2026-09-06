import { useEffect, useState } from 'react';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { Video } from '../../types/video';
import { isYoutubeVideo } from '../../types/video';
import styles from './DashboardAdmin.module.css';

interface AdminVideo extends Video {
  created_at: string;
  enseignant?: { name: string };
  chapitre?: { id: number; titre: string; module?: { id: number; titre: string } };
}

function fmtDuree(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminVideo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/videos')
      .then(res => setVideos(res.data.data || res.data))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.chapitre?.module?.id || !deleteTarget.chapitre?.id) return;
    setDeleting(true);
    try {
      await api.delete(
        `/modules/${deleteTarget.chapitre.module.id}/chapitres/${deleteTarget.chapitre.id}/videos/${deleteTarget.id}`
      );
      setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer cette vidéo ?"
        message={`« ${deleteTarget?.titre} » sera définitivement supprimée de la plateforme.`}
        confirmLabel="Supprimer"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

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
                <th>Source</th>
                <th>Module / Chapitre</th>
                <th>Enseignant</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 500 }}>{v.titre}</td>
                  <td>
                    <span className={`${styles.pill} ${isYoutubeVideo(v) ? styles.pill_enseignant : styles.pill_etudiant}`}>
                      {isYoutubeVideo(v) ? '📺 YouTube' : '📁 Upload'}
                    </span>
                  </td>
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
                  <td>
                    <button
                      className={styles.delBtn}
                      onClick={() => setDeleteTarget(v)}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
