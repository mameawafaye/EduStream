import { courseButtonLabel } from '../types/studentModule';
import styles from '../pages/etudiant/DashboardEtudiant.module.css';

const COVERS: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  1: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  2: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  3: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
  4: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
};

export interface ExplorerModule {
  id: number;
  titre: string;
  description: string;
  matiere?: string;
  nb_chapitres?: number;
  nb_videos?: number;
  enseignant?: { name: string };
  progression?: number;
}

interface Props {
  module: ExplorerModule;
  index: number;
  isInscrit: boolean;
  enrolling: boolean;
  onInscrire: (id: number) => void;
  onOpen: (mod: ExplorerModule) => void;
}

export default function ExplorerCourseCard({
  module: mod,
  index,
  isInscrit,
  enrolling,
  onInscrire,
  onOpen,
}: Props) {
  const handleCardClick = () => {
    if (isInscrit) onOpen(mod);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isInscrit) return;
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
      role={isInscrit ? 'button' : undefined}
      tabIndex={isInscrit ? 0 : undefined}
      style={{ cursor: isInscrit ? 'pointer' : 'default' }}
      aria-label={isInscrit ? `Ouvrir le cours ${mod.titre}` : undefined}
    >
      <div className={styles.cardThumb}>
        <img src={COVERS[index % 5]} alt={mod.titre} className={styles.cardImg} />
        {mod.matiere && <span className={styles.cardBadge}>{mod.matiere}</span>}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{mod.titre}</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 8px' }}>{mod.description}</p>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {mod.nb_chapitres || 0} chapitres · {mod.nb_videos || 0} vidéos
          {mod.enseignant && ` · ${mod.enseignant.name}`}
        </div>
      </div>
      <div className={styles.cardFooter} onClick={e => e.stopPropagation()}>
        {isInscrit ? (
          <button type="button" className={styles.cardBtn} onClick={() => onOpen(mod)}>
            {courseButtonLabel(mod.progression || 0)}
          </button>
        ) : (
          <button
            type="button"
            className={styles.cardBtn}
            onClick={() => onInscrire(mod.id)}
            disabled={enrolling}
          >
            {enrolling ? 'Inscription...' : "S'inscrire"}
          </button>
        )}
      </div>
    </div>
  );
}
