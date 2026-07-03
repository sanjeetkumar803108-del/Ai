const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{isTyping && (
          <div className="mr-auto bg-white p-5 rounded-2xl rounded-tl-none border border-gray-100 shadow-xl flex flex-col gap-3 max-w-[85%]">
            <AILoader message="Mitra is thinking & browsing..." />
            <ThinkingStepsRenderer />
          </div>
        )}`;

const replacement = `{isTyping && (
          <div className="mr-auto bg-[#1E293B] p-4 rounded-2xl rounded-tl-none shadow-xl flex items-center gap-3 max-w-[85%] animate-fade-in border border-slate-700">
            <div className="flex gap-1">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
            </div>
            <p className="text-xs font-bold text-emerald-400 italic">Form Mitra likh raha hai...</p>
          </div>
        )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed typing indicator');
