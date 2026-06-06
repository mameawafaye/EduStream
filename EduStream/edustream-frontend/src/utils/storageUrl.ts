/** URL publique d'un fichier vidéo uploadé */
export function storageUrl(path: string): string {
  if (path.startsWith('http')) return path;

  const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
  // Proxy relatif (/api) → /storage/...
  if (apiUrl.startsWith('/')) {
    return `/storage/${path}`;
  }
  const base = apiUrl.replace(/\/api\/?$/, '');
  return `${base}/storage/${path}`;
}
