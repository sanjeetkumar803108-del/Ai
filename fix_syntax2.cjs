const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /          <\/div>\n        \}\)\}\n        \{isTyping && \(/g,
  `          </div>\n        ); })}\n        {isTyping && (`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed syntax 2');
