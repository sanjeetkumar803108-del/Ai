const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /"Namaste! Main aapka \*\*Form Mitra\*\* \(aapka Bade Bhai\) hoon\. Main aapki sarkari schemes, career aur forms bharne mein 100% help karunga\. \\n\\nAaj kaise help karu bhai\? \\n\\n\*Hinglish, Hindi ya English mein baat kar sakte hain\.\*"/,
  `\`Namaste \${userProfile.name ? userProfile.name.split(' ')[0] + ' ' : ''}bhai! 👋 Aaj kaise help karu?\\n\\nMain aapki sarkari schemes, career aur forms bharne mein 100% help karunga.\\n\\n*Hinglish, Hindi ya English mein baat kar sakte hain.*\``
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed welcome message');
