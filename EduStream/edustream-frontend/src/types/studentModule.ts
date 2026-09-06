import type { Video } from './video';

export interface Chapitre {
  id: number;
  titre: string;
  ordre: number;
  videos: Video[];
}

export interface StudentModule {
  id: number;
  titre: string;
  description: string;
  matiere?: string;
  nb_chapitres?: number;
  nb_videos?: number;
  progression?: number;
  videos_vues?: number;
  enseignant?: { name: string };
  chapitres?: Chapitre[];
}

export function courseButtonLabel(progression = 0): string {
  if (progression === 0) return '▶ Démarrer';
  if (progression >= 100) return '✓ Revoir';
  return '▶ Continuer';
}
