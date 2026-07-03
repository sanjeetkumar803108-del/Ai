const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const fallbackModels = \["gemini-2.5-flash"\];/g,
  'const fallbackModels = ["gemini-2.5-flash", "gemini-2.0-flash"];'
);

fs.writeFileSync('server.ts', code);
console.log('Fixed fallback models');
