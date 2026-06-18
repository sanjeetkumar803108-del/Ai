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
  GraduationCap
} from "lucide-react";
import axios from "axios";

interface GlobalGuideProps {
  userProfile: any;
  onClose: () => void;
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
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputHtml, setOutputHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Audio state
  const [audioState, setAudioState] = useState<"idle" | "playing" | "paused">("idle");
  const [synthSpeech, setSynthSpeech] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Select the first preset by default
    handleSelectPreset(PRESET_PROGRAMS[0]);
    
    // Stop any speaking speech synthesis on mount or unmount
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSelectPreset = (preset: typeof PRESET_PROGRAMS[0]) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.rawContent);
    setError(null);
  };

  const handleTransform = async () => {
    if (!inputText.trim()) {
      setError("Arre bhai, pehle raw text toh dalo ya kisi preset ko select karo!");
      return;
    }

    setLoading(true);
    setError(null);
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
      setError(
        err.response?.data?.error || 
        "Sever busy chal raha hai ya network error hai. Ek baar fir se prayas karein, bhai!"
      );
    } finally {
      setLoading(false);
    }
  };

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[#*`_]/g, "") // Remove markdown indicators
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
      setError("Aapke browser me voice playback support nahi hai, bhai.");
      return;
    }

    // If currently paused, resume speaking
    if (audioState === "paused" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setAudioState("playing");
      return;
    }

    // Cancel any previous speaking to avoid overlaps
    window.speechSynthesis.cancel();

    const textToSpeak = cleanTextForSpeech(outputHtml);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Configure speech settings
    const voices = window.speechSynthesis.getVoices();
    // Prefer Indian English / Hindi voice
    const preferredVoice = voices.find(v => v.lang.includes("hi-IN") || v.lang.includes("en-IN")) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 0.95; // Slightly slower for clear Hinglish understanding
    utterance.pitch = 1.05; // Friendly pitch

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      {/* Container */}
      <div className="bg-white w-full h-full md:max-w-md md:h-[92vh] md:rounded-[2.5rem] md:shadow-2xl md:border-4 md:border-slate-800 flex flex-col overflow-hidden relative shadow-slate-900/40">
        {/* Header */}
        <header className="p-6 md:px-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight flex items-center gap-1.5 leading-tight">
                Mitra Global Guide
                <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                  Scholarships
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                International Career & Educational Mentor ✈️
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              handleStopAudio();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          
          {/* Left Column (Input & Presets) */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Presets Grid */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">
                📖 Quick Global Presets (क्विक ग्लोबल ऑफर्स)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_PROGRAMS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected 
                          ? "bg-blue-50/70 border-blue-200 shadow-xs" 
                          : "bg-white border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{p.flag}</span>
                        <span className="text-[9px] font-black uppercase tracking-tight text-blue-800">
                          {p.country}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-gray-900 line-clamp-1 truncate leading-tight">
                        {p.title}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-medium truncate mt-0.5">
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
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  📝 Raw Scholarship Description / RSS Feed Content
                </label>
                {inputText && (
                  <button
                    onClick={() => {
                      setInputText("");
                      setSelectedPresetId(null);
                    }}
                    className="text-[9px] font-black text-red-500 uppercase tracking-wider hover:underline"
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
                className="w-full flex-1 p-4 bg-slate-50 border border-gray-100 rounded-[1.5rem] text-xs text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-medium resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleTransform}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              {loading ? (
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
          </div>

          {/* Right Column (Mitra Global Alert Result) */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 p-4 relative overflow-hidden h-full">
            <div className="flex items-center justify-between mb-3 px-2 shrink-0">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                <ScrollText className="w-3.5 h-3.5" />
                Mitra Global Premium Card
              </span>
              
              {outputHtml && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-[9px] font-black uppercase border border-gray-100 tracking-wider flex items-center gap-1 transition-all"
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
                    Request Fail Ho Gaya
                  </h4>
                  <p className="text-xs text-red-500 font-medium max-w-sm mt-1 leading-relaxed">
                    {error}
                  </p>
                  <button
                    onClick={handleTransform}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-800 transition-colors"
                  >
                    Retry Transforming
                  </button>
                </div>
              ) : outputHtml ? (
                <div className="space-y-4 text-xs text-slate-800 whitespace-pre-wrap font-semibold leading-relaxed font-sans">
                  {/* Styled block rendering for standard template */}
                  {outputHtml}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <GraduationCap className="w-12 h-12 stroke-[1.2] mb-3 text-indigo-400/80 animate-bounce" />
                  <h4 className="font-extrabold text-xs text-gray-500 uppercase tracking-widest">
                    No Alert Summary Generated
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium max-w-xs mt-1 leading-relaxed">
                    Preset select karke button par click karein ya apna custom raw text dalein. 
                    Bade Bhai isse energetic Hinglish alert card me convert kar denge!
                  </p>
                </div>
              )}
            </div>

            {/* Speech Controller Dock */}
            {outputHtml && (
              <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100/70 rounded-2xl flex flex-col gap-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    Bade Bhai Voice Coach
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
                
                {/* Voice Navigation Button row */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayAudio}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      audioState === "playing"
                        ? "bg-indigo-100 text-indigo-700 cursor-default"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-sm"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {audioState === "paused" ? "Resume" : "Play/Suno"}
                  </button>

                  <button
                    onClick={handlePauseAudio}
                    disabled={audioState !== "playing"}
                    className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:pointer-events-none"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Hold
                  </button>

                  <button
                    onClick={handleStopAudio}
                    disabled={audioState === "idle"}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:pointer-events-none"
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
