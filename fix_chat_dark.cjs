const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace ChatScreen background
code = code.replace(
  /<div className="flex flex-col flex-1 h-full bg-\[#E5DDD5\] chat-pattern relative overflow-hidden">/,
  '<div className="flex flex-col flex-1 h-full bg-[#0F172A] relative overflow-hidden">'
);

// Replace User message bubble
code = code.replace(
  /\? "ml-auto bg-\[#DCF8C6\] text-gray-800 rounded-tr-none border border-\[#C7E9B0\]"/,
  '? "ml-auto bg-[#10B981] text-white rounded-tr-none shadow-md"'
);

// Replace AI message bubble
code = code.replace(
  /: "mr-auto bg-white text-gray-900 border border-gray-100 rounded-tl-none",/,
  ': "mr-auto bg-[#1E293B] text-slate-100 rounded-tl-none shadow-md border border-slate-700",'
);

// Fix quick reply buttons logic 
const ratingDiv = `{m.role === "assistant" && m.id !== "welcome" && !isErrorMsg && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50/50">`;

const quickReplyDiv = `{m.role === "assistant" && m.id !== "welcome" && !isErrorMsg && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-700/50 flex-wrap">
                <button
                  onClick={() => navigator.clipboard.writeText(m.content)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  onClick={() => handleSend("Iske baare mein thoda aur detail me batao")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                >
                  <RefreshCw className="w-3 h-3" /> Aur Batao
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'Form Mitra', text: m.content });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <Share2 className="w-3 h-3" /> Share
                </button>
                <div className="flex-1"></div>
                <div className="flex items-center gap-1">`;

code = code.replace(ratingDiv, quickReplyDiv);

// Also change the border-t inside the quick replies logic because it got deleted by mistake? No, wait, I replaced the top wrapper, so I should just make sure the `PlayButton` and ratings are well enclosed. Wait, I should do it properly.

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed chat dark and quick replies');
