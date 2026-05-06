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
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Bookmark,
  Trash2,
  Share2,
  Edit2,
  ChevronRight,
  Hash,
  Award,
  FileCheck,
  Zap,
  Cpu,
  Sparkles,
  Star,
  Volume2,
  VolumeX
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AuthScreen } from './components/Auth';
import { LiveCall } from './components/LiveCall';
import { SCHEMES, STATES } from './constants';
import { Message, UserProfile, TrackerApplication, Conversation } from './types';
import { getAIResponse, analyzeForm, generateSchemeLetter, searchSchemes, generateFormalLetter, getComparisonRecommendation, getSpeech, getFieldExample } from './services/geminiService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check, MapPin, History, Plus, MessageSquare } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

// Initial connection test
testConnection();

// --- Sub-components ---

const BottomNav = ({ active, onChange }: { active: string; onChange: (v: string) => void }) => {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'schemes', icon: BookOpen, label: 'Schemes' },
    { id: 'letters', icon: FileText, label: 'Letters' },
    { id: 'chat', icon: MessageCircle, label: 'AI Chat' },
    { id: 'guide', icon: Camera, label: 'Forms' },
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
          <div className="flex items-center gap-3">
             <button 
               onClick={() => onNavigate('settings')}
               className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"
             >
                <Settings className="w-5 h-5" />
             </button>
             <div>
               <h1 className="text-3xl font-extrabold text-[#008069] tracking-tight">Form Mitra AI</h1>
               <p className="text-[11px] uppercase font-bold text-gray-400 tracking-widest">Sarkari Sahayak</p>
             </div>
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
          { icon: FileText, label: "Letter Writer", desc: "AI se Application", color: "bg-orange-50 text-orange-600", target: 'letters' },
          { icon: Camera, label: "Form Guide", desc: "Photo se guide", color: "bg-purple-50 text-purple-600", target: 'guide' },
          { icon: MessageCircle, label: "Chat with AI", desc: "Hinglish help", color: "bg-green-50 text-[#008069]", target: 'chat' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              onNavigate(item.target);
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
        <button
          onClick={() => (window as any).startLiveCall()}
          className="col-span-2 flex items-center justify-between p-4 bg-[#008069] rounded-3xl shadow-lg shadow-green-100 active:scale-95 transition-all text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm leading-tight uppercase tracking-widest">Live AI Call</h3>
              <p className="text-[10px] opacity-70 leading-tight font-medium">Mitra se bol kar baatein karein</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-50" />
        </button>
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
              className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center group cursor-pointer hover:border-[#008069]/20 transition-colors"
            >
              <div className="w-20 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                <img 
                  src={scheme.image || `https://picsum.photos/seed/${scheme.id}/200/160`} 
                  alt={scheme.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-gray-900 leading-tight line-clamp-1">{scheme.hindiName || scheme.name}</h4>
                  {scheme.state && (
                    <span className="text-[8px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap ml-2">{scheme.state}</span>
                  )}
                </div>
                {scheme.aiVersion && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Cpu className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{scheme.aiVersion}</span>
                  </div>
                )}
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 font-medium">{scheme.description}</p>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   <span className="text-[9px] font-black text-[#008069] uppercase tracking-widest">{scheme.category}</span>
                </div>
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

let globalAudioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioContext;
};

const PlayButton = ({ text }: { text: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlay = async () => {
    if (isPlaying || !text) return;
    setIsPlaying(true);
    try {
      console.log("Fetching speech for:", text.substring(0, 50) + "...");
      const base64Audio = await getSpeech(text.replace(/[#*`]/g, '')); // Clean markdown
      if (!base64Audio) {
        console.error("No audio data returned from Gemini");
        setIsPlaying(false);
        return;
      }

      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
         bytes[i] = binaryString.charCodeAt(i);
      }
      
      const sampleCount = Math.floor(bytes.length / 2);
      const audioBuffer = audioContext.createBuffer(1, sampleCount, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const view = new DataView(bytes.buffer);
      
      for (let i = 0; i < sampleCount; i++) {
         channelData[i] = view.getInt16(i * 2, true) / 32768.0;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      console.log("Audio playback started");
    } catch (error) {
      console.error("TTS Play Error:", error);
      setIsPlaying(false);
    }
  };

  return (
    <button 
      onClick={handlePlay}
      className={cn(
        "shrink-0 p-1.5 rounded-lg transition-all",
        isPlaying ? "bg-green-100 text-green-600 animate-pulse" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
      )}
      disabled={isPlaying}
      title="Listen to response"
    >
      {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  );
};

const ChatScreen = ({ initialMessage, onMessageConsumed, userProfile }: { 
  initialMessage?: string; 
  onMessageConsumed?: () => void;
  userProfile: UserProfile;
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** hoon. Main schemes samajhne aur forms bharne mein aapki help kar sakta hoon. Poochiye, main kaise help karu? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch conversations
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/conversations`),
      where('userId', '==', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(convs.sort((a, b) => b.updatedAt - a.updatedAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'conversations'));

    return () => unsubscribe();
  }, []);

  // Listen for messages in active conversation
  useEffect(() => {
    if (!auth.currentUser || !activeConversationId) {
      if (!activeConversationId) {
        setMessages([
          { id: 'welcome', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** hoon. Main schemes samajhne aur forms bharne mein aapki help kar sakta hoon. Poochiye, main kaise help karu? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
        ]);
      }
      return;
    }

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/conversations/${activeConversationId}/messages`)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => unsubscribe();
  }, [activeConversationId]);

  useEffect(() => {
    if (initialMessage) {
      handleInitialSend(initialMessage);
      onMessageConsumed?.();
    }
  }, [initialMessage]);

  const saveMessage = async (convId: string, role: string, content: string, thought?: string | null) => {
    if (!auth.currentUser) return;
    const msgData = {
      role,
      content,
      thought: thought || null,
      timestamp: Date.now(),
      userId: auth.currentUser.uid
    };
    
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/conversations/${convId}/messages`), msgData);
      
      // Update conversation metadata
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/conversations`, convId), {
        lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const createConversation = async (firstMessage: string) => {
    if (!auth.currentUser) return null;
    try {
      const convData = {
        userId: auth.currentUser.uid,
        title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
        lastMessage: firstMessage,
        updatedAt: Date.now()
      };
      const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/conversations`), convData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'conversations');
      return null;
    }
  };

  const handleInitialSend = async (text: string) => {
    setIsTyping(true);
    let convId = activeConversationId;
    
    if (!convId) {
      convId = await createConversation(text);
      if (!convId) return;
      setActiveConversationId(convId);
    }

    await saveMessage(convId, 'user', text);

    try {
      const response = await getAIResponse(text, [], userProfile);
      await saveMessage(convId, 'assistant', response.text || "Maafi chahta hoon...", response.thought);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !auth.currentUser) return;
    
    const text = input;
    setInput('');
    setIsTyping(true);
    
    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(text);
      if (!convId) return;
      setActiveConversationId(convId);
    }

    await saveMessage(convId, 'user', text);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }]
      }));
      
      const response = await getAIResponse(text, history, userProfile);
      await saveMessage(convId, 'assistant', response.text || "Maafi chahta hoon...", response.thought);
    } catch (error) {
      console.error(error);
      await saveMessage(convId, 'assistant', "Server mein kuch dikkat hai. Kripya thodi der baad try karein.");
    } finally {
      setIsTyping(false);
    }
  };

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

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      { id: 'welcome', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** hoon. Main schemes samajhne aur forms bharne mein aapki help kar sakta hoon. Poochiye, main kaise help karu? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
    ]);
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#E5DDD5] chat-pattern relative overflow-hidden">
      {/* History Sidebar/Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#008069] text-white">
                <h3 className="font-black uppercase tracking-widest text-sm">Chat History</h3>
                <button onClick={() => setShowHistory(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-3">
                <button 
                  onClick={startNewChat}
                  className="w-full py-3 bg-green-50 text-[#008069] rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-green-100 transition-all border border-green-100"
                >
                  <Plus className="w-4 h-4" />
                  New Conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-10">
                    <History className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No previous chats</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setShowHistory(false);
                      }}
                      className={cn(
                        "w-full p-3 rounded-2xl text-left border transition-all flex flex-col gap-1",
                        activeConversationId === conv.id 
                          ? "bg-green-50 border-green-200" 
                          : "bg-white border-gray-100 hover:border-green-100"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{conv.title}</h4>
                        <span className="text-[8px] text-gray-400 font-black uppercase whitespace-nowrap">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-1 font-medium">{conv.lastMessage}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="bg-white border-b border-gray-100 p-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(true)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"
          >
            <History className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#008069] flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
            FM
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 leading-tight">Form Mitra AI</h3>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
              {activeConversationId ? 'Active Session' : 'New Chat'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeConversationId && (
            <button 
              onClick={startNewChat}
              className="p-2 text-gray-400 hover:text-[#008069] transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => (window as any).startLiveCall()}
            className="p-2.5 rounded-full bg-green-50 text-[#008069] shadow-sm border border-green-100 hover:bg-green-100 transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
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
            
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5">
              {m.role === 'assistant' && <PlayButton text={m.content} />}
              <span className={cn("text-[9px] opacity-40 font-bold ml-auto")}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {m.role === 'assistant' && (m.content.includes('scheme') || m.content.includes('verify') || m.content.includes('website')) && (
              <button
                onClick={() => setInput(`VERIFY_OFFICIAL: Kripya is scheme/jaankari ko official website se re-check karein aur latest 2026 data batayein.`)}
                className="mt-3 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#008069]/10 text-[#008069] text-[9px] font-black uppercase tracking-widest hover:bg-[#008069]/20 transition-all border border-[#008069]/20 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                RE-CHECK Official Website
              </button>
            )}
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

      <div className="p-3 bg-[#F0F2F5] flex gap-3 items-center z-20">
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

const GuideScreen = ({ onNavigate }: { onNavigate: (v: string) => void }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showExampleIndex, setShowExampleIndex] = useState<number | null>(null);
  const [nameError, setNameError] = useState(false);
  const [loadingExampleIndex, setLoadingExampleIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (analyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          // Slower progress as it gets closer to 90%
          const increment = prev < 50 ? 5 : (90 - prev) * 0.1;
          return Math.min(prev + increment, 90);
        });
      }, 500);
    } else if (result) {
      setProgress(100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [analyzing, result]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setResult(null);
    setError(null);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage(reader.result as string);
      setUploadSuccess(true);
      setAnalyzing(true);
      
      try {
        const response = await analyzeForm(base64, file.type);
        if (response) {
          try {
            const parsed = JSON.parse(response);
            setResult(parsed);
          } catch (e) {
            console.error("JSON Parse Error:", e);
            setError("Analysis complete, par display format mein dikkat hai. Kirpya firse try karein.");
          }
        } else {
          setError("AI se koi response nahi mila. Photo saaf kheenchiye aur dubara upload karein.");
        }
      } catch (err: any) {
        console.error("Analysis Error:", err);
        if (err?.message?.includes("Quota")) {
          setError("Limit khatam ho gayi hai. Kal try karein ya support se baat karein.");
        } else {
          setError("Maafi chahta hoon, analyze nahi ho saki. Photo thodi door se aur saaf kheenchiye.");
        }
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateField = (index: number, key: string, value: string) => {
    setResult((prev: any) => {
      if (!prev || !prev.fields) return prev;
      const newFields = [...prev.fields];
      newFields[index] = { ...newFields[index], [key]: value };
      return { ...prev, fields: newFields };
    });
  };

  const updateSummary = (value: string) => {
    setResult((prev: any) => prev ? { ...prev, summary: value } : prev);
  };

  const updateFormName = (value: string) => {
    // Limit total input length to 50
    if (value.length > 50) return;
    
    // Check if name is valid (not empty and between 3-50 chars)
    const isValid = value.trim().length >= 3 && value.trim().length <= 50;
    setNameError(!isValid);
    
    setResult((prev: any) => prev ? { ...prev, formName: value } : prev);
  };

  const fetchExample = async (i: number) => {
    if (showExampleIndex === i) {
      setShowExampleIndex(null);
      return;
    }

    const field = result.fields[i];
    if (!field.exampleValue) {
      setLoadingExampleIndex(i);
      try {
        const example = await getFieldExample(result.formName || 'Form', field.field, field.explanation);
        updateField(i, 'exampleValue', example.trim());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExampleIndex(null);
      }
    }
    setShowExampleIndex(i);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <button 
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"
        >
          <Settings className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Form Filling Guide</h1>
          <p className="text-xs text-gray-500 font-medium">Form ki photo upload karein, AI turant samjha dega.</p>
        </div>
      </header>

      {!image ? (
        <div className="flex flex-col gap-4">
          <label className="border-2 border-dashed border-[#008069] border-opacity-20 rounded-[2.5rem] p-10 flex flex-col items-center justify-center bg-[#008069] bg-opacity-[0.02] hover:bg-opacity-[0.05] transition-all cursor-pointer group shadow-sm">
            <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" capture="environment" />
            <div className="w-14 h-14 rounded-2xl bg-[#008069] flex items-center justify-center text-white mb-4 group-hover:rotate-6 transition-transform shadow-lg shadow-green-200">
              <Camera className="w-7 h-7" />
            </div>
            <p className="font-black text-gray-900 text-sm uppercase tracking-tight">Abhi Photo Kheenche</p>
            <p className="text-[10px] text-[#008069] mt-1 font-bold tracking-widest opacity-60">Use Camera to Capture</p>
          </label>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Ya fir</span>
            <div className="flex-1 h-[1px] bg-gray-100" />
          </div>

          <label className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-4 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
            <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Gallery se chuney</p>
              <p className="text-[10px] text-gray-400 font-medium">Upload existing screenshot or photo</p>
            </div>
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
           <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-xl max-h-72 bg-black">
              <img src={image} alt="Form" className={`w-full h-full object-contain ${analyzing ? 'opacity-50' : 'opacity-100'}`} />
              <button 
                onClick={() => { setImage(null); setResult(null); setError(null); setUploadSuccess(false); }}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 text-red-500 shadow-xl z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {uploadSuccess && !analyzing && !result && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="bg-white p-4 rounded-full shadow-2xl"
                  >
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </motion.div>
                </div>
              )}
           </div>
           
           {analyzing ? (
             <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-md flex flex-col items-center gap-6">
               <div className="flex gap-1.5 items-center">
                 <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 bg-[#008069] rounded-full" />
                 <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-3 h-3 bg-[#008069] rounded-full" />
                 <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-3 h-3 bg-[#008069] rounded-full" />
               </div>
               
               <div className="w-full space-y-3">
                 <div className="flex justify-between items-center px-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#008069]">
                     {progress < 40 ? 'AI Analyzing' : progress < 80 ? 'Fields Extraction' : 'Finishing Up'}...
                   </p>
                   <span className="text-[10px] font-black text-gray-400">{Math.round(progress)}%</span>
                 </div>
                 <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                   <motion.div 
                     className="h-full bg-[#008069]" 
                     animate={{ width: `${progress}%` }}
                     transition={{ ease: "linear", duration: 0.5 }}
                   />
                 </div>
               </div>

               <div className="text-center">
                 <p className="text-[#008069] text-sm font-black tracking-widest uppercase">Mitra AI Soch Raha Hai...</p>
                 <p className="text-[10px] text-gray-400 font-bold mt-1">Form ke details analyze ho rahe hain</p>
               </div>
             </div>
           ) : error ? (
             <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <div>
                  <h3 className="text-red-900 font-bold text-sm">Galti Ho Gayi!</h3>
                  <p className="text-red-600 text-xs font-medium mt-1 leading-relaxed">{error}</p>
                </div>
                <button 
                  onClick={() => { setImage(null); setError(null); }}
                  className="bg-red-500 text-white px-6 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest mt-2"
                >
                  Firse Try Karein
                </button>
             </div>
           ) : result ? (
             <div className="flex flex-col gap-6">
               {/* Form Summary Card */}
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-3 h-3 text-gray-300" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#008069]">
                      <Info className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <input 
                        value={result.formName === undefined ? 'Form Analysis' : result.formName}
                        onChange={(e) => updateFormName(e.target.value)}
                        className={`text-lg font-black bg-transparent border-none focus:ring-0 p-0 w-full transition-colors ${nameError ? 'text-red-500' : 'text-gray-900'}`}
                        placeholder="Form Name"
                      />
                      {nameError && <p className="text-[8px] text-red-500 font-bold uppercase tracking-tighter">Form name 3 se 50 characters ke beech hona chahiye</p>}
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Summary</p>
                        <PlayButton text={result.summary} />
                      </div>
                    </div>
                  </div>
                  <textarea 
                    value={result.summary}
                    onChange={(e) => updateSummary(e.target.value)}
                    className="text-sm text-gray-600 font-medium leading-relaxed bg-transparent border-none focus:ring-0 p-0 w-full resize-none scrollbar-hide"
                    rows={3}
                  />
               </div>

               {/* Fields Guide */}
               {result.fields && (
                 <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Field Guide (Kaise Bharein)</h3>
                      <p className="text-[8px] font-black text-[#008069] uppercase tracking-widest">Click to Edit</p>
                    </div>
                    {result.fields.map((f: any, i: number) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2 group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit2 className="w-3 h-3 text-gray-300" />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <input 
                              value={f.field}
                              onChange={(e) => updateField(i, 'field', e.target.value)}
                              className="font-bold text-gray-900 text-sm bg-transparent border-none focus:ring-0 p-0 w-full"
                              placeholder="Field Name"
                            />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <PlayButton text={`${f.field}: ${f.explanation}`} />
                            {f.isCritical && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[8px] font-bold rounded-md uppercase tracking-tighter shrink-0">Critical</span>
                            )}
                          </div>
                        </div>
                        <textarea 
                          value={f.explanation}
                          onChange={(e) => updateField(i, 'explanation', e.target.value)}
                          className="text-xs text-gray-500 font-medium leading-normal bg-transparent border-none focus:ring-0 p-0 w-full resize-none"
                          rows={2}
                          placeholder="Kaise bharein..."
                        />

                        <div className="flex flex-col gap-2 mt-2">
                          <button 
                            onClick={() => fetchExample(i)}
                            disabled={loadingExampleIndex === i}
                            className={cn(
                              "self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                              showExampleIndex === i 
                                ? "bg-purple-100 text-purple-700" 
                                : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                            )}
                          >
                            {loadingExampleIndex === i ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                <Sparkles className="w-3 h-3" />
                              </motion.div>
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            {loadingExampleIndex === i ? 'Generating...' : showExampleIndex === i ? 'Hide AI Example' : 'Show AI Example'}
                          </button>
                          
                          <AnimatePresence>
                            {showExampleIndex === i && f.exampleValue && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden bg-purple-50/30 rounded-2xl p-3 border border-purple-100/50"
                              >
                                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                    <p className="text-[8px] font-black uppercase tracking-widest text-purple-400">AI Fill Example</p>
                                  </div>
                                  <button 
                                    onClick={() => copyToClipboard(f.exampleValue, i)}
                                    className="p-1 px-2 rounded-lg bg-white/50 hover:bg-white text-purple-600 transition-all flex items-center gap-1 border border-purple-100 shadow-sm"
                                  >
                                    {copiedIndex === i ? (
                                      <>
                                        <Check className="w-2.5 h-2.5" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-2.5 h-2.5" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs font-bold text-gray-900 leading-relaxed italic">
                                  "{f.exampleValue}"
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {f.commonMistake && (
                          <div className="mt-2 p-2.5 bg-orange-50 rounded-xl border border-orange-100 flex gap-2 items-start">
                            <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                            <input 
                              value={f.commonMistake}
                              onChange={(e) => updateField(i, 'commonMistake', e.target.value)}
                              className="text-[10px] text-orange-800 font-bold italic leading-tight bg-transparent border-none focus:ring-0 p-0 w-full"
                              placeholder="Galti na karein..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
               )}

               {/* Mitra's Advice Corner */}
               {(result.pitfalls || result.mitraTip || result.smartTips) && (
                 <div className="flex flex-col gap-4">
                   <div className="bg-[#008069] text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle className="w-5 h-5 text-green-300" />
                          <h4 className="text-sm font-black uppercase tracking-widest">Mitra's Smart Tips</h4>
                        </div>

                        {result.smartTips && result.smartTips.length > 0 && (
                          <div className="flex flex-col gap-3 mb-6">
                            {result.smartTips.map((tip: string, i: number) => (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i} 
                                className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex gap-3 items-start"
                              >
                                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                <span className="text-[11px] font-bold leading-relaxed">{tip}</span>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {result.pitfalls && result.pitfalls.length > 0 && (
                          <div className="bg-orange-500/30 p-4 rounded-3xl border border-white/10 mb-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-200 mb-2 flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3" />
                              Common Rejection Pitfalls
                            </h5>
                            <div className="flex flex-col gap-2">
                              {result.pitfalls.map((p: string, i: number) => (
                                <p key={i} className="text-[11px] font-bold flex gap-2">
                                  <span className="opacity-50">•</span> {p}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.mitraTip && (
                          <div className="pt-4 border-t border-white/10 flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#008069] shrink-0 font-black text-[10px] shadow-lg">FM</div>
                            <p className="text-[11px] font-black italic opacity-90 flex-1">"{result.mitraTip}"</p>
                            <PlayButton text={result.mitraTip} />
                          </div>
                        )}
                      </div>
                   </div>
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

const SchemesScreen = ({ userProfile, onAskMitra, savedSchemeIds, onToggleSave, onNavigate, initialExpandedId, onClearInitialExpandedId }: { 
  userProfile: UserProfile; 
  onAskMitra: (schemeName: string) => void;
  savedSchemeIds: string[];
  onToggleSave: (id: string) => void;
  onNavigate: (tab: string) => void;
  initialExpandedId?: string | null;
  onClearInitialExpandedId?: () => void;
}) => {
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId || null);

  useEffect(() => {
    if (initialExpandedId) {
      setExpandedId(initialExpandedId);
      if (onClearInitialExpandedId) onClearInitialExpandedId();
    }
  }, [initialExpandedId, onClearInitialExpandedId]);

  useEffect(() => {
    setRecommendation(null);
  }, [selectedIds, isComparing]);

  const [letterContent, setLetterContent] = useState<string | null>(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [activeLetterSchemeId, setActiveLetterSchemeId] = useState<string | null>(null);
  const [didCopyLetter, setDidCopyLetter] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAIAnalysis = async (schemes: any[]) => {
    setIsAnalyzing(true);
    setRecommendation(null);
    try {
      const text = await getComparisonRecommendation(schemes, userProfile);
      setRecommendation(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeepSearch = async () => {
    if (!filter) return;
    setIsSearching(true);
    setAiResults([]); // Clear previous results
    try {
      const results = await searchSchemes(filter, userProfile);
      setAiResults(results.map((r: any, i: number) => ({
        ...r,
        id: `ai-${Date.now()}-${i}`,
        mitraId: `MITRA-AI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        aiVersion: 'AI Model v2.1',
        type: 'ai',
        hindiDescription: r.description // Map description to hindiDescription for rendering
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateLetter = async (scheme: any) => {
    setIsGeneratingLetter(true);
    setActiveLetterSchemeId(scheme.id);
    setLetterContent(null);
    try {
      const text = await generateSchemeLetter(scheme.name, scheme, userProfile);
      setLetterContent(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setDidCopyLetter(true);
    setTimeout(() => setDidCopyLetter(false), 2000);
  };

  const categories = ['Agriculture', 'Health', 'Social', 'Education', 'Finance'];

  const addToRecent = (term: string) => {
    if (!term.trim() || term.length < 2) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 5);
    });
  };
  
  const filteredSchemes = SCHEMES.filter(s => {
    const matchesSearch = filter 
      ? (s.name.toLowerCase().includes(filter.toLowerCase()) || s.hindiName.includes(filter))
      : true;
    const matchesCategory = selectedCategory 
      ? s.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  // Filter logic: show state-specific schemes first, or only state-specific if identified
  const stateSchemes = filteredSchemes.filter(s => s.state === userProfile.state);
  const otherSchemes = filteredSchemes.filter(s => !s.state || s.state !== userProfile.state);
  
  const displaySchemes = stateSchemes.length > 0 ? [...stateSchemes, ...otherSchemes] : filteredSchemes;

  // Add AI results to the end
  const finalDisplay = [...displaySchemes, ...aiResults];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev; // Limit to 3 comparison
      return [...prev, id];
    });
  };

  const selectedSchemes = [...SCHEMES, ...aiResults].filter(s => selectedIds.includes(s.id));

  if (isComparing) {
    const categories_comparison = [
      { key: 'eligibility', label: 'Eligibility', icon: <Hash className="w-4 h-4 text-orange-500" />, color: 'orange' },
      { key: 'benefits', label: 'Benefits', icon: <Award className="w-4 h-4 text-green-500" />, color: 'green' },
      { key: 'documents', label: 'Requirements', icon: <FileCheck className="w-4 h-4 text-blue-500" />, color: 'blue' }
    ];

    return (
      <div className="flex flex-col h-full bg-[#f8fafc] fixed inset-0 z-[60] overflow-hidden">
        <header className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Scheme Comparison</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Compare features side-by-side</p>
          </div>
          <button 
            onClick={() => setIsComparing(false)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {recommendation && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-[1000px] mx-auto mb-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 p-8 shadow-xl shadow-orange-900/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Star className="w-5 h-5 fill-orange-600" />
                </div>
                <div>
                   <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest leading-none">Mitra's Personalized Reco</h3>
                   <p className="text-[10px] text-orange-600 font-bold uppercase tracking-tight mt-1">AI-Powered Analysis for You</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-orange-900 font-medium leading-relaxed whitespace-pre-wrap space-y-4">
                  <ReactMarkdown>{recommendation}</ReactMarkdown>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-orange-100 flex justify-between items-center">
                 <p className="text-[10px] text-orange-500 font-bold italic">This recommendation is based on your profile and official scheme details.</p>
                 <button 
                   onClick={() => copyToClipboard(recommendation)}
                   className="flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black underline uppercase tracking-widest shadow-sm hover:translate-y-[-1px] transition-transform"
                 >
                   {didCopyLetter ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                   {didCopyLetter ? 'Copied' : 'Save Recommendation'}
                 </button>
              </div>
            </motion.div>
          )}

          <div className="min-w-[800px] flex flex-col gap-px bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl bg-white mb-20 px-0">
            {/* Headers Row */}
            <div className="flex bg-[#f8fafc]">
              <div className="w-48 shrink-0 p-8 flex items-end">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Features</span>
              </div>
              {selectedSchemes.map((s) => (
                <div key={s.id} className="flex-1 border-l border-gray-100 bg-white flex flex-col">
                  <div className="h-32 w-full overflow-hidden relative">
                    <img 
                      src={s.image || `https://picsum.photos/seed/${s.id}/400/300`} 
                      alt={s.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  </div>
                  <div className="p-6 pt-2">
                    <span className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-full border border-gray-100 mb-3 inline-block">{s.category}</span>
                    <h3 className="font-bold text-base text-gray-900 leading-tight mb-1">{s.hindiName}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter opacity-60 line-clamp-1">{s.name}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Rows */}
            {categories_comparison.map((cat) => (
              <div key={cat.key} className="flex border-t border-gray-50">
                <div className="w-48 shrink-0 p-8 bg-[#fdfdfd] flex flex-col gap-2">
                   <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border", 
                     cat.color === 'orange' ? "bg-orange-50 border-orange-100" : 
                     cat.color === 'green' ? "bg-green-50 border-green-100" : 
                     "bg-blue-50 border-blue-100")}>
                     {cat.icon}
                   </div>
                   <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mt-2">{cat.label}</h4>
                </div>
                {selectedSchemes.map((s) => (
                  <div key={`${s.id}-${cat.key}`} className="flex-1 p-8 border-l border-gray-100 bg-white">
                    <ul className="space-y-4">
                      {(s[cat.key as keyof typeof s] as string[]).map((item, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <div className={cn("w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5", 
                            cat.color === 'orange' ? "bg-orange-50" : 
                            cat.color === 'green' ? "bg-green-50" : 
                            "bg-blue-50")}>
                            <Check className={cn("w-3 h-3", 
                              cat.color === 'orange' ? "text-orange-500" : 
                              cat.color === 'green' ? "text-green-500" : 
                              "text-blue-500")} />
                          </div>
                          <span className="text-sm font-medium text-gray-600 leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}

            {/* CTA Row */}
            <div className="flex border-t border-gray-50 bg-[#f8fafc]/50">
              <div className="w-48 shrink-0 p-8"></div>
              {selectedSchemes.map((s) => (
                <div key={`${s.id}-cta`} className="flex-1 p-8 border-l border-gray-100 flex flex-col gap-4">
                  <button 
                    onClick={() => {
                        setIsComparing(false);
                        setExpandedId(s.id);
                        setTimeout(() => {
                            const el = document.getElementById(`scheme-${s.id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    }}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 active:scale-95 transition-all hover:bg-gray-800"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => onAskMitra(`Mujhe ${s.hindiName} ke baare mein aur batayein.`)}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Ask Mitra
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex justify-center sticky bottom-0">
          <button 
            disabled={isAnalyzing}
            onClick={() => handleAIAnalysis(selectedSchemes)}
            className="w-full max-w-md py-5 bg-[#008069] text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {isAnalyzing ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                </div>
            )}
            {isAnalyzing ? 'Mitra is analyzing...' : 'Get AI Recommendation'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {userProfile.state ? `${userProfile.state} & National Schemes` : 'Viral Schemes'}
            </h1>
            <p className="text-sm text-gray-500 font-medium">Aapke liye sabse zaroori yojnayein.</p>
          </div>
        </div>
      </header>
      
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Dhundhein: PM Kisan, Ration Card..." 
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              if (e.target.value === '') setAiResults([]);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addToRecent(filter);
                handleDeepSearch();
              }
            }}
            onBlur={() => addToRecent(filter)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-24 py-4 text-sm focus:outline-none focus:border-[#008069] shadow-sm font-medium"
          />
          <button 
            onClick={handleDeepSearch}
            disabled={isSearching || !filter}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#008069] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-green-100 disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
            {isSearching ? 'Searching...' : 'Deep AI Search'}
          </button>
        </div>
        
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
               <Globe className="w-3 h-3 text-blue-600 animate-pulse" />
            </div>
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight">
              Mitra AI is analyzing your intent and deep searching government portals...
            </p>
          </motion.div>
        )}

        {recentSearches.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest self-center mr-1">Recent:</span>
            {recentSearches.map((s, i) => (
              <button 
                key={i}
                onClick={() => setFilter(s)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex overflow-x-auto pb-2 -mx-1 px-1 gap-2 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
              !selectedCategory 
                ? "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100" 
                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                selectedCategory === cat 
                  ? "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.length === 1 && (
        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest animate-pulse px-2 -mb-2">Ek aur scheme select karein compare karne ke liye!</p>
      )}

      <div className="flex flex-col gap-4 mb-32">
        {finalDisplay.map((scheme) => {
          const isSelected = selectedIds.includes(scheme.id);
          const isSaved = savedSchemeIds.includes(scheme.id);
          const isExpanded = expandedId === scheme.id;
          const isAiResult = scheme.type === 'ai';

          const handleShare = async (e: React.MouseEvent) => {
            e.stopPropagation();
            const description = scheme.hindiDescription || scheme.description;
            const shareData = {
              title: `Form Mitra: ${scheme.hindiName}`,
              text: `${scheme.hindiName}\n\n${description}\n\nDownload Form Mitra for more info!`,
              url: scheme.officialUrl || window.location.href
            };

            try {
              if (navigator.share) {
                await navigator.share(shareData);
              } else {
                // Fallback for browsers that don't support Web Share API
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                // Use a more subtle feedback than alert if possible, but alert is okay for now
                alert(`'${scheme.hindiName}' details copied to clipboard!`);
              }
            } catch (err) {
              console.error('Error sharing:', err);
            }
          };

          return (
            <div 
              key={scheme.id} 
              onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
              className={cn(
                "bg-white rounded-[2rem] border transition-all overflow-hidden flex flex-col relative cursor-pointer",
                isSelected ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-20 shadow-xl" : "border-gray-100 shadow-sm",
                isExpanded && "shadow-lg scale-[1.01]"
              )}
            >
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <div className="relative group/tooltip">
                  <button 
                    onClick={handleShare}
                    className="w-8 h-8 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-bold rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                    Doston ke saath share karein
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>

                <div className="relative group/tooltip">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(scheme.id);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      isSaved ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    )}
                  >
                    <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-bold rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                    {isSaved ? 'Saved schemes se hatayein' : 'Baad mein dekhne ke liye save karein'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>

                <div className="relative group/tooltip">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(scheme.id);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      isSelected ? "bg-[#008069] text-white shadow-lg" : "bg-white/80 backdrop-blur-md text-gray-500 hover:bg-white transition-all shadow-sm"
                    )}
                  >
                    {isSelected ? <CheckCircle className="w-4 h-4" /> : <div className="w-2.5 h-2.5 border-2 border-gray-300 rounded-sm" />}
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-bold rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                    {isSelected ? 'Comparison se hatayein' : 'Doosri scheme se compare karne ke liye chunein'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              </div>

              <div className="h-44 w-full relative overflow-hidden bg-gray-100">
                <img 
                   src={scheme.image || `https://picsum.photos/seed/${scheme.id}/800/600`}
                   alt={scheme.name}
                   referrerPolicy="no-referrer"
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                   <div className="flex gap-2">
                     <span className="px-3 py-1 bg-[#008069] text-white text-[9px] font-black rounded-full border border-white/20 uppercase tracking-widest shadow-lg">{scheme.category}</span>
                     {scheme.state && (
                       <span className="px-3 py-1 bg-orange-500 text-white text-[9px] font-black rounded-full border border-white/20 uppercase tracking-widest shadow-lg">{scheme.state}</span>
                     )}
                   </div>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{scheme.hindiName}</h3>
                    {scheme.officialSource && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                          <Check className="w-2.5 h-2.5 text-blue-600" />
                        </div>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">Source: {scheme.officialSource}</p>
                      </div>
                    )}
                    {isAiResult && scheme.confidenceScore && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                          <Zap className="w-2.5 h-2.5 text-purple-600" />
                        </div>
                        <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">{scheme.confidenceScore}% Mitra Match</p>
                      </div>
                    )}
                    {scheme.aiVersion && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                          <Cpu className="w-2.5 h-2.5 text-slate-500" />
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{scheme.aiVersion}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60">{scheme.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                     <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                     <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">Active</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-2">{scheme.hindiDescription || scheme.description}</p>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                   <div className="p-3 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[9px] uppercase font-bold text-green-600 mb-1 tracking-wider">Benefit</p>
                      <p className="text-xs text-gray-800 font-bold leading-tight line-clamp-2">
                        {scheme.benefits?.[0] || 'AI can tell details'}
                      </p>
                   </div>
                   <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[9px] uppercase font-bold text-blue-600 mb-1 tracking-wider">Need</p>
                      <p className="text-xs text-gray-800 font-bold leading-tight line-clamp-2">
                        {scheme.documents?.[0] || 'Aadhar/PAN Card'}
                      </p>
                   </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden flex flex-col gap-5 pt-4 border-t border-gray-50"
                    >
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Details</p>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{scheme.description}</p>
                      </div>

                      {scheme.benefits && scheme.benefits.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">All Benefits</p>
                          <ul className="space-y-2">
                            {scheme.benefits.map((b: string, i: number) => (
                              <li key={i} className="text-xs text-gray-600 font-medium flex gap-2 items-start">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scheme.documents && scheme.documents.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Required Documents</p>
                          <div className="flex flex-wrap gap-1.5">
                            {scheme.documents.map((d: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100 uppercase tracking-tighter">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                        <div className="flex flex-col gap-3 bg-orange-50/50 p-4 rounded-[2rem] border border-orange-100/50">
                          <div className="flex-1">
                            <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest px-1">Puri Jaankari & Verification</h4>
                            <p className="text-[11px] text-orange-800/70 font-medium leading-tight px-1">AI se official details verify karwaein.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAskMitra(`Mujhe ${scheme.hindiName || scheme.name} scheme ki puri jaankari Chahiye. Eligibility, benefits aur documents batayein.`);
                              }}
                              className="w-full py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAskMitra(`VERIFY_OFFICIAL: Please search and verify the details of ${scheme.hindiName || scheme.name} from its official government website right now. Match it with the latest 2026 data and correct any mistakes.`);
                              }}
                              className="w-full py-3 bg-white text-orange-600 border border-orange-200 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Globe className="w-4 h-4" />
                              Verify
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 mr-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Application Mitra</h4>
                            <p className="text-[11px] text-gray-500 font-medium">Personalized application letter likhwayein AI se.</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateLetter(scheme);
                            }}
                            disabled={isGeneratingLetter && activeLetterSchemeId === scheme.id}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0",
                              isGeneratingLetter && activeLetterSchemeId === scheme.id
                                ? "bg-gray-100 text-gray-400"
                                : "bg-[#008069] text-white shadow-lg shadow-green-100 active:scale-95"
                            )}
                          >
                            {isGeneratingLetter && activeLetterSchemeId === scheme.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                <span>Likhein...</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                <span>Draft Application</span>
                              </>
                            )}
                          </button>
                        </div>

                        {letterContent && activeLetterSchemeId === scheme.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 rounded-2.5rem p-6 border border-gray-100 flex flex-col gap-4 shadow-inner"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-[#008069] uppercase tracking-widest">Generated Letter</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(letterContent!);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-100 text-[#008069] text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-green-50 transition-colors"
                              >
                                {didCopyLetter ? (
                                  <><Check className="w-3 h-3" /> Copied!</>
                                ) : (
                                  <><Copy className="w-3 h-3" /> Copy Text</>
                                )}
                              </button>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 text-[11px] text-gray-800 font-serif leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto shadow-sm">
                              {letterContent}
                            </div>
                            <p className="text-[9px] text-gray-400 italic text-center px-4 leading-tight">
                              Ye ek draft hai. Kripya details check karein aur placeholders ([ ]) ko apni sahi jankari se bharein.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center pt-2">
                   {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAskMitra(scheme.name);
                }}
                className="bg-[#008069] py-4 text-white text-xs font-bold uppercase tracking-widest hover:bg-[#005c4b] transition-colors"
              >
                Poori Jaankari Padhein
              </button>
            </div>
          );
        })}
      </div>

      {/* Persistent Bottom Comparison Bar */}
      <AnimatePresence>
        {selectedIds.length >= 1 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-40"
          >
            <div className={cn(
              "p-4 rounded-[2.5rem] shadow-2xl border transition-all duration-500 overflow-hidden",
              selectedIds.length >= 2 
                ? "bg-[#008069] border-[#005c4b] text-white" 
                : "bg-white border-gray-100 text-gray-900"
            )}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-colors shadow-inner",
                      selectedIds.length >= 2 ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}>
                      {selectedIds.length}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">
                        {selectedIds.length >= 2 
                          ? "Schemes Comparison Tayyar Hai!" 
                          : "Comparison ke liye ek aur chunein"}
                      </p>
                      <p className={cn(
                        "text-[9px] uppercase font-black tracking-widest opacity-60",
                        selectedIds.length >= 2 ? "text-white" : "text-gray-400"
                      )}>
                        {selectedIds.length}/3 Selected
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={selectedIds.length < 2}
                    onClick={() => setIsComparing(true)}
                    className={cn(
                      "px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl",
                      selectedIds.length >= 2 
                        ? "bg-white text-[#008069] shadow-green-900/40 hover:scale-105 active:scale-95" 
                        : "bg-gray-100 text-gray-300 pointer-events-none"
                    )}
                  >
                    Compare Karain
                    <ChevronRight className={cn("w-4 h-4", selectedIds.length < 2 && "opacity-20")} />
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide">
                    {selectedSchemes.map(s => (
                        <div 
                           key={s.id}
                           className={cn(
                               "px-3 py-2 rounded-xl flex items-center gap-2 shrink-0 border transition-all animate-in fade-in slide-in-from-left-2",
                               selectedIds.length >= 2 
                                 ? "bg-white/10 border-white/20 text-white" 
                                 : "bg-gray-50 border-gray-100 text-gray-500"
                           )}
                        >
                            <span className="text-[10px] font-bold line-clamp-1 max-w-[100px]">{s.hindiName}</span>
                            <button 
                                onClick={() => toggleSelect(s.id)}
                                className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                                    selectedIds.length >= 2 ? "bg-white/20 hover:bg-red-400/40" : "bg-gray-200 hover:bg-red-500/20"
                                )}
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LetterScreen = ({ userProfile }: { userProfile: UserProfile }) => {
  const [topic, setTopic] = useState('Application for Transfer Certificate');
  const [details, setDetails] = useState('');
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const templates = [
    { title: 'Transfer Certificate', topic: 'Application for Transfer Certificate', details: 'Leaving school/college for further studies.' },
    { title: 'Sick Leave', topic: 'Sick Leave Application', details: 'Fever for two days, need rest.' },
    { title: 'Bank Change', topic: 'Request to Change Mobile Number in Bank', details: 'Old number lost, want to link new number.' },
    { title: 'Aadhar Correction', topic: 'Application for Aadhar Data Correction', details: 'Name spelling correction required as per birth certificate.' },
    { title: 'Character Cert', topic: 'Request for Character Certificate', details: 'Required for job application/higher education admission.' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setLetter('');
    try {
      const result = await generateFormalLetter(topic, details, userProfile);
      setLetter(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Letter Writer</h1>
        <p className="text-xs text-gray-500 font-medium">Professional letters generate karein ek click mein.</p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Templates</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {templates.map((t, i) => (
              <button
                key={i}
                onClick={() => { setTopic(t.topic); setDetails(t.details); }}
                className={cn(
                  "px-4 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all",
                  topic === t.topic ? "bg-[#008069] text-white border-[#008069]" : "bg-white text-gray-600 border-gray-100 hover:border-[#008069]/30"
                )}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Subject / Topic</label>
            <input 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Application for TC"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-[#008069]"
              id="letter-topic-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Details (Kyun likh rahe hain?)</label>
            <textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Leaving school because family is moving to another city."
              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-[#008069] min-h-[100px] resize-none"
              id="letter-details-input"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full bg-[#008069] text-white py-4 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-green-100 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                Mitra Writing...
              </>
            ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Generate Draft
                </>
            )}
          </button>
        </div>

        {letter && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#008069]/10" />
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#008069]" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Formal Draft</h4>
              </div>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all border border-gray-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[9px] font-black">{copied ? 'COPIED!' : 'COPY'}</span>
              </button>
            </div>
            <div className="whitespace-pre-wrap font-serif text-gray-800 text-xs leading-relaxed border-l-2 border-gray-50 pl-4 py-2">
              {letter}
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[9px] text-gray-400 font-bold uppercase italic">Generated by Mitra AI</p>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-[#008069] transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const TrackerScreen = ({ userId, onNavigate }: { userId: string; onNavigate: (v: string) => void }) => {
  const [applications, setApplications] = useState<TrackerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newApp, setNewApp] = useState({ schemeName: '', applicationId: '', status: 'Submitted' as any, notes: '' });

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/applications`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TrackerApplication[];
      setApplications(apps.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/applications`);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleAdd = async () => {
    if (!newApp.schemeName || !newApp.applicationId) return;
    const path = `users/${userId}/applications`;
    try {
      await addDoc(collection(db, path), {
        ...newApp,
        updatedAt: Date.now()
      });
      setNewApp({ schemeName: '', applicationId: '', status: 'Submitted', notes: '' });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const path = `users/${userId}/applications/${id}`;
    try {
      await updateDoc(doc(db, path), {
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tracker?")) return;
    const path = `users/${userId}/applications/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const statusColors = {
    'Submitted': 'bg-blue-50 text-blue-600 border-blue-100',
    'Under Review': 'bg-orange-50 text-orange-600 border-orange-100',
    'Approved': 'bg-green-50 text-green-600 border-green-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">App Tracker</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">My Applications</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
            isAdding ? "bg-gray-100 text-gray-400" : "bg-[#008069] text-white shadow-green-100"
          )}
        >
          {isAdding ? <X className="w-6 h-6" /> : <Edit2 className="w-5 h-5" />}
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008069] ml-1">Scheme Name</label>
                <input 
                  value={newApp.schemeName}
                  onChange={e => setNewApp({...newApp, schemeName: e.target.value})}
                  placeholder="e.g. PM Kisan Nidhi"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#008069]/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008069] ml-1">Application / Ref ID</label>
                <input 
                  value={newApp.applicationId}
                  onChange={e => setNewApp({...newApp, applicationId: e.target.value})}
                  placeholder="e.g. MH/2024/12345"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#008069]/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008069] ml-1">Current Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Submitted', 'Under Review', 'Approved', 'Rejected'].map(s => (
                    <button
                      key={s}
                      onClick={() => setNewApp({...newApp, status: s})}
                      className={cn(
                        "p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        newApp.status === s 
                          ? "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100" 
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleAdd}
                disabled={!newApp.schemeName || !newApp.applicationId}
                className="bg-[#008069] text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-green-100 mt-2 active:scale-95 transition-all disabled:opacity-50"
              >
                Track Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-gray-100 border-t-[#008069] rounded-full animate-spin" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Aapka data aa raha hai...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-200 shadow-sm border border-gray-100">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <div className="px-10">
              <h3 className="font-bold text-gray-900">Koi Tracking Nahi</h3>
              <p className="text-xs text-gray-400 mt-1">Apni scheme applications yahan add karein aur unka status track karein.</p>
            </div>
          </div>
        ) : (
          applications.map(app => (
            <motion.div 
              layout
              key={app.id} 
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 group relative"
            >
              <button 
                onClick={() => handleDelete(app.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-300 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#008069] font-black border border-gray-100 shrink-0">
                  {app.schemeName[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base leading-tight pr-8">{app.schemeName}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ID: {app.applicationId}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-1">Status Badlein</p>
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-1 px-1">
                  {Object.keys(statusColors).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(app.id, s)}
                      className={cn(
                        "whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-bold transition-all border",
                        app.status === s 
                          ? statusColors[s as keyof typeof statusColors] 
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5 opacity-40">
                  <Globe className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Digital Mitra Track</span>
                </div>
                <span className="text-[9px] text-gray-400 font-bold italic">
                  Last Update: {new Date(app.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const SettingsScreen = ({ user, profile, onUpdateProfile, savedSchemeIds, onToggleSave, onNavigate, onNavigateToScheme }: { 
  user: User | null; 
  profile: UserProfile; 
  onUpdateProfile: (p: UserProfile) => void;
  savedSchemeIds: string[];
  onToggleSave: (id: string) => void;
  onNavigate: (tab: string) => void;
  onNavigateToScheme: (id: string) => void;
}) => {

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const savedSchemes = SCHEMES.filter(s => savedSchemeIds.includes(s.id));

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Account & Settings</h1>
        <p className="text-sm text-gray-500">App settings aur saved data badlein.</p>
      </header>
      
      {/* Saved Schemes Section */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Saved Yojnaein ({savedSchemes.length})</h3>
        {savedSchemes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {savedSchemes.map(s => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold border border-orange-100">
                    {s.name[0]}
                  </div>
                  <div onClick={() => onNavigateToScheme(s.id)} className="cursor-pointer">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-gray-900 text-[13px] leading-tight">{s.hindiName}</p>
                      {s.aiVersion && (
                        <div className="flex items-center gap-1">
                          <Cpu className="w-2 h-2 text-slate-400" />
                          <span className="text-[7px] font-bold text-slate-400 uppercase">{s.aiVersion}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{s.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onToggleSave(s.id)}
                  className="p-2 text-red-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
            <Bookmark className="w-6 h-6 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-bold">Abhi koi scheme save nahi hai.</p>
            <button 
              onClick={() => onNavigate('schemes')}
              className="text-[#008069] text-[10px] font-black uppercase tracking-widest mt-2 underline"
            >
              Browse Schemes
            </button>
          </div>
        )}
      </section>

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

const ProfileSetupScreen = ({ onComplete }: { onComplete: (profile: UserProfile) => void }) => {
  const [step, setStep] = useState(1);
  const [selectedState, setSelectedState] = useState('');
  const [selectedLang, setSelectedLang] = useState<'hi' | 'hinglish' | 'en'>('hi');

  const languages = [
    { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { id: 'hinglish', label: 'Hinglish', native: 'Hindi + English' },
    { id: 'en', label: 'English', native: 'English' },
  ];

  const handleFinish = () => {
    if (!selectedState) return;
    onComplete({
      state: selectedState,
      preferredLanguage: selectedLang,
      isPremium: false
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 justify-center">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-2">
                <Globe className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Apna Rajya Chunein</h1>
              <p className="text-gray-500 font-medium leading-relaxed">Personalized schemes ke liye humein batayein aap kis state se hain.</p>
            </div>

            <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide border-y border-gray-50 py-4">
              {STATES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedState(s)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all flex items-center justify-between",
                    selectedState === s 
                      ? "border-[#008069] bg-green-50/50 text-[#008069]" 
                      : "border-gray-100 bg-white text-gray-600 hover:border-[#008069]/30"
                  )}
                >
                  <span className="font-bold">{s}</span>
                  {selectedState === s && <CheckCircle className="w-5 h-5" />}
                </button>
              ))}
            </div>

            <button
              disabled={!selectedState}
              onClick={() => setStep(2)}
              className="mt-4 bg-[#008069] text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-green-100 disabled:opacity-50 active:scale-95 transition-all"
            >
              Agla Kadam
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                <Languages className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Preferred Language</h1>
              <p className="text-gray-500 font-medium leading-relaxed">Aap Mitra AI se kis bhasha mein baat karna chahenge?</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {languages.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLang(l.id as any)}
                  className={cn(
                    "p-6 rounded-3xl border text-left transition-all flex flex-col gap-1",
                    selectedLang === l.id 
                      ? "border-[#008069] bg-green-50/50" 
                      : "border-gray-100 bg-white hover:border-[#008069]/30"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-gray-900 uppercase tracking-widest text-[10px]">{l.label}</span>
                    {selectedLang === l.id && <CheckCircle className="w-4 h-4 text-[#008069]" />}
                  </div>
                  <span className="text-xl font-bold">{l.native}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleFinish}
                className="bg-[#008069] text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
              >
                Shuru Karein
              </button>
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 font-black uppercase tracking-widest text-[10px] py-2"
              >
                Piche Jayein
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [targetSchemeId, setTargetSchemeId] = useState<string | null>(null);
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);

  const startChatWithScheme = (schemeName: string) => {
    setChatContext(`Mujhe ${schemeName} scheme ki poori jaankari chahiye. Iske latest updates, benefits aur kaise apply karna hai woh batayein. Google search karke sahi details dein.`);
    setActiveTab('chat');
  };

  useEffect(() => {
    // Clear context when activeTab is not chat, but we need to be careful not to clear it too early
    // Actually, we should probably clear it in ChatScreen after consume
  }, [activeTab]);

  useEffect(() => {
    (window as any).startLiveCall = () => setIsLiveCallOpen(true);
  }, []);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    preferredLanguage: 'hi',
    isPremium: false,
    state: undefined
  });

  const toggleSaveScheme = (id: string) => {
    setSavedSchemeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Load profile from Firestore
        const path = `users/${u.uid}`;
        try {
          const profileDoc = await getDoc(doc(db, 'users', u.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            // Need setup, we keep the default which will trigger setup screen if missing state
            setProfile(prev => ({ ...prev, name: u.displayName || undefined }));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, path);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveProfile = async (newProfile: UserProfile) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...newProfile,
        name: user.displayName || newProfile.name || '',
        email: user.email || ''
      });
      setProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

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

  // Profile setup check
  if (!profile.state) {
    return <ProfileSetupScreen onComplete={saveProfile} />;
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
              {activeTab === 'schemes' && (
                <SchemesScreen 
                  userProfile={profile} 
                  onAskMitra={startChatWithScheme} 
                  savedSchemeIds={savedSchemeIds}
                  onToggleSave={toggleSaveScheme}
                  onNavigate={setActiveTab}
                  initialExpandedId={targetSchemeId}
                  onClearInitialExpandedId={() => setTargetSchemeId(null)}
                />
              )}
              {activeTab === 'tracker' && <TrackerScreen userId={user.uid} onNavigate={setActiveTab} />}
              {activeTab === 'letters' && <LetterScreen userProfile={profile} />}
              {activeTab === 'chat' && (
                <ChatScreen 
                  initialMessage={chatContext} 
                  onMessageConsumed={() => setChatContext(undefined)}
                  userProfile={profile}
                />
              )}
              {activeTab === 'guide' && <GuideScreen onNavigate={setActiveTab} />}
              {activeTab === 'settings' && (
                <SettingsScreen 
                  user={user} 
                  profile={profile} 
                  onUpdateProfile={saveProfile} 
                  savedSchemeIds={savedSchemeIds}
                  onToggleSave={toggleSaveScheme}
                  onNavigate={setActiveTab}
                  onNavigateToScheme={(id) => {
                    setTargetSchemeId(id);
                    setActiveTab('schemes');
                  }}
                />
              )}
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
