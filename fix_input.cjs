const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              placeholder={
                isListening ? "Listening..." : "Hinglish mein puhein..."
              }
              className="flex-1 text-xs sm:text-sm outline-none bg-transparent min-w-0 font-medium text-gray-800 placeholder-gray-400"
              disabled={isTyping}
            />`;

const replaceStr = `              placeholder={
                isListening ? "Bol raha hoon..." : "Hinglish mein puhein..."
              }
              className="flex-1 text-xs sm:text-sm outline-none bg-transparent min-w-0 font-medium text-gray-800 placeholder-gray-400"
              disabled={isTyping}
            />
            {isListening && (
              <div className="flex items-center gap-0.5 ml-2">
                <motion.div animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1 bg-red-500 rounded-full" />
                <motion.div animate={{ height: [4, 16, 4] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1 bg-red-500 rounded-full" />
                <motion.div animate={{ height: [4, 8, 4] }} transition={{ duration: 0.4, repeat: Infinity }} className="w-1 bg-red-500 rounded-full" />
              </div>
            )}`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed placeholder and waveform');
