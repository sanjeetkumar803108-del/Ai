import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Send,
  RefreshCw,
  Bell,
  BellRing,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AuthScreen } from './components/Auth';
import { LiveCall } from './components/LiveCall';
import { SCHEMES, STATES } from './constants';
import { Message, UserProfile, TrackerApplication, Conversation, Quiz, UserDocument, NewsItem, AppNotification } from './types';
import { getAIResponse, analyzeForm, generateSchemeLetter, searchSchemes, generateFormalLetter, getComparisonRecommendation, getSpeech, getFieldExample, predictFormRejection, getDailyNews, getDailyQuiz, analyzeScreenForGuidance, analyzeWebsite } from './services/geminiService';
import { requestNotificationPermission, showLocalNotification, MOCK_NOTIFICATIONS } from './services/notificationService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check, MapPin, History, Plus, MessageSquare, LayoutGrid } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

// Initial connection test
testConnection();

// --- Sub-components ---

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

                {result.discrepancies?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detected Discrepancies</h4>
                    <div className="flex flex-col gap-3">
                      {result.discrepancies.map((d: any, idx: number) => (
                        <div key={idx} className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col gap-3">
                           <div className="flex justify-between items-center">
                              <span className="text-sm font-black text-gray-900">{d.field}</span>
                              <span className={cn(
                                "text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                                d.severity === 'high' ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                              )}>
                                {d.severity} Risk
                              </span>
                           </div>
                           <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Found in Form</p>
                                 <p className="text-xs font-bold text-red-500 line-through decoration-red-300">{d.extracted}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Should Be (Profile)</p>
                                 <p className="text-xs font-bold text-green-500">{d.expected}</p>
                              </div>
                           </div>
                           <p className="text-xs text-gray-500 font-medium leading-relaxed italic">" {d.reason} "</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.missingFields?.length > 0 && (
                   <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-400">Missing Mandatory Fields</h4>
                    <div className="flex flex-wrap gap-2">
                       {result.missingFields.map((f: string, idx: number) => (
                         <span key={idx} className="px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold border border-red-100">{f}</span>
                       ))}
                    </div>
                   </div>
                )}

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Improvement Action Plan</h4>
                   <div className="flex flex-col gap-2">
                      {result.actionPlan?.map((plan: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                           <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                             {idx + 1}
                           </div>
                           <p className="text-xs font-bold text-indigo-900">{plan}</p>
                        </div>
                      ))}
                   </div>
                </div>

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

const ToolsScreen = ({ userProfile, onNavigate, isGuruActive, setIsGuruActive, onShowFormAudit }: { 
  userProfile: UserProfile; 
  onNavigate: (v: string) => void;
  isGuruActive: boolean;
  setIsGuruActive: (v: boolean) => void;
  onShowFormAudit: () => void;
}) => {
  const [activeTool, setActiveTool] = useState<'studio' | 'vault' | 'links'>('studio');

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

            <PhotoStudio userProfile={userProfile} onNavigate={onNavigate} />
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

const FormSimulator = ({ form }: { form: any }) => {
  const [filledData, setFilledData] = useState<Record<string, string>>({});
  const [showExample, setShowExample] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (showExample) {
      const examples: Record<string, string> = {};
      form.fields.forEach((f: any) => {
        examples[f.field] = f.exampleValue || 'N/A';
      });
      setFilledData(examples);
    } else {
      setFilledData({});
    }
  }, [showExample, form.fields]);

  const handleExport = () => {
    const text = Object.entries(filledData)
      .map(([field, value]) => `${field}: ${value}`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
           <div className="flex flex-col">
              <h3 className="font-black text-sm uppercase tracking-widest text-[#008069]">Form Simulator</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Practice Fill before Official Site</p>
           </div>
           <div className="flex flex-col gap-2">
             <button 
               onClick={() => setShowExample(!showExample)}
               className={cn(
                 "px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                 showExample 
                   ? "bg-red-50 text-red-600 border-red-100" 
                   : "bg-[#008069] text-white border-[#008069] shadow-lg shadow-green-100"
               )}
             >
               {showExample ? <X className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
               {showExample ? 'Clear Data' : 'Auto-Fill AI Data'}
             </button>
             {Object.keys(filledData).length > 0 && (
               <button 
                 onClick={handleExport}
                 className={cn(
                   "px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
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
                 <label className={cn(
                   "text-[10px] font-black uppercase tracking-tight",
                   field.isCritical ? "text-red-500" : "text-gray-400"
                 )}>
                   {field.field} {field.isCritical && '*'}
                 </label>
                 {showExample && (
                   <span className="text-[9px] font-black text-[#008069] uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                     AI Example
                   </span>
                 )}
               </div>
               <input 
                 type="text"
                 value={filledData[field.field] || ''}
                 onChange={(e) => setFilledData({ ...filledData, [field.field]: e.target.value })}
                 placeholder={field.explanation}
                 className={cn(
                   "w-full p-4 bg-white border rounded-2xl text-xs font-bold outline-none transition-all",
                   showExample ? "border-[#008069] ring-2 ring-[#008069]/5" : "border-gray-200 focus:border-[#008069]"
                 )}
               />
               
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
            className="w-full bg-[#008069] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#008069]/20 mt-4 active:scale-95 transition-transform"
            onClick={() => alert("Practice Complete! Now you are ready to fill the official form with confidence.")}
          >
            Submit Practice
          </button>
        </div>
      </div>
    </div>
  );
};

const LiveAiScreenGuru = ({ userProfile, onNavigate }: { userProfile: UserProfile; onNavigate: (v: string) => void }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

  const speakGuidance = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    await playAudio(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const analyzeCurrentFrame = async (customPrompt?: string) => {
    if (analyzing || !videoRef.current || !canvasRef.current || !isSharing) return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    setAnalyzing(true);
    
    try {
      const canvas = canvasRef.current;
      // desynchronized: true can reduce latency in some browsers
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (!ctx) return;

      // Optimization: Downscale image to reduce payload and processing time
      // 800px width is plenty for AI to understand screen UI while being much smaller than full screen
      const MAX_WIDTH = 800; 
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;

      if (width > MAX_WIDTH) {
        height = (MAX_WIDTH / width) * height;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(video, 0, 0, width, height);
      
      // Optimization: Using toBlob is non-blocking to the main thread JPEG compression
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.6));
      if (!blob) throw new Error("Failed to capture frame");

      // Convert blob to base64
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const result = await analyzeScreenForGuidance(
        base64Content, 
        'image/jpeg', 
        customPrompt || "Aap is screen ko dekh kar bataiye ki kya chal raha hai aur user ko kya karna chahiye? Agar koi form field active hai ya important hai, toh 'highlightBox' mein uske relative coordinates (0-100) dein. Audio guidance dijiye Hinglish mein. Short aur clear instructions dein."
      );
      
      if (result && result.guidance) {
        if (result.highlightBox && result.highlightBox.w > 0) {
          setActiveHighlight(result.highlightBox);
        } else {
          setActiveHighlight(null);
        }

        if (result.guidance !== guidance) {
          setGuidance(result.guidance);
          setHistory(prev => [...prev, { role: 'guru' as const, text: result.guidance }].slice(-5));
          speakGuidance(result.guidance);
        }
      }
    } catch (err) {
      console.error("Analysis Error:", err);
    } finally {
      setAnalyzing(false);
    }
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

    try {
      // Simplest constraints for maximum compatibility across mobile/desktop
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = stream;
      setIsSharing(true);
      setIsMinimized(true); // Auto-minimize for better experience
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setTimeout(() => analyzeCurrentFrame(), 1500);
            captureIntervalRef.current = window.setInterval(() => analyzeCurrentFrame(), 15000);
        };
      }

      stream.getTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err) {
      console.error("Screen Share Denied or Not Supported:", err);
      setIsSharing(false);
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        alert("Mobile Screen Share: Android Chrome par yeh feature best kaam karta hai. iOS (iPhone) par yeh browser support ki vajah se restrict ho sakta hai.");
      } else {
        alert("Screen sharing help: Browser permissions check karein ya page refresh karke try karein.");
      }
    }
  };

  const stopSharing = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSharing(false);
    setIsMinimized(false);
    setGuidance(null);
    setActiveHighlight(null);
    setUserPrompt("");
  };

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

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
           <div className="flex gap-2">
              <button 
                onClick={() => setIsMinimized(false)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                 <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={stopSharing}
                className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
              >
                 <PhoneOff className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="flex gap-4 items-center">
           <div className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
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

const HomeScreen = ({ onNavigate, userProfile, onAskMitra, unreadCount, onOpenNotifications }: { onNavigate: (v: string) => void; userProfile: UserProfile; onAskMitra: (q: string) => void; unreadCount: number; onOpenNotifications: () => void }) => {
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getDailyNews(userProfile);
        setNews(data);
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

      <TargetTracker news={news} loading={loadingNews} onAskMitra={onAskMitra} />

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
             docs.map(doc => (
               <div key={doc.id} className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <FileText className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-sm text-gray-900">{doc.name}</h4>
                        {doc.expiryDate && (
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <AlertCircle className={cn(
                                "w-3 h-3",
                                Date.now() > doc.expiryDate - (15 * 24 * 60 * 60 * 1000) ? "text-red-500" : "text-gray-400"
                              )} />
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                Date.now() > doc.expiryDate - (15 * 24 * 60 * 60 * 1000) ? "text-red-500" : "text-gray-400"
                              )}>
                                Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                              </span>
                           </div>
                        )}
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Upload: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
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

    let buffer: AudioBuffer;

    if (audioCache.has(cleanText)) {
      buffer = audioCache.get(cleanText)!;
    } else {
      onStart?.();
      const base64 = await getSpeech(cleanText);
      if (!base64) {
        onEnd?.();
        return;
      }

      // Safe base64 to ArrayBuffer conversion
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // decodeAudioData is safer for most audio formats returned by TTS APIs
      buffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      audioCache.set(cleanText, buffer);
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
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

        <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-2">
          <p className="text-xs font-bold text-gray-800 italic leading-relaxed">"{audit.verdict}"</p>
        </div>

        {audit.discrepancies?.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Critical Discrepancies</h4>
            {audit.discrepancies.map((d: any, i: number) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  d.severity === 'high' ? 'bg-red-500' : d.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                )} />
                <div className="flex justify-between items-start">
                  <h5 className="font-bold text-xs text-gray-900">{d.field}</h5>
                  <span className={cn(
                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                    d.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                  )}>{d.severity}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-red-50/50 p-2 rounded-lg border border-red-50">
                    <p className="text-gray-400 font-black uppercase tracking-tighter mb-1">In Form</p>
                    <p className="font-bold text-red-800">{d.extracted || 'Missing'}</p>
                  </div>
                  <div className="bg-green-50/50 p-2 rounded-lg border border-green-50">
                    <p className="text-gray-400 font-black uppercase tracking-tighter mb-1">Your Profile</p>
                    <p className="font-bold text-green-800">{d.expected || 'N/A'}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed mt-1">
                  <span className="font-black text-orange-600">REASON:</span> {d.reason}
                </p>
              </div>
            ))}
          </div>
        )}

        {audit.actionPlan?.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Action Plan to Fix</h4>
            <div className="flex flex-col gap-2">
              {audit.actionPlan.map((step: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-blue-50/30 rounded-2xl border border-blue-50">
                  <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">{i + 1}</div>
                  <p className="text-[11px] text-gray-800 font-bold leading-tight">{step}</p>
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

const GuideScreen = ({ onNavigate, userProfile, isGuruActive, setIsGuruActive }: { 
  onNavigate: (v: string) => void; 
  userProfile: UserProfile;
  isGuruActive: boolean;
  setIsGuruActive: (v: boolean) => void;
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
                   const binary = window.atob(base64);
                   const bytes = new Uint8Array(binary.length);
                   for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                   getAudioContext().decodeAudioData(bytes.buffer.slice(0)).then(buffer => {
                     audioCache.set(clean, buffer);
                   }).catch(() => {});
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

          {!isGuruActive && (
            <button 
              onClick={() => setIsGuruActive(true)}
              className="w-full bg-slate-900 text-white p-5 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-xl"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[#008069]/20 flex items-center justify-center text-[#008069]">
                    <Cpu className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-[#008069]">Live AI Screen Guru</p>
                    <p className="text-[10px] font-bold text-gray-400">Get real-time audio guidance</p>
                 </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-700 group-hover:translate-x-1 transition-transform" />
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
                onClick={() => setIsGuruActive(true)}
                className="w-full bg-slate-900 text-white p-5 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-xl"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-[#008069]/20 flex items-center justify-center text-[#008069]">
                      <Cpu className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest text-[#008069]">Live AI Screen Guru</p>
                      <p className="text-[10px] font-bold text-gray-400">Get real-time audio guidance</p>
                   </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:translate-x-1 transition-transform" />
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
                
                <div className="flex flex-col gap-3">
                   {result.fields.map((f: any, i: number) => (
                     <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-gray-900 text-sm">{f.field}</h4>
                           <PlayButton text={f.explanation} />
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{f.explanation}</p>
                        <div className="flex items-center justify-between gap-2">
                           <button 
                             onClick={() => fetchExample(i)}
                             className="text-[9px] font-black uppercase text-purple-600 tracking-widest hover:text-purple-700 transition-colors flex items-center gap-1"
                           >
                             <Sparkles className="w-3 h-3" />
                             {showExampleIndex === i ? 'Hide AI Fill Example' : 'See How to Fill'}
                           </button>
                           {showExampleIndex === i && f.exampleValue && (
                             <button 
                               onClick={() => copyToClipboard(f.exampleValue, i)}
                               className="p-1 px-2 rounded-lg bg-gray-50 text-gray-400 hover:text-[#008069] transition-all flex items-center gap-1 border border-gray-100"
                             >
                               {copiedIndex === i ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                               <span className="text-[8px] font-black uppercase tracking-tighter">{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                             </button>
                           )}
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

           {activeView === 'simulator' && <FormSimulator form={result} />}
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
                     onClick={() => setIsGuruActive(true)}
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

const SchemesScreen = ({ userProfile, onAskMitra, savedSchemeIds, onToggleSave, onNavigate, initialExpandedId, onClearInitialExpandedId, applications }: { 
  userProfile: UserProfile; 
  onAskMitra: (schemeName: string) => void;
  savedSchemeIds: string[];
  onToggleSave: (id: string) => void;
  onNavigate: (tab: string) => void;
  initialExpandedId?: string | null;
  onClearInitialExpandedId?: () => void;
  applications: TrackerApplication[];
}) => {
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const statusColors = {
    'Submitted': 'bg-blue-50 text-blue-600 border-blue-100',
    'Under Review': 'bg-orange-50 text-orange-600 border-orange-100',
    'Approved': 'bg-green-50 text-green-600 border-green-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100'
  };

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
                            <div className="flex flex-wrap gap-2">
                              {scheme.documents.map((d: string, i: number) => (
                                <span key={i} className="px-3 py-1.5 bg-white text-blue-900/80 text-[10px] font-bold rounded-xl border border-blue-100 shadow-sm transition-all hover:scale-105 active:scale-95">
                                  {d}
                                </span>
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

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAskMitra(`Tell me more about ${scheme.hindiName || scheme.name}. Mujhe is scheme ke baare mein visthar se jaankari chahiye (Eligibility, Documents, Application process).`);
                              }}
                              className="py-4 bg-[#008069] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#008069]/20 active:scale-95 hover:bg-[#00a687] transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Ask Mitra AI
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
                <BellRing className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
            </div>
            <button 
              onClick={() => onUpdateProfile({ ...profile, notificationsEnabled: !profile.notificationsEnabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                profile.notificationsEnabled ? "bg-[#008069]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                profile.notificationsEnabled ? "right-1" : "left-1"
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
              value={profile.state}
              onChange={(e) => onUpdateProfile({ ...profile, state: e.target.value })}
              className="bg-transparent border-none font-bold text-[#008069] text-sm p-0 focus:ring-0 max-w-[120px] text-right"
            >
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

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
                  onUpdateProfile({ ...profile, notificationsEnabled: !profile.notificationsEnabled });
                  if (!profile.notificationsEnabled) {
                    showLocalNotification('Notifications On Ho Gaye Hain!', { body: 'Ab aapko important updates milte rahenge.' });
                  }
                } else {
                  alert("Kripya browser settings mein notifications allow karein.");
                }
              }}
              className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300",
                profile.notificationsEnabled ? "bg-[#008069]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                profile.notificationsEnabled ? "left-7" : "left-1"
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

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [targetSchemeId, setTargetSchemeId] = useState<string | null>(null);
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);

  const [isGuruActive, setIsGuruActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFormAudit, setShowFormAudit] = useState(false);

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
  const [isSaving, setIsSaving] = useState(false);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    preferredLanguage: 'hi',
    isPremium: false,
    state: undefined,
    streak: 0
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
                />
              )}
              {activeTab === 'chat' && (
                <ChatScreen 
                  initialMessage={chatContext} 
                  onMessageConsumed={() => setChatContext(undefined)}
                  userProfile={profile}
                />
              )}
              {activeTab === 'guide' && (
                <GuideScreen 
                  onNavigate={setActiveTab} 
                  userProfile={profile} 
                  isGuruActive={isGuruActive}
                  setIsGuruActive={setIsGuruActive}
                />
              )}
              {activeTab === 'tools' && (
                <ToolsScreen 
                  userProfile={profile} 
                  onNavigate={setActiveTab} 
                  isGuruActive={isGuruActive}
                  setIsGuruActive={setIsGuruActive}
                  onShowFormAudit={() => setShowFormAudit(true)}
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
                onNavigate={(v) => { setActiveTab(v); setIsGuruActive(false); }} 
              />
            </div>
          </div>
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
