import React, { useState, useRef, useEffect } from "react";
import { 
  Briefcase, 
  ChevronRight, 
  Send, 
  RotateCcw, 
  Sparkles, 
  GraduationCap, 
  HelpCircle, 
  BookOpen, 
  Award, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { UserProfile } from "../types";

interface Message {
  role: "user" | "model";
  text: string;
  score?: number;
  good?: string;
  improve?: string;
  parsedQuestion?: string;
}

interface InterviewCoachProps {
  userProfile: UserProfile;
  onClose: () => void;
}

const PRESETS = [
  { id: "mext", label: "MEXT Scholarship Interview", icon: GraduationCap },
  { id: "job", label: "Job Interview Practice", icon: Briefcase },
  { id: "viva", label: "Class 11/12 PCB Board Viva", icon: BookOpen },
  { id: "neet", label: "NEET Counseling / Medical College viva", icon: Award },
];

export const InterviewCoach: React.FC<InterviewCoachProps> = ({ userProfile, onClose }) => {
  const [preparingFor, setPreparingFor] = useState<string>("");
  const [customTarget, setCustomTarget] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever history changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleStart = async (target: string) => {
    const finalTarget = target || customTarget || "General Interview";
    setPreparingFor(finalTarget);
    setIsStarted(true);
    setIsLoading(true);

    try {
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: [],
          userInput: "",
          preparingFor: finalTarget,
          profile: userProfile,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to start speech");
      }

      const data = await response.json();
      setChatHistory([
        { role: "model", text: data.text }
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory([
        { role: "model", text: "Bhai, AI server connectivity mein thodi problem aa rahi hai. Kripya naye sir se shuru karein ya check karein." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMsg = userInput.trim();
    setUserInput("");
    setIsLoading(true);

    // Append user message to history
    const updatedHistory = [...chatHistory, { role: "user" as const, text: userMsg }];
    setChatHistory(updatedHistory);

    try {
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: updatedHistory.map(m => ({ role: m.role, text: m.text })),
          userInput: "",
          preparingFor,
          profile: userProfile,
        })
      });

      if (!response.ok) {
        throw new Error("Message send failed");
      }

      const data = await response.json();
      
      // Parse AI response to check score, good points & improvements
      const parsed = parseAIResponse(data.text);
      
      setChatHistory(prev => [...prev, {
        role: "model",
        text: data.text,
        ...parsed
      }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        role: "model",
        text: "Kuch sanketik kharabi aayi. Bhai, ek baar firse enter koshish karein."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract structured feedback elements for beautiful rendering
  const parseAIResponse = (text: string) => {
    let score: number | undefined;
    let good: string | undefined;
    let improve: string | undefined;

    // Looking for rating out of 10
    const scoreMatch = text.match(/(?:Confidence\/Relevance Score|🎯 Score|Score|Relevance Score):\s*\[?(\d+)/i) || text.match(/🎯\s*Confidence\/Relevance\s*Score:\s*(\d+)/i);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    }

    // Looking for Good sentence
    const goodMatch = text.match(/(?:What was good|✅ What was good|What was good:)\s*\[?([^\]\n]+)\]?/i) || text.match(/✅\s*What\s*was\s*good:\s*([^\n]+)/i);
    if (goodMatch) {
      good = goodMatch[1].trim();
    }

    // Looking for Area to improve
    const improveMatch = text.match(/(?:Area to improve|🛠️ Area to improve|Areas to improve:)\s*\[?([^\]\n]+)\]?/i) || text.match(/🛠️\s*Area\s*to\s*improve:\s*([^\n]+)/i);
    if (improveMatch) {
      improve = improveMatch[1].trim();
    }

    return { score, good, improve };
  };

  const handleReset = () => {
    setChatHistory([]);
    setIsStarted(false);
    setPreparingFor("");
    setCustomTarget("");
  };

  return (
    <div id="multi-page-pdf-scanner-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full h-full md:max-w-md md:h-[92vh] md:rounded-[2.5rem] md:shadow-2xl md:border-4 md:border-slate-800 flex flex-col overflow-hidden relative shadow-slate-900/40">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center scale-95">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Mitra Interview Coach
                <span className="text-[9px] bg-emerald-500/80 text-white font-bold py-0.5 px-2 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Sahi mock preparation, better confidence & viva rating
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

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 flex flex-col">
          {!isStarted ? (
            <div className="my-auto flex flex-col gap-6 max-w-md mx-auto w-full py-10">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mx-auto animate-bounce">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-950 tracking-tight">
                  Kiski taiyari karni hai?
                </h3>
                <p className="text-xs text-gray-500">
                  Select a preset topic below or enter a customized position to start mock questioning.
                </p>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleStart(p.label)}
                      className="p-4 bg-white hover:bg-blue-50 border border-gray-150 rounded-2xl text-left transition-all active:scale-95 group flex flex-col gap-2 shadow-xs cursor-pointer hover:border-blue-300"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black text-gray-800 leading-snug">
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Selector */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-col gap-3 shadow-xs">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Or write your specific position:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    placeholder="e.g. UPSC CSE Interview, SBI PO, Navy viva"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800"
                  />
                  <button
                    onClick={() => handleStart(customTarget)}
                    disabled={!customTarget.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50 cursor-pointer text-xs font-black uppercase tracking-wider"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Chat & Mock Interview Live Console
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex items-center justify-between bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-950">
                    Topic: {preparingFor}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[10px] font-black uppercase text-red-600 border border-red-200 rounded-xl hover:bg-red-50 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restart
                </button>
              </div>

              {/* Chat View */}
              <div className="flex-1 overflow-y-auto px-1 space-y-4 pr-1">
                {chatHistory.map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={idx} className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                      <div className="text-[9px] font-black uppercase tracking-wider text-gray-400 px-1">
                        {isUser ? "Aapki Response" : "Mitra AI Examiner"}
                      </div>
                      
                      <div className={`max-w-[85%] p-4 rounded-3xl text-xs leading-relaxed font-medium shadow-2xs ${
                        isUser 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-none whitespace-pre-wrap"
                      }`}>
                        {m.text}
                      </div>

                      {/* Structured visual display when AI returns scores */}
                      {!isUser && (m.score !== undefined || m.good || m.improve) && (
                        <div className="w-full max-w-[85%] bg-gradient-to-br from-amber-50/70 to-orange-50/30 border border-amber-100 rounded-2xl p-4 mt-1 space-y-3 shadow-xs">
                          <header className="flex items-center justify-between pb-2 border-b border-amber-100/60">
                            <span className="text-[9px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-1">
                              <span>📊 EXAMINER FEEDBACK</span>
                            </span>
                            {m.score !== undefined && (
                              <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black">
                                🎯 {m.score}/10
                              </div>
                            )}
                          </header>

                          {m.good && (
                            <div className="flex gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9.5px] font-black text-emerald-900 uppercase tracking-wider">What was good</p>
                                <p className="text-[11px] text-gray-750 font-medium leading-relaxed mt-0.5">{m.good}</p>
                              </div>
                            </div>
                          )}

                          {m.improve && (
                            <div className="flex gap-2 pt-1">
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9.5px] font-black text-amber-900 uppercase tracking-wider">Area to improve</p>
                                <p className="text-[11px] text-gray-750 font-medium leading-relaxed mt-0.5">{m.improve}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl text-[10px] text-gray-400 font-bold max-w-[200px]">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Mitra is thinking & scoring...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  disabled={isLoading}
                  placeholder={isLoading ? "Please wait..." : "Write your professional response..."}
                  className="flex-1 bg-gray-50 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:bg-white border-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 text-gray-800"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !userInput.trim()}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
