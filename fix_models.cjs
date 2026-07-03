const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const fallbackModels = \[[\s\S]*?\];/g,
  'const fallbackModels = ["gemini-2.5-flash"];'
);

fs.writeFileSync('server.ts', code);
console.log('Fixed models');
