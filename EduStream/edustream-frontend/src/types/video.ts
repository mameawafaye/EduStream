export interface Video {
  id: number;
  titre: string;
  description?: string;
  duree?: number;
  statut: string;
  source_type: 'upload' | 'youtube';
  youtube_id?: string;
  url_publique?: string;
  youtube_embed_url?: string;
  url_stockage: string;
}

export function isYoutubeVideo(video: Video): boolean {
  return video.source_type === 'youtube' || !!video.youtube_id;
}
