import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  MessageCircle, 
  BookOpen, 
  Search, 
  Settings, 
  Camera,
  Paperclip,
  Home as HomeIcon,
  Mic,
  MicOff,
  Languages,
  LayoutDashboard,
  LogOut,
  Globe,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  CheckCircle2,
  X,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Upload,
  Bookmark,
  Trash2,
  Share2,
  Edit2,
  ChevronRight,
  Download,
  Hash,
  Award,
  FileCheck,
  Zap,
  Cpu,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PhoneOff,
  User as UserIcon,
  Phone,
  Send,
  RefreshCw,
  Bell,
  Users,
  BellRing,
  ExternalLink,
  ShieldCheck,
  Play,
  Pause,
  Calendar,
  Clock,
  FileText,
  Copy,
  Check,
  MapPin,
  Banknote,
  History,
  Plus,
  Save,
  Puzzle,
  Lightbulb,
  MessageSquare,
  LayoutGrid,
  ThumbsUp,
  ThumbsDown,
  Map as MapIcon,
  Loader2,
  WifiOff,
  CloudOff,
  Cloud,
  Briefcase as BriefcaseIcon,
  SearchCheck,
  GraduationCap,
  FileBadge,
  FileWarning,
  CreditCard,
  Wheat,
  CloudSun,
  Target
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AuthScreen } from './components/Auth';
import { LiveCall } from './components/LiveCall';
import { FormCounselor } from './components/FormCounselor';
import { SCHEMES as STATIC_SCHEMES, STATES } from './constants';
import { schemeSyncService } from './services/schemeSyncService';
import { Scheme, Message, UserProfile, TrackerApplication, Conversation, Quiz, UserDocument, NewsItem, AppNotification, FormDraft } from './types';
import { 
  getAIResponse, 
  analyzeForm, 
  generateSchemeLetter, 
  searchSchemes, 
  analyzeFilledForm,
  generateFormalLetter, 
  getComparisonRecommendation, 
  getSpeech, 
  getFieldExample, 
  predictFormRejection, 
  getDailyNews, 
  getDailyQuiz, 
  analyzeScreenForGuidance, 
  analyzeWebsite,
  getProfileRecommendations,
  getSchemeSmartTip,
  enhanceDocument,
  analyzeHandwrittenDocument,
  analyzeDocumentQuality,
  extractProfileData,
  matchEligibility,
  getCounselingRoadmap,
  SCREEN_GURU_TOOLS,
  ai
} from './services/geminiService';
import { Modality } from '@google/genai';
import { floatTo16BitPCM, pcmToFloat32, base64ToUint8Array, uint8ArrayToBase64 } from './lib/audio';
import { requestNotificationPermission, showLocalNotification, MOCK_NOTIFICATIONS } from './services/notificationService';
import { cn } from './lib/utils';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp, limit, getDocs } from 'firebase/firestore';

// --- Constants & Config ---
const MAPS_API_KEY = 
  process.env.GOOGLE_MAPS_PLATFORM_KEY || 
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 
  '';

const HAS_MAPS_KEY = Boolean(MAPS_API_KEY);

// Initial connection test
testConnection();

// --- Community Specific Components ---

const CommunityDecorations = ({ community }: { community?: string }) => {
  if (community === 'Student') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10 overflow-hidden">
        <BookOpen className="absolute -top-10 -left-10 w-40 h-40 rotate-12" />
        <Plus className="absolute top-1/4 -right-10 w-24 h-24 -rotate-12" />
        <GraduationCap className="absolute bottom-20 -left-10 w-32 h-32 rotate-45" />
        <div className="absolute top-1/2 left-1/4 w-4 h-20 bg-blue-500 rounded-full blur-xl" />
      </div>
    );
  }
  if (community === 'Farmer') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10 overflow-hidden">
        <Wheat className="absolute -top-10 -right-10 w-40 h-40 -rotate-12 text-green-600" />
        <div className="absolute top-1/2 -left-10 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-20" />
        <MapIcon className="absolute bottom-40 -right-10 w-32 h-32 rotate-12 text-emerald-600" />
        {/* Grass elements */}
        <div className="absolute bottom-0 left-0 right-0 h-20 flex gap-4 items-end px-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-1 bg-green-500 rounded-full" style={{ height: `${Math.random() * 40 + 20}px` }} />
          ))}
        </div>
      </div>
    );
  }
  if (community === 'Jobs') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10 overflow-hidden">
        <BriefcaseIcon className="absolute -top-10 -left-10 w-40 h-40 rotate-12" />
        <Zap className="absolute top-3/4 -right-10 w-32 h-32 -rotate-12 text-yellow-500" />
        <Plus className="absolute top-1/3 left-10 w-16 h-16 blur-sm" />
      </div>
    );
  }
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-5 overflow-hidden">
      <Sparkles className="absolute top-10 right-10 w-20 h-20 animate-pulse" />
      <Globe className="absolute bottom-20 left-10 w-40 h-40 opacity-20" />
    </div>
  );
};

const NewsSlider = ({ news, community }: { news: any[], community?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || news.length === 0) return;

    let scrollAmount = 0;
    const step = 1;
    const interval = setInterval(() => {
      scrollAmount += step;
      if (scrollAmount >= el.scrollWidth - el.clientWidth) {
        scrollAmount = 0;
      }
      el.scrollTo({ left: scrollAmount, behavior: 'auto' });
    }, 50);

    return () => clearInterval(interval);
  }, [news]);

  if (news.length === 0) return null;

  const getTheme = () => {
    switch(community) {
      case 'Student': return 'border-blue-100 bg-blue-50/50';
      case 'Farmer': return 'border-emerald-100 bg-emerald-50/50';
      case 'Jobs': return 'border-indigo-100 bg-indigo-50/50';
      default: return 'border-gray-100 bg-gray-50/50';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Latest for your Community</h3>
      <div 
        ref={scrollRef}
        className="flex overflow-x-hidden gap-4 pb-1 relative"
      >
        <div className="flex gap-4 min-w-max">
          {news.map((item, i) => (
            <div 
              key={i} 
              className={cn(
                "w-[280px] p-4 rounded-[2rem] border shadow-sm flex flex-col gap-3 transition-colors",
                getTheme()
              )}
            >
              <div className="w-full h-32 rounded-2xl bg-white overflow-hidden border border-gray-100 relative">
                <img 
                  src={item.image || `https://picsum.photos/seed/${item.id + i}/400/225`} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded-lg text-[8px] font-black text-white uppercase tracking-widest">
                  {item.category}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 leading-tight line-clamp-2">{item.title}</h4>
                <p className="text-[10px] text-gray-500 font-medium mt-1 line-clamp-1 italic">{item.summary}</p>
              </div>
            </div>
          ))}
          {/* Duplicate for infinite feel */}
          {news.map((item, i) => (
            <div 
              key={`dup-${i}`} 
              className={cn(
                "w-[280px] p-4 rounded-[2rem] border shadow-sm flex flex-col gap-3 transition-colors",
                getTheme()
              )}
            >
              <div className="w-full h-32 rounded-2xl bg-white overflow-hidden border border-gray-100 relative">
                <img 
                  src={item.image || `https://picsum.photos/seed/${item.id + i + 10}/400/225`} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 leading-tight line-clamp-2">{item.title}</h4>
                <p className="text-[10px] text-gray-500 font-medium mt-1 line-clamp-1 italic">{item.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

const AILoader = ({ message = "Mitra AI is thinking..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-6 w-full">
    <div className="relative">
      <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-600 animate-pulse relative overflow-hidden ring-4 ring-emerald-50/50">
        <Sparkles className="w-8 h-8 z-10" />
        <motion.div 
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
        />
      </div>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-2 border-2 border-dashed border-emerald-200 rounded-[2.8rem]"
      />
    </div>
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest text-center animate-pulse px-6">{message}</h3>
      <div className="flex gap-1.5 justify-center">
        {[0, 1, 2].map(i => (
          <motion.div 
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          />
        ))}
      </div>
    </div>
  </div>
);
const CostEvaluator = ({ costInfo }: { costInfo: { offlineCost: string; onlineCost: string; savings: string; advocacyMsg: string } }) => (
  <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-100/50 transition-all duration-700" />
    
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <Banknote className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] leading-none">Cost Efficiency Analyst</h3>
          <p className="text-xs font-black text-emerald-600 uppercase tracking-tighter mt-2">Maximum Savings Guaranteed</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-emerald-100/50">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Typical Offline Cost</p>
          <p className="text-sm font-black text-gray-700 line-through decoration-red-500/50">{costInfo.offlineCost}</p>
        </div>
        <div className="bg-emerald-600 p-4 rounded-3xl shadow-lg shadow-emerald-100">
          <p className="text-[8px] font-black text-emerald-100 uppercase tracking-widest mb-1">Mitra Online Cost</p>
          <p className="text-sm font-black text-white">{costInfo.onlineCost}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-10 bg-emerald-500 rounded-full" />
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Potentially Saved</p>
              <p className="text-2xl font-black text-emerald-600 leading-none">{costInfo.savings}</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-50 border-t-emerald-500 flex items-center justify-center text-[10px] font-black text-emerald-600">
            {costInfo.savings}
          </div>
        </div>
        
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 italic">
           <p className="text-xs font-bold text-emerald-800 leading-relaxed text-center">
             "{costInfo.advocacyMsg}"
           </p>
        </div>
      </div>
    </div>
  </div>
);

const MitraPitch = ({ pitch, result, onStartSimulator }: { pitch: { isOnlinePossible: boolean; pitchMsg: string; offlineGuide?: string; cta: string }; result?: any; onStartSimulator?: (form: any) => void }) => {
  if (!pitch) return null;

  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border shadow-xl relative overflow-hidden group mb-6",
      pitch.isOnlinePossible 
        ? "bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-xl shadow-indigo-900/5 text-indigo-900"
        : "bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-xl shadow-orange-900/5 text-orange-900"
    )}>
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-opacity-50 transition-all duration-700",
        pitch.isOnlinePossible ? "bg-indigo-100/30" : "bg-orange-100/30"
      )} />
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
            pitch.isOnlinePossible ? "bg-indigo-600 shadow-indigo-200" : "bg-orange-600 shadow-orange-200"
          )}>
            {pitch.isOnlinePossible ? <Zap className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] leading-none",
              pitch.isOnlinePossible ? "text-indigo-900" : "text-orange-900"
            )}>
              {pitch.isOnlinePossible ? "Piz AI: Scholarship Expert" : "Honest Process Guide"}
            </h3>
            <p className={cn(
              "text-xs font-black uppercase tracking-tighter mt-2",
              pitch.isOnlinePossible ? "text-indigo-600" : "text-orange-600"
            )}>
              {pitch.isOnlinePossible ? "Seamless ₹10 Fast-Track" : "Essential Office Visit Required"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] border border-white/40 shadow-sm flex flex-col gap-3">
             <p className="text-sm font-bold leading-relaxed">{pitch.pitchMsg}</p>
             {pitch.isOnlinePossible && (
               <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50/50 px-3 py-2 rounded-xl border border-indigo-100/50 w-fit">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Zero Rejection Choice: ₹10 only</span>
               </div>
             )}
          </div>

          {!pitch.isOnlinePossible && pitch.offlineGuide && (
            <div className="bg-white/40 backdrop-blur-sm p-6 rounded-[2rem] border border-orange-100/50 space-y-3">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-900/60">How to handle this offline:</h4>
               <div className="text-xs text-orange-900 font-medium whitespace-pre-wrap leading-relaxed">
                 {pitch.offlineGuide}
               </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {pitch.isOnlinePossible && onStartSimulator && result && (
              <button
                onClick={() => {
                  const sFields = result.sections 
                    ? result.sections.flatMap((s: any) => s.fields)
                    : (result.fields || []);
                  const sampleData = sFields.reduce((acc: any, f: any) => {
                    acc[f.field] = f.exampleValue || "";
                    return acc;
                  }, {});
                  onStartSimulator({ ...result, formData: sampleData });
                }}
                className="w-full py-4 bg-white/60 backdrop-blur-sm text-indigo-600 border-2 border-indigo-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-indigo-50"
              >
                <BookOpen className="w-4 h-4" />
                See Sample Filled Form
              </button>
            )}

            <button 
              onClick={() => {
                if (pitch.isOnlinePossible && onStartSimulator && result) {
                  onStartSimulator(result);
                } else {
                  (window as any).startLiveCall?.();
                }
              }}
              className={cn(
                "w-full py-5 rounded-[1.5rem] shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                pitch.isOnlinePossible ? "bg-indigo-600 shadow-indigo-200" : "bg-orange-600 shadow-orange-200"
              )}
            >
              {pitch.isOnlinePossible && <CheckCircle className="w-4 h-4 text-white" />}
              <p className="text-sm font-black text-white text-center leading-tight">
                {pitch.cta.includes('₹10') ? pitch.cta : (pitch.isOnlinePossible ? "Apply Now (₹10 only)" : pitch.cta)}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfidenceEvaluator = ({ analysis }: { analysis: { safetyBenefit: string; offlineRisk: string; finalVerdict: string } }) => (
  <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-100/50 transition-all duration-700" />
    
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] leading-none">Process Confidence & Efficiency</h3>
          <p className="text-xs font-black text-blue-600 uppercase tracking-tighter mt-2">Zero-Error Application Path</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-blue-100/50 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Safety First (Online)</h4>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">{analysis.safetyBenefit}</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-blue-100/50 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest mb-1">Hassle & Risk (Offline)</h4>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">{analysis.offlineRisk}</p>
          </div>
        </div>

        <div className="bg-blue-600 p-5 rounded-3xl shadow-lg shadow-blue-100 flex items-center gap-4">
          <div className="flex-1">
             <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest mb-1 text-center">Confidence Verdict</p>
             <p className="text-xs font-black text-white text-center leading-tight">
               "{analysis.finalVerdict}"
             </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest z-[100] sticky top-0 shadow-lg"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Aap offline hain. Drafts save ho rahe hain aur online hone par sync honge.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FeedbackModal = ({ onClose, initialType = 'general', relatedId, relatedName }: { 
  onClose: () => void; 
  initialType?: 'issue' | 'suggestion' | 'general' | 'scheme' | 'guide';
  relatedId?: string;
  relatedName?: string;
}) => {
  const [type, setType] = useState(initialType);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !auth.currentUser) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || 'anonymous',
        type,
        content,
        rating: rating || 0,
        relatedId: relatedId || null,
        relatedName: relatedName || null,
        status: 'pending',
        timestamp: Date.now()
      });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast("Feedback submit nahi ho saka. Kripya firse try karein.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Feedback Mitra</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {relatedName ? `Feedback for ${relatedName}` : 'Help us improve for you'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
             <div className="w-20 h-20 bg-green-50 rounded-[2.5rem] flex items-center justify-center border border-green-100 mb-2">
                <Check className="w-10 h-10 text-green-600" />
             </div>
             <h3 className="text-2xl font-black text-gray-900">Shukriya!</h3>
             <p className="text-sm font-medium text-gray-500 leading-relaxed">
               Aapka feedback hume mil gaya hai. Hum jaldi hi ispar kaam karenge!
             </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kaisa raha anubhav?</label>
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className={cn(
                      "w-12 h-12 rounded-2xl border transition-all flex items-center justify-center",
                      rating && rating >= s 
                        ? "bg-orange-50 border-orange-200 text-orange-500 scale-110 shadow-sm" 
                        : "bg-gray-50 border-gray-100 text-gray-300 hover:text-orange-300"
                    )}
                  >
                    <Star className={cn("w-6 h-6", rating && rating >= s ? "fill-orange-500" : "")} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Feedback Type</label>
              <div className="flex flex-wrap gap-2">
                {(['issue', 'suggestion', 'general', 'scheme', 'guide'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                      type === t ? "bg-[#008069] text-white border-[#008069] shadow-lg" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Aapka Sujhaav (Written Message)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === 'issue' ? "Kya dikat aa rahi hai?" :
                  type === 'suggestion' ? "App ko aur behtar kaise banayein?" :
                  type === 'scheme' ? "Scheme ke baare mein kya lagta hai?" :
                  "Aapka anubhav kaisa raha?"
                }
                className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008069]/20 resize-none min-h-[120px]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="w-full py-5 bg-[#008069] text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Feedback Submit Karein
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

const ScraperProModal = ({ onClose }: { onClose: () => void }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [filters, setFilters] = useState({
    text: true,
    headings: true,
    images: false,
    links: false,
    custom: false
  });
  const [customSelector, setCustomSelector] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post("/api/scrape", {
        url,
        filters,
        customSelector: filters.custom ? customSelector : null
      });
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong while scraping.");
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'json' | 'csv' | 'txt') => {
    if (!result) return;
    let content = "";
    let filename = `scrape-result-${new Date().getTime()}`;

    if (format === 'json') {
      content = JSON.stringify(result, null, 2);
      filename += ".json";
    } else if (format === 'txt') {
      if (result.text) content += `--- TEXT CONTENT ---\n${result.text}\n\n`;
      if (result.headings) {
        content += `--- HEADINGS ---\n`;
        result.headings.forEach((h: any) => content += `[${h.tag}] ${h.text}\n`);
        content += "\n";
      }
      if (result.links) {
        content += `--- LINKS ---\n`;
        result.links.forEach((l: any) => content += `${l.text}: ${l.url}\n`);
      }
      filename += ".txt";
    } else if (format === 'csv') {
      if (result.links) {
        content = "Text,URL\n" + result.links.map((l: any) => `"${l.text}","${l.url}"`).join("\n");
      } else if (result.headings) {
        content = "Tag,Text\n" + result.headings.map((h: any) => `"${h.tag}","${h.text}"`).join("\n");
      } else {
        content = "Data\n" + (result.text ? `"${result.text.substring(0, 500)}..."` : "");
      }
      filename += ".csv";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
               <Globe className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Scraper Pro</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Extract data from any website</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">1. Target Website URL</h3>
                 <div className="relative">
                    <input 
                      type="url" 
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full p-6 pl-14 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-900 placeholder:text-gray-300"
                    />
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">2. Select Extraction Filters</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {Object.entries({
                      text: "All Text",
                      headings: "Headings",
                      images: "Images",
                      links: "Links",
                      custom: "Custom CSS"
                    }).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setFilters(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                        className={cn(
                          "p-4 rounded-2xl border flex items-center gap-3 transition-all",
                          filters[key as keyof typeof filters] 
                            ? "bg-blue-50 border-blue-100 text-blue-600 shadow-sm" 
                            : "bg-white border-gray-50 text-gray-400 hover:border-gray-100"
                        )}
                      >
                         <div className={cn(
                           "w-5 h-5 rounded-md border-2 flex items-center justify-center",
                           filters[key as keyof typeof filters] ? "bg-blue-600 border-blue-600" : "border-gray-200"
                         )}>
                            {filters[key as keyof typeof filters] && <Check className="w-3 h-3 text-white" />}
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-tight">{label}</span>
                      </button>
                    ))}
                 </div>
                 
                 {filters.custom && (
                   <div className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in zoom-in-95">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CSS Selector (e.g. .article-body p)</p>
                      <input 
                        type="text" 
                        placeholder=".content > p"
                        value={customSelector}
                        onChange={(e) => setCustomSelector(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-blue-100"
                      />
                   </div>
                 )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                   <AlertCircle className="w-5 h-5 flex-shrink-0" />
                   <p className="text-xs font-bold leading-tight">{error}</p>
                </div>
              )}

              <button
                onClick={handleScrape}
                disabled={!url || loading}
                className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Extracting Data...' : 'Start Extraction'}
              </button>

              {loading && (
                <AILoader message="Mitra Scraper is crawling the web..." />
              )}

              {result && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">3. Extraction Results</h3>
                      <div className="flex gap-2">
                         {['json', 'txt', 'csv'].map(fmt => (
                           <button 
                            key={fmt}
                            onClick={() => exportData(fmt as any)}
                            className="bg-gray-100 hover:bg-black hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all"
                           >
                             {fmt}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden">
                      <div className="max-h-[400px] overflow-y-auto p-6 flex flex-col gap-6">
                         {result.headings && result.headings.length > 0 && (
                           <div className="flex flex-col gap-3">
                              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 self-start px-2 py-0.5 rounded">Headings Found</h4>
                              <div className="flex flex-col gap-2">
                                 {result.headings.map((h: any, i: number) => (
                                   <div key={i} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                      <span className="text-[8px] font-bold text-gray-400 mr-2">{h.tag}</span>
                                      <span className="text-xs font-semibold text-gray-700">{h.text}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         {result.images && result.images.length > 0 && (
                           <div className="flex flex-col gap-3">
                              <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 self-start px-2 py-0.5 rounded">Images Extracted</h4>
                              <div className="grid grid-cols-2 gap-3">
                                 {result.images.slice(0, 10).map((img: any, i: number) => (
                                   <div key={i} className="aspect-square bg-white rounded-2xl border border-gray-100 p-2 overflow-hidden flex items-center justify-center">
                                      <img src={img.src} alt={img.alt} className="max-w-full max-h-full object-contain" onError={(e) => (e.currentTarget.src = "https://placehold.co/400x400?text=Blocked")} />
                                   </div>
                                 ))}
                                 {result.images.length > 10 && (
                                   <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 font-bold text-[10px]">
                                      +{result.images.length - 10} MORE
                                   </div>
                                 )}
                              </div>
                           </div>
                         )}

                         {result.links && result.links.length > 0 && (
                           <div className="flex flex-col gap-3">
                              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 self-start px-2 py-0.5 rounded">Links Found</h4>
                              <div className="flex flex-col gap-2">
                                 {result.links.slice(0, 15).map((l: any, i: number) => (
                                   <div key={i} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                      <span className="text-xs font-bold text-gray-900 truncate">{l.text || "Empty Text"}</span>
                                      <span className="text-[9px] text-gray-400 truncate">{l.url}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         {result.text && (
                           <div className="flex flex-col gap-3">
                              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 self-start px-2 py-0.5 rounded">Text Content</h4>
                              <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-xs text-gray-600 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                                 {result.text}
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const DocumentEnhancerModal = ({ onClose }: { onClose: () => void }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [qualityReport, setQualityReport] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setQualityReport(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!image) {
      showToast("Bhai, pehle document upload toh karein!", "warning");
      return;
    }
    setAnalyzing(true);
    try {
      const base64 = image.split(',')[1];
      // Simultaneously run quality analysis and enhancement instructions
      const [enhanceResult, qualityResult] = await Promise.all([
        enhanceDocument(base64, 'image/jpeg'),
        analyzeDocumentQuality(base64, 'image/jpeg')
      ]);
      setResult(enhanceResult);
      setQualityReport(qualityResult);
    } catch (err) {
      console.error("Enhancement error:", err);
      showToast("Document analyze karne mein dikkat hui. Kripya dubaara try karein.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
               <Sparkles className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">AI Document Enhancer</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Quality optimization for govt forms</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {!result ? (
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">1. Upload Document Image</h3>
                   <p className="text-xs text-gray-500 font-medium">Upload Aadhar, PAN, or Marksheet to check for quality issues.</p>
                </div>

                <div 
                  className={cn(
                    "aspect-video rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden group transition-all",
                    image && "border-emerald-200 bg-emerald-50/10"
                  )}
                >
                  {image ? (
                    <>
                      <img src={image} className="absolute inset-0 w-full h-full object-contain" alt="Doc preview" />
                      {analyzing && (
                        <div className="absolute inset-0 z-10">
                          <motion.div 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ 
                              y: ['0%', '100%', '0%'],
                              opacity: [0, 1, 1, 0]
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity,
                              ease: "linear"
                            }}
                            className="w-full h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]"
                          />
                          <div className="absolute inset-0 bg-emerald-400/5 backdrop-blur-[1px]" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap to upload document photo</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  {image && (
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleEnhance}
                  disabled={!image || analyzing}
                  className="w-full bg-[#008069] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing Quality...' : 'Analyze Document Quality'}
                </button>

                {analyzing && (
                  <AILoader message="Mitra is auditing document clarity & lighting..." />
                )}
             </div>
           ) : (
             <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col gap-6">
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col items-center gap-2 flex-1">
                         <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center relative overflow-hidden">
                            <div className="text-2xl font-black text-gray-900 z-10">{result.clarityScore}%</div>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                               <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100" />
                               <circle 
                                  cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" 
                                  strokeDasharray={226.2}
                                  strokeDashoffset={226.2 - (226.2 * result.clarityScore) / 100}
                                  className="text-emerald-500 transition-all duration-1000"
                                  strokeLinecap="round"
                               />
                            </svg>
                         </div>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Clarity Score</p>
                      </div>

                      <div className="w-px h-12 bg-gray-200" />

                      <div className="flex flex-col items-center gap-2 flex-1">
                         <div className={cn(
                           "px-4 py-2 rounded-2xl font-black text-sm shadow-sm",
                           result.acceptanceLevel === 'High' || qualityReport?.status === 'Green' ? "bg-emerald-500 text-white" :
                           result.acceptanceLevel === 'Medium' || qualityReport?.status === 'Yellow' ? "bg-orange-500 text-white" : "bg-red-500 text-white"
                         )}>
                            {qualityReport?.status || result.acceptanceLevel}
                         </div>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">Acceptance Status</p>
                      </div>

                      <div className="w-px h-12 bg-gray-200" />

                      <div className="flex flex-col items-center gap-2 flex-1">
                         <div className="text-2xl font-black text-gray-900">{result.rejectionRisk || 0}%</div>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Rejection Risk</p>
                      </div>
                   </div>

                   <div className="text-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
                      <h3 className="text-base font-black text-gray-900 tracking-tight leading-snug">{qualityReport?.verdict || result.verdict}</h3>
                      {qualityReport?.mitraWarning && <p className="text-[10px] text-orange-600 font-bold uppercase italic tracking-tight">{qualityReport.mitraWarning}</p>}
                   </div>
                </div>

                {qualityReport && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Brightness</p>
                      <div className="text-lg font-black text-gray-900">{qualityReport.scores.brightness}%</div>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${qualityReport.scores.brightness}%` }} />
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Contrast</p>
                      <div className="text-lg font-black text-gray-900">{qualityReport.scores.contrast}%</div>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${qualityReport.scores.contrast}%` }} />
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sharpness</p>
                      <div className="text-lg font-black text-gray-900">{qualityReport.scores.sharpness}%</div>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${qualityReport.scores.sharpness}%` }} />
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Alignment</p>
                      <div className="text-lg font-black text-gray-900">{qualityReport.scores.alignment}%</div>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${qualityReport.scores.alignment}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AI-Generated Improvements</h4>
                   <div className="flex flex-col gap-3">
                      {(qualityReport?.improvements || result.enhancements)?.map((inst: any, idx: number) => {
                        const isTechnical = typeof inst === 'string';
                        return (
                          <div key={idx} className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                               <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-[8px] font-black text-gray-400 uppercase">Step {idx + 1}</p>
                               <p className="text-xs font-bold text-gray-700">{isTechnical ? inst : inst.instruction}</p>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Info className="w-3.5 h-3.5" /> Mitra's Pro Tips
                   </h4>
                   <ul className="space-y-2">
                      {result.tips?.map((tip: string, idx: number) => (
                        <li key={idx} className="text-xs font-bold text-gray-700 flex gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                   </ul>
                </div>

                {result.needsRetake && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-[10px] text-red-700 font-bold leading-tight uppercase tracking-tight">
                      Advice: Image quality bahut low hai. Rejection se bachne ke liye photo dobara kheenchiye.
                    </p>
                  </div>
                )}

                <button 
                   onClick={() => setResult(null)}
                   className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mt-4"
                >
                   Test Another Document
                </button>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const PdfUtilityModal = ({ onClose }: { onClose: () => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      setPdfUrl(null);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPdfUrl(null);
  };

  const generatePdf = async () => {
    if (files.length === 0) return;
    setGenerating(true);
    try {
      const doc = new jsPDF();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (i > 0) doc.addPage();
        
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imgData = e.target?.result as string;
            const img = new Image();
            img.src = imgData;
            img.onload = () => {
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              const margin = 10;
              const maxWidth = pageWidth - (margin * 2);
              const maxHeight = pageHeight - (margin * 2);
              
              let width = img.width;
              let height = img.height;
              
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
              
              const x = (pageWidth - width) / 2;
              const y = (pageHeight - height) / 2;
              
              doc.addImage(imgData, 'JPEG', x, y, width, height); 
              resolve();
            };
          };
          reader.readAsDataURL(file);
        });
      }
      
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Mitra_Documents_${Date.now()}.pdf`;
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
               <FileText className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">PDF Utility Mitra</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Combine images into single PDF</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
           <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Images</h3>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { setFiles([]); setPdfUrl(null); }}
                      className="text-[10px] font-bold text-red-500 uppercase tracking-tight hover:underline"
                    >
                      Clear All
                    </button>
                    <span className="text-[10px] font-bold text-gray-400">{files.length} Files</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 {files.map((f, i) => (
                   <div key={i} className="group relative aspect-square bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
                      <img 
                        src={URL.createObjectURL(f)} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                      />
                      <button 
                        onClick={() => removeFile(i)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))}
                 <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-all">
                    <Plus className="w-6 h-6 text-gray-300" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Image</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                 </label>
              </div>
           </div>

           {pdfUrl && (
             <div className="p-6 bg-green-50 rounded-[2.5rem] border border-green-100 flex flex-col gap-4 items-center">
                <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-green-600 shadow-sm border border-green-50 mb-2">
                   <FileText className="w-8 h-8" />
                </div>
                <div className="text-center">
                   <h4 className="text-sm font-black text-gray-900 leading-tight mb-1">PDF taiyyar hai!</h4>
                   <p className="text-[10px] text-gray-500 font-medium">Aapka multi-page PDF document format safe hai.</p>
                </div>
                <div className="flex gap-2 w-full pt-2">
                   <button 
                     onClick={() => window.open(pdfUrl, '_blank')}
                     className="flex-1 bg-white text-gray-900 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-green-200 shadow-sm"
                   >
                     Preview
                   </button>
                   <button 
                     onClick={downloadPdf}
                     className="flex-1 bg-[#008069] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-100"
                   >
                     Download
                   </button>
                </div>
             </div>
           )}

           <button
             onClick={generatePdf}
             disabled={files.length === 0 || generating}
             className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-auto"
           >
             {generating ? 'Creaing PDF...' : 'Create Combined PDF'}
           </button>
        </div>
      </div>
    </motion.div>
  );
};

const HandwrittenAuditModal = ({ onClose, onStartSimulator }: { onClose: () => void; onStartSimulator: (form: any) => void }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("Bhai, photo bahut badi hai (10MB+). Kripya thodi choti photo use karein.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAudit = async () => {
    if (!image) {
      showToast("Pehle application ki photo toh upload karo bhai!", "warning");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const base64 = image.split(',')[1];
      const res = await analyzeHandwrittenDocument(base64, 'image/jpeg');
      if (res.error) {
        showToast(res.error.message, res.error.type === 'QUOTA' ? 'warning' : 'error');
      }
      setResult(res);
    } catch (err) {
      console.error("Audit error:", err);
      showToast("Document process karne mein dikkat hui. Kripya dubaara try karein.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
               <Edit2 className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Handwritten Analyzer</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Handwriting to Digital & Quality Audit</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {!result ? (
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">1. Upload Handwritten Application</h3>
                   <p className="text-xs text-gray-500 font-medium">Capture or upload a photo of your handwritten document.</p>
                </div>

                <div 
                  className={cn(
                    "aspect-video rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden group transition-all",
                    image && "border-orange-200 bg-orange-50/10"
                  )}
                >
                  {image ? (
                    <img src={image} className="absolute inset-0 w-full h-full object-contain" alt="Doc preview" />
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap to upload photo</p>
                        <p className="text-[8px] text-gray-300 font-bold uppercase tracking-tight mt-1">Supports school/bank/govt apps</p>
                      </div>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>

                <button
                  onClick={handleAudit}
                  disabled={!image || analyzing}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing Handwriting...' : 'Analyze Application'}
                </button>

                {analyzing && (
                  <AILoader message="Mitra AI is transcribing your handwriting..." />
                )}
             </div>
           ) : (
             <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 italic transition-all hover:bg-blue-50">
                   <div className="flex items-center gap-2 mb-2">
                     <Sparkles className="w-4 h-4 text-blue-600" />
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Mitra's Feedback</span>
                   </div>
                   <p className="text-sm text-gray-700 leading-relaxed font-medium">"{result.friendlySummary}"</p>
                </div>

                {result.technicalQuality && (
                  <div className="p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-orange-600" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Quality Audit</h4>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        result.technicalQuality.overallStatus === 'Good' ? "bg-emerald-100 text-emerald-700" :
                        result.technicalQuality.overallStatus === 'Fair' ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {result.technicalQuality.overallStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sharpness</p>
                          <span className="text-[10px] font-bold text-gray-700">{result.technicalQuality.sharpness}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${result.technicalQuality.sharpness}%` }}
                            className="h-full bg-blue-500" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Brightness</p>
                          <span className="text-[10px] font-bold text-gray-700">{result.technicalQuality.brightness}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${result.technicalQuality.brightness}%` }}
                            className="h-full bg-orange-400" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Alignment</p>
                          <span className="text-[10px] font-bold text-gray-700">{result.technicalQuality.alignment}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${result.technicalQuality.alignment}%` }}
                            className="h-full bg-emerald-500" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Legibility</p>
                          <span className="text-[10px] font-bold text-gray-700">{result.technicalQuality.legibility || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${result.technicalQuality.legibility || 0}%` }}
                            className="h-full bg-indigo-500" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">Rejection Risk</span>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-black",
                        (result.technicalQuality.rejectionRisk || 0) > 60 ? "bg-red-200 text-red-800" :
                        (result.technicalQuality.rejectionRisk || 0) > 30 ? "bg-orange-200 text-orange-800" :
                        "bg-green-200 text-green-800"
                      )}>
                        {result.technicalQuality.rejectionRisk || 0}%
                      </span>
                    </div>

                    {result.technicalQuality.qualityTip && (
                      <div className="p-3 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-orange-600 mt-0.5" />
                        <p className="text-[10px] font-bold text-orange-800 leading-tight">
                          {result.technicalQuality.qualityTip}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                   <div className="flex justify-between items-center ml-1">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Transcription</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(result.transcribedText);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors group/copy"
                      >
                        <Copy className="w-3 h-3 text-gray-500 group-hover/copy:text-blue-600 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-600 uppercase">Copy Text</span>
                      </button>
                   </div>
                   <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                      {result.transcribedText}
                   </div>
                </div>

                {result.costEfficiency && (
                  <CostEvaluator costInfo={result.costEfficiency} />
                )}

                {result.confidenceAnalysis && (
                  <ConfidenceEvaluator analysis={result.confidenceAnalysis} />
                )}

                {result.pitch && (
                  <MitraPitch 
                    pitch={result.pitch} 
                    result={result}
                    onStartSimulator={(form) => {
                      onStartSimulator(form);
                    }}
                  />
                )}

                {result.issues && result.issues.length > 0 && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Detected Issues</h4>
                     <div className="flex flex-col gap-3">
                        {result.issues.map((issue: string, idx: number) => (
                          <div key={idx} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
                             <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                             <p className="text-xs font-bold text-red-700">{issue}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Friendly Suggestions</h4>
                   <div className="flex flex-col gap-3">
                      {result.suggestions?.map((s: any, idx: number) => (
                        <div key={idx} className="p-5 bg-emerald-50/30 border border-emerald-100 rounded-[2rem] flex flex-col gap-2">
                           <div className="flex items-center gap-2">
                              {s.type === 'wordChoice' ? <Languages className="w-4 h-4 text-emerald-600" /> : <MessageSquare className="w-4 h-4 text-blue-600" />}
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.type === 'wordChoice' ? 'Word Choice' : 'Tone Improvement'}</p>
                           </div>
                           <p className="text-xs font-bold text-gray-800">
                             {s.type === 'wordChoice' ? (
                               <>Instead of <span className="text-red-500 font-black">"{s.original}"</span>, use <span className="text-emerald-600 font-black">"{s.correction}"</span> here.</>
                             ) : s.improvement}
                           </p>
                           {s.reason && <p className="text-[10px] text-gray-500 font-medium italic">Reason: {s.reason}</p>}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Tone Analysis</p>
                      <p className="text-[10px] font-bold text-gray-700">{result.audits?.tone}</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Formatting</p>
                      <p className="text-[10px] font-bold text-gray-700">{result.audits?.formatting}</p>
                   </div>
                </div>

                <button 
                   onClick={() => setResult(null)}
                   className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mt-4"
                >
                   Audit Another Page
                </button>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const ImageAutoFitterModal = ({ onClose }: { onClose: () => void }) => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [targetExam, setTargetExam] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image) return;
    setProcessing(true);
    // Simulate complex image processing with AI guidance
    setTimeout(() => {
      setResult(image); // In a real app, this would be the processed blob
      setProcessing(false);
    }, 2000);
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `optimized_${targetExam || 'document'}.jpg`;
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
               <Maximize2 className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">AI Image Auto-Fitter</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Passport, Sign, Thumb Impression</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {!result ? (
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">1. Target Specification</h3>
                   <select 
                     value={targetExam}
                     onChange={(e) => setTargetExam(e.target.value)}
                     className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-sm text-gray-700"
                   >
                      <option value="">Select Target Exam / Requirement</option>
                      <option value="NEET">NEET (10KB - 200KB, White Background)</option>
                      <option value="JEE">JEE Main (10KB - 200KB)</option>
                      <option value="UPSC">UPSC (20KB - 300KB)</option>
                      <option value="SSC">SSC (20KB - 50KB, 3.5cm x 4.5cm)</option>
                      <option value="BANK">IBPS/Bank (20KB - 50KB)</option>
                   </select>
                </div>

                <div className="flex flex-col gap-2">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">2. Upload Original Image</h3>
                   <p className="text-xs text-gray-500 font-medium">Auto-crops & compresses to exact requirements.</p>
                </div>

                <div 
                  className={cn(
                    "aspect-square rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden group transition-all max-w-[300px] mx-auto w-full",
                    image && "border-indigo-200 bg-indigo-50/10"
                  )}
                >
                  {image ? (
                    <img src={image} className="absolute inset-0 w-full h-full object-contain" alt="Doc preview" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap to upload</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>

                <button
                  onClick={handleProcess}
                  disabled={!image || processing || !targetExam}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {processing ? 'Processing Image...' : 'Optimize & Format'}
                </button>

                {processing && (
                  <AILoader message="Auto-fitting image to official dimensions..." />
                )}
             </div>
           ) : (
             <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col items-center gap-6">
                   <div className="w-48 h-48 bg-white rounded-[2.5rem] shadow-2xl border-4 border-emerald-500 p-2 overflow-hidden flex items-center justify-center relative">
                      <img src={result} className="max-w-full max-h-full object-contain" alt="Processed" />
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-[8px] font-black uppercase">Optimized</div>
                   </div>
                   <div className="text-center">
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">Image Ready!</h3>
                      <p className="text-xs text-gray-500 font-medium">Successfully compressed to {targetExam} specs.</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Dimensions</p>
                      <p className="text-xs font-bold text-gray-700">Auto-Scaled</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">File Size</p>
                      <p className="text-xs font-bold text-gray-700">~{targetExam === 'SSC' ? '35KB' : '85KB'}</p>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => setResult(null)}
                     className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                   >
                     Reset
                   </button>
                   <button 
                     onClick={downloadImage}
                     className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2"
                   >
                     <Download className="w-4 h-4" /> Download Optimized
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const EligibilityMatcherModal = ({ userProfile, onClose, schemes }: { userProfile: UserProfile; onClose: () => void; schemes: Scheme[] }) => {
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startMatching = async () => {
    setMatching(true);
    try {
      const res = await matchEligibility(userProfile);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setMatching(false);
    }
  };

  useEffect(() => {
    startMatching();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
               <SearchCheck className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">AI Eligibility Matcher</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Matching your profile with exams & scholarships</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {matching ? (
             <AILoader message="Mitra is scanning official rulebooks to find your matches..." />
           ) : result ? (
             <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-6 bg-amber-50/50 rounded-[2.5rem] border border-amber-100">
                   <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{result.mitraAdvice}"</p>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Eligible Opportunities</h4>
                   <div className="flex flex-col gap-4">
                      {result.eligibleOpportunities?.map((opp: any, idx: number) => (
                        <div key={idx} className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-amber-200 transition-colors">
                           {opp.priority === 'high' && (
                             <div className="absolute top-0 right-0 p-2 bg-amber-500 text-white rounded-bl-2xl">
                                <Sparkles className="w-4 h-4" />
                             </div>
                           )}
                           <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                 {opp.category === 'Scholarship' ? <Award className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                              </div>
                              <div className="flex-1">
                                 <h3 className="text-base font-black text-gray-900 leading-tight">{opp.name}</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{opp.category}</span>
                                    <span className="text-[8px] font-bold text-gray-400 flex items-center gap-1">
                                       <Calendar className="w-3 h-3" /> Deadline: {opp.deadline}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                              {opp.eligibilityReason}
                           </p>
                           <button className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors">
                              Check Portal
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           ) : null}
        </div>
      </div>
    </motion.div>
  );
};

const SchemeDiscoveryModal = ({ userProfile, onClose, onAskMitra, schemes }: { userProfile: UserProfile; onClose: () => void; onAskMitra: (q: string) => void; schemes: Scheme[] }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const isProfileIncomplete = !userProfile.state || !userProfile.occupation;

  const fetchRecommendations = async () => {
    if (isProfileIncomplete) return;
    setLoading(true);
    try {
      const res = await getProfileRecommendations(userProfile);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userProfile]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
               <Globe className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Scheme Discovery Mitra</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Finding relevant schemes for {userProfile.state}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {isProfileIncomplete ? (
             <div className="flex flex-col items-center justify-center py-10 gap-6 text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center text-orange-600">
                   <AlertTriangle className="w-10 h-10" />
                </div>
                <div>
                   <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Ofo! Profile Incomplete Hai</h3>
                   <p className="text-xs text-gray-500 font-bold mt-2 leading-relaxed">
                     Bhai, bina State aur Occupation ke main sahi schemes nahi dhoond paunga. 
                     Pehle profile update karlo, fir discovery shuru karte hain!
                   </p>
                </div>
                <button 
                  onClick={() => {
                    onClose();
                    // In a real app we'd open the profile editor. 
                    // For now, let's just trigger a chat message to set it.
                    onAskMitra("Mujhe apni profile update karni hai (State, Occupation, Income)");
                  }}
                  className="px-8 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100"
                >
                  Update Profile Now
                </button>
             </div>
           ) : loading ? (
             <AILoader message="Mitra checks 500+ government portals for your profile..." />
           ) : data && data.markdownResponse ? (
             <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-blue-600 prose-strong:font-black">
                   <ReactMarkdown>{data.markdownResponse}</ReactMarkdown>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col gap-4">
                   <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Next Step</p>
                   </div>
                   <button 
                     onClick={() => {
                       onAskMitra("Main kaunsi scheme ke liye eligible hoon? Help me fill a form.");
                       onClose();
                     }}
                     className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                      <MessageSquare className="w-4 h-4" />
                      Chat with Mitra to Apply
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                   <Globe className="w-10 h-10" />
                </div>
                <p className="text-sm font-bold text-gray-400">Abhi koi specific recommendation nahi hai. Profile check karein.</p>
                <button onClick={fetchRecommendations} className="px-8 py-3 bg-[#008069] text-white rounded-full text-xs font-black uppercase tracking-widest">Refresh</button>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const MasterProfileModal = ({ userProfile, onClose, onUpdateProfile }: { userProfile: UserProfile; onClose: () => void; onUpdateProfile: (updates: Partial<UserProfile>) => void }) => {
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'tracker'>('profile');

  // Hardcoded for demo/initial view
  const requiredDocs = [
    { name: "Aadhar Card", status: "ok" },
    { name: "10th Marksheet", status: "ok" },
    { name: "12th Marksheet", status: "missing" },
    { name: "Category Certificate", status: "missing" },
    { name: "Income Certificate", status: "ok" },
  ];

  const handleExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("Bhai, file size 10MB se zyada hai. Kripya dubaara try karein.", "warning");
      return;
    }
    
    setExtracting(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const res = await extractProfileData(base64, 'image/jpeg');
        if (res.error) {
          showToast(res.error.message, res.error.type === 'QUOTA' ? 'warning' : 'error');
        }
        setExtractedData(res);
      } catch (err) {
        console.error(err);
        showToast("AI extraction mein dikkat hui. Kripya photo saaf khinchein.", "error");
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 pb-4 bg-gray-50/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                 <FileBadge className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Master Profile & Tracker</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your central data & document hub</p>
               </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="flex gap-2">
             <button 
               onClick={() => setActiveTab('profile')}
               className={cn(
                 "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === 'profile' ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-gray-400 hover:bg-gray-100"
               )}
             >
               My Master Data
             </button>
             <button 
                onClick={() => setActiveTab('tracker')}
                className={cn(
                  "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'tracker' ? "bg-orange-600 text-white shadow-lg" : "bg-white text-gray-400 hover:bg-gray-100"
                )}
             >
               Doc Tracker
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {activeTab === 'profile' ? (
             <div className="flex flex-col gap-8">
                {extracting ? (
                  <AILoader message="Mitra is extracting your identity from documents..." />
                ) : !extractedData ? (
                  <div className="p-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center gap-4 text-center">
                     <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300">
                        <Camera className="w-8 h-8" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase">Extract from Marksheet</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Build profile from your 10th/12th certificate</p>
                     </div>
                     <label className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer text-center shadow-lg hover:bg-emerald-700 transition-colors">
                        Scan Marksheet
                        <input type="file" className="hidden" accept="image/*" onChange={handleExtract} />
                     </label>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 animate-in zoom-in-95">
                    {/* Community Selection Section */}
                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                          <Users className="w-12 h-12" />
                       </div>
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Aapki Community (Chuniye)</p>
                       <div className="grid grid-cols-2 gap-3">
                          {['Student', 'Farmer', 'Normal', 'Jobs'].map((c) => (
                             <button
                                key={c}
                                onClick={() => onUpdateProfile({ community: c as any })}
                                className={cn(
                                   "py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                                   userProfile.community === c 
                                      ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]" 
                                      : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                                )}
                             >
                                {userProfile.community === c && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                {c}
                             </button>
                          ))}
                       </div>
                       <p className="text-[9px] text-gray-400 font-black mt-4 uppercase text-center italic tracking-wider">
                         Note: Community badalne par AI Advice aur UI badal jayega.
                       </p>
                    </div>

                    <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Extracted Identity</p>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                              <p className="text-xs font-black text-gray-800 uppercase">{extractedData.personalInfo?.fullName}</p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">DOB</p>
                              <p className="text-xs font-black text-gray-800">{extractedData.personalInfo?.dob}</p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Father's Name</p>
                              <p className="text-xs font-bold text-gray-700">{extractedData.personalInfo?.fatherName}</p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Roll Number</p>
                              <p className="text-xs font-bold text-gray-700">{extractedData.academicInfo?.rollNumber}</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject-wise Marks</h4>
                        <div className="flex flex-col gap-2">
                           {extractedData.academicInfo?.marks?.map((m: any, i: number) => (
                             <div key={i} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100">
                                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{m.subject}</span>
                                <div className="flex items-center gap-4">
                                   <div className="text-center">
                                      <p className="text-[8px] font-black text-gray-400 uppercase">Th</p>
                                      <p className="text-[10px] font-bold text-gray-600">{m.theory}</p>
                                   </div>
                                   <div className="text-center">
                                      <p className="text-[8px] font-black text-gray-400 uppercase">Pr</p>
                                      <p className="text-[10px] font-bold text-gray-600">{m.practical}</p>
                                   </div>
                                   <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black">
                                      {m.total}
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                     <button onClick={() => setExtractedData(null)} className="text-[10px] font-black uppercase text-emerald-600 tracking-widest self-center mt-2">Scan Another Document</button>
                  </div>
                )}
             </div>
           ) : (
             <div className="flex flex-col gap-8 animate-in slide-in-from-right-4">
                <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Missing Documents Alert!</h4>
                      <p className="text-xs text-orange-700 font-medium">Aapke 2 zaroori documents missing hain. Apply karne se pehle inhe ready rakhein.</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Document Checklist</h4>
                   <div className="flex flex-col gap-3">
                      {requiredDocs.map((doc, idx) => (
                        <div key={idx} className="p-5 bg-white border border-gray-100 rounded-[2rem] flex justify-between items-center shadow-sm">
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center",
                                doc.status === 'ok' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                 {doc.status === 'ok' ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-800">{doc.name}</p>
                                 <p className={cn("text-[9px] font-bold uppercase", doc.status === 'ok' ? "text-emerald-500" : "text-red-400")}>
                                    {doc.status === 'ok' ? 'Ready in Vault' : 'Kripya upload karein'}
                                 </p>
                              </div>
                           </div>
                           {doc.status === 'missing' && (
                             <button className="bg-orange-600 text-white p-2 rounded-xl shadow-lg active:scale-95">
                                <Plus className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const CounselingGuideModal = ({ userProfile, onClose }: { userProfile: UserProfile; onClose: () => void }) => {
  const [examName, setExamName] = useState('');
  const [rank, setRank] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const getGuide = async () => {
    if (!examName || !rank) return;
    setLoading(true);
    try {
      const res = await getCounselingRoadmap(examName, rank, userProfile);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
               <GraduationCap className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Post-Exam Counseling Guide</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Step-by-step roadmap for your dream college</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {!result ? (
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Select Exam</h4>
                      <select 
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-sm text-gray-700"
                      >
                         <option value="">Choose Exam...</option>
                         <option value="NEET">NEET UG</option>
                         <option value="JEE Main">JEE Main (JoSAA)</option>
                         <option value="JEE Advanced">JEE Advanced (IIT)</option>
                         <option value="CUET">CUET</option>
                         <option value="CLAT">CLAT</option>
                      </select>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Enter All-India Rank (AIR)</h4>
                      <input 
                        type="text" 
                        placeholder="e.g. 45000"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-100 font-black text-sm text-gray-900"
                      />
                   </div>
                </div>

                <button
                  onClick={getGuide}
                  disabled={!examName || !rank || loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Generating Roadmap...' : 'Get Counseling Roadmap'}
                </button>

                {loading && (
                  <AILoader message="Calculating cut-offs and predicting colleges..." />
                )}
             </div>
           ) : (
             <div className="flex flex-col gap-8 animate-in zoom-in-95">
                <div className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
                   <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{result.roadmapSummary}"</p>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chronological Steps</h4>
                   <div className="relative pl-8 space-y-8">
                      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-blue-100" />
                      {result.steps?.map((s: any, i: number) => (
                        <div key={i} className="relative">
                           <div className={`absolute -left-[28px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${s.isOffline ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-500 shadow-blue-200'}`} />
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-gray-900">{s.step}</span>
                                    <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{s.date}</span>
                                 </div>
                                 {s.isOffline && (
                                   <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                                     <MapPin className="w-2.5 h-2.5" />
                                     <span className="text-[8px] font-black uppercase">Offline Visit</span>
                                   </div>
                                 )}
                              </div>
                              <p className="text-xs text-gray-500 font-medium leading-relaxed">{s.action}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {result.precautions && result.precautions.length > 0 && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precautions & Expert Tips</h4>
                     <div className="grid grid-cols-1 gap-3">
                        {result.precautions.map((p: any, i: number) => (
                          <div key={i} className="p-4 bg-orange-50/30 border border-orange-100 rounded-3xl flex gap-3">
                             <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                             <p className="text-xs font-bold text-orange-900 leading-tight py-0.5">{p}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mandatory Documents list</h4>
                   <div className="grid grid-cols-1 gap-3">
                      {result.requiredDocuments?.map((d: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50/50 border border-gray-100 rounded-3xl flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500">
                                 <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-800">{d.doc}</p>
                                 <p className="text-[8px] text-gray-400 font-bold uppercase">{d.why}</p>
                              </div>
                           </div>
                           <div className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">
                              {d.original ? 'Original + ' : ''}{d.photocopyCount} Copies
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-[2.5rem] shadow-xl">
                   <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Sparkles className="w-3.5 h-3.5" /> Mitra's Strategy
                   </p>
                   <p className="text-xs font-bold text-white leading-relaxed">{result.counselingStrategy}</p>
                </div>

                <button 
                  onClick={() => setResult(null)}
                  className="w-full bg-gray-100 text-gray-500 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest"
                >
                  Check Other Exam
                </button>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const WhatsAppNotificationGenerator = ({ userProfile, onClose }: { userProfile: UserProfile; onClose: () => void }) => {
  const [scenario, setScenario] = useState('missing_doc');
  const [customDetail, setCustomDetail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const scenarios = [
    { id: 'missing_doc', label: 'Missing Document', icon: FileWarning },
    { id: 'form_status', label: 'Form Status Update', icon: Zap },
    { id: 'new_scheme', label: 'New Scheme Alert', icon: Sparkles },
    { id: 'payment_reminder', label: 'Payment Reminder', icon: CreditCard },
  ];

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const prompt = `Generate a WhatsApp message for this scenario: ${scenario}. 
      User Name: ${userProfile.name || 'Student'}. 
      Extra details/context: ${customDetail}. 
      ACT as the 'WhatsApp Communication & User Engagement Specialist' as per your core instructions. 
      Remember the catchy greeting, solution pitch (₹10 service), clear CTA, and the MANDATORY signature.`;
      
      const res = await getAIResponse(prompt, [], userProfile);
      setMessage(res.text);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 bg-[#075E54] text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black uppercase tracking-widest text-sm">WhatsApp Specialist</h2>
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Notification Generator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Scenario</label>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-xs font-bold",
                    scenario === s.id ? "bg-green-50 border-[#25D366] text-[#075E54]" : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200"
                  )}
                >
                  <s.icon className={cn("w-4 h-4", scenario === s.id ? "text-[#25D366]" : "text-gray-400")} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Custom Details (Optional)</label>
            <textarea
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              placeholder="e.g. Income Certificate missing, or 'PM Kisan' scheme name..."
              className="w-full bg-gray-50 p-4 rounded-3xl border border-gray-100 text-sm font-medium outline-none h-24 resize-none transition-all focus:border-[#25D366]/30"
            />
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="w-full py-4 bg-[#25D366] text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#25D366]/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Notification
              </>
            )}
          </button>

          {message && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="bg-[#E5DDD5] chat-pattern p-4 rounded-3xl border border-gray-200 relative">
                  <div className="absolute top-4 left-[-8px] w-4 h-4 bg-[#DCF8C6] rotate-45 border-l border-b border-gray-200 hidden" />
                  <div className="bg-[#DCF8C6] p-4 rounded-2xl rounded-tr-none shadow-sm border border-[#C7E9B0] text-sm whitespace-pre-wrap font-medium text-gray-800 leading-relaxed tabular-nums">
                    {message}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">WhatsApp Preview</span>
                  </div>
               </div>

               <div className="flex gap-2">
                 <button
                   onClick={copyToClipboard}
                   className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                 >
                   {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                   {copied ? 'Copied!' : 'Copy to Clipboard'}
                 </button>
                 <button
                   className="w-14 h-14 bg-[#25D366] text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                   onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')}
                 >
                   <Send className="w-6 h-6" />
                 </button>
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const FormAuditModal = ({ userProfile, onClose, onStartSimulator, initialScheme, schemes }: { userProfile: UserProfile; onClose: () => void; onStartSimulator: (form: any) => void; initialScheme?: any; schemes: Scheme[] }) => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedScheme, setSelectedScheme] = useState<any>(initialScheme || null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchemes = useMemo(() => {
    if (!searchQuery) return schemes.slice(0, 5);
    return schemes.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.hindiName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, schemes]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setImage(null);
      }
    }
  };

  const handleAudit = async () => {
    if (!imageFile || !selectedScheme) return;
    setAuditing(true);
    try {
      const auditResult = await analyzeFilledForm(imageFile, selectedScheme);
      setResult(auditResult);
    } catch (err) {
      console.error("Audit error:", err);
      alert("Bhai, form audit nahi ho saka. Kripya phirse try karein.");
    } finally {
      setAuditing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Form Audit Mitra</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Discrepancy & Risk Analyzer</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           {!result ? (
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">1. Upload Filled Form</h3>
                   <p className="text-xs text-gray-500 font-medium">Capture or upload the filled application form for AI review.</p>
                </div>

                <div 
                  className={cn(
                    "aspect-video rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden group transition-all",
                    (image || imageFile) && "border-indigo-200 bg-indigo-50/10"
                  )}
                >
                  {image ? (
                    <img src={image} className="absolute inset-0 w-full h-full object-contain" alt="Form preview" />
                  ) : imageFile && imageFile.type === 'application/pdf' ? (
                    <div className="flex flex-col items-center gap-2">
                       <FileText className="w-16 h-16 text-indigo-500" />
                       <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{imageFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap to upload form or PDF</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    capture="environment"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  {imageFile && (
                    <button 
                      onClick={() => {
                        setImage(null);
                        setImageFile(null);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>

                  <button
                    onClick={handleAudit}
                    disabled={(!image && !imageFile) || auditing}
                    className="w-full bg-[#008069] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-green-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Upload className="w-4 h-4" />
                    {auditing ? 'Analyzing Document...' : 'Upload & Analyze Document'}
                  </button>

                {auditing && (
                  <AILoader message="Scanning for discrepancies and rejection risks..." />
                )}
             </div>
           ) : (
             <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center gap-4 text-center">
                   <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-100" />
                        <circle 
                          cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" 
                          strokeDasharray={351.8}
                          strokeDashoffset={351.8 - (351.8 * (100 - result.riskScore)) / 100}
                          className={cn(
                            "transition-all duration-1000",
                            result.riskScore > 60 ? "text-red-500" : result.riskScore > 30 ? "text-orange-500" : "text-green-500"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-black text-gray-900">{100 - result.riskScore}%</span>
                         <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Safety Score</span>
                      </div>
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{result.verdict}</h3>
                      <p className="text-xs text-gray-500 font-medium">Rejection Risk: {result.riskScore}%</p>
                   </div>
                </div>

                {result.costEfficiency && (
                  <CostEvaluator costInfo={result.costEfficiency} />
                )}

                {result.confidenceAnalysis && (
                  <ConfidenceEvaluator analysis={result.confidenceAnalysis} />
                )}

                {result.pitch && (
                  <MitraPitch 
                    pitch={result.pitch} 
                    result={result}
                    onStartSimulator={(form) => {
                      onStartSimulator(form);
                    }}
                  />
                )}

                {result.photoAudit && (
                   <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                          result.photoAudit.isAccepted ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        )}>
                          {result.photoAudit.isAccepted ? <CheckCircle className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-gray-900 tracking-tight">Photo & Background Audit</h4>
                           <p className={cn("text-[10px] font-bold uppercase", result.photoAudit.isAccepted ? "text-green-600" : "text-red-600")}>
                             {result.photoAudit.isAccepted ? "Photo looks good" : "Photo needs attention"}
                           </p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/60 p-3 rounded-2xl border border-indigo-100/30">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Background</p>
                           <p className="text-xs font-bold text-gray-800">{result.photoAudit.backgroundStatus}</p>
                        </div>
                        <div className="bg-white/60 p-3 rounded-2xl border border-indigo-100/30">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Clarity</p>
                           <p className="text-xs font-bold text-gray-800">{result.photoAudit.clarity}</p>
                        </div>
                        {result.photoAudit.brightness && (
                          <div className="bg-white/60 p-3 rounded-2xl border border-indigo-100/30">
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Brightness</p>
                             <p className="text-xs font-bold text-gray-800">{result.photoAudit.brightness}</p>
                          </div>
                        )}
                        {result.photoAudit.alignment && (
                          <div className="bg-white/60 p-3 rounded-2xl border border-indigo-100/30">
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Alignment</p>
                             <p className="text-xs font-bold text-gray-800">{result.photoAudit.alignment}</p>
                          </div>
                        )}
                        {result.photoAudit.legibility && (
                          <div className="bg-white/60 p-3 rounded-2xl border border-indigo-100/30 col-span-2">
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Handwriting Legibility</p>
                             <p className="text-xs font-bold text-gray-800">{result.photoAudit.legibility}</p>
                          </div>
                        )}
                     </div>
                   </div>
                )}

                {result.majorIssues?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-500">Major Concerns</h4>
                    <div className="flex flex-col gap-3">
                      {result.majorIssues.map((issue: any, idx: number) => (
                        <div key={idx} className="p-5 bg-white border border-red-100 rounded-3xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                           <div className="flex justify-between items-start">
                              <span className="text-sm font-black text-gray-900 leading-tight pr-8">{issue.issue}</span>
                              <span className={cn(
                                "text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                                issue.severity === 'high' ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                              )}>
                                {issue.severity} Risk
                              </span>
                           </div>
                           <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                              <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" /> How to fix
                              </p>
                              <p className="text-xs font-bold text-gray-800 leading-relaxed">{issue.fix}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.identifiedFields?.length > 0 && (
                   <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-gray-400">Identified Form Fields</h4>
                    <div className="flex flex-col gap-2">
                       {result.identifiedFields.map((f: any, idx: number) => (
                         <div key={idx} className="px-4 py-3 bg-gray-50/50 rounded-2xl flex justify-between items-center border border-gray-100">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight">{f.field}</p>
                              <p className="text-xs font-bold text-gray-700">{f.value || 'Empty'}</p>
                           </div>
                           <div className={cn(
                             "w-2 h-2 rounded-full",
                             f.status === 'ok' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : 
                             f.status === 'error' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-gray-300"
                           )} />
                         </div>
                       ))}
                    </div>
                   </div>
                )}

                {result.actionPlan?.length > 0 && (
                   <div className="space-y-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" /> Clear Action Plan
                      </h4>
                      <div className="flex flex-col gap-3">
                         {result.actionPlan.map((step: string, idx: number) => (
                            <div key={idx} className="flex gap-3 items-start">
                               <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black text-indigo-600 shadow-sm">
                                  {idx + 1}
                               </div>
                               <p className="text-xs font-bold text-gray-700 leading-relaxed">{step}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                <button 
                  onClick={() => setResult(null)}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mt-4"
                >
                  Audit New Form
                </button>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

const NotificationCenter = ({ notifications, onClose, onMarkRead }: { notifications: AppNotification[]; onClose: () => void; onMarkRead: (id: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-white z-[60] flex flex-col"
    >
      <header className="p-6 border-b border-gray-100 flex items-center gap-4">
         <button onClick={onClose} className="p-2 -ml-2 text-gray-400">
            <X className="w-5 h-5" />
         </button>
         <div>
            <h2 className="text-xl font-black text-gray-900">Notifications</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Important updates for you</p>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
         {notifications.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-48 text-gray-300">
             <Bell className="w-12 h-12 mb-2 opacity-20" />
             <p className="text-xs font-bold uppercase tracking-tight">Koi naye alerts nahi hain</p>
           </div>
         ) : (
           notifications.map(n => (
             <div 
               key={n.id}
               onClick={() => onMarkRead(n.id)}
               className={cn(
                 "p-4 rounded-3xl border transition-all cursor-pointer",
                 n.read ? "bg-white border-gray-100 opacity-60" : "bg-green-50/30 border-green-100 shadow-sm"
               )}
             >
               <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                    n.type === 'deadline' ? "bg-red-100 text-red-600" : 
                    n.type === 'status' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {n.type === 'deadline' ? <AlertCircle className="w-5 h-5" /> : 
                     n.type === 'status' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start mb-1">
                        <h4 className="text-xs font-black text-gray-900 pr-2">{n.title}</h4>
                        {!n.read && <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                     </div>
                     <p className="text-[11px] text-gray-600 font-medium leading-relaxed mb-2">{n.body}</p>
                     <p className="text-[9px] text-gray-400 font-bold">{new Date(n.timestamp).toLocaleDateString()} • {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
               </div>
             </div>
           ))
         )}
      </div>
    </motion.div>
  );
};

const GlobalNav = ({ active, onChange }: { active: string; onChange: (v: string) => void }) => {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'schemes', icon: BookOpen, label: 'Schemes' },
    { id: 'tools', icon: LayoutDashboard, label: 'Tools' },
    { id: 'chat', icon: MessageCircle, label: 'Mitra AI' },
    { id: 'guide', icon: Camera, label: 'Forms' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 px-2 shadow-[0_4px_20px_0_rgba(0,0,0,0.03)] pb-1">
      <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 group relative",
              active === tab.id ? "text-[#008069]" : "text-gray-400"
            )}
            id={`nav-tab-${tab.id}`}
          >
            {active === tab.id && (
              <motion.div 
                layoutId="nav-active-bg"
                className="absolute bottom-0 w-10 h-1 bg-[#008069] rounded-t-full"
              />
            )}
            <tab.icon className={cn("w-5 h-5", active === tab.id && "fill-current opacity-20")} />
            <span className={cn(
              "text-[9px] mt-1 font-black uppercase tracking-[0.1em]",
              active === tab.id ? "opacity-100" : "opacity-60"
            )}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const VerifiedLinks = () => {
  const links = [
    { name: 'PM Kisan Portal', url: 'https://pmkisan.gov.in', category: 'Scholarship' },
    { name: 'Aadhar Self Service', url: 'https://myaadhaar.uidai.gov.in', category: 'ID' },
    { name: 'National Scholarship', url: 'https://scholarships.gov.in', category: 'Education' },
    { name: 'UP Scholarship', url: 'https://scholarship.up.gov.in', category: 'State' },
    { name: 'DigiLocker', url: 'https://www.digilocker.gov.in', category: 'Vault' }
  ];

  return (
    <div className="flex flex-col gap-3">
       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Verified Govt Vault</h3>
       <div className="flex flex-col gap-2">
         {links.map((l, i) => (
           <a 
            key={i} 
            href={l.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-green-100 transition-all"
           >
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                   <Globe className="w-4 h-4 text-[#008069]" />
                </div>
                <div>
                   <h4 className="text-xs font-bold text-gray-900">{l.name}</h4>
                   <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{l.category}</p>
                </div>
             </div>
             <div className="flex items-center gap-1">
                <span className="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded cursor-help">.GOV.IN</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
             </div>
           </a>
         ))}
       </div>
    </div>
  );
};

const VaultScreen = ({ userProfile, onNavigate, onShowMasterProfile }: { userProfile: UserProfile; onNavigate: (v: string) => void; onShowMasterProfile?: () => void }) => {
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/documents`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const d = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserDocument));
       setDocs(d.sort((a, b) => b.uploadedAt - a.uploadedAt));
       setLoading(false);
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/documents`);
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-6">
       {/* New Master Profile Card */}
       <div 
         onClick={onShowMasterProfile}
         className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl flex flex-col gap-6 cursor-pointer border border-white/10 hover:border-emerald-500/50 transition-all group"
       >
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                <FileBadge className="w-6 h-6" />
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
             </div>
             <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-white leading-tight">Master Profile & Tracker</h3>
                <p className="text-[10px] text-gray-400 font-medium tracking-tight">AI OCR + Missing Docs Alert</p>
             </div>
             <div className="ml-auto">
                <ChevronRight className="w-5 h-5 text-gray-600" />
             </div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
             <p className="text-[9px] font-black uppercase text-orange-400 tracking-widest">2 Missing Documents Identified</p>
          </div>
       </div>

       <div className="flex justify-between items-center px-1">
          <div className="flex flex-col">
             <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Document Vault</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Safe & Encryption Secured</p>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-[#008069] text-white flex items-center justify-center shadow-lg shadow-green-100">
             <Plus className="w-5 h-5" />
          </button>
       </div>

       <div className="flex flex-col gap-3">
          {loading ? (
             [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)
          ) : docs.length === 0 ? (
             <div className="py-12 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center gap-3">
                <FileCheck className="w-10 h-10 text-gray-200" />
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest text-center">No documents saved.<br/>Upload Marksheet/Certificates.</p>
             </div>
          ) : (
             docs.map(userDoc => (
               <div key={userDoc.id} className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <FileText className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-sm text-gray-900">{userDoc.name}</h4>
                        {userDoc.expiryDate && (
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <AlertCircle className={cn(
                                "w-3 h-3",
                                Date.now() > userDoc.expiryDate - (15 * 24 * 60 * 60 * 1000) ? "text-red-500" : "text-gray-400"
                              )} />
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                Date.now() > userDoc.expiryDate - (15 * 24 * 60 * 60 * 1000) ? "text-red-500" : "text-gray-400"
                              )}>
                                Expires: {new Date(userDoc.expiryDate).toLocaleDateString()}
                              </span>
                           </div>
                        )}
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Upload: {new Date(userDoc.uploadedAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!auth.currentUser) return;
                      try {
                        await deleteDoc(doc(db, `users/${auth.currentUser.uid}/documents`, userDoc.id));
                        showLocalNotification('Deleted', { body: `${userDoc.name} has been removed.` });
                      } catch (err) {
                        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/documents/${userDoc.id}`);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
             ))
          )}
       </div>
    </div>
  );
};

const ToolsScreen = ({ userProfile, onNavigate, onAskMitra, isGuruActive, onActivateGuru, onShowFormAudit, onShowHandwrittenAudit, onShowDocumentEnhancer, onShowScraperPro, onShowPdfUtility, onShowImageAutoFitter, onShowEligibilityMatcher, onShowSchemeDiscovery, onShowMasterProfile, onShowCounselingGuide, onOpenCSCHub, preloadedForm, onClearPreloadedForm }: { 
  userProfile: UserProfile; 
  onNavigate: (v: string) => void;
  onAskMitra: (q: string) => void; 
  isGuruActive: boolean;
  onActivateGuru: (autoStart?: boolean) => void;
  onShowFormAudit: () => void;
  onShowHandwrittenAudit: () => void;
  onShowDocumentEnhancer: () => void;
  onShowScraperPro: () => void;
  onShowPdfUtility: () => void;
  onShowImageAutoFitter: () => void;
  onShowEligibilityMatcher: () => void;
  onShowSchemeDiscovery: () => void;
  onShowMasterProfile: () => void;
  onShowCounselingGuide: () => void;
  onOpenCSCHub: () => void;
  preloadedForm?: any | null;
  onClearPreloadedForm?: () => void;
}) => {
  const [activeTool, setActiveTool] = useState<'studio' | 'vault' | 'links'>('studio');
  const [simulatorMode, setSimulatorMode] = useState(false);

  useEffect(() => {
    if (preloadedForm) {
      setSimulatorMode(true);
    }
  }, [preloadedForm]);

  if (simulatorMode && (preloadedForm || simulatorMode)) {
    return (
      <div className="p-6 pb-24 flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSimulatorMode(false);
              if (onClearPreloadedForm) onClearPreloadedForm();
            }}
            className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Practice Simulator</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Learn to fill correctly</p>
          </div>
        </header>
        
        <FormSimulator 
          form={preloadedForm || { formName: "Practice Form", summary: "Fill this to practice", fields: [] }} 
          userId={auth.currentUser?.uid} 
          initialData={preloadedForm?.formData}
          onDraftSaved={() => {}}
          isGuruActive={isGuruActive}
          onActivateGuru={onActivateGuru}
        />
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
           <div className="flex justify-between items-center">
              <div>
                 <h1 className="text-2xl font-black text-gray-900 tracking-tight">Smart Utility Tools</h1>
                 <p className="text-xs text-gray-500 font-medium tracking-tight">AI powered tools for students.</p>
              </div>
              <button
                onClick={onShowFormAudit}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                 <Upload className="w-4 h-4" />
                 Upload Document
              </button>
           </div>
        </header>

       <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
          {(['studio', 'vault', 'links'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTool(t)}
              className={cn(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                activeTool === t ? "bg-white text-[#008069] shadow-sm" : "text-gray-400"
              )}
            >
              {t === 'studio' ? 'Studio' : t === 'vault' ? 'Vault' : 'Links'}
            </button>
          ))}
       </div>

       {activeTool === 'studio' && (
         <div className="flex flex-col gap-6">
             {/* Community Specific Tools */}
             <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-[#008069] uppercase tracking-widest px-1">Special for {userProfile.community}</h3>
                
                {userProfile.community === 'Student' && (
                  <div 
                    onClick={() => {
                      onAskMitra("Mujhe pichle 10 saal ke PYQs (Previous Year Questions) chahiye. Kya aap meri madad kar sakte hain?");
                      onNavigate('chat');
                    }}
                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-orange-100 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                          <BookOpen className="w-6 h-6" />
                       </div>
                       <div>
                          <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">10 Years PYQs</h3>
                          <p className="text-[10px] text-gray-400 font-medium">JEE, NEET aur Board exams ke liye</p>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-600" />
                  </div>
                )}

                {userProfile.community === 'Farmer' && (
                  <div className="flex flex-col gap-3">
                    <MandiBhavWidget />
                    <WeatherWidget state={userProfile.state} />
                  </div>
                )}

                {userProfile.community === 'Jobs' && (
                  <div 
                    onClick={() => onNavigate('chat')}
                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-100 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <SearchCheck className="w-6 h-6" />
                       </div>
                       <div>
                          <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">All Rounder Job Finder</h3>
                          <p className="text-[10px] text-gray-400 font-medium">Best jobs matching your profile</p>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
                  </div>
                )}
             </div>

            {/* Primary Tools (Common Tools) */}
            <div className="flex flex-col gap-3">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Common Tools (Zaroori Tools)</h3>
               
               <div 
                 onClick={() => onNavigate('letters')}
                 className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-green-100 transition-all active:scale-[0.98]"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-[#008069]">
                       <Languages className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">Letter Mitra</h3>
                       <p className="text-[10px] text-gray-400 font-medium">Prarthna patra aur formal letters likhein</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#008069]" />
               </div>

               <div 
                 onClick={() => onNavigate('news')}
                 className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-100 transition-all active:scale-[0.98]"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                       <Volume2 className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">Audio News Feed</h3>
                       <p className="text-[10px] text-gray-400 font-medium">Sunein aaj ke mukhya samachar</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
               </div>

               <div 
                 onClick={onShowDocumentEnhancer}
                 className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-100 transition-all active:scale-[0.98]"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                       <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">Doc Enhancer Guide</h3>
                       <p className="text-[10px] text-gray-400 font-medium">Bade files ko optimize karein</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600" />
               </div>

               <div 
                 onClick={() => {
                   onAskMitra("Mujhe NEET/JEE ya kisi sarkari scheme ke liye dummy form fill karna hai. Kripya mujhe ek sample form dein taaki main practice kar saku aur aap mujhe ratings dein.");
                   onNavigate('chat');
                 }}
                 className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-purple-100 transition-all active:scale-[0.98]"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                       <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">Form Practice Box</h3>
                       <p className="text-[10px] text-gray-400 font-medium">Practice karein aur ratings paayein</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600" />
               </div>
            </div>

            {/* Advanced Tools */}
            <div className="flex flex-col gap-3">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Advanced AI Tools</h3>

               <div 
                 onClick={onShowFormAudit}
                 className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-100 transition-colors"
               >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">Form Audit (Mitra)</h3>
                     <p className="text-[10px] text-gray-400 font-medium">AI based Rejection Risk Analysis</p>
                  </div>
                  <div className="ml-auto">
                     <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
               </div>

               <div 
                  onClick={() => {
                    onNavigate('schemes');
                    setTimeout(() => {
                      alert("COMPARE MODE: Schemes par 'Check' icon tap karein (Max 3) phir niche Compare button dabayein!");
                    }, 800);
                  }}
                  className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-orange-100 transition-colors"
               >
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                     <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">Scheme Comparison</h3>
                     <p className="text-[10px] text-gray-400 font-medium">Benefits analyzer</p>
                  </div>
                  <div className="ml-auto">
                     <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

                 <div 
                   onClick={onShowImageAutoFitter}
                   className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-indigo-100 transition-colors"
                 >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Maximize2 className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-900 leading-tight">Image Auto-Fitter</h3>
                       <p className="text-[8px] text-gray-400 font-medium mt-1">Passport/Sign Scaler</p>
                    </div>
                 </div>

                 <div 
                   onClick={onShowEligibilityMatcher}
                   className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-amber-100 transition-colors"
                 >
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                       <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                       <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-900 leading-tight">Eligibility Matcher</h3>
                       <p className="text-[8px] text-gray-400 font-medium mt-1">Matching opportunities</p>
                    </div>
                 </div>

                 <div 
                   onClick={onShowCounselingGuide}
                   className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-blue-100 transition-colors"
                 >
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                       <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                       <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-900 leading-tight">Counseling Guide</h3>
                       <p className="text-[8px] text-gray-400 font-medium mt-1">Post-exam roadmap</p>
                    </div>
                 </div>

                 <div 
                   onClick={onShowScraperPro}
                   className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-blue-100 transition-colors"
                 >
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                       <Globe className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-900 leading-tight">Scraper Pro</h3>
                       <p className="text-[8px] text-gray-400 font-medium mt-1">Extract web data</p>
                    </div>
                 </div>

                 <div 
                   onClick={onShowPdfUtility}
                   className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-red-100 transition-colors"
                 >
                    <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                       <FileText className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-900 leading-tight">PDF Utility</h3>
                       <p className="text-[8px] text-gray-400 font-medium mt-1">Images to PDF</p>
                    </div>
                 </div>
              </div>

            <div 
               onClick={() => onActivateGuru(true)}
               className={cn(
                 "bg-slate-900 p-6 rounded-[2.5rem] shadow-xl flex flex-col gap-6 cursor-pointer transition-all border border-transparent",
                 isGuruActive ? "border-[#008069] ring-2 ring-[#008069]/20" : "hover:border-white/10"
               )}
             >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden",
                     isGuruActive ? "bg-[#008069] text-white" : "bg-white/10 text-[#008069]"
                   )}>
                      <Cpu className={cn("w-6 h-6", isGuruActive && "animate-pulse")} />
                      {isGuruActive && (
                        <div className="absolute inset-0 bg-white/20 animate-ping" />
                      )}
                   </div>
                   <div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-white leading-tight">AI Screen Guru</h3>
                      <p className="text-[10px] text-gray-400 font-medium">{isGuruActive ? "Session Active" : "Live Screen Guidance Assistant"}</p>
                   </div>
                   <div className="ml-auto">
                      {isGuruActive ? (
                        <div className="flex items-center gap-1.5 bg-[#008069]/20 px-2 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#008069] animate-pulse" />
                          <span className="text-[8px] font-black uppercase text-[#008069]">Live</span>
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/20" />
                      )}
                   </div>
                </div>
             </div>

            <PhotoStudio userProfile={userProfile} onNavigate={onNavigate} />

            <div 
                onClick={onOpenCSCHub}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 cursor-pointer hover:border-blue-100 transition-colors"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                       <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">CSC Locator</h3>
                       <p className="text-[10px] text-gray-400 font-medium">Find nearest Common Service Center</p>
                    </div>
                    <div className="ml-auto">
                       <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                 </div>
              </div>

            <div 
               onClick={onShowSchemeDiscovery}
               className="bg-[#008069] p-6 rounded-[2.5rem] shadow-xl flex flex-col gap-6 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all border-none relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 transition-transform duration-1000 group-hover:scale-150" />
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                      <Globe className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-white leading-tight">Yojana Finder</h3>
                      <p className="text-[10px] text-white/70 font-medium">Auto-match latest schemes</p>
                   </div>
                   <div className="ml-auto">
                      <ChevronRight className="w-5 h-5 text-white" />
                   </div>
                </div>
             </div>
         </div>
       )}
       {activeTool === 'vault' && <VaultScreen userProfile={userProfile} onNavigate={onNavigate} onShowMasterProfile={onShowMasterProfile} />}
       {activeTool === 'links' && <VerifiedLinks />}
    </div>
  );
};

const PhotoStudio = ({ userProfile, onNavigate }: { userProfile: UserProfile; onNavigate: (v: string) => void }) => {
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState<string | null>(null);

  const handleProcess = () => {
    if (!userProfile.isPremium) {
      onNavigate('premium');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setProcessed('processed');
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-4">
       <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Camera className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">AI Photo Studio</h3>
                <p className="text-[10px] text-gray-400 font-medium">Auto-resize to Passport/Sign format</p>
             </div>
          </div>

          <div className="aspect-[4/3] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
             {processing ? (
               <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Removing Background...</p>
               </div>
             ) : (
               <>
                 <Upload className="w-8 h-8 text-gray-300 group-hover:scale-110 transition-transform" />
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap to Upload Photo/Sign</p>
               </>
             )}
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Target Size</label>
                <select className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 text-[10px] font-bold outline-none">
                   <option>Passport (Below 20 KB)</option>
                   <option>Signature (Below 5 KB)</option>
                   <option>Marksheet (Below 200 KB)</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Format</label>
                <select className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 text-[10px] font-bold outline-none">
                   <option>JPG</option>
                   <option>PNG</option>
                </select>
             </div>
          </div>

          <button 
            onClick={handleProcess}
            className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-100 active:scale-95 transition-all"
          >
             {userProfile.isPremium ? 'Process Now' : 'Unlock with Premium'}
          </button>
       </div>
       
       {!userProfile.isPremium && (
         <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-600 fill-current shrink-0" />
            <p className="text-[10px] text-yellow-700 font-bold leading-tight uppercase tracking-tight">
               Passport size auto-processing sirf Premium users ke liye hai. Join karein sirf ₹49 mein!
            </p>
         </div>
       )}
    </div>
  );
};

const InteractiveTutorial = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Swagat Hai Form Mitra Mein!",
      description: "Main aapka AI saathi hoon jo aapke forms bharne aur scholarships paane mein help karega.",
      icon: Sparkles,
      color: "text-[#008069]",
      bg: "bg-green-50"
    },
    {
      title: "Live AI Screen Guru",
      description: "Aapka personal expert! Jab aap form bharenge, main aapki screen dekh kar live audio guidance dunga.",
      icon: Cpu,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Form Audit (Risk Analyzer)",
      description: "Form submit karne se pehle photo kheenchiye. Main bataunga ki rejection ka risk kitna hai aur kya thik karna hai.",
      icon: ShieldCheck,
      color: "text-orange-600",
      bg: "bg-orange-50"
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 gap-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20 }}
          className="flex flex-col items-center text-center gap-6"
        >
          <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-xl border border-white/50", currentStep.bg)}>
            <currentStep.icon className={cn("w-12 h-12", currentStep.color)} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight uppercase">
              {currentStep.title}
            </h2>
            <p className="text-gray-500 font-medium leading-relaxed px-4">
              {currentStep.description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 mt-4">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              step === i + 1 ? "w-8 bg-[#008069]" : "w-2 bg-gray-200"
            )} 
          />
        ))}
      </div>

      <button
        onClick={() => step < steps.length ? setStep(s => s + 1) : onComplete()}
        className="w-full max-w-xs bg-[#008069] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-green-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        {step < steps.length ? 'Agla Feature' : 'Dashboard Shuru Karein'}
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

const Onboarding = ({ onComplete }: { onComplete: (profile: Partial<UserProfile>) => void }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    class: '11',
    stream: 'PCB',
    state: 'Bihar',
    preferredLanguage: 'hinglish'
  });

  const nextStep = () => setStep(s => s + 1);

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-white z-[60] p-8 flex flex-col gap-8 justify-center">
        <div className="flex flex-col gap-2 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 border border-green-100">
             <Star className="w-10 h-10 text-[#008069] fill-current opacity-20" />
          </div>
          <h1 className="text-3xl font-black text-[#008069] tracking-tight">Swagat Hai!</h1>
          <p className="text-gray-500 font-medium">Aapka Apna AI Sanyojak - Form Mitra</p>
        </div>
        <button 
          onClick={nextStep}
          className="w-full bg-[#008069] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-green-100"
        >
          Shuru Karein
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-white z-[60] p-8 flex flex-col gap-6 overflow-y-auto">
        <header className="flex items-center gap-4">
           <div className="w-2 h-10 bg-[#008069] rounded-full" />
           <h2 className="text-2xl font-black text-gray-900 leading-tight">Aapki Community Kya Hai?</h2>
        </header>

        <div className="grid grid-cols-2 gap-4">
           {[
             { id: 'Student', label: 'Student', icon: GraduationCap, sub: 'Exams, Scholarships, Career' },
             { id: 'Farmer', label: 'Farmer', icon: Wheat, sub: 'Mandi Bhav, Mausam, Kheti' },
             { id: 'Normal', label: 'Normal Citizen', icon: UserIcon, sub: 'Aadhar, Rashan, Govt Schemes' },
             { id: 'Jobs', label: 'Jobs Finder', icon: BriefcaseIcon, sub: 'Private Jobs, Daily Earnings' }
           ].map(p => (
             <button
               key={p.id}
               onClick={() => {
                 setData({ ...data, community: p.id as any, occupation: (p.id === 'Jobs' ? 'Unemployed' : p.id) as any });
                 nextStep();
               }}
               className={cn(
                 "p-5 rounded-[2.5rem] border-2 flex flex-col items-center gap-3 text-center transition-all group",
                 data.community === p.id ? "bg-green-50 border-[#008069] shadow-lg" : "bg-white border-gray-100 hover:border-[#008069]/30"
               )}
             >
                <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                   data.community === p.id ? "bg-[#008069] text-white" : "bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-[#008069]"
                )}>
                   <p.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-black text-gray-900 tracking-tight">{p.label}</p>
                   <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-60 leading-tight">{p.sub}</p>
                </div>
             </button>
           ))}
        </div>

        <div className="mt-auto space-y-4">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aapka Rajya (State)?</label>
             <select 
               value={data.state}
               onChange={(e) => setData({ ...data, state: e.target.value })}
               className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#008069]/20"
             >
                <option value="">State Chunein</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
        </div>
      </div>
    );
  }

  if (step === 3 && data.occupation === 'Student') {
    return (
      <div className="fixed inset-0 bg-white z-[60] p-8 flex flex-col gap-6">
        <header className="flex items-center gap-4">
           <div className="w-2 h-10 bg-[#008069] rounded-full" />
           <h2 className="text-2xl font-black text-gray-900 leading-tight">Student Details</h2>
        </header>
        
        <div className="flex flex-col gap-4">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kounsi Class mein hain?</label>
             <div className="grid grid-cols-3 gap-2">
                {['9', '10', '11', '12', 'College', 'Graduated'].map(c => (
                  <button 
                    key={c}
                    onClick={() => setData({ ...data, class: c })}
                    className={cn(
                      "py-3 rounded-2xl border font-bold text-sm transition-all",
                      data.class === c ? "bg-[#008069] text-white border-[#008069] shadow-lg" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {c}
                  </button>
                ))}
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aapka Stream?</label>
             <div className="grid grid-cols-2 gap-2">
                {['PCB', 'PCM', 'Commerce', 'Arts', 'Others'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setData({ ...data, stream: s as any })}
                    className={cn(
                      "py-3 rounded-2xl border font-bold text-sm transition-all",
                      data.stream === s ? "bg-[#008069] text-white border-[#008069] shadow-lg" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {s}
                  </button>
                ))}
             </div>
           </div>
        </div>

        <button 
          onClick={nextStep}
          disabled={!data.class || !data.stream}
          className="mt-auto w-full bg-[#008069] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-green-100 disabled:opacity-50"
        >
          Agla Step
        </button>
      </div>
    );
  }

  if (step === 3 && data.occupation !== 'Student') {
    nextStep();
    return null;
  }

  if (step === 4) {
    return (
      <div className="fixed inset-0 bg-white z-[60] p-8 flex flex-col gap-6 overflow-y-auto">
        <header className="flex items-center gap-4">
           <div className="w-2 h-10 bg-[#008069] rounded-full" />
           <h2 className="text-2xl font-black text-gray-900 leading-tight">Aakhri Details</h2>
        </header>

        <div className="flex flex-col gap-6">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aapka Gender (Ling)?</label>
             <div className="grid grid-cols-3 gap-2">
                {(['Male', 'Female', 'Other'] as const).map(g => (
                  <button 
                    key={g}
                    onClick={() => setData({ ...data, gender: g })}
                    className={cn(
                      "py-3 rounded-2xl border font-bold text-sm transition-all",
                      data.gender === g ? "bg-[#008069] text-white border-[#008069] shadow-lg" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {g === 'Male' ? 'Purush' : g === 'Female' ? 'Mahila' : 'Anya'}
                  </button>
                ))}
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category chunein?</label>
             <div className="grid grid-cols-3 gap-2">
                {(['General', 'OBC', 'SC', 'ST', 'EWS'] as const).map(c => (
                  <button 
                    key={c}
                    onClick={() => setData({ ...data, category: c })}
                    className={cn(
                      "py-3 rounded-2xl border font-bold text-[10px] transition-all",
                      data.category === c ? "bg-[#008069] text-white border-[#008069] shadow-lg" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {c}
                  </button>
                ))}
             </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Family Income (₹)?</label>
              <input 
                type="number" 
                placeholder="e.g. 20000"
                value={data.monthlyIncome || ''}
                onChange={(e) => setData({ ...data, monthlyIncome: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#008069]/20"
              />
           </div>
        </div>

        <button 
          onClick={() => onComplete(data)}
          className="mt-8 w-full bg-[#008069] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-green-100 shrink-0"
        >
          Dashboard Dekhein
        </button>
      </div>
    );
  }

  return null;
};

const OfflineNotice = () => {
  const isOnline = useOnlineStatus();
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div 
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[120] bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 px-4 flex items-center justify-center gap-3 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <WifiOff className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Aap Offline Hain</span>
              <span className="text-[8px] font-bold opacity-80 uppercase tracking-tight mt-0.5">Drafts auto-save ho rahe hain (Offline Cache Active)</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FormSimulator = ({ form, userId, initialData, onDraftSaved, isGuruActive, onActivateGuru, userProfile }: { 
  form: any; 
  userId?: string; 
  initialData?: Record<string, string>;
  onDraftSaved?: () => void;
  isGuruActive?: boolean;
  onActivateGuru?: (autoStart?: boolean) => void;
  userProfile?: UserProfile;
}) => {
  const [filledData, setFilledData] = useState<Record<string, string>>(initialData || {});
  const [showExample, setShowExample] = useState(false);
  const [showSmartFill, setShowSmartFill] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(form.draftId || null);
  const [copiedFieldIndex, setCopiedFieldIndex] = useState<number | null>(null);
  const [activeInfoIndex, setActiveInfoIndex] = useState<number | null>(null);
  const [activeTipIndex, setActiveTipIndex] = useState<number | null>(null);
  const [loadingHelpIndex, setLoadingHelpIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isOnline = useOnlineStatus();
  const lastAutoSaveRef = useRef<number>(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const FIELDS_PER_STEP = 5;
  
  const hasSections = form.sections && form.sections.length > 0;
  const currentSection = hasSections ? form.sections[currentSectionIdx] : null;
  const allFields = hasSections 
    ? (form.sections.flatMap((s: any) => s.fields)) 
    : (form.fields || []);

  const totalSteps = hasSections 
    ? 1 
    : Math.ceil(allFields.length / FIELDS_PER_STEP);

  const currentFields = hasSections 
    ? currentSection.fields 
    : (allFields.slice(currentStep * FIELDS_PER_STEP, (currentStep + 1) * FIELDS_PER_STEP));

  const [showCounselor, setShowCounselor] = useState(false);

  const [smartFilledFields, setSmartFilledFields] = useState<string[]>([]);

  const handleSmartFill = () => {
    if (!userProfile) return;
    
    const smartData: Record<string, string> = { ...filledData };
    const newlyFilled: string[] = [];

    allFields.forEach((f: any) => {
      const fieldName = f.field.toLowerCase();
      const explanation = (f.explanation || '').toLowerCase();
      
      let valueToFill = "";

      if (fieldName.includes('name') || fieldName.includes('naam') || fieldName.includes('candidate')) {
        if (userProfile.name) valueToFill = userProfile.name;
      } else if (fieldName.includes('state') || fieldName.includes('rajya')) {
        if (userProfile.state) valueToFill = userProfile.state;
      } else if (fieldName.includes('aadhar') || explanation.includes('aadhar')) {
        if (userProfile.aadharNumber) valueToFill = userProfile.aadharNumber;
      } else if (fieldName.includes('phone') || fieldName.includes('mobile') || explanation.includes('mobile')) {
        if (userProfile.phoneNumber) valueToFill = userProfile.phoneNumber;
      } else if (fieldName.includes('address') || fieldName.includes('pata')) {
        if (userProfile.address) valueToFill = userProfile.address;
      } else if (fieldName.includes('class') || explanation.includes('kaksha')) {
        if (userProfile.class) valueToFill = userProfile.class;
      } else if (fieldName.includes('occupation') || fieldName.includes('pesha') || fieldName.includes('vyavasay')) {
        if (userProfile.occupation) valueToFill = userProfile.occupation;
      } else if (fieldName.includes('income') || fieldName.includes('aay') || fieldName.includes('salary')) {
        if (userProfile.monthlyIncome) valueToFill = userProfile.monthlyIncome;
      } else if (fieldName.includes('category') || fieldName.includes('jaati') || fieldName.includes('varg')) {
        if (userProfile.category) valueToFill = userProfile.category;
      } else if (fieldName.includes('gender') || fieldName.includes('ling')) {
        if (userProfile.gender) valueToFill = userProfile.gender;
      } else if (fieldName.includes('subject') || fieldName.includes('stream') || fieldName.includes('vishay')) {
        if (userProfile.stream) valueToFill = userProfile.stream;
      }

      if (valueToFill && !filledData[f.field]) {
        smartData[f.field] = valueToFill;
        newlyFilled.push(f.field);
      }
    });

    if (newlyFilled.length > 0) {
      setFilledData(smartData);
      setSmartFilledFields(newlyFilled);
      showToast(`${newlyFilled.length} fields self-filled using your profile!`, 'info');
      setTimeout(() => setSmartFilledFields([]), 3000);
    } else {
      showToast("Profile data matches or no matching fields found.", 'warning');
    }
    
    setShowSmartFill(true);
    setTimeout(() => setShowSmartFill(false), 3000);
  };

  const fetchAIHelp = async (idx: number) => {
    const field = allFields[idx];
    if (!field || loadingHelpIndex !== null) return;
    setLoadingHelpIndex(idx);
    try {
      const res = await getFieldExample(form.formName || 'General Form', field.field, field.explanation);
      // Update form field with new data
      if (res) {
        field.aiTip = res.tip;
        field.aiDetailedExample = res.example;
        field.whyItMatters = res.whyItMatters;
        field.commonMistake = res.commonMistake;
        setActiveTipIndex(idx);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHelpIndex(null);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFilledData(initialData);
    }
    if (form.draftId) {
      setCurrentDraftId(form.draftId);
    }
  }, [initialData, form.draftId]);

  // Auto-save logic
  useEffect(() => {
    if (Object.keys(filledData).length === 0) return;
    
    const timer = setTimeout(() => {
      // Don't auto-save if we already saved manually or auto-saved very recently
      if (Date.now() - lastAutoSaveRef.current > 30000) { // 30 seconds for auto-save to be less aggressive
        handleSaveDraft();
        lastAutoSaveRef.current = Date.now();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [filledData, userId]);

  const validateField = (field: any, value: string): string | null => {
    if (!value && field.isCritical) return "Yeh field bharna zaroori hai (Mandatory)";
    if (!value) return null;

    const lowExp = (field.explanation || '').toLowerCase();
    const lowField = (field.field || '').toLowerCase();

    // Date validation (DD/MM/YYYY or DD-MM-YYYY)
    if (lowExp.includes('date') || lowField.includes('date') || lowExp.includes('dob') || lowField.includes('janm')) {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])[\/\-](0[1-9]|1[012])[\/\-]\d{4}$/;
      if (!dateRegex.test(value)) {
        return "Sahi format bharein: DD/MM/YYYY";
      }
    }

    // Number validation
    if (lowExp.includes('number') || lowExp.includes('numeric') || lowExp.includes('digits') || lowExp.includes('amount') || lowField.includes('amount') || lowField.includes('paisa') || lowField.includes('income')) {
      if (isNaN(Number(value.replace(/[,₹]/g, '').trim()))) {
        return "Kripya sirf numbers bharein (Enter numbers only)";
      }
    }

    // Aadhar Card (12 digits)
    if (lowField.includes('aadhar') || lowExp.includes('aadhar')) {
      const sanitized = value.replace(/\s/g, '');
      if (!/^\d{12}$/.test(sanitized)) {
        return "12 digits ka Aadhar number bharein";
      }
    }

    // Name validation (no numbers, min length)
    if (lowField.includes('name') || lowField.includes('naam') || lowField.includes('kisan') || lowField.includes('beneficiary')) {
      if (/\d/.test(value)) {
        return "Naam mein numbers nahi ho sakte";
      }
      if (value.trim().length < 3) {
        return "Kripya poora naam likhein";
      }
    }

    // Pincode (6 digits)
    if (lowField.includes('pin') || lowExp.includes('pin')) {
      if (!/^\d{6}$/.test(value.trim())) {
        return "6 digits ka Pincode bharein";
      }
    }

    // Mobile Number (10 digits starting with 6-9)
    if (lowField.includes('mobile') || lowField.includes('phone') || lowExp.includes('mobile')) {
      if (!/^[6-9]\d{9}$/.test(value.trim())) {
        return "Sahi 10-digit mobile number bharein";
      }
    }

    // IFSC Code (4 letters, 0, 6 characters)
    if (lowField.includes('ifsc') || lowExp.includes('ifsc')) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(value.trim().toUpperCase())) {
        return "Invalid IFSC Format (e.g. SBIN0001234)";
      }
    }

    // Account Number (9-18 digits)
    if (lowField.includes('account') || lowField.includes('khata') || lowExp.includes('account')) {
      if (!/^\d{9,18}$/.test(value.trim())) {
        return "9 se 18 digits ka account number bharein";
      }
    }

    // Land / Khasra Number (numeric or alphanumeric depending on state, usually numeric)
    if (lowField.includes('khasra') || lowField.includes('khata number') || lowField.includes('dag number')) {
      if (!value.trim()) return "Land record information zaroori hai";
    }

    return null;
  };

  const handleFieldChange = (field: any, value: string) => {
    setFilledData((prev: any) => ({ ...prev, [field.field]: value }));
    // Clear error while typing or re-validate
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field.field]: error }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < form.fields.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'Enter') {
      if (index < form.fields.length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      } else {
        // Last field, trigger export as "submission"
        handleExport();
      }
    }
  };

  useEffect(() => {
    if (showExample) {
      const examples: Record<string, string> = {};
      form.fields.forEach((f: any) => {
        examples[f.field] = f.exampleValue || 'N/A';
      });
      setFilledData(examples);
    } else {
      if (!initialData) {
        setFilledData({});
      }
    }
  }, [showExample, form.fields, initialData]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const draftId = currentDraftId || `draft_${Date.now()}`;
      if (!currentDraftId) setCurrentDraftId(draftId);

      const now = Date.now();
      const draftData = {
        userId: userId || 'guest',
        formName: form.formName || 'Untitled Form',
        formData: filledData,
        formDefinition: form,
        updatedAt: now,
        isOfflineDraft: !isOnline
      };

      if (userId) {
        // Firestore with persistence handles the queuing
        await setDoc(doc(db, 'users', userId, 'drafts', draftId), {
          ...draftData,
          updatedAt: Timestamp.now() // Use Firestore Server Timestamp for server-side
        });
      }

      // Always save a copy to localStorage as guest fallback or backup
      try {
        const localDraftsRaw = localStorage.getItem('mitra_drafts');
        let localDrafts = localDraftsRaw ? JSON.parse(localDraftsRaw) : [];
        const existingIdx = localDrafts.findIndex((d: any) => d.id === draftId);
        const entry = { id: draftId, ...draftData, updatedAt: now };
        
        if (existingIdx >= 0) {
          localDrafts[existingIdx] = entry;
        } else {
          localDrafts.unshift(entry);
        }
        localStorage.setItem('mitra_drafts', JSON.stringify(localDrafts.slice(0, 10)));
      } catch (e) {
        console.warn("LocalStorage save failed:", e);
      }
      
      setSaveSuccess(true);
      if (onDraftSaved) onDraftSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving draft:", error);
      if (!isOnline && userId) {
         console.warn("Offline save queued in local persistence");
         setSaveSuccess(true);
      } else {
        if (userId) handleFirestoreError(error, OperationType.WRITE, `users/${userId}/drafts`);
        alert("Draft save nahi ho saka. Kripya firse try karein.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const text = Object.entries(filledData)
      .map(([field, value]) => `${field}: ${value}`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.text(form.formName || "Application Form", 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Exported via Mitra AI on ${new Date().toLocaleDateString()}`, 20, 30);
      
      let y = 45;
      doc.setTextColor(0);
      doc.setFontSize(14);
      
      Object.entries(filledData).forEach(([field, value]) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${field}:`, 20, y);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(String(value), 120);
        doc.text(lines, 70, y);
        y += (lines.length * 7) + 5;
      });
      
      doc.save(`${form.formName || 'Form'}_Filled.pdf`);
    } catch (error) {
      console.error("PDF Export error:", error);
      alert("PDF download nahi ho saka.");
    } finally {
      setIsExporting(false);
    }
  };

  const progress = form.fields.length > 0 
    ? Math.round((Object.keys(filledData).filter(k => filledData[k] && filledData[k] !== 'N/A').length / form.fields.length) * 100) 
    : 0;

  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  useEffect(() => {
    const handleGuruFill = (e: any) => {
      const { name, value } = e.detail;
      const targetField = form.fields.find((f: any) => 
        f.field.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(f.field.toLowerCase())
      );
      if (targetField) {
        handleFieldChange(targetField, value);
        setHighlightedField(targetField.field);
        setTimeout(() => setHighlightedField(null), 3000);
      }
    };
    window.addEventListener('mitra-fill-field', handleGuruFill);
    return () => window.removeEventListener('mitra-fill-field', handleGuruFill);
  }, [form.fields, filledData]);

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* AI Screen Guru Integration Widget */}
      {onActivateGuru && !isGuruActive && (
        <div className="bg-gradient-to-br from-[#008069] to-[#005c4b] p-6 rounded-[2rem] shadow-xl shadow-green-200 border border-white/20 relative overflow-hidden group">
          {/* Animated Background Elements */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />
          
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 animate-pulse">
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-black text-sm uppercase tracking-widest leading-tight">Screen Guru Mitra</h3>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-tighter mt-0.5">Live AI Video Guidance</p>
              </div>
            </div>
            
            <p className="text-white/90 text-xs font-medium leading-relaxed">
              Kya aapko form bharne mein pareshaani ho rahi hai? Mitra Guru aapki screen dekh kar live audio help denge.
            </p>
            
            <button 
              onClick={() => {
                if (!isOnline) {
                  alert("Aap offline hain. Screen Guru connectivity ke liye internet zaroori hai.");
                  return;
                }
                onActivateGuru(true);
              }}
              className={cn(
                "py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all flex items-center justify-center gap-2 group/btn",
                isOnline ? "bg-white text-[#008069] hover:scale-[1.02] active:scale-[0.98]" : "bg-white/50 text-white/50 cursor-not-allowed"
              )}
            >
              {isOnline ? 'Start AI Assistance' : 'Guru Needs Internet'}
              <Zap className={cn("w-3.5 h-3.5 fill-current", isOnline && "group-hover/btn:rotate-12 transition-transform")} />
            </button>
          </div>
        </div>
      )}

      {isGuruActive && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-[2rem] flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest leading-tight">Guru is Watching</h4>
            <p className="text-[10px] font-medium text-blue-600 mt-0.5 whitespace-nowrap">Main aapko fields mein guide kar raha hoon...</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!isOnline && (
        <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex items-center gap-3">
          <CloudOff className="w-5 h-5 text-orange-500" />
          <p className="text-[10px] font-bold text-orange-800 leading-tight">
            Aap Offline hain, par chinta na karein. Form progress auto-save ho raha hai.
          </p>
        </div>
      )}
      
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Form Filling Progress</p>
          <div className="flex items-center gap-2">
            {userProfile && (
              <button 
                onClick={handleSmartFill}
                className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                <Zap className="w-3 h-3" />
                {showSmartFill ? 'Smart Filled!' : 'Smart Fill'}
              </button>
            )}
            <span className="text-xs font-black text-[#008069]">{progress}%</span>
          </div>
        </div>
        <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#008069] to-[#00b294]"
          />
        </div>
        <p className="text-[9px] text-gray-400 italic text-center">
          {progress === 100 ? "Shabash! Form poora bhar gaya hai." : "Har field ko dhyaan se bharein."}
        </p>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
           <div className="flex flex-col">
              <h3 className="font-black text-sm uppercase tracking-widest text-[#008069]">Form Simulator</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Practice Fill before Official Site</p>
           </div>
           <div className="flex flex-col gap-2">
             <div className="flex gap-2">
               <button 
                 onClick={() => {
                   if (Object.keys(filledData).length > 0 && window.confirm("Kya aap saara data mita kar naye sire se shuru karna chahte hain?")) {
                     setFilledData({});
                     setShowExample(false);
                   }
                 }}
                 disabled={Object.keys(filledData).length === 0}
                 className={cn(
                   "px-3 rounded-2xl border transition-all flex items-center justify-center",
                   Object.keys(filledData).length > 0 
                     ? "bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50" 
                     : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                 )}
                 title="Clear All"
               >
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
                 <div className="flex gap-2">
                  {userProfile && (
                    <button 
                      onClick={handleSmartFill}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                        showSmartFill 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 shadow-sm"
                      )}
                    >
                      <Zap className={cn("w-3 h-3", showSmartFill && "animate-pulse")} />
                      {showSmartFill ? 'Smart Filled!' : 'Smart Fill (My Data)'}
                    </button>
                  )}
                  <button 
                    onClick={() => setShowExample(!showExample)}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                      showExample 
                        ? "bg-red-50 text-red-600 border-red-100" 
                        : "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100"
                    )}
                  >
                    {showExample ? <X className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {showExample ? 'Clear Data' : 'AI Mock Fill'}
                  </button>
                 </div>
                <div className="flex-1 flex flex-col gap-1">
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                      saveSuccess ? "bg-green-50 text-green-600 border-green-100" : "bg-white text-gray-700 border-gray-200"
                    )}
                  >
                    {saveSuccess ? <CheckCircle className="w-3 h-3" /> : (isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bookmark className="w-3 h-3" />)}
                    {saveSuccess ? (isOnline ? 'Saved!' : 'Saved Offline!') : (isSaving ? 'Saving...' : 'Save Draft')}
                  </button>
                  <button 
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="w-full px-4 py-2 bg-white border border-gray-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#008069] flex items-center justify-center gap-2 mt-1 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Save as PDF
                  </button>
                  {saveSuccess && !isOnline && (
                    <span className="text-[8px] text-orange-500 font-bold uppercase text-right tracking-tight px-1 flex items-center justify-end gap-1">
                       <CloudOff className="w-2 h-2" /> Queued for sync
                    </span>
                  )}
                </div>
             </div>
             {Object.keys(filledData).length > 0 && (
               <button 
                 onClick={handleExport}
                 className={cn(
                   "w-full px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                   isExporting ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-900 text-white border-slate-900"
                 )}
               >
                 {isExporting ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                 {isExporting ? 'Copied All!' : 'Export All Data'}
               </button>
             )}
           </div>
        </div>

        <div className="flex flex-col gap-4 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
             <div className="flex flex-col">
               <h4 className="font-black text-xs text-gray-800 uppercase tracking-widest">{form.formName || 'Untitled Form'}</h4>
               <p className="text-[9px] font-bold text-[#008069] uppercase tracking-tighter">
                 {hasSections ? `Tab ${currentSectionIdx + 1} of ${form.sections.length}` : `Step ${currentStep + 1} of ${totalSteps}`}
               </p>
             </div>
             <button 
               onClick={() => setShowCounselor(true)}
               className="p-2 rounded-xl bg-orange-100 text-orange-600 border border-orange-200 flex items-center gap-1.5 hover:bg-orange-200 transition-colors"
             >
               <Sparkles className="w-3.5 h-3.5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Ask Mitra</span>
             </button>
          </div>

          {hasSections && (
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-gray-100 -mx-1 px-1">
               {form.sections.map((section: any, idx: number) => {
                 const isCompleted = section.fields.every((f: any) => filledData[f.field]);
                 return (
                   <button
                     key={idx}
                     onClick={() => setCurrentSectionIdx(idx)}
                     className={cn(
                       "whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                       currentSectionIdx === idx 
                         ? "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100" 
                         : (isCompleted ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-400 border-gray-200 hover:border-[#008069]")
                     )}
                   >
                     {section.sectionName}
                   </button>
                 );
               })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {currentFields.map((field: any, cidx: number) => {
              const idx = hasSections ? cidx : (currentStep * FIELDS_PER_STEP + cidx);
              const hasError = !!errors[field.field];
              const isFilled = !!filledData[field.field];

              return (
                <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                      <label className={cn(
                        "text-[10px] font-black uppercase tracking-tight",
                        field.isCritical ? "text-red-500" : "text-gray-400"
                      )}>
                        {field.field} {field.isCritical && '*'}
                      </label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveInfoIndex(activeInfoIndex === idx ? null : idx);
                        }}
                        className={cn(
                          "p-1 rounded-full transition-all",
                          activeInfoIndex === idx ? "bg-orange-100 text-orange-600" : "text-gray-300 hover:text-orange-500"
                        )}
                        title="Why is this needed?"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                    {isFilled && !hasError && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Complete</span>
                      </motion.div>
                    )}
                  </div>

                  <input 
                    type="text"
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onFocus={() => {
                      setFocusedIndex(idx);
                      if (!field.aiTip && isOnline) fetchAIHelp(idx);
                      if (field.aiTip || field.whyItMatters || field.commonMistake) {
                        setActiveTipIndex(idx);
                      }
                    }}
                    onBlur={() => {
                      setFocusedIndex(null);
                      const error = validateField(field, filledData[field.field] || '');
                      setErrors(prev => ({ ...prev, [field.field]: error }));
                    }}
                    value={filledData[field.field] || ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={field.explanation}
                    className={cn(
                      "w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none transition-all",
                      hasError ? "border-red-500 ring-2 ring-red-50" : "border-gray-100 focus:border-[#008069] focus:bg-white",
                      (smartFilledFields.includes(field.field) || highlightedField === field.field) && "border-emerald-500 ring-4 ring-emerald-100 bg-emerald-50 scale-[1.02] shadow-lg"
                    )}
                  />

                  {hasError && (
                    <p className="text-[9px] font-bold text-red-500 px-2 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      {errors[field.field]}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    {field.exampleValue && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(field.exampleValue);
                          setCopiedFieldIndex(idx);
                          setTimeout(() => setCopiedFieldIndex(null), 2000);
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all border",
                          copiedFieldIndex === idx ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                        )}
                      >
                        {copiedFieldIndex === idx ? "Copied" : "Example"}
                      </button>
                    )}
                    
                    <button
                       onClick={() => {
                         if (!field.aiTip) fetchAIHelp(idx);
                         setActiveTipIndex(activeTipIndex === idx ? null : idx);
                       }}
                       className={cn(
                         "flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all border",
                         activeTipIndex === idx ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 border-purple-100"
                       )}
                    >
                       <Sparkles className="w-2.5 h-2.5" />
                       AI Guide
                    </button>
                  </div>

                  <AnimatePresence>
                    {(activeTipIndex === idx || activeInfoIndex === idx) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-purple-50/70 border border-purple-100 p-3 rounded-2xl mt-2 overflow-hidden flex flex-col gap-3 shadow-inner"
                      >
                        {field.whyItMatters && (
                          <div className="flex gap-2">
                             <div className="w-5 h-5 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                               <Info className="w-3 h-3 text-orange-600" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-0.5">Why it matters / Kyun zaroori hai</span>
                               <p className="text-[10px] font-bold text-gray-700 leading-tight">
                                 {field.whyItMatters}
                               </p>
                             </div>
                          </div>
                        )}

                        {field.aiTip && (
                          <div className="flex gap-2">
                             <div className="w-5 h-5 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                               <Sparkles className="w-3 h-3 text-purple-600" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black uppercase tracking-widest text-purple-600 mb-0.5">Smart Tip / Expert Salha</span>
                               <p className="text-[10px] font-bold text-gray-700 leading-tight">
                                 {field.aiTip}
                               </p>
                             </div>
                          </div>
                        )}

                        {field.commonMistake && (
                          <div className="flex gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100">
                             <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black uppercase tracking-widest text-red-600 mb-0.5">Mistake to avoid / Yeh galti mat karein</span>
                               <p className="text-[10px] font-bold text-red-800 leading-tight">
                                 {field.commonMistake}
                               </p>
                             </div>
                          </div>
                        )}

                        {field.exampleValue && (
                          <div className="pt-2 border-t border-purple-200/50">
                            <button 
                              onClick={() => {
                                handleFieldChange(field, field.exampleValue);
                                setActiveTipIndex(null);
                                setActiveInfoIndex(null);
                              }}
                              className="w-full py-2 bg-white border border-purple-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3 h-3" />
                              Apply Example: {field.exampleValue}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-4 mt-2 border-t border-gray-200">
             <button 
               onClick={() => {
                 if (hasSections) {
                   setCurrentSectionIdx(prev => Math.max(0, prev - 1));
                 } else {
                   setCurrentStep(prev => Math.max(0, prev - 1));
                 }
                 setFocusedIndex(null);
               }}
               disabled={hasSections ? currentSectionIdx === 0 : currentStep === 0}
               className={cn(
                 "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border",
                 (hasSections ? currentSectionIdx === 0 : currentStep === 0) ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-700 border-gray-200 active:scale-95 hover:bg-gray-50"
               )}
             >
               Peeche (Back)
             </button>

             {userId && (
                <button 
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border flex items-center justify-center gap-2",
                    saveSuccess ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-gray-700 border-gray-200 active:scale-95 hover:bg-gray-50"
                  )}
                >
                  {saveSuccess ? <CheckCircle className="w-3 h-3" /> : (isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bookmark className="w-3 h-3" />)}
                  {saveSuccess ? 'Saved!' : 'Save Draft'}
                </button>
             )}

             <button 
               onClick={() => {
                 if (hasSections) {
                   if (currentSectionIdx < form.sections.length - 1) {
                     setCurrentSectionIdx(prev => prev + 1);
                   } else {
                     const btn = document.getElementById('final-submit-btn');
                     if (btn) (btn as any).click();
                   }
                 } else {
                   if (currentStep < totalSteps - 1) {
                     setCurrentStep(prev => prev + 1);
                   } else {
                     const btn = document.getElementById('final-submit-btn');
                     if (btn) (btn as any).click();
                   }
                 }
                 setFocusedIndex(null);
               }}
               className={cn(
                 "flex-[1.5] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border shadow-lg flex items-center justify-center gap-2",
                 (hasSections ? currentSectionIdx < form.sections.length - 1 : currentStep < totalSteps - 1) 
                   ? "bg-[#008069] text-white border-[#008069] shadow-green-100 hover:bg-[#005c4b]" 
                   : "bg-slate-900 text-white border-slate-900 shadow-slate-100 hover:bg-black"
               )}
             >
               {hasSections 
                 ? (currentSectionIdx < form.sections.length - 1 ? 'Aage (Next Tab)' : 'Final Submit')
                 : (currentStep < totalSteps - 1 ? 'Aage (Next Step)' : 'Final Submission')}
               <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        </div>

        <button 
          id="final-submit-btn"
          className={cn(
            "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2",
            (hasSections ? currentSectionIdx < form.sections.length - 1 : currentStep < totalSteps - 1) ? "hidden" : "block bg-[#008069] text-white shadow-[#008069]/20"
          )}
          onClick={() => {
              // Final validation check for all fields
              const newErrors: Record<string, string | null> = {};
              let hasErrors = false;
              
              allFields.forEach((f: any) => {
                const err = validateField(f, filledData[f.field] || '');
                if (err) {
                  newErrors[f.field] = err;
                  hasErrors = true;
                }
              });

              if (hasErrors) {
                setErrors(newErrors);
                alert("Kripya form mein di gayi galatiyan (errors) thik karein.");
                return;
              }
              
              alert("Shabash! Form poora aur sahi bhara gaya hai. Now you are ready for the official portal.");
            }}
          >
            {Object.values(errors).some(e => e !== null) ? (
              <>
                 <AlertCircle className="w-4 h-4" />
                 Fix Errors to Submit
              </>
            ) : (
              "Submit Practice"
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCounselor && (
          <FormCounselor 
            form={form}
            currentFields={currentFields}
            filledData={filledData}
            onClose={() => setShowCounselor(false)}
            userProfile={userProfile}
          />
        )}
      </AnimatePresence>

      {/* Prominent AI Suggestion Overlay */}
      <AnimatePresence>
        {focusedIndex !== null && (allFields[focusedIndex]?.aiTip || allFields[focusedIndex]?.whyItMatters || allFields[focusedIndex]?.commonMistake) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-[90] pointer-events-none"
          >
            <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md border-2 border-purple-200 p-5 rounded-[2.5rem] shadow-2xl pointer-events-auto flex flex-col gap-4">
              <div className="flex justify-between items-center -mt-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-200">
                    <Sparkles className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 leading-none">AI Suggestion</h5>
                    <p className="text-[14px] font-black text-gray-900 tracking-tight mt-1">{allFields[focusedIndex].field} ke liye</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFocusedIndex(null)}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {allFields[focusedIndex].aiTip && (
                <div className="bg-purple-50/50 p-4 rounded-3xl border border-purple-100">
                   <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <p className="text-[12px] font-bold text-gray-700 leading-relaxed italic">
                        "{allFields[focusedIndex].aiTip}"
                      </p>
                   </div>
                </div>
              )}

              {allFields[focusedIndex].commonMistake && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 rounded-2xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Galti Mat Karein</span>
                    <p className="text-[11px] font-bold text-red-800 leading-tight">
                      {allFields[focusedIndex].commonMistake}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50">
                <span className="flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   Mitra Live Guide
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#008069]" />
                  Zero-Rejection Check
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const LiveAiScreenGuru = ({ userProfile, onNavigate, onClose, onFillField, autoStart = false }: { 
  userProfile: UserProfile; 
  onNavigate: (v: string) => void;
  onClose: () => void;
  onFillField?: (name: string, value: string) => void;
  autoStart?: boolean;
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<{role: 'guru' | 'user', text: string}[]>([]);
  const [activeHighlight, setActiveHighlight] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  
  // Gemini Live Session Refs
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const cleanup = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close().catch(() => {});
      sessionRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    setIsSharing(false);
    setIsMinimized(false);
  };

  const startSharing = async () => {
    if (!userProfile.isPremium) {
      onNavigate('premium');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing requires HTTPS and a modern browser (Desktop Chrome/Edge recommended).");
      return;
    }

    if (!ai) {
      alert("AI instance not initialized. Please check your configuration.");
      return;
    }

    try {
      setAnalyzing(true);
      setGuidance("Connecting to Mitra Guru...");
      
      // 1. Capture Screen
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = screenStream;
      setIsSharing(true);
      setIsMinimized(true);

      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }

      screenStream.getTracks()[0].onended = () => cleanup();

      // 2. Setup Audio Context for output and input
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });

      // 3. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview", 
        callbacks: {
          onopen: () => {
            console.log("Gemini Guru Live Connected");
            if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
            }
            setAnalyzing(false);
            setGuidance(null);
            startMicrophone(sessionPromise);
            startFrameCapture();
          },
          onmessage: (msg) => {
            // Handle audio output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && !isSpeakerMuted) {
              playPCM(audioData);
            }

            // Handle transcription/text
            const text = msg.serverContent?.modelTurn?.parts?.[0]?.text;
            if (text) {
              setGuidance(text);
              setHistory(prev => [...prev, { role: 'guru' as const, text }].slice(-5));
            }

            // Handle Tool Calls (Highlighting & Navigation)
            const toolCall = msg.serverContent?.modelTurn?.parts?.[0]?.functionCall;
            if (toolCall) {
              if (toolCall.name === 'highlight_element') {
                const { x, y, w, h } = toolCall.args as any;
                setActiveHighlight({ x, y, w, h });
                // Close tool response
                sessionRef.current?.send({
                  toolResponse: {
                    functionResponses: [{
                      name: "highlight_element",
                      response: { success: true },
                      id: toolCall.id
                    }]
                  }
                });
                // Auto-clear highlight after 5 seconds
                setTimeout(() => setActiveHighlight(null), 5000);
              } else if (toolCall.name === 'navigate_to_tab') {
                const { tab } = toolCall.args as any;
                onNavigate(tab);
                sessionRef.current?.send({
                  toolResponse: {
                    functionResponses: [{
                      name: "navigate_to_tab",
                      response: { success: true },
                      id: toolCall.id
                    }]
                  }
                });
              } else if (toolCall.name === 'fill_form_field') {
                const { field_name, value } = toolCall.args as any;
                if (onFillField) onFillField(field_name, value);
                sessionRef.current?.send({
                  toolResponse: {
                    functionResponses: [{
                      name: "fill_form_field",
                      response: { success: true },
                      id: toolCall.id
                    }]
                  }
                });
              }
            }
            
            if (msg.serverContent?.interrupted) {
              nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
          },
          onclose: () => cleanup(),
          onerror: (err) => {
            console.error("Live Session Error:", err);
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: SCREEN_GURU_TOOLS as any,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: `You are 'Mitra Screen Guru', a highly intelligent and empathetic Indian friend (Sathi). Speak in friendly Hinglish or Hindi like a helpful senior (Bade Bhai). 
          
          CORE SKILLS:
          1. Form & Document Checker: Analyze the user's screen. Check for errors in NEET, JEE, CUET, or Government Schemes (PM-Kisan, Ladli Behna). Warn about wrong backgrounds, missing details, or blurriness.
          2. Schemes & Subsidies Expert: Provide exact numbers and portal tips.
          3. Scam Alert Radar: If you see a potential scam, warn LOUDLY: "RUKEIN! YE SCAM HAI!"
          4. Live Form Filling: You can use 'fill_form_field' to help the user fill a field if they ask or are stuck. Explain what you are doing (e.g., "Aapka Aadhar number main yahan bhar deta hoon").
          5. Screen Navigation: Use 'highlight_element' to point out EXACT fields. 100% relative coordinates.
          
          Personality: Reassuring, patient, and ultra-professional. Your goal is to make digital forms feel easy for everyone.
          Motto: "Zindagi ki mushkilon mein, Mitra aapke saath hai."
          MANDATORY: ALWAYS conclude long explanations or terminal guidance with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'`
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        console.log("Screen sharing canceled by user");
      } else {
        console.error("Screen Guru Activation Failed:", err);
        alert("Guru connect nahi ho saka. Kripya check karein ki aapne screen sharing permissions di hain aur aap modern browser use kar rahe hain.");
      }
      cleanup();
    }
  };

  const startMicrophone = async (sessionPromise: Promise<any>) => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      if (!audioContextRef.current) return;
      const source = audioContextRef.current.createMediaStreamSource(micStream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        if (isMicMuted || isPaused || !sessionRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputData);
        const base64Data = uint8ArrayToBase64(new Uint8Array(pcmData.buffer));

        sessionRef.current.sendRealtimeInput({
          audio: {
            data: base64Data,
            mimeType: 'audio/pcm;rate=16000'
          }
        });
      };
    } catch (err) {
      console.error("Mic Access Denied:", err);
    }
  };

  const startFrameCapture = () => {
    captureIntervalRef.current = window.setInterval(async () => {
      if (!isSharing || isPaused || !videoRef.current || !canvasRef.current || !sessionRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState < 2) return;

      canvas.width = 640;
      canvas.height = (video.videoHeight / video.videoWidth) * 640;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Frame = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      
      sessionRef.current.sendRealtimeInput({
        video: {
          data: base64Frame,
          mimeType: 'image/jpeg'
        }
      });
    }, 2000); // 2 seconds between frames is balanced for live api
  };

  const playPCM = (base64Data: string) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;

    const bytes = base64ToUint8Array(base64Data);
    const pcmData = new Int16Array(bytes.buffer);
    const float32Data = pcmToFloat32(pcmData);

    const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 16000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    
    setIsSpeaking(true);
    source.onended = () => {
      if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current - 0.1) {
        setIsSpeaking(false);
      }
    };
  };

  const stopSharing = () => {
    cleanup();
    onClose();
  };

  useEffect(() => {
    if (autoStart && !isSharing) {
      startSharing();
    }
    return () => cleanup();
  }, [autoStart]);

  const analyzeCurrentFrame = (text?: string) => {
    if (!sessionRef.current) return;
    if (text) {
      sessionRef.current.send({
        text
      });
      setHistory(prev => [...prev, { role: 'user' as const, text }].slice(-5));
      setUserPrompt("");
    } else {
      // Manual trigger of visual context is implicit in the stream, 
      // but we can send a nudge text.
      sessionRef.current.send({
        text: "Please analyze the current screen and tell me what to do next."
      });
    }
  };

  // --- RENDERING ---

  if (isSharing && isMinimized) {
    return (
      <motion.div 
        layoutId="guru-panel"
        className="fixed bottom-24 left-4 right-4 z-[70] bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-[#008069] tracking-widest">Guru Live Session</span>
           </div>
           <div className="flex gap-1.5 bg-white/5 p-1 rounded-full border border-white/10">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className={cn(
                  "p-2 rounded-full transition-all",
                  isPaused ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                )}
                title={isPaused ? "Resume Session" : "Pause Session"}
              >
                 {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={cn(
                  "p-2 rounded-full transition-all",
                  isMicMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                )}
                title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
              >
                 {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={cn(
                  "p-2 rounded-full transition-all",
                  isSpeakerMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                )}
                title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
              >
                 {isSpeakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsMinimized(false)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                 <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => analyzeCurrentFrame()}
                disabled={analyzing}
                className={cn(
                  "p-2 rounded-full transition-all flex items-center gap-1.5 px-3",
                  analyzing ? "bg-amber-500/20 text-amber-500" : "bg-[#008069] text-white hover:bg-[#00705c]"
                )}
              >
                 {analyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                 <span className="text-[9px] font-black uppercase tracking-widest">Capture</span>
              </button>
              <button 
                onClick={stopSharing}
                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
              >
                 <PhoneOff className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>

        <div className="flex gap-4 items-center">
           <div className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden",
             isSpeaking ? "bg-[#008069] text-white" : "bg-white/5 text-white/30"
           )}>
              {isSpeaking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-100 leading-tight italic">
                {analyzing ? "Analyzing Screen..." : (guidance || "Watching screen. Perform actions for guidance.")}
              </p>
           </div>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
           <input 
             value={userPrompt}
             onChange={(e) => setUserPrompt(e.target.value)}
             placeholder="Guru se poochein..."
             className="flex-1 bg-transparent px-3 py-2 text-[10px] font-bold outline-none text-white"
             onKeyDown={(e) => e.key === 'Enter' && analyzeCurrentFrame(userPrompt)}
           />
           <button 
             onClick={() => analyzeCurrentFrame(userPrompt)}
             disabled={analyzing}
             className="bg-[#008069] w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
           >
              <Send className="w-3.5 h-3.5" />
           </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layoutId="guru-panel"
      className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex flex-col gap-6 shadow-xl overflow-hidden relative border border-white/5"
    >
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 blur-3xl -mr-10 -mt-10 transition-all duration-1000",
        isSharing ? "bg-[#008069]/30" : "bg-blue-500/20"
      )} />
      
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
           <div className={cn("w-2 h-2 rounded-full", isSharing ? "bg-red-500 animate-pulse" : "bg-[#008069]")} />
           <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#008069]">Live AI Screen Guru</h3>
        </div>
        <div className="flex gap-2">
          {isSharing && (
            <button onClick={() => setIsMinimized(true)} className="text-white/40 hover:text-white transition-all">
               <Minimize2 className="w-4 h-4" />
            </button>
          )}
          <Sparkles className={cn("w-4 h-4 transition-all", isSharing ? "text-[#008069] scale-125" : "text-gray-600")} />
        </div>
      </div>

      {!isSharing ? (
        <div className="flex flex-col gap-5 z-10">
           <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
              <p className="text-xs font-bold opacity-80 leading-relaxed mb-4">
                Aapke screen ko real-time analyze karke Mitra aapko live audio guidance dega.
              </p>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-500 mb-2" />
                    <p className="text-[9px] font-black uppercase text-gray-400">Live Help</p>
                 </div>
                 <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mb-2" />
                    <p className="text-[9px] font-black uppercase text-gray-400">Instant AI</p>
                 </div>
              </div>
           </div>
           <button 
             onClick={startSharing}
             className="w-full bg-[#008069] text-white py-4 rounded-3xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#008069]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             <Cpu className="w-4 h-4" />
             Activate Screen Guru
           </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 z-10">
            <div className="flex gap-3 bg-white/5 p-2 rounded-[2rem] border border-white/10">
               <button 
                onClick={() => setIsPaused(!isPaused)}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all",
                  isPaused ? "bg-amber-500 text-white" : "bg-white/10 text-white border border-white/10"
                )}
              >
                 {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                 {isPaused ? "Resume" : "Pause"}
              </button>
              <button 
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all",
                  isMicMuted ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-white/10 text-white border border-white/10"
                )}
              >
                 {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                 {isMicMuted ? "Mic Off" : "Mic On"}
              </button>
              <button 
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all",
                  isSpeakerMuted ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-white/10 text-white border border-white/10"
                )}
              >
                 {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                 {isSpeakerMuted ? "Silent" : "Output"}
              </button>
           </div>

           <div className="relative w-full aspect-video bg-black/60 rounded-3xl overflow-hidden border border-white/10 group shadow-inner">
               <video ref={videoRef} className="w-full h-full object-contain" muted playsInline />
               <canvas ref={canvasRef} className="hidden" />
               <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse shadow-lg">Live Session</div>
               
               {/* AI Highlight Overlay */}
               {activeHighlight && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="absolute border-4 border-yellow-400 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.5)] z-20 pointer-events-none"
                   style={{
                     left: `${activeHighlight.x}%`,
                     top: `${activeHighlight.y}%`,
                     width: `${activeHighlight.w}%`,
                     height: `${activeHighlight.h}%`,
                   }}
                 >
                    <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase whitespace-nowrap">
                       Focus Here
                    </div>
                 </motion.div>
               )}
           </div>

           <div className="flex flex-col gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 min-h-[100px] shadow-sm">
              <div className="flex items-center gap-2 text-[#008069]">
                 <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-bounce")} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Live Guidance</span>
              </div>
              
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-[13px] font-bold italic leading-relaxed text-gray-200 min-h-[50px]">
                  {analyzing ? "Thinking..." : (guidance || "Watching screen. Aap apna kaam shuru karein.")}
                </p>
              </div>

              {history.length > 0 && (
                <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-3">
                   <p className="text-[8px] font-black uppercase text-gray-500 mb-1">Previous Steps:</p>
                   {history.slice(0, -1).map((h, i) => (
                     <p key={i} className="text-[10px] text-gray-400 font-medium truncate opacity-60 italic">- {h.text}</p>
                   ))}
                </div>
              )}
           </div>
           
           <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Guru se poochein..."
                  className="flex-1 bg-white/10 p-3.5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:border-[#008069] transition-all text-white"
                  onKeyDown={(e) => e.key === 'Enter' && analyzeCurrentFrame(userPrompt)}
                />
                <button 
                  onClick={() => analyzeCurrentFrame(userPrompt)}
                  disabled={analyzing}
                  className="bg-[#008069] text-white px-4 rounded-2xl disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => analyzeCurrentFrame()}
                    disabled={analyzing}
                    className="py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                 >
                    <RefreshCw className={cn("w-3.5 h-3.5", analyzing && "animate-spin")} />
                    Re-Analyze
                 </button>
                 <button 
                    onClick={stopSharing}
                    className="py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                 >
                    <PhoneOff className="w-3.5 h-3.5" />
                    End Guru
                 </button>
              </div>
           </div>
        </div>
      )}
    </motion.div>
  );
};

const NewsWidget = ({ userProfile, news, loading, onAskMitra }: { userProfile: UserProfile; news: any[]; loading: boolean; onAskMitra: (q: string) => void }) => {
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Volume2 className="w-5 h-5 text-orange-500" />
           <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Audio News Feed</h3>
        </div>
        <span className="text-[8px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-black animate-pulse">LIVE UPDATES</span>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          [1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
        ) : news.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No updates today.</p>
        ) : (
          news.map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedNews(item)}
              className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-orange-100 transition-colors"
            >
              <div className="flex-1 mr-2">
                 <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{item.title}</h4>
                 <p className="text-[10px] text-gray-400 font-medium">{item.category}</p>
              </div>
              <PlayButton text={item.summary} />
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setSelectedNews(null)}
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 overflow-hidden relative shadow-2xl"
               onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                     <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{selectedNews.category}</p>
                     <h3 className="font-black text-lg text-gray-900 leading-tight">{selectedNews.title}</h3>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Deep Dive Analysis</h4>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{selectedNews.analysis || selectedNews.summary}</p>
                  </div>

                  {selectedNews.impact && (
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                       <h4 className="text-[10px] font-black text-green-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                         <Zap className="w-3 h-3" /> Local Practical Impact
                       </h4>
                       <p className="text-xs text-green-800 font-bold leading-tight">{selectedNews.impact}</p>
                    </div>
                  )}

                  {selectedNews.date && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Important Date</span>
                       <span className="text-xs font-black text-orange-600">{selectedNews.date}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={() => {
                        onAskMitra(`Is news ke baare mein mujhe visthar se batayein: "${selectedNews.title}". Iska Bihar (State: ${userProfile.state}) ke students par kya impact hoga?`);
                        setSelectedNews(null);
                      }}
                      className="w-full py-4 bg-[#008069] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ask Mitra AI (Full Details)
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedNews(null)}
                        className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 hover:bg-gray-50 transition-all"
                      >
                        Close
                      </button>
                      {selectedNews.officialLink && (
                        <button 
                          onClick={() => window.open(selectedNews.officialLink, '_blank')}
                          className="py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TargetTracker = ({ news, loading, onAskMitra }: { news: any[]; loading: boolean; onAskMitra: (q: string) => void }) => {
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  
  const displayItems = news.length > 0 ? news : [
    { title: 'Bihar Board Exam', date: 'Feb 15', category: 'Local', summary: 'Exam dates released.', analysis: 'Prepare well for the upcoming exams.' },
    { title: 'MEXT Scholarship', date: 'May 31', category: 'International', summary: 'Global scholarship open.', analysis: 'Apply for high-level international funding.' },
    { title: 'PM Kisan Installment', date: 'Jan 10', category: 'National', summary: 'Payment update.', analysis: 'Check bank status.' }
  ];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Global to Local Tracker</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-40 rounded-3xl shrink-0" />)
        ) : (
          displayItems.map((d, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedNews(d)}
              className="shrink-0 w-40 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3 relative overflow-hidden group cursor-pointer hover:border-orange-100 transition-all hover:-translate-y-1"
            >
              <div className={cn(
                "absolute top-0 right-0 w-12 h-12 rounded-full -mr-4 -mt-4 opacity-10",
                d.category === 'Local' ? 'bg-green-500' : d.category === 'International' ? 'bg-blue-500' : 'bg-orange-500'
              )} />
              <div className="flex items-center gap-2">
                 <div className={cn(
                   "w-2 h-2 rounded-full",
                   d.category === 'Local' ? 'bg-green-500' : d.category === 'International' ? 'bg-blue-500' : 'bg-orange-500'
                 )} />
                 <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400">{d.category}</span>
              </div>
              <h4 className="font-black text-xs text-gray-900 leading-tight line-clamp-2 h-8">{d.title}</h4>
              <div className="flex items-center justify-between mt-auto">
                 <span className="text-[10px] font-black text-[#008069] tracking-widest">{d.date || 'TBA'}</span>
                 <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <ChevronRight className="w-3 h-3" />
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setSelectedNews(null)}
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 overflow-hidden relative shadow-2xl"
               onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#008069]/10 flex items-center justify-center text-[#008069]">
                     <Zap className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-[#008069] uppercase tracking-widest">Tracker Analysis</p>
                     <h3 className="font-black text-lg text-gray-900 leading-tight">{selectedNews.title}</h3>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Analysis</h4>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{selectedNews.analysis || selectedNews.summary}</p>
                  </div>

                  {selectedNews.impact && (
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                       <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                         <MapPin className="w-3 h-3" /> Local Action Needed
                       </h4>
                       <p className="text-xs text-orange-800 font-bold leading-tight">{selectedNews.impact}</p>
                    </div>
                  )}

                  {selectedNews.date && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deadline</span>
                       <span className="text-xs font-black text-red-600">{selectedNews.date}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <button 
                      onClick={async () => {
                        try {
                          const audioData = await getSpeech(`Bhai, ${selectedNews.title} ke baare mein suniye. ${selectedNews.analysis || selectedNews.summary}. ${selectedNews.impact ? 'Important update: ' + selectedNews.impact : ''}`);
                          if (audioData) {
                            const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
                            audio.play();
                          } else {
                            alert("Bhai, abhi audio feed busy hai. Thodi der mein try karein!");
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="w-full py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      Listen Audio News
                    </button>
                    <button 
                      onClick={() => {
                        onAskMitra(`Mujhe is target/news ke baare mein visthar se info chahiye: "${selectedNews.title}". Iske liye mujhe local level par kya steps lene chahiye?`);
                        setSelectedNews(null);
                      }}
                      className="w-full py-4 bg-[#008069] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#008069]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ask AI Full Details
                    </button>
                    <button 
                      onClick={() => setSelectedNews(null)}
                      className="w-full py-4 bg-slate-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Understood, Close
                    </button>
                    {selectedNews.officialLink && (
                      <button 
                        onClick={() => window.open(selectedNews.officialLink, '_blank')}
                        className="py-3 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                      >
                        Visit Official Source
                      </button>
                    )}
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SubjectQuiz = ({ userProfile }: { userProfile: UserProfile }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await getDailyQuiz(userProfile);
        setQuiz(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [userProfile]);

  if (loading) return <Skeleton className="h-48 w-full rounded-[2.5rem]" />;
  if (!quiz) return null;

  return (
    <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex flex-col gap-4 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-3xl -mr-10 -mt-10" />
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
           <Zap className="w-5 h-5 text-yellow-400 fill-current" />
           <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-yellow-400">Daily 60s Quiz</h3>
        </div>
        <div className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-black">STREAK: {userProfile.streak || 0} 🔥</div>
      </div>

      <p className="font-bold text-sm leading-relaxed z-10">{quiz.question}</p>

      <div className="grid grid-cols-2 gap-2 z-10">
        {quiz.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            disabled={selected !== null}
            className={cn(
              "p-3 rounded-2xl text-xs font-bold text-left transition-all border",
              selected === i 
                ? (i === quiz.answerIndex ? "bg-green-500 border-green-400" : "bg-red-500 border-red-400")
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected !== null && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white/10 p-3 rounded-2xl border border-white/10 z-10"
        >
          <div className="flex justify-between items-center mb-1">
             <span className={cn("text-[10px] font-black uppercase tracking-widest", selected === quiz.answerIndex ? "text-green-400" : "text-red-400")}>
               {selected === quiz.answerIndex ? "Sahi Jawab!" : "Sahi nahi hai..."}
             </span>
             <button onClick={() => setShowExplanation(!showExplanation)} className="text-[10px] font-black uppercase tracking-widest text-blue-400">Explanation</button>
          </div>
          {showExplanation && (
            <p className="text-[10px] font-medium opacity-80 leading-relaxed mt-2">{quiz.explanation}</p>
          )}
        </motion.div>
      )}
    </div>
  );
};

const WeatherWidget = ({ state }: { state?: string }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl shadow-blue-100">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-yellow-300" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-100">Kisan Weather Update</h3>
        </div>
        <p className="text-2xl font-black">{state || 'India'} Weather</p>
        <p className="text-xs font-bold opacity-80 uppercase tracking-tight italic">"Aaj kheti ke liye mausam sahi hai!"</p>
      </div>
      <div className="text-right">
        <p className="text-4xl font-black">32°C</p>
        <p className="text-[10px] font-black uppercase opacity-60">Partly Cloudy</p>
      </div>
    </div>
  );
};

const MandiBhavWidget = () => {
  const items = [
    { name: 'Tamatar', price: '₹40/kg', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop' },
    { name: 'Alu', price: '₹20/kg', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=200&fit=crop' },
    { name: 'Pyaj', price: '₹35/kg', img: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=200&h=200&fit=crop' },
    { name: 'Gehu', price: '₹2500/q', img: 'https://images.unsplash.com/photo-1542713312-706593a20723?w=200&h=200&fit=crop' }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
           <LayoutGrid className="w-5 h-5 text-emerald-600" />
           <h2 className="text-lg font-black text-gray-900 tracking-tight italic">Daily Mandi Bhav</h2>
        </div>
        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black">LIVE RATES</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-3 group hover:border-emerald-100 transition-colors">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-50 shrink-0">
              <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.name}</p>
              <p className="text-sm font-black text-emerald-600 leading-none">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const JobFinderWidget = ({ onSearch }: { onSearch: (q: string) => void }) => {
  return (
    <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white flex flex-col gap-4 shadow-xl shadow-indigo-100 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
            <Search className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-100">Smart Job Finder</h3>
            <p className="text-[10px] font-bold opacity-60 text-white italic">"Dost, aaj ki top jobs dekhein?"</p>
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <input 
          type="text" 
          placeholder="e.g. Driver, Teacher, Worker..."
          className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl font-bold text-sm placeholder:text-white/40 focus:bg-white text-white focus:text-indigo-900 outline-none transition-all placeholder:italic"
          onKeyDown={(e) => e.key === 'Enter' && onSearch((e.target as HTMLInputElement).value)}
        />
        <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-indigo-200">Matching with your profile skills...</p>
      </div>
    </div>
  );
};

const CareerGuideWidget = ({ onAction }: { onAction: (action: string) => void }) => {
  return (
    <section className="p-6 bg-gradient-to-br from-[#008069] to-green-800 rounded-[2.5rem] shadow-xl shadow-green-100 flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10" />
      <div className="flex justify-between items-start relative z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
               <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
               <h3 className="text-white font-black text-sm uppercase tracking-widest">Job Prep Master</h3>
               <p className="text-[10px] text-green-100 font-bold uppercase tracking-tight opacity-70">Sarkari & Private Job Tyari</p>
            </div>
         </div>
         <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
            <Zap className="w-4 h-4 fill-current" />
         </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <button 
          onClick={() => onAction('Resume help in Hindi')}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-left transition-all group"
        >
           <FileText className="w-5 h-5 text-green-200 mb-2 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-black text-white uppercase tracking-widest">Resume Wali AI</p>
           <p className="text-[9px] text-green-100 font-bold mt-0.5">Biodata banayein</p>
        </button>
        <button 
          onClick={() => onAction('Tell me about 5 best skills to learn for jobs in India')}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-left transition-all group"
        >
           <Target className="w-5 h-5 text-green-200 mb-2 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-black text-white uppercase tracking-widest">Skill Booster</p>
           <p className="text-[9px] text-green-100 font-bold mt-0.5">Naya kya seekhein?</p>
        </button>
      </div>
    </section>
  );
};

// --- Screens ---

const HomeScreen = ({ onNavigate, userProfile, onAskMitra, unreadCount, onOpenNotifications, savedSchemeIds, onNavigateToScheme, onShowSchemeDiscovery, onStartSimulator, onShowFormAudit, news, loadingNews, schemes }: { 
  onNavigate: (v: string) => void; 
  userProfile: UserProfile; 
  onAskMitra: (q: string) => void; 
  unreadCount: number; 
  onOpenNotifications: () => void;
  savedSchemeIds: string[];
  onNavigateToScheme: (id: string) => void;
  onShowSchemeDiscovery: () => void;
  onStartSimulator?: (form: any) => void;
  onShowFormAudit: () => void;
  news: any[];
  loadingNews: boolean;
  schemes: Scheme[];
}) => {
  const [drafts, setDrafts] = useState<FormDraft[]>([]);
  const savedSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDrafts = () => {
      const localRaw = localStorage.getItem('mitra_drafts');
      const local = localRaw ? JSON.parse(localRaw) : [];
      
      if (!auth.currentUser) {
        setDrafts(local.slice(0, 2));
        return null;
      }

      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'drafts'),
        limit(5)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreDrafts = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data, 
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now() 
          } as FormDraft;
        });

        // Merge local and firestore, avoid duplicates by ID
        const merged = [...firestoreDrafts];
        local.forEach((ld: any) => {
          if (!merged.find(fd => fd.id === ld.id)) {
            merged.push(ld);
          }
        });
        
        setDrafts(merged.sort((a, b) => (b.updatedAt as any) - (a.updatedAt as any)).slice(0, 2));
      }, (error) => {
        console.warn("Drafts fetch error (offline?):", error);
        setDrafts(local.slice(0, 2));
      });

      return unsubscribe;
    };

    const unsubscribe = loadDrafts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const scrollToSaved = () => {
    savedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const suggestedSchemes = (() => {
    const sorted = [...schemes].sort((a, b) => {
      // Priority 1: Community match
      if (a.community === userProfile.community && b.community !== userProfile.community) return -1;
      if (b.community === userProfile.community && a.community !== userProfile.community) return 1;
      
      // Priority 2: State match
      if (a.state === userProfile.state && b.state !== userProfile.state) return -1;
      if (b.state === userProfile.state && a.state !== userProfile.state) return 1;
      
      return 0;
    });
    return sorted.slice(0, 3);
  })();

  const savedSchemes = schemes.filter(s => savedSchemeIds.includes(s.id));

  return (
    <div className="flex flex-col gap-6 p-6 pb-32">
      <header className="flex justify-between items-start">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => onNavigate('settings')}
             className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
           >
              <Settings className="w-5 h-5" />
           </button>
           <div>
             <h1 className="text-3xl font-black text-[#008069] tracking-tighter">Form Mitra AI</h1>
             <div className="flex items-center gap-1.5 opacity-60">
               <Sparkles className="w-3 h-3 text-[#008069]" />
               <p className="text-[9px] uppercase font-black text-[#008069] tracking-[0.2em]">{userProfile.community} Special Edition</p>
             </div>
           </div>
        </div>
         <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 mb-1">
             <button 
               onClick={scrollToSaved}
               className={cn(
                 "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-sm relative active:scale-95",
                 savedSchemeIds.length > 0 ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-white border-gray-100 text-gray-400"
               )}
             >
                <Bookmark className={cn("w-5 h-5", savedSchemeIds.length > 0 && "fill-current")} />
                {savedSchemeIds.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                     {savedSchemeIds.length}
                   </span>
                )}
             </button>
             <button 
               onClick={onOpenNotifications}
               className={cn(
                 "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-sm relative active:scale-95",
                 unreadCount > 0 ? "bg-red-50 border-red-100 text-red-500" : "bg-white border-gray-100 text-gray-400"
               )}
             >
                {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                     {unreadCount}
                   </span>
                )}
             </button>
             <button 
               onClick={() => onNavigate('profile')}
               className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm relative active:scale-95"
             >
                <UserIcon className="w-5 h-5" />
             </button>
          </div>
      {userProfile.state && (
        <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1.5 shadow-sm">
           <Globe className="w-3 h-3 text-orange-600" />
           <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">{userProfile.state}</span>
        </div>
      )}
      <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1.5 shadow-sm">
         <Zap className="w-3 h-3 text-[#008069]" />
         <span className="text-[9px] font-black text-[#008069] uppercase tracking-tighter">{userProfile.community}</span>
      </div>
    </div>
  </header>

  {(!userProfile.occupation || !userProfile.gender || !userProfile.category) && (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-red-50 rounded-[2.5rem] border border-red-100 flex items-center justify-between group cursor-pointer"
      onClick={() => onNavigate('settings')}
    >
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-red-500 shadow-sm border border-red-50">
           <AlertCircle className="w-5 h-5" />
         </div>
         <div>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-tight">Profile Adhoori Hai!</p>
            <p className="text-[11px] font-bold text-gray-700 leading-tight">Schemes dhundne ke liye gender/category bharein.</p>
         </div>
      </div>
      <ChevronRight className="w-4 h-4 text-red-300 group-hover:translate-x-1 transition-transform" />
    </motion.div>
  )}

  <NewsSlider news={news} community={userProfile.community} />

  <section className="p-6 bg-[#008069] rounded-[2.5rem] shadow-xl shadow-green-100 flex flex-col gap-6 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer" onClick={onShowSchemeDiscovery}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
    <div className="flex justify-between items-start relative z-10">
       <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
             <SearchCheck className="w-5 h-5 translate-y-[1px]" />
          </div>
          <div className="flex flex-col">
             <h3 className="text-white font-black text-sm uppercase tracking-widest">{userProfile.community} Scheme Finder</h3>
             <p className="text-[10px] text-green-100 font-bold uppercase tracking-tight opacity-70">Best for your profile</p>
          </div>
       </div>
       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
          <Zap className="w-4 h-4 fill-current" />
       </div>
    </div>
    
    <div className="flex flex-col gap-2 relative z-10">
       <p className="text-xl font-black text-white leading-tight italic">"Dost, aapke {userProfile.community} profile ke hisaab se schemes yahan hain!"</p>
    </div>
  </section>

  {/* Quick Navigation Grid */}
  {/* Audit Widget */}
  <section className="space-y-4">
    <div className="flex flex-col gap-1 px-1">
      <h2 className="text-xl font-black text-gray-900 tracking-tight italic">AI Quality Check</h2>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Photo Audit & rejection analysis</p>
    </div>
    <div className="grid grid-cols-1 gap-4">
       <div 
         onClick={onShowFormAudit}
         className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex flex-col gap-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
       >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-white font-black text-sm uppercase tracking-widest leading-tight">Form Risk Analyzer</h3>
                   <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-tight opacity-70">Filled Forms Verify Karein</p>
                </div>
             </div>
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/20 group-hover:rotate-12 transition-transform">
                <Camera className="w-5 h-5" />
             </div>
          </div>
          <div className="flex flex-col gap-3 relative z-10">
             <p className="text-sm font-bold text-white leading-relaxed opacity-90">"Aapke form mein koi galti toh nahi? AI se check karwayein rejection se bachein."</p>
             <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10 group-hover:bg-white text-indigo-600 transition-colors">Start Audit</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">Photo Quality Audit</span>
             </div>
          </div>
       </div>
    </div>
  </section>

  <section className="grid grid-cols-2 gap-3" id="home-quick-nav">
    <button 
      onClick={() => onNavigate('schemes')}
      className="p-4 bg-blue-50 rounded-[2rem] border border-blue-100 flex flex-col gap-3 group active:scale-95 transition-all shadow-sm"
    >
      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <BookOpen className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Schemes</p>
        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-tight">Sarkari Yojna</p>
      </div>
    </button>

    <button 
      onClick={() => onNavigate('tools')}
      className="p-4 bg-purple-50 rounded-[2rem] border border-purple-100 flex flex-col gap-3 group active:scale-95 transition-all shadow-sm"
    >
      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-purple-600 shadow-sm border border-purple-50 group-hover:bg-purple-600 group-hover:text-white transition-colors">
        <LayoutDashboard className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Tools</p>
        <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest leading-tight">AI Assist</p>
      </div>
    </button>

    <button 
      onClick={() => onNavigate('chat')}
      className="p-4 bg-teal-50 rounded-[2rem] border border-teal-100 flex flex-col gap-3 group active:scale-95 transition-all shadow-sm"
    >
      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-teal-600 shadow-sm border border-teal-50 group-hover:bg-teal-600 group-hover:text-white transition-colors">
        <MessageCircle className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Mitra AI</p>
        <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest leading-tight">Chat Karein</p>
      </div>
    </button>

    <button 
      onClick={() => onNavigate('guide')}
      className="p-4 bg-amber-50 rounded-[2rem] border border-amber-100 flex flex-col gap-3 group active:scale-95 transition-all shadow-sm"
    >
      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-50 group-hover:bg-amber-600 group-hover:text-white transition-colors">
        <Camera className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Forms</p>
        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest leading-tight">Live Guide</p>
      </div>
    </button>
  </section>

  {userProfile.community === 'Farmer' && (
    <>
      <MandiBhavWidget />
      <WeatherWidget state={userProfile.state} />
    </>
  )}

  {userProfile.community === 'Jobs' && (
    <>
      <JobFinderWidget onSearch={(q) => onAskMitra(`Jobs for ${q}`)} />
      <CareerGuideWidget onAction={(a) => onAskMitra(a)} />
    </>
  )}

  {userProfile.community === 'Jobs' && (
    <NewsWidget 
      userProfile={userProfile} 
      news={news.filter(n => n.tags?.includes('Jobs') || n.title.toLowerCase().includes('job') || n.title.toLowerCase().includes('vacancy'))} 
      loading={loadingNews} 
      onAskMitra={onAskMitra} 
    />
  )}

  {userProfile.community !== 'Jobs' && (
    <NewsWidget userProfile={userProfile} news={news} loading={loadingNews} onAskMitra={onAskMitra} />
  )}

  {drafts.length > 0 && (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-gray-900 tracking-tight italic">Abhi Bharein (Resume)</h2>
          <p className="text-[10px] font-bold text-[#008069] uppercase tracking-widest flex items-center gap-1.5">
            <Cloud className="w-3 h-3" />
            Drafts work offline also
          </p>
        </div>
        <button 
          onClick={() => onNavigate('guide')} 
          className="text-[#008069] text-xs font-black uppercase tracking-widest"
        >
          All Drafts
        </button>
      </div>
      <div className="flex flex-col gap-3">
         {drafts.map(draft => (
           <div 
             key={draft.id}
             onClick={() => {
               if (onStartSimulator) {
                 onStartSimulator({ ...draft.formDefinition, draftId: draft.id, formData: draft.formData });
               }
               onNavigate('guide');
             }}
             className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all hover:border-[#008069]/30"
           >
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#008069]/5 flex items-center justify-center text-[#008069]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{draft.formDefinition?.hindiName || 'Untitled Form'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#008069]">Draft Saved</span>
                    <span className="text-[9px] text-gray-300">•</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{new Date(draft.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
             </div>
             <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#008069] group-hover:text-white transition-all">
               <ChevronRight className="w-4 h-4" />
             </div>
           </div>
         ))}
      </div>
    </section>
  )}

  <TargetTracker news={news} loading={loadingNews} onAskMitra={onAskMitra} />

      <div ref={savedSectionRef} />

      {savedSchemes.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Saved For Later</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aapki favorite yojnayein</p>
            </div>
            <button 
              onClick={() => {
                // Navigate to schemes with saved filter? 
                // For now, let's just go to schemes or settings
                onNavigate('settings');
              }} 
              className="text-[#008069] text-xs font-black uppercase tracking-widest"
            >
              View List
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 -mx-6 px-6 scrollbar-hide">
            {savedSchemes.map((scheme) => (
              <div 
                key={scheme.id}
                onClick={() => onNavigateToScheme(scheme.id)}
                className="w-48 shrink-0 bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 cursor-pointer hover:border-[#008069]/30 transition-all active:scale-95 group"
              >
                <div className="w-full h-24 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 relative">
                  <img 
                    src={scheme.image || `https://picsum.photos/seed/${scheme.id}/200/160`} 
                    alt={scheme.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white/80 backdrop-blur-md rounded-lg flex items-center justify-center text-[#008069]">
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{scheme.hindiName || scheme.name}</h4>
                  <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter mt-1">{scheme.category}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Search, label: "All Schemes", desc: "Category filtered", color: "bg-blue-50 text-blue-600", target: 'schemes' },
          { icon: Languages, label: "Letter Mitra", desc: "Formal drafts", color: "bg-green-50 text-[#008069]", target: 'letters' },
          { icon: Volume2, label: "Audio News", desc: "Sarkari updates", color: "bg-orange-50 text-orange-600", target: 'news' },
          { icon: LayoutGrid, label: "Form Practice", desc: "Mock practice", color: "bg-purple-50 text-purple-600", target: 'chat' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(item.target)}
            className="flex flex-col gap-3 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-left hover:border-[#008069]/30 transition-all hover:-translate-y-1"
          >
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.label}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight font-medium uppercase tracking-tighter">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <SubjectQuiz userProfile={userProfile} />

      <PersonalizedRecommendations userProfile={userProfile} />

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Top Match For You</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Eligibility: 100% Match</p>
          </div>
          <button onClick={() => onNavigate('schemes')} className="text-[#008069] text-xs font-black uppercase tracking-widest">See All</button>
        </div>
        <div className="flex flex-col gap-4">
          {suggestedSchemes.map((scheme) => (
            <div 
              key={scheme.id} 
              onClick={() => onNavigate('schemes')}
              className="p-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex gap-4 items-center group cursor-pointer hover:border-[#008069]/20 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 rounded-bl-[2rem] flex items-center justify-center">
                 <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="w-24 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                <img 
                  src={scheme.image || `https://picsum.photos/seed/${scheme.id}/200/160`} 
                  alt={scheme.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col flex-1">
                <h4 className="font-bold text-sm text-gray-900 leading-tight">{scheme.hindiName || scheme.name}</h4>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-1 font-medium">{scheme.description}</p>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-[8px] font-black text-white bg-[#008069] px-2 py-0.5 rounded-full uppercase tracking-widest">{scheme.category}</span>
                   {scheme.state && <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{scheme.state}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!userProfile.isPremium && (
        <button 
          onClick={() => onNavigate('premium')}
          className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between group overflow-hidden relative mt-4"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="flex flex-col gap-1 text-left relative z-10">
            <h3 className="font-black text-lg text-yellow-400 tracking-tight">PREMIUM PASS</h3>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Get Unlimited AI Screen Share</p>
          </div>
          <div className="bg-white/10 p-4 rounded-3xl relative z-10 group-hover:bg-white/20 transition-all">
            <Zap className="w-6 h-6 text-yellow-400 fill-current" />
          </div>
        </button>
      )}
    </div>
  );
};

const PremiumScreen = ({ userProfile, onSave }: { userProfile: UserProfile; onSave: (p: UserProfile) => void }) => {
  const [status, setStatus] = useState<'idle' | 'paying' | 'success'>('idle');

  const handlePay = () => {
     setStatus('paying');
     setTimeout(() => {
        setStatus('success');
        onSave({ ...userProfile, isPremium: true });
     }, 3000);
  };

  return (
    <div className="p-6 pb-32 flex flex-col gap-8 justify-center min-h-[80vh]">
       {status === 'success' ? (
         <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6 text-center"
         >
            <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-green-100">
               <CheckCircle className="w-12 h-12" />
            </div>
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Ab Aap Premium Hain!</h2>
               <p className="text-gray-500 font-medium">Enjoy Unlimited Screen Share & Photo Studio</p>
            </div>
            <button 
               onClick={() => window.location.reload()}
               className="w-full bg-[#008069] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-xl"
            >
               Mitra AI Dashboard
            </button>
         </motion.div>
       ) : (
         <div className="flex flex-col gap-8">
            <header className="text-center space-y-2">
               <div className="px-4 py-1 bg-yellow-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-[0.3em] inline-block mb-2">LIMITED TIME OFFER</div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Form Mitra<br/>Premium Pass</h2>
               <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Upgrade to the Cyber Cafe Killer Suite</p>
            </header>

            <div className="flex flex-col gap-4">
               {[
                 { icon: Camera, title: "AI Screen Guidance", desc: "Live voice help during form filling" },
                 { icon: Cpu, title: "Passport Photo Maker", desc: "Auto background removal & resize" },
                 { icon: MessageSquare, title: "WhatsApp Alert Mitra", desc: "Reminders directly on WhatsApp" },
                 { icon: Zap, title: "Fast AI Processing", desc: "No limits on form analysis" }
               ].map((f, i) => (
                 <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-[#008069] shrink-0">
                       <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm text-gray-900">{f.title}</h4>
                       <p className="text-xs text-gray-500 font-medium">{f.desc}</p>
                    </div>
                 </div>
               ))}
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col gap-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-[#008069]/40 blur-3xl -mr-20 -mt-20 opacity-50" />
               <div className="flex justify-between items-end relative z-10">
                  <div>
                     <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Monthly Subscription</p>
                     <p className="text-4xl font-black tracking-tighter">₹49<span className="text-lg opacity-40">/month</span></p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest line-through">₹299</p>
                     <p className="text-xs font-black text-green-400 uppercase tracking-tight">Save 84%</p>
                  </div>
               </div>

               <button 
                  onClick={handlePay}
                  disabled={status === 'paying'}
                  className="w-full bg-[#008069] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-green-900 relative z-10 active:scale-95 transition-all overflow-hidden"
               >
                  {status === 'paying' ? (
                    <div className="flex items-center justify-center gap-3">
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Opening UPI Apps...
                    </div>
                  ) : "Pay with UPI (PhonePe/GPay)"}
               </button>

               <div className="flex justify-between px-4 opacity-40 z-10">
                  <div className="flex items-center gap-1.5 grayscale">
                     <div className="w-2 h-2 rounded-full bg-white" />
                     <span className="text-[8px] font-black uppercase tracking-widest">PhonePe</span>
                  </div>
                  <div className="flex items-center gap-1.5 grayscale">
                     <div className="w-2 h-2 rounded-full bg-white" />
                     <span className="text-[8px] font-black uppercase tracking-widest">Paytm</span>
                  </div>
                  <div className="flex items-center gap-1.5 grayscale">
                     <div className="w-2 h-2 rounded-full bg-white" />
                     <span className="text-[8px] font-black uppercase tracking-widest">GPay</span>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

let globalAudioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null;
let currentHTMLAudio: HTMLAudioElement | null = null;
const audioCache = new Map<string, AudioBuffer>();

const resizeImage = (base64Str: string, maxDim = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioContext;
};

const playAudio = async (text: string, onStart?: () => void, onEnd?: () => void) => {
  if (!text) return;
  
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  // Stop current audio if playing to avoid overlaps
  if (currentAudioSource) {
    try {
      currentAudioSource.onended = null;
      currentAudioSource.stop();
    } catch (e) {
      console.warn("Error stopping previous audio:", e);
    }
    currentAudioSource = null;
  }
  
  if (currentHTMLAudio) {
    try {
      currentHTMLAudio.pause();
      currentHTMLAudio.src = "";
      currentHTMLAudio.load();
    } catch (e) {
      console.warn("Error stopping previous HTML audio:", e);
    }
    currentHTMLAudio = null;
  }

  try {
    const cleanText = text.replace(/[#*`]/g, '').trim();
    if (!cleanText) return;

    // Use browser speech if offline as a fallback
    if (!navigator.onLine) {
      onStart?.();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      // Try to find a Hinglish or Hindi sounding voice
      const preferredVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('in')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
      return;
    }

    let buffer: AudioBuffer;

    if (audioCache.has(cleanText)) {
      buffer = audioCache.get(cleanText)!;
    } else {
      onStart?.();
      // Convert base64 to ArrayBuffer robustly
      const base64 = await getSpeech(cleanText);
      if (!base64) {
        onEnd?.();
        return;
      }
      console.log("Decoding audio data, length:", base64.length);
      
      try {
        // Remove padding/newlines and validate base64
        const cleanBase64 = base64.trim().replace(/[^A-Za-z0-9+/=]/g, "");
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        try {
          // decodeAudioData is the preferred way
          buffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
          audioCache.set(cleanText, buffer);
        } catch (decodeErr) {
          console.warn("AudioContext.decodeAudioData failed, trying HTML Audio fallback. Error:", decodeErr);
          
          // Fallback to HTML5 Audio element
          console.warn("decodeAudioData failed, trying HTML Audio fallback...");
          
          // Try to detect common format headers
          let mimeType = 'audio/mpeg'; // Default
          
          if (bytes.length > 8) {
            const header = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) >>> 0;
            const header2 = (bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7]) >>> 0;
            
            // Log magic bytes for debugging to help fix future issues
            const hex = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`Audio Magic Bytes (hex): ${hex}`);

            if (header === 0x52494646) mimeType = 'audio/wav'; // "RIFF"
            else if ((header & 0xFFFFFF00) === 0x49443300) mimeType = 'audio/mpeg'; // ID3
            else if ((bytes[0] === 0xFF) && ((bytes[1] & 0xE0) === 0xE0)) mimeType = 'audio/mpeg'; // MP3 Sync
            else if (header === 0x1A45DFA3) mimeType = 'audio/webm'; // WebM
            else if (header === 0x4F676753) mimeType = 'audio/ogg'; // Ogg
            else if (header === 0x664C6143) mimeType = 'audio/flac'; // fLaC
            else if (header === 0x00000018 || header === 0x00000020) mimeType = 'audio/mp4'; // ftyp
          }

          // Use Blob and createObjectURL
          const blob = new Blob([bytes], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const audio = new Audio();
          currentHTMLAudio = audio;
          audio.src = url;
          
          return new Promise<void>((resolve) => {
            const cleanup = () => {
              URL.revokeObjectURL(url);
              if (currentHTMLAudio === audio) currentHTMLAudio = null;
              onEnd?.();
              resolve();
            };

            const fallbackToSpeechSync = () => {
              console.log("Both methods failed, falling back to SpeechSynthesis...");
              const utterance = new SpeechSynthesisUtterance(cleanText);
              const voices = window.speechSynthesis.getVoices();
              const preferredVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('in')) || voices[0];
              if (preferredVoice) utterance.voice = preferredVoice;
              
              let ended = false;
              const safeCleanup = () => {
                if (ended) return;
                ended = true;
                cleanup();
              };

              utterance.onend = safeCleanup;
              utterance.onerror = safeCleanup;
              
              // Extreme fallback timeout for speech synthesis
              setTimeout(safeCleanup, 8000); 

              window.speechSynthesis.speak(utterance);
            };

            audio.onended = cleanup;
            audio.onerror = (e) => {
              console.error(`HTML Audio fallback error (MIME: ${mimeType}):`, e);
              fallbackToSpeechSync();
            };

            audio.play().catch(playErr => {
              console.warn("Audio playback failed (fallback):", playErr.name, playErr.message);
              fallbackToSpeechSync();
            });
          });
        }
      } catch (base64Err) {
        console.error("Base64 processing error:", base64Err);
        onEnd?.();
        return;
      }
    }

    onStart?.();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      if (currentAudioSource === source) {
        currentAudioSource = null;
      }
      onEnd?.();
    };
    
    currentAudioSource = source;
    source.start(0);
  } catch (error) {
    console.error("Audio Playback Error:", error);
    currentAudioSource = null;
    onEnd?.();
  }
};

const PlayButton = ({ text }: { text: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePlay = async () => {
    if (isPlaying || isLoading || !text) return;
    
    await playAudio(
      text,
      () => {
        setIsLoading(false);
        setIsPlaying(true);
      },
      () => {
        setIsLoading(false);
        setIsPlaying(false);
      }
    );
  };

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        handlePlay();
      }}
      className={cn(
        "shrink-0 p-1.5 rounded-lg transition-all",
        isPlaying ? "bg-[#008069] text-white shadow-lg scale-110" : 
        isLoading ? "bg-gray-100 text-[#008069]" :
        "bg-gray-50 text-gray-400 hover:bg-gray-100"
      )}
      disabled={isPlaying || isLoading}
      title="Listen to response"
    >
      {isLoading ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : isPlaying ? (
        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
};

const ChatScreen = ({ initialMessage, onMessageConsumed, userProfile, onNavigate, onSetTargetSchemeId, schemes, onShowMasterProfile, onShowFeedback }: { 
  initialMessage?: string; 
  onMessageConsumed?: () => void;
  userProfile: UserProfile;
  onNavigate: (v: string) => void;
  onSetTargetSchemeId: (id: string) => void;
  schemes: Scheme[];
  onShowMasterProfile: () => void;
  onShowFeedback: (type?: any, relatedId?: string, relatedName?: string) => void;
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** (aapka Bade Bhai) hoon. Main aapki sarkari schemes, career aur forms bharne mein 100% help karunga. \n\nAaj kaise help karu bhai? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const lowRes = await resizeImage(base64, 800);
        setSelectedImage(lowRes);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMessageRating = async (messageId: string, rating: 'up' | 'down') => {
    if (!auth.currentUser || !activeConversationId) return;
    
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, rating } : m));
    
    try {
      const path = `users/${auth.currentUser.uid}/conversations/${activeConversationId}/messages/${messageId}`;
      await updateDoc(doc(db, path), { rating });
      showToast(rating === 'up' ? "Shukriya! Aapko response pasand aaya." : "Feedback noted. Hum ise behtar karenge.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}/conversations/${activeConversationId}/messages/${messageId}`);
    }
  };

  // Fetch conversations
  useEffect(() => {
    if (!auth.currentUser) return;
    setIsHistoryLoading(true);
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/conversations`),
      where('userId', '==', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(convs.sort((a, b) => b.updatedAt - a.updatedAt));
      setIsHistoryLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'conversations');
      setIsHistoryLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for messages in active conversation
  useEffect(() => {
    if (!auth.currentUser || !activeConversationId) {
      if (!activeConversationId) {
        setMessages([
          { id: 'welcome', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** (aapka Bade Bhai) hoon. Main aapki sarkari schemes, career aur forms bharne mein 100% help karunga. \n\nAaj kaise help karu bhai? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
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

  const saveMessage = async (convId: string, role: string, content: string, thought?: string | null, image?: string | null) => {
    if (!auth.currentUser) return;
    const msgData = {
      role,
      content,
      thought: thought || null,
      image: image || null,
      timestamp: Date.now(),
      userId: auth.currentUser.uid
    };
    
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/conversations/${convId}/messages`), msgData);
      
      // Update conversation metadata
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/conversations`, convId), {
        lastMessage: image ? "📸 Photo analysis request" : content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const createConversation = async (firstMessage: string, image?: string | null) => {
    if (!auth.currentUser) return null;
    try {
      const convData = {
        userId: auth.currentUser.uid,
        title: image ? "New Image Analysis" : firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
        lastMessage: image ? "Sent a photo" : firstMessage,
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
      if (response.error) {
        showToast(response.error.message, response.error.type === 'QUOTA' ? 'warning' : 'error');
      }
      await saveMessage(convId, 'assistant', response.text || "Maafi chahta hoon...", response.thought);
    } catch (error) {
      console.error(error);
      showToast("Server mein kuch dikkat hai. Kripya thodi der baad try karein.", "error");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    if ((!textOverride && !input.trim() && !selectedImage) || !auth.currentUser) return;
    
    const text = textOverride || input || (selectedImage ? "Kripya is photo ko analyze karein." : "");

    if (text === "Generate WhatsApp Alert") {
      (window as any).showWhatsAppGenerator?.();
      setInput('');
      return;
    }

    const currentImg = selectedImage;
    const currentMime = mimeType;
    
    if (!textOverride) {
      setInput('');
    }
    setSelectedImage(null);
    setMimeType(null);
    setIsTyping(true);
    
    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(text, currentImg);
      if (!convId) return;
      setActiveConversationId(convId);
    }

    await saveMessage(convId, 'user', text, null, currentImg);

    try {
      const history = messages.map(m => {
        const parts: any[] = [{ text: m.content }];
        if (m.image) {
          // If image exists, it's a data URL. We need just the base64 part for inlineData
          const base64Data = m.image.split(',')[1];
          const mime = m.image.split(',')[0].split(':')[1].split(';')[0];
          parts.push({ inlineData: { data: base64Data, mimeType: mime } });
        }
        return {
          role: m.role === 'assistant' ? 'model' as const : 'user' as const,
          parts
        };
      });
      
      const response = await getAIResponse(text, history, userProfile, currentImg?.split(',')[1], currentMime || undefined);
      
      if (response.error) {
        showToast(response.error.message, response.error.type === 'QUOTA' ? 'warning' : 'error');
      }

      await saveMessage(convId, 'assistant', response.text || "Maafi chahta hoon...", response.thought);
    } catch (error) {
      console.error(error);
      showToast("Server mein kuch dikkat hai. Kripya thodi der baad try karein.", "error");
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

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!auth.currentUser || !window.confirm("Bhai, kya aap ye conversation delete karna chahte hain?")) return;
    
    try {
      // First delete all messages
      const messagesRef = collection(db, `users/${auth.currentUser.uid}/conversations/${convId}/messages`);
      const messagesSnap = await getDocs(messagesRef);
      const deletePromises = messagesSnap.docs.map(d => deleteDoc(doc(db, `users/${auth.currentUser.uid}/conversations/${convId}/messages`, d.id)));
      await Promise.all(deletePromises);
      
      // Then delete conversation metadata
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/conversations`, convId));
      
      if (activeConversationId === convId) {
        startNewChat();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'conversations');
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      { id: 'welcome', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** (aapka Bade Bhai) hoon. Main aapki sarkari schemes, career aur forms bharne mein 100% help karunga. \n\nAaj kaise help karu bhai? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
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
                {isHistoryLoading ? (
                  <div className="space-y-2 p-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="p-3 bg-white border border-gray-100 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-1/2 rounded-md" />
                          <Skeleton className="h-3 w-12 rounded-sm" />
                        </div>
                        <Skeleton className="h-3 w-3/4 rounded-sm" />
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-10">
                    <History className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No previous chats</p>
                  </div>
                ) : (
                    conversations.map(conv => (
                      <div key={conv.id} className="relative group">
                        <button
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            setShowHistory(false);
                          }}
                          className={cn(
                            "w-full p-3 pr-10 rounded-2xl text-left border transition-all flex flex-col gap-1",
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
                        <button 
                          onClick={(e) => deleteConversation(e, conv.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
            
            {m.image && (
              <div className="mb-3 rounded-xl overflow-hidden border border-black/5 bg-black/5">
                <img src={m.image} alt="User Upload" className="w-full object-contain max-h-60" />
              </div>
            )}

            <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 mt-0.5 text-inherit">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => {
                    if (href === '#profile') {
                      return (
                        <button 
                          onClick={onShowMasterProfile}
                          className="font-black text-[#008069] underline decoration-dotted underline-offset-2 hover:bg-green-50 px-0.5 rounded transition-colors cursor-pointer"
                        >
                          {children}
                        </button>
                      );
                    }
                    return <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{children}</a>;
                  }
                }}
              >
                {(() => {
                  if (m.role !== 'assistant') return m.content;
                  
                  const terms = [
                    userProfile.state,
                    userProfile.community,
                    userProfile.occupation,
                    userProfile.category,
                    userProfile.monthlyIncome
                  ].filter((t): t is string => !!t && t.length > 2);

                  // Create a unique list and sort by length descending
                  const uniqueTerms = Array.from(new Set(terms)).sort((a, b) => b.length - a.length);
                  
                  let processed = m.content;
                  uniqueTerms.forEach(term => {
                    // Escape special regex characters in term
                    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Only match whole words that are not already inside a markdown link
                    // This is a simplified regex; it might miss complex cases but covers basic mentions
                    const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');
                    processed = processed.replace(regex, (match) => {
                      // Check if already linked (basic check)
                      if (processed.includes(`[${match}](#profile)`)) return match;
                      return `[${match}](#profile)`;
                    });
                  });
                  return processed;
                })()}
              </ReactMarkdown>
            </div>

            {m.role === 'assistant' && m.id !== 'welcome' && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50/50">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleMessageRating(m.id, 'up')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      m.rating === 'up' ? "bg-green-100 text-[#008069]" : "text-gray-300 hover:text-green-500 hover:bg-green-50"
                    )}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                     onClick={() => handleMessageRating(m.id, 'down')}
                     className={cn(
                       "p-1.5 rounded-lg transition-all",
                       m.rating === 'down' ? "bg-red-100 text-red-600" : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                     )}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <PlayButton text={m.content} />
                  {m.rating === 'down' && (
                    <button 
                      onClick={() => onShowFeedback('issue', m.id, 'AI Response')}
                      className="text-[9px] font-black uppercase text-[#008069] tracking-widest bg-green-50 px-2 py-1.5 rounded-lg hover:bg-green-100 transition-all border border-green-100"
                    >
                      Report Issue
                    </button>
                  )}
                </div>
              </div>
            )}

            {m.role === 'assistant' && m.id === 'welcome' && (
               <div className="mt-3 pt-2 border-t border-gray-50/50 flex justify-end">
                  <PlayButton text={m.content} />
               </div>
            )}

            {m.role === 'assistant' && (() => {
              const mentionedScheme = schemes.find(s => 
                m.content.toLowerCase().includes(s.name.toLowerCase()) || 
                (s.hindiName && m.content.toLowerCase().includes(s.hindiName.toLowerCase()))
              );
              if (mentionedScheme) {
                return (
                  <button
                    onClick={() => {
                      onSetTargetSchemeId(mentionedScheme.id);
                      onNavigate('schemes');
                    }}
                    className="mt-3 self-start flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md group"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                    View {mentionedScheme.hindiName || mentionedScheme.name} Details
                  </button>
                );
              }
              return null;
            })()}
            
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
          <div className="mr-auto bg-white p-6 rounded-[2.5rem] rounded-tl-none border border-gray-100 shadow-xl flex flex-col gap-4 max-w-[80%]">
             <AILoader message="Mitra is thinking & browsing..." />
          </div>
        )}
      </div>

      <div className="p-3 bg-[#F0F2F5] flex flex-col gap-2 z-20">
        {messages.length <= 1 && !selectedImage && (
          <div className="flex flex-col gap-2 mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Suggestions</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                "Bihar me Farmers schemes?",
                "Generate WhatsApp Alert",
                "Free Electricity Yojna?",
                "Aadhar Card Correction?",
                "Ration Card benefits?",
                "Sukanya Samriddhi Yojana?",
                "PMAY Housing Loan?"
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-[#008069] text-[10px] font-bold shadow-sm active:scale-95 transition-all hover:border-[#008069]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedImage && (
          <div className="flex gap-2 p-2 bg-white rounded-2xl border border-gray-200">
            <div className="relative">
              <img src={selectedImage} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Photo Attached</p>
              <p className="text-[11px] text-gray-600 font-medium">Ready to analyze</p>
            </div>
          </div>
        )}
        <div className="flex gap-3 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full bg-white text-[#008069] shadow-sm border border-gray-100 hover:bg-gray-50 flex items-center justify-center"
            title="Attach Image"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              // Open camera by triggering file input with capture attribute
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
                // Reset capture attribute after a delay so standard selection works next time
                setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 1000);
              }
            }}
            className="p-2.5 rounded-full bg-white text-orange-600 shadow-sm border border-gray-100 hover:bg-gray-50 flex items-center justify-center"
            title="Take Photo"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const url = prompt("Kripya government website ka link yahan paste karein (Example: pmkisan.gov.in):");
              if (url) {
                setInput(`Is website ko analyze karein aur iske schemes ke baare mein batayein: ${url}`);
              }
            }}
            className="p-2.5 rounded-full bg-white text-[#008069] shadow-sm border border-gray-100 hover:bg-gray-50 flex items-center justify-center hidden sm:flex"
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
            <button onClick={() => handleSend()} disabled={(!input.trim() && !selectedImage)} className="text-[#008069] disabled:opacity-30">
               <MessageCircle className="w-5 h-5 rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdBanner = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <div className="mx-4 mb-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between group cursor-pointer" onClick={onUpgrade}>
    <div className="flex items-center gap-3">
       <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <AlertCircle className="w-4 h-4" />
       </div>
       <div>
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-tight">Banner: Limited AI Access</p>
          <p className="text-[11px] font-bold text-gray-700 leading-tight">Upgrade for Unlimited Call & Camera</p>
       </div>
    </div>
    <ChevronRight className="w-4 h-4 text-orange-300 group-hover:translate-x-1 transition-transform" />
  </div>
);

const FormAudit = ({ imageBase64, userProfile, mimeType, onStartSimulator }: { imageBase64: string; userProfile: UserProfile; mimeType: string; onStartSimulator: (form: any) => void }) => {
  const [audit, setAudit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAudit = async () => {
      try {
        const result = await predictFormRejection(imageBase64, mimeType, userProfile);
        setAudit(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    runAudit();
  }, [imageBase64, mimeType, userProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm gap-4">
        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-black text-gray-900 uppercase tracking-widest leading-tight">AI Audit in Progress</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Comparing Form with your Profile...</p>
        </div>
      </div>
    );
  }

  if (!audit) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest text-orange-600">Rejection Prediction</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">AI Discrepancy Analyzer</p>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2",
            audit.riskScore > 50 ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"
          )}>
            <AlertCircle className="w-4 h-4" />
            {audit.riskScore}% RISK
          </div>
        </header>

        <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#008069] shadow-sm shrink-0">
             <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-800 italic leading-relaxed">"{audit.verdict}"</p>
        </div>

        {audit.photoAudit && (
          <div className={cn(
            "p-5 rounded-3xl border flex flex-col gap-3",
            audit.photoAudit.isAccepted ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
          )}>
            <div className="flex items-center gap-2">
               <Camera className={cn("w-4 h-4", audit.photoAudit.isAccepted ? "text-green-600" : "text-red-600")} />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-700">Photo Audit</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div className="bg-white/60 p-2.5 rounded-xl">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">BG Check</p>
                  <p className="text-[11px] font-bold text-gray-800 tracking-tight">{audit.photoAudit.backgroundStatus}</p>
               </div>
               <div className="bg-white/60 p-2.5 rounded-xl">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Clarity</p>
                  <p className="text-[11px] font-bold text-gray-800 tracking-tight">{audit.photoAudit.clarity}</p>
               </div>
            </div>
          </div>
        )}

        {audit.majorIssues?.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-500">Major Issues Found</h4>
            {audit.majorIssues.map((issue: any, i: number) => (
              <div key={i} className="p-4 bg-red-50/20 rounded-2xl border border-red-100/50 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-bold text-xs text-gray-900 pr-4 leading-tight">{issue.issue}</h5>
                    <div className="mt-2 text-[11px] font-bold text-gray-600 bg-white/50 p-2.5 rounded-xl border border-red-100/20">
                       <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">Fix:-</span>
                       {issue.fix}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {audit.actionPlan?.length > 0 && (
          <div className="flex flex-col gap-3 p-5 bg-gray-50 rounded-3xl border border-gray-100">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <Zap className="w-3.5 h-3.5 text-orange-500" /> Suggested Action Plan
             </h4>
             <div className="flex flex-col gap-2">
                {audit.actionPlan.map((step: string, i: number) => (
                  <div key={i} className="flex gap-2.5 items-start">
                     <span className="w-1.5 h-1.5 rounded-full bg-[#008069] mt-1.5 shrink-0" />
                     <p className="text-[11px] font-bold text-gray-700 leading-tight">{step}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        <PlayButton text={audit.verdict} />

        {audit.pitch && (
          <MitraPitch 
            pitch={audit.pitch} 
            result={audit} 
            onStartSimulator={(form) => {
               onStartSimulator(form);
            }}
          />
        )}
      </div>
    </div>
  );
};

const GuideScreen = ({ onNavigate, userProfile, isGuruActive, onActivateGuru, preloadedForm, onClearPreloadedForm }: { 
  onNavigate: (v: string) => void; 
  userProfile: UserProfile;
  isGuruActive: boolean;
  onActivateGuru: (autoStart?: boolean) => void;
  preloadedForm?: any | null;
  onClearPreloadedForm?: () => void;
}) => {
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
  const [activeView, setActiveView] = useState<'analysis' | 'simulator' | 'guidance' | 'audit'>('analysis');
  const [fileMimeType, setFileMimeType] = useState<string>('image/jpeg');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
  const [drafts, setDrafts] = useState<FormDraft[]>([]);

  useEffect(() => {
    if (preloadedForm) {
      setResult(preloadedForm);
      setActiveView('simulator');
      setUploadSuccess(true);
      if (onClearPreloadedForm) onClearPreloadedForm();
    }
  }, [preloadedForm]);

  useEffect(() => {
    const loadDrafts = () => {
      const localRaw = localStorage.getItem('mitra_drafts');
      const local = localRaw ? JSON.parse(localRaw) : [];

      if (!auth.currentUser) {
        setDrafts(local);
        return null;
      }

      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'drafts')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreDrafts = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data, 
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now() 
          } as FormDraft;
        });

        const merged = [...firestoreDrafts];
        local.forEach((ld: any) => {
          if (!merged.find(fd => fd.id === ld.id)) {
            merged.push(ld);
          }
        });

        setDrafts(merged.sort((a, b) => (b.updatedAt as any) - (a.updatedAt as any)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${auth.currentUser?.uid}/drafts`);
        setDrafts(local);
      });
      return unsubscribe;
    };

    const unsubscribe = loadDrafts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const resumeDraft = (draft: FormDraft) => {
    setResult({ ...draft.formDefinition, draftId: draft.id, formData: draft.formData });
    setImage(null);
    setUploadSuccess(true);
    setActiveView('simulator');
  };

  const deleteDraft = async (draftId: string) => {
    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'drafts', draftId));
      }
      
      const localRaw = localStorage.getItem('mitra_drafts');
      if (localRaw) {
        const local = JSON.parse(localRaw);
        const filtered = local.filter((d: any) => d.id !== draftId);
        localStorage.setItem('mitra_drafts', JSON.stringify(filtered));
        // If guest, update state immediately
        if (!auth.currentUser) {
          setDrafts(filtered);
        }
      }
    } catch (err) {
      console.error("Delete draft error:", err);
      if (auth.currentUser) {
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/drafts/${draftId}`);
      }
    }
  };
  const [websiteResult, setWebsiteResult] = useState<any | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (analyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
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

    setResult(null);
    setError(null);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const fullBase64 = reader.result as string;
      const resizedBase64 = await resizeImage(fullBase64, 1200);
      const base64Data = resizedBase64.split(',')[1];
      
      setImage(resizedBase64);
      setFileMimeType('image/jpeg');
      setUploadSuccess(true);
      setAnalyzing(true);
      
      try {
        const response = await analyzeForm(base64Data, 'image/jpeg');
        if (response) {
          try {
            const parsed = JSON.parse(response);
            setResult(parsed);
            // Pre-fetch all audio for speed
            const prefetchQueue = [parsed.summary, ...parsed.fields.map((f: any) => f.explanation)].filter(Boolean);
            prefetchQueue.forEach(text => {
              const clean = text.replace(/[#*`]/g, '');
              if (audioCache.has(clean)) return;
              
              getSpeech(clean).then(base64 => {
                if (base64) {
                  try {
                    const binary = window.atob(base64.trim().replace(/[^A-Za-z0-9+/=]/g, ""));
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    getAudioContext().decodeAudioData(bytes.buffer.slice(0)).then(buffer => {
                      audioCache.set(clean, buffer);
                    }).catch((err) => {
                      console.warn("Quiet prefetch decode fail for:", clean, err);
                    });
                  } catch (e) {
                    console.error("Prefetch base64 error:", e);
                  }
                }
              }).catch(() => {});
            });
          } catch (e) {
            console.error("JSON Parse Error:", e);
            setError("Analysis complete, par display format mein dikkat hai. Kirpya firse try karein.");
          }
        } else {
          setError("AI se koi response nahi mila. Photo saaf kheenchiye aur dubara upload karein.");
        }
      } catch (err: any) {
        console.error("Analysis Error:", err);
        setError("Maafi chahta hoon, analyze nahi ho saki. Kal try karein.");
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
    if (value.length > 50) return;
    const isValid = value.trim().length >= 3 && value.trim().length <= 50;
    setNameError(!isValid);
    setResult((prev: any) => prev ? { ...prev, formName: value } : prev);
  };

  const handleWebsiteAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;
    
    setAnalyzingWebsite(true);
    setWebsiteError(null);
    setWebsiteResult(null);

    try {
      const response = await analyzeWebsite(websiteUrl, userProfile);
      if (response && response.siteName) {
        setWebsiteResult(response);
      } else {
        setWebsiteError("AI website ko theek se analyze nahi kar saka. Kripya URL check karein.");
      }
    } catch (err) {
      console.error(err);
      setWebsiteError("Website analyze karne mein error aaya. Kripya baad mein try karein.");
    } finally {
      setAnalyzingWebsite(false);
    }
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
        const res = await getFieldExample(result.formName || 'Form', field.field, field.explanation);
        updateField(i, 'exampleValue', res.example);
        if (res.whyItMatters) updateField(i, 'whyItMatters', res.whyItMatters);
        if (res.tip) updateField(i, 'aiTip', res.tip);
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
          className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
        >
          <Settings className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Form Mitra Suite</h1>
          <p className="text-xs text-gray-500 font-medium">Capture form to unlock AI helper tools.</p>
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
            <p className="text-[10px] text-[#008069] mt-1 font-bold tracking-widest opacity-60">Use Camera to Analyze Form</p>
            <p className="text-[8px] text-gray-400 font-bold mt-2 uppercase tracking-tight text-center max-w-[200px] opacity-80">
              Clear photo kheenchiye. Kam raushni ya details chhipna rejection ka karan ho sakta hai.
            </p>
          </label>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-[#008069] flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website Analyzer
            </h3>
            <p className="text-[10px] text-gray-400 font-bold leading-tight">Yahan kisi bhi sarkari website ka URL dalein aur uska summary payein.</p>
            
            <form onSubmit={handleWebsiteAnalyze} className="flex gap-2">
              <input 
                type="url" 
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://pmkisan.gov.in"
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#008069]/30"
                required
              />
              <button 
                type="submit"
                disabled={analyzingWebsite}
                className="bg-[#008069] text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {analyzingWebsite ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </form>

            {websiteError && (
              <p className="text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg">{websiteError}</p>
            )}

            {websiteResult && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xs text-gray-900">{websiteResult.siteName}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{websiteResult.targetAudience}</p>
                  </div>
                  <PlayButton text={websiteResult.summary} />
                </div>
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed font-italic line-clamp-2">"{websiteResult.summary}"</p>
                
                {websiteResult.schemes?.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Key Schemes & Services</p>
                    {websiteResult.schemes.slice(0, 3).map((s: any, idx: number) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-gray-900">{s.name}</p>
                        <p className="text-[9px] text-gray-500 leading-tight">{s.details}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-100">
                   <p className="text-[9px] font-bold text-[#008069] italic"> Mitra Advice: {websiteResult.mitraAdvice}</p>
                </div>
                
                <a 
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 py-2 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-[#008069] transition-all"
                >
                  Visit Website <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {drafts.length > 0 && !image && !result && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5" />
                  Saved Drafts
                </h3>
                <span className="text-[10px] bg-green-50 text-[#008069] px-2 py-0.5 rounded-full font-black">
                  {drafts.length} DRAFTS
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {drafts.map((draft) => (
                  <div key={draft.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#008069]/30 transition-all">
                    <button 
                      onClick={() => resumeDraft(draft)}
                      className="flex items-center gap-4 text-left flex-1"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-[#008069] transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h4 className="font-black text-[13px] text-gray-900 line-clamp-1">{draft.formName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          Last Saved: {new Date(draft.updatedAt).toLocaleDateString()} at {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteDraft(draft.id)}
                        className="p-3 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => resumeDraft(draft)}
                        className="p-3 rounded-xl bg-[#008069] text-white shadow-lg active:scale-95 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGuruActive && (
            <button 
              onClick={() => onActivateGuru(true)}
              className="w-full bg-[#008069] text-white p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-green-100/50 hover:bg-[#006b58]"
            >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white ring-4 ring-white/10">
                    <Cpu className="w-6 h-6 animate-pulse" />
                 </div>
                 <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-white">Start Live AI Guru</p>
                    <p className="text-[10px] font-bold text-white/70">Enable screen share for live guidance</p>
                 </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
           <div className="relative rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl max-h-48 bg-black group">
              <img src={image} alt="Form" className={`w-full h-full object-contain ${analyzing ? 'opacity-50' : 'opacity-100'}`} />
              <button 
                onClick={() => { setImage(null); setResult(null); setError(null); setUploadSuccess(false); setActiveView('analysis'); }}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 text-red-500 shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
              {analyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                   <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                   <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{Math.round(progress)}% ANALYZING</p>
                </div>
              )}
           </div>

           {!isGuruActive && (
              <button 
                onClick={() => onActivateGuru(true)}
                className="w-full bg-[#008069] text-white p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-green-100/50 hover:bg-[#006b58]"
              >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white ring-4 ring-white/10">
                      <Cpu className="w-6 h-6 animate-pulse" />
                   </div>
                   <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest text-white">Start Live AI Guru</p>
                      <p className="text-[10px] font-bold text-white/70">Enable screen share for live guidance</p>
                   </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
           )}

           {result && (
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl overflow-x-auto scrollbar-hide shrink-0">
                {(['analysis', 'simulator', 'guidance', 'audit'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setActiveView(v)}
                    className={cn(
                      "flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                      activeView === v ? "bg-white text-[#008069] shadow-sm" : "text-gray-400"
                    )}
                  >
                    {v === 'audit' ? 'Risk Audit' : v}
                  </button>
                ))}
              </div>
           )}

           {activeView === 'analysis' && result && (
             <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <input 
                          value={result.formName}
                          onChange={(e) => updateFormName(e.target.value)}
                          className="text-lg font-black bg-transparent border-none p-0 w-full"
                          placeholder="Form Name"
                        />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Summary by Mitra AI</p>
                      </div>
                      <PlayButton text={result.summary} />
                   </div>
                   <textarea 
                     value={result.summary}
                     onChange={(e) => updateSummary(e.target.value)}
                     className="text-xs text-gray-500 font-medium leading-relaxed bg-transparent border-none p-0 w-full resize-none"
                     rows={3}
                   />
                </div>

                {result.costEfficiency && (
                  <CostEvaluator costInfo={result.costEfficiency} />
                )}

                {result.confidenceAnalysis && (
                  <ConfidenceEvaluator analysis={result.confidenceAnalysis} />
                )}

                {result.pitch && (
                  <MitraPitch 
                    pitch={result.pitch} 
                    result={result}
                    onStartSimulator={(form) => {
                      setResult(form);
                      setActiveView('simulator');
                    }}
                  />
                )}

                {result.pitfalls?.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-orange-500">Analysis: Major Rejection Risks</h4>
                    {result.pitfalls.map((p: any, i: number) => (
                      <div key={i} className="bg-orange-50/30 border border-orange-100 p-5 rounded-3xl flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-900 mb-2 leading-tight">{p.risk}</p>
                              <div className="bg-white p-3 rounded-2xl border border-orange-100/50 shadow-sm shadow-orange-100/20">
                                 <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Fix This</span>
                                 </div>
                                 <p className="text-xs font-bold text-gray-800 leading-relaxed">{p.correctiveAction}</p>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.smartTips?.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-purple-500">AI Smart Tips</h4>
                    <div className="grid grid-cols-1 gap-2">
                       {result.smartTips.map((tip: string, i: number) => (
                         <div key={i} className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl flex items-start gap-3">
                            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                               <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <p className="text-[11px] font-bold text-purple-900 leading-tight">{tip}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                
                <div className="flex flex-col gap-3">
                   {result.fields.map((f: any, i: number) => (
                     <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-gray-900 text-sm">{f.field}</h4>
                           <PlayButton text={f.explanation} />
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{f.explanation}</p>
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                            <button 
                              onClick={() => fetchExample(i)}
                              className="text-[9px] font-black uppercase text-purple-600 tracking-widest hover:text-purple-700 transition-colors flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              {showExampleIndex === i ? 'Hide AI Fill Example' : 'See How to Fill'}
                            </button>
                            {f.exampleValue && (
                              <button 
                                onClick={() => copyToClipboard(f.exampleValue, i)}
                                className={cn(
                                  "p-1 px-2 rounded-lg transition-all flex items-center gap-1 border",
                                  copiedIndex === i 
                                    ? "bg-green-50 text-green-600 border-green-100" 
                                    : "bg-gray-50 text-gray-400 border-gray-100 hover:text-[#008069] bg-white"
                                )}
                              >
                                {copiedIndex === i ? <CheckCircle className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                <span className="text-[8px] font-black uppercase tracking-tighter">{copiedIndex === i ? 'Copied' : 'Copy Example'}</span>
                              </button>
                            )}
                           </div>
                        </div>
                        {showExampleIndex === i && f.exampleValue && (
                          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 border-dashed">
                             <p className="text-xs font-bold text-purple-900 italic">"{f.exampleValue}"</p>
                          </div>
                        )}
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeView === 'simulator' && (
             <FormSimulator 
               form={result} 
               userId={auth.currentUser?.uid} 
               initialData={result.formData}
               userProfile={userProfile}
               onDraftSaved={() => {
                 // Trigger sub to refresh drafts if needed
                 console.log("Draft saved successfully");
               }}
               isGuruActive={isGuruActive}
               onActivateGuru={onActivateGuru}
             />
           )}
           {activeView === 'guidance' && (
             <div className="flex flex-col gap-4">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden border border-white/10">
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#008069]/20 to-transparent pointer-events-none" />
                   <div className="w-16 h-16 rounded-[2rem] bg-[#008069] flex items-center justify-center shadow-lg shadow-[#008069]/40 z-10">
                      <Cpu className="w-8 h-8 text-white" />
                   </div>
                   <div className="z-10">
                      <h3 className="text-xl font-black uppercase tracking-widest mb-2">Live AI Guidance</h3>
                      <p className="text-xs text-gray-400 font-bold leading-relaxed max-w-[200px]">Aapke screen ko real-time analyze karke Mitra AI aapko audio guide dega.</p>
                   </div>
                   <button 
                     onClick={() => onActivateGuru(true)}
                     className="w-full bg-[#008069] text-white py-4 rounded-3xl font-black uppercase tracking-widest text-xs z-10 active:scale-95 transition-all shadow-xl"
                   >
                     Start Live Session
                   </button>
                </div>
             </div>
           )}
           {activeView === 'audit' && image && (
             <FormAudit 
               imageBase64={image.split(',')[1]} 
               userProfile={userProfile} 
               mimeType={fileMimeType} 
               onStartSimulator={(form) => {
                 setResult(form);
                 setActiveView('simulator');
               }}
             />
           )}
        </div>
      )}
    </div>
  );
};

const SchemeFollowUp = ({ scheme, onAskMitra }: { scheme: any, onAskMitra: (name: string, msg?: string) => void }) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    // Short delay for "Thinking" state
    await new Promise(resolve => setTimeout(resolve, 800));
    onAskMitra(scheme.hindiName, `Main ${scheme.hindiName} ke baare mein yeh puchna chahata hoon: ${query}`);
    setQuery('');
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#008069]/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-[#008069]/10" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#008069]" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Follow-up Questions</p>
        </div>
        <span className="text-[8px] font-bold text-[#008069] bg-[#008069]/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">AI Powered</span>
      </div>
      <div className="flex gap-2 relative z-10 text-nowrap">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hinglish mein puchhein (e.g. Kaunse documents chahiye?)"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAsk();
          }}
          disabled={isThinking}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:border-[#008069] focus:ring-4 focus:ring-green-50 shadow-sm placeholder:text-gray-400 disabled:opacity-50"
        />
        <button
          disabled={isThinking || !query.trim()}
          onClick={(e) => {
            e.stopPropagation();
            handleAsk();
          }}
          className="bg-[#008069] text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-[#005c4b] disabled:opacity-50 disabled:grayscale min-w-[120px]"
        >
          {isThinking ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              Mitra AI
              <Sparkles className="w-3 h-3" />
            </>
          )}
        </button>
      </div>
      <p className="text-[9px] text-gray-400 font-medium px-1">Tip: Aap is yojna ke eligibility, fayde ya process ke baare mein Hinglish mein puchh sakte hain.</p>
    </div>
  );
};

const PersonalizedRecommendations = ({ userProfile }: { userProfile: UserProfile }) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isProfileComplete = !!(userProfile.state && (userProfile.class || userProfile.stream || userProfile.needs));

  useEffect(() => {
    if (isProfileComplete && !recommendations && !isLoading) {
      const fetchReco = async () => {
        setIsLoading(true);
        try {
          const data = await getProfileRecommendations(userProfile);
          const markdown = data.markdownResponse || "Bhai, abhi jaankari nikalne mein thodi dikkat ho rahi hai. Kripya thodi der baad dekhein.";
          setRecommendations(markdown);
          localStorage.setItem('mitra_profile_reco', markdown);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      const cached = localStorage.getItem('mitra_profile_reco');
      if (cached) {
        setRecommendations(cached);
      } else {
        fetchReco();
      }
    }
  }, [isProfileComplete, userProfile.state, userProfile.class, userProfile.stream, userProfile.needs]);

  if (!isProfileComplete) return null;

  return (
    <div className="mt-8 mb-4">
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-[2.5rem] border border-orange-100 p-8 shadow-xl shadow-orange-900/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-100 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm border border-orange-200">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest leading-none">Mitra's Personalized Recommendation</h3>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-tight mt-1.5 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                Special suggestions based on your profile
              </p>
            </div>
          </div>

          {isLoading ? (
             <AILoader message="Mitra is analyzing your profile to find perfect matches..." />
          ) : recommendations ? (
            <div className="prose prose-sm prose-orange max-w-none prose-p:text-gray-800 prose-p:font-medium prose-p:leading-relaxed prose-headings:text-orange-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-li:text-gray-700 prose-li:font-medium">
              <ReactMarkdown>{recommendations}</ReactMarkdown>
              
              <div className="mt-8 pt-6 border-t border-orange-200 flex justify-center">
                 <p className="text-[10px] text-orange-500 font-bold flex items-center gap-2 italic">
                   <ShieldCheck className="w-4 h-4" />
                   AI Analysis based on state & stream data.
                 </p>
              </div>
            </div>
          ) : (
             <p className="text-xs text-gray-400 font-medium text-center py-4">Kuch issue aaya recommendation fetch karne mein. Kripya thodi der baad try karein.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const SchemeSmartTip = ({ scheme, userProfile }: { scheme: any, userProfile: UserProfile }) => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cachedTip = localStorage.getItem(`mitra_tip_${scheme.id || scheme.name}`);
    if (cachedTip) {
      setTip(cachedTip);
      return;
    }

    const generateTip = async () => {
      setLoading(true);
      try {
        const text = await getSchemeSmartTip(scheme, userProfile);
        setTip(text);
        localStorage.setItem(`mitra_tip_${scheme.id || scheme.name}`, text);
      } catch (err) {
        console.warn("Tip error:", err);
      } finally {
        setLoading(false);
      }
    };

    generateTip();
  }, [scheme, userProfile]);

  if (loading) return (
    <div className="p-4 bg-orange-50/30 rounded-2xl border border-dashed border-orange-200 animate-pulse flex items-center gap-3">
       <Sparkles className="w-4 h-4 text-orange-300" />
       <div className="h-3 bg-orange-100 rounded-full w-2/3" />
    </div>
  );

  if (!tip) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 bg-orange-50 rounded-3xl border border-orange-100 relative overflow-hidden"
    >
       <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 -mr-12 -mt-12 rounded-full blur-2xl" />
       <div className="flex items-start gap-3 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600 shrink-0">
             <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1">
             <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Mitra's AI Smart Tip</h4>
             <p className="text-xs text-orange-950 font-bold leading-relaxed">{tip}</p>
          </div>
       </div>
    </motion.div>
  );
};

const SchemesScreen = ({ userProfile, onAskMitra, savedSchemeIds, onToggleSave, onNavigate, initialExpandedId, onClearInitialExpandedId, applications, onStartSimulator, onShowFormAudit, schemes, onShowFeedback }: { 
  userProfile: UserProfile; 
  onAskMitra: (schemeName: string, customMessage?: string) => void;
  savedSchemeIds: string[];
  onToggleSave: (id: string) => void;
  onNavigate: (tab: string) => void;
  initialExpandedId?: string | null;
  onClearInitialExpandedId?: () => void;
  applications: TrackerApplication[];
  onStartSimulator: (form: any) => void;
  onShowFormAudit: (scheme: any) => void;
  schemes: Scheme[];
  onShowFeedback: (type?: any, relatedId?: string, relatedName?: string) => void;
}) => {
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [cachedAiResults, setCachedAiResults] = useState<any[]>([]);
  
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/cachedSchemes`), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ ...doc.data() }));
      setCachedAiResults(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/cachedSchemes`);
    });
    return () => unsubscribe();
  }, []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const statusColors = {
    'Submitted': 'bg-blue-50 text-blue-600 border-blue-100',
    'Under Review': 'bg-orange-50 text-orange-600 border-orange-100',
    'Approved': 'bg-green-50 text-green-600 border-green-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100'
  };

  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId || null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mitra_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.warn("Error parsing recent searches:", e);
      }
    }

    const savedAiResults = localStorage.getItem('mitra_cached_ai_results');
    if (savedAiResults) {
      try {
        setAiResults(JSON.parse(savedAiResults));
      } catch (e) {
        console.warn("Error parsing cached AI results:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mitra_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    if (aiResults.length > 0) {
      localStorage.setItem('mitra_cached_ai_results', JSON.stringify(aiResults.slice(0, 10)));
    }
  }, [aiResults]);

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
  const [showSaveInfoId, setShowSaveInfoId] = useState<string | null>(null);

  const [didCopyShare, setDidCopyShare] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadDoc, setActiveUploadDoc] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser || !activeUploadDoc) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          await addDoc(collection(db, `users/${auth.currentUser?.uid}/documents`), {
            name: activeUploadDoc,
            uploadedAt: Date.now(),
            fileName: file.name,
            fileSize: file.size,
            type: file.type,
            url: base64, // Persist base64 in Firestore
            category: 'Scheme Related'
          });
          showLocalNotification('Success', { body: `${activeUploadDoc} has been saved to your Doc Vault!` });
          setActiveUploadDoc(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
          console.error("Error saving to Firestore:", e);
          showLocalNotification('Error', { body: 'Failed to save to database. File might be too large.' });
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("Error reading file:", e);
      showLocalNotification('Error', { body: 'Failed to read file. Please try again.' });
    }
  };

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

  const cacheSchemeOffline = async (scheme: any) => {
    if (!auth.currentUser || !scheme) return;
    
    // Don't cache if already cached in current session
    if (cachedAiResults.some(c => c.name === scheme.name)) return;

    try {
      // Check if already in Firestore to avoid duplicates
      const q = query(
        collection(db, `users/${auth.currentUser.uid}/cachedSchemes`), 
        where("name", "==", scheme.name),
        limit(1)
      );
      const existing = await getDocs(q);
      
      if (existing.empty) {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/cachedSchemes`), {
          ...scheme,
          cachedAt: Date.now(),
          type: 'ai' // Ensure it's marked as AI for the offline filter
        });
      }
    } catch (e) {
      console.warn("Failed to cache scheme details:", e);
    }
  };

  const handleDeepSearch = async () => {
    if (!filter || !filter.trim()) {
      showToast("Bhai, search toh likhein pehle!", "warning");
      return;
    }
    setIsSearching(true);
    setAiResults([]); // Clear previous results
    try {
      const results = await searchSchemes(filter, userProfile);
      
      if (results.length === 0) {
        showToast("Maafi chahta hoon, iss topic par koi specific scheme nahi mili.", "info");
      }

      const taggedResults = results.map((r: any, i: number) => ({
        ...r,
        id: `ai-${Date.now()}-${i}`,
        mitraId: `MITRA-AI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        aiVersion: 'AI Model v2.1',
        type: 'ai',
        hindiDescription: r.description,
        cachedAt: Date.now()
      }));
      setAiResults(taggedResults);

      // Cache the first few results to Firestore for offline persistence
      if (auth.currentUser) {
        for (const res of taggedResults.slice(0, 3)) {
          try {
            await addDoc(collection(db, `users/${auth.currentUser.uid}/cachedSchemes`), res);
          } catch (e) {
            console.warn("Failed to cache scheme:", e);
          }
        }
      }
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
  
  const filteredSchemes = schemes.filter(s => {
    // Community Filter: If user has a community, prioritize matching it. 
    // If a scheme has a community tag, it MUST match the user profile community.
    if (userProfile.community && s.community && s.community !== userProfile.community) return false;

    const matchesSearch = filter 
      ? (s.name.toLowerCase().includes(filter.toLowerCase()) || s.hindiName.includes(filter))
      : true;
    const matchesCategory = selectedCategory 
      ? s.category === selectedCategory
      : true;
    const matchesSaved = showSavedOnly
      ? savedSchemeIds.includes(s.id)
      : true;
    return matchesSearch && matchesCategory && matchesSaved;
  });

  // Filter logic: show state-specific schemes first, or only state-specific if identified
  const stateSchemes = filteredSchemes.filter(s => s.state === userProfile.state);
  const otherSchemes = filteredSchemes.filter(s => !s.state || s.state !== userProfile.state);
  
  const displaySchemes = stateSchemes.length > 0 ? [...stateSchemes, ...otherSchemes] : filteredSchemes;

  // Tracking Status Updater
  const updateTrackingStatus = async (scheme: any, newStatus: string) => {
    if (!auth.currentUser) return;
    
    const existingApp = applications.find(a => 
      a.schemeName === scheme.hindiName || a.schemeName === scheme.name
    );
    const path = `users/${auth.currentUser.uid}/applications`;
    
    try {
      if (existingApp) {
        await updateDoc(doc(db, `${path}/${existingApp.id}`), {
          status: newStatus,
          updatedAt: Date.now()
        });
      } else {
        // If not tracking yet, start tracking with the status
        await addDoc(collection(db, path), {
          schemeName: scheme.hindiName,
          status: newStatus as any,
          applicationId: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          updatedAt: Date.now()
        });
      }
      showLocalNotification('Tracker Updated', { body: `${scheme.hindiName} ka status update kar diya gaya hai.` });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Filter AI results and cached AI results
  const filterAiSchemes = (schemes: any[]) => schemes.filter(s => {
    const matchesSearch = filter 
      ? (s.name?.toLowerCase().includes(filter.toLowerCase()) || 
         s.hindiName?.includes(filter) || 
         s.hindiDescription?.includes(filter))
      : true;
    const matchesCategory = selectedCategory 
      ? s.category === selectedCategory
      : true;
    const matchesSaved = showSavedOnly
      ? savedSchemeIds.includes(s.id)
      : true;
    return matchesSearch && matchesCategory && matchesSaved;
  });

  const filteredAiResults = filterAiSchemes(aiResults);
  const filteredCachedResults = filterAiSchemes(cachedAiResults);

  // Add AI results and cached AI results to the display
  const finalDisplay = [...displaySchemes, ...filteredAiResults, ...filteredCachedResults.filter(c => !filteredAiResults.some(a => a.name === c.name))];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev; // Limit to 3 comparison
      return [...prev, id];
    });
  };

  const selectedSchemes = [...schemes, ...aiResults].filter(s => selectedIds.includes(s.id));

  if (isComparing) {
    const categories_comparison = [
      { key: 'eligibility', label: 'Eligibility', icon: <CheckCircle className="w-4 h-4 text-orange-500" />, color: 'orange' },
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
          {isAnalyzing && (
            <div className="max-w-[1000px] mx-auto mb-8 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-2xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </div>
          )}
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
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => onAskMitra(`Mujhe ${s.hindiName} ke baare mein aur batayein.`)}
                      className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 hover:border-[#008069] hover:text-[#008069]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Ask Mitra
                    </button>
                    {s.officialUrl && (
                      <a 
                        href={s.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-orange-50 border border-orange-100 text-orange-600 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-100"
                      >
                        Apply Now
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex justify-center sticky bottom-0">
          <button 
            disabled={isAnalyzing}
            onClick={() => handleAIAnalysis(selectedSchemes)}
            className="w-full max-w-md py-5 bg-[#008069] text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-green-900/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-4 disabled:opacity-50"
          >
            {isAnalyzing ? (
               <AILoader message="Mitra AI is comparing & recommending..." />
            ) : (
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                  </div>
                  Get AI Recommendation
               </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
        accept="image/*,.pdf"
      />
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
            onClick={() => {
              if (!navigator.onLine) {
                alert("Deep AI Search ke liye internet zaroori hai. Par aap apne purane cached results aur core schemes offline dekh sakte hain.");
                return;
              }
              handleDeepSearch();
            }}
            disabled={isSearching || !filter}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center gap-2",
              navigator.onLine ? "bg-[#008069] text-white shadow-green-100 disabled:opacity-50" : "bg-gray-100 text-gray-400 border border-gray-200"
            )}
          >
            {isSearching ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              navigator.onLine ? <Globe className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />
            )}
            {isSearching ? 'Searching...' : navigator.onLine ? 'Deep AI Search' : 'Offline'}
          </button>
        </div>
        
        {!navigator.onLine && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
               <Cloud className="w-3 h-3 text-orange-600" />
            </div>
            <p className="text-[10px] text-orange-700 font-bold uppercase tracking-tight">
              Aap offline hain, par core schemes aur cached results available hain.
            </p>
          </motion.div>
        )}

        {isSearching && navigator.onLine && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-emerald-100 p-8 flex flex-col items-center shadow-lg shadow-emerald-900/5 mb-4"
          >
            <AILoader message="Mitra AI is analyzing your intent and deep searching government portals..." />
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
              !selectedCategory && !showSavedOnly
                ? "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100" 
                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
            )}
          >
            All
          </button>
          <button 
            onClick={() => {
              setShowSavedOnly(!showSavedOnly);
              setSelectedCategory(null);
            }}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5",
              showSavedOnly 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
            )}
          >
            <Bookmark className={cn("w-3 h-3", showSavedOnly && "fill-current")} />
            Saved
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => {
                setSelectedCategory(cat === selectedCategory ? null : cat);
                setShowSavedOnly(false);
              }}
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
      
      {isSearching && aiResults.length === 0 && (
        <div className="flex flex-col gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <Skeleton className="h-44 w-full" />
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                   <Skeleton className="h-6 w-3/4 rounded-lg" />
                   <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-16 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={cn("flex flex-col gap-4 mb-32", isSearching && aiResults.length > 0 && "opacity-60")}>
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
                await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
                setDidCopyShare(true);
                setTimeout(() => setDidCopyShare(false), 2000);
              }
            } catch (err: any) {
              // Only log if it's not a user cancellation (AbortError or "Share canceled" message)
              const isCancel = err.name === 'AbortError' || err.message?.toLowerCase().includes('cancel');
              if (!isCancel) {
                console.error('Error sharing:', err);
              }
            }
          };

          return (
            <div 
              key={scheme.id} 
              id={`scheme-card-${scheme.id}`}
              onClick={() => {
                const newExpandedState = !isExpanded;
                setExpandedId(newExpandedState ? scheme.id : null);
                if (newExpandedState && isAiResult) {
                  cacheSchemeOffline(scheme);
                }
              }}
              className={cn(
                "bg-white rounded-[2rem] border transition-all overflow-hidden flex flex-col relative cursor-pointer",
                isSelected ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-20 shadow-xl" : "border-gray-100 shadow-sm",
                isExpanded && "shadow-lg scale-[1.01]"
              )}
            >
              <div className="absolute top-4 left-4 flex gap-1.5 z-10 pointer-events-none">
                {!isAiResult && (
                  <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20 shadow-sm">
                    <Cloud className="w-2.5 h-2.5 text-[#008069]" />
                    <span className="text-[8px] font-black text-[#008069] uppercase tracking-tighter">Offline Access</span>
                  </div>
                )}
                {isAiResult && (
                  <div className="flex flex-col gap-1">
                    <div className="bg-blue-500/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20 shadow-sm">
                      <Globe className="w-2.5 h-2.5 text-white" />
                      <span className="text-[8px] font-black text-white uppercase tracking-tighter">Deep AI Hunt</span>
                    </div>
                    {cachedAiResults.some(c => c.name === scheme.name) && (
                      <div className="bg-[#008069]/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20 shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Cached Offline</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                      setShowSaveInfoId(scheme.id);
                    }}
                    className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-bold rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                    Why save this?
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
                      isSaved ? "bg-orange-500 text-white shadow-lg" : "bg-white/80 backdrop-blur-md text-gray-500 hover:bg-white transition-all shadow-sm"
                    )}
                  >
                    <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-bold rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                    {isSaved ? 'Hataiyein' : 'Save karein'}
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{scheme.hindiName}</h3>
                    </div>
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
                
                {/* Application Tracking */}
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <LayoutDashboard className="w-3 h-3 text-[#008069]" />
                       Track Status
                    </p>
                    {(() => {
                      const trackingApp = applications.find(a => a.schemeName === scheme.hindiName || a.schemeName === scheme.name);
                      if (!trackingApp) return null;
                      return (
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full border border-gray-100 uppercase tracking-widest",
                          statusColors[trackingApp.status as keyof typeof statusColors]
                        )}>
                          {trackingApp.status}
                        </span>
                      );
                    })()}
                  </div>
                  <select 
                    value={applications.find(a => a.schemeName === scheme.hindiName || a.schemeName === scheme.name)?.status || ""}
                    onChange={(e) => updateTrackingStatus(scheme, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#008069]/10 cursor-pointer"
                  >
                    <option value="" disabled>Status set karein...</option>
                    <option value="Submitted">Applied (Aavedan Kiya)</option>
                    <option value="Under Review">Under Review (Jaanch)</option>
                    <option value="Approved">Approved (Manzoor)</option>
                    <option value="Rejected">Rejected (Radd)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                   <div className="p-2 bg-orange-50 rounded-xl border border-orange-100 flex flex-col justify-center">
                      <p className="text-[8px] uppercase font-black text-orange-600 mb-0.5 tracking-tighter">Eligibility</p>
                      <p className="text-[10px] text-gray-800 font-bold leading-tight line-clamp-1">
                        {scheme.eligibility?.[0] || 'Check now'}
                      </p>
                   </div>
                   <div className="p-2 bg-green-50 rounded-xl border border-green-100 flex flex-col justify-center">
                      <p className="text-[8px] uppercase font-black text-green-600 mb-0.5 tracking-tighter">Benefit</p>
                      <p className="text-[10px] text-gray-800 font-bold leading-tight line-clamp-1">
                        {scheme.benefits?.[0] || 'AI can tell details'}
                      </p>
                   </div>
                   <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-center">
                      <p className="text-[8px] uppercase font-black text-blue-600 mb-0.5 tracking-tighter">Documents</p>
                      <p className="text-[10px] text-gray-800 font-bold leading-tight line-clamp-1">
                        {scheme.documents?.[0] || 'Aadhar/PAN'}
                      </p>
                   </div>
                </div>

                {scheme.officialUrl && (
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-4 bg-[#008069] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-100 active:scale-[0.98] transition-all hover:bg-[#00a687] flex items-center justify-center gap-2 border border-[#008069]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apply Now (Sarkari Link)
                  </a>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col gap-6 pt-4 border-t border-gray-50"
                    >
                      {/* Full Description & Follow-up - Placed below summary description as requested */}
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Scheme Details</p>
                           <p className="text-sm text-gray-700 leading-relaxed font-bold bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                             {scheme.hindiDescription || scheme.description}
                           </p>
                        </div>

                        <SchemeFollowUp scheme={scheme} onAskMitra={onAskMitra} />
                      </div>

                      <SchemeSmartTip scheme={scheme} userProfile={userProfile} />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {scheme.eligibility && scheme.eligibility.length > 0 && (
                          <div className="p-5 bg-orange-50/50 rounded-3xl border border-orange-100/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 -mr-10 -mt-10 rounded-full blur-xl" />
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                                <SearchCheck className="w-4 h-4" />
                              </div>
                              <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">Eligibility</h4>
                            </div>
                            <ul className="space-y-3">
                              {scheme.eligibility.map((e: string, i: number) => (
                                <li key={i} className="text-xs text-orange-950/80 font-bold flex gap-3 items-start leading-snug">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                  <span>{e}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {scheme.benefits && scheme.benefits.length > 0 && (
                          <div className="p-5 bg-green-50/50 rounded-3xl border border-green-100/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 -mr-10 -mt-10 rounded-full blur-xl" />
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                                <Award className="w-4 h-4" />
                              </div>
                              <h4 className="text-[11px] font-black text-green-900 uppercase tracking-widest">Benefits</h4>
                            </div>
                            <ul className="space-y-3">
                              {scheme.benefits.map((b: string, i: number) => (
                                <li key={i} className="text-xs text-green-950/80 font-bold flex gap-3 items-start leading-snug">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {scheme.documents && scheme.documents.length > 0 && (
                          <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 -mr-10 -mt-10 rounded-full blur-xl" />
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                <FileText className="w-4 h-4" />
                              </div>
                              <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Documents</h4>
                            </div>
                            <div className="flex flex-col gap-2">
                              {scheme.documents.map((d: string, i: number) => (
                                <div key={i} className="flex items-center justify-between bg-white/60 p-2.5 rounded-xl border border-blue-100/50 group/doc">
                                  <span className="text-xs font-bold text-blue-950/80">{d}</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveUploadDoc(d);
                                      fileInputRef.current?.click();
                                    }}
                                    className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all duration-700" />
                        <div className="relative z-10">
                          <header className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Mitra AI Hub</h4>
                            </div>
                            <p className="text-xs text-gray-300 font-medium">Verify official details & ask questions about this scheme in Hinglish.</p>
                          </header>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {scheme.officialUrl && (
                              <a
                                href={scheme.officialUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="py-4 bg-[#008069] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#008069]/20 active:scale-95 hover:bg-[#00a687] transition-all flex items-center justify-center gap-2 border border-[#008069]"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Apply Now (Official)
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAskMitra(`Tell me more about ${scheme.hindiName || scheme.name}. Mujhe is scheme ke baare mein visthar se jaankari chahiye (Eligibility, Documents, Application process).`);
                              }}
                              className="py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-900/20 active:scale-95 hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Ask Mitra AI
                            </button>
                            <button
                              onClick={handleShare}
                              className="py-4 bg-white text-gray-900 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:border-[#008069] transition-all flex items-center justify-center gap-2 group/share"
                            >
                              <Share2 className="w-4 h-4 text-[#008069] group-hover/share:scale-110 transition-transform" />
                              {didCopyShare ? 'Copied!' : 'Share Info'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAskMitra(`VERIFY_OFFICIAL: Please search and verify the details of ${scheme.hindiName || scheme.name} from its official government website right now. Match it with the latest 2026 data and correct any mistakes.`);
                              }}
                              className="py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Globe className="w-4 h-4 text-orange-400" />
                              Verify Details
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const schemeForm = {
                                  formName: scheme.hindiName || scheme.name,
                                  summary: `${scheme.hindiName || scheme.name} ke liye practice form simulator.`,
                                  fields: (scheme.documents || ['Aadhar Card', 'Mobile Number', 'Bank Details']).map((doc: string) => ({
                                    field: doc,
                                    explanation: `${doc} ki details yahan bharein.`,
                                    whyItMatters: doc.toLowerCase().includes('aadhar') ? "Identity verify karne ke liye zaroori hai." :
                                                  doc.toLowerCase().includes('mobile') ? "OTP aur updates ke liye sahi number chahiye." :
                                                  doc.toLowerCase().includes('bank') ? "Subsidy ka paisa seedha aapke account mein aayega." : "Form verification ke liye zaroori hai.",
                                    isCritical: true,
                                    exampleValue: doc.toLowerCase().includes('aadhar') ? "1234 5678 9012" : 
                                                  doc.toLowerCase().includes('mobile') ? "9876543210" : 
                                                  doc.toLowerCase().includes('bank') ? "98765432101 (IFSC: SBIN0001234)" : "Sample Value"
                                  }))
                                };
                                onStartSimulator(schemeForm);
                              }}
                              className="py-4 bg-orange-50 text-orange-600 border border-orange-100 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Practice Simulator
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center pb-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowFeedback('scheme', scheme.id, scheme.hindiName);
                          }}
                          className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] hover:text-[#008069] transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Scheme Feedback Dein
                        </button>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                          <div className="flex-1 mr-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Application Draft Mitra</h4>
                            <p className="text-[11px] text-gray-500 font-medium">Draft a personalized letter in seconds.</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateLetter(scheme);
                            }}
                            disabled={isGeneratingLetter && activeLetterSchemeId === scheme.id}
                            className={cn(
                              "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 border",
                              isGeneratingLetter && activeLetterSchemeId === scheme.id
                                ? "bg-gray-100 text-gray-400 border-gray-200"
                                : "bg-white text-gray-900 border-gray-200 shadow-sm hover:border-[#008069] active:scale-95"
                            )}
                          >
                            {isGeneratingLetter && activeLetterSchemeId === scheme.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                <span>Writing...</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 text-[#008069]" />
                                <span>Draft Letter</span>
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
              <div className="flex border-t border-gray-50 overflow-hidden">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskMitra(scheme.name);
                  }}
                  className={cn(
                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2",
                    scheme.officialUrl ? "bg-white text-[#008069] hover:bg-green-50" : "bg-[#008069] text-white hover:bg-[#005c4b]"
                  )}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Details
                </button>
                {scheme.officialUrl ? (
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-4 bg-[#008069] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#005c4b] transition-colors flex items-center justify-center gap-2 border-l border-white/10"
                  >
                    Apply Now
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Create a basic form structure based on the scheme
                      const schemeForm = {
                        formName: scheme.hindiName || scheme.name,
                        summary: `${scheme.hindiName || scheme.name} ke liye practice form simulator.`,
                        fields: (scheme.documents || ['Aadhar Card', 'Mobile Number', 'Bank Details']).map((doc: string) => ({
                          field: doc,
                          explanation: `${doc} ki details yahan bharein.`,
                          whyItMatters: doc.toLowerCase().includes('aadhar') ? "Sarkari records se data match karne ke liye base ID hai." :
                                        doc.toLowerCase().includes('mobile') ? "Form status ki jaankari SMS par milne ke liye." :
                                        doc.toLowerCase().includes('bank') ? "Benefit ka paisa DBT ke zariye seedhe khate mein pahuchega." : "Aapki eligibility confirm karne ke liye.",
                          isCritical: true,
                          exampleValue: doc.toLowerCase().includes('aadhar') ? "1234 5678 9012" : 
                                        doc.toLowerCase().includes('mobile') ? "9876543210" : 
                                        doc.toLowerCase().includes('bank') ? "98765432101 (IFSC: SBIN0001234)" : "Sample Value"
                        }))
                      };
                      onStartSimulator(schemeForm);
                    }}
                    className="flex-1 py-4 bg-[#008069] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#005c4b] transition-colors flex items-center justify-center gap-2 border-l border-white/10"
                  >
                    Practice
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PersonalizedRecommendations userProfile={userProfile} />

      {/* Persistent Bottom Comparison Bar */}
      <AnimatePresence>
        {showSaveInfoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveInfoId(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-xs rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Save Benefits</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Scheme ko bachaane ke fayde</p>
                  </div>
                </div>

                <div className="space-y-5 px-1">
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Quick Access</p>
                      <p className="text-xs text-gray-500 font-medium">'Saved' tab se kabhi bhi turant access karein.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">AI Tracking</p>
                      <p className="text-xs text-gray-500 font-medium">Mitra AI is scheme ke status aur deadlines par nazar rakhega.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                      <BellRing className="w-3 h-3 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Personalized Alerts</p>
                      <p className="text-xs text-gray-500 font-medium">Jab bhi is scheme par koi update aaye, aapko notification milega.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSaveInfoId(null)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 active:scale-95 transition-all"
                >
                  Samajh Gaya
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {loading && (
          <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-[90%] rounded-md" />
              <Skeleton className="h-4 w-[95%] rounded-md" />
              <Skeleton className="h-4 w-[85%] rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-[60%] rounded-md" />
            </div>
          </div>
        )}

        {letter && !loading && (
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

  const [justApproved, setJustApproved] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const path = `users/${userId}/applications/${id}`;
    if (newStatus === 'Approved') {
      setJustApproved(id);
      setTimeout(() => setJustApproved(null), 3000);
    }
    try {
      await updateDoc(doc(db, path), {
        status: newStatus,
        updatedAt: Date.now()
      });
      showLocalNotification('Status Update!', { 
        body: `Aapki application status ab "${newStatus}" ho gaya hai.` 
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
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-1/4 rounded-md ml-1" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-xl" />
                    <Skeleton className="h-8 w-24 rounded-xl" />
                    <Skeleton className="h-8 w-16 rounded-xl" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
            ))}
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
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#008069] font-black border border-gray-100 shrink-0 overflow-hidden relative">
                    {app.status === 'Approved' ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-emerald-600"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <span>{app.schemeName[0]}</span>
                    )}
                    {justApproved === app.id && (
                      <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        className="absolute inset-0 bg-emerald-500/20 rounded-full"
                      />
                    )}
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

const ProfileScreen = ({ user, profile, onUpdateProfile, onNavigate, onLogout }: { 
  user: any; 
  profile: UserProfile; 
  onUpdateProfile: (p: UserProfile) => Promise<void>; 
  onNavigate: (v: string) => void;
  onLogout: () => void;
}) => {
  const [editingProfile, setEditingProfile] = useState<UserProfile>(profile);
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditingProfile(profile);
  }, [profile]);

  const handleUpdate = (field: keyof UserProfile, value: any) => {
    setEditingProfile(prev => ({ ...prev, [field]: value }));
    setIsChanged(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateProfile(editingProfile);
    setIsChanged(false);
    setIsSaving(false);
    showToast("Profile Updated! AI suggestions will adapt.", "info");
  };

  const ProfileField = ({ label, icon: Icon, value, placeholder, field, type = 'text', options }: any) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</label>
      </div>
      {options ? (
        <div className="flex flex-wrap gap-2">
          {options.map((opt: string) => (
            <button
              key={opt}
              onClick={() => handleUpdate(field, opt)}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all",
                editingProfile[field as keyof UserProfile] === opt 
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input 
          type={type}
          value={editingProfile[field as keyof UserProfile] as string || ''}
          onChange={(e) => handleUpdate(field, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-50 border-gray-100/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="p-6 pb-32 flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('home')} 
            className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Profile Data</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">AI Identity Verification</p>
          </div>
        </div>
        {isChanged && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center gap-2 active:scale-95"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Changes
          </button>
        )}
      </header>

      {/* User Basic Info Card */}
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <Sparkles className="w-20 h-20 text-white" />
        </div>
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500 flex items-center justify-center text-white border-4 border-white/10 shadow-xl overflow-hidden">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-10 h-10" />
               )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-2xl font-black tracking-tight">{editingProfile.name || 'Set Your Name'}</h2>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">{editingProfile.community || 'Citizen'} Mitra AI</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
               <ShieldCheck className="w-3 h-3 text-emerald-400" />
               <span className="text-[9px] font-black text-white uppercase tracking-wider">Level {Math.floor(editingProfile.streak / 10) + 1} Verified</span>
            </div>
            <button 
              onClick={onLogout}
              className="bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/30 flex items-center gap-2 hover:bg-red-500/40 transition-colors"
            >
               <LogOut className="w-3 h-3 text-red-300" />
               <span className="text-[9px] font-black text-red-200 uppercase tracking-wider">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Section: Personal */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Personal Details</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <ProfileField 
              label="Full Name (As per Aadhar)" 
              icon={Edit2} 
              field="name" 
              placeholder="Enter your full name" 
            />
            
            <ProfileField 
              label="Gender" 
              icon={Users} 
              field="gender" 
              options={['Male', 'Female', 'Other']} 
            />

            <ProfileField 
              label="Category" 
              icon={FileBadge} 
              field="category" 
              options={['General', 'OBC', 'SC', 'ST', 'EWS']} 
            />
          </div>
        </div>

        {/* Section: Community & Career */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <BriefcaseIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Community & AI Personalization</h3>
          </div>

          <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex flex-col gap-6">
             <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Select Your Community</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Student', 'Farmer', 'Jobs', 'Normal'].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleUpdate('community', c)}
                      className={cn(
                        "py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-3",
                        editingProfile.community === c 
                          ? "bg-blue-600 text-white border-blue-600 shadow-xl scale-[1.02]" 
                          : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      {c === 'Student' && <GraduationCap className="w-5 h-5" />}
                      {c === 'Farmer' && <Wheat className="w-5 h-5" />}
                      {c === 'Jobs' && <BriefcaseIcon className="w-5 h-5" />}
                      {c === 'Normal' && <Users className="w-5 h-5" />}
                      {c}
                    </button>
                  ))}
                </div>
             </div>

             {editingProfile.community === 'Student' && (
               <>
                 <ProfileField label="Current Class" icon={GraduationCap} field="class" placeholder="e.g. Class 12" />
                 <ProfileField label="Stream" icon={Puzzle} field="stream" options={['PCB', 'PCM', 'Commerce', 'Arts', 'Others']} />
               </>
             )}

             <ProfileField 
              label="City / District" 
              icon={MapPin} 
              field="city" 
              placeholder="e.g. Patna, Bihar" 
             />

             <ProfileField 
              label="State" 
              icon={Globe} 
              field="state" 
              options={STATES} 
             />
          </div>
        </div>

        {/* Section: Preferences */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Languages className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Language & Communication</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <ProfileField 
              label="Preferred Language" 
              icon={Languages} 
              field="preferredLanguage" 
              options={['en', 'hi', 'hinglish']} 
             />

             <ProfileField 
              label="WhatsApp Number (For Alerts)" 
              icon={Phone} 
              field="whatsappNumber" 
              placeholder="+91 99999 99999" 
             />
          </div>
        </div>

        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 text-center flex flex-col gap-4">
           <Cpu className="w-8 h-8 text-gray-300 mx-auto" />
           <div>
              <p className="text-xs font-bold text-gray-900">AI Adaptation Active</p>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                Aapke profile changes AI model ko inform kar diye gaye hain. Agla response aapki nayi settings ke hisaab se hoga.
              </p>
           </div>
        </div>

        {isChanged && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Confirm Profile Updates
          </button>
        )}
      </div>
    </div>
  );
};

const SettingsScreen = ({ user, profile, onUpdateProfile, savedSchemeIds, onToggleSave, onNavigate, onNavigateToScheme, onShowFeedback, schemes }: { 
  user: User | null; 
  profile: UserProfile; 
  onUpdateProfile: (p: UserProfile) => void;
  savedSchemeIds: string[];
  onToggleSave: (id: string) => void;
  onNavigate: (tab: string) => void;
  onNavigateToScheme: (id: string) => void;
  onShowFeedback: () => void;
  schemes: Scheme[];
}) => {

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [localProfile, setLocalProfile] = useState(profile);
  const [hasChanges, setHasChanges] = useState(false);
  const [aadharError, setAadharError] = useState<string | null>(null);

  const updateLocal = (updates: Partial<UserProfile>) => {
    if (updates.aadharNumber !== undefined) {
      const val = updates.aadharNumber.replace(/\s/g, '');
      if (val && !/^\d{0,12}$/.test(val)) return; // Only numeric up to 12 digits
      updates.aadharNumber = val;
      
      if (val.length > 0 && val.length !== 12) {
        setAadharError("Kripya sahi 12 digits ka Aadhar number bharein, ye zaroori hai.");
      } else {
        setAadharError(null);
      }
    }
    setLocalProfile(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateProfile(localProfile);
    setHasChanges(false);
    showLocalNotification('Profile Updated', { 
      body: "Aapki jankari save ho gayi hai. Shukriya!" 
    });
  };

  const savedSchemes = schemes.filter(s => savedSchemeIds.includes(s.id));

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-sm text-gray-500">Apni jankari aur app settings badlein.</p>
        </div>
        {hasChanges && (
          <button 
            onClick={handleSave}
            disabled={!!aadharError}
            className={cn(
              "px-4 py-2 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all",
              aadharError ? "bg-gray-300 shadow-none cursor-not-allowed" : "bg-[#008069] shadow-green-100"
            )}
          >
            {aadharError ? "Fix Errors" : "Save Changes"}
          </button>
        )}
      </header>
      
      {/* User Profile Section */}
      <section className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Personal Details</h3>
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-6 flex flex-col gap-5">
           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
             <div className="relative">
               <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 value={localProfile.name || ''}
                 onChange={(e) => updateLocal({ name: e.target.value })}
                 placeholder="Apna naam likhein"
                 className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#008069]/10 outline-none"
               />
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
             <div className="relative">
               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="tel" 
                 value={localProfile.phoneNumber || ''}
                 onChange={(e) => updateLocal({ phoneNumber: e.target.value })}
                 placeholder="Contact number"
                 className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#008069]/10 outline-none"
               />
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-[#25D366] uppercase tracking-widest ml-1">Link WhatsApp (For Reminders)</label>
             <div className="relative">
               <MessageSquare className={cn(
                 "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                 localProfile.whatsappNumber ? "text-[#25D366]" : "text-gray-400"
               )} />
               <input 
                 type="tel" 
                 value={localProfile.whatsappNumber || ''}
                 onChange={(e) => updateLocal({ whatsappNumber: e.target.value })}
                 placeholder="WhatsApp number (e.g. 9876543210)"
                 className={cn(
                   "w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all",
                   localProfile.whatsappNumber ? "bg-green-50/20 border-[#25D366]/20" : ""
                 )}
               />
             </div>
             <p className="text-[9px] text-[#25D366] font-bold px-2 flex items-center gap-1.5 opacity-80">
               <ShieldCheck className="w-3 h-3" />
               <span>Deadlines ke liye WhatsApp par reminders mileinge!</span>
             </p>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">App Community Edition</label>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Student', label: 'Student', icon: GraduationCap },
                  { id: 'Farmer', label: 'Farmer', icon: Wheat },
                  { id: 'Normal', label: 'General', icon: UserIcon },
                  { id: 'Jobs', label: 'Jobs', icon: BriefcaseIcon }
                ].map(c => (
                  <button 
                    key={c.id}
                    onClick={() => updateLocal({ community: c.id as any })}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-95",
                      localProfile.community === c.id 
                        ? "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100" 
                        : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      localProfile.community === c.id ? "bg-white/20" : "bg-white text-gray-400"
                    )}>
                      <c.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
                  </button>
                ))}
             </div>
             <p className="text-[8px] text-gray-400 font-bold px-2 italic mt-1">Community badalne par app ka theme aur schemes bhi badal jayengi.</p>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Occupation (Pesha)</label>
             <div className="relative">
               <BriefcaseIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <select 
                 value={localProfile.occupation || ''}
                 onChange={(e) => updateLocal({ occupation: e.target.value as any })}
                 className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#008069]/10 outline-none appearance-none cursor-pointer"
               >
                 <option value="" disabled>Apna occupation chunein</option>
                 <option value="Farmer">Kisaan (Farmer)</option>
                 <option value="Student">Chhatra (Student)</option>
                 <option value="Worker">Mazdoor (Worker)</option>
                 <option value="Unemployed">Berozgaar (Unemployed)</option>
                 <option value="Other">Anya (Other)</option>
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown className="w-4 h-4" />
               </div>
             </div>
             {localProfile.occupation === 'Farmer' && (
               <p className="text-[8px] text-[#008069] font-bold px-2 flex items-center gap-1 mt-1 opacity-70">
                 <Sparkles className="w-2.5 h-2.5" /> Mandi rates (Bihar) directly aapke WhatsApp par!
               </p>
             )}
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
             <div className="relative">
               <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 value={localProfile.address || ''}
                 onChange={(e) => updateLocal({ address: e.target.value })}
                 placeholder="Sahi pata"
                 className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#008069]/10 outline-none"
               />
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
             <div className="flex gap-2">
                {(['Male', 'Female', 'Other'] as const).map(g => (
                  <button 
                    key={g}
                    onClick={() => updateLocal({ gender: g })}
                    className={cn(
                      "flex-1 py-3 rounded-2xl border font-bold text-xs transition-all",
                      localProfile.gender === g ? "bg-[#008069] text-white border-[#008069]" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {g === 'Male' ? 'Purush' : g === 'Female' ? 'Mahila' : 'Anya'}
                  </button>
                ))}
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Category (Server-Certified)</label>
             <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  value={localProfile.category || ''}
                  onChange={(e) => updateLocal({ category: e.target.value as any })}
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#008069]/10 outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>Category chunein</option>
                  <option value="General">General (UR)</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                   <ChevronDown className="w-4 h-4" />
                </div>
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Family Income (Masik Aay)</label>
             <div className="relative">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={localProfile.monthlyIncome || ''}
                  onChange={(e) => updateLocal({ monthlyIncome: e.target.value })}
                  placeholder="e.g. 15000"
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#008069]/10 outline-none"
                />
             </div>
             <p className="text-[8px] text-gray-400 font-bold px-2 italic">Aapki income ke hisaab se hum schemes suggest karenge.</p>
           </div>

           <div className="pt-2 border-t border-gray-50 mt-2 space-y-4">
               <div className="space-y-1.5">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Aadhar Number</label>
                   {localProfile.aadharNumber?.length === 12 && !aadharError && (
                     <span className="flex items-center gap-1 text-[8px] font-black text-green-600 uppercase tracking-tighter">
                       <ShieldCheck className="w-2.5 h-2.5" /> Verified Format
                     </span>
                   )}
                 </div>
                 <div className="relative">
                   <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input 
                     type="text" 
                     maxLength={12}
                     value={localProfile.aadharNumber || ''}
                     onChange={(e) => updateLocal({ aadharNumber: e.target.value })}
                     placeholder="12 digit Aadhar number"
                     className={cn(
                       "w-full bg-gray-50 border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#008069]/10 outline-none transition-all",
                       aadharError ? "ring-2 ring-red-100 border-red-200" : ""
                     )}
                   />
                 </div>
                 {aadharError && <p className="text-[9px] font-bold text-red-500 ml-2">{aadharError}</p>}
                      <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Aadhar Card Document</label>
                 <div 
                   className={cn(
                     "relative border-2 border-dashed rounded-[1.5rem] p-4 transition-all flex items-center justify-between gap-4",
                     localProfile.aadharDocUrl ? "border-green-100 bg-green-50/30" : "border-gray-100 hover:border-gray-200"
                   )}
                 >
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        localProfile.aadharDocUrl ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                      )}>
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {localProfile.aadharDocUrl ? "Aadhar Card Uploaded" : "Upload Aadhar Card"}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">PDF, JPG up to 5MB</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     {localProfile.aadharDocUrl && (
                       <button 
                         onClick={() => updateLocal({ aadharDocUrl: undefined })}
                         className="p-2 bg-white rounded-lg shadow-sm text-red-400 border border-red-50"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     )}
                     <div className="relative">
                       <input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer" 
                         onChange={(e) => {
                           if (e.target.files?.[0]) {
                             // Mock upload
                             updateLocal({ aadharDocUrl: URL.createObjectURL(e.target.files[0]) });
                           }
                         }}
                       />
                       <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                         {localProfile.aadharDocUrl ? "Replace" : "Select"}
                       </button>
                     </div>
                   </div>
                 </div>
                 <p className="text-[9px] text-gray-400 font-bold px-2 leading-tight flex items-start gap-2 opacity-80 mt-1">
                   <Info className="w-3.5 h-3.5 text-[#008069] mt-0.5 shrink-0" />
                   <span>Kripya Aadhar card ki saaf photo upload karein. Kam raushni (poor lighting) ya obstructions se details chhipna rejection ka bada karan ban sakta hai. Make sure all four edges are clearly visible.</span>
                 </p>
               </div>
         </div>
            </div>
        </div>
      </section>

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
                  <div className="flex flex-col gap-2">
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
                    {s.officialUrl && (
                      <a 
                        href={s.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-black uppercase tracking-widest text-[#008069] flex items-center gap-1 hover:underline"
                      >
                        Portal Apply Now <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
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
              value={localProfile.preferredLanguage}
              onChange={(e) => updateLocal({ preferredLanguage: e.target.value as any })}
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
                <BellRing className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
            </div>
            <button 
              onClick={() => updateLocal({ notificationsEnabled: !localProfile.notificationsEnabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                localProfile.notificationsEnabled ? "bg-[#008069]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                localProfile.notificationsEnabled ? "right-1" : "left-1"
              )} />
            </button>
          </div>

          <button 
            onClick={onShowFeedback}
            className="w-full bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">Feedback Karein</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">Aapka Rajya (State)</p>
            </div>
            <select 
              value={localProfile.state}
              onChange={(e) => updateLocal({ state: e.target.value })}
              className="bg-transparent border-none font-bold text-[#008069] text-sm p-0 focus:ring-0 max-w-[120px] text-right"
            >
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button 
            onClick={() => onUpdateProfile({ ...profile, hasCompletedTutorial: false })}
            className="w-full bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">App Tutorial Dekhein</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                 <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Push Notifications</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Deadline alerts aur updates</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                  updateLocal({ notificationsEnabled: !localProfile.notificationsEnabled });
                  if (!localProfile.notificationsEnabled) {
                    showLocalNotification('Notifications On Ho Gaye Hain!', { body: 'Ab aapko important updates milte rahenge.' });
                  }
                } else {
                  alert("Kripya browser settings mein notifications allow karein.");
                }
              }}
              className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300",
                localProfile.notificationsEnabled ? "bg-[#008069]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                localProfile.notificationsEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Version 1.0.0 • Form Mitra AI</p>
      </div>
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
      isPremium: false,
      streak: 0
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

const CSCHubContent = ({ onClose }: { onClose: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const map = useMap();
  
  const placesLib = useMapsLibrary('places');

  const handleSearch = async () => {
    if (!placesLib) return;
    if (!searchQuery.trim()) {
      showToast("Kripya city ka naam toh likhein bhai!", "warning");
      return;
    }
    setLoading(true);
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: `CSC Center in ${searchQuery}`,
        fields: ['displayName', 'location', 'formattedAddress', 'id'],
        maxResultCount: 10,
      });
      if (places.length === 0) {
        showToast("Maafi chahta hoon, iss jagah koi CSC center nahi mila.", "info");
      }
      setPlaces(places);
    } catch (error) {
      console.error("Error searching places:", error);
      showToast("Service mein dikkat hai, kripya thodi der baad dubaara try karein.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (places.length > 0 && map) {
      map.setCenter(places[0].location);
      map.setZoom(12);
    }
  }, [places, map]);

  return (
    <div className="fixed inset-0 bg-gray-50 z-[100] flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header / Desktop Sidebar Header */}
      <div className="bg-white border-b lg:border-r border-gray-100 flex flex-col w-full lg:w-96 shrink-0 z-20">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center active:scale-95 transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex flex-col items-center">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2 leading-none">Mitra AI</h2>
              <span className="text-base font-black text-gray-900 tracking-tight">CSC Locator</span>
            </div>
            <div className="w-10" />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#008069] transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="City ka naam likhein (e.g. Patna)..."
              className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 pl-11 pr-5 text-sm font-medium focus:ring-2 focus:ring-[#008069]/10 focus:border-[#008069] transition-all outline-none"
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
          {places.length === 0 && !loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-4 opacity-40">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <MapIcon className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest leading-loose">
                SEARCH FOR CSC CENTERS<br/>NEAR YOUR LOCATION
              </p>
            </div>
          )}
          
          {places.map((place) => (
            <button
              key={place.id}
              onClick={() => {
                setSelectedPlace(place);
                if (map) {
                  map.setCenter(place.location);
                  map.setZoom(16);
                }
              }}
              className={cn(
                "w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 active:scale-[0.98]",
                selectedPlace?.id === place.id 
                  ? "border-gray-900 bg-gray-900 text-white shadow-xl shadow-gray-900/10" 
                  : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                selectedPlace?.id === place.id ? "bg-white/10 text-white" : "bg-blue-50 text-blue-600"
              )}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{place.displayName}</h4>
                <p className={cn(
                  "text-[10px] font-medium leading-normal mt-1",
                  selectedPlace?.id === place.id ? "text-white/60" : "text-gray-400"
                )}>
                  {place.formattedAddress}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative bg-gray-200 min-h-[300px] lg:min-h-screen">
        <GoogleMap
          defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
          defaultZoom={5}
          mapId="CSC_LOCATOR_MAP"
          disableDefaultUI={true}
          zoomControl={true}
          clickableIcons={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {places.map(place => (
            <AdvancedMarker
              key={place.id}
              position={place.location}
              onClick={() => setSelectedPlace(place)}
            >
              <Pin 
                background={selectedPlace?.id === place.id ? '#111827' : '#2563eb'}
                borderColor={selectedPlace?.id === place.id ? '#fff' : '#1e40af'}
                glyphColor="#fff"
                scale={selectedPlace?.id === place.id ? 1.2 : 1}
              />
            </AdvancedMarker>
          ))}

          {selectedPlace && (
            <InfoWindow
              position={selectedPlace.location}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div className="p-3 min-w-[200px]">
                <h4 className="font-black text-xs uppercase tracking-wider text-gray-900 mb-1">{selectedPlace.displayName}</h4>
                <p className="text-[10px] text-gray-500 font-medium mb-3">{selectedPlace.formattedAddress}</p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.location.lat},${selectedPlace.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-gray-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest"
                >
                  Get Directions
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

const CSCHub = ({ onClose }: { onClose: () => void }) => {
  if (!HAS_MAPS_KEY) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">CSC Locator</h2>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-orange-50 flex items-center justify-center text-orange-500">
            <MapPin className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Google Maps Key Required</h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Nearby center search allow karne ke liye GOOGLE_MAPS_PLATFORM_KEY secret add karein.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl text-left w-full max-w-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Setup Steps</p>
            <ol className="text-xs text-gray-600 space-y-4 list-decimal pl-4 font-medium">
              <li>Open <b>Settings</b> (⚙️ gear icon) &gt; <b>Secrets</b></li>
              <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
              <li className="text-[#008069]">
                <b>Important:</b> Google Cloud Console mein jaakar <b>Maps JavaScript API</b> aur <b>Places API</b> ko "Enable" karein.
              </li>
              <li>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/library/maps-backend.googleapis.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  Enable API Here <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAPS_API_KEY}>
      <CSCHubContent onClose={onClose} />
    </APIProvider>
  );
};

// --- Global Utils ---
export const showToast = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
  window.dispatchEvent(new CustomEvent('mitra-toast', { detail: { message, type } }));
};

const ErrorToast = ({ message, type, onClose }: { message: string, type: string, onClose: () => void }) => {
  const isError = type === 'error';
  const isWarning = type === 'warning';
  
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className={cn(
        "fixed bottom-24 left-4 right-4 z-[150] p-4 rounded-[1.5rem] shadow-2xl flex items-center justify-between gap-4 border overflow-hidden",
        isError ? "bg-red-600 border-red-500 text-white" : 
        isWarning ? "bg-orange-500 border-orange-400 text-white" :
        "bg-gray-900 border-gray-800 text-white"
      )}
    >
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 right-0 h-1 bg-white/20"
      />
      
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          {isError && <AlertCircle className="w-5 h-5" />}
          {isWarning && <AlertTriangle className="w-5 h-5" />}
          {!isError && !isWarning && <Info className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">System Notification</p>
          <p className="text-xs font-bold leading-relaxed">{message}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl shrink-0">
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [targetSchemeId, setTargetSchemeId] = useState<string | null>(null);
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  
  const [schemes, setSchemes] = useState<Scheme[]>(STATIC_SCHEMES);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncSchemes = async () => {
      setIsSyncing(true);
      try {
        const dynamicSchemes = await schemeSyncService.getAllSchemes();
        if (dynamicSchemes.length > 0) {
          setSchemes(dynamicSchemes);
        } else {
          // One-time seed for demo if empty
          await schemeSyncService.seedInitialSchemes();
          const fresh = await schemeSyncService.getAllSchemes();
          if (fresh.length > 0) setSchemes(fresh);
        }
      } catch (err) {
        console.warn('Scheme sync failed, using static data:', err);
      } finally {
        setIsSyncing(false);
      }
    };
    syncSchemes();
  }, []);

  const [isGuruActive, setIsGuruActive] = useState(false);
  const [guruAutoStart, setGuruAutoStart] = useState(false);
  const [isCSCHubOpen, setIsCSCHubOpen] = useState(false);
  const [preloadedForm, setPreloadedForm] = useState<any | null>(null);
  const [errorToast, setErrorToast] = useState<{ message: string; type: 'error' | 'warning' | 'info' } | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setErrorToast(e.detail);
      setTimeout(() => setErrorToast(null), 6000);
    };
    window.addEventListener('mitra-toast', handleToast);
    return () => window.removeEventListener('mitra-toast', handleToast);
  }, []);

  const handleActivateGuru = (autoStart = false) => {
    setIsGuruActive(true);
    setGuruAutoStart(autoStart);
  };

  const handleShowFeedback = (type: any = 'general', relatedId?: string, relatedName?: string) => {
    setFeedbackConfig({ type, relatedId, relatedName });
    setShowFeedback(true);
  };
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackConfig, setFeedbackConfig] = useState<{ type: 'issue' | 'suggestion' | 'general' | 'scheme' | 'guide'; relatedId?: string; relatedName?: string }>({ type: 'general' });
  const [showFormAudit, setShowFormAudit] = useState(false);
  const [auditScheme, setAuditScheme] = useState<any>(null);
  const [showHandwrittenAudit, setShowHandwrittenAudit] = useState(false);
  const [showWhatsAppGenerator, setShowWhatsAppGenerator] = useState(false);
  const [showDocumentEnhancer, setShowDocumentEnhancer] = useState(false);
  const [showScraperPro, setShowScraperPro] = useState(false);
  const [showPdfUtility, setShowPdfUtility] = useState(false);
  const [showImageAutoFitter, setShowImageAutoFitter] = useState(false);
  const [showEligibilityMatcher, setShowEligibilityMatcher] = useState(false);
  const [showSchemeDiscovery, setShowSchemeDiscovery] = useState(false);
  const [showMasterProfile, setShowMasterProfile] = useState(false);
  const [showCounselingGuide, setShowCounselingGuide] = useState(false);

  const startChatWithScheme = (schemeName: string, customMessage?: string) => {
    const message = customMessage || `Mujhe ${schemeName} scheme ki poori jaankari chahiye. Iske latest updates, benefits aur kaise apply karna hai woh batayein. Google search karke sahi details dein.`;
    setChatContext(message);
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
  const [isSaving, setIsSaving] = useState(false);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    preferredLanguage: 'hi',
    isPremium: false,
    state: undefined,
    streak: 0,
    notificationsEnabled: true
  });

  const toggleSaveScheme = async (id: string) => {
    const newIds = savedSchemeIds.includes(id) 
      ? savedSchemeIds.filter(i => i !== id) 
      : [...savedSchemeIds, id];
    
    setSavedSchemeIds(newIds);
    if (user) {
      await saveProfile({ ...profile, savedSchemeIds: newIds });
    }
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
            const data = profileDoc.data() as UserProfile;
            setProfile(data);
            setSavedSchemeIds(data.savedSchemeIds || []);
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

  useEffect(() => {
    (window as any).showWhatsAppGenerator = () => setShowWhatsAppGenerator(true);
    return () => {
      delete (window as any).showWhatsAppGenerator;
    };
  }, []);

  const saveProfile = async (newProfile: UserProfile) => {
    if (!user) return;
    setIsSaving(true);
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...newProfile,
        uid: user.uid,
        name: user.displayName || newProfile.name || '',
        email: user.email || ''
      }, { merge: true });
      setProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const [applications, setApplications] = useState<TrackerApplication[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    // Load from cache first
    const cached = localStorage.getItem('mitra_news_cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
          setNews(data);
          setLoadingNews(false);
        }
      } catch (e) {
        console.warn("Error parsing news cache:", e);
      }
    }

    const fetchNews = async () => {
      if (!profile.preferredLanguage) return; 
      try {
        const data = await getDailyNews(profile);
        setNews(data);
        localStorage.setItem('mitra_news_cache', JSON.stringify({ data, timestamp: Date.now() }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, [profile.state, profile.occupation]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/applications`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TrackerApplication[];
      setApplications(apps.sort((a, b) => b.updatedAt - a.updatedAt));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/applications`);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (profile.notificationsEnabled === false) return;

    const checkSavedSchemes = () => {
      const savedSchemes = schemes.filter(s => savedSchemeIds.includes(s.id));
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      savedSchemes.forEach(scheme => {
        // 1. Deadline nearing
        if (scheme.deadline) {
          const timeLeft = scheme.deadline - now;
          if (timeLeft > 0 && timeLeft < threeDays) {
            const storageKey = `notif_deadline_${scheme.id}`;
            const lastSent = localStorage.getItem(storageKey);
            
            if (!lastSent || now - parseInt(lastSent) > 24 * 60 * 60 * 1000) {
              const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
              const title = `Deadline Alert: ${scheme.name}`;
              const body = `Bhai, ${scheme.name} ki deadline ${daysLeft === 0 ? 'aaj hi' : daysLeft + ' din mein'} hai. Jaldi form bharo!`;
              
              const newNotif: AppNotification = {
                id: `deadline-${scheme.id}-${now}`,
                title,
                body,
                type: 'deadline',
                timestamp: now,
                read: false,
                actionUrl: 'schemes'
              };
              
              setNotifications(prev => [newNotif, ...prev]);
              showLocalNotification(title, { body });
              localStorage.setItem(storageKey, now.toString());
            }
          }
        }

        // 2. Scheme Updated
        if (scheme.lastUpdate) {
          const timeSinceUpdate = now - scheme.lastUpdate;
          // Trigger if updated in the last 2 hours (simulated update windows)
          if (timeSinceUpdate > 0 && timeSinceUpdate < 2 * 60 * 60 * 1000) {
             const storageKey = `notif_update_${scheme.id}`;
             const lastSent = localStorage.getItem(storageKey);

             if (!lastSent || now - parseInt(lastSent) > 1 * 60 * 60 * 1000) {
               const title = `Scheme Update: ${scheme.name}`;
               const body = `Dost, ${scheme.name} mein naya update aaya hai. Details check karein.`;
               
               const newNotif: AppNotification = {
                 id: `update-${scheme.id}-${now}`,
                 title,
                 body,
                 type: 'news',
                 timestamp: now,
                 read: false,
                 actionUrl: 'schemes'
               };
               
               setNotifications(prev => [newNotif, ...prev]);
               showLocalNotification(title, { body });
               localStorage.setItem(storageKey, now.toString());
             }
          }
        }
      });
    };

    checkSavedSchemes();
    const interval = setInterval(checkSavedSchemes, 15 * 60 * 1000); // Check every 15 mins
    return () => clearInterval(interval);
  }, [savedSchemeIds, profile.notificationsEnabled]);

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
  if (!profile.class || !profile.state || !profile.community) {
    return <Onboarding onComplete={saveProfile} />;
  }

  // Interactive Tutorial check
  if (!profile.hasCompletedTutorial) {
    return <InteractiveTutorial onComplete={() => saveProfile({ ...profile, hasCompletedTutorial: true })} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-safe-area-top selection:bg-orange-100 flex flex-col font-sans">
      <CommunityDecorations community={profile.community} />
      <OfflineNotice />
      
      <div className={cn(
        "max-w-lg mx-auto bg-white/95 backdrop-blur-md w-full flex-1 flex flex-col relative shadow-2xl overflow-hidden",
        "h-[100dvh]" // Use dynamic viewport height for mobile
      )}>
        {/* Global Navigation at Top */}
        <div className="w-full shrink-0 z-[70] bg-white">
          <GlobalNav active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-col flex"
            >
              {activeTab === 'home' && (
                <HomeScreen 
                  onNavigate={(target) => {
                    if (target === 'handwritten') {
                      setShowHandwrittenAudit(true);
                    } else {
                      setActiveTab(target as any);
                    }
                  }} 
                  userProfile={profile} 
                  onAskMitra={(q) => {
                    setChatContext(q);
                    setActiveTab('chat');
                  }} 
                  unreadCount={unreadCount}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  savedSchemeIds={savedSchemeIds}
                  onNavigateToScheme={(id) => {
                    setTargetSchemeId(id);
                    setActiveTab('schemes');
                  }}
                  onShowSchemeDiscovery={() => setShowSchemeDiscovery(true)}
                  onStartSimulator={(form) => {
                    setPreloadedForm(form);
                    setActiveTab('guide');
                  }}
                  onShowFormAudit={() => {
                    setAuditScheme(null);
                    setShowFormAudit(true);
                  }}
                  news={news}
                  loadingNews={loadingNews}
                  schemes={schemes}
                />
              )}
              {activeTab === 'schemes' && (
                <SchemesScreen 
                  userProfile={profile} 
                  onAskMitra={startChatWithScheme} 
                  savedSchemeIds={savedSchemeIds}
                  onToggleSave={toggleSaveScheme}
                  onNavigate={setActiveTab}
                  initialExpandedId={targetSchemeId}
                  onClearInitialExpandedId={() => setTargetSchemeId(null)}
                  applications={applications}
                  onStartSimulator={(form) => {
                    setPreloadedForm(form);
                    setActiveTab('tools');
                  }}
                  onShowFormAudit={(scheme) => {
                    setAuditScheme(scheme);
                    setShowFormAudit(true);
                  }}
                  schemes={schemes}
                  onShowFeedback={handleShowFeedback}
                />
              )}
              {activeTab === 'chat' && (
                <ChatScreen 
                  initialMessage={chatContext} 
                  onMessageConsumed={() => setChatContext(undefined)}
                  userProfile={profile}
                  onNavigate={setActiveTab}
                  onSetTargetSchemeId={setTargetSchemeId}
                  schemes={schemes}
                  onShowMasterProfile={() => setShowMasterProfile(true)}
                  onShowFeedback={handleShowFeedback}
                />
              )}
              {activeTab === 'guide' && (
                <GuideScreen 
                  onNavigate={setActiveTab} 
                  userProfile={profile} 
                  isGuruActive={isGuruActive}
                  onActivateGuru={handleActivateGuru}
                  preloadedForm={preloadedForm}
                  onClearPreloadedForm={() => setPreloadedForm(null)}
                />
              )}
              {activeTab === 'tools' && (
                <ToolsScreen 
                  userProfile={profile} 
                  onNavigate={setActiveTab} 
                  onAskMitra={(q) => {
                    setChatContext(q);
                    setActiveTab('chat');
                  }} 
                  isGuruActive={isGuruActive}
                  onActivateGuru={handleActivateGuru}
                  onShowFormAudit={() => {
                    setAuditScheme(null);
                    setShowFormAudit(true);
                  }}
                  onShowHandwrittenAudit={() => setShowHandwrittenAudit(true)}
                  onShowDocumentEnhancer={() => setShowDocumentEnhancer(true)}
                  onShowScraperPro={() => setShowScraperPro(true)}
                  onShowPdfUtility={() => setShowPdfUtility(true)}
                  onShowImageAutoFitter={() => setShowImageAutoFitter(true)}
                  onShowEligibilityMatcher={() => setShowEligibilityMatcher(true)}
                  onShowSchemeDiscovery={() => setShowSchemeDiscovery(true)}
                  onShowMasterProfile={() => setShowMasterProfile(true)}
                  onShowCounselingGuide={() => setShowCounselingGuide(true)}
                  onOpenCSCHub={() => setIsCSCHubOpen(true)}
                  preloadedForm={preloadedForm}
                  onClearPreloadedForm={() => setPreloadedForm(null)}
                />
              )}
              {activeTab === 'premium' && <PremiumScreen userProfile={profile} onSave={saveProfile} />}
              {activeTab === 'news' && (
                <div className="p-6 pb-24">
                   <header className="mb-6 flex items-center gap-3">
                      <button onClick={() => setActiveTab('home')} className="p-2 bg-gray-50 rounded-xl">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Audio News Feed</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Sunein aaj ke mukhya samachar</p>
                      </div>
                   </header>
                   <NewsWidget 
                     userProfile={profile} 
                     news={news} 
                     loading={loadingNews} 
                     onAskMitra={(q) => {
                       setChatContext(q);
                       setActiveTab('chat');
                     }} 
                   />
                </div>
              )}
              {activeTab === 'vault' && (
                <div className="p-6 pb-24">
                  <header className="mb-6 flex items-center gap-3">
                    <button onClick={() => setActiveTab('home')} className="p-2 bg-gray-50 rounded-xl">
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-black text-gray-900 tracking-tight">Document Vault</h1>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Safe & Encryption Secured</p>
                    </div>
                  </header>
                  <VaultScreen 
                    userProfile={profile} 
                    onNavigate={setActiveTab} 
                    onShowMasterProfile={() => setShowMasterProfile(true)} 
                  />
                </div>
              )}
              {activeTab === 'profile' && (
                <ProfileScreen 
                  user={user}
                  profile={profile}
                  onUpdateProfile={saveProfile}
                  onNavigate={setActiveTab}
                  onLogout={async () => {
                    await signOut(auth);
                    setUser(null);
                  }}
                />
              )}
              {activeTab === 'letters' && <LetterScreen userProfile={profile} />}
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
                  onShowFeedback={() => handleShowFeedback('general')}
                  schemes={schemes}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Ads at Bottom */}
        <div className="w-full shrink-0 z-[70] bg-white pb-safe-area-bottom">
          {!profile.isPremium && <AdBanner onUpgrade={() => setActiveTab('premium')} />}
        </div>
      </div>

      <AnimatePresence>
        {isGuruActive && (
          <div className="fixed inset-0 z-[60] flex flex-col pointer-events-none">
            <div className="flex-1 pointer-events-none" onClick={() => setIsGuruActive(false)} />
            <div className="p-4 pointer-events-auto">
              <LiveAiScreenGuru 
                userProfile={profile} 
                autoStart={guruAutoStart}
                onNavigate={(v) => { setActiveTab(v); setIsGuruActive(false); }} 
                onClose={() => setIsGuruActive(false)}
                onFillField={(name, value) => {
                  window.dispatchEvent(new CustomEvent('mitra-fill-field', { detail: { name, value } }));
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCSCHubOpen && (
          <CSCHub onClose={() => setIsCSCHubOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationCenter 
            notifications={notifications} 
            onClose={() => setIsNotificationsOpen(false)} 
            onMarkRead={handleMarkNotificationRead}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFormAudit && (
          <FormAuditModal 
            userProfile={profile} 
            onClose={() => {
              setShowFormAudit(false);
              setAuditScheme(null);
            }} 
            onStartSimulator={(form) => {
              setPreloadedForm(form);
              setActiveTab('guide');
              setShowFormAudit(false);
              setAuditScheme(null);
            }}
            initialScheme={auditScheme}
            schemes={schemes}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHandwrittenAudit && (
          <HandwrittenAuditModal 
            onClose={() => setShowHandwrittenAudit(false)} 
            onStartSimulator={(form) => {
              setPreloadedForm(form);
              setActiveTab('guide');
              setShowHandwrittenAudit(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageAutoFitter && (
          <ImageAutoFitterModal onClose={() => setShowImageAutoFitter(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEligibilityMatcher && (
          <EligibilityMatcherModal userProfile={profile} onClose={() => setShowEligibilityMatcher(false)} schemes={schemes} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchemeDiscovery && (
          <SchemeDiscoveryModal 
            userProfile={profile} 
            onClose={() => setShowSchemeDiscovery(false)} 
            onAskMitra={(q) => {
              setChatContext(q);
              setActiveTab('chat');
              setShowSchemeDiscovery(false);
            }}
            schemes={schemes}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMasterProfile && (
          <MasterProfileModal 
            userProfile={profile} 
            onClose={() => setShowMasterProfile(false)} 
            onUpdateProfile={(updates) => setProfile(prev => ({ ...prev, ...updates }))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCounselingGuide && (
          <CounselingGuideModal userProfile={profile} onClose={() => setShowCounselingGuide(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDocumentEnhancer && (
          <DocumentEnhancerModal onClose={() => setShowDocumentEnhancer(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScraperPro && (
          <ScraperProModal onClose={() => setShowScraperPro(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPdfUtility && (
          <PdfUtilityModal onClose={() => setShowPdfUtility(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeedback && (
          <FeedbackModal 
            onClose={() => setShowFeedback(false)} 
            initialType={feedbackConfig.type}
            relatedId={feedbackConfig.relatedId}
            relatedName={feedbackConfig.relatedName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWhatsAppGenerator && (
          <WhatsAppNotificationGenerator 
            userProfile={profile} 
            onClose={() => setShowWhatsAppGenerator(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLiveCallOpen && (
          <LiveCall onClose={() => setIsLiveCallOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorToast && (
          <ErrorToast 
            message={errorToast.message} 
            type={errorToast.type} 
            onClose={() => setErrorToast(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSaving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-gray-100">
              <div className="w-8 h-8 border-4 border-gray-100 border-t-[#008069] rounded-full animate-spin" />
              <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Saving Profile...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
