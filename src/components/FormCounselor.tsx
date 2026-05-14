import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Info,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { getAIResponse } from '../services/geminiService';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

export const FormCounselor = ({ 
  form, 
  currentFields, 
  filledData, 
  onClose,
  userProfile 
}: { 
  form: any; 
  currentFields: any[]; 
  filledData: Record<string, string>; 
  onClose: () => void;
  userProfile?: UserProfile;
}) => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([
    { 
      role: 'ai', 
      content: "Namaste! Main aapka form counselor Mitra hoon. Aap abhi jis step par hain, usme main aapki poori madad karunga. Kya aapko kisi field mein help chahiye?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const context = {
        formName: form.formName,
        currentStepFields: currentFields.map(f => ({ name: f.field, value: filledData[f.field] || 'Not filled' })),
        userProfile: userProfile
      };

      const prompt = `User's Profile: ${JSON.stringify(userProfile || {})}
        Current Form: ${form.formName}
        Fields User is currently looking at: ${JSON.stringify(context.currentStepFields)}
        User's Question: ${userMsg}
        
        Answer as 'Mitra', the warm Bade Bhai. Be specific about the fields. If they ask about a specific field, explain it in simple Hinglish. 
        Always be encouraging and ensure they don't feel overwhelmed. 
        MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'`;

      const response = await getAIResponse(prompt);
      const aiText = typeof response === 'string' ? response : response.text;
      setMessages(prev => [...prev, { role: 'ai', content: aiText || "Bhai, lagta hai signal thoda kamzor hai. Kya aap firse puch sakte hain?" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Dost, thoda error aa gaya hai. Par chinta mat karo, main yahin hoon!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 bg-gradient-to-r from-orange-400 to-orange-500 text-white flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                 <Sparkles className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="font-black text-sm uppercase tracking-widest">Mitra Counselor</h2>
                 <p className="text-[10px] font-bold text-orange-100 uppercase tracking-tighter">Live Form Guidance</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
           </button>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
        >
           {messages.map((m, i) => (
             <div key={i} className={cn(
               "flex flex-col gap-1 max-w-[85%]",
               m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
             )}>
                <div className={cn(
                  "p-4 rounded-3xl text-sm font-bold shadow-sm",
                  m.role === 'user' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                )}>
                   {m.content}
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter px-1">
                   {m.role === 'ai' ? 'Mitra' : 'Aap'}
                </span>
             </div>
           ))}
           {isLoading && (
             <div className="flex items-center gap-2 text-orange-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mitra Soch Raha Hai...</span>
             </div>
           )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
           <div className="relative flex items-center gap-2">
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Apni pareshaani batayein..."
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-100 active:scale-95 disabled:grayscale transition-all"
              >
                 <Send className="w-5 h-5 leading-none" />
              </button>
           </div>
           <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
              <button 
                onClick={() => setInput("Yeh step kaise bharna hai?")}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                Kaise bharna hai?
              </button>
              <button 
                onClick={() => setInput("Documents kya chahiye?")}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                Documents?
              </button>
              <button 
                onClick={() => setInput("Error aa raha hai, help kijiye.")}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                Help with Error
              </button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
