const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const errorHeader = `{isErrorMsg && (
              <div className="flex items-center gap-1.5 mb-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Connection Issue</span>
              </div>
            )}`;

code = code.replace(
  /\{m\.role === "assistant" && m\.thought && !isErrorMsg && \(/,
  errorHeader + '\n            {m.role === "assistant" && m.thought && !isErrorMsg && ('
);

const retryButton = `{isErrorMsg && m.id === messages[messages.length - 1]?.id && (
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(msg => msg.role === 'user');
                  if (lastUserMsg) {
                    handleSend(lastUserMsg.content);
                  }
                }}
                className="mt-3 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-red-200 transition-colors self-start border border-red-200"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}`;

code = code.replace(
  /\{m\.role === "assistant" && m\.id !== "welcome" && !isErrorMsg && \(/,
  retryButton + '\n            {m.role === "assistant" && m.id !== "welcome" && !isErrorMsg && ('
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added error UI elements');
