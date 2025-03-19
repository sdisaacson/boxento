/**
 * URL detection and parsing service
 * Extensible system to support different types of URLs and their corresponding widgets
 */

import { youtubeUrlMatcher } from './matchers/youtube'

// Maximum URL length to process (most browsers limit URLs to 2048 characters)
const MAX_URL_LENGTH = 2048;

/**
 * Sanitize and validate input before processing
 * @param text The text to sanitize
 * @returns The sanitized text or null if invalid
 */
const sanitizeInput = (text: string): string | null => {
  // Remove whitespace
  const cleaned = text.trim();
  
  // Check length
  if (cleaned.length === 0 || cleaned.length > MAX_URL_LENGTH) {
    return null;
  }
  
  // Basic URL character validation
  if (!/^[\x20-\x7E]+$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
};

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
  // Sanitize input
  const cleanText = sanitizeInput(text);
  if (!cleanText) return null;
  
  // Try each matcher in order with the sanitized input
  for (const matcher of URL_MATCHERS) {
    try {
      if (matcher.match(cleanText)) {
        const data = matcher.extract(cleanText);
        if (data) {
          return {
            type: matcher.type,
            data
          };
        }
      }
    } catch (error) {
      console.error('Error in URL matcher:', error);
      continue;
    }
  }
  
  return null;
}; 