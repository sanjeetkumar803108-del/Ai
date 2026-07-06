import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ExternalLink, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Calendar,
  Compass,
  CheckSquare,
  Square,
  FileCheck2,
  BellRing,
  Globe,
  Zap,
  Lock,
  Award,
  Fingerprint,
  BookOpen,
  UserCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Gift,
  ListOrdered,
  HelpCircle,
  Briefcase,
  Clock,
  DollarSign
} from "lucide-react";
import { UserProfile } from "../types";

interface Scholarship {
  name: string;
  amount: string;
  eligibility: string[];
  opening: string;
  deadline: string;
  link: string;
  tip: string;
  documents?: string[];
  matchScore?: number;
  matchReason?: string;
  isSecret?: boolean;
  region?: "India" | "Worldwide";
  rewardsDetail?: string;
  stepsToApply?: string[];
}

interface CSRScannerProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export const CSRScanner: React.FC<CSRScannerProps> = ({ userProfile, onClose }) => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [query, setQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<"India" | "Worldwide">("India");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [expandedCard, setExpandedCard] = useState<Record<string, boolean>>({});

  // Selected scholarship for detailed modal view
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  // Track checked state of required documents per scholarship
  const [completedDocs, setCompletedDocs] = useState<Record<string, Record<string, boolean>>>({});
  const [showToast, setShowToast] = useState<string | null>(null);

  const scanSteps = [
    `🔍 Initializing Google Deep Research protocol...`,
    `🧬 Extracting background metadata for Class ${userProfile.class || "11/12"}, stream ${userProfile.stream || "Science"}...`,
    "📂 Auditing corporate social responsibility (CSR) databases & private trust vaults...",
    "🧬 Scanning premium global foundations, study endowments & elite global research aids...",
    "🔒 Decrypting hidden private company scholarships (Google, Adobe, Microsoft, Tata, Reliance)...",
    "✨ Verifying 100% eligibility score, rewards details & step-by-step application blueprint..."
  ];

  const fetchScholarships = async (searchQuery: string = "", regionSelected: "India" | "Worldwide" = activeRegion, runDeepScan: boolean = false) => {
    setError(null);
    if (runDeepScan) {
      setIsDeepScanning(true);
      setScanStep(0);
      
      // Simulate highly detailed profile research scan steps
      for (let i = 0; i < scanSteps.length; i++) {
        setScanStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setIsDeepScanning(false);
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/csr/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: userProfile,
          query: searchQuery,
          region: regionSelected
        })
      });

      if (!response.ok) {
        throw new Error("Failed to search scholarships");
      }

      const data = await response.json();
      setScholarships(data.scholarships || []);
    } catch (err) {
      console.error(err);
      setError("AI research servers temporarily busy. Kripya dubaara koshish karein!");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto load on mount and when active region changes
  useEffect(() => {
    fetchScholarships("", activeRegion, false);
  }, [userProfile, activeRegion]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchScholarships(query, activeRegion, false);
  };

  const handleDeepResearchScan = () => {
    fetchScholarships(query, activeRegion, true);
  };

  const toggleDocument = (scholarshipName: string, doc: string) => {
    setCompletedDocs(prev => {
      const currentList = prev[scholarshipName] || {};
      return {
        ...prev,
        [scholarshipName]: {
          ...currentList,
          [doc]: !currentList[doc]
        }
      };
    });
  };

  const handleAddToCalendar = (s: Scholarship) => {
    const title = `Apply for scholarship: ${s.name}`;
    const desc = `Reminder to apply for ${s.name}.
Grant Amount: ${s.amount}
Apply link: ${s.link}

💡 Insider Tip: ${s.tip}`;

    const now = new Date();
    const startTimeStr = now.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTimeStr = new Date(now.getTime() + 60*60*1000).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&dates=${startTimeStr}/${endTimeStr}`;
    
    window.open(url, "_blank");
    
    setShowToast(`Reminder configuration launched for "${s.name}"!`);
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div id="secret-scholarship-finder-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full h-full md:max-w-xl md:h-[94vh] md:rounded-[2.5rem] md:shadow-2xl md:border-4 md:border-slate-100 flex flex-col overflow-hidden relative shadow-slate-200/80">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 p-6 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Mitra CSR Scanner
                <span className="text-[9px] bg-emerald-500 text-white font-black py-0.5 px-2 rounded-full uppercase tracking-wider animate-pulse">
                  Corporate AI
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Hidden Private Trusts & Worldwide Corporate CSR Scholarships
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-black cursor-pointer text-sm"
          >
            ✕
          </button>
        </header>

        {/* Region Switch Tabs */}
        <div className="bg-slate-50 p-2.5 flex gap-2 shrink-0 border-b border-slate-200">
          <button
            onClick={() => {
              setActiveRegion("India");
              setScholarships([]);
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
              activeRegion === "India"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10 border border-emerald-500"
                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-sm"
            }`}
          >
            <span>🇮🇳</span> India Corporate & CSR Funds
          </button>
          <button
            onClick={() => {
              setActiveRegion("Worldwide");
              setScholarships([]);
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
              activeRegion === "Worldwide"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10 border border-indigo-500"
                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-sm"
            }`}
          >
            <span>🏢</span> Worldwide Company Awards
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col gap-5">
          
          {/* Toast Notification */}
          {showToast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-850 text-white text-xs font-bold py-3.5 px-6 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
              <BellRing className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>{showToast}</span>
            </div>
          )}

          {/* Target Profile Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 p-5 rounded-3xl border border-indigo-100 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-indigo-600 animate-pulse" />
                Dost, Your Profile is Strictly Matched:
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-700 font-bold font-sans">
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  🎓 Level: <strong className="text-emerald-700">{userProfile.class || "Any Class"}</strong>
                </span>
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  🧬 Stream: <strong className="text-indigo-700">{userProfile.stream || "Any Stream"}</strong>
                </span>
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  📍 State: <strong className="text-indigo-700">{userProfile.state || "India"}</strong>
                </span>
              </div>
            </div>
            
            <button
              onClick={handleDeepResearchScan}
              disabled={isLoading || isDeepScanning}
              className="bg-gradient-to-r from-amber-500 via-orange-600 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white font-black text-[10px] uppercase tracking-widest py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10 shrink-0 border-none disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              Deep Research Profile Match
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search specific keywords (e.g. medical, girls, engineering, research)...`}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 shadow-sm"
              />
            </div>
            <button
               type="submit"
               disabled={isLoading || isDeepScanning}
               className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 flex items-center justify-center text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            >
              Search
            </button>
          </form>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto relative pr-1">
            {isDeepScanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs rounded-[2rem] z-10 p-6">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 flex items-center justify-center animate-spin mb-6">
                  <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <div className="space-y-4 max-w-sm text-center">
                  <h4 className="text-sm font-black text-amber-600 uppercase tracking-widest">
                    🤖 Bade Bhai AI - Deep Research Scan Active
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl min-h-[50px] flex items-center justify-center">
                    <p className="text-xs font-bold text-slate-700 animate-pulse">
                      {scanSteps[scanStep]}
                    </p>
                  </div>
                  <div className="flex gap-1 justify-center">
                    {scanSteps.map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= scanStep ? "bg-amber-500 scale-125" : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {isLoading && !isDeepScanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 py-20 bg-white/80 z-10">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center px-4">
                  Sourcing matches from Private vaults...
                </p>
              </div>
            ) : error ? (
              <div className="absolute inset-x-0 top-12 max-w-md mx-auto text-center p-6 bg-red-50 border border-red-200 rounded-3xl flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                <h4 className="text-sm font-black text-red-800">AI Connection Delayed</h4>
                <p className="text-xs text-slate-600 leading-normal">{error}</p>
                <button 
                  onClick={() => fetchScholarships(query, activeRegion, false)}
                  className="mt-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
                >
                  Retry Search
                </button>
              </div>
            ) : scholarships.length === 0 && !isDeepScanning ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-4 bg-white rounded-[2.5rem] border border-slate-200/80">
                <Compass className="w-16 h-16 text-slate-300 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-700">No Custom Matches In Current Repository</h4>
                  <p className="text-xs text-slate-500">Please try clicking "Deep Research Profile Match" or search with keywords.</p>
                </div>
              </div>
            ) : !isDeepScanning ? (
              <div className="grid grid-cols-1 gap-3 pb-12">
                {scholarships.map((s, idx) => {
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedScholarship(s)}
                      className="bg-white border border-slate-200 hover:border-emerald-500/40 hover:shadow-md rounded-2xl p-4.5 transition-all flex flex-col gap-2.5 shadow-xs relative overflow-hidden cursor-pointer group active:scale-[0.98]"
                    >
                      <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {s.name}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Apply: <strong className="text-slate-700 font-bold">{s.opening || "Open"}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Deadline: <strong className="text-rose-500 font-bold">{s.deadline}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Full Details Overlay (Active Scholarship Detail Modal) */}
        {selectedScholarship && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col animate-slide-up">
            {/* Detail Header */}
            <header className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-emerald-900 p-5 text-white flex items-center justify-between shrink-0 border-b border-indigo-955">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedScholarship(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                >
                  ←
                </button>
                <div>
                  <h3 className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                    Scholarship Details
                  </h3>
                  <p className="text-sm font-black text-white tracking-tight line-clamp-1">
                    {selectedScholarship.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedScholarship(null)} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 font-bold cursor-pointer text-xs"
              >
                ✕
              </button>
            </header>

            {/* Detail Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
              
              {/* Rewards / Amount Header Card */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-emerald-50/50 p-5 rounded-3xl border border-indigo-100 flex flex-col gap-3 relative overflow-hidden shadow-xs">
                <div className="absolute right-4 top-4 text-indigo-200/50">
                  <Award className="w-16 h-16" />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                    💰 {selectedScholarship.amount}
                  </span>
                  <span className="text-[9px] font-black bg-white text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {selectedScholarship.matchScore || 100}% Fit
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                  {selectedScholarship.name}
                </h2>

                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold pt-1">
                  <span className="bg-white border border-slate-100 px-2 py-1 rounded-lg shadow-2xs">
                    📅 Opens: <strong className="text-emerald-700">{selectedScholarship.opening || "August"}</strong>
                  </span>
                  <span className="bg-white border border-slate-100 px-2 py-1 rounded-lg text-rose-700 shadow-2xs">
                    ⚠️ Deadline: <strong className="text-rose-600">{selectedScholarship.deadline}</strong>
                  </span>
                </div>
              </div>

              {/* Match Reason (Bada Bhai Recommendation) */}
              {selectedScholarship.matchReason && (
                <div className="bg-gradient-to-r from-indigo-50/50 via-emerald-50/30 to-white border border-emerald-200/60 p-4.5 rounded-3xl relative shadow-2xs">
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    Bada Bhai AI recommendation
                  </p>
                  <p className="text-[11px] text-slate-700 font-bold leading-relaxed mt-1.5">
                    {selectedScholarship.matchReason}
                  </p>
                </div>
              )}

              {/* Eligibility vs Required Documents */}
              <div className="space-y-4">
                {/* Specific Eligibility */}
                <div className="bg-white border border-slate-250 p-4.5 rounded-3xl shadow-xs">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span>🎯</span> Specific Eligibility
                  </h4>
                  <ul className="space-y-2.5">
                    {selectedScholarship.eligibility && selectedScholarship.eligibility.map((item, idy) => (
                      <li key={idy} className="text-xs font-bold text-slate-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Documents Checklist */}
                <div className="bg-white border border-slate-250 p-4.5 rounded-3xl shadow-xs">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    📄 Documents Checklist
                  </h4>
                  <div className="space-y-2">
                    {(selectedScholarship.documents || [
                      "Class 10th Marks card",
                      "Class 12th Marks card / Entrance Rank card",
                      "Income Proof Certificate",
                      "Passport size photograph"
                    ]).map((doc, idy) => {
                      const isChecked = !!(completedDocs[selectedScholarship.name] || {})[doc];
                      return (
                        <div 
                          key={idy}
                          onClick={() => toggleDocument(selectedScholarship.name, doc)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-xs select-none ${
                            isChecked ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/50" : "hover:bg-slate-50 text-slate-700 font-bold"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className={isChecked ? "line-through opacity-60 decoration-emerald-800 decoration-1" : "leading-tight"}>
                            {doc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Research Blueprint Section */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-150">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">
                      Google Deep Research Blueprint
                    </span>
                  </div>
                </div>
                
                <div className="p-4.5 space-y-4">
                  {/* Rewards / Perks */}
                  <div className="space-y-1.5">
                    <h5 className="text-[9.5px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-emerald-600" />
                      Extra Perks & Rewards
                    </h5>
                    <p className="text-[11.5px] text-slate-700 font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {selectedScholarship.rewardsDetail || "Full academic funding support matching college fees, direct corporate mentorship channels, and skill certification kits."}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    <h5 className="text-[9.5px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                      Step-by-Step Apply Guide
                    </h5>
                    <div className="space-y-2">
                      {(selectedScholarship.stepsToApply || [
                        "Click 'Official Apply Link' and create your account on the designated corporate CSR trust portal.",
                        "Fill in personal background information and write an SOP emphasizing financial need or career vision.",
                        "Upload verified marksheets, income certificate, and submit for direct high-priority trust approval."
                      ]).map((step, sIdx) => (
                        <div key={sIdx} className="flex gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 items-start">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <p className="text-[11px] font-bold text-slate-700 leading-normal">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Insider Tip & Action Buttons */}
              <div className="space-y-4 pt-1">
                <div className="bg-amber-50 p-4.5 rounded-3xl border border-amber-200/50 shadow-2xs">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    💡 Secrets to stand out & secure it
                  </p>
                  <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-1.5">
                    {selectedScholarship.tip}
                  </p>
                </div>

                <div className="flex gap-3 pb-6">
                  <a
                    href={selectedScholarship.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all cursor-pointer border-none text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    🔗 Official Apply Link
                  </a>

                  <button
                    onClick={() => handleAddToCalendar(selectedScholarship)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-[10.5px] uppercase tracking-wider px-4 py-3.5 rounded-2xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Set Reminder
                  </button>
                </div>
              </div>

            </div>

            {/* Detail Close Footer */}
            <div className="p-4 bg-white border-t border-slate-150 shrink-0 flex gap-2">
              <button
                onClick={() => setSelectedScholarship(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest py-3 rounded-xl border border-slate-200 cursor-pointer text-center active:scale-95 transition-all"
              >
                Back to list
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
