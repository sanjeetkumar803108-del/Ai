import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { 
  Calendar, 
  MapPin, 
  Bookmark, 
  Share2, 
  Info, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Sparkles,
  Zap,
  HelpCircle,
  QrCode
} from "lucide-react";
import { cn } from "../lib/utils";

export interface ScholarshipDeadline {
  status: 'OPEN' | 'CLOSED' | 'COMING_SOON';
  lastDeadline: string;
  nextCycleExpected: string;
  daysRemaining: number | null;
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SchemeCardProps {
  // Core descriptive props (Hindi & English)
  schemeName: string;
  hindiName?: string;
  description: string;
  hindiDescription?: string;
  eligibilityCriteria: string[];
  hindiEligibility?: string[];
  benefits: string[];
  hindiBenefits?: string[];
  requiredDocuments: string[];
  hindiDocuments?: string[];

  // Metadata
  category?: string;
  state?: string;
  deadline?: number | string;
  officialUrl?: string;
  officialSource?: string;
  matchScore?: number;
  isHighlyRecommended?: boolean;
  confidenceScore?: number;
  aiVersion?: string;

  // Saved / Compare states
  isSaved?: boolean;
  isSelected?: boolean;
  userDocs?: string[] | { name: string }[] | { type: string }[]; // for computing Document Readiness

  // Scholarship improvements fields
  ageLimit?: string;
  gpaRequirement?: string;
  applicationMode?: 'Online' | 'Offline' | 'Hybrid';
  monthlyAmount?: string;
  nextCycleExpected?: string;
  lastDeadline?: string;
  opening?: string;

  // Action listeners
  onToggleSave?: (e: React.MouseEvent) => void;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onAskMitra?: (schemeName: string, customText?: string) => void;
  onStartSimulator?: (form: any) => void;
  onShowFormAudit?: () => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  schemeName,
  hindiName,
  description,
  hindiDescription,
  eligibilityCriteria = [],
  hindiEligibility,
  benefits = [],
  hindiBenefits,
  requiredDocuments = [],
  hindiDocuments,
  category = "General",
  state,
  deadline,
  officialUrl,
  officialSource,
  matchScore,
  isHighlyRecommended = false,
  confidenceScore,
  aiVersion,
  isSaved = false,
  isSelected = false,
  userDocs = [],
  // Scholarship fields
  ageLimit,
  gpaRequirement,
  applicationMode,
  monthlyAmount,
  nextCycleExpected,
  lastDeadline,
  opening,
  onToggleSave,
  onToggleSelect,
  onAskMitra,
  onStartSimulator,
  onShowFormAudit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("hi"); // Default to Hindi layout for Mitra comfort
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Determine current display language content
  const activeName = lang === "hi" && hindiName ? hindiName : schemeName;
  const activeDescription = lang === "hi" && hindiDescription ? hindiDescription : description;
  
  const activeEligibility = lang === "hi" && hindiEligibility && hindiEligibility.length > 0 
    ? hindiEligibility 
    : eligibilityCriteria;

  const activeBenefits = lang === "hi" && hindiBenefits && hindiBenefits.length > 0 
    ? hindiBenefits 
    : benefits;

  const activeDocuments = lang === "hi" && hindiDocuments && hindiDocuments.length > 0 
    ? hindiDocuments 
    : requiredDocuments;

  // Process Document Readiness Helper
  const isDocMet = (docName: string): boolean => {
    if (!userDocs) return false;
    const cleanDocName = docName.toLowerCase().trim();
    return userDocs.some((uDoc: any) => {
      const uName = typeof uDoc === "string" 
        ? uDoc 
        : (uDoc.name || uDoc.type || "");
      const cleanUName = uName.toLowerCase().trim();
      return cleanUName.includes(cleanDocName) || cleanDocName.includes(cleanUName);
    });
  };

  const metDocsCount = requiredDocuments.filter(isDocMet).length;
  const totalDocsCount = requiredDocuments.length;
  const progressPercent = totalDocsCount > 0 ? Math.round((metDocsCount / totalDocsCount) * 100) : 0;

  // Relative deadline calculator
  const getDaysLeft = (): number | string | null => {
    if (!deadline) return null;
    if (typeof deadline === "string") return deadline;
    const days = Math.ceil((Number(deadline) - Date.now()) / (24 * 60 * 60 * 1000));
    return days;
  };

  const daysLeft = getDaysLeft();
  const daysLeftNum = typeof daysLeft === "number" ? daysLeft : null;
  const isUrgent = daysLeftNum !== null && daysLeftNum > 0 && daysLeftNum <= 5;

  // Scholarship smart deadline calculations
  const getScholarshipDeadlineInfo = (): ScholarshipDeadline => {
    const now = Date.now();
    let status: 'OPEN' | 'CLOSED' | 'COMING_SOON' = 'OPEN';
    let daysRemaining: number | null = null;
    let urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    let dlTime: number | null = null;
    if (deadline) {
      if (typeof deadline === "number") {
        dlTime = deadline;
      } else {
        const parsed = Date.parse(deadline);
        if (!isNaN(parsed)) dlTime = parsed;
      }
    }

    let openTime: number | null = null;
    if (opening) {
      const parsed = Date.parse(opening);
      if (!isNaN(parsed)) openTime = parsed;
    }

    if (dlTime !== null) {
      daysRemaining = Math.ceil((dlTime - now) / (24 * 60 * 60 * 1000));
      if (daysRemaining < 0) {
        status = 'CLOSED';
        daysRemaining = null;
      } else if (openTime !== null && now < openTime) {
        status = 'COMING_SOON';
        daysRemaining = null;
      } else {
        status = 'OPEN';
      }
    } else {
      status = 'OPEN';
    }

    if (status === 'OPEN' && daysRemaining !== null) {
      if (daysRemaining <= 5) {
        urgencyLevel = 'HIGH';
      } else if (daysRemaining <= 15) {
        urgencyLevel = 'MEDIUM';
      } else {
        urgencyLevel = 'LOW';
      }
    }

    const lastDeadlineStr = lastDeadline || (dlTime ? new Date(dlTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified');
    const nextCycleStr = nextCycleExpected || (dlTime ? `Expected ${new Date(dlTime + 365*24*60*60*1000).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}` : 'Expected Mid 2027');

    return {
      status,
      lastDeadline: lastDeadlineStr,
      nextCycleExpected: nextCycleStr,
      daysRemaining,
      urgencyLevel
    };
  };

  const deadlineDetail = getScholarshipDeadlineInfo();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `Future Mitra: ${activeName}`,
      text: `${activeName}\n\n${activeDescription}\n\nFuture Mitra AI se update paayein!`,
      url: officialUrl || window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
        );
        alert("Link successfully copied to clipboard! ✔️");
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && !err.message?.toLowerCase().includes("cancel")) {
        console.error("Share error:", err);
      }
    }
  };

  const handleGenerateQr = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareText = `${activeName}\n\nCategory: ${category}\nBenefits: ${activeBenefits.slice(0, 2).join(". ")}\nOfficial Link: ${officialUrl || window.location.href}`;
    
    try {
      const dataUrl = await QRCode.toDataURL(shareText, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        }
      });
      setQrCodeUrl(dataUrl);
      setShowQrModal(true);
    } catch (err) {
      console.error("QR Code generation error:", err);
    }
  };

  const handleDownloadQr = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${schemeName.replace(/\s+/g, "_")}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id={`reusable-scheme-card-${schemeName.replace(/\s+/g, "-").toLowerCase()}`}
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "bg-white rounded-3xl border border-gray-150 transition-all duration-300 overflow-hidden flex flex-col relative cursor-pointer",
        isSelected
          ? "border-[#008069] ring-2 ring-[#008069]/10 shadow-lg"
          : "hover:border-gray-300 hover:shadow-md shadow-xs",
        isExpanded ? "scale-[1.008]" : ""
      )}
    >
      {/* Visual Accent Categories Tag Layer */}
      <div className="p-5 pb-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50 border-b border-gray-100">
        <div className="flex gap-1.5 items-center">
          <span className="px-2.5 py-1 bg-[#008069]/10 text-[#008069] text-[9px] font-black rounded-lg uppercase tracking-wider">
            {category}
          </span>
          {state && (
            <span className="px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {state}
            </span>
          )}
          {isHighlyRecommended && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider animate-pulse shadow-sm flex items-center gap-1 shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              {lang === "hi" ? "आपके लिए अनुकूल 🌟" : "For You 🌟"}
            </span>
          )}
        </div>

        {/* Hindi / English Language Switcher (Ample tactile targets) */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-150 p-0.5 rounded-xl flex items-center border border-gray-200"
        >
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={cn(
              "px-2.5 py-1 rounded-[10px] text-[10px] font-black transition-all cursor-pointer",
              lang === "hi" 
                ? "bg-white text-[#008069] shadow-2xs font-extrabold" 
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={cn(
              "px-2.5 py-1 rounded-[10px] text-[10px] font-black transition-all cursor-pointer",
              lang === "en" 
                ? "bg-white text-[#008069] shadow-2xs font-extrabold" 
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            EN
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* Title and Top Actions Bar */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-gray-900 leading-snug tracking-tight">
              {activeName}
            </h3>
            
            {/* AI Source & Version */}
            <div className="flex flex-wrap gap-2 mt-1.5 items-center">
              {officialSource && (
                <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                  Source: {officialSource}
                </span>
              )}
              {matchScore !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide border",
                  matchScore >= 75
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : matchScore >= 50
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                )}>
                  🎯 {matchScore}% Match Rate
                </span>
              )}
              {confidenceScore && (
                <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-purple-600" />
                  {confidenceScore}% Sanyojak Accuracy
                </span>
              )}
            </div>
          </div>

          {/* Core Visual Action Floating Buttons with Touch Target Padding Check */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center gap-1.5 shrink-0"
          >
            {/* Save Card */}
            {onToggleSave && (
              <button
                type="button"
                onClick={onToggleSave}
                aria-label="Save Scheme Button"
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
                  isSaved
                    ? "bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/10"
                    : "bg-slate-50 border-gray-150 text-gray-400 hover:text-gray-600 hover:bg-slate-100"
                )}
              >
                <Bookmark className={cn("w-4 h-4", isSaved ? "fill-current" : "")} />
              </button>
            )}

            {/* Compare Selector */}
            {onToggleSelect && (
              <button
                type="button"
                onClick={onToggleSelect}
                aria-label="Compare Scheme Toggle"
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
                  isSelected
                    ? "bg-[#008069] border-[#006e5a] text-white shadow-md shadow-green-500/10"
                    : "bg-slate-50 border-gray-150 text-gray-400 hover:text-gray-600 hover:bg-slate-100"
                )}
              >
                <Check className="w-4 h-4 font-bold" />
              </button>
            )}

            {/* Share action */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share Scheme Information"
              className="w-10 h-10 rounded-xl bg-slate-50 border border-gray-150 text-gray-400 hover:text-gray-600 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* QR Code sharing action */}
            <button
              type="button"
              onClick={handleGenerateQr}
              aria-label="Generate QR Code"
              title="Generate QR Code for offline sharing"
              className="w-10 h-10 rounded-xl bg-slate-50 border border-gray-150 text-gray-400 hover:text-[#008069] hover:border-emerald-100 hover:bg-emerald-50/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Short description with adaptivity */}
        <p className={cn(
          "text-sm text-gray-600 leading-relaxed font-semibold transition-all mb-1",
          isExpanded ? "" : "line-clamp-2"
        )}>
          {activeDescription}
        </p>

        {/* Smart Scholarship Information & Deadline System */}
        {(category?.toLowerCase() === "education" || monthlyAmount || ageLimit || gpaRequirement) && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3 my-1">
            {/* Header Status & Days Left Row */}
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-250/50">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#008069]" />
                {lang === "hi" ? "स्कॉलरशिप समय सीमा" : "Scholarship Timeline"}
              </span>

              {/* Status badge */}
              {deadlineDetail.status === 'CLOSED' ? (
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[9px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <span>❌</span>
                  {lang === "hi" ? "समय सीमा समाप्त" : "Deadline Passed"}
                </span>
              ) : deadlineDetail.status === 'COMING_SOON' ? (
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span>⏳</span>
                  {lang === "hi" ? "जल्द आ रहा है" : "Coming Soon"}
                </span>
              ) : (
                <span className={cn(
                  "px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border flex items-center gap-1",
                  deadlineDetail.urgencyLevel === 'HIGH'
                    ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                    : deadlineDetail.urgencyLevel === 'MEDIUM'
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
                )}>
                  <span>🟢</span>
                  {lang === "hi" ? "आवेदन चालू है" : "OPEN"}
                </span>
              )}
            </div>

            {/* Smart Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Monthly Amount / Scholarship reward */}
              <div className="flex flex-col gap-0.5 bg-white p-2.5 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "hi" ? "निश्चित राशि (Monthly Grant)" : "Monthly Stipend"}
                </span>
                <span className="font-extrabold text-[#008069]">
                  {monthlyAmount || (benefits[0] || "Fully Funded")}
                </span>
              </div>

              {/* Application Mode */}
              <div className="flex flex-col gap-0.5 bg-white p-2.5 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "hi" ? "आवेदन का माध्यम" : "Application Mode"}
                </span>
                <span className="font-extrabold text-blue-600">
                  {applicationMode || "Online"}
                </span>
              </div>

              {/* Age limit */}
              {ageLimit && (
                <div className="flex flex-col gap-0.5 bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === "hi" ? "उम्र सीमा (Age Limit)" : "Age Eligibility"}
                  </span>
                  <span className="font-extrabold text-gray-700">
                    {ageLimit}
                  </span>
                </div>
              )}

              {/* GPA requirement */}
              {gpaRequirement && (
                <div className="flex flex-col gap-0.5 bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === "hi" ? "मार्क्स / GPA आवश्यकता" : "GPA Requirement"}
                  </span>
                  <span className="font-extrabold text-gray-700">
                    {gpaRequirement}
                  </span>
                </div>
              )}

              {/* Last deadline / Status info */}
              <div className="flex flex-col gap-0.5 bg-white p-2.5 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "hi" ? "अंतिम तिथि" : "Last Deadline"}
                </span>
                <span className={cn(
                  "font-extrabold",
                  deadlineDetail.status === 'CLOSED' ? "text-rose-600 line-through" : "text-gray-700"
                )}>
                  {deadlineDetail.lastDeadline}
                </span>
              </div>

              {/* Next cycle expected */}
              <div className="flex flex-col gap-0.5 bg-white p-2.5 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "hi" ? "अगले चक्र की जानकारी" : "Next Cycle Info"}
                </span>
                <span className="font-extrabold text-purple-600">
                  {deadlineDetail.nextCycleExpected}
                </span>
              </div>
            </div>

            {/* Counter summary bar */}
            {deadlineDetail.status === 'OPEN' && deadlineDetail.daysRemaining !== null && (
              <div className={cn(
                "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-between border",
                deadlineDetail.urgencyLevel === 'HIGH'
                  ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              )}>
                <span>⏰ {lang === "hi" ? "केवल इतना समय शेष है:" : "Urgency Level:"} {deadlineDetail.urgencyLevel}</span>
                <span>{deadlineDetail.daysRemaining} {lang === "hi" ? "दिन बचे हैं" : "Days Left"}</span>
              </div>
            )}

            {deadlineDetail.status === 'CLOSED' && (
              <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span>🛑</span>
                <span>
                  {lang === "hi" 
                    ? `इस स्कॉलरशिप के आवेदन की तिथि समाप्त हो चुकी है। कृपया ${deadlineDetail.nextCycleExpected} में आवेदन करें।` 
                    : `The application deadline has passed. Please prepare for the next cycle starting ${deadlineDetail.nextCycleExpected}.`
                  }
                </span>
              </div>
            )}
          </div>
        )}

        {/* Standard Deadline Warnings if applicable (for non-scholarships with regular deadline property) */}
        {!(category?.toLowerCase() === "education" || monthlyAmount || ageLimit || gpaRequirement) && daysLeft && (
          <div className={cn(
            "p-3 rounded-2xl flex items-center gap-2 border text-xs font-black uppercase tracking-wider",
            isUrgent
              ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
              : "bg-amber-50 border-amber-200 text-amber-700"
          )}>
            <Calendar className="w-4 h-4" />
            <span>
              {lang === "hi" 
                ? `समय सीमा: ${daysLeftNum !== null && daysLeftNum > 0 ? `केवल ${daysLeftNum} दिन शेष हैं! ⏰` : "आज बंद हो रहा है!"}`
                : `Deadline: ${daysLeftNum !== null && daysLeftNum > 0 ? `Only ${daysLeftNum} days left! ⏰` : "Closing today!"}`
              }
            </span>
          </div>
        )}

        {/* Document Readiness dynamic block */}
        {totalDocsCount > 0 && (
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-gray-150 flex flex-col gap-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-400 flex items-center gap-1.5 font-bold">
                <FileText className="w-3.5 h-3.5 text-[#008069]" />
                {lang === "hi" ? "दस्तावेज़ की तैयारी" : "Document Readiness"}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black border",
                progressPercent === 100 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-amber-50 border-amber-200 text-amber-750"
              )}>
                {progressPercent}% Ready
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500 rounded-full", 
                  progressPercent === 100 ? "bg-green-600" : "bg-[#008069]"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[10px] text-gray-500 font-extrabold leading-tight">
              {progressPercent === 100 
                ? (lang === "hi" ? "बधाई हो! आपके सारे दस्तावेज तैयार हैं! 🎉" : "All of your uploaded documents match! 🎉")
                : (lang === "hi" 
                    ? `${metDocsCount} / ${totalDocsCount} कागजात अपलोडेड हैं` 
                    : `${metDocsCount} out of ${totalDocsCount} documents matched successfully`
                  )
              }
            </p>

            {/* Quick Indicators tag block */}
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {requiredDocuments.map((doc, idx) => {
                const isMet = isDocMet(doc);
                const showLabel = lang === "hi" && hindiDocuments && hindiDocuments[idx] 
                  ? hindiDocuments[idx] 
                  : doc;
                return (
                  <span
                    key={idx}
                    className={cn(
                      "text-[9px] font-black px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-all",
                      isMet
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-100 border-gray-200 text-gray-400"
                    )}
                  >
                    <span>{isMet ? "✓" : "✕"}</span>
                    <span>{showLabel}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggle Expand Card Buttons block */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100">
          <div className="flex gap-2">
            {isExpanded ? (
              <span className="text-[10px] text-[#008069] font-black uppercase tracking-widest flex items-center gap-1">
                {lang === "hi" ? "जानकारी बंद करें" : "Hide Details"}
                <ChevronUp className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="text-[10px] text-[#008069] font-black uppercase tracking-widest flex items-center gap-1">
                {lang === "hi" ? "पूरी पात्रता और फायदे देखें" : "View eligibility & rules"}
                <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              </span>
            )}
          </div>

          {/* Quick External Apply Link button */}
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-[#008069]/10 hover:bg-[#008069]/20 text-[#008069] font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-1 transition-all"
            >
              <span>{lang === "hi" ? "वेबसाइट" : "Website"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* ANIMATED EXPANDED VIEW CHUNKS */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden flex flex-col gap-5 pt-4 border-t border-gray-100 mt-2"
            >
              {/* Core Eligibility Criteria Grid Block */}
              {activeEligibility.length > 0 && (
                <div className="bg-orange-50/50 p-4.5 rounded-2xl border border-orange-100/60 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-orange-500 stroke-[3]" />
                    {lang === "hi" ? "कौन योग्य है? / Eligibility criteria" : "Who Is Eligible? / Eligibility"}
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {activeEligibility.map((el, i) => (
                      <li key={i} className="text-xs font-bold text-gray-700 leading-relaxed list-none flex items-start gap-2">
                        <span className="text-orange-500 text-sm mt-[-2px]">•</span>
                        <span>{el}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Core Benefits Grid Block */}
              {activeBenefits.length > 0 && (
                <div className="bg-green-50/50 p-4.5 rounded-2xl border border-green-100/60 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                    {lang === "hi" ? "योजना के वित्तीय फायदे / Scheme Benefits" : "Financial Benefits / What You Get"}
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {activeBenefits.map((ben, i) => (
                      <li key={i} className="text-xs font-bold text-gray-700 leading-relaxed list-none flex items-start gap-2">
                        <span className="text-green-600 text-sm mt-[-2px]">•</span>
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Necessary docs explicitly inside the expander */}
              {activeDocuments.length > 0 && (
                <div className="bg-blue-50/50 p-4.5 rounded-2xl border border-blue-100/60 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    {lang === "hi" ? "ज़रूरी दस्तावेज़ / Documents needed" : "Documents Needed"}
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeDocuments.map((doc, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-white border border-blue-100 text-blue-800 text-[10px] font-bold rounded-xl shadow-3xs"
                      >
                        📄 {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Sanyojak Guidance Quick Ask Button */}
              {onAskMitra && (
                <div className="bg-emerald-500/[0.03] p-4.5 rounded-2xl border border-emerald-500/10 flex flex-col gap-2.5 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#008069] animate-pulse" />
                    <span className="text-[10px] font-black text-[#008069] uppercase tracking-widest">
                      {lang === "hi" ? "योजना से जुड़े सवाल पूछें (Ask Mitra AI)" : "Ask Mitra AI Sanyojak"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                    {lang === "hi" 
                      ? "क्या आप जानना चाहते हैं कि इस योजना का आवेदन कैसे करें? इस योजना के बारे में हमारे AI Sanyojak से सीधा सवाल पूछें!" 
                      : "Do you have questions about the application or criteria? Chat directly with the AI support team!"
                    }
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskMitra(schemeName);
                    }}
                    className="w-full py-3 bg-[#008069] hover:bg-[#006e5a] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all focus:ring-2 focus:ring-[#008069]/30 flex items-center justify-center gap-2 h-11 cursor-pointer"
                  >
                    <span>💬 {lang === "hi" ? "AI से सवाल पूछें" : "Chat with AI"}</span>
                  </button>
                </div>
              )}

              {/* Step-by-Step Form Guides Action triggers */}
              {(onStartSimulator || onShowFormAudit) && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {onStartSimulator && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Call with dummy structure mimicking a form if none specified
                        onStartSimulator({ name: schemeName });
                      }}
                      className="py-3 bg-white border border-[#008069] text-[#008069] font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-green-50 flex items-center justify-center gap-1.5 h-11 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "फ़ॉर्म गाइड" : "Form Guide"}</span>
                    </button>
                  )}
                  {onShowFormAudit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowFormAudit();
                      }}
                      className="py-3 bg-white border border-blue-600 text-blue-600 font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-blue-50 flex items-center justify-center gap-1.5 h-11 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "रिजेक्शन चेक" : "Audit Form"}</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR Code sharing overlay popup */}
      <AnimatePresence>
        {showQrModal && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowQrModal(false);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 cursor-default"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col p-6 text-center relative"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
              >
                ✕
              </button>

              {/* Icon & Title */}
              <div className="flex flex-col items-center gap-2 mt-4 mb-3">
                <div className="w-12 h-12 bg-[#008069]/10 rounded-2xl flex items-center justify-center border border-emerald-50">
                  <QrCode className="w-6 h-6 text-[#008069]" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mt-1">
                  {lang === "hi" ? "योजना QR कोड" : "Scheme QR Code"}
                </h3>
                <span className="bg-[#008069]/10 text-[#008069] text-[9px] uppercase font-black tracking-wider px-3.5 py-1 rounded-full">
                  {category}
                </span>
              </div>

              {/* Scheme Name */}
              <p className="text-xs font-black text-slate-800 mb-4 line-clamp-2 px-1">
                {activeName}
              </p>

              {/* QR Code Container */}
              <div className="bg-slate-50 p-4 rounded-3xl border border-gray-100 inline-flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                <img 
                  src={qrCodeUrl} 
                  alt="Scheme QR Code" 
                  className="w-44 h-44 rounded-xl object-contain shadow-xs"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Info Tips */}
              <div className="mb-6 px-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-normal">
                  {lang === "hi" 
                    ? "इसे स्कैन करके सीधे मोबाइल पर योजना देखें!"
                    : "Scan to check scheme details on your mobile!"
                  }
                </p>
                <p className="text-[11px] font-bold text-gray-500 leading-normal mt-1 max-w-[240px] mx-auto">
                  {lang === "hi"
                    ? "Doston ke sath share karein aur dhyan rahe: Future Mitra completely secure aur safe hai! 🤝"
                    : "Share with friends and remember: Future Mitra is completely safe and secure! 🤝"
                  }
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full py-3.5 bg-[#008069] hover:bg-[#006e5a] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-green-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer h-12 border-0"
                >
                  <Share2 className="w-4 h-4 text-white" />
                  <span>{lang === "hi" ? "QR डाउनलोड करें" : "Download QR Image"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-500 font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-3xs hover:bg-gray-100 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {lang === "hi" ? "बंद करें" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
