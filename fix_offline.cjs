const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div`;

const replaceStr = `const [justOnline, setJustOnline] = useState(false);
  useEffect(() => {
    if (isOnline) {
      setJustOnline(true);
      const timer = setTimeout(() => setJustOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {justOnline && (
        <motion.div
          key="online-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[120] bg-[#10B981] text-white py-3 px-4 flex items-center justify-center gap-3 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-widest leading-none">🟢 Wapas connected! Sab features available hain</span>
          </div>
        </motion.div>
      )}
      {!isOnline && !justOnline && (
        <motion.div`;

code = code.replace(targetStr, replaceStr);

code = code.replace(
  /<span>Aap Offline Hain<\/span>/,
  '<span>🔴 Internet nahi hai - Sirf basic features available hain</span>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed offline notice');
