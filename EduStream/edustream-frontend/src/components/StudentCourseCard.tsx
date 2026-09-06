import type { StudentModule } from '../types/studentModule';
import { courseButtonLabel } from '../types/studentModule';
import styles from '../pages/etudiant/DashboardEtudiant.module.css';

const COVERS: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  1: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  2: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  3: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
  4: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
};

interface Props {
  module: StudentModule;
  index: number;
  onOpen: (mod: StudentModule) => void;
  onDesinscrire?: (id: number) => void;
  showProgress?: boolean;
  badge?: string;
}

export default function StudentCourseCard({
  module: mod,
  index,
  onOpen,
  onDesinscrire,
  showProgress = true,
  badge,
}: Props) {
  const prog = mod.progression || 0;

  const handleCardClick = () => onOpen(mod);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(mod);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir le cours ${mod.titre}`}
    >
      <div className={styles.cardThumb}>
        <img src={COVERS[index % 5]} alt={mod.titre} className={styles.cardImg} />
        <span className={styles.cardBadge}>
          {badge || `${mod.nb_chapitres || 0} chapitres`}
        </span>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{mod.titre}</h3>
        {mod.description && (
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 8px' }}>{mod.description}</p>
        )}
        {showProgress && (
          <>
            <div className={styles.progBar}>
              <div className={styles.progFill} style={{ width: `${prog}%` }} />
            </div>
            <div className={styles.progRow}>
              <span>{mod.videos_vues || 0}/{mod.nb_videos || 0} vidéos</span>
              <span className={styles.progPct}>{prog}%</span>
            </div>
          </>
        )}
        {!showProgress && (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {mod.nb_chapitres || 0} chapitres · {mod.nb_videos || 0} vidéos
            {mod.enseignant && ` · ${mod.enseignant.name}`}
          </div>
        )}
      </div>
      <div className={styles.cardFooter} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className={styles.cardBtn}
          onClick={() => onOpen(mod)}
        >
          {courseButtonLabel(prog)}
        </button>
        {onDesinscrire && (
          <button
            type="button"
            onClick={() => onDesinscrire(mod.id)}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}
          >
            Se désinscrire
          </button>
        )}
      </div>
    </div>
  );
}
