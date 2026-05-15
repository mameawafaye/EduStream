import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardAdmin.module.css';

interface Module {
  id: number;
  titre: string;
  description: string;
  matiere?: string;
  statut: 'publie' | 'brouillon';
  nb_chapitres?: number;
  nb_videos?: number;
  nb_etudiants?: number;
  enseignant?: { name: string };
}

export default function AdminModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/modules')
      .then(res => setModules(res.data.data || res.data))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce module et tout son contenu ?')) return;
    try {
      await api.delete(`/modules/${id}`);
      setModules(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const handlePublier = async (id: number) => {
    try {
      await api.patch(`/modules/${id}/publier`);
      setModules(prev => prev.map(m => m.id === id ? { ...m, statut: 'publie' } : m));
    } catch {}
  };

  const filtered = modules.filter(m =>
    m.titre.toLowerCase().includes(search.toLowerCase()) ||
    (m.enseignant?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Modules</h1>
          <p className={styles.subtitle}>Gestion de tous les modules de la plateforme</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Tous les modules ({modules.length})</h2>
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
                <th>Module</th>
                <th>Enseignant</th>
                <th>Statut</th>
                <th>Chapitres</th>
                <th>Vidéos</th>
                <th>Étudiants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.titre}</div>
                    {m.matiere && <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.matiere}</div>}
                  </td>
                  <td className={styles.email}>{m.enseignant?.name || '—'}</td>
                  <td>
                    <span className={`${styles.pill} ${m.statut === 'publie' ? styles.pill_etudiant : styles.pill_enseignant}`}>
                      {m.statut === 'publie' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className={styles.date}>{m.nb_chapitres || 0}</td>
                  <td className={styles.date}>{m.nb_videos || 0}</td>
                  <td className={styles.date}>{m.nb_etudiants || 0}</td>
                  <td>
                    <div className={styles.actions}>
                      {m.statut === 'brouillon' && (
                        <button className={styles.editBtn} onClick={() => handlePublier(m.id)} title="Publier">📤</button>
                      )}
                      <button className={styles.delBtn} onClick={() => handleDelete(m.id)}>🗑</button>
                    </div>
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
