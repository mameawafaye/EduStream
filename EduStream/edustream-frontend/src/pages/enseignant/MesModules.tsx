import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardEnseignant.module.css';
import mod_styles from './MesModules.module.css';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Video {
  id: number;
  titre: string;
  duree?: number;
  statut: string;
  url_publique?: string;
  url_stockage: string;
}

interface Chapitre {
  id: number;
  titre: string;
  ordre: number;
  videos: Video[];
}

interface Module {
  id: number;
  titre: string;
  description: string;
  matiere?: string;
  statut: 'publie' | 'brouillon';
  nb_chapitres?: number;
  nb_videos?: number;
  nb_etudiants?: number;
  chapitres?: Chapitre[];
}

const COVERS = [
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
];

function fmt(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/* ─── Composant principal ────────────────────────────────────────────────── */
export default function MesModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [chapitres, setChapitres] = useState<Record<number, Chapitre[]>>({});

  // Formulaire module
  const [showModForm, setShowModForm] = useState(false);
  const [editMod, setEditMod] = useState<Module | null>(null);
  const [modForm, setModForm] = useState({ titre: '', description: '', matiere: '' });
  const [savingMod, setSavingMod] = useState(false);

  // Formulaire chapitre
  const [chapForm, setChapForm] = useState<Record<number, string>>({});
  const [savingChap, setSavingChap] = useState<number | null>(null);

  // Upload vidéo
  const [uploadTarget, setUploadTarget] = useState<{ moduleId: number; chapitreId: number } | null>(null);
  const [videoForm, setVideoForm] = useState({ titre: '' });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lecteur vidéo inline
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/modules')
      .then(res => setModules(res.data.data || res.data))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* ── Charger chapitres d'un module ── */
  const loadChapitres = async (moduleId: number) => {
    try {
      const res = await api.get(`/modules/${moduleId}/chapitres`);
      const chaps: Chapitre[] = res.data.data || res.data;
      setChapitres(prev => ({ ...prev, [moduleId]: chaps }));
    } catch {}
  };

  const toggleExpand = (moduleId: number) => {
    if (expanded === moduleId) {
      setExpanded(null);
    } else {
      setExpanded(moduleId);
      if (!chapitres[moduleId]) loadChapitres(moduleId);
    }
  };

  /* ── Créer / modifier module ── */
  const openCreateMod = () => {
    setEditMod(null);
    setModForm({ titre: '', description: '', matiere: '' });
    setShowModForm(true);
  };

  const openEditMod = (mod: Module) => {
    setEditMod(mod);
    setModForm({ titre: mod.titre, description: mod.description || '', matiere: mod.matiere || '' });
    setShowModForm(true);
  };

  const submitMod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMod(true);
    try {
      if (editMod) {
        await api.put(`/modules/${editMod.id}`, modForm);
      } else {
        await api.post('/modules', modForm);
      }
      setShowModForm(false);
      setEditMod(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally {
      setSavingMod(false);
    }
  };

  /* ── Supprimer module ── */
  const deleteMod = async (id: number) => {
    if (!confirm('Supprimer ce module et tout son contenu ?')) return;
    try {
      await api.delete(`/modules/${id}`);
      setModules(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  /* ── Publier module ── */
  const publierMod = async (id: number) => {
    try {
      await api.patch(`/modules/${id}/publier`);
      setModules(prev => prev.map(m => m.id === id ? { ...m, statut: 'publie' } : m));
    } catch {}
  };

  /* ── Ajouter chapitre ── */
  const addChapitre = async (moduleId: number) => {
    const titre = chapForm[moduleId]?.trim();
    if (!titre) return;
    setSavingChap(moduleId);
    try {
      await api.post(`/modules/${moduleId}/chapitres`, { titre });
      setChapForm(prev => ({ ...prev, [moduleId]: '' }));
      await loadChapitres(moduleId);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally {
      setSavingChap(null);
    }
  };

  /* ── Supprimer chapitre ── */
  const deleteChapitre = async (moduleId: number, chapId: number) => {
    if (!confirm('Supprimer ce chapitre et ses vidéos ?')) return;
    try {
      await api.delete(`/modules/${moduleId}/chapitres/${chapId}`);
      setChapitres(prev => ({
        ...prev,
        [moduleId]: prev[moduleId].filter(c => c.id !== chapId),
      }));
      load();
    } catch {}
  };

  /* ── Upload vidéo ── */
  const openUpload = (moduleId: number, chapitreId: number) => {
    setUploadTarget({ moduleId, chapitreId });
    setVideoForm({ titre: '' });
    setVideoFile(null);
    setUploadProgress(0);
  };

  const submitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTarget || !videoFile) return;
    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('titre', videoForm.titre);
    fd.append('video', videoFile);

    try {
      await api.post(
        `/modules/${uploadTarget.moduleId}/chapitres/${uploadTarget.chapitreId}/videos`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );
      setUploadTarget(null);
      await loadChapitres(uploadTarget.moduleId);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Supprimer vidéo ── */
  const deleteVideo = async (moduleId: number, chapId: number, videoId: number) => {
    if (!confirm('Supprimer cette vidéo ?')) return;
    try {
      await api.delete(`/modules/${moduleId}/chapitres/${chapId}/videos/${videoId}`);
      setChapitres(prev => ({
        ...prev,
        [moduleId]: prev[moduleId].map(c =>
          c.id === chapId ? { ...c, videos: c.videos.filter(v => v.id !== videoId) } : c
        ),
      }));
      load();
    } catch {}
  };

  /* ─── Rendu ─────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes modules</h1>
          <p className={styles.subtitle}>{modules.length} module(s) créé(s)</p>
        </div>
        <button className={styles.newBtn} onClick={openCreateMod}>+ Nouveau module</button>
      </div>

      {/* ── Modal module ── */}
      {showModForm && (
        <div className={mod_styles.overlay} onClick={() => setShowModForm(false)}>
          <div className={mod_styles.modal} onClick={e => e.stopPropagation()}>
            <div className={mod_styles.modalHeader}>
              <h3>{editMod ? 'Modifier le module' : 'Nouveau module'}</h3>
              <button className={mod_styles.closeBtn} onClick={() => setShowModForm(false)}>✕</button>
            </div>
            <form onSubmit={submitMod} className={mod_styles.form}>
              <label>Titre *</label>
              <input required value={modForm.titre} onChange={e => setModForm({ ...modForm, titre: e.target.value })} placeholder="Ex: Algorithmique avancée" />
              <label>Matière</label>
              <input value={modForm.matiere} onChange={e => setModForm({ ...modForm, matiere: e.target.value })} placeholder="Ex: Informatique" />
              <label>Description</label>
              <textarea rows={3} value={modForm.description} onChange={e => setModForm({ ...modForm, description: e.target.value })} placeholder="Décrivez le contenu du module..." />
              <div className={mod_styles.formActions}>
                <button type="button" className={mod_styles.cancelBtn} onClick={() => setShowModForm(false)}>Annuler</button>
                <button type="submit" className={mod_styles.saveBtn} disabled={savingMod}>
                  {savingMod ? 'Enregistrement...' : editMod ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal upload vidéo ── */}
      {uploadTarget && (
        <div className={mod_styles.overlay} onClick={() => !uploading && setUploadTarget(null)}>
          <div className={mod_styles.modal} onClick={e => e.stopPropagation()}>
            <div className={mod_styles.modalHeader}>
              <h3>Ajouter une vidéo</h3>
              {!uploading && <button className={mod_styles.closeBtn} onClick={() => setUploadTarget(null)}>✕</button>}
            </div>
            <form onSubmit={submitVideo} className={mod_styles.form}>
              <label>Titre de la vidéo *</label>
              <input required value={videoForm.titre} onChange={e => setVideoForm({ titre: e.target.value })} placeholder="Ex: Introduction aux pointeurs" />
              <label>Fichier vidéo * (MP4, WebM — max 500 Mo)</label>
              <div
                className={mod_styles.dropZone}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setVideoFile(f); }}
              >
                {videoFile ? (
                  <div className={mod_styles.fileChosen}>
                    <span>🎬</span>
                    <span>{videoFile.name}</span>
                    <span className={mod_styles.fileSize}>({(videoFile.size / 1024 / 1024).toFixed(1)} Mo)</span>
                  </div>
                ) : (
                  <div className={mod_styles.dropHint}>
                    <span style={{ fontSize: 32 }}>📁</span>
                    <span>Glissez votre vidéo ici ou cliquez pour choisir</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" style={{ display: 'none' }} onChange={e => setVideoFile(e.target.files?.[0] || null)} />

              {uploading && (
                <div className={mod_styles.progressWrap}>
                  <div className={mod_styles.progressBar} style={{ width: `${uploadProgress}%` }} />
                  <span>{uploadProgress}%</span>
                </div>
              )}

              <div className={mod_styles.formActions}>
                <button type="button" className={mod_styles.cancelBtn} onClick={() => setUploadTarget(null)} disabled={uploading}>Annuler</button>
                <button type="submit" className={mod_styles.saveBtn} disabled={uploading || !videoFile}>
                  {uploading ? `Upload en cours... ${uploadProgress}%` : '⬆ Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lecteur vidéo inline ── */}
      {playingVideo && (
        <div className={mod_styles.overlay} onClick={() => setPlayingVideo(null)}>
          <div className={mod_styles.playerModal} onClick={e => e.stopPropagation()}>
            <div className={mod_styles.modalHeader}>
              <h3>▶ {playingVideo.titre}</h3>
              <button className={mod_styles.closeBtn} onClick={() => setPlayingVideo(null)}>✕</button>
            </div>
            <video
              src={playingVideo.url_publique || playingVideo.url_stockage}
              controls
              autoPlay
              className={mod_styles.videoPlayer}
            />
          </div>
        </div>
      )}

      {/* ── Liste des modules ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Chargement...</div>
      ) : modules.length === 0 ? (
        <div className={mod_styles.empty}>
          <span style={{ fontSize: 48 }}>📁</span>
          <p>Vous n'avez pas encore créé de module.</p>
          <button className={styles.newBtn} onClick={openCreateMod}>+ Créer mon premier module</button>
        </div>
      ) : (
        <div className={mod_styles.moduleList}>
          {modules.map((mod, i) => (
            <div key={mod.id} className={mod_styles.moduleCard}>
              {/* ── En-tête module ── */}
              <div className={mod_styles.moduleHead}>
                <img src={COVERS[i % COVERS.length]} alt="" className={mod_styles.modThumb} />
                <div className={mod_styles.modMeta}>
                  <div className={mod_styles.modTitle}>{mod.titre}</div>
                  {mod.matiere && <div className={mod_styles.modMatiere}>{mod.matiere}</div>}
                  <div className={mod_styles.modStats}>
                    <span>📁 {mod.nb_chapitres || 0} chapitres</span>
                    <span>🎥 {mod.nb_videos || 0} vidéos</span>
                    <span>👥 {mod.nb_etudiants || 0} étudiants</span>
                  </div>
                </div>
                <div className={mod_styles.modActions}>
                  <span className={`${mod_styles.pill} ${mod.statut === 'publie' ? mod_styles.pillGreen : mod_styles.pillOrange}`}>
                    {mod.statut === 'publie' ? '✅ Publié' : '📝 Brouillon'}
                  </span>
                  <div className={mod_styles.actionBtns}>
                    {mod.statut === 'brouillon' && (
                      <button className={mod_styles.publishBtn} onClick={() => publierMod(mod.id)} title="Publier">📤 Publier</button>
                    )}
                    <button className={mod_styles.iconBtn} onClick={() => openEditMod(mod)} title="Modifier">✏️</button>
                    <button className={mod_styles.iconBtnDanger} onClick={() => deleteMod(mod.id)} title="Supprimer">🗑</button>
                    <button className={mod_styles.expandBtn} onClick={() => toggleExpand(mod.id)}>
                      {expanded === mod.id ? '▲ Réduire' : '▼ Gérer le contenu'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Contenu expandé : chapitres + vidéos ── */}
              {expanded === mod.id && (
                <div className={mod_styles.chapitresSection}>
                  <div className={mod_styles.chapitresHeader}>
                    <span className={mod_styles.chapitresTitle}>Chapitres & Vidéos</span>
                  </div>

                  {/* Liste des chapitres */}
                  {(chapitres[mod.id] || []).map((chap) => (
                    <div key={chap.id} className={mod_styles.chapCard}>
                      <div className={mod_styles.chapHead}>
                        <span className={mod_styles.chapNum}>Chap {chap.ordre}</span>
                        <span className={mod_styles.chapTitre}>{chap.titre}</span>
                        <span className={mod_styles.chapVideoCount}>{chap.videos?.length || 0} vidéo(s)</span>
                        <button className={mod_styles.addVideoBtn} onClick={() => openUpload(mod.id, chap.id)}>
                          + Ajouter une vidéo
                        </button>
                        <button className={mod_styles.iconBtnDanger} onClick={() => deleteChapitre(mod.id, chap.id)} title="Supprimer le chapitre">🗑</button>
                      </div>

                      {/* Vidéos du chapitre */}
                      {(chap.videos || []).length > 0 && (
                        <div className={mod_styles.videoList}>
                          {chap.videos.map(vid => (
                            <div key={vid.id} className={mod_styles.videoRow}>
                              <span className={mod_styles.videoIcon}>🎬</span>
                              <span className={mod_styles.videoTitre}>{vid.titre}</span>
                              <span className={mod_styles.videoDuree}>{fmt(vid.duree)}</span>
                              <span className={`${mod_styles.videoStatut} ${vid.statut === 'disponible' ? mod_styles.disponible : mod_styles.traitement}`}>
                                {vid.statut === 'disponible' ? '✅' : '⏳'}
                              </span>
                              <div className={mod_styles.videoActions}>
                                <button
                                  className={mod_styles.playBtn}
                                  onClick={() => setPlayingVideo(vid)}
                                  title="Lire la vidéo"
                                >▶ Lire</button>
                                <button
                                  className={mod_styles.iconBtnDanger}
                                  onClick={() => deleteVideo(mod.id, chap.id, vid.id)}
                                  title="Supprimer"
                                >🗑</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Ajouter un chapitre */}
                  <div className={mod_styles.addChapRow}>
                    <input
                      className={mod_styles.chapInput}
                      placeholder="Titre du nouveau chapitre..."
                      value={chapForm[mod.id] || ''}
                      onChange={e => setChapForm(prev => ({ ...prev, [mod.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addChapitre(mod.id)}
                    />
                    <button
                      className={mod_styles.addChapBtn}
                      onClick={() => addChapitre(mod.id)}
                      disabled={savingChap === mod.id || !chapForm[mod.id]?.trim()}
                    >
                      {savingChap === mod.id ? '...' : '+ Ajouter'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
