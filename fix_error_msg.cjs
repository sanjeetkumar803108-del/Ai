const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  /const errorMsg = "Bhai, server thoda busy lag raha hai.*";/,
  'const errorMsg = "Bhai, server thoda busy lag raha, thodi der mein try karo. Connection me thodi pareshani hai, par main aapke saath hoon!";'
);
fs.writeFileSync('server.ts', serverCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  /Server mein kuch dikkat hai. Kripya thodi der baad try karein./g,
  'Bhai, server thoda busy lag raha, thodi der mein try karo.'
);
fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed error text');
