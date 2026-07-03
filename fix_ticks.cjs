const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `{(() => {
                const processed = (() => {
                  if (m.role !== "assistant") return m.content;`;

const fixStr = `{m.role === "user" && (
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-white/80 flex items-center gap-0.5 font-bold">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {messages.findIndex(msg => msg.id === m.id) < messages.length - 1 ? (
                    <span className="text-blue-200">✓✓</span>
                  ) : isTyping ? (
                    <span>✓✓</span>
                  ) : (
                    <span>✓</span>
                  )}
                </span>
              </div>
            )}
            
            <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 mt-0.5 text-inherit">
              {(() => {
                const processed = (() => {
                  if (m.role !== "assistant") return m.content;`;

code = code.replace(
  /<div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 mt-0\.5 text-inherit">\s*\{\(\(\) => \{\s*const processed = \(\(\) => \{\s*if \(m.role !== "assistant"\) return m.content;/g,
  fixStr
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ticks');
