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
  const isStudentMode = userProfile.community === "Student";
  const isJobsMode = userProfile.community === "Jobs";
  const [stream, setStream] = useState<string>(
    isStudentMode ? (userProfile.stream || "Others") : "Others"
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
      console.warn("Failed to load skills, using local fallback guidelines:", err.message || err);
      // Fallback local guidelines if API triggers error
      getLocalFallback(targetStream);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getLocalFallback = (targetStream: string) => {
    const name = userProfile.name || "Dost";
    const lang = userProfile.preferredLanguage || "hinglish";

    if (lang === "hi") {
      setSkills([
        {
          name: "एआई-असिस्टेड ऐप डेवलपमेंट और कोडिंग (Cursor & Lovable)",
          category: "एआई टेक्नोलॉजी",
          description: "बिना कोडिंग सीखे एआई टूल्स की मदद से मात्र 30 मिनट में शानदार रिस्पॉन्सिव वेबसाइट्स और ऐप्स बनाना सीखें।",
          duration: "3 से 4 सप्ताह",
          whyGood: [
            "आजकल एआई आधारित कोड जनरेटर टूल्स का चलन है, जिससे बिना प्रोग्रामिंग बैकग्राउंड के भी तेजी से ऐप्स बनाए जा सकते हैं।",
            "लॉजिकल सोच और सही प्रॉम्ट लिखना ही एकमात्र कुंजी है जो जेन जेड के लिए बिल्कुल सही है।"
          ],
          futureWork: [
            "2 गुना तेज हायरिंग: स्टार्टअप्स और फ्रीलांस मार्केट्स में एआई नो-कोड डेवलपर्स की तत्काल भारी मांग है।",
            "कम समय में अपना डिजिटल पोर्टफोलियो बनाकर सीधे क्लाइंट्स हासिल करें।"
          ],
          portfolioValue: [
            "एआई की मदद से 3 लाइव वर्किंग टूल्स (जैसे डेली टास्क ट्रैकर या कस्टमाइज्ड स्टूडेंट कैलकुलेटर) बनाएं और उनके लिंक रिज्यूमे में शेयर करें।"
          ],
          earnings: "₹35,000 - ₹80,000 / महीना (शानदार लाइव पोर्टफोलियो के साथ तुरंत 70% तक सैलरी हाइक!)",
          howToLearn: [
            "Cursor Editor और v0.dev को फ्री में इस्तेमाल करना सीखें।",
            "बेसिक प्रॉम्प्ट गाइडलाइंस और एआई एपीआई इंटीग्रेशन यूट्यूब या मुफ्त गाइड्स के जरिए समझें।"
          ]
        },
        {
          name: "एआई फेसलेस वीडियो क्रिएशन और रील प्रोडक्शन (CapCut & ElevenLabs)",
          category: "एआई डिजिटल क्रिएशन",
          description: "एआई वॉयसओवर, जेनरेटिव आर्ट और ऑटो-कैप्शन का उपयोग करके इंस्टाग्राम और यूट्यूब के लिए वायरल वीडियो बनाएं।",
          duration: "3 सप्ताह",
          whyGood: [
            "आजकल छोटे व्यवसायों और ब्रांड्स को अपनी रील्स बनवाने के लिए क्रिएटिव एडिटर्स की भारी जरूरत है।",
            "बिना खुद का चेहरा दिखाए या कैमरा खरीदे, अपने स्मार्टफोन से ही कमाल के रील्स बनाएं।"
          ],
          futureWork: [
            "स्थानीय व्यवसायों, ब्रांड्स और एजुकेटर्स के लिए मंथली बेसिस पर रील्स मैनेज करने का मौका।",
            "कमिटमेंट केवल 1 घंटा प्रतिदिन, जिससे पढ़ाई या नौकरी के साथ करना बेहद आसान है।"
          ],
          portfolioValue: [
            "कम से कम 10 एआई जेनरेटेड वीडियोज के साथ एक इंस्टाग्राम थीम पेज सेटअप करें और उसकी शानदार रीच दिखाएं।"
          ],
          earnings: "₹25,000 - ₹55,000 / महीना (पढ़ाई के साथ-साथ शानदार एक्स्ट्रा पॉकेट मनी!)",
          howToLearn: [
            "CapCut या VN मोबाइल एडिटर और ElevenLabs एआई वॉयस जनरेटर का इस्तेमाल सीखें।",
            "वायरल वीडियो हुक्स और एआई स्क्रिप्ट राइटिंग की बारीकियों को समझें।"
          ]
        }
      ]);
      setBhaiInsight(`दोस्त ${name}, आज के डिजिटल दौर में जेन जेड के लिए पुराने तरीके आउटडेटेड हो चुके हैं! अब एआई टूल्स के साथ स्मार्ट तरीके से काम करने का समय है। इन आधुनिक स्किल्स में से किसी एक को चुनकर अपना लाइव पोर्टफोलियो बनाएं। नकली रिज्यूमे के बजाय लाइव काम दिखाएं — आपकी सैलरी और जॉब मिलने की रफ्तार तुरंत दोगुनी हो जाएगी! आपका बड़ा भाई हमेशा आपके साथ है।`);
    } else if (lang === "en") {
      setSkills([
        {
          name: "AI-Assisted Web App Development (Cursor & Lovable)",
          category: "AI Technology",
          description: "Build beautiful, fully-functional web applications in minutes using AI-powered code assistants, without writing complex code manually.",
          duration: "3 to 4 Weeks",
          whyGood: [
            "Modern tech startups prefer builders who leverage AI to ship products 10x faster.",
            "Logical thinking and prompt design are the only requirements, making it perfect for non-technical backgrounds."
          ],
          futureWork: [
            "2x Faster Hiring: High demand for AI-augmented developers and builders in modern digital agencies.",
            "Excellent global remote work and high-paying freelance gigs on Upwork/Fiverr."
          ],
          portfolioValue: [
            "Build 3 interactive live web tools (e.g. customized GPA tracker or local business catalog) using AI code tools and share live links."
          ],
          earnings: "₹35,000 - ₹80,000 / month (Immediate 50% - 80% salary boost potential with live project proof!)",
          howToLearn: [
            "Start using the free tier of Cursor editor and explore v0.dev for UI elements.",
            "Learn custom prompt engineering structures to direct AI models to write clean web code."
          ]
        },
        {
          name: "AI Faceless Video Production & Reel Curation",
          category: "AI Digital Creation",
          description: "Create highly engaging, viral vertical Shorts and Reels using AI image generators, ElevenLabs voices, and CapCut transitions.",
          duration: "3 Weeks",
          whyGood: [
            "Massive demand from brands, local cafes, and educators who want to go viral but have zero video-making skills.",
            "Create professional visual content without showing your face or investing in expensive camera gear."
          ],
          futureWork: [
            "Retainer-based social media management contracts for local businesses.",
            "Grow your own highly monetizable faceless theme channels passively."
          ],
          portfolioValue: [
            "Launch a dedicated Instagram theme channel with at least 10 high-quality viral-style AI Reels showing proof of reach."
          ],
          earnings: "₹25,000 - ₹55,000 / month (Highly flexible micro-gigs alongside college or full-time roles)",
          howToLearn: [
            "Explore ElevenLabs for voices and CapCut templates for fast smartphone transitions.",
            "Master ChatGPT script writing and hooks to keep audience retention high."
          ]
        }
      ]);
      setBhaiInsight(`Hey ${name}, traditional skills are becoming obsolete in this Gen Z era. Start building real portfolio projects using modern AI tools today! Showing live GitHub, Behance, or Figma proofs to recruiters instead of blank resumes will accelerate your salary hikes instantly. Your Bade Bhai is always here to support you!`);
    } else {
      // Hinglish (friendly blend)
      setSkills([
        {
          name: "AI-Assisted Web App Development (Cursor & Lovable)",
          category: "AI Technology",
          description: "Bina coding seekhe modern AI code assistants (jaise Cursor aur v0) ki help se sirf 30 minutes me professional responsive websites aur apps build karna seekhein.",
          duration: "3 to 4 Weeks",
          whyGood: [
            "Gen Z builders ke liye coding syntax ratne ki jarurat nahi hai. Bas logical thinking aur proper prompts likh kar full-stack sites launch kar sakte hain.",
            "Startups and digital agencies me un developers ki high-demand hai jo AI integration se fast deliver karte hain."
          ],
          futureWork: [
            "2x Faster Placements: Non-technical students bhi responsive modern landing page roles and tech internships direct qualify kar sakte hain.",
            "Remote clients and high-paying freelance deals are immediately open globally."
          ],
          portfolioValue: [
            "AI code builders use karke 3 live working single-page tools (jaise dynamic notes dashboard ya custom student planner) banayein aur resume me live URL list karein."
          ],
          earnings: "₹35,000 - ₹80,000 / month (Consistent high-paying micro-projects with live proof!)",
          howToLearn: [
            "Free Cursor editor download karein aur standard v0.dev tools explore karein.",
            "Basic prompts rules aur api call methods YouTube tutorials ke through step-by-step seekhein."
          ]
        },
        {
          name: "AI Faceless Video Production & Reel Curation",
          category: "AI Digital Creation",
          description: "ElevenLabs AI voices, ChatGPT scripts aur modern CapCut editing templates use karke premium high-converting reels and shorts build karein.",
          duration: "3 Weeks",
          whyGood: [
            "Bina camera ke samne aaye aur bina voice record kiye, smartphone se high quality content generate karna extremely straightforward hai.",
            "Social media growth me local small businesses, cafes, and academies digital creators ko high monthly retainers pay kar rahe hain."
          ],
          futureWork: [
            "Part-time or remote Social Media management positions with multiple local and global clients.",
            "Apna personal high-traffic faceless niche channel grow karke direct passive sponsorships receive karein."
          ],
          portfolioValue: [
            "At least 10 viral style AI-generated Reels ke sath ek live active Instagram theme page establish karein aur analytics output show karein."
          ],
          earnings: "₹25,000 - ₹55,000 / month (Excellent pocket money options alongside study/jobs)",
          howToLearn: [
            "Free CapCut templates edit karna seekhein aur sound design overlay integrate karein.",
            "Trending hooks structure copy create karne ke liye ChatGPT prompts practice karein."
          ]
        }
      ]);
      setBhaiInsight(`Dost ${name}, modern Gen Z era me purane, boring tarike bilkul chalne wale nahi hain! AI tools ke sath smart work karne ka samay aa gaya hai. In skills me se ek ko select karke practical work portfolios banaiye, blank resumes ke badle live projects HR ko dikhayein — aapki salary boost aur hiring speed instant triple ho jayegi! Aapka bade bhai hamesha backup ke sath help karega.`);
    }
  };

  useEffect(() => {
    // Initial fetch from server with community-based default stream
    const targetStream = userProfile.community === "Student" ? (userProfile.stream || "Others") : "Others";
    setStream(targetStream);
    fetchSkills(targetStream, true);
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
          ) : isStudentMode ? (
            <span>
              "Sathi, tumhari studies (<strong>{stream}</strong>) ke sath kaunsi high-earning practical skills sabse badhiya h? Seekhne se tumhari side earning options upgrade ho jayengi aur personal portfolio outstanding lagega! Mitra AI se direct explore kijiye:"
            </span>
          ) : (
            <span>
              "Sathi, aapke professional growth aur side income ke liye kaunsi high-earning practical skills sabse badhiya hain? Seekhne se aapki earning options upgrade ho jayengi aur digital presence outstanding lagega! Mitra AI se direct explore kijiye:"
            </span>
          )}
        </p>
      </div>

      {/* Stream switcher tabs (only for Student community) */}
      {isStudentMode && (
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2 font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            ANUSAR STREAM CHUNNEIN (CHOOSE STREAM):
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
      )}

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

                  {/* Ask with AI Button - Compact & Gorgeous */}
                  <div 
                    className="relative z-10 mt-1"
                    onClick={(e) => e.stopPropagation()} // Prevent card toggle
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const lang = userProfile.preferredLanguage || "hinglish";
                        const prompt = lang === "hi"
                          ? `बधाई हो भाई! मुझे इस शानदार आधुनिक स्किल "${skill.name}" के बारे में एकदम शुरुआत से, नर्सरी लेवल पर समझाओ।
1. यह स्किल आज के समय में क्यों सबसे बेस्ट है और भविष्य में क्या स्कोप है?
2. इसे सीख लेने के बाद मैं कितना मंथली इनकम (earnings) कमा सकता हूँ?
3. इसे सीखने के लिए क्या-क्या स्टेप्स हैं और कहाँ से एकदम सही तरीके से सीखें?
4. इस स्किल को सीखने के बाद मुझे काम या क्लाइंट्स कहाँ से मिलेंगे और पेमेंट कैसे निकालूँगा?
एकदम ग्राउंड लेवल से साफ़-साफ़ गाइड करो ताकि मैं बिना किसी गलती के इसे कर सकूँ।`
                          : `Bhai, mujhe is modern high-demand skill "${skill.name}" ke baare me ekdam shuruaat se, nursery level par explain karo.
1. Ye skill kyu sabse best hai aur iska future scope kya hai?
2. Isko seekhne ke baad monthly income kitni ho sakti hai?
3. Step-by-step isko kaise seekhein aur kaha se sahi resources milenge?
4. Seekh lene ke baad kaise kahi apply karein ya clients kaise dhoondhein aur payment kaise receive karein?
Ground level se fully clear steps me samjhao taaki main bina kisi mistake ke shuru kar sakoon.`;
                        
                        onAskMitra(prompt);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 text-xs font-black rounded-2xl transition-all cursor-pointer uppercase tracking-wider shadow-lg active:scale-[0.98]"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                      <span>{userProfile.preferredLanguage === "hi" ? "एआई मित्रा से स्टेप-बाय-स्टेप समझें" : "Ask AI Step-by-Step Guide"}</span>
                    </button>
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
