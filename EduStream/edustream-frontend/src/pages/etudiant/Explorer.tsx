import { useEffect, useState } from 'react';
import api from '../../api/axios';
import ExplorerCourseCard, { type ExplorerModule } from '../../components/ExplorerCourseCard';
import { useStudentCourses } from '../../hooks/useStudentCourses';
import type { StudentModule } from '../../types/studentModule';
import CoursePlayer from './CoursePlayer';
import styles from './DashboardEtudiant.module.css';

export default function Explorer() {
  const [modules, setModules] = useState<ExplorerModule[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [inscriptions, setInscriptions] = useState<StudentModule[]>([]);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  const { playingModule, openCourse, closeCourse, refreshProgress } = useStudentCourses(false);

  useEffect(() => {
    Promise.all([
      api.get('/modules'),
      api.get('/mes-inscriptions'),
    ]).then(([modRes, insRes]) => {
      setModules(modRes.data.data || modRes.data);
      setInscriptions(insRes.data.data || insRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const inscriptionMap = new Map(inscriptions.map(m => [m.id, m]));

  const handleInscrire = async (id: number) => {
    setEnrolling(id);
    try {
      await api.post(`/modules/${id}/inscrire`);
      const insRes = await api.get('/mes-inscriptions');
      const updated: StudentModule[] = insRes.data.data || insRes.data;
      setInscriptions(updated);
      const enrolled = updated.find(m => m.id === id);
      if (enrolled) await openCourse(enrolled);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(message || "Erreur lors de l'inscription.");
    } finally {
      setEnrolling(null);
    }
  };

  const handleOpen = async (mod: ExplorerModule) => {
    const enrolled = inscriptionMap.get(mod.id);
    if (enrolled) await openCourse(enrolled);
  };

  const handleCloseCourse = () => {
    closeCourse();
    api.get('/mes-inscriptions')
      .then(res => setInscriptions(res.data.data || res.data))
      .catch(() => {});
  };

  const filtered = modules.filter(m =>
    m.titre.toLowerCase().includes(search.toLowerCase()) ||
    (m.matiere || '').toLowerCase().includes(search.toLowerCase())
  );

  if (playingModule) {
    return (
      <CoursePlayer
        module={playingModule}
        onClose={handleCloseCourse}
        onProgressUpdate={refreshProgress}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Explorer les cours</h1>
          <p className={styles.subtitle}>{modules.length} cours disponibles</p>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher un cours..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: '10px 16px',
            border: '1px solid #e2e8f0', borderRadius: 10,
            fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement des cours...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}><p>Aucun cours trouvé.</p></div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((mod, i) => {
            const enrolled = inscriptionMap.get(mod.id);
            return (
              <ExplorerCourseCard
                key={mod.id}
                module={{ ...mod, progression: enrolled?.progression }}
                index={i}
                isInscrit={!!enrolled}
                enrolling={enrolling === mod.id}
                onInscrire={handleInscrire}
                onOpen={handleOpen}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
