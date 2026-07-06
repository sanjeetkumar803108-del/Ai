import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
  Globe,
  Award,
  BookOpen,
  Heart,
  Info,
  Sparkles,
  Clock,
  ArrowRight,
  User,
  ExternalLink,
  ShieldAlert,
  PhoneCall,
  Mail,
  X,
  SlidersHorizontal,
  ThumbsUp,
  Check,
  AlertCircle
} from "lucide-react";
import { searchScholarship, Scholarship, ScholarshipResult } from "../services/scholarshipAI";
import { cn } from "../lib/utils";

const cleanDeadlineFormat = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "Verify karo";
  let str = dateStr.trim();
  str = str.replace(/^\d+\s+/, ''); // removes "30 " or "15 " from start
  
  str = str.replace(/January/gi, 'Jan');
  str = str.replace(/February/gi, 'Feb');
  str = str.replace(/March/gi, 'Mar');
  str = str.replace(/April/gi, 'Apr');
  str = str.replace(/May/gi, 'May');
  str = str.replace(/June/gi, 'Jun');
  str = str.replace(/July/gi, 'Jul');
  str = str.replace(/August/gi, 'Aug');
  str = str.replace(/September/gi, 'Sep');
  str = str.replace(/October/gi, 'Oct');
  str = str.replace(/November/gi, 'Nov');
  str = str.replace(/December/gi, 'Dec');
  
  str = str.replace(/,\s*/g, ' ');
  return str;
};

interface ScholarshipFinderProps {
  userProfile: any;
  onClose: () => void;
}

export function ScholarshipFinder({ userProfile, onClose }: ScholarshipFinderProps) {
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState<'all' | 'private'>('all');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ScholarshipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Local profile adjustments inside the finder
  const [localProfile, setLocalProfile] = useState({
    class: userProfile?.class || "Class 12",
    stream: userProfile?.stream || "Science",
    income: userProfile?.income || "Under ₹2,0,000",
    caste: userProfile?.caste || userProfile?.category || "OBC",
    state: userProfile?.state || "Uttar Pradesh",
    gender: userProfile?.gender || "Male",
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  
  // Rate limit and premium states
  const [searchesToday, setSearchesToday] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Preset quick search recommendations
  const PRESET_QUERIES = [
    {
      label: "MEXT Japan (Undergraduate)",
      text: "MEXT Japan Government Scholarship for undergraduate Indian students"
    },
    {
      label: "UP Post-Matric (Class 11-12)",
      text: "Uttar Pradesh Post Matric Scholarship for OBC/SC/ST Class 11 & 12 students"
    },
    {
      label: "Santoor Women Scholarship",
      text: "Santoor Scholarship for girls pursuing higher education after Class 12"
    },
    {
      label: "Inlaks Shivdasani Scholarship",
      text: "Inlaks Shivdasani Foundation Scholarship for master studies abroad"
    }
  ];

  const PRIVATE_PRESET_QUERIES = [
    {
      label: "Reliance Foundation",
      text: "Reliance Foundation Undergraduate Scholarships"
    },
    {
      label: "HDFC Parivartan",
      text: "HDFC Bank Parivartan ECSS Scholarship"
    },
    {
      label: "Tata Trusts Scholarship",
      text: "Tata Trusts Scholarship for Indian students"
    },
    {
      label: "Sitaram Jindal Scheme",
      text: "Sitaram Jindal Foundation Scholarship"
    }
  ];

  // Rotate loading steps for visual immersion
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load premium status and daily searches on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      setIsPremium(localStorage.getItem("is_premium") === "true");
      
      const today = new Date().toDateString();
      const lastReset = localStorage.getItem("last_reset");
      if (lastReset !== today) {
        localStorage.setItem("last_reset", today);
        localStorage.setItem("searches_today", "0");
        setSearchesToday(0);
      } else {
        const count = parseInt(localStorage.getItem("searches_today") || "0", 10);
        setSearchesToday(count);
      }
    }
  }, []);

  const handlePresetClick = (qText: string) => {
    setQuery(qText);
    handleSearch(qText);
  };

  const handleSearch = async (searchQuery = query) => {
    const activeQuery = searchQuery.trim();
    if (!activeQuery) return;

    setLoading(true);
    setError(null);
    setSelectedScholarship(null);
    setResult(null);

    try {
      const response = await searchScholarship(activeQuery, localProfile, searchTab === 'private');
      
      // Update searches counter from localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const count = parseInt(localStorage.getItem("searches_today") || "0", 10);
        setSearchesToday(count);
      }

      if (response && ((response.scholarships && response.scholarships.length > 0) || (response.programs && response.programs.length > 0))) {
        setResult(response);
        // Default select first result only on desktop sizes to prevent hiding the list on mobile
        const firstItem = (response.programs && response.programs.length > 0)
          ? response.programs[0]
          : (response.scholarships && response.scholarships.length > 0)
          ? response.scholarships[0]
          : null;
        if (typeof window !== "undefined" && window.innerWidth >= 1024 && firstItem) {
          setSelectedScholarship(firstItem);
        } else {
          setSelectedScholarship(null);
        }
      } else {
        setResult(response);
        setError("Bhai, is search ke liye koi live scholarship data nahi mil paaya. Ek baar query badal kar try karo ya post-matric try karo!");
      }
    } catch (err) {
      console.error(err);
      setError("Server se sampark karne mein thodi dikkat hui bhai. Kripya thodi der baad koshish karein!");
    } finally {
      setLoading(false);
    }
  };

  const loadingStepsTexts = searchTab === 'private' ? [
    "🔍 Google pe search kar raha hoon tumhare liye...",
    "📌 Buddy4Study, Vidyasaarathi aur Trust websites check ho rahe hain...",
    "✅ Corporate CSR portals par current status verify ho raha hai...",
    "🤝 Aapke profile ke sath perfect eligibility match score nikal raha hoon..."
  ] : [
    "🔍 AI Scholarship Agent Google Search query prepare kar raha hai...",
    "🌐 Google Search Engine se live latest 2026/2027 data load ho raha hai...",
    "🧠 Gemini AI analysis karke criteria, amount aur deadlines check kar raha hai...",
    "🤝 Hinglish Bada Bhai recommendations aur customized checklists ban rahi hain..."
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-0 md:p-4"
      id="scholarship-finder-overlay"
    >
      <div className="bg-slate-50 w-full max-w-6xl md:rounded-3xl shadow-2xl min-h-screen md:min-h-0 flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Block */}
        <div className="bg-gradient-to-r from-[#008069] via-[#006b56] to-slate-900 text-white p-5 md:p-6 flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
                  Mitra AI Live Scholarship Finder
                </h2>
                <span className="text-[9px] font-black bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                  LIVE SEARCH
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                Gemini-powered real-time research engine for Indian and Global scholarships
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 transition-all rounded-full active:scale-95"
            id="close-scholarship-finder"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 max-h-[85vh] overflow-hidden">
          
          {/* Left Column: Search & Filters (width 1/3 on desktop) */}
          <div className={cn(
            "w-full lg:w-[380px] p-4 md:p-5 flex flex-col gap-4 overflow-y-auto bg-slate-50",
            selectedScholarship ? "hidden lg:flex" : "flex"
          )}>
            
            {/* Quick Profile Overview / Adjuster */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#008069]" />
                  Aapka Student Profile
                </span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs font-bold text-[#008069] flex items-center gap-1 hover:underline"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {showFilters ? "Chhupayein" : "Badlein (Edit)"}
                </button>
              </div>

              {!showFilters ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Standard</p>
                    <p className="font-extrabold text-slate-700">{localProfile.class}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Stream</p>
                    <p className="font-extrabold text-slate-700 truncate">{localProfile.stream}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Income</p>
                    <p className="font-extrabold text-slate-700 truncate">{localProfile.income}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Category/Caste</p>
                    <p className="font-extrabold text-[#008069]">{localProfile.caste}</p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 pt-1"
                >
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Class/Standard</label>
                    <select
                      value={localProfile.class}
                      onChange={(e) => setLocalProfile({ ...localProfile, class: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#008069]"
                    >
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                      <option value="Undergraduate (UG)">Undergraduate (UG)</option>
                      <option value="Postgraduate (PG)">Postgraduate (PG)</option>
                      <option value="PhD">PhD Scholar</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Academic Stream</label>
                    <input
                      type="text"
                      value={localProfile.stream}
                      onChange={(e) => setLocalProfile({ ...localProfile, stream: e.target.value })}
                      placeholder="Science, Commerce, Arts, B.Tech, Medical"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#008069]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">State</label>
                      <input
                        type="text"
                        value={localProfile.state}
                        onChange={(e) => setLocalProfile({ ...localProfile, state: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#008069]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Caste Category</label>
                      <select
                        value={localProfile.caste}
                        onChange={(e) => setLocalProfile({ ...localProfile, caste: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#008069]"
                      >
                        <option value="GENERAL">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Annual Income</label>
                      <input
                        type="text"
                        value={localProfile.income}
                        onChange={(e) => setLocalProfile({ ...localProfile, income: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#008069]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Gender</label>
                      <select
                        value={localProfile.gender}
                        onChange={(e) => setLocalProfile({ ...localProfile, gender: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#008069]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-[#008069] text-white rounded-xl py-1.5 text-xs font-extrabold shadow-sm hover:bg-[#006b56]"
                  >
                    Profile Update Karein
                  </button>
                </motion.div>
              )}
            </div>

            {/* Search Mode Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  setSearchTab('all');
                  setResult(null);
                  setSelectedScholarship(null);
                }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center",
                  searchTab === 'all'
                    ? "bg-white text-[#008069] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Government & Global
              </button>
              <button
                onClick={() => {
                  setSearchTab('private');
                  setResult(null);
                  setSelectedScholarship(null);
                }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center",
                  searchTab === 'private'
                    ? "bg-white text-[#008069] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Private & Corporate
              </button>
            </div>

            {/* Rate Limit Block Alert */}
            {!isPremium && searchesToday >= 5 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-3 flex flex-col gap-2 shadow-2xs">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[11px] uppercase tracking-tight">
                      Aaj ki limit khatam! Kal aao ya Premium lo ₹29 mein
                    </p>
                    <p className="text-[10px] text-rose-600/90 font-medium mt-0.5">
                      Bhai, high API server cost ki wajah se free limit 5 searches per day hai. Par tere bada bhai ne cached ya basic database options active rakhe hain taaki tera kaam na ruke!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="w-full bg-[#008069] hover:bg-[#006b56] text-white py-1.5 px-3 rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1"
                >
                  🚀 Unlock Unlimited Searches & Premium Recommendations (₹29)
                </button>
              </div>
            )}

            {/* Live Search Input Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-[#008069]" />
                Live Research Query
              </span>

              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={searchTab === 'private' ? "e.g., Tata Trusts, Reliance Foundation, HDFC..." : "Kishi bhi scholarship ka naam ya type poochein..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008069] focus:bg-white transition-all shadow-inner"
                  id="scholarship-query-input"
                />
                <button
                  onClick={() => handleSearch()}
                  disabled={loading || !query.trim()}
                  className="absolute right-1.5 top-1.5 p-1.5 bg-[#008069] text-white rounded-lg hover:bg-[#006b56] transition-all disabled:opacity-40"
                  id="trigger-scholarship-search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {searchTab === 'private' && (
                <button
                  onClick={() => {
                    const generatedQuery = `Private and corporate CSR scholarships matching student profile: Class ${localProfile.class}, Stream ${localProfile.stream}, Income ${localProfile.income}, Category ${localProfile.caste}, State ${localProfile.state}`;
                    setQuery(generatedQuery);
                    handleSearch(generatedQuery);
                  }}
                  disabled={loading}
                  className="w-full bg-emerald-50 text-[#008069] border border-emerald-200 rounded-xl py-2 text-xs font-extrabold shadow-2xs hover:bg-[#008069]/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                  Mera Profile Match Karo! (Real-time Search)
                </button>
              )}

              {/* Presets */}
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Populer Queries (Quick Search):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(searchTab === 'private' ? PRIVATE_PRESET_QUERIES : PRESET_QUERIES).map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetClick(preset.text)}
                      disabled={loading}
                      className="text-[10px] font-extrabold px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-[#008069] rounded-xl transition-all text-left"
                    >
                      ✨ {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Search Meter */}
              <div className="flex items-center justify-between text-[10px] font-black border-t border-slate-100 pt-3 mt-1">
                {isPremium ? (
                  <span className="text-[#008069] flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                    👑 Mitra AI Premium Active (Unlimited Searches)
                  </span>
                ) : (
                  <span className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg",
                    searchesToday >= 5 
                      ? "text-rose-600 bg-rose-50 border border-rose-100 animate-pulse" 
                      : "text-slate-500 bg-slate-50 border border-slate-200"
                  )}>
                    🔋 Free Searches: {searchesToday}/5 Used
                  </span>
                )}

                {!isPremium && (
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="text-[10px] font-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-900 px-3 py-1 rounded-lg shadow-2xs transition-all active:scale-[0.98] flex items-center gap-1 shrink-0"
                  >
                    <span>⚡ Go Premium (₹29)</span>
                  </button>
                )}
              </div>
            </div>

                {/* Results list if loaded */}
            {result && ((result.programs && result.programs.length > 0) || (result.scholarships && result.scholarships.length > 0)) && (
              <div className="flex-1 flex flex-col gap-4">
                {/* Cache & Fallback Status Indicators */}
                {(result.isCached || result.isFallback || result.isRateLimited || result.isApiFailed) && (
                  <div className={cn(
                    "rounded-2xl p-3 border text-[11px] font-bold flex flex-col gap-1.5",
                    result.isRateLimited
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : result.isApiFailed
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-emerald-50 border-emerald-200 text-[#008069]"
                  )}>
                    <div className="flex items-center gap-1.5">
                      {result.isRateLimited ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>⚠️ Live search limit reached! Showing cached / basic options.</span>
                        </>
                      ) : result.isApiFailed ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>⚠️ Live connection offline! Showing cached / basic database fallbacks.</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#008069] shrink-0" />
                          <span>⚡ Saved by Cache (Free Search - 0 API cost!)</span>
                        </>
                      )}
                    </div>
                    
                    {(result.isRateLimited || result.isApiFailed) && (
                      <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                        🔴 <b className="text-rose-600 font-black">Live search kal available</b> hoga. Tab tak, aap in highly matching recommendations ko study kar sakte hain.
                      </p>
                    )}

                    {result.isCached && result.cacheAgeHours !== undefined && (
                      <p className="text-[10px] text-slate-500 font-semibold">
                        📌 Last updated: {result.cacheAgeHours < 1 ? "Just now" : `${Math.round(result.cacheAgeHours)} hours ago`}
                      </p>
                    )}
                  </div>
                )}
                {/* Programs Section */}
                {result.programs && result.programs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1 flex items-center gap-1.5 bg-indigo-50 py-1 rounded-lg w-max border border-indigo-100">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
                      💻 Mili Hui Programs ({result.programs.length})
                    </span>
                    <div className="space-y-2.5">
                      {result.programs.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedScholarship(s)}
                          className={cn(
                            "p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98]",
                            selectedScholarship?.id === s.id
                              ? "bg-indigo-50/50 border-indigo-600 shadow-sm shadow-indigo-100"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                          )}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                              CERTIFICATE PROGRAM
                            </span>
                            <span className="text-[10px] font-black text-indigo-600">
                              {s.matchScore}% Match
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-800 mt-1.5 line-clamp-2">
                            {s.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                            {s.organizer}
                          </p>

                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                            <span className="font-black text-indigo-600 flex items-center gap-0.5">
                              <Award className="w-3.5 h-3.5" />
                              {s.benefits?.totalAmount || "Free Skills"}
                            </span>
                            <span className="font-extrabold text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Self-paced
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scholarships Section */}
                {result.scholarships && result.scholarships.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                      Mili Hui Scholarships ({result.scholarships.length})
                    </span>
                    <div className="space-y-2.5">
                      {result.scholarships.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedScholarship(s)}
                          className={cn(
                            "p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98]",
                            selectedScholarship?.id === s.id
                              ? "bg-emerald-50/50 border-[#008069] shadow-sm shadow-emerald-100"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                          )}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                              s.type === 'CENTRAL' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                              s.type === 'STATE' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                              s.type === 'INTERNATIONAL' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                              s.type === 'PROGRAM' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                              "bg-amber-50 text-amber-700 border border-amber-100"
                            )}>
                              {s.type}
                            </span>
                            <span className="text-[10px] font-black text-emerald-600">
                              {s.matchScore}% Match
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-800 mt-1.5 line-clamp-2">
                            {s.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                            {s.organizer}
                          </p>

                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                            <span className="font-black text-[#008069] flex items-center gap-0.5">
                              <DollarSign className="w-3.5 h-3.5" />
                              {s.benefits?.totalAmount || "Funded"}
                            </span>
                            <span className={cn(
                              "font-extrabold flex items-center gap-1",
                              s.deadline?.status === 'CLOSED' ? "text-rose-500" : "text-amber-600"
                            )}>
                              <Clock className="w-3.5 h-3.5" />
                              {s.deadline?.status === 'CLOSED' 
                                ? `🔴 Closed - Next cycle ${s.deadline?.nextCycleExpected || '[date]'}` 
                                : s.deadline?.currentCycleDate 
                                  ? `Expected: ${cleanDeadlineFormat(s.deadline.currentCycleDate)} (Verify karo)`
                                  : `Expected: ~${s.deadline?.daysRemaining || 'Check'} Days (Verify karo)`}
                            </span>
                          </div>

                          {/* Mandatory disclaimer inside every scholarship card */}
                          <div className="mt-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[9px] font-bold text-amber-800 space-y-1.5">
                            <p className="flex items-start gap-1 leading-normal">
                              <span className="shrink-0 text-[10px]">⚠️</span>
                              <span>Dates AI-estimated hain. Apply karne se pehle official website pe verify zaroor karo.</span>
                            </p>
                            <a
                              href={s.applicationProcess?.portal || "https://scholarships.gov.in"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-1 text-[8px] font-black transition-all active:scale-[0.99]"
                            >
                              🔗 Official Website Check Karo
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Detailed View (width 2/3 on desktop) */}
          <div className={cn(
            "flex-1 overflow-y-auto bg-white p-4 md:p-6",
            selectedScholarship ? "block" : "hidden lg:block"
          )}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 gap-5"
                >
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-4 border-[#008069]/10 animate-pulse"></span>
                    <span className="absolute inset-2 rounded-full border-4 border-t-[#008069] border-r-transparent border-b-transparent border-l-transparent animate-spin"></span>
                    <Sparkles className="w-8 h-8 text-yellow-500 animate-bounce" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="font-black text-slate-800 text-base">
                      AI Live Research Proccessing...
                    </h3>
                    
                    {/* Progress Indicator steps */}
                    <div className="space-y-1.5">
                      {loadingStepsTexts.map((txt, index) => (
                        <p
                          key={index}
                          className={cn(
                            "text-xs transition-all duration-300 font-bold",
                            loadingStep === index
                              ? "text-[#008069] scale-102"
                              : "text-slate-300"
                          )}
                        >
                          {loadingStep === index ? "👉 " : "• "} {txt}
                        </p>
                      ))}
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-semibold pt-4">
                      Bhai, live web searching mein 5-10 seconds ka time lag sakta hai, please wait karein...
                    </p>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-6 gap-4"
                >
                  <AlertCircle className="w-16 h-16 text-rose-500 animate-bounce" />
                  <div className="max-w-md">
                    <h3 className="font-extrabold text-slate-800 text-base mb-1">
                      Kuch Dikkat Hui Bhai!
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {error}
                    </p>
                    <button
                      onClick={() => handleSearch()}
                      className="mt-4 px-4 py-2 bg-[#008069] hover:bg-[#006b56] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all active:scale-95"
                    >
                      Dobara Koshish Karein (Retry)
                    </button>
                  </div>
                </motion.div>
              ) : !selectedScholarship ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-6 gap-4"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-[#008069]">
                    <Award className="w-10 h-10 text-[#008069]" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="font-extrabold text-slate-800 text-base">
                      Koi Bhi Scholarship Khojein!
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Bhai, search box mein apni class, stream ya desired scholarship ka naam likhein. AI live web search karke aapko bilkul up-to-date document checklists, eligibility criteria, aur guidelines batayega.
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2 text-left mt-4 text-xs font-semibold text-slate-600">
                      <p className="font-black text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-4 h-4 text-emerald-500" />
                        AI Scholarship Engine Specialties:
                      </p>
                      <p>✅ <b>Automatic Deadline Checking:</b> Live dynamic eligibility logic based on current date.</p>
                      <p>✅ <b>Bada Bhai Advice:</b> Reassuring, friendly advice tailored to rural & urban students alike.</p>
                      <p>✅ <b>Document Preparation Guide:</b> Exactly where to apply and how to procure hard documents.</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  
                  {/* Mobile Back Button */}
                  <div className="lg:hidden">
                    <button
                      onClick={() => setSelectedScholarship(null)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#008069] font-black text-xs transition-all active:scale-95 border border-emerald-100/50"
                    >
                      <span>← Wapas List Pe Jayein (Back to List)</span>
                    </button>
                  </div>
                  
                  {/* Summary / Search Banner */}
                  {result?.summary && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-r-2xl p-4 flex flex-col gap-1.5 shadow-xs">
                      <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1">
                        <Sparkles className="w-4.5 h-4.5 text-amber-600" />
                        Bada Bhai Live Summary advice
                      </span>
                      <p className="text-xs font-black text-slate-800 leading-relaxed">
                        "{result.summary.quickAdvice}"
                      </p>
                      <p className="text-[11px] font-extrabold text-indigo-700 flex items-center gap-1 mt-1">
                        🎯 Agla Kadam (Next Step): <span className="text-slate-700">{result.summary.nextAction}</span>
                      </p>
                    </div>
                  )}

                  {/* Scholarship Name & Basic Meta Info Header */}
                  <div className="flex flex-col gap-2.5 pb-5 border-b border-slate-100">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        selectedScholarship.type === 'CENTRAL' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        selectedScholarship.type === 'STATE' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        selectedScholarship.type === 'INTERNATIONAL' ? "bg-purple-50 text-purple-700 border-purple-200" :
                        selectedScholarship.type === 'PROGRAM' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {selectedScholarship.type} Scholarship
                      </span>

                      {selectedScholarship.source && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                          📌 Source: {selectedScholarship.source}
                        </span>
                      )}

                      {selectedScholarship.verified && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-[#008069] border border-emerald-200 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                          ✅ Verified Organization
                        </span>
                      )}
                      
                      <span className="text-xs text-slate-400 font-extrabold">•</span>
                      
                      <span className="text-xs font-extrabold text-slate-500">
                        Organized by: <span className="text-slate-800 font-black">{selectedScholarship.organizer}</span>
                      </span>
                    </div>

                    <div>
                      <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {selectedScholarship.name}
                      </h1>
                      {selectedScholarship.hindiName && (
                        <h3 className="text-sm md:text-base font-extrabold text-[#008069] mt-0.5">
                          {selectedScholarship.hindiName}
                        </h3>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Targeted Group: <span className="font-extrabold text-slate-700">{selectedScholarship.targetGroup}</span>
                    </p>
                  </div>

                  {/* Quick Actions & Sharing Buttons */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
                    <a
                      href={selectedScholarship.applicationProcess.portal || "https://scholarships.gov.in"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#008069] text-white hover:bg-[#006b56] rounded-2xl py-3 px-4 text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                    >
                      <span>🌐 Official Website →</span>
                    </a>

                    <button
                      onClick={() => {
                        const shareText = `*Bhai, dekh! Mujhe Form Mitra AI par ek badhiya scholarship mili hai:*\n\n🌟 *${selectedScholarship.name}*\n🏢 *Organizer:* ${selectedScholarship.organizer}\n💰 *Amount:* ${selectedScholarship.benefits?.totalAmount || "Fully Funded"}\n⏱️ *Deadline:* ${selectedScholarship.deadline?.currentCycleDate || "Closed/Dynamic"}\n\n🌐 *Official Portal Apply Link:* ${selectedScholarship.applicationProcess?.portal || "https://scholarships.gov.in"}\n\n_Form Mitra AI Scholarship Finder se dhoondha gaya_`;
                        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                        window.open(url, "_blank");
                      }}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#008069] border border-emerald-200 rounded-2xl py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                    >
                      <span>💬 Yeh scholarship WhatsApp pe share karo!</span>
                    </button>
                  </div>

                  {/* Bada Bhai Personal Advice Speech Bubble */}
                  {selectedScholarship.badeBhaiAdvice && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 md:p-5 relative">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 bg-gradient-to-tr from-[#008069] to-emerald-400 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-sm relative shrink-0">
                          <span>👦</span>
                          <span className="absolute -bottom-1 -right-1 bg-yellow-400 w-4 h-4 rounded-full flex items-center justify-center text-[8px]">⭐</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black text-xs uppercase tracking-wider text-[#008069] flex items-center gap-1.5">
                            Bada Bhai Advice (बड़े भाई की सलाह)
                            <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.25 rounded">100% Personal</span>
                          </h4>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed italic">
                            "{selectedScholarship.badeBhaiAdvice}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Match Score Gauge */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" className="stroke-slate-200 fill-none" strokeWidth="6" />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            className="stroke-[#008069] fill-none"
                            strokeWidth="6"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - selectedScholarship.matchScore / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-sm font-black text-slate-800">{selectedScholarship.matchScore}%</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800">
                          Aapke Profile Ke Saath Matching Score
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          {selectedScholarship.matchReason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Deadline & Urgency Section */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-[#008069]" />
                        आवेदन की समय सीमा (Application Deadlines)
                      </span>

                      {selectedScholarship.deadline.status === 'CLOSED' ? (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          🔴 Closed - Next cycle dekho {selectedScholarship.deadline.nextCycleExpected || "[September 2026]"}
                        </span>
                      ) : selectedScholarship.deadline.status === 'COMING_SOON' ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <span>⏳</span>
                          Coming Soon
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <span>🟢</span>
                          Apply is OPEN
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Application Deadline
                        </span>
                        <span className={cn(
                          "text-sm font-black text-slate-800 flex flex-col",
                          selectedScholarship.deadline.status === 'CLOSED' && "text-rose-500 line-through"
                        )}>
                          <span>
                            Expected: {selectedScholarship.deadline.currentCycleDate 
                              ? `${cleanDeadlineFormat(selectedScholarship.deadline.currentCycleDate)} (Verify karo)` 
                              : "Verify karo"}
                          </span>
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Next expected Cycle
                        </span>
                        <span className="text-sm font-black text-indigo-600">
                          {selectedScholarship.deadline.nextCycleExpected || "Expected next cycle"}
                        </span>
                      </div>
                    </div>

                    {selectedScholarship.deadline.status === 'OPEN' && (
                      <div className="px-3 py-2.5 bg-amber-500/10 border border-amber-300 rounded-2xl text-xs font-bold text-amber-800 flex justify-between items-center">
                        <span className="flex items-center gap-1.5 font-black">
                          <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                          ⏳ {selectedScholarship.deadline.urgencyMessage}
                        </span>
                        <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded-lg font-black uppercase text-[10px] tracking-wider shrink-0">
                          {selectedScholarship.deadline.daysRemaining} Din bache hain
                        </span>
                      </div>
                    )}

                    {selectedScholarship.deadline.status === 'CLOSED' && (
                      <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <span>🛑</span>
                        <span>
                          Is scholarship ke is saal ke form band ho chuke hain bhai, ab aap tab tak document tayyar rakhiye taaki {selectedScholarship.deadline.nextCycleExpected} me sabse pehle apply kar saken!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Benefits / Rewards Grid */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pb-2.5 border-b border-slate-100">
                      <DollarSign className="w-4 h-4 text-[#008069]" />
                      Milne Vali Rashi Aur Labh (Financial Rewards & Perks)
                    </span>

                    <div className="bg-gradient-to-tr from-emerald-500 to-[#008069] text-white p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest">Total Reward Value</span>
                        <h2 className="text-xl md:text-2xl font-black">{selectedScholarship.benefits.totalAmount}</h2>
                      </div>
                      <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-extrabold tracking-tight">
                        Duration: {selectedScholarship.benefits.duration}
                      </span>
                    </div>

                    {/* Breakdown Detail Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedScholarship.benefits.breakdown.tuition && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Tuition Support</span>
                          <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{selectedScholarship.benefits.breakdown.tuition}</span>
                        </div>
                      )}
                      {selectedScholarship.benefits.breakdown.monthly && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Stipend</span>
                          <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{selectedScholarship.benefits.breakdown.monthly}</span>
                        </div>
                      )}
                      {selectedScholarship.benefits.breakdown.airfare && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Airfare Travel</span>
                          <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{selectedScholarship.benefits.breakdown.airfare}</span>
                        </div>
                      )}
                      {selectedScholarship.benefits.breakdown.settlement && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Settlement Cash</span>
                          <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{selectedScholarship.benefits.breakdown.settlement}</span>
                        </div>
                      )}
                      {selectedScholarship.benefits.breakdown.books && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Book Allowance</span>
                          <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{selectedScholarship.benefits.breakdown.books}</span>
                        </div>
                      )}
                      {selectedScholarship.benefits.breakdown.hostel && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Hostel Fee</span>
                          <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{selectedScholarship.benefits.breakdown.hostel}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Perks */}
                    {selectedScholarship.benefits.additionalPerks && selectedScholarship.benefits.additionalPerks.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Extra Perks & Support:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedScholarship.benefits.additionalPerks.map((perk, i) => (
                            <span key={i} className="text-[10px] font-bold px-2.5 py-1 bg-[#008069]/5 text-[#008069] border border-[#008069]/10 rounded-full">
                              ⭐️ {perk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Eligibility Criteria Details */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pb-2.5 border-b border-slate-100">
                      <Award className="w-4 h-4 text-[#008069]" />
                      पात्रता मानदंड (Eligibility Checklists)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Block */}
                      <div className="space-y-3 text-xs font-bold">
                        <div className="flex gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400 shrink-0">Age:</span>
                          <div className="text-slate-700">
                            <p className="font-extrabold">Min: {selectedScholarship.eligibility.age.min} / Max: {selectedScholarship.eligibility.age.max} Years</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{selectedScholarship.eligibility.age.description}</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400 shrink-0">Marks:</span>
                          <div className="text-slate-700">
                            <p className="font-extrabold">Required: {selectedScholarship.eligibility.academics.minMarks}</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{selectedScholarship.eligibility.academics.description}</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400 shrink-0">Income:</span>
                          <div className="text-slate-700">
                            <p className="font-extrabold">Limit: {selectedScholarship.eligibility.income.maxAnnual}</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{selectedScholarship.eligibility.income.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Block */}
                      <div className="space-y-2.5 text-xs font-bold text-slate-700">
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400">Allowed Categories:</span>
                          <span className="font-extrabold text-[#008069]">{selectedScholarship.eligibility.category.join(", ")}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400">Gender Eligibility:</span>
                          <span className="font-extrabold text-[#008069]">{selectedScholarship.eligibility.gender}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400">Eligible Streams:</span>
                          <span className="font-extrabold text-[#008069]">{selectedScholarship.eligibility.stream.join(", ")}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400">Allowed State:</span>
                          <span className="font-extrabold text-indigo-600">{selectedScholarship.eligibility.state}</span>
                        </div>
                      </div>
                    </div>

                    {/* Extra Eligibility Checklist */}
                    {selectedScholarship.eligibility.other && selectedScholarship.eligibility.other.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-1.5 text-xs font-bold text-slate-700">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aanya Shartein (Other Conditions):</p>
                        <ul className="space-y-1">
                          {selectedScholarship.eligibility.other.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 font-medium">
                              <span className="text-[#008069]">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Required Documents Checklist */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pb-2.5 border-b border-slate-100">
                      <FileText className="w-4 h-4 text-[#008069]" />
                      ज़रूरी दस्तावेज़ और तैयारी (Required Documents & Actionable Advice)
                    </span>

                    <div className="space-y-3">
                      {selectedScholarship.documents.map((doc, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/55 border border-slate-200 rounded-2xl flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              📄 {doc.name}
                              {doc.isRequired ? (
                                <span className="px-1.5 py-0.25 bg-red-50 text-red-600 border border-red-100 rounded text-[8px] font-black uppercase tracking-wider">Required</span>
                              ) : (
                                <span className="px-1.5 py-0.25 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-wider">Optional</span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Cost: <span className="text-slate-600 font-extrabold">{doc.cost}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
                            <div>
                              <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Kahan se milega? (How to get)</p>
                              <p className="text-slate-700 mt-0.5">{doc.howToGet}</p>
                            </div>
                            <div>
                              <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Kitna samay lagega?</p>
                              <p className="text-slate-700 mt-0.5">⏱️ {doc.timeRequired}</p>
                            </div>
                          </div>

                          {doc.tip && (
                            <div className="bg-emerald-50/40 p-2 rounded-xl border border-emerald-100/40 text-[10.5px] font-bold text-[#008069] flex gap-1 items-start mt-1">
                              <span className="text-xs shrink-0">💡</span>
                              <span><b>Bhai Pro Tip:</b> {doc.tip}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Application Process Steps */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pb-2.5 border-b border-slate-100">
                      <Globe className="w-4 h-4 text-[#008069]" />
                      आवेदन कैसे करें? (How to Apply - Step by Step)
                    </span>

                    <div className="space-y-3.5 text-xs font-bold text-slate-700">
                      <div className="flex flex-wrap justify-between items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase">Official Application Portal</p>
                          <p className="text-[#008069] font-black truncate">{selectedScholarship.applicationProcess.portalName || "Official Portal"}</p>
                        </div>
                        {selectedScholarship.applicationProcess.portal && (
                          <a
                            href={selectedScholarship.applicationProcess.portal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#008069] hover:bg-[#006b56] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-extrabold shadow-sm hover:shadow active:scale-95 shrink-0"
                          >
                            Portal Pe Jayein
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Form Bharne Ke Charn (Application Steps):</p>
                        <div className="space-y-3">
                          {selectedScholarship.applicationProcess.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <span className="w-6 h-6 bg-emerald-50 text-[#008069] border border-emerald-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                                {idx + 1}
                              </span>
                              <p className="text-xs font-semibold text-slate-700 leading-relaxed pt-0.5">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tracks if any */}
                      {selectedScholarship.applicationProcess.tracks && selectedScholarship.applicationProcess.tracks.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Multiple Tracks Available:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedScholarship.applicationProcess.tracks.map((track, i) => (
                              <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col gap-1 text-xs">
                                <span className="font-extrabold text-[#008069]">{track.name}</span>
                                <span className="text-[11px] text-slate-500 font-medium leading-relaxed">{track.description}</span>
                                <span className="text-[10px] text-indigo-600 mt-1 font-bold">Universities Choice: {track.universities}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Helpline & Support */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        {selectedScholarship.applicationProcess.helpline && (
                          <div className="flex gap-2.5 items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <PhoneCall className="w-4 h-4 text-[#008069] shrink-0" />
                            <div className="text-[11px]">
                              <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Helpline Support</p>
                              <p className="font-extrabold text-slate-700">{selectedScholarship.applicationProcess.helpline}</p>
                            </div>
                          </div>
                        )}
                        {selectedScholarship.applicationProcess.email && (
                          <div className="flex gap-2.5 items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <Mail className="w-4 h-4 text-[#008069] shrink-0" />
                            <div className="text-[11px]">
                              <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Email Support</p>
                              <p className="font-extrabold text-slate-700 select-all">{selectedScholarship.applicationProcess.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preparation Timeline */}
                  {selectedScholarship.preparationTimeline && selectedScholarship.preparationTimeline.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pb-2.5 border-b border-slate-100">
                        <Clock className="w-4 h-4 text-[#008069]" />
                        तैयारी की समयरेखा (Preparation Timeline)
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {selectedScholarship.preparationTimeline.map((item, idx) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col gap-1.5 text-xs">
                            <span className="font-extrabold text-[#008069] uppercase tracking-wider text-[10px]">{item.timeframe}</span>
                            <ul className="space-y-1">
                              {item.tasks.map((task, i) => (
                                <li key={i} className="flex items-start gap-1 font-medium text-[11px] text-slate-600">
                                  <span>•</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Tips & Common Mistakes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Success Tips */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
                      <span className="text-[10px] font-black uppercase text-[#008069] tracking-wider flex items-center gap-1 pb-2 border-b border-slate-100">
                        <Check className="w-4 h-4 text-[#008069]" />
                        सफलता के टिप्स (Success Tips)
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700 font-bold">
                        {selectedScholarship.successTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 font-semibold">
                            <span className="text-[#008069]">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Common Mistakes */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
                      <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider flex items-center gap-1 pb-2 border-b border-slate-100">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        आम गलतियां जिनसे बचें (Common Mistakes to Avoid)
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700 font-bold">
                        {selectedScholarship.commonMistakes.map((mistake, idx) => (
                          <li key={idx} className="flex items-start gap-2 font-semibold">
                            <span className="text-rose-500">❌</span>
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Related / Alternative Scholarships */}
                  {selectedScholarship.relatedScholarships && selectedScholarship.relatedScholarships.length > 0 && (
                    <div className="bg-slate-50 border border-slate-150 rounded-3xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alternative / Similar Scholarships to Consider:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedScholarship.relatedScholarships.map((rel, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setQuery(rel);
                              handleSearch(rel);
                            }}
                            className="bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:text-[#008069] transition-all"
                          >
                            🔍 {rel}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer Section */}
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 mt-4 mb-2 space-y-3">
                    <p className="text-xs font-black text-amber-800 flex items-start gap-2 leading-relaxed">
                      <span className="shrink-0 text-base">⚠️</span>
                      <span>Dates AI-estimated hain. Apply karne se pehle official website pe verify zaroor karo.</span>
                    </p>
                    <a
                      href={selectedScholarship.applicationProcess.portal || "https://scholarships.gov.in"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-xs font-black transition-all shadow-sm active:scale-[0.99]"
                    >
                      🔗 Official Website Check Karo
                    </a>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Form Mitra Premium - Bade Bhai Support Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full border border-slate-250 shadow-2xl p-6 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl" />

              <button
                onClick={() => setShowPremiumModal(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center gap-4 pt-2">
                <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform duration-300">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Form Mitra AI Premium 👑</h3>
                  <p className="text-xs text-slate-500 font-extrabold mt-1 uppercase tracking-wider text-[#008069]">Bade Bhai Support Option 🤝</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 w-full text-left space-y-3 my-2">
                  <p className="text-[11px] text-slate-600 font-bold leading-normal">
                    Bhai, high API server and Google Search costs keep us from offering unlimited queries to everyone. Get premium to unlock:
                  </p>
                  <ul className="space-y-2 text-xs font-semibold text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="text-[#008069]">🚀</span>
                      <span><b>Unlimited Real-Time Live Searches</b> (No 5/day limit)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#008069]">✨</span>
                      <span><b>Deep Research Private CSR portals</b> (Google Search API)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#008069]">📱</span>
                      <span><b>Priority WhatsApp eligibility updates</b> & forms reminder</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#008069]">🤝</span>
                      <span><b>Elder Brother personal support</b> for any form query</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                  <div className="flex items-center justify-between px-2 text-slate-700 font-black">
                    <span className="text-sm">Premium Price:</span>
                    <span className="text-xl text-[#008069]">₹29 <span className="text-xs text-slate-400 font-bold line-through">₹499</span></span>
                  </div>

                  <button
                    onClick={async () => {
                      // Simulated success payment
                      const btn = document.getElementById("pay-premium-btn");
                      if (btn) {
                        btn.innerText = "Processing payment via UPI...";
                        (btn as HTMLButtonElement).disabled = true;
                      }
                      
                      await new Promise((resolve) => setTimeout(resolve, 1500));
                      
                      if (typeof window !== "undefined" && window.localStorage) {
                        localStorage.setItem("is_premium", "true");
                        setIsPremium(true);
                      }
                      setShowPremiumModal(false);
                      alert("Mubarak ho bhai! 🎉 Aapka Premium access activate ho gaya hai. Unlimited searches unlock ho chuki hain!");
                    }}
                    id="pay-premium-btn"
                    className="w-full py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-emerald-600 text-white font-black text-sm rounded-xl shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span>UPI Se Pay Karein (₹29 Only)</span>
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold">One-time payment. Lifetime support from Form Mitra.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
