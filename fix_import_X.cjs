const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /Camera,/,
  'Camera,\n  X,'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed X import');
