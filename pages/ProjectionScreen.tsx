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

  const globalPercent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

  // זיהוי תרומה חדשה להקפצת כרטיס וצליל
  useEffect(() => {
    if (donations.length > prevDonationsCount.current) {
      const newDonation = donations[0]; // מניחים שהחדשה ביותר היא הראשונה
      setLastDonationPopup(newDonation);
      
      // הפעלת צליל
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play blocked"));
      }

      // סגירה אוטומטית אחרי 5 שניות
      const timer = setTimeout(() => {
        setLastDonationPopup(null);
      }, 5000);
      
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
      bg: "bg-[#05080f]", 
      headerBg: "bg-slate-900/50 border-white/10", 
      cardBg: "bg-slate-900/40 border-white/5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]", 
      footerBg: "bg-slate-950 border-t-white/10", 
      textPrimary: "text-white", 
      textSecondary: "text-slate-400" 
    },
    podium: { bg: "bg-[#0f172a]", headerBg: "bg-slate-900 border-slate-800", cardBg: "bg-slate-800/50 border-slate-700 shadow-2xl", footerBg: "bg-black border-t-slate-800", textPrimary: "text-white", textSecondary: "text-slate-400" },
    cyber: { bg: "bg-black", headerBg: "bg-black border-blue-900/50", cardBg: "bg-slate-900/40 border-blue-500/20", footerBg: "bg-slate-950 border-t-blue-900/50", textPrimary: "text-blue-50", textSecondary: "text-blue-400/60" }
  }[currentTheme];

  return (
    <div className={`fixed inset-0 ${themeStyles.bg} flex flex-col font-sans select-none overflow-hidden transition-all duration-1000`} dir="rtl">
      
      {/* אלמנט אודיו לצליל התרומה */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" preload="auto" />

      {/* רקע יוקרתי עם תאורה אחורית */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[150px] rounded-full"></div>

      <header className={`w-full backdrop-blur-3xl border-b p-10 z-50 flex flex-col gap-8 ${themeStyles.headerBg}`}>
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center gap-10">
            <button onClick={onBack} className={`p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all ${themeStyles.textSecondary}`}>
              <ArrowRight size={28} className="rotate-180" />
            </button>
            <div>
              <h1 className={`text-6xl font-black tracking-tighter flex items-center gap-6 ${themeStyles.textPrimary}`}>
                 <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                    <Activity size={40} className="text-blue-500 animate-pulse" />
                 </div>
                 {campaign.name}
              </h1>
              <p className="text-blue-400/80 font-bold tracking-[0.2em] mt-2 mr-16 uppercase text-sm">Live Fundraising Dashboard</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-12 bg-white/5 p-8 rounded-[40px] border border-white/10">
            <div className="space-y-1">
              <p className={`text-[12px] font-black uppercase tracking-[0.3em] ${themeStyles.textSecondary}`}>יעד הקמפיין</p>
              <p className="text-3xl font-black text-white/60 tabular-nums">₪{campaign.goal.toLocaleString()}</p>
            </div>
            <div className="w-[2px] h-20 bg-white/10"></div>
            <div className="space-y-1">
              <p className={`text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400`}>סך גיוס נוכחי</p>
              <div className="flex items-baseline gap-3">
                <span className={`text-8xl font-black tabular-nums tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 drop-shadow-2xl`}>
                  {campaign.raised.toLocaleString()}
                </span>
                <span className="text-4xl font-black text-emerald-500">₪</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6">
          <div className="h-6 bg-white/5 rounded-full overflow-hidden relative border border-white/10 shadow-inner">
            <div className="h-full bg-gradient-to-l from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-1000 relative" style={{ width: `${globalPercent}%` }}>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
               <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-r from-transparent to-white/30 blur-sm"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white drop-shadow-lg tracking-widest">{globalPercent}% הושלמו</div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-hide p-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-8">
            {sortedReps.map((rep, idx) => {
              const group = groups.find(g => g.id === rep.groupId);
              const rank = [...mockRanks].reverse().find(r => rep.totalRaised >= r.minAmount) || mockRanks[0];
              const isTop3 = idx < 3;

              return (
                <div key={rep.id} className={`group rounded-[40px] p-8 flex flex-col items-center text-center transition-all duration-700 hover:scale-[1.05] ${themeStyles.cardBg} border-t border-white/10 relative overflow-hidden`}>
                  
                  {isTop3 && (
                    <div className="absolute -top-4 -left-4 bg-amber-500/20 p-8 blur-3xl rounded-full"></div>
                  )}

                  <div className={`w-28 h-28 rounded-[35px] bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-4xl font-black text-white mb-6 relative shadow-2xl border-2 ${isTop3 ? 'border-amber-500/50 shadow-amber-500/20' : 'border-white/5'}`}>
                    {rep.name.charAt(0)}
                    <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-[#05080f] shadow-2xl" style={{ backgroundColor: group?.color || '#2563eb' }}>
                        <RankIcon rankName={rank.name} color="#fff" size={20} />
                    </div>
                    {isTop3 && (
                      <div className="absolute -top-3 -left-3">
                         <Crown className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" size={32} />
                      </div>
                    )}
                  </div>

                  <h4 className={`text-lg font-black truncate w-full mb-2 ${themeStyles.textPrimary} group-hover:text-blue-400 transition-colors`}>{rep.name}</h4>
                  
                  <div className="bg-black/20 w-full py-3 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-2xl font-black tabular-nums tracking-tighter text-emerald-400">{rep.totalRaised.toLocaleString()} ₪</p>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                     <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '65%' }}></div>
                     </div>
                     <span className="text-[10px] font-black text-slate-500 uppercase">LVL {idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
      </main>

      {/* פופ-אפ תרומה חדשה יוקרתי */}
      {lastDonationPopup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
           <div className="bg-slate-900 border-2 border-amber-500/50 rounded-[60px] p-16 text-center shadow-[0_0_100px_rgba(245,158,11,0.3)] relative overflow-hidden animate-pop-in max-w-3xl w-full mx-6">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              
              <div className="space-y-8">
                 <div className="w-24 h-24 bg-amber-500 rounded-[30px] flex items-center justify-center text-slate-950 mx-auto shadow-2xl">
                    <BellRing size={48} />
                 </div>
                 
                 <div className="space-y-4">
                    <h2 className="text-3xl font-black text-amber-500 uppercase tracking-[0.3em]">תרומה חדשה התקבלה!</h2>
                    <div className="text-[120px] font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-2xl">
                       ₪{lastDonationPopup.amount.toLocaleString()}
                    </div>
                 </div>

                 <div className="flex items-center justify-center gap-8">
                    <div className="text-right">
                       <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">התורם הנדיב</p>
                       <p className="text-4xl font-black text-white">{lastDonationPopup.donorName}</p>
                    </div>
                    <div className="w-px h-16 bg-white/10"></div>
                    <div className="text-left">
                       <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">באמצעות הנציג</p>
                       <p className="text-4xl font-black text-blue-400">{lastDonationPopup.representativeName}</p>
                    </div>
                 </div>
              </div>

              {/* אפקט נצנצים */}
              <div className="absolute top-10 right-10 opacity-20"><Sparkles size={40} className="text-amber-500" /></div>
              <div className="absolute bottom-10 left-10 opacity-20"><Sparkles size={40} className="text-amber-500" /></div>
           </div>
        </div>
      )}

      {(isDrawing || winnerName) && (
          <div className="fixed inset-0 z-[200] bg-slate-950/98 flex flex-col items-center justify-center p-20 text-center animate-fade-in backdrop-blur-2xl">
            <button onClick={closeLotteryOverlay} className="absolute top-12 left-12 p-6 bg-white/5 text-white rounded-full hover:bg-white/10 border border-white/10 transition-all"><X size={48}/></button>
            <div className="relative z-10 space-y-16">
               <div className="w-40 h-40 bg-gradient-to-br from-amber-400 to-amber-700 rounded-[50px] flex items-center justify-center text-slate-950 mx-auto shadow-[0_0_100px_rgba(245,158,11,0.4)] animate-pulse border-4 border-white/20">
                  <PartyPopper size={80} />
               </div>
               {isDrawing ? (
                  <div className="space-y-8">
                      <h2 className="text-5xl font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">מערבל שמות...</h2>
                      <div className="text-[120px] font-black text-white tracking-tighter transition-all duration-75">{shuffleName}</div>
                  </div>
               ) : (
                  <div className="space-y-12 animate-fade-in">
                      <div>
                        <h2 className="text-6xl font-black text-amber-500 uppercase tracking-[0.2em] mb-4">ברכות לזוכה המאושר!</h2>
                        <div className="h-1 w-64 bg-amber-500/30 mx-auto rounded-full"></div>
                      </div>
                      
                      <div className="text-[160px] font-black text-white tracking-tighter leading-none py-16 px-32 bg-white/5 rounded-[80px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] inline-block">
                        {winnerName}
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-3xl font-black text-blue-400 uppercase tracking-widest flex items-center justify-center gap-4">
                           <Star className="text-amber-500" fill="currentColor" />
                           {activeLottery?.title}
                           <Star className="text-amber-500" fill="currentColor" />
                        </p>
                      </div>

                      <button onClick={closeLotteryOverlay} className="px-20 py-8 bg-amber-500 text-slate-950 rounded-3xl font-black text-3xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] hover:scale-110 hover:bg-amber-400 transition-all duration-300">חזרה ללוח התוצאות</button>
                  </div>
               )}
            </div>
          </div>
      )}

      <footer className={`h-40 border-t flex items-center px-12 gap-12 shrink-0 z-50 overflow-hidden relative ${themeStyles.footerBg}`}>
          <div className="flex items-center gap-6 pr-6 border-l border-white/10 h-full">
             <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <TrendingUp size={32} className="text-emerald-500" />
             </div>
             <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">עדכונים<br/>אחרונים</p>
          </div>
          <div className="flex-1 overflow-hidden h-full flex items-center">
            <div className="flex items-center gap-20 animate-marquee whitespace-nowrap">
              {donations.slice(0, 15).map((d) => (
                <div key={d.id} className="flex items-center gap-10 bg-white/5 pl-20 pr-10 py-8 rounded-[40px] border border-white/5 hover:bg-white/10 transition-all cursor-default group">
                  <div className="flex flex-col items-center">
                     <span className="text-5xl font-black text-emerald-400 tabular-nums group-hover:scale-110 transition-transform">₪{d.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-black text-white">{d.donorName}</p>
                     <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                        <Users size={12} /> {d.representativeName}
                     </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(20%); } 100% { transform: translateX(-150%); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .animate-pop-in { animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.8) translateY(40px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ProjectionScreen;
