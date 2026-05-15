import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import styles from './DashboardEtudiant.module.css';

interface Module {
  id: number;
  titre: string;
  description: string;
  image_couverture?: string;
  nb_chapitres?: number;
  nb_videos?: number;
  progression?: number;
  videos_vues?: number;
}

const COVER_IMAGES: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  1: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  2: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  3: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
  4: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
};

export default function DashboardEtudiant() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mes-inscriptions')
      .then(res => setModules(res.data.data || res.data))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    inscrits: modules.length,
    videos: modules.reduce((s, m) => s + (m.videos_vues || 0), 0),
    progression: modules.length ? Math.round(modules.reduce((s, m) => s + (m.progression || 0), 0) / modules.length) : 0,
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bonjour, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Continuez votre apprentissage là où vous vous êtes arrêtée</p>
        </div>
        <button className={styles.exploreBtn}>🔍 Explorer les cours</button>
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
          <div className={`${styles.statIcon} ${styles.orange}`}>⏱</div>
          <div className={styles.statNum}>8h30</div>
          <div className={styles.statLabel}>Temps de visionnage</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}>🏆</div>
          <div className={styles.statNum}>{stats.progression}%</div>
          <div className={styles.statLabel}>Complétion moyenne</div>
        </div>
      </div>

      {/* MODULES */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mes cours en cours</h2>
        <span className={styles.seeAll}>Voir tous →</span>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement de vos cours...</div>
      ) : modules.length === 0 ? (
        <div className={styles.empty}>
          <p>Vous n'êtes inscrit à aucun cours pour le moment.</p>
          <button className={styles.exploreBtn} style={{ marginTop: 12 }}>Explorer les cours</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {modules.map((mod, i) => (
            <ModuleCard key={mod.id} module={mod} index={i} />
          ))}
        </div>
      )}

      {/* CONTINUER */}
      <div className={styles.sectionHeader} style={{ marginTop: 32 }}>
        <h2 className={styles.sectionTitle}>Reprendre là où vous vous êtes arrêtée</h2>
      </div>
      <div className={styles.continueList}>
        <ContinueCard
          thumb="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=120&q=80"
          title="Chap 7 — Arbres binaires de recherche"
          module="Algorithmes & Structures"
          progress={30}
          duration="14 min"
          action="Reprendre"
        />
        <ContinueCard
          thumb="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=120&q=80"
          title="Chap 3 — Jointures SQL avancées"
          module="Base de données"
          progress={0}
          duration="22 min"
          action="Démarrer"
        />
      </div>
    </div>
  );
}

function ModuleCard({ module, index }: { module: Module; index: number }) {
  const prog = module.progression || 0;
  const img = module.image_couverture || COVER_IMAGES[index % 5];

  return (
    <div className={styles.card}>
      <div className={styles.cardThumb}>
        <img src={img} alt={module.titre} className={styles.cardImg} />
        <span className={styles.cardBadge}>{module.nb_chapitres || 0} chapitres</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardCat}>Informatique</div>
        <h3 className={styles.cardTitle}>{module.titre}</h3>
        <div className={styles.cardProf}>
          <div className={styles.profAvatar}>P</div>
          <span>Prof. Diallo</span>
        </div>
        <div className={styles.progBar}>
          <div className={styles.progFill} style={{ width: `${prog}%` }}></div>
        </div>
        <div className={styles.progRow}>
          <span>{module.videos_vues || 0}/{module.nb_videos || 0} vidéos</span>
          <span className={styles.progPct}>{prog}%</span>
        </div>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardMeta}>⏱ {prog === 100 ? 'Terminé !' : prog === 0 ? 'Pas commencé' : 'En cours'}</span>
        <button className={styles.cardBtn}>
          {prog === 0 ? '▶ Démarrer' : prog === 100 ? '✓ Revoir' : '▶ Continuer'}
        </button>
      </div>
    </div>
  );
}

function ContinueCard({ thumb, title, module, progress, duration, action }: {
  thumb: string; title: string; module: string;
  progress: number; duration: string; action: string;
}) {
  return (
    <div className={styles.continueCard}>
      <img src={thumb} alt="" className={styles.continueThumb} />
      <div className={styles.continueInfo}>
        <div className={styles.continueTitle}>{title}</div>
        <div className={styles.continueMeta}>{module} · {duration}</div>
        {progress > 0 && (
          <div className={styles.miniBar}>
            <div className={styles.miniFill} style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
      <button className={`${styles.cardBtn} ${progress === 0 ? styles.outlineBtn : ''}`}>
        ▶ {action}
      </button>
    </div>
  );
}
