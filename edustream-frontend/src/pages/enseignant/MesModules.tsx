import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import VideoPlayer from '../../components/VideoPlayer';
import type { Video } from '../../types/video';
import { isYoutubeVideo } from '../../types/video';
import { extractYoutubeId } from '../../utils/youtube';
import styles from './DashboardEnseignant.module.css';
import mod_styles from './MesModules.module.css';

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

type VideoModalState = {
  mode: 'add' | 'edit';
  moduleId: number;
  chapitreId: number;
  video?: Video;
};

type ConfirmState = {
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  action: () => Promise<void> | void;
};

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

const emptyVideoForm = () => ({
  titre: '',
  description: '',
  youtube_url: '',
  duree: '',
});

export default function MesModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [chapitres, setChapitres] = useState<Record<number, Chapitre[]>>({});

  const [showModForm, setShowModForm] = useState(false);
  const [editMod, setEditMod] = useState<Module | null>(null);
  const [modForm, setModForm] = useState({ titre: '', description: '', matiere: '' });
  const [savingMod, setSavingMod] = useState(false);

  const [chapForm, setChapForm] = useState<Record<number, string>>({});
  const [savingChap, setSavingChap] = useState<number | null>(null);

  const [videoModal, setVideoModal] = useState<VideoModalState | null>(null);
  const [videoForm, setVideoForm] = useState(emptyVideoForm());
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFormError, setVideoFormError] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/modules')
      .then(res => setModules(res.data.data || res.data))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      await confirm.action();
      setConfirm(null);
    } finally {
      setConfirmLoading(false);
    }
  };

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

  const saveMod = async () => {
    setSavingMod(true);
    try {
      if (editMod) {
        await api.put(`/modules/${editMod.id}`, modForm);
        setShowModForm(false);
        setEditMod(null);
        load();
      } else {
        const res = await api.post('/modules', modForm);
        const newMod: Module = res.data.data || res.data;
        setShowModForm(false);
        setEditMod(null);
        load();
        setExpanded(newMod.id);
        await loadChapitres(newMod.id);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Erreur.');
    } finally {
      setSavingMod(false);
    }
  };

  const submitMod = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMod) {
      setConfirm({
        title: 'Enregistrer les modifications ?',
        message: `Voulez-vous mettre à jour le module « ${modForm.titre} » ? Les changements seront visibles pour les étudiants inscrits.`,
        confirmLabel: 'Enregistrer',
        action: saveMod,
      });
      return;
    }
    saveMod();
  };

  const deleteMod = (id: number) => {
    setConfirm({
      title: 'Supprimer ce module ?',
      message: 'Cette action est irréversible. Tous les chapitres et vidéos associés seront supprimés.',
      danger: true,
      action: async () => {
        await api.delete(`/modules/${id}`);
        setModules(prev => prev.filter(m => m.id !== id));
        if (expanded === id) setExpanded(null);
      },
    });
  };

  const publierMod = (id: number, titre: string) => {
    setConfirm({
      title: 'Publier ce module ?',
      message: `Le module « ${titre} » sera visible par tous les étudiants. Ils pourront le découvrir et s'y inscrire.`,
      confirmLabel: 'Publier',
      action: async () => {
        await api.patch(`/modules/${id}/publier`);
        setModules(prev => prev.map(m => m.id === id ? { ...m, statut: 'publie' } : m));
      },
    });
  };

  const addChapitre = async (moduleId: number) => {
    const titre = chapForm[moduleId]?.trim();
    if (!titre) return;
    setSavingChap(moduleId);
    try {
      await api.post(`/modules/${moduleId}/chapitres`, { titre });
      setChapForm(prev => ({ ...prev, [moduleId]: '' }));
      await loadChapitres(moduleId);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Erreur.');
    } finally {
      setSavingChap(null);
    }
  };

  const deleteChapitre = (moduleId: number, chapId: number) => {
    setConfirm({
      title: 'Supprimer ce chapitre ?',
      message: 'Toutes les vidéos de ce chapitre seront également supprimées.',
      danger: true,
      action: async () => {
        await api.delete(`/modules/${moduleId}/chapitres/${chapId}`);
        setChapitres(prev => ({
          ...prev,
          [moduleId]: prev[moduleId].filter(c => c.id !== chapId),
        }));
        load();
      },
    });
  };

  const openAddVideo = (moduleId: number, chapitreId: number) => {
    setVideoModal({ mode: 'add', moduleId, chapitreId });
    setVideoForm(emptyVideoForm());
    setVideoFile(null);
    setVideoFormError('');
    setUploadProgress(0);
  };

  const openEditVideo = (moduleId: number, chapitreId: number, video: Video) => {
    setVideoModal({ mode: 'edit', moduleId, chapitreId, video });
    setVideoFormError('');
    setVideoForm({
      titre: video.titre,
      description: video.description || '',
      youtube_url: isYoutubeVideo(video) ? video.url_stockage : '',
      duree: video.duree ? String(video.duree) : '',
    });
    setVideoFile(null);
    setUploadProgress(0);
  };

  const closeVideoModal = () => {
    if (!savingVideo) setVideoModal(null);
  };

  const submitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoModal) return;

    const { moduleId, chapitreId, mode, video } = videoModal;
    const isEdit = mode === 'edit';
    const youtubeUrl = videoForm.youtube_url.trim();
    const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;
    const hasFile = !!videoFile;
    const duree = videoForm.duree ? parseInt(videoForm.duree, 10) : null;

    setVideoFormError('');

    if (!isEdit) {
      if (!youtubeId && !hasFile) {
        setVideoFormError('Renseignez au moins un lien YouTube ou un fichier vidéo local.');
        return;
      }
      if (youtubeUrl && !youtubeId) {
        setVideoFormError('Lien YouTube invalide. Exemple : https://www.youtube.com/watch?v=...');
        return;
      }
    } else if (video && isYoutubeVideo(video)) {
      if (youtubeUrl && !youtubeId) {
        setVideoFormError('Lien YouTube invalide.');
        return;
      }
    }

    const performSaveVideo = async () => {
      setSavingVideo(true);
      setUploadProgress(0);

      try {
        if (isEdit && video) {
          if (isYoutubeVideo(video)) {
            await api.put(`/modules/${moduleId}/chapitres/${chapitreId}/videos/${video.id}`, {
              titre: videoForm.titre,
              description: videoForm.description || null,
              youtube_url: youtubeUrl || video.url_stockage,
              duree,
            });
          } else if (hasFile) {
            const fd = new FormData();
            fd.append('titre', videoForm.titre);
            if (videoForm.description) fd.append('description', videoForm.description);
            if (duree !== null) fd.append('duree', String(duree));
            fd.append('video', videoFile);
            await api.put(`/modules/${moduleId}/chapitres/${chapitreId}/videos/${video.id}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (ev) => {
                if (ev.total) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
              },
            });
          } else {
            await api.put(`/modules/${moduleId}/chapitres/${chapitreId}/videos/${video.id}`, {
              titre: videoForm.titre,
              description: videoForm.description || null,
              duree,
            });
          }
        } else {
          const fd = new FormData();
          fd.append('titre', videoForm.titre);
          if (videoForm.description) fd.append('description', videoForm.description);
          if (duree !== null) fd.append('duree', String(duree));
          if (youtubeUrl) fd.append('youtube_url', youtubeUrl);
          if (hasFile) fd.append('video', videoFile);

          await api.post(`/modules/${moduleId}/chapitres/${chapitreId}/videos`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (ev) => {
              if (ev.total) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            },
          });
        }

        setVideoModal(null);
        await loadChapitres(moduleId);
        load();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setVideoFormError(msg || 'Erreur lors de l\'enregistrement.');
      } finally {
        setSavingVideo(false);
      }
    };

    if (isEdit) {
      setConfirm({
        title: 'Enregistrer les modifications ?',
        message: `Voulez-vous mettre à jour la vidéo « ${videoForm.titre} » ?`,
        confirmLabel: 'Enregistrer',
        action: performSaveVideo,
      });
      return;
    }

    performSaveVideo();
  };

  const deleteVideo = (moduleId: number, chapId: number, videoId: number) => {
    setConfirm({
      title: 'Supprimer cette vidéo ?',
      message: 'Cette vidéo sera définitivement retirée du module. Les fichiers locaux seront supprimés du serveur.',
      danger: true,
      action: async () => {
        await api.delete(`/modules/${moduleId}/chapitres/${chapId}/videos/${videoId}`);
        setChapitres(prev => ({
          ...prev,
          [moduleId]: prev[moduleId].map(c =>
            c.id === chapId ? { ...c, videos: c.videos.filter(v => v.id !== videoId) } : c
          ),
        }));
        load();
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes modules</h1>
          <p className={styles.subtitle}>{modules.length} module(s) créé(s)</p>
        </div>
        <button className={styles.newBtn} onClick={openCreateMod}>+ Nouveau module</button>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        loading={confirmLoading}
        onConfirm={runConfirm}
        onCancel={() => !confirmLoading && setConfirm(null)}
      />

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

      {videoModal && (
        <div className={mod_styles.overlay} onClick={closeVideoModal}>
          <div className={mod_styles.modal} onClick={e => e.stopPropagation()}>
            <div className={mod_styles.modalHeader}>
              <h3>{videoModal.mode === 'edit' ? 'Modifier la vidéo' : 'Ajouter une vidéo'}</h3>
              {!savingVideo && <button className={mod_styles.closeBtn} onClick={closeVideoModal}>✕</button>}
            </div>
            <form onSubmit={submitVideo} className={mod_styles.form}>
              {videoModal.mode === 'add' && (
                <p className={mod_styles.sourceHint}>
                  <strong>Comment ajouter votre contenu ?</strong><br />
                  Renseignez au moins <strong>un lien YouTube</strong> ou <strong>un fichier vidéo local</strong> (les deux sont possibles — le lien YouTube sera prioritaire). Le lien YouTube est recommandé : aucun stockage sur le serveur.
                </p>
              )}

              <label>Titre de la vidéo *</label>
              <input required value={videoForm.titre} onChange={e => setVideoForm({ ...videoForm, titre: e.target.value })} placeholder="Ex: Introduction aux pointeurs" />

              <label>Description</label>
              <textarea rows={2} value={videoForm.description} onChange={e => setVideoForm({ ...videoForm, description: e.target.value })} placeholder="Résumé de la vidéo (optionnel)" />

              {(videoModal.mode === 'add' || (videoModal.video && isYoutubeVideo(videoModal.video))) && (
                <>
                  <label>📺 Lien YouTube {videoModal.mode === 'add' ? '' : '*'}</label>
                  <input
                    value={videoForm.youtube_url}
                    onChange={e => setVideoForm({ ...videoForm, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  />
                </>
              )}

              {videoModal.mode === 'add' && (
                <div className={mod_styles.sourceDivider}>ou</div>
              )}

              {(videoModal.mode === 'add' || (videoModal.video && !isYoutubeVideo(videoModal.video))) && (
                <>
                  <label>📁 Fichier vidéo local {videoModal.mode === 'add' ? '(MP4, WebM — max 500 Mo)' : '— remplacer (optionnel)'}</label>
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
                        <span>Glissez votre vidéo ici ou cliquez pour parcourir</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" style={{ display: 'none' }} onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                </>
              )}

              <label>Durée (secondes, optionnel)</label>
              <input type="number" min="0" value={videoForm.duree} onChange={e => setVideoForm({ ...videoForm, duree: e.target.value })} placeholder="Ex: 600" />

              {videoFormError && <p className={mod_styles.formError}>{videoFormError}</p>}

              {savingVideo && videoFile && (
                <div className={mod_styles.progressWrap}>
                  <div className={mod_styles.progressBar} style={{ width: `${uploadProgress}%` }} />
                  <span>{uploadProgress}%</span>
                </div>
              )}

              <div className={mod_styles.formActions}>
                <button type="button" className={mod_styles.cancelBtn} onClick={closeVideoModal} disabled={savingVideo}>Annuler</button>
                <button type="submit" className={mod_styles.saveBtn} disabled={savingVideo}>
                  {savingVideo ? 'Enregistrement...' : videoModal.mode === 'edit' ? 'Enregistrer' : '➕ Ajouter la vidéo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {playingVideo && (
        <div className={mod_styles.overlay} onClick={() => setPlayingVideo(null)}>
          <div className={mod_styles.playerModal} onClick={e => e.stopPropagation()}>
            <div className={mod_styles.modalHeader}>
              <h3>▶ {playingVideo.titre}</h3>
              <button className={mod_styles.closeBtn} onClick={() => setPlayingVideo(null)}>✕</button>
            </div>
            <VideoPlayer video={playingVideo} autoPlay className={mod_styles.videoPlayer} />
          </div>
        </div>
      )}

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
                      <button className={mod_styles.publishBtn} onClick={() => publierMod(mod.id, mod.titre)} title="Publier">📤 Publier</button>
                    )}
                    <button className={mod_styles.iconBtn} onClick={() => openEditMod(mod)} title="Modifier">✏️</button>
                    <button className={mod_styles.iconBtnDanger} onClick={() => deleteMod(mod.id)} title="Supprimer">🗑</button>
                    <button className={mod_styles.expandBtn} onClick={() => toggleExpand(mod.id)}>
                      {expanded === mod.id ? '▲ Réduire' : '▼ Gérer le contenu'}
                    </button>
                  </div>
                </div>
              </div>

              {expanded === mod.id && (
                <div className={mod_styles.chapitresSection}>
                  <div className={mod_styles.chapitresHeader}>
                    <span className={mod_styles.chapitresTitle}>Chapitres & Vidéos</span>
                  </div>

                  {(chapitres[mod.id] || []).length === 0 && (
                    <div className={mod_styles.guideBox}>
                      <strong>Prochaine étape :</strong> créez un chapitre ci-dessous (ex. « Chapitre 1 »), puis cliquez sur <strong>+ Ajouter une vidéo</strong> pour y insérer un lien YouTube ou un fichier local.
                    </div>
                  )}

                  {(chapitres[mod.id] || []).map((chap) => (
                    <div key={chap.id} className={mod_styles.chapCard}>
                      <div className={mod_styles.chapHead}>
                        <span className={mod_styles.chapNum}>Chap {chap.ordre}</span>
                        <span className={mod_styles.chapTitre}>{chap.titre}</span>
                        <span className={mod_styles.chapVideoCount}>{chap.videos?.length || 0} vidéo(s)</span>
                        <button className={mod_styles.addVideoBtn} onClick={() => openAddVideo(mod.id, chap.id)}>
                          + Ajouter une vidéo
                        </button>
                        <button className={mod_styles.iconBtnDanger} onClick={() => deleteChapitre(mod.id, chap.id)} title="Supprimer le chapitre">🗑</button>
                      </div>

                      {(chap.videos || []).length > 0 && (
                        <div className={mod_styles.videoList}>
                          {chap.videos.map(vid => (
                            <div key={vid.id} className={mod_styles.videoRow}>
                              <span className={mod_styles.videoIcon}>{isYoutubeVideo(vid) ? '📺' : '🎬'}</span>
                              <span className={mod_styles.videoTitre}>{vid.titre}</span>
                              {isYoutubeVideo(vid) && <span className={mod_styles.youtubeBadge}>YouTube</span>}
                              <span className={mod_styles.videoDuree}>{fmt(vid.duree)}</span>
                              <span className={`${mod_styles.videoStatut} ${vid.statut === 'disponible' ? mod_styles.disponible : mod_styles.traitement}`}>
                                {vid.statut === 'disponible' ? '✅' : '⏳'}
                              </span>
                              <div className={mod_styles.videoActions}>
                                <button className={mod_styles.playBtn} onClick={() => setPlayingVideo(vid)} title="Lire">▶ Lire</button>
                                <button className={mod_styles.iconBtn} onClick={() => openEditVideo(mod.id, chap.id, vid)} title="Modifier">✏️</button>
                                <button className={mod_styles.iconBtnDanger} onClick={() => deleteVideo(mod.id, chap.id, vid.id)} title="Supprimer">🗑</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

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
