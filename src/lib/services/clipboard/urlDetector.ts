/**
 * URL detection and parsing service
 * Extensible system to support different types of URLs and their corresponding widgets
 */

import { youtubeUrlMatcher } from './matchers/youtube'

/**
 * Base interface for all URL data types
 * Each matcher should extend this with their specific data structure
 */
export interface BaseUrlData {
  type: string;
}

/**
 * Union type of all supported URL data types
 * Add new data types here when adding new matchers
 */
export type UrlData = 
  | { type: 'youtube'; videoId: string }
  // Add more URL data types here as needed:
  // | { type: 'sports'; gameId: string; league: string }
  // | { type: 'weather'; location: string; unit: 'c' | 'f' }
  ;

export interface UrlMatchResult {
  type: UrlData['type'];
  data: Extract<UrlData, { type: UrlData['type'] }>;
}

export interface UrlMatcher {
  type: UrlData['type'];
  match: (url: string) => boolean;
  extract: (url: string) => Extract<UrlData, { type: UrlData['type'] }> | null;
}

/**
 * Registry of URL matchers
 * Add new matchers here to support more URL types
 */
const URL_MATCHERS: UrlMatcher[] = [
  youtubeUrlMatcher,
  // Add more matchers here as needed:
  // sportsSiteMatcher,
  // weatherSiteMatcher,
  // etc.
];

/**
 * Process text to find any matching URL patterns
 * Returns the first valid match found, or null if none found
 */
export const processUrl = (text: string): UrlMatchResult | null => {
  // Clean up the text
  const cleanText = text.trim();
  
  // Try each matcher in order
  for (const matcher of URL_MATCHERS) {
    if (matcher.match(cleanText)) {
      const data = matcher.extract(cleanText);
      if (data) {
        return {
          type: matcher.type,
          data
        };
      }
    }
  }
  
  return null;
}; 