import { useEffect, useRef } from 'react';
import type { Video } from '../types/video';
import { isYoutubeVideo } from '../types/video';
import { storageUrl } from '../utils/storageUrl';
import { youtubeEmbedUrl } from '../utils/youtube';

interface Props {
  video: Video;
  autoPlay?: boolean;
  startAt?: number;
  className?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          events?: {
            onReady?: (e: { target: YtPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
          playerVars?: Record<string, string | number>;
        }
      ) => YtPlayer;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YtPlayer {
  destroy: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

let ytApiLoading: Promise<void> | null = null;

function loadYoutubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiLoading) return ytApiLoading;

  ytApiLoading = new Promise(resolve => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });

  return ytApiLoading;
}

export default function VideoPlayer({
  video,
  autoPlay = false,
  startAt = 0,
  className,
  onEnded,
  onTimeUpdate,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YtPlayer | null>(null);
  const nativeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAppliedRef = useRef(false);

  const onEndedRef = useRef(onEnded);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onEndedRef.current = onEnded;
  onTimeUpdateRef.current = onTimeUpdate;

  const isYoutube = isYoutubeVideo(video);
  const youtubeId = video.youtube_id;

  /* ── Lecteur natif (upload) ── */
  useEffect(() => {
    if (isYoutube) return;

    startAppliedRef.current = false;
    const el = videoRef.current;
    if (!el) return;

    const applyStart = () => {
      if (startAppliedRef.current || startAt <= 0) return;
      if (!Number.isFinite(el.duration) || el.duration <= 0) return;
      el.currentTime = Math.min(startAt, Math.max(0, el.duration - 0.5));
      startAppliedRef.current = true;
    };

    el.addEventListener('loadedmetadata', applyStart);
    if (el.readyState >= 1) applyStart();

    if (onTimeUpdateRef.current) {
      nativeTimerRef.current = setInterval(() => {
        if (!el || el.paused) return;
        onTimeUpdateRef.current?.(el.currentTime, el.duration || 0);
      }, 5000);
    }

    return () => {
      el.removeEventListener('loadedmetadata', applyStart);
      if (nativeTimerRef.current) {
        clearInterval(nativeTimerRef.current);
        nativeTimerRef.current = null;
      }
    };
  }, [isYoutube, video.id, startAt]);

  /* ── Lecteur YouTube ── */
  useEffect(() => {
    if (!isYoutube || !youtubeId || !ytContainerRef.current) return;

    let cancelled = false;

    loadYoutubeApi().then(() => {
      if (cancelled || !ytContainerRef.current || !window.YT?.Player) return;

      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: youtubeId,
        playerVars: { autoplay: autoPlay ? 1 : 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            if (startAt > 0) {
              e.target.seekTo(startAt, true);
            }
          },
          onStateChange: (e) => {
            if (e.data === window.YT?.PlayerState.ENDED) {
              onEndedRef.current?.();
            }
          },
        },
      });

      ytTimerRef.current = setInterval(() => {
        const player = ytPlayerRef.current;
        if (!player || !onTimeUpdateRef.current) return;
        try {
          const duration = player.getDuration() || 0;
          const current = player.getCurrentTime() || 0;
          if (duration > 0) onTimeUpdateRef.current(current, duration);
        } catch { /* ignore */ }
      }, 5000);
    });

    return () => {
      cancelled = true;
      if (ytTimerRef.current) {
        clearInterval(ytTimerRef.current);
        ytTimerRef.current = null;
      }
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
    };
  }, [isYoutube, youtubeId, video.id, autoPlay, startAt]);

  if (isYoutube && youtubeId) {
    return (
      <div className={className} style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
        <div
          ref={ytContainerRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <noscript>
          <iframe
            title={video.titre}
            src={video.youtube_embed_url || youtubeEmbedUrl(youtubeId)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </noscript>
      </div>
    );
  }

  const src = video.url_publique || storageUrl(video.url_stockage);

  return (
    <video
      ref={videoRef}
      key={video.id}
      src={src}
      controls
      autoPlay={autoPlay}
      className={className}
      onEnded={() => onEndedRef.current?.()}
      style={{ width: '100%', background: '#000' }}
    />
  );
}
