import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Award, Sparkles, Check, ArrowRight, User as UserIcon, Calendar, Compass, Crown, Shield, Star, Zap, Lock, Download, Share2, RotateCw } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';

interface StreakLeaderboardProps {
  userProfile: UserProfile;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onNavigate?: (target: string) => void;
}

interface LeaderboardUser {
  id: string;
  name: string;
  state: string;
  occupation: 'Farmer' | 'Student' | 'Worker' | 'Unemployed' | 'Normal' | 'Naukri' | 'Other';
  streak: number;
  isCurrentUser?: boolean;
}

// Function to return level-specific titles, badges, and designs to reward the user
export const getAchievementBadge = (level: number) => {
  if (level >= 5) {
    return {
      title: "Diamond Maha Mitra",
      subtitle: "Legendary Achiever Status",
      desc: "Aap hamesha active rehte hain aur har daily mission purra karte hain! Aap sach mein adbhut hain!",
      color: "from-cyan-400 via-indigo-500 to-purple-600 shadow-cyan-200/50",
      textColor: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-100",
      icon: Crown,
      badgeText: "💎 Diamond Badge UNLOCKED"
    };
  } else if (level === 4) {
    return {
      title: "Gold Mitra",
      subtitle: "Expert Daily Champion",
      desc: "30+ Days continuous checklist verify kiya! Asli Mitra champion.",
      color: "from-amber-400 to-yellow-600 shadow-yellow-200/50",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-100",
      icon: Trophy,
      badgeText: "👑 Gold Badge UNLOCKED"
    };
  } else if (level === 3) {
    return {
      title: "Silver Mitra",
      subtitle: "Dedicated Daily Scholar",
      desc: "20+ Days regular login aur practice form complete kiya!",
      color: "from-slate-300 to-zinc-500 shadow-slate-200/50",
      textColor: "text-zinc-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
      icon: Star,
      badgeText: "⭐ Silver Badge UNLOCKED"
    };
  } else if (level === 2) {
    return {
      title: "Bronze Mitra",
      subtitle: "Rising Daily Achiever",
      desc: "10+ Days continuous dedication! Daily practice forms se sapno ki shuruaat ho chuki hai.",
      color: "from-orange-400 to-amber-600 shadow-orange-200/50",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      icon: Shield,
      badgeText: "🛡️ Bronze Badge UNLOCKED"
    };
  } else {
    // Level 1
    return {
      title: "Naya Mitra",
      subtitle: "Fresh Starter",
      desc: "Daily Mission completes karke continuous streak banayein aur level up karein!",
      color: "from-emerald-400 to-teal-600 shadow-emerald-200/50",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      icon: Zap,
      badgeText: "⚡ Level 1 Mitra"
    };
  }
};

// Social share card canvas renderer
export const drawSocialShareCard = (name: string, level: number, badgeTitle: string, subtitle: string, desc: string, streak: number, rank: number) => {
  return new Promise<string>((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // 1. Draw rich gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#0a302a'); // Very rich brand green
    bgGrad.addColorStop(0.5, '#004d40'); // Dark teal
    bgGrad.addColorStop(1, '#008069'); // Mitra brand green
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative radial aura/glow in the center behind badge
    const radialGlow = ctx.createRadialGradient(540, 420, 50, 540, 420, 300);
    radialGlow.addColorStop(0, 'rgba(251, 191, 36, 0.25)'); // Golden glowing center
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.beginPath();
    ctx.arc(540, 420, 300, 0, Math.PI * 2);
    ctx.fill();

    // Subtle line patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    for (let r = 250; r <= 450; r += 50) {
      ctx.beginPath();
      ctx.arc(540, 420, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Premium Borders
    ctx.strokeStyle = '#f59e0b'; // Amber-500
    ctx.lineWidth = 16;
    ctx.strokeRect(40, 40, 1000, 1000);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 52, 976, 976);

    // Corner decorative brackets
    ctx.fillStyle = '#f59e0b';
    const bracketSize = 40;
    ctx.fillRect(32, 32, bracketSize, 32);
    ctx.fillRect(32, 32, 32, bracketSize);

    ctx.fillRect(1080 - 32 - bracketSize, 32, bracketSize, 32);
    ctx.fillRect(1080 - 32 - 32, 32, 32, bracketSize);

    ctx.fillRect(32, 1080 - 32 - 32, bracketSize, 32);
    ctx.fillRect(32, 1080 - 32 - bracketSize, 32, bracketSize);

    ctx.fillRect(1080 - 32 - bracketSize, 1080 - 32 - 32, bracketSize, 32);
    ctx.fillRect(1080 - 32 - 32, 1080 - 32 - bracketSize, 32, bracketSize);

    // 3. Header Texts
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('⭐ MITRA APP SCHEME CHAMPION ⭐', 540, 110);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 16px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('SABSE TEZ, SABSE ACTIVE SATHI', 540, 155);

    // 4. Central Badge Shape
    // Shiny outer ring
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(540, 420, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dotted accent ring
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(540, 420, 104, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Choose emoji for level
    const emojiMap: Record<number, string> = {
      1: '⚡',
      2: '🛡️',
      3: '⭐',
      4: '👑',
      5: '💎'
    };
    const emoji = emojiMap[Math.min(level, 5)] || '🏆';
    ctx.font = '100px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.fillText(emoji, 540, 425);

    // 5. Achievement Name info
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(badgeTitle.toUpperCase(), 540, 595);

    ctx.fillStyle = '#4ade80'; // Bright modern safety emerald
    ctx.font = 'bold 22px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(`LEVEL ${level} UNLOCKED • ${subtitle.toUpperCase()}`, 540, 645);

    // 6. Horizontal separator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(340, 680, 400, 3);

    // 7. Recipient User Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(name || 'Dost Mitra', 540, 735);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 20px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('Checklist verify karke benchmark consistency haasil kiya!', 540, 780);

    // 8. Rounded Stats Panels (Active Streak / Leaderboard Rank)
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // ACTIVE STREAK CAPSULE (Left)
    ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 2.5;
    drawRoundedRect(190, 825, 330, 105, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f97316'; // Vivid level 400 Orange
    ctx.font = '900 36px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(`${streak} DAYS`, 355, 865);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 13px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('DAILY LOGIN STREAK 🔥', 355, 900);

    // GLOBAL RANK CAPSULE (Right)
    ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 2.5;
    drawRoundedRect(560, 825, 330, 105, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399'; // Mint 400 Green
    ctx.font = '900 36px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(`#${rank > 0 ? rank : '1'}`, 725, 865);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 13px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('GLOBAL MITRA RANK 🥇', 725, 900);

    // 9. Footer Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '600 16px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('Digital India Mission Sathi • Play & Learn Daily', 540, 985);

    ctx.fillStyle = '#38bdf8'; // sky blue
    ctx.font = '900 13px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('MITRA APP PAR CHAL RAHI HAI SARKARI YOJNA KI TAIYARI', 540, 1012);

    resolve(canvas.toDataURL('image/png'));
  });
};

// Highly stylized benchmark competitors matching the application target demographics
const DEFAULT_COMPETITORS: LeaderboardUser[] = [
  { id: 'comp-1', name: 'Rajesh Mishra', state: 'Bihar', occupation: 'Worker', streak: 14 },
  { id: 'comp-2', name: 'Priya Kumari', state: 'Madhya Pradesh', occupation: 'Student', streak: 12 },
  { id: 'comp-3', name: 'Amit Singh', state: 'Uttar Pradesh', occupation: 'Worker', streak: 9 },
  { id: 'comp-4', name: 'Sukhvinder Paaji', state: 'Punjab', occupation: 'Student', streak: 8 },
  { id: 'comp-5', name: 'Rani Patel', state: 'Gujarat', occupation: 'Student', streak: 5 },
  { id: 'comp-6', name: 'Vijay Kumar', state: 'Rajasthan', occupation: 'Naukri', streak: 3 },
];

const badgeMilestones = [
  {
    id: "streak-7",
    name: "7-Day Bronze Star",
    milestone: 7,
    description: "Bhai, pure ek saptah ka anokha consistency check-in!",
    icon: Star,
    bgColor: "from-orange-50/80 to-amber-50/50",
    borderColor: "border-orange-100",
    iconColor: "bg-orange-500 text-white shadow-orange-100",
  },
  {
    id: "streak-15",
    name: "15-Day Silver Shield",
    milestone: 15,
    description: "Aapke sapno ki raah mein 15 dinon ka majboot shield!",
    icon: Shield,
    bgColor: "from-slate-100/90 to-zinc-50/50",
    borderColor: "border-slate-200",
    iconColor: "bg-slate-500 text-white shadow-slate-100",
  },
  {
    id: "streak-30",
    name: "30-Day Gold Trophy",
    milestone: 30,
    description: "Pure ek mahine ka asar! Aap sacche Daily Champion hain.",
    icon: Trophy,
    bgColor: "from-amber-50 to-yellow-50/50",
    borderColor: "border-amber-200",
    iconColor: "bg-amber-500 text-white shadow-amber-105",
  },
  {
    id: "streak-100",
    name: "100-Day Maha-Mitra",
    milestone: 100,
    description: "Shatak! Century complete karke aapne legend status hasil kiya.",
    icon: Crown,
    bgColor: "from-cyan-50 to-emerald-50/30",
    borderColor: "border-cyan-200",
    iconColor: "bg-cyan-500 text-white shadow-cyan-105",
  }
];

export const StreakLeaderboard: React.FC<StreakLeaderboardProps> = ({
  userProfile,
  onUpdateProfile,
  onNavigate
}) => {
  const [claimedToday, setClaimedToday] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevelReached, setNewLevelReached] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'community'>('all');
  const [globalUsers, setGlobalUsers] = useState<LeaderboardUser[]>([]);
  const [fetchingGlobal, setFetchingGlobal] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  // Social Share states
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGeneratingShareImage, setIsGeneratingShareImage] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);

  const handleShareAchievement = async (badgeData: any) => {
    setIsGeneratingShareImage(true);
    try {
      const liveRank = currentUserRank || 1;
      const liveStreak = userProfile.streak || 0;
      const liveName = userProfile.name || 'Apna Mitra';
      const url = await drawSocialShareCard(
        liveName,
        newLevelReached,
        badgeData.title,
        badgeData.subtitle,
        badgeData.desc,
        liveStreak,
        liveRank
      );
      setShareImageUrl(url);
      setShowSharePreview(true);
    } catch (err) {
      console.error("Error generating share card", err);
    } finally {
      setIsGeneratingShareImage(false);
    }
  };

  // Real-time Firestore Sync for Global Leaderboard sorted by streak
  useEffect(() => {
    setFetchingGlobal(true);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('streak', 'desc'), firestoreLimit(12));
    const currentUid = auth.currentUser?.uid || '';

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: LeaderboardUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name) {
          fetched.push({
            id: doc.id,
            name: data.name,
            state: data.state || 'India',
            occupation: (data.occupation || 'Normal') as any,
            streak: Number(data.streak || 0),
            isCurrentUser: doc.id === currentUid
          });
        }
      });
      setGlobalUsers(fetched);
      setFetchingGlobal(false);
    }, (error) => {
      console.warn("Ordered onSnapshot failed, attempting unordered fallback:", error);
      // Fallback: fetch without orderBy in case index setup is needed or field type index mismatch
      const unsubFallback = onSnapshot(usersRef, (snapshot) => {
        const fetched: LeaderboardUser[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name) {
            fetched.push({
              id: doc.id,
              name: data.name,
              state: data.state || 'India',
              occupation: (data.occupation || 'Normal') as any,
              streak: Number(data.streak || 0),
              isCurrentUser: doc.id === currentUid
            });
          }
        });
        // Sort in memory
        fetched.sort((a, b) => b.streak - a.streak);
        setGlobalUsers(fetched);
        setFetchingGlobal(false);
      }, (err) => {
        setFetchingGlobal(false);
        handleFirestoreError(err, OperationType.LIST, 'users');
      });

      return () => unsubFallback();
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const todayStr = new Date().toISOString().split('T')[0];
  const claimKey = `mitra_streak_claimed_${todayStr}_${userProfile.phoneNumber || 'guest'}`;

  useEffect(() => {
    const isClaimed = localStorage.getItem(claimKey) === 'true';
    setClaimedToday(isClaimed);
  }, [claimKey]);

  // Handle daily claim action
  const handleClaimStreak = () => {
    if (claimedToday) return;

    const currentStreak = userProfile.streak || 0;
    const newStreak = currentStreak + 1;

    // Persist to parent handler which automatically saves to scale database
    onUpdateProfile?.({
      streak: newStreak,
      lastLogin: Date.now()
    });

    localStorage.setItem(claimKey, 'true');
    setClaimedToday(true);

    // If new streak is a multiple of 10, show the Level Up Modal, otherwise the normal celebration
    if (newStreak > 0 && newStreak % 10 === 0) {
      setNewLevelReached(Math.floor(newStreak / 10) + 1);
      setShowLevelUpModal(true);
    } else {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
      }, 4000);
    }
  };

  // Compile full user standings dynamically sorted based on their live streak field
  const rawStreak = userProfile.streak || 0;
  const currentUserEntry: LeaderboardUser = {
    id: 'current-user',
    name: userProfile.name || 'Aap (You)',
    state: userProfile.state || 'India',
    occupation: userProfile.occupation || 'Normal',
    streak: rawStreak,
    isCurrentUser: true
  };

  // Build composite user list (retaining real database users + dummy competitors as dynamic high-quality buffer)
  const compiledUsers: LeaderboardUser[] = [];

  // Add the real Firestore users retrieved in real-time
  globalUsers.forEach(u => {
    if (u.id === auth.currentUser?.uid || u.isCurrentUser) {
      // Skip current user to allow fresh state override below
    } else {
      compiledUsers.push({
        ...u,
        isCurrentUser: false
      });
    }
  });

  // Inject current user with their active UI state
  compiledUsers.push(currentUserEntry);

  // Buffer with default competitors to ensure diverse representation
  DEFAULT_COMPETITORS.forEach(c => {
    const alreadyExists = compiledUsers.some(
      existing => existing.name.toLowerCase() === c.name.toLowerCase()
    );
    if (!alreadyExists) {
      compiledUsers.push(c);
    }
  });

  // Filter based on selected tab ('all' vs 'community' group) and sort
  const sortedStandings = compiledUsers
    .filter(u => activeTab === 'all' || u.occupation === userProfile.occupation || u.isCurrentUser)
    // Sort by streak descending
    .sort((a, b) => b.streak - a.streak);

  // Determine current position on the board
  const currentUserRank = sortedStandings.findIndex(u => u.isCurrentUser) + 1;

  // Next level milestone calculation (levels increase every 10 streaks)
  const currentLevel = Math.floor(rawStreak / 10) + 1;
  const nextLevelMilestone = currentLevel * 10;
  const progressToNextLevel = Math.min(((rawStreak % 10) / 10) * 100, 100);

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 flex flex-col gap-6 relative overflow-hidden" id="streak-leaderboard-container">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-10 -mt-10" />

      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-100 animate-pulse">
            <Trophy className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Mitra Leaderboard</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tight">Daily Streaks ka Mukabla</p>
          </div>
        </div>

        {/* Current level indicator */}
        <div className="flex flex-col items-end">
          <button 
            type="button"
            onClick={() => {
              setNewLevelReached(currentLevel);
              setShowLevelUpModal(true);
            }}
            className="text-[9px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50 flex items-center gap-1 hover:bg-amber-100/50 active:scale-95 transition-all cursor-pointer shadow-sm animate-pulse"
            title="Apna Achievement Badge Dekhein"
          >
            <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
            Level {currentLevel} 🛈
          </button>
        </div>
      </div>

      {/* Reward Progress Bar */}
      <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/[0.02] border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Aapka Streak: {rawStreak} Days</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Next Level: {nextLevelMilestone} Days</span>
        </div>

        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressToNextLevel}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        {/* Dynamic prompt to claim or keep going */}
        <div className="flex justify-between items-center gap-4 mt-1">
          <span className="text-[10px] text-gray-400 leading-tight font-medium flex-1">
            {claimedToday 
              ? "Kal check-in kar ke streak barkarar rakhein!" 
              : "Aaj ka streak point claim karein aur leaderboard par upar badhein!"}
          </span>

          <button
            onClick={handleClaimStreak}
            disabled={claimedToday}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0 flex items-center gap-1.5",
              claimedToday 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200/50 cursor-pointer active:scale-95"
            )}
          >
            {claimedToday ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Done ✅
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 fill-current" />
                Claim Today 🔥
              </>
            )}
          </button>
        </div>
      </div>

      {/* Leaderboard tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'all' 
              ? "bg-[#008069] text-white" 
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          All India
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={cn(
            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'community' 
              ? "bg-[#008069] text-white" 
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          {userProfile.occupation || 'Apna'} Group
        </button>
      </div>

      {/* Standings List */}
      <div className="flex flex-col gap-2">
        {fetchingGlobal && (
          <div className="flex flex-col gap-2 animate-pulse" id="leaderboard-skeleton-loader">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={`leaderboard-skeleton-${i}`}
                className="p-3 rounded-2xl border border-gray-100 bg-white flex items-center justify-between"
              >
                <div className="flex items-center gap-3 w-full">
                  {/* Rank badge skeleton */}
                  <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                  
                  {/* Text meta skeleton */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="h-3.5 bg-gray-200 rounded-md w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded-md w-1/4" />
                  </div>
                </div>

                {/* Streak badge skeleton */}
                <div className="w-14 h-8 bg-gray-50 rounded-xl shrink-0 border border-gray-100" />
              </div>
            ))}
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {sortedStandings.slice(0, 10).map((entrant, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            
            return (
              <motion.div
                key={entrant.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-3 rounded-2xl border flex items-center justify-between transition-all",
                  entrant.isCurrentUser 
                    ? "bg-indigo-50/50 border-indigo-200 shadow-inner ring-1 ring-indigo-100" 
                    : "bg-white border-gray-50 hover:bg-gray-50/60"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 select-none",
                    rank === 1 && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                    rank === 2 && "bg-slate-400/10 text-slate-500 border border-slate-400/20",
                    rank === 3 && "bg-amber-700/10 text-amber-800 border border-amber-700/20",
                    rank > 3 && "bg-gray-50 text-gray-400 border border-gray-100"
                  )}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                  </div>

                  {/* Profile info */}
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-xs font-bold leading-tight flex items-center gap-1.5 text-gray-800 truncate",
                      entrant.isCurrentUser && "text-indigo-900 font-extrabold"
                    )}>
                      {entrant.name}
                      {entrant.isCurrentUser && (
                        <span className="bg-indigo-500 text-white text-[7px] font-black uppercase tracking-wider px-1 rounded">Aap (You)</span>
                      )}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium leading-none mt-1 truncate">
                      {entrant.occupation} • {entrant.state}
                    </span>
                  </div>
                </div>

                {/* Streak number */}
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-400/5 to-amber-400/5 border border-orange-500/10 rounded-xl px-2.5 py-1.5 ml-2">
                  <Flame className={cn("w-4 h-4 fill-current", isTop3 ? "text-orange-500" : "text-gray-400")} />
                  <span className="text-xs font-black text-gray-800 tracking-tight">{entrant.streak}d</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Achievement Section */}
      <div className="border-t border-gray-100 pt-5 mt-2" id="streak-achievements-section">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-[#008069]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#008069]">Aapke Badges & Milestones</span>
          </div>
          <span className="text-[9px] font-black text-[#008069] bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full select-none shadow-sm">
            {badgeMilestones.filter(b => rawStreak >= b.milestone).length} / {badgeMilestones.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {badgeMilestones.map((badge) => {
            const isUnlocked = rawStreak >= badge.milestone;
            const IconComponent = badge.icon;
            
            return (
              <motion.button
                key={badge.id}
                type="button"
                whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                whileTap={{ scale: isUnlocked ? 0.98 : 1 }}
                onClick={() => {
                  if (isUnlocked) {
                    setSelectedBadge(badge);
                  }
                }}
                className={cn(
                  "p-3 rounded-2xl border text-left relative overflow-hidden transition-all flex flex-col justify-between min-h-[96px] w-full focus:outline-none focus:ring-2 focus:ring-[#008069]/40",
                  isUnlocked 
                    ? cn("bg-gradient-to-br cursor-pointer shadow-sm hover:shadow-md", badge.bgColor, badge.borderColor)
                    : "bg-gray-50/50 border-gray-100 text-gray-400 select-none cursor-default"
                )}
                title={isUnlocked ? `${badge.name} - Goal Achieved!` : `${badge.name} - Achieved at ${badge.milestone} days`}
              >
                {/* Background glowing soft radial accent for unlocked badges */}
                {isUnlocked && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/45 rounded-full blur-lg pointer-events-none" />
                )}

                <div className="flex items-start justify-between w-full">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                    isUnlocked ? badge.iconColor : "bg-gray-100 border border-gray-200/50 text-gray-300"
                  )}>
                    <IconComponent className={cn("w-4.5 h-4.5", isUnlocked && "animate-pulse")} />
                  </div>

                  {isUnlocked ? (
                    <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] select-none">
                      Earned
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase text-gray-400 bg-gray-100 border border-gray-200/40 px-1.5 py-0.5 rounded select-none">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </div>
                  )}
                </div>

                <div className="mt-2 min-w-0 w-full">
                  <h5 className={cn(
                    "text-[10px] font-black tracking-tight truncate",
                    isUnlocked ? "text-gray-900" : "text-gray-400"
                  )}>
                    {badge.name}
                  </h5>
                  <p className="text-[9px] leading-tight text-gray-400 font-semibold truncate mt-0.5">
                    {isUnlocked ? "Tap to view prize! 🎉" : `${badge.milestone - rawStreak} days left`}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Celebration Popup Overlays */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            id="celebration-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 max-w-xs text-center flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg mx-auto animate-bounce">
                <Flame className="w-8 h-8 fill-current" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-gray-900 uppercase">Shabash, Dost! 🎉</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Aapka streak **{rawStreak} Days** ho gaya hai! Leaderboard par aapka Rank **#{currentUserRank}** hai.
                </p>
              </div>
              <button 
                onClick={() => setShowCelebration(false)}
                className="w-full bg-[#008069] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform cursor-pointer"
                id="close-celebration-btn"
              >
                Chalo Aage Barhein
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Achievement Celebration Overlay */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6"
            id="badge-celebration-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-6 max-w-xs text-center flex flex-col items-center gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#008069] to-emerald-400" />
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md mb-1.5",
                selectedBadge.iconColor.split(' ')[0]
              )}>
                {React.createElement(selectedBadge.icon, { className: "w-8 h-8 animate-bounce text-white" })}
              </div>
              
              <div className="space-y-1">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Unlocked Milestone Badge
                </span>
                <h4 className="text-base font-black text-gray-900 uppercase mt-2">{selectedBadge.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                  {selectedBadge.milestone} Days Completed
                </p>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-2.5 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                  &ldquo;{selectedBadge.description}&rdquo;
                </p>
              </div>

              <button 
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full bg-[#008069] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#006653] active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Gazab, Sukriya! 💥
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magnificent Level Up Modal */}
      <AnimatePresence>
        {showLevelUpModal && (() => {
          const badgeData = getAchievementBadge(newLevelReached);
          const IconComponent = badgeData.icon;
          
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6"
              id="level-up-modal-overlay"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 260 }}
                className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-6 relative overflow-hidden"
                id="level-up-modal-container"
              >
                {/* Decorative Glowing Rings */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent -z-10" />
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

                {/* Sparkling Icon Header */}
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300 rounded-[2.5rem] blur-xl opacity-45 scale-110"
                  />
                  
                  <div className={cn(
                    "w-24 h-24 rounded-[2.5rem] bg-gradient-to-br flex items-center justify-center text-white shadow-xl relative z-10 border-4 border-white",
                    badgeData.color
                  )}>
                    <IconComponent className="w-11 h-11 animate-pulse" />
                  </div>
                  
                  {/* Floating Microsparkles */}
                  <div className="absolute -top-2 -right-2 text-amber-500 animate-bounce">
                    <Sparkles className="w-6 h-6 fill-current" />
                  </div>
                  <div className="absolute -bottom-1 -left-3 text-indigo-500 animate-pulse">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                </div>

                {/* Level Tag */}
                <div className="space-y-1 mt-2">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-200/50 px-3 py-1 rounded-full">
                    LEVEL UP UNLOCKED!
                  </span>
                  <h3 className="text-3.5xl font-black text-gray-900 leading-tight tracking-tight mt-2">
                    Level {newLevelReached} Reached
                  </h3>
                  <p className="text-xs text-indigo-600 font-extrabold tracking-widest uppercase">
                    {badgeData.badgeText}
                  </p>
                </div>

                {/* Badge Info Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full">
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                    {badgeData.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {badgeData.subtitle}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-semibold">
                    &ldquo;{badgeData.desc}&rdquo;
                  </p>
                </div>

                {/* Congratulatory bilingual text */}
                <div className="text-xs text-gray-400 font-medium">
                  Superb progress, dost! Aapki continuous daily practice aur active dedication ki wajah se aapka rank aur badh raha hai!
                </div>

                {/* Share Preview Section (Displays the generated high-quality social image) */}
                {showSharePreview && shareImageUrl ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full flex flex-col gap-3.5 border-t border-gray-100 pt-5 mt-1"
                  >
                    <span className="text-[9px] font-black text-[#008069] uppercase tracking-widest">Aapka Social Share Badge Poster</span>
                    <div className="relative aspect-square w-full max-w-[240px] mx-auto rounded-[2rem] overflow-hidden border-2 border-amber-300 shadow-md">
                      <img 
                        src={shareImageUrl} 
                        alt="Achievement Share Poster" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 backdrop-blur-xs py-2 text-center text-[8px] font-black uppercase text-amber-400 tracking-wider">
                        Tap and hold to save on Mobile 📱
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full">
                      <a 
                        href={shareImageUrl} 
                        download={`mitra_achievement_level_${newLevelReached}.png`}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-amber-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Image
                      </a>
                      <button 
                        onClick={() => setShowSharePreview(false)}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full flex flex-col gap-2.5">
                    <button 
                      onClick={() => handleShareAchievement(badgeData)}
                      disabled={isGeneratingShareImage}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2.5xl text-xs font-black uppercase tracking-widest hover:brightness-105 active:scale-[0.98] transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      id="share-achievement-btn"
                    >
                      {isGeneratingShareImage ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Generating Snapshot...</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 text-white/90" />
                          <span>Share Achievement Poster</span>
                        </>
                      )}
                    </button>

                    {/* Close CTA */}
                    <button 
                      onClick={() => setShowLevelUpModal(false)}
                      className="w-full bg-[#008069] text-white py-4 rounded-2.5xl text-xs font-black uppercase tracking-widest hover:bg-[#006653] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-emerald-200/50 cursor-pointer"
                      id="close-levelup-btn"
                    >
                      Shabaash! Aage Barhein 🔥
                    </button>
                    
                    {/* Add a direct trigger if needed, or share preset link */}
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Back foot linking to App Tracker screen */}
      <div 
        onClick={() => onNavigate?.('tracker')}
        className="text-[10px] text-gray-400 font-medium leading-tight flex justify-between items-center cursor-pointer border-t border-gray-100/80 pt-4 hover:text-[#008069] transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#008069] transition-colors" />
          <span>Daily Mission completes karke continuous streak point kamaein!</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#008069] group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </div>
  );
};
