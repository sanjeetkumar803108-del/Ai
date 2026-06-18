import React, { useState } from "react";
import { 
  FileText, 
  Sparkles, 
  ChevronRight, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  GraduationCap, 
  BookOpen, 
  Heart, 
  Loader2,
  Paperclip
} from "lucide-react";
import { UserProfile } from "../types";

interface SOPEngineProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export const SOPEngine: React.FC<SOPEngineProps> = ({ userProfile, onClose }) => {
  const [stream, setStream] = useState(userProfile.stream || "PCB (Science)");
  const [targetGoal, setTargetGoal] = useState("");
  const [rawBackground, setRawBackground] = useState("");
  const [struggles, setStruggles] = useState("");
  const [wordLimit, setWordLimit] = useState(500);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedSOP, setGeneratedSOP] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGoal.trim() || !rawBackground.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/sop/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawBackground,
          stream,
          targetGoal,
          struggles,
          wordLimit,
          profile: userProfile
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate SOP");
      }

      const data = await response.json();
      setGeneratedSOP(data.text);
    } catch (err) {
      console.error(err);
      alert("SOP generate karne mein thodi problem aayi. Kripya firse koshish karein.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSOP) return;
    navigator.clipboard.writeText(generatedSOP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedSOP(null);
    setTargetGoal("");
    setRawBackground("");
    setStruggles("");
  };

  return (
    <div id="multi-page-pdf-scanner-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full h-full md:max-w-md md:h-[92vh] md:rounded-[2.5rem] md:shadow-2xl md:border-4 md:border-slate-800 flex flex-col overflow-hidden relative shadow-slate-900/40">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center scale-95">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Mitra SOP Engine
                <span className="text-[9px] bg-amber-400 text-amber-950 font-black py-0.5 px-2 rounded-full uppercase tracking-wider">
                  Pro
                </span>
              </h2>
              <p className="text-xs text-orange-50 font-medium">
                Personalized, emotional hooks & elite plagiarism-free letters
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 flex flex-col">
          {!generatedSOP ? (
            <form onSubmit={handleGenerate} className="space-y-5 max-w-lg mx-auto w-full py-2">
              <div className="text-center space-y-2 pb-2">
                <div className="w-14 h-14 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mx-auto">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-gray-950 tracking-tight">
                  Draft an Elite SOP / Essay
                </h3>
                <p className="text-xs text-gray-500">
                  Fill the following core background facts, struggles, and target, and Mitra will craft an award-winning personalized Statement of Purpose.
                </p>
              </div>

              {/* Targets and Academic Streams */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Academic Stream
                  </label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full bg-white border border-gray-150 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-orange-500 text-gray-800"
                  >
                    <option value="PCB (Science / Medical)">PCB (Science / Medical)</option>
                    <option value="PCM (Engineering / Tech)">PCM (Engineering / Tech)</option>
                    <option value="Commerce & Finance">Commerce & Finance</option>
                    <option value="Arts & Humanities">Arts & Humanities</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Word Limit Limit
                  </label>
                  <select
                    value={wordLimit}
                    onChange={(e) => setWordLimit(Number(e.target.value))}
                    className="w-full bg-white border border-gray-150 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-orange-500 text-gray-800"
                  >
                    <option value={300}>300 Words</option>
                    <option value={500}>500 Words</option>
                    <option value={800}>800 Words</option>
                    <option value={1000}>1000 Words</option>
                  </select>
                </div>
              </div>

              {/* Target Goal */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Target Goal (College, Course or Scholarship)
                </label>
                <input
                  type="text"
                  required
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  placeholder="e.g. GKS Scholarship (Seoul Nat Univ), NEET counseling (AIIMS, New Delhi)"
                  className="w-full bg-white border border-gray-150 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-orange-500 text-gray-800"
                />
              </div>

              {/* Raw Background Bullet Points */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  Your Background Facts & Qualifications (Bullet Points)
                </label>
                <textarea
                  required
                  rows={4}
                  value={rawBackground}
                  onChange={(e) => setRawBackground(e.target.value)}
                  placeholder="e.g. Class 12 PCB student in Bihar, scored 92%, won school Biology quiz, completed standard first aid workshop, wants to pursue MBBS."
                  className="w-full bg-white border border-gray-150 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-gray-800 leading-relaxed placeholder-gray-300"
                />
              </div>

              {/* Personal Struggles */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-gray-400" />
                  Life Story, Financial Struggles or Obstacles Overcome
                </label>
                <textarea
                  rows={3}
                  value={struggles}
                  onChange={(e) => setStruggles(e.target.value)}
                  placeholder="e.g. Grew up in a farming household with limited power supply, local healthcare was 30km away, guided my family through Covid with home care."
                  className="w-full bg-white border border-gray-150 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-gray-800 leading-relaxed placeholder-gray-300"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all py-4 px-6 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Admissions Engine Drafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Statement of Purpose
                  </>
                )}
              </button>
            </form>
          ) : (
            // Generated Output View
            <div className="flex-1 flex flex-col gap-5 min-h-0">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-orange-50/80 p-3.5 rounded-2xl border border-orange-100 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-950 flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Your Elite SOP draft is ready
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[10px] font-black uppercase text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-50 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[10px] font-black uppercase text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>

              {/* SOP Draft Document View */}
              <div className="flex-1 overflow-y-auto bg-white border border-gray-100 rounded-3xl p-6 shadow-xs leading-relaxed text-xs">
                {/* Visual Letter Design */}
                <div className="font-serif text-gray-900 whitespace-pre-wrap selection:bg-orange-100 pr-2">
                  {generatedSOP}
                </div>
              </div>

              {/* Extra visual indicators if needed */}
              <footer className="shrink-0 p-4 bg-orange-50/25 border border-orange-100/40 rounded-2xl flex items-center gap-3">
                <Paperclip className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-[10px] text-orange-855 font-medium leading-normal">
                  <span className="font-bold">Advice:</span> Attached certificates must exactly match the facts written in this essay. Submit through PDF format to ensure perfect text preservation and visual cleanliness.
                </p>
              </footer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
