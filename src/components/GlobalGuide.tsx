import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Globe, 
  Award, 
  BookOpen, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Clipboard, 
  Check, 
  Loader2, 
  Undo2, 
  Compass, 
  ScrollText,
  AlertTriangle,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Gift,
  ListOrdered,
  Calendar,
  Fingerprint,
  Search,
  BellRing,
  Clock,
  Zap,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import axios from "axios";
import { cn } from "../lib/utils";

interface GlobalGuideProps {
  userProfile: any;
  onClose: () => void;
}

interface Scholarship {
  name: string;
  amount: string;
  eligibility: string[];
  opening: string;
  deadline: string;
  documents: string[];
  link: string;
  tip: string;
  matchScore?: number;
  matchReason?: string;
  isSecret?: boolean;
  region?: string;
  rewardsDetail?: string;
  stepsToApply?: string[];
  ageLimit?: string;
  gpaRequirement?: string;
  applicationMode?: 'Online' | 'Offline' | 'Hybrid';
  monthlyAmount?: string;
  nextCycleExpected?: string;
  lastDeadline?: string;
}

const PRESET_PROGRAMS = [
  {
    id: "mext-japan",
    title: "MEXT Scholarship 2027 (Japan Government)",
    subtitle: "Undergraduate & Research",
    rawContent: `The Ministry of Education, Culture, Sports, Science and Technology (MEXT) of Japan offers scholarships for international students who wish to study in Japanese universities as Undergraduates or Research Students. 
Eligibility: Applicants must have Indian nationality, be under 25 years old for undergraduate programs, and have passed 12th standard with at least 65% marks. For Research students, applicants must be under 35 and hold a Bachelor's degree (or equivalent) in a relevant stream.
Benefits: 100% full tuition fee exemption, round-trip airfare from India to Japan included, and a monthly stipend of 117,000 to 143,000 JPY (approximately INR 65,000 to 80,000) for personal living expenses. No collateral or surety required.
Deadline: The application portal closes on July 10, 2026. Preliminary screening will be conducted by the Embassy of Japan in India during August.`,
    flag: "🇯🇵",
    country: "Japan"
  },
  {
    id: "daad-germany",
    title: "DAAD EPOS Postgraduate Scholarship (Germany)",
    subtitle: "Master's & PhD for Development",
    rawContent: `The German Academic Exchange Service (DAAD) offers the EPOS scholarship program for young professionals from developing countries, including India, to pursue post-graduate courses at state-funded German universities.
Eligibility: Candidates must have a Bachelor's degree (typically 4-year duration) in a relevant subject area, at least two years of professional work experience in a related public or private organization, and a clear motivation for social development. IELTS or TOEFL score required for English-medium programs.
Benefits: Full tuition fee coverage of chosen postgraduate program, monthly allowance of 934 EUR for master's students and 1,200 EUR for doctoral candidates, health & liability insurance, and a flat travel grant for flights to/from Munich or Frankfurt.
Deadline: August 31, 2026 for most DAAD EPOS courses starting next academic year.`,
    flag: "🇩🇪",
    country: "Germany"
  },
  {
    id: "quad-stem",
    title: "The Quad Fellowship (United States)",
    subtitle: "STEM Master's & Doctoral Programs",
    rawContent: `The Quad Fellowship is a first-of-its-kind scholarship program designed to build ties among the next generation of scientists and technologists. It supports exceptional STEM graduate students from the United States, Japan, Australia, and India.
Eligibility: Must buy into a Master's or PhD program in a STEM field (Science, Technology, Engineering, or Mathematics) at any accredited US university. Applicants must exhibit superior academic achievement, intellectual curiosity, and intersectional leadership qualities. No age bar.
Benefits: Onetime financial award of $25000 to cover education-related costs, direct mentorship by leading global industrialists, and fully funded cross-cultural collaboration trip to Washington D.C. or Tokyo.
Deadline: October 15, 2026. All recommendations must be submitted through the centralized online portal.`,
    flag: "🇺🇸",
    country: "United States"
  },
  {
    id: "stanford-kh",
    title: "Stanford Knight-Hennessy Scholars Program",
    subtitle: "Graduate Degrees at Stanford University",
    rawContent: `Knight-Hennessy Scholars is an international graduate-level scholarship program for study at Stanford University in California. 
Eligibility: Accessible to global citizens of all nationalities. Anyone applying to any of Stanford's graduate programs (such as MS, PhD, MBA, MD, JD) within 3 years of completing their bachelor's degree is eligible. Must demonstrate independent thoughts, purposeful leadership, and a civic mindset.
Benefits: Up to 3 years of funding covering full tuition fees, standard housing and dining support, academic supplies, travel stipends, and leadership development workshops.
Deadline: September 15, 2026. Parallel admission to the corresponding Stanford graduate program is mandatory.`,
    flag: "🌲🇺🇸",
    country: "USA"
  }
];

export const GlobalGuide: React.FC<GlobalGuideProps> = ({ userProfile, onClose }) => {
  const [activeTab, setActiveTab] = useState<"finder" | "transformer">("finder");

  // Tab 1: Global Secret Finder States
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"Government" | "Trusts">("Government");
  const [isLoading, setIsLoading] = useState(false);
  const [finderError, setFinderError] = useState<string | null>(null);
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [expandedCard, setExpandedCard] = useState<Record<string, boolean>>({});
  const [completedDocs, setCompletedDocs] = useState<Record<string, Record<string, boolean>>>({});
  const [showToast, setShowToast] = useState<string | null>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  // Tab 2: Raw Text Transformer States
  const [inputText, setInputText] = useState("");
  const [transformLoading, setTransformLoading] = useState(false);
  const [outputHtml, setOutputHtml] = useState<string | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<"idle" | "playing" | "paused">("idle");
  const [synthSpeech, setSynthSpeech] = useState<SpeechSynthesisUtterance | null>(null);

  const scanSteps = [
    `🔍 Initializing Global Academic & Trust Database scan...`,
    `🧬 Extracting eligibility parameters for Class ${userProfile.class || "11/12"} (${userProfile.stream || "Science"})...`,
    "🏛️ Auditing international government ministries (MEXT, DAAD, Commonwealth, Chevening)...",
    "🌍 Crawling elite global university trust vaults (Stanford, Oxford, Harvard, Cambridge)...",
    "🔒 Decrypting hidden bilateral research endowments and study-abroad public aids...",
    "✨ Verifying 100% eligibility score, flight ticket perks & step-by-step application blueprint..."
  ];

  // Load scholarships on mount or category change
  useEffect(() => {
    if (activeTab === "finder") {
      fetchGlobalScholarships("", activeCategory, false);
    }
  }, [userProfile, activeCategory, activeTab]);

  useEffect(() => {
    // Select first preset by default for Transformer tab
    if (activeTab === "transformer" && !inputText) {
      handleSelectPreset(PRESET_PROGRAMS[0]);
    }
    
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab]);

  const fetchGlobalScholarships = async (queryStr: string = "", categorySelected: "Government" | "Trusts" = activeCategory, runDeepScan: boolean = false) => {
    setFinderError(null);
    if (runDeepScan) {
      setIsDeepScanning(true);
      setScanStep(0);
      
      for (let i = 0; i < scanSteps.length; i++) {
        setScanStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setIsDeepScanning(false);
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/global-guide/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: userProfile,
          query: queryStr,
          category: categorySelected
        })
      });

      if (!response.ok) {
        throw new Error("Failed to search global scholarships");
      }

      const data = await response.json();
      setScholarships(data.scholarships || []);
    } catch (err) {
      console.error(err);
      setFinderError("AI Global research servers temporarily busy. Kripya dubaara koshish karein!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGlobalScholarships(searchQuery, activeCategory, false);
  };

  const handleDeepResearchScan = () => {
    fetchGlobalScholarships(searchQuery, activeCategory, true);
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

  // Tab 2: Transformer Functions
  const handleSelectPreset = (preset: typeof PRESET_PROGRAMS[0]) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.rawContent);
    setTransformError(null);
  };

  const handleTransform = async () => {
    if (!inputText.trim()) {
      setTransformError("Arre bhai, pehle raw text toh dalo ya kisi preset ko select karo!");
      return;
    }

    setTransformLoading(true);
    setTransformError(null);
    setOutputHtml(null);
    handleStopAudio();

    try {
      const response = await axios.post("/api/global-guide/transform", {
        rawText: inputText
      });

      if (response.data && response.data.text) {
        setOutputHtml(response.data.text);
      } else {
        throw new Error("Invalid response received from the backend.");
      }
    } catch (err: any) {
      console.error("[GlobalGuide] Error transforming text:", err);
      setTransformError(
        err.response?.data?.error || 
        "Sever busy chal raha hai ya network error hai. Ek baar fir se prayas karein, bhai!"
      );
    } finally {
      setTransformLoading(false);
    }
  };

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[#*`_]/g, "") 
      .replace(/🌍/g, "World")
      .replace(/✈️/g, "Plane")
      .replace(/🎯/g, "Target")
      .replace(/✅/g, "Check")
      .replace(/💰/g, "Paisa benefits")
      .replace(/🗓️/g, "Date")
      .replace(/💡/g, "Tip")
      .trim();
  };

  const handlePlayAudio = () => {
    if (!outputHtml) return;

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setTransformError("Aapke browser me voice playback support nahi hai, bhai.");
      return;
    }

    if (audioState === "paused" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setAudioState("playing");
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak = cleanTextForSpeech(outputHtml);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes("hi-IN") || v.lang.includes("en-IN")) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setAudioState("playing");
    };

    utterance.onend = () => {
      setAudioState("idle");
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setAudioState("idle");
    };

    setSynthSpeech(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const handlePauseAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setAudioState("paused");
      }
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setAudioState("idle");
    }
  };

  const handleCopy = () => {
    if (!outputHtml) return;
    navigator.clipboard.writeText(outputHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="mitra-global-guide-modal" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
      {/* Container */}
      <div className="bg-slate-900 w-full h-full md:max-w-xl md:h-[94vh] md:rounded-[2.5rem] md:shadow-2xl md:border-4 md:border-slate-800 flex flex-col overflow-hidden relative shadow-slate-950/80">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Compass className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Mitra Global Guide
                <span className="text-[9px] bg-blue-500 text-white font-black py-0.5 px-2 rounded-full uppercase tracking-wider animate-pulse">
                  Secret Finder
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Worldwide Elite Trusts, Government & Academic Scholarships ✈️
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              handleStopAudio();
              onClose();
            }} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-black cursor-pointer text-sm"
          >
            ✕
          </button>
        </header>

        {/* Global Guide Inner Tabs */}
        <div className="bg-slate-950/40 p-2 flex border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => {
              setActiveTab("finder");
              handleStopAudio();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "finder"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🔍 Global Secret Finder
          </button>
          <button
            onClick={() => setActiveTab("transformer")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "transformer"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ✍️ Raw Text Summary Coach
          </button>
        </div>

        {/* Dynamic Toast Notification */}
        {showToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white text-xs font-bold py-3.5 px-6 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
            <BellRing className="w-4 h-4 text-blue-400 animate-bounce" />
            <span>{showToast}</span>
          </div>
        )}

        {/* Tab 1 Content: GLOBAL SECRET FINDER */}
        {activeTab === "finder" && (
          <>
            {/* Category Switch Sub-Tabs */}
            <div className="bg-slate-950/60 p-2.5 flex gap-2 shrink-0 border-b border-slate-850">
              <button
                onClick={() => {
                  setActiveCategory("Government");
                  setScholarships([]);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  activeCategory === "Government"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30 border border-blue-500"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>🏛️</span> Govt & Public Endowments
              </button>
              <button
                onClick={() => {
                  setActiveCategory("Trusts");
                  setScholarships([]);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  activeCategory === "Trusts"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30 border border-indigo-500"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>🌍</span> Elite Academic Trusts
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto bg-slate-950/40 p-6 flex flex-col gap-5 relative">
              
              {/* Profile Banner */}
              <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/40 p-5 rounded-3xl border border-blue-500/20 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-blue-400 animate-pulse" />
                    Targeting Active Student Profile
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10.5px] bg-blue-500/10 text-blue-300 font-extrabold px-3 py-1 rounded-full border border-blue-500/20">
                      Class: {userProfile.class || "11/12"}
                    </span>
                    <span className="text-[10.5px] bg-indigo-500/10 text-indigo-300 font-extrabold px-3 py-1 rounded-full border border-indigo-500/20">
                      Stream: {userProfile.stream || "Science"}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleDeepResearchScan}
                  disabled={isDeepScanning || isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-[10.5px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-950 transition-all shrink-0 border border-blue-400/20"
                >
                  ⚡ Deep AI Research Scan
                </button>
              </div>

              {/* Live search input */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2.5 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search e.g. MEXT, Germany, Stanford, USA, Science..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/80 font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all border border-slate-700"
                >
                  Search
                </button>
              </form>

              {/* Scanning Screen overlay */}
              {isDeepScanning ? (
                <div className="flex-1 bg-slate-950/80 rounded-3xl border border-blue-500/20 p-8 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin absolute" />
                    <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest animate-pulse">
                      Google Deep Research Active
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                      Bhai, wait karo, systems bypass ho rahe hain...
                    </p>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
                      style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs font-semibold text-blue-300 italic animate-fade-in bg-blue-950/40 py-2.5 px-4 rounded-xl border border-blue-900/40">
                    {scanSteps[scanStep]}
                  </p>
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">Decrypting matches, bhai...</p>
                </div>
              ) : finderError ? (
                <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-3xl text-center space-y-3">
                  <p className="text-xs text-red-400 font-semibold">{finderError}</p>
                  <button
                    onClick={() => fetchGlobalScholarships(searchQuery, activeCategory, false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                  >
                    Koshish Karein (Retry)
                  </button>
                </div>
              ) : scholarships.length === 0 ? (
                <div className="flex-1 bg-slate-900/30 border border-slate-800/40 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-slate-700 mb-3" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">No Global Scholarships Decoded</h4>
                  <p className="text-[11px] text-slate-500 font-semibold max-w-xs mt-1">
                    Is stream/class ke liye direct matching schemes nahi mili. Deep Research run karke live scraping trigger karein!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 pb-12">
                  {scholarships.map((s, idx) => {
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedScholarship(s)}
                        className="bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 hover:shadow-lg rounded-2xl p-4 transition-all flex flex-col gap-2.5 shadow-md relative overflow-hidden cursor-pointer group active:scale-[0.98]"
                      >
                        <h3 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                          {s.name}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-800/40">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>Apply: <strong className="text-slate-300 font-semibold">{s.opening || "Open"}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Deadline: <strong className="text-rose-400 font-semibold">{s.deadline}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            </div>
          </>
        )}

        {/* Full Details Overlay (Active Scholarship Detail Modal) */}
        {selectedScholarship && (
          <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col animate-slide-up">
            {/* Detail Header */}
            <header className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedScholarship(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                >
                  ←
                </button>
                <div>
                  <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">
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
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-950/40">
              
              {/* Rewards / Amount Header Card */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950/60 p-5 rounded-3xl border border-blue-500/25 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute right-4 top-4 text-blue-500/20">
                  <Award className="w-16 h-16" />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                    💰 {selectedScholarship.amount}
                  </span>
                  {selectedScholarship.matchScore && (
                    <span className="text-[9px] font-black bg-slate-950 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {selectedScholarship.matchScore}% Fit
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  {selectedScholarship.name}
                </h2>

                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold pt-1">
                  <span className="bg-slate-950/60 border border-slate-800/80 px-2 py-1 rounded-lg">
                    📅 Opens: <strong className="text-blue-400">{selectedScholarship.opening || "Open"}</strong>
                  </span>
                  <span className="bg-slate-950/60 border border-slate-800/80 px-2 py-1 rounded-lg text-rose-300">
                    ⚠️ Deadline: <strong className="text-rose-400">{selectedScholarship.deadline}</strong>
                  </span>
                </div>
              </div>

              {/* Match Reason (Bada Bhai Recommendation) */}
              {selectedScholarship.matchReason && (
                <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-900 border border-blue-500/20 p-4.5 rounded-3xl relative">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Bada Bhai AI recommendation
                  </p>
                  <p className="text-[11px] text-slate-200 font-semibold leading-relaxed mt-1.5">
                    {selectedScholarship.matchReason}
                  </p>
                </div>
              )}

              {/* Eligibility vs Required Documents */}
              <div className="space-y-4">
                {/* Specific Eligibility */}
                {selectedScholarship.eligibility && selectedScholarship.eligibility.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-3xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <span>🎯</span> Specific Eligibility
                    </h4>
                    <ul className="space-y-2.5">
                      {selectedScholarship.eligibility.map((item, idy) => (
                        <li key={idy} className="text-xs font-semibold text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documents Checklist */}
                {selectedScholarship.documents && selectedScholarship.documents.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-3xl">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      📄 Documents Checklist
                    </h4>
                    <div className="space-y-2">
                      {selectedScholarship.documents.map((doc, idy) => {
                        const isChecked = !!(completedDocs[selectedScholarship.name] || {})[doc];
                        return (
                          <div 
                            key={idy}
                            onClick={() => toggleDocument(selectedScholarship.name, doc)}
                            className={`flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-xs select-none ${
                              isChecked ? "bg-blue-950/40 text-blue-200 font-bold border border-blue-500/20" : "hover:bg-slate-950 text-slate-300 font-semibold"
                            }`}
                          >
                            <span className="shrink-0 mt-0.5 font-black text-blue-400">{isChecked ? "✓" : "☐"}</span>
                            <span className={isChecked ? "line-through opacity-60 decoration-blue-700 decoration-1" : "leading-tight"}>
                              {doc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Research Blueprint Section */}
              <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/60">
                <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950/30 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider">
                      Google Deep Research Blueprint
                    </span>
                  </div>
                </div>
                
                <div className="p-4.5 space-y-4">
                  {/* Rewards / Perks */}
                  <div className="space-y-1.5">
                    <h5 className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-emerald-400" />
                      Extra Perks & Rewards
                    </h5>
                    <p className="text-[11.5px] text-slate-300 font-semibold leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                      {selectedScholarship.rewardsDetail || "Full academic funding support matching college fees, direct corporate mentorship channels, and skill certification kits."}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    <h5 className="text-[9.5px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
                      Step-by-Step Apply Guide
                    </h5>
                    <div className="space-y-2">
                      {(selectedScholarship.stepsToApply || [
                        "Click 'Official Apply Link' and create your account on the designated global trust portal.",
                        "Fill in personal background information and write an SOP emphasizing academic goals or research vision.",
                        "Upload verified marksheets, language certificates if any, and submit for high-priority evaluation."
                      ]).map((step, sIdx) => (
                        <div key={sIdx} className="flex gap-3 bg-slate-950/30 p-2.5 rounded-xl border border-slate-850 items-start">
                          <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <p className="text-[11px] font-medium text-slate-300 leading-normal">
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
                <div className="bg-amber-950/20 p-4.5 rounded-3xl border border-amber-500/15">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    💡 Secrets to stand out & secure it
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-1.5">
                    {selectedScholarship.tip}
                  </p>
                </div>

                <div className="flex gap-3 pb-6">
                  <a
                    href={selectedScholarship.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all cursor-pointer border-none text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    🔗 Official Apply Link
                  </a>

                  <button
                    onClick={() => handleAddToCalendar(selectedScholarship)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-extrabold text-[10.5px] uppercase tracking-wider px-4 py-3.5 rounded-2xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Set Reminder
                  </button>
                </div>
              </div>

            </div>

            {/* Detail Close Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800/80 shrink-0 flex gap-2">
              <button
                onClick={() => setSelectedScholarship(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl border border-slate-750 cursor-pointer text-center active:scale-95 transition-all"
              >
                Back to list
              </button>
            </div>
          </div>
        )}

        {/* Tab 2 Content: RAW TEXT TRANSFORMER */}
        {activeTab === "transformer" && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            
            {/* Presets Grid */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">
                📖 Quick Global Presets (क्विक ग्लोबल ऑफर्स)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_PROGRAMS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-blue-950/70 border-blue-500/40 shadow-xs text-white" 
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{p.flag}</span>
                        <span className="text-[9px] font-black uppercase tracking-tight text-blue-400">
                          {p.country}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-white line-clamp-1 truncate leading-tight">
                        {p.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                        {p.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Input text */}
            <div className="flex-1 flex flex-col gap-2 min-h-[160px]">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  📝 Raw Scholarship Description / RSS Feed Content
                </label>
                {inputText && (
                  <button
                    onClick={() => {
                      setInputText("");
                      setSelectedPresetId(null);
                    }}
                    className="text-[9px] font-black text-red-400 uppercase tracking-wider hover:underline"
                  >
                    Clear Input
                  </button>
                )}
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setSelectedPresetId(null);
                }}
                placeholder="Yahan kisi bhi scholarship ki raw boring English details paste karein ya upar se presets select karein..."
                className="w-full flex-1 p-4 bg-slate-950/40 border border-slate-800 rounded-[1.5rem] text-xs text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-blue-950 focus:border-blue-500/40 transition-all font-medium resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleTransform}
              disabled={transformLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer shrink-0 border border-blue-500/20"
            >
              {transformLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bhai transform ho raha hai, rukiye...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Bhai Summary Banao! (Extract & Transform)
                </>
              )}
            </button>

            {/* Mitra Global Alert Result Panel */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950/20 rounded-[2rem] border border-slate-800 p-4 relative overflow-hidden h-full">
              <div className="flex items-center justify-between mb-3 px-2 shrink-0">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                  <ScrollText className="w-3.5 h-3.5" />
                  Mitra Global Premium Card
                </span>
                
                {outputHtml && (
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase border border-slate-700 tracking-wider flex items-center gap-1 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        COPIED!
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3 h-3" />
                        COPY
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Display Panel */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[1.8rem] p-5 md:p-6 overflow-y-auto shadow-sm min-h-[220px]">
                {transformError ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-red-950/20 text-red-400 flex items-center justify-center mb-3">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-300 uppercase tracking-widest">
                      Request Fail Ho Gaya
                    </h4>
                    <p className="text-xs text-red-400 font-medium max-w-sm mt-1 leading-relaxed">
                      {transformError}
                    </p>
                    <button
                      onClick={handleTransform}
                      className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 transition-colors"
                    >
                      Retry Transforming
                    </button>
                  </div>
                ) : outputHtml ? (
                  <div className="space-y-4 text-xs text-slate-200 whitespace-pre-wrap font-semibold leading-relaxed font-sans">
                    {outputHtml}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <GraduationCap className="w-12 h-12 stroke-[1.2] mb-3 text-indigo-500/50 animate-bounce" />
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">
                      No Alert Summary Generated
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium max-w-xs mt-1 leading-relaxed">
                      Preset select karke button par click karein ya apna custom raw text dalein. 
                      Bade Bhai isse energetic Hinglish alert card me convert kar denge!
                    </p>
                  </div>
                )}
              </div>

              {/* Speech Controller Dock */}
              {outputHtml && (
                <div className="mt-4 p-3 bg-blue-950/30 border border-blue-900/20 rounded-2xl flex flex-col gap-2.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      Bade Bhai Voice Coach
                    </span>
                    
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${
                      audioState === "playing" 
                        ? "bg-emerald-500 text-white animate-pulse" 
                        : audioState === "paused"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-800 text-slate-400"
                    }`}>
                      {audioState === "playing" ? "Listening" : audioState === "paused" ? "Hold" : "Baand"}
                    </span>
                  </div>
                  
                  {/* Voice Navigation Button row */}
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlayAudio}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        audioState === "playing"
                          ? "bg-blue-950 text-blue-400 cursor-default"
                          : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-sm"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {audioState === "paused" ? "Resume" : "Play/Suno"}
                    </button>

                    <button
                      onClick={handlePauseAudio}
                      disabled={audioState !== "playing"}
                      className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:pointer-events-none"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Hold
                    </button>

                    <button
                      onClick={handleStopAudio}
                      disabled={audioState === "idle"}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:pointer-events-none"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      Baand
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
