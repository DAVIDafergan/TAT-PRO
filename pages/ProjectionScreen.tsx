import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Campaign, Representative, Donation, Lottery, CampaignGroup } from '../types';
import { mockRanks } from '../services/mockData';
import { 
  Trophy, ArrowRight, Activity, Crown, Flame, Zap, TrendingUp, PartyPopper, 
  Clock, Star, Gift, Sparkles, Target, ShieldCheck, Users, Heart, 
  Award, Gem, Sprout, Medal, Palette, LayoutGrid, MonitorPlay, Maximize2, X,
  BadgeCheck, DollarSign, BellRing
} from 'lucide-react';

interface ProjectionScreenProps {
  campaign: Campaign;
  representatives: Representative[];
  donations: Donation[];
  onBack: () => void;
  activeLottery: Lottery | null;
  allLotteries: Lottery[];
  onLotteryComplete: (id: string, winnerName: string) => void;
  groups: CampaignGroup[];
}

type ProjectionTheme = 'elite' | 'podium' | 'cyber';

const RankIcon = ({ rankName, color, size = 18 }: { rankName: string, color: string, size?: number }) => {
  switch (rankName) {
    case 'מתחיל': return <Sprout size={size} style={{ color }} />;
    case 'ברונזה': return <Award size={size} style={{ color }} />;
    case 'כסף': return <Award size={size} style={{ color }} />;
    case 'זהב': return <Trophy size={size} style={{ color }} />;
    case 'פלטינה': return <Sparkles size={size} style={{ color }} />;
    case 'יהלום': return <Gem size={size} style={{ color }} />;
    default: return <Award size={size} style={{ color }} />;
  }
};

const ProjectionScreen: React.FC<ProjectionScreenProps> = ({ 
  campaign, representatives, donations, onBack, activeLottery, onLotteryComplete, groups
}) => {
  const [currentTheme, setCurrentTheme] = useState<ProjectionTheme>('elite');
  const [isDrawing, setIsDrawing] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [shuffleName, setShuffleName] = useState('');
  
  // תוספת להתראות לייב
  const [lastDonationPopup, setLastDonationPopup] = useState<Donation | null>(null);
  const prevDonationsCount = useRef(donations.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sortedReps = useMemo(() => {
    return [...representatives].sort((a, b) => b.totalRaised - a.totalRaised);
  }, [representatives]);

  // חישוב נתוני קבוצות מצטברים
  const groupStats = useMemo(() => {
    return groups.map(group => {
      const total = representatives
        .filter(r => r.groupId === group.id)
        .reduce((sum, r) => sum + r.totalRaised, 0);
      return { ...group, total };
    }).sort((a, b) => b.total - a.total);
  }, [groups, representatives]);

  const globalPercent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

  // זיהוי תרומה חדשה להקפצת כרטיס וצליל
  useEffect(() => {
    if (donations.length > prevDonationsCount.current) {
      const newDonation = donations[0]; 
      setLastDonationPopup(newDonation);
      
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play blocked"));
      }

      // סגירה אוטומטית אחרי 10 שניות כפי שביקשת
      const timer = setTimeout(() => {
        setLastDonationPopup(null);
      }, 10000);
      
      prevDonationsCount.current = donations.length;
      return () => clearTimeout(timer);
    }
    prevDonationsCount.current = donations.length;
  }, [donations]);

  useEffect(() => {
    if (activeLottery && !isDrawing && !winnerName) {
      handleStartDraw();
    }
  }, [activeLottery]);

  const handleStartDraw = () => {
    if (!activeLottery) return;
    const eligibleReps = representatives.filter(rep => rep.totalRaised >= activeLottery.minThreshold);
    if (eligibleReps.length === 0) {
      alert("אין נציגים זכאים");
      onLotteryComplete(activeLottery.id, 'אין זוכה');
      return;
    }
    setIsDrawing(true);
    let count = 0;
    const interval = setInterval(() => {
      setShuffleName(eligibleReps[Math.floor(Math.random() * eligibleReps.length)].name);
      count++;
      if (count > 40) {
        clearInterval(interval);
        const finalWinner = eligibleReps[Math.floor(Math.random() * eligibleReps.length)];
        setWinnerName(finalWinner.name);
        setIsDrawing(false);
      }
    }, 100);
  };

  const closeLotteryOverlay = () => {
    if (activeLottery && winnerName) {
      onLotteryComplete(activeLottery.id, winnerName);
    }
    setWinnerName(null);
    setShuffleName('');
  };

  const themeStyles = {
    elite: { 
      bg: "bg-[#0a0c10]", 
      headerBg: "bg-slate-900/20 border-white/5", 
      cardBg: "bg-white/5 border-white/10 backdrop-blur-md shadow-sm", 
      footerBg: "bg-black/40 border-t-white/5", 
      textPrimary: "text-slate-100", 
      textSecondary: "text-slate-400" 
    },
    podium: { 
      bg: "bg-[#1a0505]", // בורדו יוקרתי
      headerBg: "bg-black/30 border-red-900/20", 
      cardBg: "bg-red-900/10 border-red-500/20 backdrop-blur-md", 
      footerBg: "bg-black/60 border-t-red-900/30", 
      textPrimary: "text-red-50", 
      textSecondary: "text-red-300/60" 
    },
    cyber: { 
      bg: "bg-[#050a08]", // ירוק יער אצילי
      headerBg: "bg-black/40 border-emerald-900/20", 
      cardBg: "bg-emerald-900/10 border-emerald-500/20 backdrop-blur-md", 
      footerBg: "bg-black/60 border-t-emerald-900/30", 
      textPrimary: "text-emerald-50", 
      textSecondary: "text-emerald-300/60" 
    }
  }[currentTheme];

  const handleThemeSwitch = () => {
    const themes: ProjectionTheme[] = ['elite', 'podium', 'cyber'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setCurrentTheme(themes[nextIndex]);
  };

  // הכפלת הרשימה לצורך גלילה אינסופית חלקה
  const displayReps = [...sortedReps, ...sortedReps];

  return (
    <div className={`fixed inset-0 ${themeStyles.bg} flex flex-col font-sans select-none overflow-hidden transition-all duration-1000`} dir="rtl">
      
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" preload="auto" />

      {/* רקע יוקרתי עדין */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_#1e293b_0%,_transparent_50%)] opacity-40"></div>

      <header className={`w-full backdrop-blur-md border-b p-6 z-50 flex flex-col gap-6 ${themeStyles.headerBg}`}>
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className={`p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all ${themeStyles.textSecondary}`}>
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <div>
              <h1 className={`text-3xl font-light tracking-tight flex items-center gap-4 ${themeStyles.textPrimary}`}>
                 <span className="font-black text-blue-500">TAT</span> PRO | {campaign.name}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-[0.4em] uppercase">מערכת ניהול גיוס בזמן אמת</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-left bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">הגיוס הכולל</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tabular-nums">₪{campaign.raised.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-bold">מתוך {campaign.goal.toLocaleString()}</span>
                </div>
            </div>
          </div>
        </div>

        {/* שורת סיכום קבוצות (חדש) */}
        <div className="flex items-center gap-4 overflow-x-auto scroll-hide px-4">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter whitespace-nowrap ml-2">סיכום קבוצות:</span>
           {groupStats.map(gs => (
             <div key={gs.id} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full whitespace-nowrap">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gs.color }}></div>
                <span className="text-[11px] font-bold text-slate-300">{gs.name}:</span>
                <span className="text-[11px] font-black text-white">₪{gs.total.toLocaleString()}</span>
             </div>
           ))}
        </div>

        <div className="px-4">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
            <div className="h-full bg-gradient-to-l from-blue-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${globalPercent}%` }}></div>
          </div>
          <div className="flex justify-between mt-2 px-1">
             <span className="text-[9px] font-black text-slate-500 uppercase">{globalPercent}% מהיעד הושגו</span>
             <span className="text-[9px] font-black text-slate-500 uppercase">נותר לגיוס: ₪{(campaign.goal - campaign.raised).toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* אזור נציגים בגלילה אנכית אוטומטית (מהירות מוגברת 35s) */}
      <main className="flex-1 relative z-10 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0a0c10] to-transparent z-20 opacity-40"></div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0c10] to-transparent z-20 opacity-40"></div>
          
          <div className="animate-vertical-marquee p-10 h-full">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
              {displayReps.map((rep, idx) => {
                const group = groups.find(g => g.id === rep.groupId);
                const rank = [...mockRanks].reverse().find(r => rep.totalRaised >= r.minAmount) || mockRanks[0];
                const isTop3 = (idx % sortedReps.length) < 3;
                const repPercent = Math.min(100, Math.round((rep.totalRaised / (rep.personalGoal || 1)) * 100));

                return (
                  <div key={`${rep.id}-${idx}`} className={`group rounded-3xl p-6 flex flex-col items-center transition-all duration-500 ${themeStyles.cardBg} border border-transparent hover:border-white/20 relative`}>
                    <div className="relative mb-4">
                      <div className={`w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center text-2xl font-black text-white relative shadow-2xl border border-white/5`}>
                        {rep.name.charAt(0)}
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center border-2 border-[#0a0c10] shadow-md" style={{ backgroundColor: group?.color || '#2563eb' }}>
                            <RankIcon rankName={rank.name} color="#fff" size={14} />
                        </div>
                      </div>
                      {isTop3 && (
                        <div className="absolute -top-4 -left-4 rotate-[-15deg] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                           <Crown className="text-amber-500" size={32} />
                        </div>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold truncate w-full mb-1 ${themeStyles.textPrimary}`}>{rep.name}</h4>
                    <p className="text-xl font-black tabular-nums tracking-tighter text-white">₪{rep.totalRaised.toLocaleString()}</p>
                    
                    {/* יעד וסרגל אישי יוקרתי */}
                    <div className="mt-4 w-full space-y-2">
                       <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                          <span>יעד: ₪{(rep.personalGoal || 0).toLocaleString()}</span>
                          <span className={repPercent >= 100 ? "text-emerald-400" : ""}>{repPercent}%</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${repPercent >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-blue-500'}`} 
                            style={{ width: `${repPercent}%` }}
                          ></div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </main>

      {/* פופ-אפ תרומה חדשה - אלגנטי בצד ימין (10 שניות) */}
      {lastDonationPopup && (
        <div className="fixed top-1/4 right-8 z-[300] animate-pop-in">
           <div className="bg-slate-900/95 border border-amber-500/30 backdrop-blur-3xl rounded-[32px] p-7 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex items-center gap-6 max-w-sm w-[350px] border-r-[6px] border-r-amber-500">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                 <BellRing size={32} />
              </div>
              <div className="text-right flex-1">
                 <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">תרומה חדשה התקבלה!</h2>
                 <p className="text-3xl font-black text-white tabular-nums leading-none mb-3">₪{lastDonationPopup.amount.toLocaleString()}</p>
                 <div className="space-y-1 border-t border-white/5 pt-2">
                    <p className="text-[11px] text-slate-300 font-bold flex justify-between"><span className="text-slate-500">תורם:</span> {lastDonationPopup.donorName}</p>
                    <p className="text-[11px] text-blue-400 font-bold flex justify-between"><span className="text-slate-500">נציג:</span> {lastDonationPopup.representativeName}</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {(isDrawing || winnerName) && (
          <div className="fixed inset-0 z-[400] bg-[#0a0c10]/98 flex flex-col items-center justify-center p-20 text-center animate-fade-in backdrop-blur-xl">
            <button onClick={closeLotteryOverlay} className="absolute top-12 left-12 p-4 text-slate-500 hover:text-white transition-all"><X size={32}/></button>
            <div className="relative z-10 space-y-12">
               <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-700 rounded-3xl flex items-center justify-center text-black mx-auto shadow-[0_0_50px_rgba(245,158,11,0.4)] animate-pulse">
                  <PartyPopper size={48} />
               </div>
               {isDrawing ? (
                  <div className="space-y-6">
                      <h2 className="text-3xl font-light text-slate-400 uppercase tracking-[0.4em]">מערבל שמות...</h2>
                      <div className="text-7xl font-black text-white tracking-tight">{shuffleName}</div>
                  </div>
               ) : (
                  <div className="space-y-10 animate-fade-in">
                      <h2 className="text-4xl font-light text-amber-500 uppercase tracking-[0.2em]">ברכות לזוכה המאושר</h2>
                      <div className="text-[100px] font-black text-white tracking-tighter leading-none py-12 px-24 bg-white/5 rounded-[50px] border border-white/10 shadow-2xl inline-block">
                        {winnerName}
                      </div>
                      <p className="text-2xl font-bold text-blue-500 tracking-wide">זכייה ב: {activeLottery?.title}</p>
                      <button onClick={closeLotteryOverlay} className="px-12 py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-slate-200 transition-all">חזרה ללוח</button>
                  </div>
               )}
            </div>
          </div>
      )}

      <footer className={`h-32 border-t flex items-center px-10 gap-10 shrink-0 z-50 overflow-hidden relative ${themeStyles.footerBg}`}>
          <div className="flex items-center gap-4 pr-6 border-l border-white/5 h-full">
             <TrendingUp size={24} className="text-emerald-500" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">עדכונים<br/>אחרונים</p>
          </div>
          <div className="flex-1 overflow-hidden h-full flex items-center">
            <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
              {donations.slice(0, 15).map((d) => (
                <div key={d.id} className="flex items-center gap-6 bg-white/5 px-8 py-4 rounded-2xl border border-white/5">
                  <span className="text-2xl font-black text-emerald-500 tabular-nums">₪{d.amount.toLocaleString()}</span>
                  <div className="text-right">
                     <p className="text-sm font-bold text-white leading-none mb-1">{d.donorName}</p>
                     <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{d.representativeName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* כפתור החלפת ערכת נושא יוקרתי */}
          <button 
            onClick={handleThemeSwitch} 
            className="absolute left-6 bottom-6 p-3 bg-white/5 border border-white/10 text-slate-500 rounded-full hover:bg-white/10 transition-all"
            title="החלף סגנון מסך"
          >
            <Palette size={18} />
          </button>
      </footer>

      <style>{`
        /* גלילה אנכית רציפה מהירה יותר */
        @keyframes verticalMarquee {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-vertical-marquee {
          animation: verticalMarquee 35s linear infinite;
        }
        .animate-vertical-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes marquee { 0% { transform: translateX(20%); } 100% { transform: translateX(-150%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-pop-in { animation: pop-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        
        @keyframes pop-in {
          0% { opacity: 0; transform: translateX(50px) scale(0.9); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }

        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ProjectionScreen;