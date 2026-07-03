const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all line-clamp-1 and line-clamp-2 except in conditional strings like `isExpanded ? ""`
// We can just regex replace " line-clamp-1" and " line-clamp-2"
// First, find all literal "line-clamp-" occurrences.
code = code.replace(/ line-clamp-[1-3]/g, '');

fs.writeFileSync('src/App.tsx', code);
console.log('Line clamps removed');
