import { ethers } from 'ethers';
import canonize from 'canonical-json';

/**
 * Normalizes a string by trimming, unifying newlines, and removing extra whitespace.
 */
export function normalizeText(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, '\n') // Unify newlines
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim()) // Trim each line
    .filter(line => line.length > 0) // Remove empty lines
    .join('\n')
    .trim();
}

/**
 * Canonicalizes a JSON object using RFC 8785 (JCS).
 * Handles primitives, arrays, and objects by sorting keys.
 */
export function canonicalizeJSON(data: any): string {
  try {
    // If it's a string that looks like JSON, parse it first
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return (canonize(parsed) || '') as string;
      } catch (e) {
        // Not JSON, just return normalized text
        return normalizeText(data);
      }
    }
    return (canonize(data) || '') as string;
  } catch (error) {
    console.error('Error canonicalizing JSON:', error);
    return typeof data === 'string' ? normalizeText(data) : String(data);
  }
}

/**
 * Calculates a Keccak256 hash of content.
 * If normalize is true, it applies canonicalization/normalization.
 */
export function calculateNormalizedHash(data: any, normalize: boolean = true): string {
  if (!normalize) {
    const content = typeof data === 'string' ? data : String(data || '');
    return ethers.keccak256(ethers.isBytesLike(data) ? data : ethers.toUtf8Bytes(content));
  }

  const content = typeof data === 'object' && data !== null ? canonicalizeJSON(data) : normalizeText(String(data || ''));
  return ethers.keccak256(ethers.toUtf8Bytes(content));
}
