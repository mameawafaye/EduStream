import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import styles from './DashboardEnseignant.module.css';
import recStyles from './Enregistrer.module.css';

interface Module {
  id: number;
  titre: string;
  description: string;
  statut: 'publie' | 'brouillon';
  nb_chapitres?: number;
  nb_videos?: number;
  nb_etudiants?: number;
}

const COVERS = [
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
];

function fmt(s: number) {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export default function DashboardEnseignant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [publishTarget, setPublishTarget] = useState<Module | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Enregistrement
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recStatus, setRecStatus] = useState('Prêt à enregistrer');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<'screen' | 'camera' | 'both'>('screen');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sauvegarde enregistrement
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveForm, setSaveForm] = useState({ titre: '', moduleId: '', chapitreId: '' });
  const [chapitres, setChapitres] = useState<{ id: number; titre: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  useEffect(() => {
    api.get('/modules').then(res => setModules(res.data.data || res.data)).catch(() => setModules([]));
  }, []);

  useEffect(() => {
    if (saveForm.moduleId) {
      api.get(`/modules/${saveForm.moduleId}/chapitres`)
        .then(res => setChapitres(res.data.data || res.data))
        .catch(() => setChapitres([]));
    } else {
      setChapitres([]);
    }
  }, [saveForm.moduleId]);

  /* ── Démarrer l'enregistrement ── */
  const startRecording = async () => {
    try {
      let stream: MediaStream;

      if (sourceMode === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else if (sourceMode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        // Les deux : écran + webcam en overlay
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const tracks = [...screen.getTracks(), ...cam.getAudioTracks()];
        stream = new MediaStream(tracks);
      }

      streamRef.current = stream;

      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play();
      }

      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setRecStatus('✅ Enregistrement terminé — prêt à sauvegarder');
        stream.getTracks().forEach(t => t.stop());
        if (previewRef.current) previewRef.current.srcObject = null;
      };

      mr.start(1000);
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecStatus('🔴 Enregistrement en cours...');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

      // Arrêt automatique si l'utilisateur ferme le partage d'écran
      stream.getVideoTracks()[0]?.addEventListener('ended', stopRecording);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        alert('Impossible de démarrer l\'enregistrement : ' + err.message);
      }
    }
  };

  /* ── Arrêter l'enregistrement ── */
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  /* ── Sauvegarder l'enregistrement ── */
  const saveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordedBlob || !saveForm.moduleId || !saveForm.chapitreId) return;
    setSaving(true);
    setSaveProgress(0);

    const fd = new FormData();
    fd.append('source_type', 'upload');
    fd.append('titre', saveForm.titre);
    fd.append('video', recordedBlob, `enregistrement-${Date.now()}.webm`);
    fd.append('duree', String(seconds));

    try {
      await api.post(
        `/modules/${saveForm.moduleId}/chapitres/${saveForm.chapitreId}/videos`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => { if (e.total) setSaveProgress(Math.round((e.loaded / e.total) * 100)); },
        }
      );
      setShowSaveForm(false);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecStatus('Prêt à enregistrer');
      setSeconds(0);
      alert('✅ Vidéo sauvegardée avec succès !');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublier = async () => {
    if (!publishTarget) return;
    setPublishing(true);
    try {
      await api.patch(`/modules/${publishTarget.id}/publier`);
      setModules(prev => prev.map(m => m.id === publishTarget.id ? { ...m, statut: 'publie' } : m));
      setPublishTarget(null);
    } catch {
      alert('Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={styles.page}>
      <ConfirmDialog
        open={!!publishTarget}
        title="Publier ce module ?"
        message={publishTarget ? `Le module « ${publishTarget.titre} » sera visible par tous les étudiants.` : ''}
        confirmLabel="Publier"
        loading={publishing}
        onConfirm={handlePublier}
        onCancel={() => !publishing && setPublishTarget(null)}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bonjour, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Gérez vos cours et suivez l'avancement de vos étudiants</p>
        </div>
        <button className={styles.newBtn} onClick={() => navigate('/dashboard/mes-modules')}>+ Nouveau module</button>
      </div>

      {/* STATS */}
      <div className={styles.stats}>
        {[
          { icon: '📁', val: modules.length, label: 'Modules créés', color: styles.green },
          { icon: '🎥', val: modules.reduce((s, m) => s + (m.nb_videos || 0), 0), label: 'Vidéos publiées', color: styles.blue },
          { icon: '👥', val: modules.reduce((s, m) => s + (m.nb_etudiants || 0), 0), label: 'Étudiants inscrits', color: styles.orange },
          { icon: '📁', val: modules.filter(m => m.statut === 'publie').length, label: 'Modules publiés', color: styles.purple },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.color}`}>{s.icon}</div>
            <div className={styles.statNum}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ENREGISTREMENT ── */}
      <div className={recStyles.recCard}>
        <div className={recStyles.recLeft}>
          <h3 className={recStyles.recTitle}>🎙 Enregistrer un cours</h3>
          <p className={recStyles.recSub}>Enregistrez votre écran ou webcam directement depuis le navigateur.</p>

          <div className={recStyles.sourceTabs}>
            {(['screen', 'camera', 'both'] as const).map(mode => (
              <button
                key={mode}
                className={`${recStyles.srcTab} ${sourceMode === mode ? recStyles.srcTabActive : ''}`}
                onClick={() => setSourceMode(mode)}
                disabled={recording}
              >
                {mode === 'screen' ? '🖥 Écran' : mode === 'camera' ? '📷 Webcam' : '🖥+📷 Les deux'}
              </button>
            ))}
          </div>

          {/* Prévisualisation */}
          <video
            ref={previewRef}
            muted
            className={recStyles.preview}
            style={{ display: recording ? 'block' : 'none' }}
          />

          {/* Vidéo enregistrée */}
          {recordedUrl && !recording && (
            <div className={recStyles.playbackWrap}>
              <p className={recStyles.playbackLabel}>Aperçu de l'enregistrement :</p>
              <video src={recordedUrl} controls className={recStyles.playback} />
              <div className={recStyles.playbackActions}>
                <a href={recordedUrl} download={`cours-${Date.now()}.webm`} className={recStyles.downloadBtn}>
                  ⬇ Télécharger
                </a>
                <button className={recStyles.saveBtn} onClick={() => setShowSaveForm(true)}>
                  💾 Sauvegarder dans un module
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={recStyles.recRight}>
          <button
            className={`${recStyles.recBtn} ${recording ? recStyles.recOn : ''}`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? '⏹' : '⏺'}
          </button>
          <div className={recStyles.recTimer}>{fmt(seconds)}</div>
          <div className={recStyles.recStatus}>{recStatus}</div>
        </div>
      </div>

      {/* ── Modal sauvegarde ── */}
      {showSaveForm && (
        <div className={recStyles.overlay} onClick={() => !saving && setShowSaveForm(false)}>
          <div className={recStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={recStyles.modalHeader}>
              <h3>💾 Sauvegarder l'enregistrement</h3>
              {!saving && <button className={recStyles.closeBtn} onClick={() => setShowSaveForm(false)}>✕</button>}
            </div>
            <form onSubmit={saveRecording} className={recStyles.form}>
              <label>Titre de la vidéo *</label>
              <input required value={saveForm.titre} onChange={e => setSaveForm({ ...saveForm, titre: e.target.value })} placeholder="Ex: Introduction au cours" />
              <label>Module *</label>
              <select required value={saveForm.moduleId} onChange={e => setSaveForm({ ...saveForm, moduleId: e.target.value, chapitreId: '' })}>
                <option value="">— Choisir un module —</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}
              </select>
              <label>Chapitre *</label>
              <select required value={saveForm.chapitreId} onChange={e => setSaveForm({ ...saveForm, chapitreId: e.target.value })} disabled={!saveForm.moduleId}>
                <option value="">— Choisir un chapitre —</option>
                {chapitres.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
              </select>
              {chapitres.length === 0 && saveForm.moduleId && (
                <p style={{ fontSize: 12, color: '#f59e0b', margin: 0 }}>
                  ⚠ Ce module n'a pas encore de chapitre. Créez-en un d'abord dans "Mes modules".
                </p>
              )}
              {saving && (
                <div className={recStyles.progressWrap}>
                  <div className={recStyles.progressBar} style={{ width: `${saveProgress}%` }} />
                  <span>{saveProgress}%</span>
                </div>
              )}
              <div className={recStyles.formActions}>
                <button type="button" className={recStyles.cancelBtn} onClick={() => setShowSaveForm(false)} disabled={saving}>Annuler</button>
                <button type="submit" className={recStyles.saveBtn2} disabled={saving || !saveForm.chapitreId}>
                  {saving ? `Envoi... ${saveProgress}%` : '💾 Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modules récents ── */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mes modules récents</h2>
        <button className={styles.newBtn} onClick={() => navigate('/dashboard/mes-modules')}>Voir tout →</button>
      </div>

      <div className={styles.moduleList}>
        {modules.slice(0, 4).map((mod, i) => (
          <div key={mod.id} className={styles.modRow}>
            <img src={COVERS[i % COVERS.length]} alt={mod.titre} className={styles.modImg} />
            <div className={styles.modInfo}>
              <div className={styles.modTitle}>{mod.titre}</div>
              <div className={styles.modMeta}>
                {mod.nb_chapitres || 0} chapitres · {mod.nb_videos || 0} vidéos · {mod.nb_etudiants || 0} étudiants
              </div>
            </div>
            <div className={styles.modActions}>
              <span className={`${styles.pill} ${mod.statut === 'publie' ? styles.pillGreen : styles.pillOrange}`}>
                {mod.statut === 'publie' ? 'Publié' : 'Brouillon'}
              </span>
              {mod.statut === 'brouillon' && (
                <button className={styles.publishBtn} onClick={() => setPublishTarget(mod)}>📤 Publier</button>
              )}
              <button className={styles.editBtn} onClick={() => navigate('/dashboard/mes-modules')}>✏️</button>
            </div>
          </div>
        ))}
        {modules.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            Aucun module créé. <button className={styles.newBtn} style={{ marginLeft: 8 }} onClick={() => navigate('/dashboard/mes-modules')}>Créer un module</button>
          </div>
        )}
      </div>
    </div>
  );
}
