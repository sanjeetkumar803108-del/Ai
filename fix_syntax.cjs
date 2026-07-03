const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /        \}\)\}\n        \{isTyping/g,
  `        ); })}\n        {isTyping`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed syntax');
