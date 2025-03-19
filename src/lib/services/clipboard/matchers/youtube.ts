import { UrlMatcher, UrlData } from '../urlDetector';

type YouTubeData = Extract<UrlData, { type: 'youtube' }>;

/**
 * YouTube URL matcher
 * Handles various YouTube URL formats and extracts video IDs
 */
const YOUTUBE_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export const youtubeUrlMatcher: UrlMatcher = {
  type: 'youtube',
  
  match(url: string): boolean {
    return YOUTUBE_URL_REGEX.test(url);
  },
  
  extract(url: string): YouTubeData | null {
    const match = url.match(YOUTUBE_URL_REGEX);
    if (!match) return null;
    
    return {
      type: 'youtube',
      videoId: match[1]
    };
  }
}; 