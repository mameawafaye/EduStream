import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardEtudiant.module.css';

interface Module {
  id: number;
  titre: string;
  description: string;
  matiere?: string;
  nb_chapitres?: number;
  nb_videos?: number;
  enseignant?: { name: string };
}

const COVERS: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  1: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  2: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  3: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
  4: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
};

export default function Explorer() {
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [inscriptions, setInscriptions] = useState<number[]>([]);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/modules'),
      api.get('/mes-inscriptions'),
    ]).then(([modRes, insRes]) => {
      setModules(modRes.data.data || modRes.data);
      const ids = (insRes.data.data || insRes.data).map((m: Module) => m.id);
      setInscriptions(ids);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleInscrire = async (id: number) => {
    setEnrolling(id);
    try {
      await api.post(`/modules/${id}/inscrire`);
      setInscriptions(prev => [...prev, id]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setEnrolling(null);
    }
  };

  const filtered = modules.filter(m =>
    m.titre.toLowerCase().includes(search.toLowerCase()) ||
    (m.matiere || '').toLowerCase().includes(search.toLowerCase())
  );

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
            const isInscrit = inscriptions.includes(mod.id);
            return (
              <div key={mod.id} className={styles.card}>
                <div className={styles.cardThumb}>
                  <img src={COVERS[i % 5]} alt={mod.titre} className={styles.cardImg} />
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
                <div className={styles.cardFooter}>
                  {isInscrit ? (
                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>✓ Inscrit</span>
                  ) : (
                    <button
                      className={styles.cardBtn}
                      onClick={() => handleInscrire(mod.id)}
                      disabled={enrolling === mod.id}
                    >
                      {enrolling === mod.id ? 'Inscription...' : "S'inscrire"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
