import { Jimp } from 'jimp';
import stringSimilarity from 'string-similarity';

/**
 * Calculates a perceptual hash (pHash) for an image buffer.
 * Returns a 64-bit hexadecimal string.
 */
export async function calculateImagePHash(buffer: Buffer): Promise<string | null> {
  try {
    const image = await Jimp.read(buffer);
    return image.hash(); 
  } catch (error) {
    console.error('Error calculating image pHash:', error);
    return null;
  }
}

/**
 * Compares two perceptual hashes and returns a similarity score (0 to 1).
 * Uses Hamming distance internally.
 */
export function compareImageHashes(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 0;
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  
  // Normalize distance to a 0-1 similarity score
  // For a 64-bit hex (16 chars), max distance is 16? No, hex chars have 4 bits each.
  // Actually Jimp's hash is a string. Let's just use string similarity if it's hex.
  // Proper Hamming distance for hex:
  const hexToBinary = (hex: string) => parseInt(hex, 16).toString(2).padStart(4, '0');
  let bitDistance = 0;
  let totalBits = hash1.length * 4;
  
  for (let i = 0; i < hash1.length; i++) {
    const b1 = parseInt(hash1[i], 16);
    const b2 = parseInt(hash2[i], 16);
    let xor = b1 ^ b2;
    // Count set bits
    while (xor > 0) {
      if (xor & 1) bitDistance++;
      xor >>= 1;
    }
  }
  
  return (totalBits - bitDistance) / totalBits;
}

/**
 * Compares two text strings and returns a similarity score (0 to 1).
 * Uses Dice's Coefficient (via string-similarity).
 */
export function compareTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  return stringSimilarity.compareTwoStrings(text1, text2);
}

/**
 * Normalizes text for long-term fuzzy storage (Phase 2).
 * Removes stop words or significantly reduces length if needed.
 * For now, we reuse the shared normalizeText but could add more aggressive reduction.
 */
export function prepareFuzzyText(text: string): string {
    // Basic normalization for now
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}
