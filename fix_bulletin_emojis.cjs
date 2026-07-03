const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<span className="text-lg">.*?<\/span>/g, '<FileText className="w-5 h-5 text-amber-500" />');
code = code.replace(/<span className="text-base text-emerald-500 shrink-0">✅<\/span>/g, '<CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />');

code = code.replace(/\uFFFD/g, '');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed bulletin emojis');
