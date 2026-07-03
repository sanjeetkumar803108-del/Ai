const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const emojis = /[🚀💼🔥💡✨🎯🏆🛡️📝🤝💰📊🎓🏥👨‍🌾👩‍🎓👨‍🔧🎉🥳➡️📱]/g;
code = code.replace(emojis, '');

fs.writeFileSync('src/App.tsx', code);
console.log('Emojis removed from App.tsx');
