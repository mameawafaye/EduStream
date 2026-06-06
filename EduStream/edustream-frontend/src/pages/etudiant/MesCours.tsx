import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import StudentCourseCard from '../../components/StudentCourseCard';
import { useStudentCourses } from '../../hooks/useStudentCourses';
import CoursePlayer from './CoursePlayer';
import styles from './DashboardEtudiant.module.css';

export default function MesCours() {
  const navigate = useNavigate();
  const location = useLocation();
  const isContinuer = location.pathname.includes('continuer');

  const { modules, loading, playingModule, openCourse, closeCourse, refreshProgress, setModules } = useStudentCourses();
  const [desinscrireId, setDesinscrireId] = useState<number | null>(null);
  const [desinscrireLoading, setDesinscrireLoading] = useState(false);

  const displayed = isContinuer
    ? modules.filter(m => {
        const p = m.progression || 0;
        return p > 0 && p < 100;
      })
    : modules;

  const handleDesinscrire = async () => {
    if (!desinscrireId) return;
    setDesinscrireLoading(true);
    try {
      await api.delete(`/modules/${desinscrireId}/desinscrire`);
      setModules(prev => prev.filter(m => m.id !== desinscrireId));
    } catch { /* ignore */ }
    finally {
      setDesinscrireLoading(false);
      setDesinscrireId(null);
    }
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
          <h1 className={styles.title}>{isContinuer ? 'Continuer' : 'Mes cours'}</h1>
          <p className={styles.subtitle}>
            {isContinuer
              ? `${displayed.length} cours en cours de progression`
              : `${modules.length} module(s) inscrit(s)`}
          </p>
        </div>
        <button type="button" className={styles.exploreBtn} onClick={() => navigate('/dashboard/explorer')}>
          🔍 Explorer d'autres cours
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : displayed.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {isContinuer
              ? 'Aucun cours en cours. Commencez un nouveau cours !'
              : "Vous n'êtes inscrit à aucun cours."}
          </p>
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
          {displayed.map((mod, i) => (
            <StudentCourseCard
              key={mod.id}
              module={mod}
              index={i}
              onOpen={openCourse}
              onDesinscrire={id => setDesinscrireId(id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={desinscrireId !== null}
        title="Se désinscrire"
        message="Voulez-vous vraiment vous désinscrire de ce module ? Votre progression sera conservée si vous vous réinscrivez plus tard."
        confirmLabel="Se désinscrire"
        danger
        loading={desinscrireLoading}
        onConfirm={handleDesinscrire}
        onCancel={() => setDesinscrireId(null)}
      />
    </div>
  );
}
