const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(/rating\?: 'up' \| 'down';/, "rating?: 'up' | 'down';\n  isError?: boolean;");
fs.writeFileSync('src/types.ts', code);
console.log('Updated types.ts');
