import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Heart, ChevronRight } from "lucide-react";

interface NamaskarSplashProps {
  onComplete: () => void;
}

export const NamaskarSplash: React.FC<NamaskarSplashProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Automatically transition after 4.2 seconds
    const timer = setTimeout(() => {
      handleExit();
    }, 4200);

    return () => clearTimeout(timer);
  }, []);

  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 500); // matches transition duration
  };

  // Saffron and Emerald representing warm Indian tricolor hues with premium elegant look
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 1.05 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black p-4 overflow-hidden"
    >
      {/* Dynamic Background Patterns representing positive energy */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-orange-500/10 animate-[spin_120s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-dashed border-emerald-500/15 animate-[spin_80s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-orange-500/20 animate-[spin_40s_linear_infinite_reverse]" />
        
        {/* Soft glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl filter animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl filter animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative max-w-md w-full flex flex-col items-center text-center px-6 py-12 bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl">
        
        {/* Decorative Indian Mandla Pattern Background for the Head Badge */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Saffron Glowing Ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute w-28 h-28 rounded-full bg-orange-500/10 blur-xl"
          />
          {/* Emerald Ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1.5 }}
            className="absolute w-32 h-32 rounded-full bg-emerald-500/5 blur-xl"
          />

          {/* Golden Rotating Sun / Mandala SVG */}
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute w-32 h-32 text-amber-500/20"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
            <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.25" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x = 50 + Math.cos(angle) * 35;
              const y = 50 + Math.sin(angle) * 35;
              return <circle key={i} cx={x} cy={y} r="1.5" fill="currentColor" stroke="none" />;
            })}
          </motion.svg>

          {/* Interactive Core Hands Badge */}
          <motion.div
            initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
            className="relative w-24 h-24 rounded-full bg-linear-to-b from-amber-400 via-orange-500 to-emerald-600 p-[1.5px] shadow-lg shadow-black/40"
          >
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl select-none"
                role="img"
                aria-label="Namaste Folded Hands"
              >
                🙏
              </motion.span>
            </div>
          </motion.div>
          
          {/* Sparkly Accents */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            className="absolute -top-1 -right-1 text-amber-400"
          >
            <Sparkles className="w-5 h-5 fill-amber-400/20" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1.2 }}
            className="absolute -bottom-1 -left-1 text-emerald-400"
          >
            <Heart className="w-4 h-4 fill-emerald-400/20" />
          </motion.div>
        </div>

        {/* Beautiful Typography Greetings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-4"
        >
          {/* Devanagari Greeting */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent font-sans">
            नमस्ते
          </h1>

          {/* Welcome subtitle */}
          <div className="space-y-1.5 px-2">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#ff9933]">
              Swagat Hai Aapka Future Mitra Mein
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
              Aapka Bada Bhai, Future Mitra 🤝
            </h2>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="h-[1px] w-28 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto"
          />

          {/* Empathetic Bade Bhai Description */}
          <p className="text-zinc-400 text-xs sm:text-sm font-medium px-4 leading-relaxed max-w-xs mx-auto">
            Class 9 se lekar College tak, boards, JEE/NEET ya career ki koi bhi tension ho, aapka bada bhai hamesha aapke sath hai!
          </p>

          <p className="text-[10px] font-bold text-emerald-400 tracking-wide mt-2">
            ✨ Empathetic 'Bada Bhai' & Student Career Strategist ✨
          </p>
        </motion.div>

        {/* Action Skip Button bottom */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-10 w-full"
        >
          <button
            onClick={handleExit}
            className="w-full group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#008069] to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/20 hover:shadow-emerald-950/40 transform active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span>Shuru Karein, Bade Bhai!</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          
          <p className="text-[9px] font-black text-rose-500 bg-rose-500/10 rounded-full px-3 py-1 inline-block mt-3.5 uppercase tracking-widest border border-rose-500/10">
            🔒 Fully Secure & Encrypted by Future Mitra
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
