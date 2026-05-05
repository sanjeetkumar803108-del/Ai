import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  BookOpen, 
  Search, 
  Settings, 
  Camera,
  Home as HomeIcon,
  Mic,
  Languages,
  LayoutDashboard,
  LogOut,
  Globe,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { AuthScreen } from './components/Auth';
import { LiveCall } from './components/LiveCall';
import { SCHEMES, STATES } from './constants';
import { Message, UserProfile } from './types';
import { getAIResponse, analyzeForm } from './services/geminiService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';

// --- Sub-components ---

const BottomNav = ({ active, onChange }: { active: string; onChange: (v: string) => void }) => {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'schemes', icon: BookOpen, label: 'Schemes' },
    { id: 'chat', icon: MessageCircle, label: 'AI Chat' },
    { id: 'guide', icon: Camera, label: 'Forms' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-safe-area-bottom z-50">
      <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-all active:scale-95",
              active === tab.id ? "text-[#008069]" : "text-gray-400"
            )}
            id={`nav-tab-${tab.id}`}
          >
            <tab.icon className={cn("w-5 h-5", active === tab.id && "fill-current opacity-20")} />
            <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// --- Screens ---

const HomeScreen = ({ onNavigate, userProfile }: { onNavigate: (v: string) => void; userProfile: UserProfile }) => {
  const popularSchemes = (() => {
    const stateSchemes = SCHEMES.filter(s => s.state === userProfile.state);
    const generalSchemes = SCHEMES.filter(s => !s.state);
    return [...stateSchemes, ...generalSchemes].slice(0, 3);
  })();

  return (
    <div className="flex flex-col gap-6 p-6 pb-24">
      <header className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-[#008069] tracking-tight">Form Mitra AI</h1>
            <p className="text-[11px] uppercase font-bold text-gray-400 tracking-widest">Sarkari Sahayak</p>
          </div>
          {userProfile.state && (
            <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1.5 shadow-sm">
               <Globe className="w-3 h-3 text-orange-600" />
               <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">{userProfile.state}</span>
            </div>
          )}
        </div>
        <p className="text-gray-500 mt-2 text-sm">Namaste! Main aapka 'Mitra' hoon. Kaise help karun?</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Search, label: "Search Schemes", desc: "Sarkari Yojna search", color: "bg-blue-50 text-blue-600", target: 'schemes' },
          { icon: Camera, label: "Upload Form", desc: "Photo se guide", color: "bg-purple-50 text-purple-600", target: 'guide' },
          { icon: MessageCircle, label: "Chat with AI", desc: "Hinglish help", color: "bg-green-50 text-[#008069]", target: 'chat' },
          { icon: Mic, label: "Live AI Call", desc: "Bol kar help payein", color: "bg-orange-50 text-orange-600", target: 'live' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (item.target === 'live') {
                (window as any).startLiveCall();
              } else {
                onNavigate(item.target);
              }
            }}
            className="flex flex-col gap-3 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-left hover:border-[#008069]/30 transition-all hover:-translate-y-1"
          >
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.label}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight font-medium">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold text-gray-900">{userProfile.state ? `Schemes for ${userProfile.state}` : 'Popular Schemes'}</h2>
          <button onClick={() => onNavigate('schemes')} className="text-[#008069] text-xs font-bold uppercase tracking-wider">See All</button>
        </div>
        <div className="flex flex-col gap-3">
          {popularSchemes.map((scheme) => (
            <div 
              key={scheme.id} 
              onClick={() => onNavigate('schemes')}
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center group cursor-pointer hover:border-[#008069]/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#008069] shrink-0 capitalize font-bold border border-gray-100">
                {scheme.category[0]}
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-gray-900 leading-tight">{scheme.hindiName || scheme.name}</h4>
                  {scheme.state && (
                    <span className="text-[8px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">{scheme.state}</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{scheme.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-4">
        <p className="text-[9px] text-gray-400 leading-relaxed font-medium uppercase tracking-wide text-center">
          ⚠️ Disclaimer: Yeh app guidance ke liye hai. Sahi jaankari ke liye Sarkari website check karein.
        </p>
      </div>
    </div>
  );
};

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** hoon. Main schemes samajhne aur forms bharne mein aapki help kar sakta hoon. Poochiye, main kaise help karu? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // ... rest of voice logic remains same ...
  const startVoiceInput = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }]
      }));
      
      const response = await getAIResponse(input, history);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.text || "Maafi chahta hoon, main samajh nahi paya.", 
        thought: response.thought,
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = { id: 'error', role: 'assistant', content: "Server mein kuch dikkat hai. Kripya thodi der baad try karein.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#E5DDD5] chat-pattern">
      <div className="bg-white border-b border-gray-100 p-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#008069] flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
            FM
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 leading-tight">Form Mitra AI</h3>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
        <button 
          onClick={() => (window as any).startLiveCall()}
          className="p-2.5 rounded-full bg-green-50 text-[#008069] shadow-sm border border-green-100 hover:bg-green-100 transition-colors"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex flex-col max-w-[85%] rounded-2xl p-3 shadow-sm relative",
              m.role === 'user' 
                ? "ml-auto bg-[#DCF8C6] text-gray-800 rounded-tr-none border border-[#C7E9B0]" 
                : "mr-auto bg-white text-gray-900 border border-gray-100 rounded-tl-none"
            )}
          >
            {m.role === 'assistant' && m.thought && (
              <details className="mb-2 text-[10px] text-gray-400 bg-gray-50 p-2 rounded-xl border border-gray-100 group">
                <summary className="cursor-pointer font-bold uppercase tracking-widest list-none flex items-center gap-1 group-open:mb-2">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse" />
                  Mitra's Thought Process
                </summary>
                <div className="italic font-medium leading-relaxed opacity-80">
                  {m.thought}
                </div>
              </details>
            )}
            <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 mt-0.5 text-inherit">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
            <span className="text-[9px] mt-1 opacity-50 text-right font-bold">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="mr-auto bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex flex-col gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <p className="text-[10px] text-[#008069] font-bold animate-pulse uppercase tracking-widest">Mitra is thinking & browsing...</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#F0F2F5] flex gap-3 items-center">
        <button
          onClick={() => {
            const url = prompt("Kripya government website ka link yahan paste karein (Example: pmkisan.gov.in):");
            if (url) {
              setInput(`Is website ko analyze karein aur iske schemes ke baare mein batayein: ${url}`);
            }
          }}
          className="p-2.5 rounded-full bg-white text-[#008069] shadow-sm border border-gray-100 hover:bg-gray-50 flex items-center justify-center"
          title="Analyze Website"
        >
          <Globe className="w-5 h-5" />
        </button>
        <button
          onClick={startVoiceInput}
          className={cn(
            "p-2.5 rounded-full transition-all shadow-sm",
            isListening ? "bg-red-500 text-white animate-pulse" : "bg-[#008069] text-white"
          )}
        >
          <Mic className="w-5 h-5" />
        </button>
        <div className="flex-1 bg-white h-11 rounded-full border border-gray-200 flex items-center px-4 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Hinglish mein puhein..."}
            className="flex-1 text-sm outline-none bg-transparent"
          />
          <button onClick={handleSend} disabled={!input.trim()} className="text-[#008069] disabled:opacity-30">
             <MessageCircle className="w-5 h-5 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

const GuideScreen = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [image, setImage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage(reader.result as string);
      setAnalyzing(true);
      setResult(null);
      
      try {
        const response = await analyzeForm(base64, file.type);
        if (response) {
          try {
            const parsed = JSON.parse(response);
            setResult(parsed);
          } catch (e) {
            // Fallback for non-JSON
            setResult({ summary: response });
          }
        } else {
          setResult({ summary: "Analyzed successfully." });
        }
      } catch (err) {
        setResult({ summary: "Maafi chahta hoon, analyze nahi ho saki. Photo saaf khinchein." });
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Form Filling Guide</h1>
        <p className="text-xs text-gray-500 font-medium">Form ki photo upload karein, AI turant samjha dega.</p>
      </header>

      {!image ? (
        <label className="border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group shadow-sm">
          <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform shadow-sm">
            <Camera className="w-8 h-8" />
          </div>
          <p className="font-bold text-gray-900 text-sm">Take / Select Photo</p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Photo saaf honi chahiye</p>
        </label>
      ) : (
        <div className="flex flex-col gap-6">
           <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-xl max-h-72 bg-black">
              <img src={image} alt="Form" className="w-full h-full object-contain" />
              <button 
                onClick={() => { setImage(null); setResult(null); }}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 text-red-500 shadow-xl"
              >
                <Search className="w-4 h-4 rotate-45" />
              </button>
           </div>
           
           {analyzing ? (
             <div className="flex flex-col items-center gap-3 py-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <div className="w-10 h-10 border-4 border-gray-100 border-t-[#008069] rounded-full animate-spin" />
               <p className="text-[#008069] text-xs font-bold animate-pulse tracking-widest uppercase text-center px-4">Form Mitra AI Is Analyzing<br/>Please wait...</p>
             </div>
           ) : result ? (
             <div className="flex flex-col gap-6">
               {/* Form Summary Card */}
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#008069]">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">{result.formName || 'Form Analysis'}</h2>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Summary</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{result.summary}</p>
               </div>

               {/* Fields Guide */}
               {result.fields && (
                 <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Field Guide (Kaise Bharein)</h3>
                    {result.fields.map((f: any, i: number) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900 text-sm">{f.field}</h4>
                          {f.isCritical && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[8px] font-bold rounded-md uppercase tracking-tighter">Critical</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-normal">{f.explanation}</p>
                        {f.commonMistake && (
                          <div className="mt-2 p-2.5 bg-orange-50 rounded-xl border border-orange-100 flex gap-2 items-start">
                            <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-orange-800 font-bold italic leading-tight">Galti na karein: {f.commonMistake}</p>
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
               )}

               {/* Pitfalls & Tips */}
               {(result.pitfalls || result.mitraTip) && (
                 <div className="bg-[#008069] text-white p-6 rounded-[2.5rem] shadow-xl">
                    {result.pitfalls && result.pitfalls.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Rejection Se Bachein</h4>
                        <ul className="space-y-2">
                          {result.pitfalls.map((p: string, i: number) => (
                             <li key={i} className="flex gap-2 items-start text-xs font-bold">
                               <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-300" />
                               <span>{p}</span>
                             </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.mitraTip && (
                      <div className="pt-4 border-t border-white/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Mitra Ki Salah</h4>
                        <p className="text-xs font-bold italic">"{result.mitraTip}"</p>
                      </div>
                    )}
                 </div>
               )}
             </div>
           ) : null}
        </div>
      )}

      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#008069]" />
          Pro Tips
        </h4>
        <ul className="text-sm text-gray-600 space-y-3 font-medium">
          <li className="flex gap-3">
             <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
             <span><b>Blue/Black Pen</b> ka hi prayog karein.</span>
          </li>
          <li className="flex gap-3">
             <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
             <span>Check karein ki <b>Aadhar</b> aur <b>PAN</b> details ek jaisi hon.</span>
          </li>
          <li className="flex gap-3">
             <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
             <span>Kat-phat (Overwriting) se form reject ho sakta hai.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

const SchemesScreen = ({ userProfile }: { userProfile: UserProfile }) => {
  const [filter, setFilter] = useState('');
  
  const filteredSchemes = filter 
    ? SCHEMES.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || s.hindiName.includes(filter))
    : SCHEMES;

  // Filter logic: show state-specific schemes first, or only state-specific if identified
  const stateSchemes = filteredSchemes.filter(s => s.state === userProfile.state);
  const otherSchemes = filteredSchemes.filter(s => !s.state || s.state !== userProfile.state);
  
  const displaySchemes = stateSchemes.length > 0 ? [...stateSchemes, ...otherSchemes] : filteredSchemes;

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {userProfile.state ? `${userProfile.state} & National Schemes` : 'Viral Schemes'}
        </h1>
        <p className="text-sm text-gray-500 font-medium">Aapke liye sabse zaroori yojnayein.</p>
      </header>
      
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Dhundhein: PM Kisan, Ration Card..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-4 text-sm focus:outline-none focus:border-[#008069] shadow-sm font-medium"
        />
      </div>

      <div className="flex flex-col gap-4">
        {displaySchemes.map((scheme) => (
          <div key={scheme.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-transform active:scale-[0.98]">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full border border-gray-100 uppercase tracking-widest">{scheme.category}</span>
                  {scheme.state && (
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full border border-orange-100 uppercase tracking-widest">{scheme.state}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                   <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                   <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">Active Now</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{scheme.hindiName}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60">{scheme.name}</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">{scheme.hindiDescription}</p>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                 <div className="p-3 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-[9px] uppercase font-bold text-green-600 mb-1 tracking-wider">Benefit</p>
                    <p className="text-xs text-gray-800 font-bold leading-tight">{scheme.benefits[0]}</p>
                 </div>
                 <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[9px] uppercase font-bold text-blue-600 mb-1 tracking-wider">Need</p>
                    <p className="text-xs text-gray-800 font-bold leading-tight">{scheme.documents[0]}</p>
                 </div>
              </div>
            </div>
            <button className="bg-[#008069] py-4 text-white text-xs font-bold uppercase tracking-widest hover:bg-[#005c4b] transition-colors">
              Poori Jaankari Padhein
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsScreen = ({ user, profile, onUpdateProfile }: { user: User | null; profile: UserProfile; onUpdateProfile: (p: UserProfile) => void }) => {

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">App settings badlein.</p>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold border-2 border-white shadow-sm overflow-hidden text-lg uppercase">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="User" />
               ) : (
                 user?.email?.[0] || 'U'
               )}
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{user?.displayName || 'User'}</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-100 flex items-center gap-2"
          >
            Logout <LogOut className="w-3 h-3" />
          </button>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#008069] to-[#005c4b] flex items-center justify-between text-white">
           <div>
             <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Premium Mitra</p>
             <p className="text-sm font-bold">Expert Call Support Payein!</p>
           </div>
           <p className="text-lg font-black tracking-tighter">₹49<span className="text-[10px] opacity-60">/mo</span></p>
        </div>
      </div>

      <div className="space-y-3">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-[#008069]">
                <Languages className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">Bhasha (Language)</p>
            </div>
            <select 
              value={profile.preferredLanguage}
              onChange={(e) => onUpdateProfile({ ...profile, preferredLanguage: e.target.value as any })}
              className="bg-transparent border-none font-bold text-[#008069] text-sm p-0 focus:ring-0"
            >
              <option value="hi">Hindi</option>
              <option value="hinglish">Hinglish</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                 <LayoutDashboard className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">Aapka Rajya (State)</p>
            </div>
            <select 
              value={profile.state}
              onChange={(e) => onUpdateProfile({ ...profile, state: e.target.value })}
              className="bg-transparent border-none font-bold text-[#008069] text-sm p-0 focus:ring-0 max-w-[100px] text-right"
            >
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Version 1.0.0 • Form Mitra AI</p>
      </div>
    </div>
  );
};

const AdBanner = () => {
  return (
    <div className="bg-gray-100 h-16 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border-y border-gray-200">
      Sponsor Ad Area
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (window as any).startLiveCall = () => setIsLiveCallOpen(true);
  }, []);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    preferredLanguage: 'hi',
    isPremium: false,
    state: 'Uttar Pradesh'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-[#008069] rounded-full animate-spin" />
          <p className="text-[#008069] text-xs font-bold tracking-widest uppercase animate-pulse">Loading Mitra AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-safe-area-top selection:bg-orange-200">
      <div className="max-w-lg mx-auto bg-white min-h-screen relative shadow-2xl flex flex-col">
        <div className="flex-1 overflow-y-auto pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'home' && <HomeScreen onNavigate={setActiveTab} userProfile={profile} />}
              {activeTab === 'schemes' && <SchemesScreen userProfile={profile} />}
              {activeTab === 'chat' && <ChatScreen />}
              {activeTab === 'guide' && <GuideScreen />}
              {activeTab === 'settings' && <SettingsScreen user={user} profile={profile} onUpdateProfile={setProfile} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {!isPremium && <AdBanner />}
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>

      <AnimatePresence>
        {isLiveCallOpen && (
          <LiveCall onClose={() => setIsLiveCallOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
