const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /isError\?: boolean;/,
  'isError?: boolean;\n  userReaction?: string;'
);

fs.writeFileSync('src/types.ts', code);
console.log('Fixed types');
