import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, MonitorDown, MonitorUp, StopCircle } from 'lucide-react';
import { ai } from '../services/geminiService';
import { Modality } from '@google/genai';

interface LiveCallProps {
  onClose: () => void;
}

export const LiveCall: React.FC<LiveCallProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [volume, setVolume] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  
  // Audio Queue for playback
  const nextStartTimeRef = useRef<number>(0);

  const startCall = async () => {
    if (!ai) return;

    try {
      // 1. Setup Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      // 2. Setup Session
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            startMicrophone(sessionPromise);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playPCM(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              // Interruption logic: stop current playback
              // For simplicity, we just clear the upcoming queue in a real app
              nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
          },
          onclose: () => {
            cleanup();
            onClose();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            cleanup();
            onClose();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are 'Form Mitra AI', a helpful assistant for Indian citizens. Speak in Hinglish. You are in a live voice call. When the user shares their screen, you will receive images of it. Use this visual context to help them fill forms, explain fields, or point out errors. Be concise and friendly.",
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start call:", err);
      onClose();
    }
  };

  const startMicrophone = async (sessionPromise: Promise<any>) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);

      processor.onaudioprocess = (e) => {
        if (isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for animation
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        setVolume(Math.sqrt(sum / inputData.length));

        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }

        // Send to Gemini
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionPromise.then(session => {
          if (session) {
            session.sendRealtimeInput({
              audio: {
                data: base64Data,
                mimeType: 'audio/pcm;rate=16000'
              }
            });
          }
        });
      };
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing is not supported in this browser or environment. Make sure you are using HTTPS and the browser allows screen capture.");
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
        videoRef.current.play();
      }

      // Handle stream end (user clicks "Stop sharing" in browser)
      screenStream.getTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Start frame capture loop
      startFrameCapture();
    } catch (err) {
      console.error("Screen share failed:", err);
      setIsScreenSharing(false);
    }
  };

  const startFrameCapture = () => {
    const captureFrame = () => {
      if (!isScreenSharing || !canvasRef.current || !videoRef.current || !sessionRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set dimensions
      canvas.width = 640; // Lower res for better performance
      canvas.height = (video.videoHeight / video.videoWidth) * 640;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Frame = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      sessionRef.current.sendRealtimeInput({
        image: {
          data: base64Frame,
          mimeType: 'image/jpeg'
        }
      });
    };

    // Capture every 2 seconds
    captureIntervalRef.current = window.setInterval(captureFrame, 2000);
  };

  const stopScreenShare = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  const playPCM = (base64Data: string) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed' || !isSpeakerOn) return;

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pcmData = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 0x7FFF;
    }

    const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 16000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
  };

  const cleanup = () => {
    setIsConnected(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
    }
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
  };

  useEffect(() => {
    startCall();
    return cleanup;
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-8 backdrop-blur-xl"
    >
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Live Call</span>
        </div>
        <button 
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: isConnected ? [1, 1.2, 1] : 1,
              opacity: isConnected ? [0.3, 0.6, 0.3] : 0.2
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-[#008069] rounded-full blur-3xl"
          />
          <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#008069] to-[#00a884] flex items-center justify-center shadow-2xl border-4 border-white/10">
             <div className="flex gap-2 items-center">
               {[...Array(5)].map((_, i) => (
                 <motion.div 
                  key={i}
                  animate={{ 
                    height: isConnected ? [10, 40 + (volume * 100), 10] : 10 
                  }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  className="w-1.5 bg-white rounded-full opacity-80"
                 />
               ))}
             </div>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-tight">Form Mitra AI</h2>
          <p className="text-white/50 font-medium mt-1">
            {isConnected ? "Listening..." : "Connecting..."}
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button 
          onClick={toggleScreenShare}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-blue-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isScreenSharing ? <StopCircle className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
        </button>

        <button 
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-all active:scale-95"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        <button 
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isSpeakerOn ? 'bg-yellow-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-4">
        Hinglish AI Voice Assistant
      </p>
    </motion.div>
  );
};
