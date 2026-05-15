import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import styles from './DashboardEnseignant.module.css';

interface Module {
  id: number;
  titre: string;
  description: string;
  statut: 'publie' | 'brouillon';
  nb_chapitres?: number;
  nb_videos?: number;
  nb_etudiants?: number;
  image_couverture?: string;
}

const COVERS = [
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
];

export default function DashboardEnseignant() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recStatus, setRecStatus] = useState('Cliquez pour démarrer l\'enregistrement de votre cours');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get('/modules').then(res => setModules(res.data.data || res.data)).catch(() => setModules([]));
  }, []);

  const toggleRec = () => {
    if (!recording) {
      setRecording(true);
      setRecStatus('🔴 Enregistrement en cours...');
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      setRecording(false);
      setRecStatus('✅ Vidéo sauvegardée ! Compression terminée.');
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => { setSeconds(0); setRecStatus('Cliquez pour démarrer l\'enregistrement de votre cours'); }, 3000);
    }
  };

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor(s % 3600 / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const handlePublier = async (id: number) => {
    try {
      await api.patch(`/modules/${id}/publier`);
      setModules(prev => prev.map(m => m.id === id ? { ...m, statut: 'publie' } : m));
    } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bonjour, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Gérez vos cours et suivez l'avancement de vos étudiants</p>
        </div>
        <button className={styles.newBtn}>+ Nouveau module</button>
      </div>

      {/* STATS */}
      <div className={styles.stats}>
        {[
          { icon: '📁', val: modules.length, label: 'Modules créés', color: styles.green },
          { icon: '🎥', val: modules.reduce((s, m) => s + (m.nb_videos || 0), 0), label: 'Vidéos publiées', color: styles.blue },
          { icon: '👥', val: modules.reduce((s, m) => s + (m.nb_etudiants || 0), 0), label: 'Étudiants inscrits', color: styles.orange },
          { icon: '👁', val: 214, label: 'Visionnages total', color: styles.purple },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.color}`}>{s.icon}</div>
            <div className={styles.statNum}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ENREGISTREMENT */}
      <div className={styles.recCard}>
        <div className={styles.recLeft}>
          <h3 className={styles.recTitle}>Enregistrer un nouveau cours</h3>
          <p className={styles.recSub}>Enregistrez votre écran, webcam ou microphone directement depuis le navigateur.</p>
          <div className={styles.recSources}>
            <button className={styles.srcBtn}>🖥 Écran</button>
            <button className={styles.srcBtn}>🎙 Microphone</button>
            <button className={styles.srcBtn}>📷 Webcam</button>
          </div>
        </div>
        <div className={styles.recRight}>
          <button className={`${styles.recBtn} ${recording ? styles.recOn : ''}`} onClick={toggleRec}>
            {recording ? '⏹' : '⏺'}
          </button>
          <div className={styles.recTimer}>{fmt(seconds)}</div>
          <div className={styles.recStatus}>{recStatus}</div>
        </div>
      </div>

      {/* MODULES */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mes modules</h2>
        <button className={styles.newBtn}>+ Nouveau module</button>
      </div>

      <div className={styles.moduleList}>
        {modules.map((mod, i) => (
          <div key={mod.id} className={styles.modRow}>
            <img
              src={mod.image_couverture || COVERS[i % COVERS.length]}
              alt={mod.titre}
              className={styles.modImg}
            />
            <div className={styles.modInfo}>
              <div className={styles.modTitle}>{mod.titre}</div>
              <div className={styles.modMeta}>
                {mod.nb_chapitres || 0} chapitres · {mod.nb_videos || 0} vidéos · {mod.nb_etudiants || 0} étudiants inscrits
              </div>
              <div className={styles.chapList}>
                <div className={styles.chapItem}>🎥 Chap 1 — Introduction <span>18:30</span></div>
                <div className={styles.chapItem}>🎥 Chap 2 — Fondamentaux <span>22:15</span></div>
                <div className={styles.chapAdd}>+ Ajouter un chapitre</div>
              </div>
            </div>
            <div className={styles.modActions}>
              <span className={`${styles.pill} ${mod.statut === 'publie' ? styles.pillGreen : styles.pillOrange}`}>
                {mod.statut === 'publie' ? 'Publié' : 'Brouillon'}
              </span>
              {mod.statut === 'brouillon' && (
                <button className={styles.publishBtn} onClick={() => handlePublier(mod.id)}>📤 Publier</button>
              )}
              <button className={styles.editBtn}>✏️</button>
              <button className={styles.statsBtn}>📊</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
