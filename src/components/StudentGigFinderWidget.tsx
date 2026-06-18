import React, { useState } from "react";
import { 
  Briefcase, 
  Coins, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
  Wrench,
  BookOpen,
  Bookmark,
  RefreshCw
} from "lucide-react";
import { UserProfile } from "../types";

interface GigItem {
  name: string;
  earnings: string;
  commitment: string;
  description: string;
  skills: string[];
  applyLink: string;
  categories: string[];
  minClass: string;
  popularLabel?: string;
}

const DEFAULT_GIGS: GigItem[] = [
  {
    name: "Chegg Subject Matter Expert (Q&A Solver)",
    earnings: "₹120 - ₹200 per solved answer",
    commitment: "Flexible (1-2 hours/day)",
    description: "Solve school or college-level homework questions in your favorite subject of expertise (Maths, Physics, Finance, Chemistry) with neat, step-by-step typed answers.",
    skills: ["Subject expertise (PCM/Commerce/Arts)", "Step-by-step clear writing"],
    applyLink: "https://www.chegg.com/about/companies/sme/",
    categories: ["PCM", "PCB", "Commerce", "Arts"],
    minClass: "11",
    popularLabel: "Top Academic Gig"
  },
  {
    name: "Canva Social Media Designer on Internshala",
    earnings: "₹4,000 - ₹8,000 / month (Part-time stipend)",
    commitment: "2-3 hours/day (Work From Home)",
    description: "Design attractive social media graphics, templates, and basic posters for Indian startups and boutiques using ready-made Canva elements & templates.",
    skills: ["Canva design", "Basic creative layout sense"],
    applyLink: "https://internshala.com/internships/part-time-work-from-home-graphic-design-internships/",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "Highly Creative"
  },
  {
    name: "Audio-to-Text Transcriptionist on Scribie",
    earnings: "₹350 - ₹1,200 per audio hour",
    commitment: "Flexible, no minimum target",
    description: "Listen to clean recorded audio files (conversations, speeches, or interviews) and accurately type them down into clear text format.",
    skills: ["Good English listening", "Clean and fast computerized typing"],
    applyLink: "https://scribie.com/freelance-transcription",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "Best for Focus & Typing"
  },
  {
    name: "Data Entry & CSV Formatting on Internshala",
    earnings: "₹3,000 - ₹6,000 / month (Flexible stipend)",
    commitment: "2 hours/day (Remote)",
    description: "Help localized teams update customer details, sort contact lists, copy textual content from PDFs, and neatly manage simple Excel sheets.",
    skills: ["Microsoft Excel or Google Sheets", "Data integrity & concentration"],
    applyLink: "https://internshala.com/internships/part-time-work-from-home-data-entry-internships/",
    categories: ["Commerce", "Others", "General"],
    minClass: "10",
    popularLabel: "Best Entry Level"
  },
  {
    name: "Secondary School Math Solver on Photonmath / Brainly Partner",
    earnings: "₹80 - ₹150 per verified solution",
    commitment: "1-2 hours/day",
    description: "Create step-by-step visual calculations and verified solutions for standard high school and board exam level mathematics queries.",
    skills: ["Secondary school level Mathematics", "Step-by-step solving logic"],
    applyLink: "https://brainly.com/work-with-us",
    categories: ["PCM"],
    minClass: "10",
    popularLabel: "PCM Focused"
  },
  {
    name: "Socratic Biology & Chemistry Doubt Solver",
    earnings: "₹100 - ₹180 per solved doubt",
    commitment: "Flexible (1-2 hours/day)",
    description: "Explain biological processes, diagram labelings, and basic chemical equations for primary and secondary level student doubts.",
    skills: ["Biology & Chemistry knowledge", "Readable writing"],
    applyLink: "https://socratic.org/",
    categories: ["PCB"],
    minClass: "11",
    popularLabel: "PCB Focused"
  },
  {
    name: "Academic Research Writer on Internshala",
    earnings: "₹5,000 - ₹10,000 / month (Stipend)",
    commitment: "3 hours/day (Work From Home)",
    description: "Prepare structured reports, blog articles, or summaries about trending educational resources or subject reviews.",
    skills: ["Good English research", "Plagiarism-free summary drafting"],
    applyLink: "https://internshala.com/internships/part-time-work-from-home-content-writing-internships/",
    categories: ["Arts", "Commerce", "General"],
    minClass: "11",
    popularLabel: "Best for Writing Lovers"
  },
  {
    name: "Freelance Image Editor on Fiverr",
    earnings: "₹250 - ₹600 per photo edit task",
    commitment: "No minimum quota",
    description: "Use free transparent BG remove websites to cut out backgrounds for products, and adjust lighting to give high-quality product images for online merchants.",
    skills: ["Basic background eraser tools", "Visual correctness"],
    applyLink: "https://www.fiverr.com/gigs/photo-editing",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "Easy Freelancer Task"
  }
];

export const StudentGigFinderWidget = ({
  userProfile,
  onAskMitra
}: {
  userProfile: UserProfile;
  onAskMitra: (q: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<GigItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"recommended" | "all" | "PCM" | "PCB" | "Commerce" | "Arts" | "saved">("recommended");
  const [savedGigs, setSavedGigs] = useState<GigItem[]>(() => {
    try {
      const cached = localStorage.getItem("mitra_saved_gigs");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [gigsList, setGigsList] = useState<GigItem[]>(() => {
    const arr = [...DEFAULT_GIGS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [isShuffling, setIsShuffling] = useState(false);

  const handleShuffleGigs = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setGigsList((prev) => {
        const arr = [...prev];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      });
      setIsShuffling(false);
    }, 600);
  };

  const handleToggleSaveGig = (gig: GigItem) => {
    setSavedGigs((prev) => {
      const alreadySaved = prev.some((g) => g.name === gig.name);
      let updated;
      if (alreadySaved) {
        updated = prev.filter((g) => g.name !== gig.name);
      } else {
        updated = [...prev, gig];
      }
      localStorage.setItem("mitra_saved_gigs", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gigs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, profile: userProfile })
      });

      if (!response.ok) {
        throw new Error("Gig details search failed. Please try again.");
      }

      const data = await response.json();
      if (data.gigs && Array.isArray(data.gigs)) {
        setSearchResults(data.gigs);
      } else {
        throw new Error("Unexpected answer structure.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Dost, networks mein thodi dikqat hai. Default gigs check kijiye ya firse search koshish kijiye!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setError(null);
    setActiveFilter("recommended");
  };

  const userStream = userProfile.stream || "General";

  const getFilteredGigs = () => {
    if (searchResults) return searchResults;
    if (activeFilter === "saved") return savedGigs;
    if (activeFilter === "all") return gigsList;
    if (activeFilter === "recommended") {
      const matched = gigsList.filter(
        (g) => g.categories.includes(userStream) || g.categories.includes("General")
      );
      return matched.length > 0 ? matched : gigsList;
    }
    return gigsList.filter((g) => g.categories.includes(activeFilter));
  };

  const currentGigs = getFilteredGigs();

  return (
    <div className="flex flex-col gap-6" id="student-gig-finder-panel">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-[#008069] to-[#005c4b] p-6 rounded-[2rem] text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[8px] font-black tracking-widest bg-emerald-400 text-[#005c4b] px-2.5 py-1 rounded-full uppercase">
          💰 Mitra Student Pocket Money Finder
        </span>
        <h2 className="text-lg font-black mt-2 leading-tight">
          Find 100% Free, Zero-Investment Micro Gigs
        </h2>
        <p className="text-[10px] font-medium text-emerald-100 mt-1 leading-snug">
          Bina ek bhi paisa lagaye starting earning secure pockets alongside Class {userProfile.class || "10/12/College"} studies. NO registrations fees, NO frauds!
        </p>

        {/* Live Search Form */}
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="E.g., Canva, Math solving, writing, video edit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-800 text-xs font-semibold pl-10 pr-3 py-2.5 rounded-xl border border-transparent focus:border-emerald-300 outline-none placeholder-gray-400 shadow-3xs"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-0 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Search Gigs"
            )}
          </button>
        </form>
      </div>

      {/* Safety Shield Alert Bar */}
      <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[10px] font-black text-rose-950 uppercase tracking-wider leading-none">
            🛡️ SCAM SHIELD ACTIVATED
          </h4>
          <p className="text-[10px] font-bold text-rose-700 mt-1 leading-tight">
            Legitimate platforms check your skill and portfolios. **Aap se registration fee, computer training tax, security deposit ya OTP maangne wali agencies 100% fake hoti hain.** Kabhi kisi ko job ke liye paise na dein!
          </p>
        </div>
      </div>

      {/* Gigs List section */}
      <div className="flex flex-col gap-4">
        {/* Profile-matching Filters */}
        {!searchResults && (
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
            <button
              type="button"
              onClick={() => setActiveFilter("recommended")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "recommended"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🎯 Match for You ({userStream})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "all"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🌎 All Gigs
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("PCM")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "PCM"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📐 PCM Gigs
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("PCB")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "PCB"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🧬 PCB Gigs
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("Commerce")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "Commerce"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📊 Commerce
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("Arts")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "Arts"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🎨 Arts & Media
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("saved")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 flex items-center gap-1 ${
                activeFilter === "saved"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-50/60 text-amber-800 hover:bg-amber-100"
              }`}
            >
              📌 Saved Gigs ({savedGigs.length})
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
            {searchResults ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Custom Searched Student Gigs
              </>
            ) : activeFilter === "saved" ? (
              <>
                <Bookmark className="w-3.5 h-3.5 text-amber-500" /> Aapke Saved Pocket-Money Gigs
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[#008069]" /> Hand-Picked Student Gigs (100% Free)
              </>
            )}
          </h3>

          <div className="flex items-center gap-2">
            {!searchResults && activeFilter !== "saved" && (
              <button
                type="button"
                onClick={handleShuffleGigs}
                disabled={isShuffling}
                className="text-[9px] font-black text-[#008069] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-150 cursor-pointer active:scale-95 transition-all uppercase tracking-wider flex items-center gap-1"
                title="Refresh jobs feed dynamically"
              >
                <RefreshCw className={`w-3 h-3 ${isShuffling ? "animate-spin" : ""}`} />
                {isShuffling ? "Refreshing..." : "Refresh Gigs"}
              </button>
            )}

            {searchResults && (
              <button
                onClick={handleClearSearch}
                className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-md border-0 cursor-pointer active:scale-95 hover:bg-emerald-100 transition-all uppercase tracking-wider"
              >
                Reset to Default
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-amber-600 font-bold ml-1">
            ⚠️ {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentGigs.map((gig, idx) => (
            <div 
              key={idx}
              className="bg-white border border-gray-100 shadow-xs p-5 rounded-[2rem] flex flex-col justify-between hover:border-emerald-150 hover:shadow-sm transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#008069]/5 rounded-bl-3xl pointer-events-none group-hover:scale-125 transition-transform" />
              
              <div>
                {/* Compatibility Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {gig.categories.includes(userStream) && (
                    <span className="bg-emerald-50 text-[#008069] border border-emerald-150 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ✨ Matching {userStream} Profile
                    </span>
                  )}
                  {gig.popularLabel && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-150 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      🔥 {gig.popularLabel}
                    </span>
                  )}
                  <span className="bg-blue-50 text-blue-700 border border-blue-150 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Class {gig.minClass}+ safe
                  </span>
                </div>

                {/* 💼 Verified Pocket-Money Gig Name */}
                <div className="flex items-start gap-2.5">
                  <span className="text-md shrink-0 mt-0.5">💼</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 tracking-tight leading-tight group-hover:text-[#005c4b] transition-colors">
                      {gig.name}
                    </h4>
                  </div>
                </div>

                {/* Earning and Commitment Info Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-500" /> Expected Earning
                    </span>
                    <span className="text-[10px] font-black text-slate-700 mt-0.5">
                      {gig.earnings}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" /> commitment
                    </span>
                    <span className="text-[10px] font-black text-slate-700 mt-0.5">
                      {gig.commitment}
                    </span>
                  </div>
                </div>

                {/* 🎯 What you have to do */}
                <div className="mt-4 border-t border-gray-100 pt-3.5">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-indigo-500" /> What You Have To Do
                  </span>
                  <p className="text-[11px] font-semibold text-slate-600 leading-normal mt-1">
                    {gig.description}
                  </p>
                </div>

                {/* Skills Needed */}
                <div className="mt-3.5">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-slate-500" /> Skills Needed (Beginner Friendly)
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {gig.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified Apply Button */}
              <div className="mt-4 pt-3.5 border-t border-gray-150 flex flex-col gap-1.5">
                <a
                  href={gig.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#008069] hover:bg-[#005c4b] text-white text-[10px] font-black rounded-xl transition-all shadow-xs shrink-0 select-none border-0 uppercase tracking-wider"
                >
                  Apply 100% Free <ExternalLink className="w-3 h-3 text-white" />
                </a>
                <p className="text-[8px] text-[#008069] font-black text-center uppercase tracking-widest leading-none mt-1 shrink-0">
                  🛡️ 100% Free Safe Application Link
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Safety Guarantee Footer */}
        <div className="mt-4 p-4 border border-dashed border-[#008069]/30 rounded-2xl bg-emerald-50/10 text-center">
          <p className="text-[9px] font-semibold text-slate-500 italic">
            🚨 <strong>Safety Guarantee:</strong> "Form Mitra verifies that this platform does NOT ask for any money. Never pay anyone for a job or verification deposit."
          </p>
          <button
            onClick={() => onAskMitra("Dost, online student micro-jobs or remote part-time gigs choose karte samay fake recruiters ko kaise pehchanein?")}
            className="mt-2 text-[9px] font-extrabold text-[#008069] bg-transparent border-0 underline hover:text-[#005c4b] cursor-pointer"
          >
            Ask Mitra: How to stay fully safe from fake online jobs?
          </button>
        </div>
      </div>
    </div>
  );
};
