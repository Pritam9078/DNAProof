import * as fuzzyService from './server/services/fuzzy-service';
import fs from 'fs';

async function testFuzzy() {
    const text1 = "The quick brown fox jumps over the lazy dog";
    const text2 = "The quick brown fox jumps over the lazy dog."; // Just a dot
    const text3 = "A fast brown fox leaps over a sleepy dog"; // Different wording
    
    console.log("Text 1 vs 2 Complexity Similarity:", fuzzyService.compareTextSimilarity(text1, text2));
    console.log("Text 1 vs 3 Complexity Similarity:", fuzzyService.compareTextSimilarity(text1, text3));
    
    // We need an image for pHash test. I'll create a dummy buffer if possible or just skip if no image.
    // Actually, I'll generate a small pixel buffer.
}

testFuzzy().catch(console.error);
