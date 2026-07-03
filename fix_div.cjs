const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `<div className="flex-1"></div>
                <div className="flex items-center gap-1">
                <div className="flex items-center gap-1">`;

const fixStr = `<div className="flex-1"></div>
                <div className="flex items-center gap-1">`;

code = code.replace(targetStr, fixStr);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed extra div');
