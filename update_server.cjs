const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /async function saveFirestoreMessage\([\s\S]*?\)\s*\{/,
  `async function saveFirestoreMessage(
  userId: string,
  convId: string,
  role: string,
  content: string,
  idToken: string,
  thought: string | null = null,
  image: string | null = null,
  isError: boolean = false
) {`
);

code = code.replace(
  /const messageFields: any = \{/,
  `const messageFields: any = {
    isError: { booleanValue: isError },`
);

code = code.replace(
  /const errorMsg = "Bhai, server thoda busy lag raha hai ya connection me pareshani hai. Kripya dubaara try karein, main aapke saath hoon!\\n\\nआपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।";\s*await saveFirestoreMessage\(userId, convId, "assistant", errorMsg, idToken, \`Error: \$\{err.message\}\`\);/,
  `const errorMsg = "Bhai, server thoda busy lag raha hai ya connection me pareshani hai. Kripya dubaara try karein, main aapke saath hoon!\\n\\nआपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।";
          await saveFirestoreMessage(userId, convId, "assistant", errorMsg, idToken, \`Error: \${err.message}\`, null, true);`
);

fs.writeFileSync('server.ts', code);
console.log('Updated server.ts');
