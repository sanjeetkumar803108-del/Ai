const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find all backticks and check if they are balanced.
let count = 0;
for(let i=0; i<code.length; i++) {
   if (code[i] === '\`') count++;
}
console.log("Total backticks:", count);
