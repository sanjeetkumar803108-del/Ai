const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `          <div
            key={m.id}
            className={cn(`;

const fixStr = `          <div
            key={m.id}
            onMouseDown={() => handlePressStart(m.id)}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={() => handlePressStart(m.id)}
            onTouchEnd={handlePressEnd}
            className={cn(`;

code = code.replace(targetStr, fixStr);

const reactionUI = `
            {activeReactionId === m.id && (
              <div className="absolute -top-10 left-0 bg-slate-800 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 p-1.5 z-50 animate-fade-in">
                {['👍', '❤️', '😮', '🙏'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, userReaction: emoji } : msg));
                      setActiveReactionId(null);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-700 rounded-full transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
                <button onClick={() => setActiveReactionId(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"><X className="w-4 h-4"/></button>
              </div>
            )}
            {(m as any).userReaction && (
              <div className="absolute -bottom-3 right-2 bg-slate-800 border border-slate-700 text-xs px-1.5 py-0.5 rounded-full shadow-sm z-10">
                {(m as any).userReaction}
              </div>
            )}
`;

code = code.replace(
  /            \{isErrorMsg && \(/,
  reactionUI + '            {isErrorMsg && ('
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed reactions');
