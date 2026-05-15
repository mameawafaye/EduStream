import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import styles from './DashboardEtudiant.module.css';
import CoursePlayer from './CoursePlayer';

interface Video {
  id: number;
  titre: string;
  duree?: number;
  url_publique?: string;
  url_stockage: string;
  statut: string;
}

interface Chapitre {
  id: number;
  titre: string;
  ordre: number;
  videos: Video[];
}

interface Module {
  id: number;
  titre: string;
  description: string;
  nb_chapitres?: number;
  nb_videos?: number;
  progression?: number;
  videos_vues?: number;
  chapitres?: Chapitre[];
}

const COVERS: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  1: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  2: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  3: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
  4: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
};

export default function DashboardEtudiant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingModule, setPlayingModule] = useState<Module | null>(null);

  useEffect(() => {
    api.get('/mes-inscriptions')
      .then(res => setModules(res.data.data || res.data))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  const openCourse = async (mod: Module) => {
    try {
      const res = await api.get(`/modules/${mod.id}`);
      setPlayingModule(res.data);
    } catch {
      setPlayingModule(mod);
    }
  };

  const stats = {
    inscrits: modules.length,
    videos: modules.reduce((s, m) => s + (m.videos_vues || 0), 0),
    progression: modules.length
      ? Math.round(modules.reduce((s, m) => s + (m.progression || 0), 0) / modules.length)
      : 0,
  };

  if (playingModule) {
    return <CoursePlayer module={playingModule} onClose={() => setPlayingModule(null)} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bonjour, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Continuez votre apprentissage là où vous vous êtes arrêté(e)</p>
        </div>
        <button className={styles.exploreBtn} onClick={() => navigate('/dashboard/explorer')}>
          🔍 Explorer les cours
        </button>
      </div>

      {/* STATS */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>📚</div>
          <div className={styles.statNum}>{stats.inscrits}</div>
          <div className={styles.statLabel}>Modules inscrits</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>▶</div>
          <div className={styles.statNum}>{stats.videos}</div>
          <div className={styles.statLabel}>Vidéos vues</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>📈</div>
          <div className={styles.statNum}>{stats.progression}%</div>
          <div className={styles.statLabel}>Progression moyenne</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}>🏆</div>
          <div className={styles.statNum}>{modules.filter(m => (m.progression || 0) === 100).length}</div>
          <div className={styles.statLabel}>Cours terminés</div>
        </div>
      </div>

      {/* MODULES */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mes cours en cours</h2>
        <span className={styles.seeAll} onClick={() => navigate('/dashboard/mes-cours')} style={{ cursor: 'pointer' }}>
          Voir tous →
        </span>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement de vos cours...</div>
      ) : modules.length === 0 ? (
        <div className={styles.empty}>
          <p>Vous n'êtes inscrit à aucun cours pour le moment.</p>
          <button className={styles.exploreBtn} style={{ marginTop: 12 }} onClick={() => navigate('/dashboard/explorer')}>
            Explorer les cours
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {modules.slice(0, 4).map((mod, i) => {
            const prog = mod.progression || 0;
            return (
              <div key={mod.id} className={styles.card}>
                <div className={styles.cardThumb}>
                  <img src={COVERS[i % 5]} alt={mod.titre} className={styles.cardImg} />
                  <span className={styles.cardBadge}>{mod.nb_chapitres || 0} chapitres</span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{mod.titre}</h3>
                  <div className={styles.progBar}>
                    <div className={styles.progFill} style={{ width: `${prog}%` }} />
                  </div>
                  <div className={styles.progRow}>
                    <span>{mod.videos_vues || 0}/{mod.nb_videos || 0} vidéos</span>
                    <span className={styles.progPct}>{prog}%</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button className={styles.cardBtn} onClick={() => openCourse(mod)}>
                    {prog === 0 ? '▶ Démarrer' : prog === 100 ? '✓ Revoir' : '▶ Continuer'}
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
