import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  FileText,
  Download,
  Calendar,
  Tag,
  Clock,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { UserDocument } from "../types";

interface DocumentPreviewModalProps {
  document: UserDocument;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: userDoc,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect document type
    const isPdfType =
      userDoc.type?.toLowerCase().includes("pdf") ||
      userDoc.url?.toLowerCase().includes(".pdf") ||
      userDoc.url?.startsWith("data:application/pdf");
    setIsPdf(!!isPdfType);
    
    // Reset transforms when document changes
    setScale(1);
    setRotation(0);
    setIsLoading(true);
  }, [userDoc]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Convert binary data url or download file safely
  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = userDoc.url;
    link.download = userDoc.name || "downloaded-document";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden animate-fade-in">
        
        {/* Background Click to dismiss */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-slate-900 border border-slate-800 text-white w-full shadow-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-300 z-10 ${
            isFullscreen 
              ? "h-screen w-screen md:p-0 rounded-none border-none" 
              : "h-full md:h-[85vh] max-w-6xl md:rounded-[2.5rem]"
          }`}
        >
          {/* Main Preview Screen (Left Column) */}
          <div className="flex-1 flex flex-col bg-slate-950 relative border-b md:border-b-0 md:border-r border-slate-800 h-[65%] md:h-full">
            
            {/* Inner Header for controls */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
              <div className="text-left max-w-[60%] pointer-events-auto">
                <span className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {isPdf ? "PDF Document" : "Image View"}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate mt-1.5 drop-shadow-md">
                  {userDoc.name}
                </h3>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 border border-white/5 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl">
                {!isPdf && (
                  <>
                    <button
                      onClick={handleZoomOut}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-slate-400 px-1 w-10 text-center select-none">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <button
                      onClick={handleRotate}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                  </>
                )}
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <a
                  href={userDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white cursor-pointer"
                  title="Open in new window"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Viewer Stage Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative pt-20">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 z-10">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    AI Viewer Loading...
                  </p>
                </div>
              )}

              {isPdf ? (
                <div className="w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                  <iframe
                    src={`${userDoc.url}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full border-none"
                    onLoad={() => setIsLoading(false)}
                    title={userDoc.name}
                  />
                </div>
              ) : (
                <div 
                  className="transition-all duration-300 ease-out select-none cursor-grab active:cursor-grabbing max-h-full max-w-full flex items-center justify-center"
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={userDoc.url}
                    alt={userDoc.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl bg-zinc-900 border border-white/5"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Mobile Bottom Bar hint */}
            <div className="md:hidden flex justify-center py-2 bg-slate-950/90 border-t border-slate-900">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                Swipe up or tap right side for details
              </p>
            </div>
          </div>

          {/* Details & Info Sidebar (Right Column) */}
          <div className="w-full md:w-80 p-6 sm:p-8 flex flex-col justify-between bg-slate-900 overflow-y-auto h-[35%] md:h-full gap-6">
            
            <div className="space-y-6">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <FileText className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-tight">
                      Mitra Vault doc
                    </h4>
                    <p className="text-[9px] font-black text-slate-400 tracking-wider uppercase mt-0.5">
                      Encrypted file
                    </p>
                  </div>
                </div>
                
                {/* Close Button top-right inline */}
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 flex items-center justify-center text-slate-400 cursor-pointer transition-colors"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Information List */}
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-emerald-400" /> CATEGORY
                    </span>
                    <span className="bg-[#008069]/20 text-[#008069] font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-widest border border-[#008069]/20">
                      {userDoc.category || "General"}
                    </span>
                  </div>

                  <div className="h-[1px] bg-white/5" />

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-blue-400" /> UPLOADED
                    </span>
                    <span className="text-slate-300 text-xs font-bold">
                      {new Date(userDoc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {userDoc.expiryDate && (
                    <>
                      <div className="h-[1px] bg-white/5" />
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-rose-400" /> EXPIRY DATE
                        </span>
                        <span className="text-slate-300 text-xs font-bold flex items-center gap-1">
                          {new Date(userDoc.expiryDate).toLocaleDateString()}
                          {Date.now() > userDoc.expiryDate && (
                            <AlertCircle className="w-3 h-3 text-red-500 animate-pulse" />
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Secure Badge */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                      Mitra Secure Vault
                    </h5>
                    <p className="text-[10px] text-emerald-200/60 leading-normal mt-0.5">
                      Sanjeet bhai, ye document AES-256 level and Firebase cloud store encryption se surakshit hai.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Download Button */}
            <div className="space-y-2 mt-auto">
              <button
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#008069] to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/20 transform active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Document
              </button>
              
              <p className="text-[8.5px] font-black text-center text-slate-500 uppercase tracking-widest leading-normal">
                🔒 Protected by Future Mitra Biometric Shield
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
};
