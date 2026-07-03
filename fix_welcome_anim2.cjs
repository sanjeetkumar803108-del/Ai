const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldFixStr = `{showWelcomeAnim && (
        <div className="absolute inset-0 z-50 bg-[#0F172A] flex flex-col items-center justify-center animate-fade-out" style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-2xl font-black text-white">
            Namaste! 🙏
          </motion.h2>
        </div>
      )}`;

const newFixStr = `<AnimatePresence>
      {showWelcomeAnim && (
        <motion.div exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="absolute inset-0 z-50 bg-[#0F172A] flex flex-col items-center justify-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-2xl font-black text-white">
            Namaste! 🙏
          </motion.h2>
        </motion.div>
      )}
      </AnimatePresence>`;

code = code.replace(oldFixStr, newFixStr);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed welcome anim 2');
