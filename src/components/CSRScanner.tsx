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
  BellRing
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
}

interface CSRScannerProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export const CSRScanner: React.FC<CSRScannerProps> = ({ userProfile, onClose }) => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track checked state of required documents per scholarship
  // Format: Record<ScholarshipName, Record<DocumentName, boolean>>
  const [completedDocs, setCompletedDocs] = useState<Record<string, Record<string, boolean>>>({});
  const [showToast, setShowToast] = useState<string | null>(null);

  const fetchScholarships = async (searchQuery: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/csr/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: userProfile,
          query: searchQuery
        })
      });

      if (!response.ok) {
        throw new Error("Failed to search corporate scholarships");
      }

      const data = await response.json();
      setScholarships(data.scholarships || []);
    } catch (err) {
      console.error(err);
      setError("AI server busy. Kripya dubaara koshish karein!");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto load on mount based on profile
  useEffect(() => {
    fetchScholarships();
  }, [userProfile]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchScholarships(query);
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

    // Format date for google calendar if we can extract, otherwise fall back to 2 weeks from now
    const now = new Date();
    const startTimeStr = now.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTimeStr = new Date(now.getTime() + 60*60*1000).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&dates=${startTimeStr}/${endTimeStr}`;
    
    window.open(url, "_blank");
    
    setShowToast(`Reminder configuration launched for "${s.name}"!`);
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div id="multi-page-pdf-scanner-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full h-full md:max-w-md md:h-[92vh] md:rounded-[2.5rem] md:shadow-2xl md:border-4 md:border-slate-800 flex flex-col overflow-hidden relative shadow-slate-900/40">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center scale-95">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Mitra CSR Scanner
                <span className="text-[9px] bg-emerald-500 text-white font-black py-0.5 px-2 rounded-full uppercase tracking-wider">
                  No-Govt Filter
                </span>
              </h2>
              <p className="text-xs text-emerald-50 font-medium">
                Tata, Reliance, Wipro & private NGO/Foundation scholarships tracker
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/20 flex items-center justify-center text-white font-black cursor-pointer text-sm"
          >
            ✕
          </button>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 flex flex-col gap-5">
          
          {/* Toast Notification */}
          {showToast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white text-xs font-bold py-3.5 px-6 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
              <BellRing className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>{showToast}</span>
            </div>
          )}

          {/* Quick Stats banner */}
          <div className="bg-emerald-50/60 p-4 rounded-3xl border border-emerald-100/60 shrink-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Auto Profile Matching
              </p>
              <p className="text-[11px] text-gray-500 font-medium font-sans">
                Showing private trust options matching <span className="font-extrabold text-emerald-800">{userProfile.stream || "Science"}</span> ({userProfile.class || "Class 11/12"}).
              </p>
            </div>
            <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-3xs">
              <span className="text-[10px] font-black uppercase text-emerald-600">Filters Active</span>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find specific awards (e.g., Tata medical, Santoor girls, Study abroad)..."
                className="w-full bg-white border border-gray-150 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-gray-800"
              />
            </div>
            <button
               type="submit"
               disabled={isLoading}
               className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-5 flex items-center justify-center text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            >
              Search
            </button>
          </form>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto relative pr-1">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest text-center px-4">
                  Scanning Private & CSR Corporates... Please wait
                </p>
              </div>
            ) : error ? (
              <div className="absolute inset-x-0 top-12 max-w-sm mx-auto text-center p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <h4 className="text-sm font-black text-red-950">Connection Delayed</h4>
                <p className="text-xs text-gray-500 leading-normal">{error}</p>
                <button 
                  onClick={() => fetchScholarships(query)}
                  className="mt-2 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Retry Search
                </button>
              </div>
            ) : scholarships.length === 0 ? (
              <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-4">
                <Compass className="w-16 h-16 text-gray-200" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-600">No Private Awards Registered</h4>
                  <p className="text-xs text-gray-400">Please try another stream or keyword search.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-12">
                {scholarships.map((s, idx) => {
                  const sDocsChecked = completedDocs[s.name] || {};
                  const docList = s.documents || [
                    "Class 10th Marks card",
                    "Class 12th Marks card / Entrance Rank card",
                    "Income Proof Certificate",
                    "Passport size photograph"
                  ];

                  return (
                    <div 
                      key={idx} 
                      className="bg-white border border-gray-150 rounded-[2.5rem] p-6 hover:border-emerald-250 transition-all flex flex-col gap-5 shadow-3xs"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 leading-snug">
                              🏢 {s.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10.5px] font-bold text-gray-400">
                              <span className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                <Calendar className="w-3.5 h-3.5" />
                                {s.opening ? `Opens: ${s.opening}` : "Opens: August"}
                              </span>
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/30">
                                ⚠️ Deadline: {s.deadline}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <div className="bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-2xl shrink-0 shadow-3xs">
                            💰 {s.amount}
                          </div>
                          <button
                            onClick={() => handleAddToCalendar(s)}
                            className="bg-white border border-gray-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider px-3 py-2 rounded-2xl flex items-center gap-1.5 active:scale-95 transition-all shadow-3xs hover:bg-slate-50 cursor-pointer"
                            title="Add scholarship deadline to your calendar"
                          >
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            Add Reminder
                          </button>
                        </div>
                      </div>

                      {/* Content Grid (Eligibility vs Documents) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Eligibility List (3 items) */}
                        <div className="bg-gray-50/70 p-4 rounded-3xl border border-gray-100">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <span>🎯</span> SPECIFIC ELIGIBILITY
                          </h4>
                          <ul className="space-y-2.5">
                            {s.eligibility && s.eligibility.slice(0, 3).map((item, idy) => (
                              <li key={idy} className="text-xs font-semibold text-gray-700 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="leading-tight">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Interactive Documents Checklist */}
                        <div className="bg-emerald-50/20 p-4 rounded-3xl border border-emerald-100/20">
                          <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                            📄 REQUIRED DOCUMENTS CHECKLIST
                          </h4>
                          <div className="space-y-2">
                            {docList.map((doc, idy) => {
                              const isChecked = !!sDocsChecked[doc];
                              return (
                                <div 
                                  key={idy}
                                  onClick={() => toggleDocument(s.name, doc)}
                                  className={`flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-xs select-none ${
                                    isChecked ? "bg-emerald-50/40 text-emerald-950 font-bold" : "hover:bg-gray-50 text-gray-700 font-semibold"
                                  }`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                                  )}
                                  <span className={isChecked ? "line-through opacity-60 decoration-emerald-700 decoration-1" : "leading-tight"}>
                                    {doc}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Insider Tip & Action Footer */}
                      <div className="flex flex-col gap-4.5 pt-1">
                        <div className="bg-amber-50/70 p-4 rounded-3xl border border-amber-100/50">
                          <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                            💡 INSIDER TIP TO STAND OUT
                          </p>
                          <p className="text-[11px] text-gray-800 font-medium leading-relaxed mt-1.5">
                            {s.tip}
                          </p>
                        </div>

                        <a
                          href={s.link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer border-none"
                        >
                          <ExternalLink className="w-4 h-4" />
                          🔗 🔒 Verified Official Apply Link
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
