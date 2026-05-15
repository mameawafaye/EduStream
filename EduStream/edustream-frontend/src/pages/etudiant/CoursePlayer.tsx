import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

interface Video {
  id: number;
  titre: string;
  duree?: number;
  url_publique?: string;
  url_stockage: string;
  statut: string;
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
  description?: string;
  chapitres?: Chapitre[];
}

interface Props {
  module: Module;
  onClose: () => void;
}

function fmt(s?: number) {
  if (!s) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function CoursePlayer({ module, onClose }: Props) {
  const [chapitres, setChapitres] = useState<Chapitre[]>(module.chapitres || []);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [currentChap, setCurrentChap] = useState<Chapitre | null>(null);
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [expandedChap, setExpandedChap] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger les chapitres si pas encore chargés
  useEffect(() => {
    if (!chapitres.length) {
      api.get(`/modules/${module.id}/chapitres`)
        .then(res => {
          const chaps: Chapitre[] = res.data.data || res.data;
          setChapitres(chaps);
          // Ouvrir le premier chapitre
          if (chaps.length > 0) {
            setExpandedChap(chaps[0].id);
            if (chaps[0].videos?.length > 0) {
              selectVideo(chaps[0].videos[0], chaps[0]);
            }
          }
        })
        .catch(() => {});
    } else {
      if (chapitres.length > 0) {
        setExpandedChap(chapitres[0].id);
        if (chapitres[0].videos?.length > 0) {
          selectVideo(chapitres[0].videos[0], chapitres[0]);
        }
      }
    }
  }, []);

  const selectVideo = (video: Video, chap: Chapitre) => {
    setCurrentVideo(video);
    setCurrentChap(chap);
    if (progressTimer.current) clearInterval(progressTimer.current);
  };

  // Enregistrer la progression toutes les 10 secondes
  useEffect(() => {
    if (!currentVideo || !videoRef.current) return;

    const saveProgress = () => {
      const v = videoRef.current;
      if (!v) return;
      const position = Math.floor(v.currentTime);
      const termine = v.ended || (v.duration > 0 && v.currentTime / v.duration > 0.9);
      api.post(`/videos/${currentVideo.id}/visionnage`, { position, termine }).catch(() => {});
      if (termine) setWatched(prev => new Set([...prev, currentVideo.id]));
    };

    progressTimer.current = setInterval(saveProgress, 10000);
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [currentVideo]);

  const handleVideoEnd = () => {
    if (!currentVideo) return;
    api.post(`/videos/${currentVideo.id}/visionnage`, { position: 0, termine: true }).catch(() => {});
    setWatched(prev => new Set([...prev, currentVideo.id]));

    // Passer à la vidéo suivante automatiquement
    const allVideos = chapitres.flatMap(c => c.videos.map(v => ({ video: v, chap: c })));
    const idx = allVideos.findIndex(x => x.video.id === currentVideo.id);
    if (idx < allVideos.length - 1) {
      const next = allVideos[idx + 1];
      selectVideo(next.video, next.chap);
      setExpandedChap(next.chap.id);
    }
  };

  const totalVideos = chapitres.reduce((s, c) => s + c.videos.length, 0);
  const progression = totalVideos > 0 ? Math.round((watched.size / totalVideos) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: '#1e293b', borderBottom: '1px solid #334155',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{module.titre}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {watched.size}/{totalVideos} vidéos · {progression}% complété
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#334155', border: 'none', color: '#94a3b8',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
        >
          ✕ Fermer
        </button>
      </div>

      {/* Barre de progression globale */}
      <div style={{ height: 4, background: '#334155' }}>
        <div style={{ height: '100%', background: '#22c55e', width: `${progression}%`, transition: 'width .5s' }} />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Lecteur vidéo ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000' }}>
          {currentVideo ? (
            <>
              <video
                ref={videoRef}
                key={currentVideo.id}
                src={currentVideo.url_publique || `http://localhost:8000/storage/${currentVideo.url_stockage}`}
                controls
                autoPlay
                onEnded={handleVideoEnd}
                style={{ width: '100%', flex: 1, background: '#000', maxHeight: 'calc(100vh - 280px)' }}
              />
              <div style={{ padding: '14px 20px', background: '#1e293b' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{currentVideo.titre}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {currentChap?.titre} · {fmt(currentVideo.duree)}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: '#475569',
            }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>▶</span>
              <p>Sélectionnez une vidéo pour commencer</p>
            </div>
          )}
        </div>

        {/* ── Sidebar chapitres ── */}
        <div style={{
          width: 300, background: '#1e293b', borderLeft: '1px solid #334155',
          overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Contenu du cours
          </div>

          {chapitres.length === 0 ? (
            <div style={{ padding: 24, color: '#475569', fontSize: 13, textAlign: 'center' }}>
              Aucun contenu disponible
            </div>
          ) : (
            chapitres.map(chap => (
              <div key={chap.id}>
                {/* En-tête chapitre */}
                <button
                  onClick={() => setExpandedChap(expandedChap === chap.id ? null : chap.id)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: expandedChap === chap.id ? '#0f172a' : 'transparent',
                    border: 'none', borderBottom: '1px solid #334155',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#1e1b4b', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
                    {chap.ordre}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>{chap.titre}</span>
                  <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>
                    {chap.videos?.filter(v => watched.has(v.id)).length || 0}/{chap.videos?.length || 0}
                  </span>
                  <span style={{ color: '#475569', fontSize: 10 }}>{expandedChap === chap.id ? '▲' : '▼'}</span>
                </button>

                {/* Vidéos du chapitre */}
                {expandedChap === chap.id && (chap.videos || []).map(vid => {
                  const isActive = currentVideo?.id === vid.id;
                  const isDone = watched.has(vid.id);
                  return (
                    <button
                      key={vid.id}
                      onClick={() => selectVideo(vid, chap)}
                      style={{
                        width: '100%', padding: '10px 16px 10px 32px',
                        background: isActive ? '#0f172a' : 'transparent',
                        border: 'none', borderBottom: '1px solid #1e293b',
                        display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer', textAlign: 'left',
                        borderLeft: isActive ? '3px solid #22c55e' : '3px solid transparent',
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0 }}>
                        {isDone ? '✅' : isActive ? '▶' : '🎬'}
                      </span>
                      <span style={{
                        fontSize: 13, color: isActive ? '#f1f5f9' : '#94a3b8',
                        fontWeight: isActive ? 600 : 400, flex: 1,
                        lineHeight: 1.4,
                      }}>
                        {vid.titre}
                      </span>
                      <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>{fmt(vid.duree)}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
