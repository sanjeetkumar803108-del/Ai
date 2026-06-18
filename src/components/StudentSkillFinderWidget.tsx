import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Coins, 
  Compass, 
  TrendingUp, 
  BookOpen, 
  ChevronRight, 
  Zap, 
  RefreshCw, 
  CheckCircle,
  Briefcase,
  Layers,
  GraduationCap,
  Calendar,
  DollarSign,
  Star,
  Award
} from "lucide-react";
import { UserProfile } from "../types";

export const StudentSkillFinderWidget = ({
  userProfile,
  onAskMitra
}: {
  userProfile: UserProfile;
  onAskMitra: (q: string) => void;
}) => {
  const isJobsMode = userProfile.community === "Jobs";
  const [stream, setStream] = useState<string>(
    userProfile.stream || (isJobsMode ? "Commerce" : "Others")
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [bhaiInsight, setBhaiInsight] = useState<string>("");
  const [skills, setSkills] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  const fetchSkills = async (targetStream: string, silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/skills/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: {
            ...userProfile,
            stream: targetStream,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to load skills guide.");
      }

      const data = await response.json();
      if (data.skills && Array.isArray(data.skills)) {
        setSkills(data.skills);
        setBhaiInsight(data.bhaiInsight || "");
      } else {
        throw new Error("Invalid format received");
      }
    } catch (err: any) {
      console.error("Failed to load skills:", err);
      // Fallback local guidelines if API triggers error
      getLocalFallback(targetStream);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getLocalFallback = (targetStream: string) => {
    const name = userProfile.name || "Dost";
    if (isJobsMode) {
      setSkills([
        {
          name: "Professional Data Analytics & Cloud Warehousing (SQL + PowerBI)",
          category: "Data Operations",
          whyGood: [
            "Companies me fast decision-making ke liye modern data and business metrics operators ki highest demand hai.",
            "Aap advanced SQL queries aur automatic sales dashboard visualizations asani se manage kar sakenge."
          ],
          futureWork: [
            "2x Faster Jobs Placement: Direct hire in high-priority job vacancies within startups & MNCs.",
            "Aapko short-listed non-coding status milega jisse career field change karna extremely easy ho jayega."
          ],
          portfolioValue: [
            "PowerBI ya Excel Sheet use karke local retail business ki 'Live Interactive Sales Analysis' project banayein aur resume me project links update karein."
          ],
          earnings: "₹35,000 - ₹70,000 / month (Immediate 50% - 80% salary hike potential with live portfolio proof!)",
          howToLearn: [
            "Google Sheets and standard databases tools practice karein simple YouTube courses se.",
            "Form Mitra AI se sample questions solve karke mock tests analyze karein."
          ]
        },
        {
          name: "Enterprise Digital Marketing, SEO & Performance Ads",
          category: "Growth & Search Operations",
          whyGood: [
            "Commerce, Arts ya Technical background ke professional seekers ke liye is skill ki value limitless hai.",
            "Social platforms aur organic search algorithms use karke business results produce karna super easy hai."
          ],
          futureWork: [
            "Instant Hires access: Companies digital marketing specialists ko zero experience par bhi screen karti hain.",
            "Remote high-paying freelancing roles are immediately open on Upwork & Fiverr."
          ],
          portfolioValue: [
            "Real local businesses ke social content handles ko 2 weeks tak optimize karke real static organic growth stats dikhayein."
          ],
          earnings: "₹30,000 - ₹65,000 / month (Approx 40% - 60% high-salary escalation with certified link portfolio!)",
          howToLearn: [
            "Google and HubSpot free certifications courses complete karein within 10 days.",
            "Apni knowledge live testing campaigns ke upar practice karke validation checks run karein."
          ]
        }
      ]);
      setBhaiInsight(`Bhai ${name}, job seekers community ke liye main guarantee deta hoon ki advanced project portfolios aur validated practical links hi sabse bada game charger hain! Resume me fake details likhne ke badle, live LinkedIn, Behance ya GitHub pages par work share kijiye — aapko jaldi jobs milengi aur salary 60% tak badh jayegi!`);
    } else {
      if (targetStream === "PCM") {
        setSkills([
          {
            name: "Freelance React & Tailwind Frontend UI Builder",
            category: "Tech & Software",
            whyGood: [
              "PCM logical reasoning programming tools and structure coordinate karne me bohot fast help karegi.",
              "Programming basics aur responsive web design formats adapt karna easy dynamic process hai."
            ],
            futureWork: [
              "Future Software Engineering stream selection aur elite college placement opportunities me big edge.",
              "Academic studies ke sath-sath simple visual landing page freelance tasks build kijiye."
            ],
            portfolioValue: [
              "Build your own beautiful portfolio website listing academic credentials and creative web designing modules."
            ],
            earnings: "₹25,000 - ₹60,000 / month (Excellent freelancing earnings stream alongside standard college)",
            howToLearn: [
              "FreeCodeCamp aur free programming tutorials start karein HTML, CSS & Basic JavaScript se.",
              "Daily 1 hour coding constraints handle karein custom projects build-up ke liye."
            ]
          },
          {
            name: "Python Applications & AI Systems Prompt Engineering",
            category: "Artificial Intelligence",
            whyGood: [
              "Python language is mathematically simple and works wonder for data statistics analyses.",
              "Modern AI structures like ChatGPT, Claude aur Gemini parameters calibrate karna seekhna next-generation core requirement hai."
            ],
            futureWork: [
              "Python Automation Developer, remote Prompt Optimizer, and digital assistance tasks.",
              "Next-level research scholarships ya technical internships me high-value priority entries."
            ],
            portfolioValue: [
              "Create 5 premium automated smart chat prompts for automated homework tracking tools and save hours manually."
            ],
            earnings: "₹30,000 - ₹75,000 / month (Excellent high demand freelancing rewards)",
            howToLearn: [
              "Python basics seekhein variables and loops tutorials se, and start interacting with standard API channels.",
              "Form Mitra AI modules complete karein code generation techniques seekhne ke liye."
            ]
          }
        ]);
        setBhaiInsight(`Dost ${name}, PCM stream ke sath technology seekhna means career me direct super speed injection! Roz bas evening me 1 ghanta practical design work doliye. studies par bina kisi pressure ke 3 months me aap smart money systems build up shuru kardenge! Best of luck, bade bhai ka ashirwad hamesha sath hai.`);
      } else {
        setSkills([
          {
            name: "Product Interface UI/UX Designing (Professional Figma Prototyping)",
            category: "Creative Arts",
            whyGood: [
              "Geometric layouts placement and color synchronization are easy to capture for intuitive minds.",
              "Zero software coding dependency! Simple logical placements and UI components control."
            ],
            futureWork: [
              "Mobile App companies aur specialized website design networks hire graphic specialists first.",
              "Unlimited high priority freelance projects options on modern web platforms."
            ],
            portfolioValue: [
              "Redesign any popular local utility app UI structure (e.g. Bus Tickets or Food Order) and build high key transition layouts."
            ],
            earnings: "₹20,000 - ₹45,000 / month (Excellent freelance earnings parallel to normal classes)",
            howToLearn: [
              "Figma software download karein and follow 20 essential UI building videos on YouTube.",
              "Clone famous web widgets and buttons formats to build a stellar portfolio link."
            ]
          }
        ]);
        setStream("PCM");
        setBhaiInsight(`Bhai ${name}, creativity is your biggest asset! Visual graphics, dynamic presentation interfaces aur video editing learn kijiye. Studies and local college duties handle karte-karte aap high scale professional creators ke absolute partners ban sakte ho!`);
      }
    }
  };

  useEffect(() => {
    // Initial fetch from server
    fetchSkills(stream, true);
  }, [userProfile.community]);

  const handleStreamChange = (newStream: string) => {
    setStream(newStream);
    setExpandedCardIndex(null);
    fetchSkills(newStream);
  };

  const getShareText = (skill: any) => {
    return isJobsMode 
      ? `🔥 Hey, look at this high-paying job upgrade skill recommended by Mitra AI:\n\n💻 Skill: ${skill.name}\n💰 Salary Upgrade: ${skill.earnings}\n⚡ Placement: ${skill.futureWork?.[0] || ""}\n✏️ Portfolio Proof: ${skill.portfolioValue?.[0] || ""}\n\nGet hired faster & boost your salary on Form Mitra!`
      : `🔥 Hey, look at this suitable student skill recommended by Mitra AI for ${stream} stream:\n\n💻 Skill: ${skill.name}\n💰 Monthly Income: ${skill.earnings}\n💡 Why good: ${skill.whyGood?.[0] || ""}\n\nDiscover suitable skills & schemes on Form Mitra!`;
  };

  const shareOnWhatsApp = (skill: any) => {
    const text = encodeURIComponent(getShareText(skill));
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareOnTwitter = (skill: any) => {
    const text = encodeURIComponent(getShareText(skill));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <div className="relative group/rainbow transition-all duration-300 hover:scale-[1.01]">
      {/* Ambient Rainbow Glow Aura */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 via-yellow-400 via-green-400 via-blue-500 via-indigo-500 to-purple-500 rounded-[2.5rem] blur-2xl opacity-25 group-hover/rainbow:opacity-40 transition-opacity duration-500 pointer-events-none" />

      {/* Beautiful constant 3px-wide uniform Rainbow Border Wrapper */}
      <div className="relative p-[3.5px] rounded-[2.5rem] bg-gradient-to-r from-pink-500 via-red-500 via-yellow-400 via-green-400 via-blue-500 via-indigo-500 to-purple-500 shadow-2xl">
        <section className="relative p-7 rounded-[2.35rem] bg-slate-900 text-white flex flex-col gap-6 overflow-hidden">
          {/* Premium animated corner shine effects */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover/rainbow:bg-amber-400/20 transition-all duration-700" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-sky-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Premium corner badge tag with live breathing animation */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md select-none animate-pulse">
            <Sparkles className="w-3 h-3 text-slate-950" />
            <span>Bhaiya's Pro Feature</span>
          </div>

      {/* Header section with specialized title */}
      <div className="flex justify-between items-start relative z-10 w-4/5 md:w-auto">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg relative shrink-0">
            {isJobsMode ? (
              <Briefcase className="w-6 h-6 text-slate-950 animate-bounce" />
            ) : (
              <GraduationCap className="w-7 h-7 text-slate-950 animate-bounce" />
            )}
            {/* Pulsing state light */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight leading-none text-white flex flex-wrap items-center gap-1.5">
              <span>MITRA SKILL FINDER </span>
              <span className="text-amber-400 text-sm font-extrabold uppercase bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-md leading-none">
                {isJobsMode ? "Jobs Edition 💼" : "Student Edition 🎓"}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase mt-1.5 tracking-wider font-mono flex items-center gap-1.5">
              <span>CURRENT STATE:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Premium Profile
              </span>
            </p>
          </div>
        </div>

        {/* Refresh action button */}
        <button 
          onClick={() => fetchSkills(stream)} 
          disabled={loading}
          className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-amber-400 border border-white/10 flex items-center justify-center cursor-pointer shrink-0"
          title="Refresh recommendation vectors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main introduction block with direct highlights */}
      <div className="relative z-10 p-5 rounded-2xl bg-white/5 border border-white/5">
        <p className="text-xs md:text-sm font-bold text-zinc-200 leading-relaxed italic border-l-3 border-amber-400 pl-3">
          {isJobsMode ? (
            <span>
              "Bhai, agar tumne yahan bataye hue modern, practical skills seekh liye toh tumhara **portfolio** bohot aacha hojayega, recruiters khud directly contact karenge, aur tumhari **salary directly 40% - 60% tak badh sakti hai**! Tumhe bohot jaldi high priority and permanent jobs mil sakti hain. Humare dynamic recommendations check karo:"
            </span>
          ) : (
            <span>
              "Sathi, tumhari studies (<strong>{stream}</strong>) ke sath kaunsi high-earning practical skills sabse badhiya h? Seekhne se tumhari side earning options upgrade ho jayengi aur personal portfolio outstanding lagega! Mitra AI se direct explore kijiye:"
            </span>
          )}
        </p>
      </div>

      {/* Stream switcher tabs (especially relevant for students, but shown to jobs seeker too to broaden scope) */}
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2 font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          {isJobsMode ? "APNI PREFERRED EDUCATION FIELD SELECT KAREIN:" : "ANUSAR STREAM CHUNNEIN (CHOOSE STREAM):"}
        </p>
        <div className="flex flex-wrap gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
          {["PCM", "PCB", "Commerce", "Arts", "Others"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleStreamChange(tab)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                stream === tab 
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-400/20" 
                  : "text-zinc-300 hover:bg-white/15"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-black/20 rounded-3xl border border-white/5">
          <RefreshCw className="w-9 h-9 animate-spin text-amber-400" />
          <p className="text-xs font-black uppercase tracking-widest text-amber-400 animate-pulse">
            Bhaiya Ka AI recommendations analyze kar raha hai...
          </p>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Gemini 3.5 Active Agent Connection</p>
        </div>
      ) : (
        <div className="space-y-5 relative z-10">
          {/* Skill lists maps */}
          <div className="grid grid-cols-1 gap-5">
            {skills.map((skill, index) => {
              const isExpanded = expandedCardIndex === index;
              return (
                <div 
                  key={index}
                  onClick={() => setExpandedCardIndex(isExpanded ? null : index)}
                  className={`bg-zinc-800/60 border ${
                    isExpanded ? "border-amber-400" : "border-white/10 hover:border-amber-400/40"
                  } rounded-3xl p-6 flex flex-col gap-4 transition-all hover:bg-zinc-800/90 relative overflow-hidden group/card cursor-pointer`}
                >
                  <div className="absolute right-0 top-0 w-36 h-36 bg-amber-400/5 blur-3xl rounded-full" />
                  
                  {/* Card category badge + expandable signposts */}
                  <div className="flex justify-between items-center relative z-10 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-0.5 rounded-md">
                        {skill.category || "Premium Capability"}
                      </span>
                      {isExpanded && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-sky-400/15 text-sky-400 border border-sky-400/20 px-2.5 py-0.5 rounded-md flex items-center gap-1 leading-none">
                          <Calendar className="w-2.5 h-2.5 text-sky-450" />
                          {skill.duration || "4 to 6 Weeks"}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-amber-400/90 font-bold flex items-center gap-1 select-none">
                      <span>{isExpanded ? "Close Info" : "Tap for Roadmap & Duration"}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Header of dynamic card */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div className="flex-1">
                      <h4 className="font-black text-lg text-white tracking-tight group-hover/card:text-amber-400 transition-colors">
                        {skill.name}
                      </h4>
                      {!isExpanded && (
                        <p className="text-[10px] text-zinc-400 mt-1.5 font-bold flex items-center gap-1.5">
                          <span className="text-zinc-500 font-medium">⏳ Duration:</span>
                          <span className="text-zinc-300 bg-zinc-900/60 px-2 py-0.5 rounded-md border border-white/5">{skill.duration || "4 to 6 Weeks"}</span>
                        </p>
                      )}
                    </div>

                    {/* Salary hike and potential highlights */}
                    <div className="shrink-0 bg-emerald-500/10 border-2 border-emerald-400/30 px-4 py-2.5 rounded-2xl flex flex-col items-center justify-center w-full md:w-auto shadow-inner">
                      <div className="flex items-center gap-1 text-emerald-400 mb-1">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span className="text-[8px] font-black uppercase tracking-wider">
                          EARNINGS & SALARY BOOST
                        </span>
                      </div>
                      <span className="text-[12px] font-black text-emerald-300 tracking-tight block">
                        {skill.earnings}
                      </span>
                    </div>
                  </div>

                  {/* Pointwise Custom metrics shown only when expanded */}
                  {isExpanded && (
                    <div 
                      className="space-y-4 text-xs mt-2 pt-3 border-t border-white/5 relative z-10"
                      onClick={(e) => e.stopPropagation()} // Stop propagation so clicking inside details doesn't collapse
                    >
                      {/* Course Description */}
                      {(skill.description || skill.whyGood?.[0]) && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="text-zinc-200 text-xs font-semibold leading-relaxed">
                            {skill.description || `Bhai, ye skill seekhna tumhare career ke liye ekdam beneficial aur straightforward decision hai.`}
                          </p>
                        </div>
                      )}

                      {/* Suitability block */}
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400" />
                          Yahi Skill Kyu Sabse Best Hai? (Why Target This?)
                        </p>
                        <ul className="space-y-2">
                          {(skill.whyGood || []).map((point: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5 leading-relaxed font-semibold text-zinc-300">
                              <span className="text-amber-400 mt-1 select-none font-bold">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Future placement & Jobs speed */}
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black tracking-widest text-[#10b981] uppercase mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#10b981]" />
                          Fast Jobs Placement & Hiring Speed
                        </p>
                        <ul className="space-y-2">
                          {(skill.futureWork || []).map((point: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5 leading-relaxed font-semibold text-zinc-300">
                              <span className="text-emerald-400 mt-1 select-none font-bold">✓</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Portfolio Upgrades */}
                      {skill.portfolioValue && (
                        <div className="bg-amber-400/5 p-4 rounded-xl border-2 border-amber-400/20">
                          <p className="text-[10px] font-black tracking-widest text-amber-300 uppercase mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-300 animate-pulse" />
                            Portfolio Upgrades: Resume Me Kya Likhein? (Recruiter Proof)
                          </p>
                          <ul className="space-y-2">
                            {(skill.portfolioValue || []).map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2.5 leading-relaxed font-black text-amber-200">
                                <span className="text-amber-400 mt-0.5 select-none font-black">★</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Learning directions steps */}
                      <div className="p-1">
                        <p className="text-[10px] font-black tracking-widest text-sky-400 uppercase mb-2 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-sky-400" />
                          Kaise Seekhein? Step-by-Step guide
                        </p>
                        <ul className="space-y-1.5 pl-1.5">
                          {(skill.howToLearn || []).map((point: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed text-zinc-400 font-medium">
                              <span className="text-sky-400 font-bold mt-1">→</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Social sharing action buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-4 mt-2 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">
                            Dosto ko bhi boost dilwayein:
                          </span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => shareOnWhatsApp(skill)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-[#10b981]/30 rounded-xl text-[10px] font-black text-emerald-300 uppercase flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all select-none"
                          >
                            WhatsApp Share
                          </button>
                          <button
                            onClick={() => shareOnTwitter(skill)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/20 rounded-xl text-[10px] font-black text-sky-300 uppercase flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all select-none"
                          >
                            Twitter / X
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bhaiya's custom personal insight advice box */}
          {bhaiInsight && (
            <div className="mt-6 p-6 bg-amber-400/10 rounded-[2rem] border-2 border-amber-400/20 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 text-3xl select-none opacity-25">💡</div>
              <h4 className="text-[10px] font-black tracking-widest uppercase text-amber-400 mb-2.5 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Bhaiya Ka Secrect Pro-Tip For Ultimate Success 📌</span>
              </h4>
              <p className="text-sm font-extrabold leading-relaxed text-amber-200 italic">
                "{bhaiInsight}"
              </p>
              
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  onClick={() => onAskMitra(`Bhaiya, mujhe is custom skill me high high paying jobs guide details dein, and portfolio links kaise set-up karein please step-by-step samjhayen...`)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-103 duration-200 shadow-md cursor-pointer select-none"
                >
                  Bhaiya Se Live Guidance Lein 💬
                </button>
                <button
                  onClick={() => onAskMitra(`Bhaiya, mujhe job interview questions ki practice karwayen with feedback coaching...`)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/10 cursor-pointer select-none"
                >
                  Jobs Mock Interview Practice 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </section>
      </div>
    </div>
  );
};
