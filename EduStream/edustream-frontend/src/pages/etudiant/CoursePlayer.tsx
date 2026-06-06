import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import VideoPlayer from '../../components/VideoPlayer';
import type { Video } from '../../types/video';
import { isYoutubeVideo } from '../../types/video';
import type { Chapitre, StudentModule } from '../../types/studentModule';

interface Props {
  module: StudentModule;
  onClose: () => void;
  onProgressUpdate?: () => void;
}

interface VisionnageState {
  position: number;
  termine: boolean;
}

function fmt(s?: number) {
  if (!s) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function videoFraction(video: Video, v?: VisionnageState): number {
  if (!v) return 0;
  if (v.termine) return 1;
  if (video.duree && video.duree > 0 && v.position > 0) {
    return Math.min(v.position / video.duree, 0.99);
  }
  return 0;
}

export default function CoursePlayer({ module, onClose, onProgressUpdate }: Props) {
  const [chapitres, setChapitres] = useState<Chapitre[]>(module.chapitres || []);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [currentChap, setCurrentChap] = useState<Chapitre | null>(null);
  const [visionnages, setVisionnages] = useState<Map<number, VisionnageState>>(new Map());
  const [expandedChap, setExpandedChap] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startAt, setStartAt] = useState(0);

  const visionnagesRef = useRef<Map<number, VisionnageState>>(new Map());
  const currentVideoRef = useRef<Video | null>(null);
  const lastSavedRef = useRef<{ videoId: number; position: number; termine: boolean } | null>(null);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;

  const syncVisionnages = useCallback((map: Map<number, VisionnageState>) => {
    visionnagesRef.current = map;
    setVisionnages(new Map(map));
  }, []);

  const allVideos = chapitres.flatMap(c => (c.videos || []).map(v => ({ video: v, chap: c })));

  const watchedIds = new Set(
    [...visionnages.entries()].filter(([, v]) => v.termine).map(([id]) => id)
  );

  const computeProgression = useCallback(() => {
    const videos = chapitres.flatMap(c => c.videos || []);
    if (videos.length === 0) return 0;
    const total = videos.reduce((sum, v) => sum + videoFraction(v, visionnagesRef.current.get(v.id)), 0);
    return Math.round((total / videos.length) * 100);
  }, [chapitres]);

  const persistProgress = useCallback(async (
    video: Video,
    position: number,
    termine: boolean,
    notify = true,
  ) => {
    const existing = visionnagesRef.current.get(video.id);
    const finalTermine = existing?.termine || termine;
    const finalPosition = Math.max(position, existing?.position || 0);

    const last = lastSavedRef.current;
    if (
      last?.videoId === video.id &&
      last.position === finalPosition &&
      last.termine === finalTermine
    ) {
      return;
    }

    try {
      const res = await api.post(`/videos/${video.id}/visionnage`, {
        position: finalPosition,
        termine: finalTermine,
      });
      const saved: VisionnageState = {
        position: res.data.position ?? finalPosition,
        termine: res.data.termine ?? finalTermine,
      };
      const next = new Map(visionnagesRef.current);
      next.set(video.id, saved);
      syncVisionnages(next);
      lastSavedRef.current = { videoId: video.id, position: saved.position, termine: saved.termine };
      if (notify) onProgressUpdateRef.current?.();
    } catch { /* ignore */ }
  }, [syncVisionnages]);

  const flushCurrentVideo = useCallback(async () => {
    const video = currentVideoRef.current;
    if (!video) return;
    const existing = visionnagesRef.current.get(video.id);
    if (existing) {
      await persistProgress(video, existing.position, existing.termine, false);
    }
  }, [persistProgress]);

  useEffect(() => {
    currentVideoRef.current = currentVideo;
  }, [currentVideo]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        let chaps: Chapitre[] = module.chapitres?.length ? module.chapitres : [];
        if (!chaps.length) {
          const res = await api.get(`/modules/${module.id}/chapitres`);
          chaps = res.data.data || res.data;
          setChapitres(chaps);
        }

        const vMap = new Map<number, VisionnageState>();
        const videos = chaps.flatMap(c => c.videos || []);

        await Promise.all(
          videos.map(async (v) => {
            try {
              const res = await api.get(`/videos/${v.id}/visionnage`);
              vMap.set(v.id, {
                position: res.data.position || 0,
                termine: !!res.data.termine,
              });
            } catch { /* ignore */ }
          })
        );
        syncVisionnages(vMap);

        if (chaps.length > 0 && videos.length > 0) {
          setExpandedChap(chaps[0].id);
          const firstUnwatched = videos.find(v => !vMap.get(v.id)?.termine);
          const startVideo = firstUnwatched || videos[0];
          const chap = chaps.find(c => c.videos?.some(v => v.id === startVideo.id));
          if (chap) {
            const saved = vMap.get(startVideo.id);
            setStartAt(saved?.termine ? 0 : (saved?.position || 0));
            setCurrentVideo(startVideo);
            setCurrentChap(chap);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [module.id, syncVisionnages]);

  const selectVideo = async (video: Video, chap: Chapitre) => {
    if (currentVideoRef.current && currentVideoRef.current.id !== video.id) {
      await flushCurrentVideo();
    }
    const saved = visionnagesRef.current.get(video.id);
    setStartAt(saved?.termine ? 0 : (saved?.position || 0));
    setCurrentVideo(video);
    setCurrentChap(chap);
    lastSavedRef.current = null;
  };

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    const video = currentVideoRef.current;
    if (!video) return;

    const position = Math.floor(currentTime);
    const existing = visionnagesRef.current.get(video.id);
    const termine = existing?.termine || (duration > 0 && currentTime / duration >= 0.9);
    const finalPosition = Math.max(position, existing?.position || 0);

    const next = new Map(visionnagesRef.current);
    next.set(video.id, {
      position: finalPosition,
      termine: existing?.termine || termine,
    });
    visionnagesRef.current = next;

    persistProgress(video, finalPosition, termine);
  }, [persistProgress]);

  const handleVideoEnd = useCallback(async () => {
    const video = currentVideoRef.current;
    if (!video) return;
    await persistProgress(video, video.duree || 0, true);

    const idx = allVideos.findIndex(x => x.video.id === video.id);
    if (idx < allVideos.length - 1) {
      const next = allVideos[idx + 1];
      const saved = visionnagesRef.current.get(next.video.id);
      setStartAt(saved?.termine ? 0 : (saved?.position || 0));
      setCurrentVideo(next.video);
      setCurrentChap(next.chap);
      setExpandedChap(next.chap.id);
      lastSavedRef.current = null;
    }
  }, [allVideos, persistProgress]);

  const handleClose = async () => {
    await flushCurrentVideo();
    onProgressUpdateRef.current?.();
    onClose();
  };

  const progression = computeProgression();
  const completedCount = watchedIds.size;

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
        Chargement du cours...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: '#1e293b', borderBottom: '1px solid #334155',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{module.titre}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {completedCount}/{allVideos.length} vidéos terminées · {progression}% avancement
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          style={{
            background: '#334155', border: 'none', color: '#94a3b8',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
        >
          ✕ Fermer
        </button>
      </div>

      <div style={{ height: 4, background: '#334155' }}>
        <div style={{ height: '100%', background: '#22c55e', width: `${progression}%`, transition: 'width .5s' }} />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 400 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000' }}>
          {currentVideo ? (
            <>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', maxHeight: 'calc(100vh - 280px)' }}>
                <VideoPlayer
                  video={currentVideo}
                  autoPlay
                  startAt={startAt}
                  onEnded={handleVideoEnd}
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>
              <div style={{ padding: '14px 20px', background: '#1e293b' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{currentVideo.titre}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {currentChap?.titre} · {fmt(currentVideo.duree)}
                  {visionnages.get(currentVideo.id)?.termine && ' · ✅ Terminée'}
                  {isYoutubeVideo(currentVideo) && ' · YouTube'}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: '#475569',
            }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>▶</span>
              <p>Aucune vidéo disponible dans ce cours</p>
            </div>
          )}
        </div>

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
                <button
                  type="button"
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
                    {chap.videos?.filter(v => visionnages.get(v.id)?.termine).length || 0}/{chap.videos?.length || 0}
                  </span>
                  <span style={{ color: '#475569', fontSize: 10 }}>{expandedChap === chap.id ? '▲' : '▼'}</span>
                </button>

                {expandedChap === chap.id && (chap.videos || []).map(vid => {
                  const isActive = currentVideo?.id === vid.id;
                  const saved = visionnages.get(vid.id);
                  const isDone = saved?.termine;
                  const partial = !isDone && saved && saved.position > 0;
                  return (
                    <button
                      key={vid.id}
                      type="button"
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
                        {isDone ? '✅' : partial ? '⏳' : isActive ? '▶' : isYoutubeVideo(vid) ? '📺' : '🎬'}
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
