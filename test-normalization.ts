import { calculateNormalizedHash } from './shared/utils/hashing';

const json1 = { name: "Alice", age: 30 };
const json2 = { age: 30, name: "Alice" }; // Reordered keys

const text1 = "  Hello \nWorld  ";
const text2 = "Hello\nWorld"; // No trailing/leading spaces

console.log("JSON 1 Hash:", calculateNormalizedHash(json1));
console.log("JSON 2 Hash:", calculateNormalizedHash(json2));
if (calculateNormalizedHash(json1) === calculateNormalizedHash(json2)) {
    console.log("✅ JSON Canonicalization Successful!");
} else {
    console.error("❌ JSON Canonicalization Failed!");
}

console.log("Text 1 Hash:", calculateNormalizedHash(text1));
console.log("Text 2 Hash:", calculateNormalizedHash(text2));
if (calculateNormalizedHash(text1) === calculateNormalizedHash(text2)) {
    console.log("✅ Text Normalization Successful!");
} else {
    console.error("❌ Text Normalization Failed!");
}
