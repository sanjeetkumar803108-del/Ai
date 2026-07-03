const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/border-slate-700\/50/g, 'border-gray-100');
code = code.replace(/bg-slate-800 text-slate-300 text-\[10px\] font-bold hover:bg-slate-700 transition-colors border border-slate-700/g, 'bg-gray-50 text-gray-600 text-[10px] font-bold hover:bg-gray-100 transition-colors border border-gray-200');
code = code.replace(/text-emerald-400/g, 'text-emerald-600');
code = code.replace(/text-slate-400 hover:text-white hover:bg-slate-700/g, 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'); // for the X close button on reactions
code = code.replace(/bg-slate-800 rounded-full shadow-lg border border-slate-700/g, 'bg-white rounded-full shadow-lg border border-gray-200'); // reaction picker
code = code.replace(/hover:bg-slate-700 rounded-full/g, 'hover:bg-gray-100 rounded-full'); // reaction buttons inside picker

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed buttons');
