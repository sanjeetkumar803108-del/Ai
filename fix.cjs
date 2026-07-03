const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `        {messages.map((m) => {
          const isErrorMsg = m.isError || m.content.includes("server thoda busy lag raha") || m.content.includes("Server mein kuch dikkat hai") || (m.thought && m.thought.startsWith("Error:"));
          
          return (
          <div`;

const endStr = `            </div>
          </div>
        ))}
        {isTyping && (`;

const newEndStr = `            </div>
          </div>
        ); })}
        {isTyping && (`;

code = code.replace(endStr, newEndStr);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed end block');
