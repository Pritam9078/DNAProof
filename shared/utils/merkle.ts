import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';

/**
 * Generates a Merkle Root from an array of document hashes.
 * Each hash should be a 32-byte hex string (e.g., from Keccak256).
 */
export function generateMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return ethers.ZeroHash;
  
  // Clean hashes and convert to Buffer for merkletreejs compatibility
  const leaves = hashes.map(h => Buffer.from(ethers.getBytes(h)));
  const tree = new MerkleTree(leaves, ethers.keccak256, { sortPairs: true });
  return tree.getHexRoot();
}

/**
 * Generates a Merkle Proof for a specific leaf (hash) in a set of hashes.
 */
export function generateMerkleProof(hashes: string[], targetHash: string): string[] {
  const leaves = hashes.map(h => Buffer.from(ethers.getBytes(h)));
  const tree = new MerkleTree(leaves, ethers.keccak256, { sortPairs: true });
  return tree.getHexProof(Buffer.from(ethers.getBytes(targetHash)));
}

/**
 * Verifies a Merkle Proof locally.
 */
export function verifyMerkleProof(root: string, targetHash: string, proof: string[]): boolean {
  const tree = new MerkleTree([], ethers.keccak256, { sortPairs: true });
  return tree.verify(proof, Buffer.from(ethers.getBytes(targetHash)), Buffer.from(ethers.getBytes(root)));
}
