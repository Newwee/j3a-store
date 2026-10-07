/**
 * Extracts a YouTube Video ID from various URL formats or returns the raw ID
 */
export function extractYouTubeVideoId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Direct 11-character ID check
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex for full / short / embed / shorts YouTube URLs
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|\S*?[?&]vi=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

/**
 * Returns a standard YouTube Embed URL
 */
export function getYouTubeEmbedUrl(urlOrId: string | null | undefined, options: { autoplay?: boolean; rel?: number } = {}): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;

  const params = new URLSearchParams();
  params.set('rel', String(options.rel ?? 0));
  params.set('modestbranding', '1');
  if (options.autoplay) {
    params.set('autoplay', '1');
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Returns a high-res YouTube video thumbnail URL
 */
export function getYouTubeThumbnailUrl(urlOrId: string | null | undefined): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
