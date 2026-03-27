# DNAProof Tamper-Defense Implementation Plan

## Executive Summary
Modern blockchain-based document systems must defend against sophisticated tampering. In DNAProof’s hybrid Ethereum–Hyperledger–IPFS architecture, threats include simple edits (changed text or images), format shifts (renames, metadata changes), and advanced attacks (re-uploads, IPFS gateway hijacks, replaying old proofs, hash collisions, or AI-generated near-duplicates). Simple byte‑wise hashing (e.g. SHA256) alone is insufficient: tiny harmless edits or format changes will falsely break verification, while clever adversaries can produce semantically identical but bit‑different documents to evade exact-hash checks.

We recommend a multi-layer defense combining: content canonicalization, robust hashing, AI-driven similarity detection, trusted IPFS practices, Merkle‐anchored timestamps, and identity binding. For each layer, we detail implementation: code examples in Node.js/Express for hashing and IPFS, smart-contract additions (events, Merkle proofs), required Fabric chaincode extensions, and UI/UX flows (upload, verify, error handling, admin review). We also provide a thorough testing and deployment plan, comparing approaches by security, cost, accuracy, and complexity.

The core strategy is defense-in-depth: no single check suffices, but together they catch or deter nearly all tampering. For example, we normalize all content (removing trivial differences), compute both exact and fuzzy hashes (e.g. ssdeep), and use perceptual hashes for images. We bind metadata via IPFS (with secured pinning) and Hyperledger’s private ledger, and we use Merkle trees to batch on-chain proofs. Where static content-addressing fails (e.g. dynamic or AI‑paraphrased content), we fall back on OCR and machine-learning similarity checks. Administrative tools allow manual audit and dispute resolution when automated checks flag anomalies.

## Threat Model
We consider realistic tampering scenarios and attacks against DNAProof’s document flows. Each bullet below illustrates a class of threat:

*   **Content Modification:** An attacker edits the document (text or image) before or after upload. This includes trivial changes (added whitespace, reordering, format changes) or semantic edits (changing numbers, text paraphrasing, swapping images). Even a single bit flip will change a SHA256 hash, causing a valid document to be rejected (false negative).
*   **Renaming or Reformatting:** Changing the filename or file format (e.g. PDF→image) does not alter the content hash, so simple renaming isn’t an integrity breach. But format conversions can lose or shift data (e.g. OCR misreads), so we must canonicalize.
*   **Re-uploads and Replay:** An attacker replays an old, previously valid document/proof. We mitigate with timestamps and unique nonces or Merkle log entries.
*   **IPFS Pinning/Gateway Attacks:** Adversaries can misuse IPFS features. Pinning malicious pages via services and using custom gateways to mask phishing sites. Mitigated by using raw CIDs only and trusting only known reputable nodes.
*   **Hash Collisions:** Theoretical threat, practically negligible with SHA-256 and Keccak-256.
*   **AI-Generated Near-Duplicates:** Attackers can create new content that is semantically identical but bit-different. Detecting them requires semantic or perceptual techniques.
*   **Metadata Tampering (Fabric):** Attacks against stored metadata on the Hyperledger side. Mitigated with authenticated Fabric writes and logging.
*   **Insider/Key Compromise:** Theft of private keys. Mitigated by hardware wallets and multi-party approvals.

## Multi-Layer Defense Strategies

### 1. Canonical Content Hashing (Normalization)
Before hashing, transform the document into a canonical form that removes insignificant differences (whitespace, line endings, JSON key ordering).
*   **Pros:** Catches benign transformations; reduces false mismatches.
*   **Cons:** Complex to handle every file type.
*   **Implementation:** Use JCS (RFC 8785) for JSON and OCR/text extraction for PDFs.

### 2. Content-Based (Fuzzy) Hashing
Use algorithms like `ssdeep` to produce signatures where similar inputs yield similar signatures.
*   **Pros:** Detects slightly edited documents.
*   **Cons:** Not collision-resistant; treated as a heuristic.
*   **Implementation:** Integrate `npm ssdeep` in the backend and store fuzzy hashes in Fabric.

### 3. Perceptual Hashing (Images)
For image-based documents, use pHash/dHash to detect visually similar images regardless of encoding or rotation.
*   **Pros:** Robust against resizing, mild color changes, or compression.
*   **Cons:** Only useful for images; non-cryptographic.
*   **Implementation:** Use `sharp-phash` in Node.js.

### 4. Structured Data Canonicalization (JSON-LD, JCS)
Use semantic canonicalization for structured data (verifiable credentials).
*   **Implementation:** Use `canonical-json` (RFC 8785) for stable stringification.

### 5. Document Parsing & Semantic Analysis (OCR/NLP)
Extract text and key fields using OCR (Tesseract) to verify consistency beyond raw bytes.
*   **Pros:** Catches semantic tampering (e.g. changing an amount).
*   **Cons:** Computationally heavy.

### 6. AI-Assisted Similarity Detection
Use NLP embeddings (BERT/GPT) to compute semantic similarity scores.
*   **Pros:** Catches rephrased or paraphrased content.
*   **Cons:** Compute-intensive; requires careful threshold tuning.

### 7. Watermarking & Metadata Binding
Embed hidden watermarks or digital signatures into the document at upload time.
*   **Pros:** Adds a second factor of authenticity.

### 8. IPFS Pinning and Access Control
Strengthen IPFS usage by using trusted pinning services (Pinata) and multi-gateway retrieval checks.
*   **Pros:** Prevents content hijacking and ensures persistence.

### 9. Timestamping & Merkle Trees
Batch document hashes into Merkle trees and anchor the root on Ethereum to save gas and provide inclusion proofs.
*   **Implementation:** Use `merkletreejs` and OpenZeppelin `MerkleProof` library.

### 10. Challenge–Response Verification
Introduce dynamic challenges during verification to ensure the user possesses the original document.

### 11. Identity Binding (Wallet ↔ Fabric Identity)
Bind Ethereum wallet addresses to Hyperledger Fabric identities using Fabric CA attributes.

## Comparative Analysis
| Approach | Security | Gas Cost | False Positives | False Negatives | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Exact SHA256** | High | Medium | Low | Very High | Low |
| **Canonicalization**| High | Medium | Low | Medium | Medium |
| **Fuzzy Hash** | Low | Low | Medium | Low | Medium |
| **Perceptual Hash** | Medium | Low | Medium | Low | Medium |
| **Merkle Tree** | High | Low | Low | Low | Medium |
| **Challenge-Resp** | High | Low | Low | Low | High |

## System Flow Diagram
```mermaid
graph LR
  U[User (Issuer/Verifier)] -->|Upload/Verify Request| FE[Frontend UI]
  FE --> BE[Backend API (Node.js)]
  subgraph "Off-chain Services"
    BE --> IPFS[IPFS Service]
    BE --> Fabric[Hyperledger Fabric (Chaincode)]
  end
  subgraph "On-chain Ethereum"
    BE -->|tx| Registry[DNAProofRegistry]
    BE -->|tx| AuditLogs[DNAProofAuditLogs]
    BE -->|tx| AccessCtrl[DNAProofAccessControl]
    Registry -->|reads| AccessCtrl
    AuditLogs -->|reads| AccessCtrl
  end
```
