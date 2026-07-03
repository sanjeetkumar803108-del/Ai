const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleAudit = async () => {
    if (!imageFile || !selectedScheme) return;
    setAuditing(true);
    try {
      const auditResult = await analyzeFilledForm(imageFile, selectedScheme);`;

const replacement = `  const handleAudit = async () => {
    if (!imageFile) return;
    setAuditing(true);
    try {
      const auditResult = await analyzeFilledForm(imageFile);`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed handleAudit');
