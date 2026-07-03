const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const targetFunction = /export const analyzeFilledForm = async \(imageFile: File, scheme: any\): Promise<any> => \{([\s\S]*?)const prompt = `([\s\S]*?)`\s*;\s*try \{/s;

code = code.replace(targetFunction, (match, beforePrompt, oldPrompt) => {
  return `export const analyzeFilledForm = async (imageFile: File, scheme?: any): Promise<any> => {${beforePrompt}const prompt = \`
    Role: You are "Form Mitra AI", an expert audit officer for Indian government and official forms.
    
    Task: Audit the provided image of a filled application form \${scheme ? 'for the scheme: ' + scheme.name : '(generic audit)'}.
    
    \${scheme ? \`Scheme Requirements:
    - Target: \${scheme.description}
    - Common Fields: Name, Aadhaar, Income, Date of Birth, Signature, Category.\` : 'Check for general correctness: Name, IDs, Signature, Date of Birth, etc.'}
    
    Instructions:
    1. Extract all visible text and fields from the form.
    2. Check for missing required fields, illegible handwriting, logic errors, and any missing signatures/photos.
    
    Format: Return a JSON object EXACTLY matching this schema (do NOT include markdown formatting like \\\`\\\`\\\`json):
    {
      "riskScore": 45, // Number between 0-100 (higher = higher chance of rejection)
      "verdict": "string (Short verdict like 'Form Needs Attention')",
      "photoAudit": {
        "isAccepted": boolean,
        "backgroundStatus": "string (e.g. 'Clear' or 'Cluttered')",
        "clarity": "string (e.g. 'Sharp' or 'Blurry')",
        "brightness": "string",
        "alignment": "string",
        "legibility": "string"
      },
      "majorIssues": [
        { "issue": "string", "severity": "high" | "medium", "fix": "string (Bade bhai style fix instruction)" }
      ],
      "identifiedFields": [
        { "field": "string", "value": "string", "status": "ok" | "error" | "warning" }
      ],
      "looksGood": ["string", "string"]
    }
  \`;
  try {`;
});

fs.writeFileSync('src/services/geminiService.ts', code);
console.log('Fixed analyzeFilledForm function');
