/**
 * Video Helper Utility for Overlay Asmaro Store
 * Parses and handles various video sources:
 * - Direct MP4, WebM, MOV, OGG, blob:, data:video
 * - YouTube (watch, youtu.be, shorts, embeds)
 * - Vimeo, Streamable, Google Drive, TikTok
 */

export interface ParsedVideo {
  type: 'direct' | 'youtube' | 'iframe' | 'none';
  url: string;
  embedUrl?: string;
  youtubeId?: string;
}

export function parseVideoUrl(url?: string): ParsedVideo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'none', url: '' };
  }

  const cleanUrl = url.trim();

  // 1. Check for Base64 Data URL or Blob URL (Direct HTML5 video)
  if (cleanUrl.startsWith('data:video/') || cleanUrl.startsWith('blob:')) {
    return { type: 'direct', url: cleanUrl };
  }

  // 2. Check for YouTube (watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch = cleanUrl.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      url: cleanUrl,
      youtubeId: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`
    };
  }

  // 3. Check for Google Drive links (convert /view to /preview)
  if (cleanUrl.includes('drive.google.com/file/d/')) {
    const driveIdMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
      return {
        type: 'iframe',
        url: cleanUrl,
        embedUrl: `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`
      };
    }
  }

  // 4. Check for Streamable links
  if (cleanUrl.includes('streamable.com/')) {
    const streamableMatch = cleanUrl.match(/streamable\.com\/([a-zA-Z0-9]+)/);
    if (streamableMatch && streamableMatch[1]) {
      return {
        type: 'iframe',
        url: cleanUrl,
        embedUrl: `https://streamable.com/e/${streamableMatch[1]}?autoplay=1&muted=1&loop=1`
      };
    }
  }

  // 5. Check for Vimeo links
  const vimeoMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      url: cleanUrl,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`
    };
  }

  // 6. Check for direct video extension (.mp4, .webm, .mov, .ogg, .m4v) or generic video links
  const isVideoExt = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(cleanUrl);
  if (isVideoExt) {
    return { type: 'direct', url: cleanUrl };
  }

  // 7. If it starts with http/https, default to direct video tag with fallback to iframe if error occurs
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return { type: 'direct', url: cleanUrl };
  }

  return { type: 'direct', url: cleanUrl };
}
