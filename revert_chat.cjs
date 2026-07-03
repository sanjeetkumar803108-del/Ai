const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Revert overall container bg
code = code.replace(
  /<div className="flex flex-col flex-1 h-full bg-\[#0F172A\] relative overflow-hidden">/,
  '<div className="flex flex-col flex-1 h-full bg-[#E5DDD5] chat-pattern relative overflow-hidden">'
);

// 2. Revert welcome animation overlay
code = code.replace(
  /<motion\.div exit=\{\{ opacity: 0, scale: 0\.95 \}\} transition=\{\{ duration: 0\.5 \}\} className="absolute inset-0 z-50 bg-\[#0F172A\] flex flex-col items-center justify-center">/,
  '<motion.div exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center">'
);

// 3. Revert user bubble
code = code.replace(
  /m\.role === "user"\s*\?\s*"ml-auto bg-\[#10B981\] text-white rounded-tr-none shadow-md"/,
  'm.role === "user"\n                ? "ml-auto bg-[#DCF8C6] text-gray-800 rounded-tr-none border border-[#C7E9B0]"'
);

// 4. Revert AI bubble
code = code.replace(
  /isErrorMsg\s*\?\s*"mr-auto bg-red-50 text-red-900 border border-red-200 rounded-tl-none"\s*:\s*"mr-auto bg-\[#1E293B\] text-slate-100 rounded-tl-none shadow-md border border-slate-700",/,
  'isErrorMsg\n                  ? "mr-auto bg-red-50 text-red-900 border border-red-200 rounded-tl-none"\n                  : "mr-auto bg-white text-gray-900 border border-gray-100 rounded-tl-none",'
);

// 5. Revert typing animation block
const typingTarget = `{isTyping && (
          <div className="mr-auto bg-[#1E293B] p-4 rounded-2xl rounded-tl-none shadow-xl flex items-center gap-3 max-w-[85%] animate-fade-in border border-slate-700">
            <div className="flex gap-1">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
            </div>
            <p className="text-xs font-bold text-emerald-400 italic">Form Mitra likh raha hai...</p>
          </div>
        )}`;

const typingReplace = `{isTyping && (
          <div className="mr-auto bg-white p-5 rounded-2xl rounded-tl-none border border-gray-100 shadow-xl flex flex-col gap-3 max-w-[85%] animate-fade-in">
            <AILoader message="Mitra is thinking & browsing..." />
            <ThinkingStepsRenderer />
          </div>
        )}`;

code = code.replace(typingTarget, typingReplace);

fs.writeFileSync('src/App.tsx', code);
console.log('Reverted changes successfully');
