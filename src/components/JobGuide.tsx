import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Briefcase, 
  Coins, 
  Search, 
  Check, 
  Clipboard, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  AlertTriangle,
  Building,
  MapPin,
  Calendar,
  Layers,
  Award
} from "lucide-react";
import axios from "axios";

interface JobGuideProps {
  userProfile: any;
  onClose: () => void;
}

const PRESET_JOBS = [
  {
    id: "ssc-mts",
    type: "sarkari",
    title: "SSC Multi-Tasking Staff (MTS)",
    origin: "Government RSS Feed (Sarkari Naukri)",
    badge: "Government",
    rawContent: `<item>
  <title>Staff Selection Commission SSC Multi Tasking Staff MTS and Havaldar CBI CBN Exam 2026</title>
  <link>https://ssc.gov.in</link>
  <description>Staff Selection Commission has released the official notification for the recruitment of Multi Tasking Staff (MTS) Non-Technical and Havaldar in CBI and CBN. Eligible candidates can apply online. Age limit: 18-25 years or 18-27 years depending on post. Educational qualification: Candidates must have passed Matriculation (10th Class) Examination or equivalent from a recognized Board. Key dates: Application opening date is June 12, 2026. Online registration closing date is July 31, 2026. Selection process contains Computer Based Examination (CBE) in multi-languages including Hindi and English. Compensation: Pay Level 1 as per 7th CPC (approx Rs 18,000 - 22,000 basic pay plus allowances).</description>
  <pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate>
</item>`,
    flag: "🏛️"
  },
  {
    id: "adzuna-support",
    type: "private",
    title: "Remote Customer Associate",
    origin: "Adzuna API (Private Gig)",
    badge: "Private",
    rawContent: `{
  "id": "adzuna_p_8492021",
  "title": "Junior Remote Customer Success Associate",
  "company": {
    "display_name": "TechVeda Solutions Private Limited"
  },
  "location": {
    "display_name": "Bangalore, Uttar Pradesh, Work From Home Eligible"
  },
  "salary_min": 180000,
  "salary_max": 240000,
  "description": "We are looking for a tech-savvy Junior Customer Success Associate who can handle user issues, answer live chat messages, and manage customer tickets in English and Hindi. Training will be provided. No prior experience is required, but candidates must have excellent conversational skills and a laptop with stable internet. Candidates must be 12th pass or above.",
  "contract_time": "full_time"
}`,
    flag: "💼"
  },
  {
    id: "bihar-gds",
    type: "sarkari",
    title: "Bihar Post GDS Recruit",
    origin: "Postal RSS Feed (Sarkari Naukri)",
    badge: "Government",
    rawContent: `Bihar Postal Circle Recruitment Board is accepting applications for the post of Gramin Dak Sevaks (GDS) - Branch Postmaster (BPM) and Assistant Branch Postmaster (ABPM). 
Total vacancies: 2300 posts.
Salary: BPM gets Rs. 12,000 to Rs. 29,380. ABPM gets Rs. 10,000 to Rs. 24,470 per month.
Eligibility: Candidates must have passed 10th standard with passing marks in Mathematics, local language (Hindi) and English. Knowledge of cycling is a prerequisite. No experience required. Age range is 18 to 40 years.
Last Date to submit application form online is June 30, 2026. Selection is based purely on merit list compiled from 10th standard board percentage.`,
    flag: "📮"
  },
  {
    id: "zepto-delivery",
    type: "private",
    title: "Delivery Hub Associate",
    origin: "Adzuna Private API (Local Gig)",
    badge: "Private",
    rawContent: `{
  "id": "adzuna_d_9340",
  "title": "Local Delivery Driver & Delivery Hub Associate",
  "company": {
    "display_name": "Zepto Express Logistics"
  },
  "location": {
    "display_name": "Patna Main Hub, Bihar"
  },
  "salary_min": 150000,
  "salary_max": 180000,
  "description": "Serve your local community by helping Sort, packet, scan barcode labels, and deliver quick orders inside Patna areas. Must have an Android mobile phone, two-wheeler driving license, and own physical vehicle.",
  "contract_time": "part_time / contract"
}`,
    flag: "⚡"
  }
];

export const JobGuide: React.FC<JobGuideProps> = ({ userProfile, onClose }) => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputHtml, setOutputHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Audio states
  const [audioState, setAudioState] = useState<"idle" | "playing" | "paused">("idle");

  useEffect(() => {
    // Select the first preset by default
    handleSelectPreset(PRESET_JOBS[0]);
    
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSelectPreset = (preset: typeof PRESET_JOBS[0]) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.rawContent);
    setError(null);
  };

  const handleTransform = async () => {
    if (!inputText.trim()) {
      setError("Arre bhai, pehle raw job details text input box me fill up karein!");
      return;
    }

    setLoading(true);
    setError(null);
    setOutputHtml(null);
    handleStopAudio();

    try {
      const response = await axios.post("/api/job-guide/transform", {
        rawText: inputText
      });

      if (response.data && response.data.text) {
        setOutputHtml(response.data.text);
      } else {
        throw new Error("Invalid output received from career mentor helper.");
      }
    } catch (err: any) {
      console.error("[JobGuide] Error in transform API:", err);
      setError(
        err.response?.data?.error || 
        "Sever busy lag raha hai, dost. Ek baar re-try button dabayein bhai!"
      );
    } finally {
      setLoading(false);
    }
  };

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[#*`_]/g, "") // Remove Markdown
      .replace(/🌍/g, "")
      .replace(/🏛️/g, "")
      .replace(/🚨/g, "")
      .replace(/💼/g, "")
      .replace(/✨/g, "")
      .replace(/🎯/g, "Kaam kya hai")
      .replace(/✅/g, "kaun apply kar sakta hai")
      .replace(/💰/g, "paisa kitna milega")
      .replace(/📍/g, "location")
      .replace(/💡/g, "advice")
      .trim();
  };

  const handlePlayAudio = () => {
    if (!outputHtml) return;

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setError("Aapke computer/mobile me audio read-out supported nahi hai, bhai.");
      return;
    }

    if (audioState === "paused" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setAudioState("playing");
      return;
    }

    // Cancel old speech
    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(outputHtml);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes("hi-IN") || v.lang.includes("en-IN")) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setAudioState("playing");
    };

    utterance.onend = () => {
      setAudioState("idle");
    };

    utterance.onerror = () => {
      setAudioState("idle");
    };

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      {/* Premium Board Layout */}
      <div className="bg-white w-full h-full md:max-w-md md:h-[92vh] md:rounded-[2.5rem] md:shadow-2xl md:border-4 md:border-slate-800 flex flex-col overflow-hidden relative shadow-slate-900/40">
        
        {/* Header */}
        <header className="p-6 md:px-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-100 shrink-0">
              <Briefcase className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight flex items-center gap-1.5 leading-tight">
                Mitra Job Guide
                <span className="text-[9px] font-black bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                  Counselor
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Friendly Job & Career Simplifier for Youth 🎓
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              handleStopAudio();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          
          {/* Left Block (Input Source & Selector Presets) */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Presets List */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-teal-500" />
                Raw Job Feeds (प्राइवेट व सरकारी फीड्स)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_JOBS.map((j) => {
                  const isSelected = selectedPresetId === j.id;
                  return (
                    <button
                      key={j.id}
                      onClick={() => handleSelectPreset(j)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-teal-50/60 border-teal-200 shadow-xs" 
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1 justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{j.flag}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${
                            j.type === "sarkari" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
                          }`}>
                            {j.badge}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-xs text-gray-900 line-clamp-1 truncate leading-tight">
                        {j.title}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold truncate mt-0.5 uppercase tracking-wider">
                        {j.origin}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Text Box */}
            <div className="flex-1 flex flex-col gap-2 min-h-[160px]">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  📝 Raw Adzuna JSON or Government RSS Content
                </label>
                {inputText && (
                  <button
                    onClick={() => {
                      setInputText("");
                      setSelectedPresetId(null);
                    }}
                    className="text-[9px] font-black text-red-500 uppercase tracking-wider hover:underline cursor-pointer"
                  >
                    Clear Feed
                  </button>
                )}
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setSelectedPresetId(null);
                }}
                placeholder="Yahan central / state government ke raw RSS jobs details ya XML / private Adzuna Jobs data JSON format me paste karein..."
                className="w-full flex-1 p-4 bg-slate-50 border border-gray-100 rounded-[1.5rem] text-xs text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all font-medium resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleTransform}
              disabled={loading}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-100 active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bhai Simplification Chal Raha Hai...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Bade Bhai Job Card Banao! ✨
                </>
              )}
            </button>
          </div>

          {/* Right Block (Friendly summary card) */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 p-4 relative overflow-hidden h-full">
            <div className="flex items-center justify-between mb-3 px-2 shrink-0">
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Mitra Career Alert Card
              </span>
              
              {outputHtml && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-[9px] font-black uppercase border border-gray-100 tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
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
            <div className="flex-1 bg-white border border-gray-100 rounded-[1.8rem] p-5 md:p-6 overflow-y-auto shadow-sm min-h-[220px]">
              {error ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">
                    Kuch Gadbad Ho Gayi
                  </h4>
                  <p className="text-xs text-red-500 font-medium max-w-sm mt-1 leading-relaxed">
                    {error}
                  </p>
                  <button
                    onClick={handleTransform}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-800 transition-colors cursor-pointer"
                  >
                    Fir Se Try Karo
                  </button>
                </div>
              ) : outputHtml ? (
                <div className="space-y-4 text-xs text-slate-800 whitespace-pre-wrap font-semibold leading-relaxed font-sans">
                  {/* Clean rendered text */}
                  {outputHtml}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Briefcase className="w-12 h-12 stroke-[1.2] mb-3 text-teal-400/80 animate-bounce" />
                  <h4 className="font-extrabold text-xs text-gray-500 uppercase tracking-widest">
                    No Job Card Generated
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium max-w-xs mt-1 leading-relaxed">
                    Upar diye presets me se select karein ya job ka XML/JSON raw text enter karein. 
                    Bade Bhai use super structured dynamic job card me simple Hinglish me translate kar denge!
                  </p>
                </div>
              )}
            </div>

            {/* Speech Controller Dock */}
            {outputHtml && (
              <div className="mt-4 p-3 bg-teal-50/50 border border-teal-100/70 rounded-2xl flex flex-col gap-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    Bade Bhai Speech Assistant
                  </span>
                  
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${
                    audioState === "playing" 
                      ? "bg-emerald-500 text-white animate-pulse" 
                      : audioState === "paused"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}>
                    {audioState === "playing" ? "Listening" : audioState === "paused" ? "Hold" : "Baand"}
                  </span>
                </div>
                
                {/* Voice Navigation Row */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayAudio}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      audioState === "playing"
                        ? "bg-teal-100 text-teal-700 cursor-default"
                        : "bg-teal-600 hover:bg-teal-700 text-white active:scale-95 shadow-sm"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {audioState === "paused" ? "Resume" : "Play/Suno"}
                  </button>

                  <button
                    onClick={handlePauseAudio}
                    disabled={audioState !== "playing"}
                    className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Hold
                  </button>

                  <button
                    onClick={handleStopAudio}
                    disabled={audioState === "idle"}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    Baand
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
