import Tesseract from 'tesseract.js';
import { ethers } from 'ethers';

export interface AIAnalysisResult {
  docType: string;
  extractedFields: Record<string, any>;
  riskScore: number; // 0-100
  fraudFlags: string[];
  isTampered: boolean;
}

export class AIService {
  /**
   * Performs OCR on a document buffer and extracts text/fields.
   */
  static async performOCR(buffer: Buffer): Promise<string> {
    // For local stability, we simulate OCR text for analysis
    return "Document for analysis. This is a simulation text for Passport or ID card verification. National ID number: 123456789. Nationality: Republic.";
  }
 
  /**
   * Analyzes the document for potential fraud or tampering.
   * Simulation: heuristic-based checks.
   */
  static async analyzeDocument(buffer: Buffer, userProvidedFields: any): Promise<AIAnalysisResult> {
    const text = await this.performOCR(buffer);
    const lowText = text.toLowerCase();

    const fraudFlags: string[] = [];
    let riskScore = 0;

    // Check for sensitive keywords that shouldn't be in specific docs
    const suspiciousKeywords = ['sample', 'copy', 'void', 'specimen'];
    suspiciousKeywords.forEach(word => {
      if (lowText.includes(word)) {
        fraudFlags.push(`Suspicious keyword found: ${word}`);
        riskScore += 25;
      }
    });

    // Cross-check fields (Simplified)
    for (const [key, value] of Object.entries(userProvidedFields)) {
      if (typeof value === 'string' && value.length > 3) {
        if (!lowText.includes(value.toLowerCase())) {
          fraudFlags.push(`Mismatch in field: ${key}`);
          riskScore += 15;
        }
      }
    }

    // Document Classification Logic
    let docType = 'Unclassified';
    let confidenceScore = 50;

    const categories = {
      'Passport': ['passport', 'republic', 'nationality', 'issuing authority'],
      'Identification Card': ['identity card', 'national id', 'citizen', 'dob'],
      'Academic Certificate': ['degree', 'diploma', 'university', 'transcript', 'graduate'],
      'Medical Record': ['patient', 'hospital', 'clinical', 'diagnosis', 'treatment']
    };

    for (const [type, words] of Object.entries(categories)) {
      const matchCount = words.filter(word => lowText.includes(word)).length;
      if (matchCount > 1) {
        docType = type;
        confidenceScore = Math.min(50 + (matchCount * 10), 99);
        break;
      }
    }

    return {
      docType,
      extractedFields: {}, // Logic to parse key-value pairs
      riskScore: Math.min(riskScore, 100),
      fraudFlags,
      isTampered: riskScore > 50,
      confidenceScore // Added for classification
    } as any;
  }
}
