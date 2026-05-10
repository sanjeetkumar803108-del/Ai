import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  X,
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
  BellRing,
  ExternalLink,
  ShieldCheck,
  Play,
  Pause,
  Calendar,
  FileText,
  Copy,
  Check,
  MapPin,
  History,
  Plus,
  MessageSquare,
  LayoutGrid,
  Map as MapIcon,
  Loader2,
  WifiOff,
  CloudOff,
  Cloud,
  Briefcase as BriefcaseIcon
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AuthScreen } from './components/Auth';
import { LiveCall } from './components/LiveCall';
import { SCHEMES, STATES } from './constants';
import { Message, UserProfile, TrackerApplication, Conversation, Quiz, UserDocument, NewsItem, AppNotification, FormDraft } from './types';
import { 
  getAIResponse, 
  analyzeForm, 
  generateSchemeLetter, 
  searchSchemes, 
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
  SCREEN_GURU_TOOLS,
  ai
} from './services/geminiService';
import { Modality } from '@google/genai';
import { floatTo16BitPCM, pcmToFloat32, base64ToUint8Array, uint8ArrayToBase64 } from './lib/audio';
import { requestNotificationPermission, showLocalNotification, MOCK_NOTIFICATIONS } from './services/notificationService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
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

const FeedbackModal = ({ onClose }: { onClose: () => void }) => {
  const [type, setType] = useState<'issue' | 'suggestion' | 'general'>('general');
  const [content, setContent] = useState('');
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
        status: 'pending',
        timestamp: Date.now()
      });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Feedback submit nahi ho saka. Kripya firse try karein.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Feedback Mitra</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Help us improve for you</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm">
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Feedback Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['issue', 'suggestion', 'general'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "py-3 rounded-2xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                      type === t ? "bg-[#008069] text-white border-[#008069] shadow-lg" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === 'issue' ? "Kya dikat aa rahi hai?" :
                  type === 'suggestion' ? "App ko aur behtar kaise banayein?" :
                  "Aapka anubhav kaisa raha?"
                }
                className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008069]/20 resize-none min-h-[150px]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="w-full bg-[#008069] text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

const FormAuditModal = ({ userProfile, onClose }: { userProfile: UserProfile; onClose: () => void }) => {
  const [image, setImage] = useState<string | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAudit = async () => {
    if (!image) return;
    setAuditing(true);
    try {
      const base64 = image.split(',')[1];
      const auditResult = await predictFormRejection(base64, 'image/jpeg', userProfile);
      setResult(auditResult);
    } catch (err) {
      console.error("Audit error:", err);
      alert("Form audit nahi ho saka. Kripya firse try karein.");
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
                    image && "border-indigo-200 bg-indigo-50/10"
                  )}
                >
                  {image ? (
                    <img src={image} className="absolute inset-0 w-full h-full object-contain" alt="Form preview" />
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap to upload form photo</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
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
                  onClick={handleAudit}
                  disabled={!image || auditing}
                  className="w-full bg-[#008069] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {auditing ? (
                    <div className="flex items-center justify-center gap-3">
                       <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                       Analyzing Form...
                    </div>
                  ) : 'Start AI Audit Result'}
                </button>
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

const BottomNav = ({ active, onChange }: { active: string; onChange: (v: string) => void }) => {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'schemes', icon: BookOpen, label: 'Schemes' },
    { id: 'tools', icon: LayoutDashboard, label: 'Tools' },
    { id: 'chat', icon: MessageCircle, label: 'Mitra AI' },
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

const ToolsScreen = ({ userProfile, onNavigate, isGuruActive, onActivateGuru, onShowFormAudit, onOpenCSCHub, preloadedForm, onClearPreloadedForm }: { 
  userProfile: UserProfile; 
  onNavigate: (v: string) => void;
  isGuruActive: boolean;
  onActivateGuru: (autoStart?: boolean) => void;
  onShowFormAudit: () => void;
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Smart Utility Tools</h1>
          <p className="text-xs text-gray-500 font-medium tracking-tight">AI powered tools for students.</p>
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
         <div className="flex flex-col gap-4">
            <div 
              onClick={() => {
                onNavigate('schemes');
                setTimeout(() => {
                  alert("COMPARE MODE: Schemes par 'Check' icon tap karein (Max 3) phir niche Compare button dabayein!");
                }, 800);
              }}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 cursor-pointer hover:border-orange-100 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                     <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 leading-tight">Scheme Comparison</h3>
                     <p className="text-[10px] text-gray-400 font-medium">Side-by-side eligibility & benefits analyzer</p>
                  </div>
                  <div className="ml-auto">
                     <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
               </div>
            </div>

            <div 
               onClick={onShowFormAudit}
               className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 cursor-pointer hover:border-indigo-100 transition-colors"
             >
                <div className="flex items-center gap-4">
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
         </div>
       )}
       {activeTool === 'vault' && <VaultScreen userProfile={userProfile} onNavigate={onNavigate} />}
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
      <div className="fixed inset-0 bg-white z-[60] p-8 flex flex-col gap-6">
        <header className="flex items-center gap-4">
           <div className="w-2 h-10 bg-[#008069] rounded-full" />
           <h2 className="text-2xl font-black text-gray-900 leading-tight">Apni Details Batayein</h2>
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

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aapka Rajya (State)?</label>
             <select 
               value={data.state}
               onChange={(e) => setData({ ...data, state: e.target.value })}
               className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#008069]/20"
             >
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
        </div>

        <button 
          onClick={() => onComplete(data)}
          className="mt-auto w-full bg-[#008069] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-green-100"
        >
          Dashbaord Dekhein
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

const FormSimulator = ({ form, userId, initialData, onDraftSaved, isGuruActive, onActivateGuru }: { 
  form: any; 
  userId?: string; 
  initialData?: Record<string, string>;
  onDraftSaved?: () => void;
  isGuruActive?: boolean;
  onActivateGuru?: (autoStart?: boolean) => void;
}) => {
  const [filledData, setFilledData] = useState<Record<string, string>>(initialData || {});
  const [showExample, setShowExample] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(form.draftId || null);
  const [copiedFieldIndex, setCopiedFieldIndex] = useState<number | null>(null);
  const [activeInfoIndex, setActiveInfoIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isOnline = useOnlineStatus();
  const lastAutoSaveRef = useRef<number>(0);

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
    if (!userId || Object.keys(filledData).length === 0) return;
    
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
    if (!userId) return;
    setIsSaving(true);
    try {
      const draftId = currentDraftId || `draft_${Date.now()}`;
      if (!currentDraftId) setCurrentDraftId(draftId);

      // Firestore with persistence handles the queuing
      await setDoc(doc(db, 'users', userId, 'drafts', draftId), {
        userId,
        formName: form.formName || 'Untitled Form',
        formData: filledData,
        formDefinition: form,
        updatedAt: Timestamp.now(),
        isOfflineDraft: !isOnline // Just a flag to indicate it was saved while offline
      });
      
      setSaveSuccess(true);
      if (onDraftSaved) onDraftSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving draft:", error);
      // If we are offline but persistence failed (rare), log it
      if (!isOnline) {
         console.warn("Offline save queued in local persistence");
         setSaveSuccess(true); // Treat as success for UI since it's queued
      } else {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}/drafts`);
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
          <span className="text-xs font-black text-[#008069]">{progress}%</span>
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
                {showExample ? 'Clear Data' : 'Auto-Fill AI Data'}
              </button>
              {userId && (
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
                  {saveSuccess && !isOnline && (
                    <span className="text-[8px] text-orange-500 font-bold uppercase text-right tracking-tight px-1 flex items-center justify-end gap-1">
                       <CloudOff className="w-2 h-2" /> Queued for sync
                    </span>
                  )}
                </div>
              )}
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
          <div className="text-center pb-3 border-b border-gray-200">
             <h4 className="font-black text-xs text-gray-800 uppercase tracking-widest">{form.formName || 'Untitled Form'} - PRACTICE</h4>
          </div>
          {form.fields.map((field: any, idx: number) => (
            <div key={idx} className="flex flex-col gap-1.5">
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
                   {field.exampleValue && (
                     <button
                       onClick={() => {
                         navigator.clipboard.writeText(field.exampleValue);
                         setCopiedFieldIndex(idx);
                         setTimeout(() => setCopiedFieldIndex(null), 2000);
                       }}
                       className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full transition-all border cursor-pointer",
                        copiedFieldIndex === idx 
                          ? "bg-green-50 text-green-600 border-green-100" 
                          : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                       )}
                     >
                       {copiedFieldIndex === idx ? <CheckCircle className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                       <span className="text-[8px] font-black uppercase tracking-tighter">
                         {copiedFieldIndex === idx ? 'Copied' : 'Copy Example'}
                       </span>
                     </button>
                   )}
                 </div>
                 {showExample && (
                   <span className="text-[9px] font-black text-[#008069] uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                     AI Example
                   </span>
                 )}
               </div>
               {activeInfoIndex === idx && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   className="bg-orange-50 border border-orange-100 p-3 rounded-2xl mb-2"
                 >
                   <p className="text-[10px] font-bold text-orange-800 leading-tight">
                     <span className="uppercase tracking-tighter mr-1 text-orange-600 font-black">Why this matters:</span>
                     {field.whyItMatters || "Government records match karne ke liye ye jankari bahut zaroori hai."}
                   </p>
                 </motion.div>
               )}
               <input 
                 type="text"
                 ref={(el) => { inputRefs.current[idx] = el; }}
                 onKeyDown={(e) => handleKeyDown(e, idx)}
                 value={filledData[field.field] || ''}
                 onChange={(e) => handleFieldChange(field, e.target.value)}
                 onBlur={() => {
                   const error = validateField(field, filledData[field.field] || '');
                   setErrors(prev => ({ ...prev, [field.field]: error }));
                 }}
                 placeholder={field.explanation}
                 className={cn(
                   "w-full p-4 bg-white border rounded-2xl text-xs font-bold outline-none transition-all",
                   errors[field.field] ? "border-red-500 ring-2 ring-red-50" : (showExample ? "border-[#008069] ring-2 ring-[#008069]/5" : "border-gray-200 focus:border-[#008069]")
                 )}
               />
               
               {errors[field.field] && (
                 <motion.p 
                   initial={{ opacity: 0, y: -5 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-[9px] font-bold text-red-500 px-2 mt-0.5 flex items-center gap-1"
                 >
                   <AlertCircle className="w-2.5 h-2.5" />
                   {errors[field.field]}
                 </motion.p>
               )}
               
               {showExample && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }} 
                   animate={{ height: 'auto', opacity: 1 }} 
                   className="overflow-hidden"
                 >
                   <div className="mt-2 space-y-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-[9px] font-bold text-gray-600 leading-tight">
                          <span className="text-red-500 uppercase tracking-tighter">Mistake To Avoid:</span> {field.commonMistake || field.commonMistakes || 'Check carefully for this field.'}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-gray-50 mt-1">
                        <CheckCircle className="w-3 h-3 text-[#008069] mt-0.5 shrink-0" />
                        <p className="text-[9px] font-bold text-gray-600 leading-tight">
                          <span className="text-[#008069] uppercase tracking-tighter">Correct Way:</span> {field.exampleValue || 'N/A'}
                        </p>
                      </div>
                   </div>
                 </motion.div>
               )}
            </div>
          ))}
          <button 
            className="w-full bg-[#008069] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#008069]/20 mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2"
            onClick={() => {
              // Final validation check for all fields
              const newErrors: Record<string, string | null> = {};
              let hasErrors = false;
              
              form.fields.forEach((f: any) => {
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
    </div>
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
          Motto: "Zindagi ki mushkilon mein, Mitra aapke saath hai."`
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

// --- Screens ---

const HomeScreen = ({ onNavigate, userProfile, onAskMitra, unreadCount, onOpenNotifications, savedSchemeIds, onNavigateToScheme, onStartSimulator }: { 
  onNavigate: (v: string) => void; 
  userProfile: UserProfile; 
  onAskMitra: (q: string) => void; 
  unreadCount: number; 
  onOpenNotifications: () => void;
  savedSchemeIds: string[];
  onNavigateToScheme: (id: string) => void;
  onStartSimulator?: (form: any) => void;
}) => {
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [drafts, setDrafts] = useState<FormDraft[]>([]);
  const savedSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'drafts'),
      limit(2)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const d = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormDraft));
      setDrafts(d.sort((a, b) => b.updatedAt - a.updatedAt));
    }, (error) => {
      console.warn("Drafts fetch error (offline?):", error);
    });
    return () => unsubscribe();
  }, []);

  const scrollToSaved = () => {
    savedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    // Load from cache first
    const cached = localStorage.getItem('mitra_news_cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Cache news for 6 hours
        if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
          setNews(data);
          setLoadingNews(false);
        }
      } catch (e) {
        console.warn("Error parsing news cache:", e);
      }
    }

    const fetchNews = async () => {
      try {
        const data = await getDailyNews(userProfile);
        setNews(data);
        localStorage.setItem('mitra_news_cache', JSON.stringify({ data, timestamp: Date.now() }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, [userProfile]);

  const suggestedSchemes = (() => {
    const sorted = [...SCHEMES].sort((a, b) => {
      if (a.state === userProfile.state && b.state !== userProfile.state) return -1;
      if (b.state === userProfile.state && a.state !== userProfile.state) return 1;
      return 0;
    });
    return sorted.slice(0, 3);
  })();

  const savedSchemes = SCHEMES.filter(s => savedSchemeIds.includes(s.id));

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
               <p className="text-[9px] uppercase font-black text-[#008069] tracking-[0.2em]">Study Made Easy</p>
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
          </div>
          {userProfile.state && (
            <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1.5 shadow-sm">
               <Globe className="w-3 h-3 text-orange-600" />
               <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">{userProfile.state}</span>
            </div>
          )}
          <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1.5 shadow-sm">
             <Zap className="w-3 h-3 text-[#008069]" />
             <span className="text-[9px] font-black text-[#008069] uppercase tracking-tighter">Class {userProfile.class}</span>
          </div>
        </div>
      </header>

      <NewsWidget userProfile={userProfile} news={news} loading={loadingNews} onAskMitra={onAskMitra} />

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
          { icon: Camera, label: "Photo Studio", desc: "KB/Pixel resize", color: "bg-purple-50 text-purple-600", target: 'tools' },
          { icon: FileText, label: "Doc Vault", desc: "Expiry tracking", color: "bg-orange-50 text-orange-600", target: 'tools' },
          { icon: Languages, label: "Letter Mitra", desc: "Formal drafts", color: "bg-green-50 text-[#008069]", target: 'letters' },
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

const VaultScreen = ({ userProfile, onNavigate }: { userProfile: UserProfile; onNavigate: (v: string) => void }) => {
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
    <div className="flex flex-col gap-4">
       <div className="flex justify-between items-center px-1">
          <div className="flex flex-col">
             <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Document Vault</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expiry Tracking Enabled</p>
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
          console.warn("AudioContext.decodeAudioData failed:", decodeErr);
          
          // Fallback to HTML5 Audio element
          // We try without a specific type first to let the browser sniff the format
          const blob = new Blob([bytes]); 
          const url = URL.createObjectURL(blob);
          const audio = new Audio();
          audio.src = url;
          
          return new Promise<void>((resolve) => {
            audio.onplay = () => onStart?.();
            audio.onended = () => {
              URL.revokeObjectURL(url);
              onEnd?.();
              resolve();
            };
            audio.onerror = (e) => {
              console.error("HTML Audio fallback error:", e);
              URL.revokeObjectURL(url);
              onEnd?.();
              resolve();
            };
            audio.play().catch(playErr => {
              console.error("Audio playback interrupted/failed:", playErr);
              URL.revokeObjectURL(url);
              onEnd?.();
              resolve();
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

const ChatScreen = ({ initialMessage, onMessageConsumed, userProfile, onNavigate, onSetTargetSchemeId }: { 
  initialMessage?: string; 
  onMessageConsumed?: () => void;
  userProfile: UserProfile;
  onNavigate: (v: string) => void;
  onSetTargetSchemeId: (id: string) => void;
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Namaste! Main aapka **Form Mitra** hoon. Main schemes samajhne aur forms bharne mein aapki help kar sakta hoon. Poochiye, main kaise help karu? \n\n*Hinglish, Hindi ya English mein baat kar sakte hain.*', timestamp: Date.now() }
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
      await saveMessage(convId, 'assistant', response.text || "Maafi chahta hoon...", response.thought);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    if ((!textOverride && !input.trim() && !selectedImage) || !auth.currentUser) return;
    
    const text = textOverride || input || (selectedImage ? "Kripya is photo ko analyze karein." : "");
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
            
            {m.image && (
              <div className="mb-3 rounded-xl overflow-hidden border border-black/5 bg-black/5">
                <img src={m.image} alt="User Upload" className="w-full object-contain max-h-60" />
              </div>
            )}

            <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 mt-0.5 text-inherit">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>

            {m.role === 'assistant' && (() => {
              const mentionedScheme = SCHEMES.find(s => 
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

      <div className="p-3 bg-[#F0F2F5] flex flex-col gap-2 z-20">
        {messages.length <= 1 && !selectedImage && (
          <div className="flex flex-col gap-2 mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Suggestions</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                "Bihar me Farmers schemes?",
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

const FormAudit = ({ imageBase64, userProfile, mimeType }: { imageBase64: string; userProfile: UserProfile; mimeType: string }) => {
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
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'drafts')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const draftsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormDraft));
      setDrafts(draftsData.sort((a, b) => b.updatedAt - a.updatedAt));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${auth.currentUser?.uid}/drafts`);
    });
    return () => unsubscribe();
  }, []);

  const resumeDraft = (draft: FormDraft) => {
    setResult({ ...draft.formDefinition, draftId: draft.id, formData: draft.formData });
    setImage(null);
    setUploadSuccess(true);
    setActiveView('simulator');
  };

  const deleteDraft = async (draftId: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'drafts', draftId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/drafts/${draftId}`);
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
          const text = await getProfileRecommendations(userProfile);
          setRecommendations(text);
          localStorage.setItem('mitra_profile_reco', text);
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
            <div className="space-y-4">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <div className="h-20 w-full bg-orange-100/30 rounded-2xl animate-pulse mt-4" />
            </div>
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

const SchemesScreen = ({ userProfile, onAskMitra, savedSchemeIds, onToggleSave, onNavigate, initialExpandedId, onClearInitialExpandedId, applications, onStartSimulator }: { 
  userProfile: UserProfile; 
  onAskMitra: (schemeName: string, customMessage?: string) => void;
  savedSchemeIds: string[];
  onToggleSave: (id: string) => void;
  onNavigate: (tab: string) => void;
  initialExpandedId?: string | null;
  onClearInitialExpandedId?: () => void;
  applications: TrackerApplication[];
  onStartSimulator: (form: any) => void;
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
    if (!filter) return;
    setIsSearching(true);
    setAiResults([]); // Clear previous results
    try {
      const results = await searchSchemes(filter, userProfile);
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
  
  const filteredSchemes = SCHEMES.filter(s => {
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

  const selectedSchemes = [...SCHEMES, ...aiResults].filter(s => selectedIds.includes(s.id));

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
                        Portal Apply Now
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

                      <div className="space-y-4">
                        {scheme.eligibility && scheme.eligibility.length > 0 && (
                          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/30">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Eligibility (Kaun apply kar sakta hai?)</p>
                            </div>
                            <ul className="space-y-2">
                              {scheme.eligibility.map((e: string, i: number) => (
                                <li key={i} className="text-xs text-orange-900/80 font-medium flex gap-2 items-start">
                                  <div className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                  <span>{e}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {scheme.benefits && scheme.benefits.length > 0 && (
                          <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100/30">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                <Award className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-[10px] font-black text-green-900 uppercase tracking-widest">Benefits (Kya fayda milega?)</p>
                            </div>
                            <ul className="space-y-2">
                              {scheme.benefits.map((b: string, i: number) => (
                                <li key={i} className="text-xs text-green-900/80 font-medium flex gap-2 items-start">
                                  <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 shrink-0" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {scheme.documents && scheme.documents.length > 0 && (
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <FileCheck className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Required Documents (Zaroori Kagaz)</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {scheme.documents.map((d: string, i: number) => (
                                <div key={i} className={`flex flex-col gap-2 ${scheme.id === 'kanya-sumangala' ? 'min-w-[140px]' : ''}`}>
                                  <div className="flex items-center gap-1">
                                    <span className={`px-3 py-1.5 bg-white text-blue-900/80 text-[10px] font-bold rounded-xl border border-blue-100 shadow-sm transition-all ${scheme.id !== 'kanya-sumangala' ? 'hover:scale-105 active:scale-95' : 'self-start'}`}>
                                      {d}
                                    </span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveUploadDoc(d);
                                        fileInputRef.current?.click();
                                      }}
                                      className="w-7 h-7 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all active:scale-90 shadow-sm"
                                      title="Upload document"
                                    >
                                      <Upload className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {scheme.id === 'kanya-sumangala' && (
                                    <div className="bg-white/60 border border-blue-100/50 rounded-xl p-2.5 flex flex-col gap-2 shadow-sm">
                                       <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                         <Calendar className="w-3 h-3" /> Document Date
                                       </label>
                                       <input 
                                         type="date" 
                                         className="w-full text-xs font-bold border-none bg-white rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-100 outline-none text-blue-900 shadow-inner"
                                       />
                                    </div>
                                  )}
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
                                Apply via Portal
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
                  Poori Jaankari
                </button>
                {scheme.officialUrl && (
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
                    Apply Now
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

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const path = `users/${userId}/applications/${id}`;
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

const SettingsScreen = ({ user, profile, onUpdateProfile, savedSchemeIds, onToggleSave, onNavigate, onNavigateToScheme, onShowFeedback }: { 
  user: User | null; 
  profile: UserProfile; 
  onUpdateProfile: (p: UserProfile) => void;
  savedSchemeIds: string[];
  onToggleSave: (id: string) => void;
  onNavigate: (tab: string) => void;
  onNavigateToScheme: (id: string) => void;
  onShowFeedback: () => void;
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

  const savedSchemes = SCHEMES.filter(s => savedSchemeIds.includes(s.id));

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
    if (!placesLib || !searchQuery) return;
    setLoading(true);
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: `CSC Center in ${searchQuery}`,
        fields: ['displayName', 'location', 'formattedAddress', 'id'],
        maxResultCount: 10,
      });
      setPlaces(places);
    } catch (error) {
      console.error("Error searching places:", error);
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

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [targetSchemeId, setTargetSchemeId] = useState<string | null>(null);
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);

  const [isGuruActive, setIsGuruActive] = useState(false);
  const [guruAutoStart, setGuruAutoStart] = useState(false);
  const [isCSCHubOpen, setIsCSCHubOpen] = useState(false);
  const [preloadedForm, setPreloadedForm] = useState<any | null>(null);

  const handleActivateGuru = (autoStart = false) => {
    setIsGuruActive(true);
    setGuruAutoStart(autoStart);
  };
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFormAudit, setShowFormAudit] = useState(false);

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
    streak: 0
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
  if (!profile.class || !profile.state) {
    return <Onboarding onComplete={saveProfile} />;
  }

  // Interactive Tutorial check
  if (!profile.hasCompletedTutorial) {
    return <InteractiveTutorial onComplete={() => saveProfile({ ...profile, hasCompletedTutorial: true })} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-safe-area-top selection:bg-orange-200">
      <OfflineNotice />
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
              {activeTab === 'home' && (
                <HomeScreen 
                  onNavigate={setActiveTab} 
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
                  onStartSimulator={(form) => {
                    setPreloadedForm(form);
                    setActiveTab('guide');
                  }}
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
                />
              )}
              {activeTab === 'chat' && (
                <ChatScreen 
                  initialMessage={chatContext} 
                  onMessageConsumed={() => setChatContext(undefined)}
                  userProfile={profile}
                  onNavigate={setActiveTab}
                  onSetTargetSchemeId={setTargetSchemeId}
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
                  isGuruActive={isGuruActive}
                  onActivateGuru={handleActivateGuru}
                  onShowFormAudit={() => setShowFormAudit(true)}
                  onOpenCSCHub={() => setIsCSCHubOpen(true)}
                  preloadedForm={preloadedForm}
                  onClearPreloadedForm={() => setPreloadedForm(null)}
                />
              )}
              {activeTab === 'premium' && <PremiumScreen userProfile={profile} onSave={saveProfile} />}
              {activeTab === 'vault' && <VaultScreen userProfile={profile} onNavigate={setActiveTab} />}
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
                  onShowFeedback={() => setShowFeedback(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {!profile.isPremium && <AdBanner onUpgrade={() => setActiveTab('premium')} />}
        <BottomNav active={activeTab} onChange={setActiveTab} />
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
        {isLiveCallOpen && (
          <LiveCall onClose={() => setIsLiveCallOpen(false)} />
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

      <AnimatePresence>
        {showFormAudit && <FormAuditModal userProfile={profile} onClose={() => setShowFormAudit(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      </AnimatePresence>
    </div>
  );
}
