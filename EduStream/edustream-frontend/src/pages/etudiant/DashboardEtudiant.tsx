import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentCourseCard from '../../components/StudentCourseCard';
import { useStudentCourses } from '../../hooks/useStudentCourses';
import CoursePlayer from './CoursePlayer';
import styles from './DashboardEtudiant.module.css';

export default function DashboardEtudiant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { modules, loading, playingModule, openCourse, closeCourse, refreshProgress } = useStudentCourses();

  const stats = {
    inscrits: modules.length,
    videos: modules.reduce((s, m) => s + (m.videos_vues || 0), 0),
    progression: modules.length
      ? Math.round(modules.reduce((s, m) => s + (m.progression || 0), 0) / modules.length)
      : 0,
  };

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
          <h1 className={styles.title}>Bonjour, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Continuez votre apprentissage là où vous vous êtes arrêté(e)</p>
        </div>
        <button type="button" className={styles.exploreBtn} onClick={() => navigate('/dashboard/explorer')}>
          🔍 Explorer les cours
        </button>
      </div>

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

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mes cours en cours</h2>
        <span
          className={styles.seeAll}
          onClick={() => navigate('/dashboard/mes-cours')}
          onKeyDown={e => e.key === 'Enter' && navigate('/dashboard/mes-cours')}
          role="button"
          tabIndex={0}
        >
          Voir tous →
        </span>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement de vos cours...</div>
      ) : modules.length === 0 ? (
        <div className={styles.empty}>
          <p>Vous n'êtes inscrit à aucun cours pour le moment.</p>
          <button
            type="button"
            className={styles.exploreBtn}
            style={{ marginTop: 12 }}
            onClick={() => navigate('/dashboard/explorer')}
          >
            Explorer les cours
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {modules.slice(0, 4).map((mod, i) => (
            <StudentCourseCard key={mod.id} module={mod} index={i} onOpen={openCourse} />
          ))}
        </div>
      )}
    </div>
  );
}
