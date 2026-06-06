import { useStudentCourses } from '../../hooks/useStudentCourses';
import { courseButtonLabel } from '../../types/studentModule';
import CoursePlayer from './CoursePlayer';
import styles from './DashboardEtudiant.module.css';

export default function Progression() {
  const { modules, loading, playingModule, openCourse, closeCourse, refreshProgress } = useStudentCourses();

  const moyenne = modules.length
    ? Math.round(modules.reduce((s, m) => s + (m.progression || 0), 0) / modules.length)
    : 0;

  const termines = modules.filter(m => (m.progression || 0) === 100).length;

  if (playingModule) {
    return (
      <CoursePlayer
        module={playingModule}
        onClose={closeCourse}
        onProgressUpdate={refreshProgress}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ma progression</h1>
          <p className={styles.subtitle}>Suivi de votre avancement sur tous vos cours</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>📚</div>
          <div className={styles.statNum}>{modules.length}</div>
          <div className={styles.statLabel}>Cours suivis</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}>🏆</div>
          <div className={styles.statNum}>{moyenne}%</div>
          <div className={styles.statLabel}>Complétion moyenne</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>✅</div>
          <div className={styles.statNum}>{termines}</div>
          <div className={styles.statLabel}>Cours terminés</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>▶</div>
          <div className={styles.statNum}>{modules.length - termines}</div>
          <div className={styles.statLabel}>En cours</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>Détail par module</h2>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : modules.length === 0 ? (
        <div className={styles.empty}><p>Aucun cours suivi pour le moment.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {modules.map(mod => {
            const prog = mod.progression || 0;
            const color = prog === 100 ? '#22c55e' : prog > 50 ? '#3b82f6' : '#f59e0b';
            return (
              <div
                key={mod.id}
                role="button"
                tabIndex={0}
                onClick={() => openCourse(mod)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCourse(mod);
                  }
                }}
                style={{
                  background: '#fff', borderRadius: 12, padding: '20px 24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  cursor: 'pointer',
                  transition: 'box-shadow .15s, transform .15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{mod.titre}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                      {mod.videos_vues || 0} / {mod.nb_videos || 0} vidéos vues
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 18, color }}>{prog}%</span>
                    <button
                      type="button"
                      className={styles.cardBtn}
                      onClick={e => { e.stopPropagation(); openCourse(mod); }}
                    >
                      {courseButtonLabel(prog)}
                    </button>
                  </div>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                  <div style={{
                    width: `${prog}%`, height: '100%',
                    background: color, borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                  {prog === 100 ? '🏆 Terminé !' : prog === 0 ? 'Pas encore commencé' : 'En cours...'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
