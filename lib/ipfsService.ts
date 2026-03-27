import { Buffer } from 'buffer';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.VITE_PINATA_JWT;

if (!PINATA_JWT) {
  console.error('Pinata JWT not found. Please set NEXT_PUBLIC_PINATA_JWT or VITE_PINATA_JWT in your environment variables.');
}

/**
 * Upload a file to IPFS using Pinata
 * @param file File to upload
 * @returns IPFS content identifier (CID)
 */
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error: any) {
    console.error('Error uploading to IPFS via Pinata:', error);
    throw new Error('Failed to upload to IPFS: ' + error.message);
  }
}

/**
 * Get IPFS gateway URL for a content identifier
 * @param cid IPFS content identifier
 * @returns Full URL to access the content
 */
export function getIPFSGatewayUrl(cid: string): string {
  // Using public Pinata gateway or standard IPFS gateway
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

export default {
  uploadToIPFS,
  getIPFSGatewayUrl
};