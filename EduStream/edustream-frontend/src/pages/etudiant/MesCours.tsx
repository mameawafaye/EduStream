import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import styles from './DashboardEtudiant.module.css';

interface Module {
  id: number;
  titre: string;
  description: string;
  nb_chapitres?: number;
  nb_videos?: number;
  progression?: number;
  videos_vues?: number;
}

const COVERS: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  1: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  2: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  3: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
  4: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
};

export default function MesCours() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/mes-inscriptions')
      .then(res => setModules(res.data.data || res.data))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDesinscrire = async (id: number) => {
    if (!confirm('Se désinscrire de ce module ?')) return;
    try {
      await api.delete(`/modules/${id}/desinscrire`);
      setModules(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes cours</h1>
          <p className={styles.subtitle}>{modules.length} module(s) en cours</p>
        </div>
        <button className={styles.exploreBtn} onClick={() => navigate('/dashboard/explorer')}>
          🔍 Explorer d'autres cours
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : modules.length === 0 ? (
        <div className={styles.empty}>
          <p>Vous n'êtes inscrit à aucun cours.</p>
          <button className={styles.exploreBtn} style={{ marginTop: 12 }} onClick={() => navigate('/dashboard/explorer')}>
            Explorer les cours
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {modules.map((mod, i) => {
            const prog = mod.progression || 0;
            return (
              <div key={mod.id} className={styles.card}>
                <div className={styles.cardThumb}>
                  <img src={COVERS[i % 5]} alt={mod.titre} className={styles.cardImg} />
                  <span className={styles.cardBadge}>{mod.nb_chapitres || 0} chapitres</span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{mod.titre}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 8px' }}>{mod.description}</p>
                  <div className={styles.progBar}>
                    <div className={styles.progFill} style={{ width: `${prog}%` }} />
                  </div>
                  <div className={styles.progRow}>
                    <span>{mod.videos_vues || 0}/{mod.nb_videos || 0} vidéos</span>
                    <span className={styles.progPct}>{prog}%</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button className={styles.cardBtn}>
                    {prog === 0 ? '▶ Démarrer' : prog === 100 ? '✓ Revoir' : '▶ Continuer'}
                  </button>
                  <button
                    onClick={() => handleDesinscrire(mod.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}
                  >
                    Se désinscrire
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
