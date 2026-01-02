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
  
  // ניהול רשימת התראות פעילות
  const [activePopups, setActivePopups] = useState<Donation[]>([]);
  const prevDonationIds = useRef<Set<string>>(new Set(donations.map(d => d.id)));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sortedReps = useMemo(() => {
    return [...representatives].sort((a, b) => b.totalRaised - a.totalRaised);
  }, [representatives]);

  const groupStats = useMemo(() => {
    return groups.map(group => {
      const total = representatives
        .filter(r => r.groupId === group.id)
        .reduce((sum, r) => sum + r.totalRaised, 0);
      return { ...group, total };
    }).sort((a, b) => b.total - a.total);
  }, [groups, representatives]);

  const globalPercent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

  // זיהוי תרומות חדשות שאושרו
  useEffect(() => {
    const newConfirmedDonations = donations.filter(d => 
      d.status === 'confirmed' && !prevDonationIds.current.has(d.id)
    );

    if (newConfirmedDonations.length > 0) {
      newConfirmedDonations.forEach(donation => {
        // הפעלת צליל
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log("Audio play blocked"));
        }

        // הוספה לרשימת ההתראות (החדשה ביותר למעלה)
        setActivePopups(prev => [donation, ...prev]);

        // הגדרת טיימר להסרה אחרי 5 שניות בדיוק
        setTimeout(() => {
          setActivePopups(prev => prev.filter(p => p.id !== donation.id));
        }, 5000);

        prevDonationIds.current.add(donation.id);
      });
    }
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
      bg: "bg-[#fcfcfd]", 
      headerBg: "bg-white border-slate-200", 
      cardBg: "bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)]", 
      footerBg: "bg-slate-50 border-t-slate-200", 
      textPrimary: "text-slate-900", 
      textSecondary: "text-slate-500",
      accent: "text-blue-600",
      barBg: "bg-slate-100"
    },
    podium: { 
      bg: "bg-[#1a0505]", 
      headerBg: "bg-black/30 border-red-900/20", 
      cardBg: "bg-red-900/10 border-red-500/20 backdrop-blur-md", 
      footerBg: "bg-black/60 border-t-red-900/30", 
      textPrimary: "text-red-50", 
      textSecondary: "text-red-300/60",
      accent: "text-amber-500",
      barBg: "bg-white/5"
    },
    cyber: { 
      bg: "bg-[#050505]", 
      headerBg: "bg-black border-amber-900/40", 
      cardBg: "bg-amber-950/10 border-amber-500/10 backdrop-blur-md", 
      footerBg: "bg-black border-t-amber-900/40", 
      textPrimary: "text-amber-50", 
      textSecondary: "text-amber-200/40",
      accent: "text-amber-400",
      barBg: "bg-white/5"
    }
  }[currentTheme];

  const handleThemeSwitch = () => {
    const themes: ProjectionTheme[] = ['elite', 'podium', 'cyber'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setCurrentTheme(themes[nextIndex]);
  };

  const displayReps = [...sortedReps, ...sortedReps];

  return (
    <div className={`fixed inset-0 ${themeStyles.bg} flex flex-col font-sans select-none overflow-hidden transition-all duration-1000`} dir="rtl">
      
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" preload="auto" />

      {currentTheme !== 'elite' && (
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_#1e293b_0%,_transparent_50%)] opacity-40"></div>
      )}

      <header className={`w-full backdrop-blur-md border-b p-6 z-50 flex flex-col gap-6 ${themeStyles.headerBg}`}>
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className={`p-3 bg-black/5 rounded-xl border border-transparent hover:border-slate-300 transition-all ${themeStyles.textSecondary}`}>
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <div>
              <h1 className={`text-3xl font-light tracking-tight flex items-center gap-4 ${themeStyles.textPrimary}`}>
                 <span className={`font-black ${themeStyles.accent}`}>TAT</span> PRO | {campaign.name}
              </h1>
              <p className={`text-[10px] ${themeStyles.textSecondary} font-medium tracking-[0.4em] uppercase`}>מערכת ניהול גיוס בזמן אמת</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className={`${currentTheme === 'elite' ? 'bg-slate-50' : 'bg-white/5'} px-8 py-3 rounded-2xl border border-transparent shadow-sm`}>
                <p className={`text-[9px] font-bold ${themeStyles.textSecondary} uppercase tracking-widest mb-1 text-center`}>סך הגיוס המצטבר</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-black ${themeStyles.textPrimary} tabular-nums`}>₪{campaign.raised.toLocaleString()}</span>
                  <span className={`text-xs ${themeStyles.textSecondary} font-bold`}>מתוך {campaign.goal.toLocaleString()}</span>
                </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto scroll-hide px-4">
           <span className={`text-[10px] font-black ${themeStyles.textSecondary} uppercase tracking-tighter whitespace-nowrap ml-2`}>ביצועי קבוצות:</span>
           {groupStats.map(gs => (
             <div key={gs.id} className={`${currentTheme === 'elite' ? 'bg-white' : 'bg-white/5'} border ${currentTheme === 'elite' ? 'border-slate-200' : 'border-white/10'} px-5 py-2 rounded-full whitespace-nowrap shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gs.color }}></div>
                  <span className={`text-[11px] font-bold ${themeStyles.textSecondary}`}>{gs.name}:</span>
                  <span className={`text-[11px] font-black ${themeStyles.textPrimary}`}>₪{gs.total.toLocaleString()}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="px-4">
          <div className={`h-1.5 ${themeStyles.barBg} rounded-full overflow-hidden relative`}>
            <div className={`h-full bg-gradient-to-l ${currentTheme === 'elite' ? 'from-blue-600 to-blue-400' : 'from-blue-600 to-indigo-400'} transition-all duration-1000`} style={{ width: `${globalPercent}%` }}></div>
          </div>
          <div className="flex justify-between mt-2 px-1">
             <span className={`text-[9px] font-black ${themeStyles.textSecondary} uppercase`}>{globalPercent}% הושלמו</span>
             <span className={`text-[9px] font-black ${themeStyles.textSecondary} uppercase`}>יעד נותר: ₪{(campaign.goal - campaign.raised).toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-hidden">
          <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${currentTheme === 'elite' ? 'from-[#fcfcfd]' : 'from-[#0a0c10]'} to-transparent z-20`}></div>
          <div className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${currentTheme === 'elite' ? 'from-[#fcfcfd]' : 'from-[#0a0c10]'} to-transparent z-20`}></div>
          
          <div className="animate-vertical-marquee p-10 h-full">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
              {displayReps.map((rep, idx) => {
                const group = groups.find(g => g.id === rep.groupId);
                const rank = [...mockRanks].reverse().find(r => rep.totalRaised >= r.minAmount) || mockRanks[0];
                const isTop3 = (idx % sortedReps.length) < 3;
                const repPercent = Math.min(100, Math.round((rep.totalRaised / (rep.personalGoal || 1)) * 100));

                return (
                  <div key={`${rep.id}-${idx}`} className={`group rounded-[32px] p-7 flex flex-col items-center transition-all duration-500 ${themeStyles.cardBg} relative border border-transparent hover:scale-[1.02]`}>
                    <div className="relative mb-4">
                      <div className={`w-20 h-20 rounded-[24px] ${currentTheme === 'elite' ? 'bg-slate-50' : 'bg-slate-800/50'} flex items-center justify-center text-2xl font-black ${themeStyles.textPrimary} relative border ${currentTheme === 'elite' ? 'border-slate-200' : 'border-white/5'}`}>
                        {rep.name.charAt(0)}
                        <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center border-2 ${currentTheme === 'elite' ? 'border-white' : 'border-[#0a0c10]'} shadow-md`} style={{ backgroundColor: group?.color || '#2563eb' }}>
                            <RankIcon rankName={rank.name} color="#fff" size={14} />
                        </div>
                      </div>
                      {isTop3 && (
                        <div className="absolute -top-4 -left-4 rotate-[-15deg]">
                           <Crown className="text-amber-500 drop-shadow-md" size={32} />
                        </div>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold truncate w-full mb-1 ${themeStyles.textPrimary}`}>{rep.name}</h4>
                    <p className={`text-xl font-black tabular-nums tracking-tighter ${themeStyles.textPrimary}`}>₪{rep.totalRaised.toLocaleString()}</p>
                    
                    <div className="mt-5 w-full space-y-2">
                       <div className={`flex justify-between items-center text-[9px] font-black ${themeStyles.textSecondary} uppercase tracking-tighter`}>
                          <span>יעד: ₪{(rep.personalGoal || 0).toLocaleString()}</span>
                          <span className={repPercent >= 100 ? "text-emerald-500" : ""}>{repPercent}%</span>
                       </div>
                       <div className={`h-1 w-full ${themeStyles.barBg} rounded-full overflow-hidden`}>
                          <div 
                            className={`h-full transition-all duration-1000 ${repPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
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

      {/* אזור ערימת התראות תרומה בצד ימין */}
      <div className="fixed top-1/4 right-8 z-[300] flex flex-col gap-4 max-w-sm w-[360px]">
        {activePopups.map((popup) => (
          <div key={popup.id} className="animate-pop-in">
             <div className={`${currentTheme === 'elite' ? 'bg-white' : 'bg-slate-900/95'} border ${currentTheme === 'elite' ? 'border-blue-500/20' : 'border-amber-500/30'} backdrop-blur-3xl rounded-[35px] p-7 shadow-[0_30px_60px_rgba(0,0,0,0.2)] flex items-center gap-6 border-r-[8px] ${currentTheme === 'elite' ? 'border-r-blue-600' : 'border-r-amber-500'}`}>
                <div className={`w-16 h-16 ${currentTheme === 'elite' ? 'bg-blue-50' : 'bg-amber-500/10'} rounded-2xl flex items-center justify-center ${currentTheme === 'elite' ? 'text-blue-600' : 'text-amber-500'}`}>
                   <BellRing size={32} />
                </div>
                <div className="text-right flex-1">
                   <h2 className={`text-[10px] font-black ${currentTheme === 'elite' ? 'text-blue-600' : 'text-amber-500'} uppercase tracking-[0.2em] mb-1`}>תרומה חדשה נכנסה!</h2>
                   <p className={`text-3xl font-black ${themeStyles.textPrimary} tabular-nums leading-none mb-3`}>₪{popup.amount.toLocaleString()}</p>
                   <div className="space-y-1 border-t border-slate-100/10 pt-2">
                      <p className={`text-[11px] ${themeStyles.textSecondary} font-bold`}><span className="opacity-60">תורם:</span> {popup.donorName}</p>
                      <p className={`text-[11px] ${themeStyles.accent} font-bold`}><span className={`${themeStyles.textSecondary} opacity-60`}>נציג:</span> {popup.representativeName}</p>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {(isDrawing || winnerName) && (
          <div className={`fixed inset-0 z-[400] ${currentTheme === 'elite' ? 'bg-white/98' : 'bg-[#050505]/98'} flex flex-col items-center justify-center p-20 text-center animate-fade-in backdrop-blur-xl`}>
            <button onClick={closeLotteryOverlay} className={`absolute top-12 left-12 p-4 ${themeStyles.textSecondary} hover:scale-110 transition-all`}><X size={32}/></button>
            <div className="relative z-10 space-y-12">
               <div className={`w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[40px] flex items-center justify-center text-white mx-auto shadow-2xl animate-pulse`}>
                  <PartyPopper size={54} />
               </div>
               {isDrawing ? (
                  <div className="space-y-6">
                      <h2 className={`text-4xl font-light ${themeStyles.textSecondary} uppercase tracking-[0.4em]`}>מערבל שמות...</h2>
                      <div className={`text-8xl font-black ${themeStyles.textPrimary} tracking-tight`}>{shuffleName}</div>
                  </div>
               ) : (
                  <div className="space-y-10 animate-fade-in">
                      <h2 className="text-5xl font-light text-amber-500 uppercase tracking-[0.2em]">ברכות לזוכה המאושר</h2>
                      <div className={`text-[110px] font-black ${themeStyles.textPrimary} tracking-tighter leading-none py-12 px-24 bg-black/5 rounded-[60px] border ${currentTheme === 'elite' ? 'border-slate-200' : 'border-white/10'} shadow-2xl inline-block`}>
                        {winnerName}
                      </div>
                      <p className={`text-3xl font-bold ${themeStyles.accent} tracking-wide`}>זכייה בפרס: {activeLottery?.title}</p>
                      <button onClick={closeLotteryOverlay} className={`px-16 py-6 ${currentTheme === 'elite' ? 'bg-slate-900 text-white' : 'bg-white text-black'} rounded-[24px] font-black text-2xl hover:scale-105 transition-all shadow-xl`}>חזרה ללוח</button>
                  </div>
               )}
            </div>
          </div>
      )}

      <footer className={`h-32 border-t flex items-center px-10 gap-10 shrink-0 z-50 overflow-hidden relative ${themeStyles.footerBg}`}>
          <div className="flex items-center gap-4 pr-6 border-l border-slate-200/20 h-full">
             <TrendingUp size={24} className="text-emerald-500" />
             <p className={`text-[10px] font-black ${themeStyles.textSecondary} uppercase tracking-[0.2em] whitespace-nowrap`}>עדכונים<br/>אחרונים</p>
          </div>
          <div className="flex-1 overflow-hidden h-full flex items-center">
            <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
              {donations.slice(0, 15).map((d) => (
                <div key={d.id} className={`${currentTheme === 'elite' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'} flex items-center gap-6 px-9 py-5 rounded-[22px] border shadow-sm`}>
                  <span className="text-2xl font-black text-emerald-500 tabular-nums">₪{d.amount.toLocaleString()}</span>
                  <div className="text-right">
                     <p className={`text-sm font-bold ${themeStyles.textPrimary} leading-none mb-1`}>{d.donorName}</p>
                     <p className={`text-[9px] font-bold ${themeStyles.accent} uppercase tracking-widest`}>{d.representativeName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleThemeSwitch} 
            className={`absolute left-8 bottom-8 p-4 ${currentTheme === 'elite' ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white/5 border-white/10 text-slate-500'} border rounded-full hover:scale-110 transition-all shadow-lg`}
            title="שינוי סגנון תצוגה"
          >
            <Palette size={20} />
          </button>
      </footer>

      <style>{`
        @keyframes verticalMarquee {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-vertical-marquee {
          animation: verticalMarquee 22s linear infinite;
        }
        .animate-vertical-marquee:hover { animation-play-state: paused; }

        @keyframes marquee { 0% { transform: translateX(20%); } 100% { transform: translateX(-150%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        
        .animate-pop-in { animation: pop-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        
        @keyframes pop-in {
          0% { opacity: 0; transform: translateX(60px) scale(0.85); }
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