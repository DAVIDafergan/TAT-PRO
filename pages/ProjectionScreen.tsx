
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Campaign, Representative, Donation, Lottery, CampaignGroup } from '../types';
import { mockRanks } from '../services/mockData';
import { 
  Trophy, ArrowRight, Activity, Crown, Flame, Zap, TrendingUp, PartyPopper, 
  Clock, Star, Gift, Sparkles, Target, ShieldCheck, Users, Heart, 
  Award, Gem, Sprout, Medal, Palette, LayoutGrid, MonitorPlay, Maximize2, X 
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

  const sortedReps = useMemo(() => {
    return [...representatives].sort((a, b) => b.totalRaised - a.totalRaised);
  }, [representatives]);

  const globalPercent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

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
    elite: { bg: "bg-[#f8fafc]", headerBg: "bg-white border-slate-200", cardBg: "bg-white border-slate-100 shadow-xl", footerBg: "bg-slate-900 border-t-white/10", textPrimary: "text-slate-900", textSecondary: "text-slate-500" },
    podium: { bg: "bg-[#0f172a]", headerBg: "bg-slate-900 border-slate-800", cardBg: "bg-slate-800/50 border-slate-700 shadow-2xl", footerBg: "bg-black border-t-slate-800", textPrimary: "text-white", textSecondary: "text-slate-400" },
    cyber: { bg: "bg-black", headerBg: "bg-black border-blue-900/50", cardBg: "bg-slate-900/40 border-blue-500/20", footerBg: "bg-slate-950 border-t-blue-900/50", textPrimary: "text-blue-50", textSecondary: "text-blue-400/60" }
  }[currentTheme];

  return (
    <div className={`fixed inset-0 ${themeStyles.bg} flex flex-col font-sans select-none overflow-hidden transition-all duration-1000`} dir="rtl">
      <header className={`w-full backdrop-blur-3xl border-b p-8 z-50 shadow-2xl flex flex-col gap-6 ${themeStyles.headerBg}`}>
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <button onClick={onBack} className={`p-4 bg-black/5 rounded-2xl ${themeStyles.textSecondary}`}><ArrowRight size={24} className="rotate-180" /></button>
            <h1 className={`text-4xl font-black tracking-tighter flex items-center gap-4 ${themeStyles.textPrimary}`}>
               <Activity size={32} className="text-blue-600 animate-pulse" /> {campaign.name}
            </h1>
          </div>
          <div className="text-right">
            <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${themeStyles.textSecondary}`}>סך גיוס קבוצתי</p>
            <div className="flex items-baseline gap-4">
              <span className={`text-6xl font-black tabular-nums tracking-tighter ${themeStyles.textPrimary}`}>{campaign.raised.toLocaleString()} ₪</span>
              <span className={`text-lg font-bold ${themeStyles.textSecondary}`}>מתוך {campaign.goal.toLocaleString()} ₪</span>
            </div>
          </div>
        </div>
        <div className="px-4">
          <div className="h-4 bg-black/5 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-1000" style={{ width: `${globalPercent}%` }}></div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">{globalPercent}%</div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-hide p-12 relative z-10">
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {sortedReps.map((rep, idx) => {
              const group = groups.find(g => g.id === rep.groupId);
              const rank = [...mockRanks].reverse().find(r => rep.totalRaised >= r.minAmount) || mockRanks[0];
              return (
                <div key={rep.id} className={`rounded-[30px] p-6 flex flex-col items-center text-center transition-all duration-500 hover:scale-[1.03] ${themeStyles.cardBg} border-2 border-transparent hover:border-blue-500`}>
                  <div className="w-20 h-20 rounded-[28px] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-800 mb-4 relative shadow-inner">
                    {rep.name.charAt(0)}
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center border-2 border-white shadow-lg" style={{ backgroundColor: group?.color || '#2563eb' }}>
                        <RankIcon rankName={rank.name} color="#fff" size={14} />
                    </div>
                  </div>
                  <h4 className={`text-sm font-black truncate w-full mb-1 ${themeStyles.textPrimary}`}>{rep.name}</h4>
                  <p className="text-xl font-black tabular-nums tracking-tight" style={{ color: group?.color || '#2563eb' }}>{rep.totalRaised.toLocaleString()} ₪</p>
                </div>
              );
            })}
         </div>
      </main>

      {(isDrawing || winnerName) && (
         <div className="fixed inset-0 z-[200] bg-slate-950/95 flex flex-col items-center justify-center p-20 text-center animate-fade-in">
            <button onClick={closeLotteryOverlay} className="absolute top-10 left-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><X size={40}/></button>
            <div className="relative z-10 space-y-12">
               <div className="w-32 h-32 bg-blue-600 rounded-[40px] flex items-center justify-center text-white mx-auto shadow-[0_0_80px_rgba(37,99,235,0.5)] animate-pulse">
                  <PartyPopper size={64} />
               </div>
               {isDrawing ? (
                  <div className="space-y-6">
                     <h2 className="text-4xl font-black text-slate-400 uppercase tracking-[0.3em]">מערבל שמות...</h2>
                     <div className="text-8xl font-black text-white animate-bounce">{shuffleName}</div>
                  </div>
               ) : (
                  <div className="space-y-10 animate-fade-in">
                     <h2 className="text-5xl font-black text-amber-400 uppercase tracking-widest">יש לנו זוכה!</h2>
                     <div className="text-[120px] font-black text-white tracking-tighter leading-none py-10 px-20 bg-white/5 rounded-[60px] border border-white/10 shadow-2xl">
                        {winnerName}
                     </div>
                     <p className="text-2xl font-black text-blue-500 uppercase tracking-widest">{activeLottery?.title}</p>
                     <button onClick={closeLotteryOverlay} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-500 transition-all">סגור וחזרה לתוצאות</button>
                  </div>
               )}
            </div>
         </div>
      )}

      <footer className={`h-32 border-t flex items-center px-12 gap-12 shrink-0 z-50 overflow-hidden relative ${themeStyles.footerBg}`}>
          <div className="flex-1 overflow-hidden h-full flex items-center">
            <div className="flex items-center gap-20 animate-marquee whitespace-nowrap">
              {donations.slice(0, 15).map((d) => (
                <div key={d.id} className="flex items-center gap-10 bg-white/5 pl-16 pr-8 py-6 rounded-[35px] border border-white/5">
                  <span className="text-4xl font-black text-emerald-400 tabular-nums">{d.amount.toLocaleString()} ₪</span>
                  <div className="text-right">
                     <p className="text-xl font-black text-white">{d.donorName}</p>
                     <p className="text-sm font-bold text-blue-400 uppercase">{d.representativeName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </footer>
      <style>{`@keyframes marquee { 0% { transform: translateX(50%); } 100% { transform: translateX(-200%); } } .animate-marquee { animation: marquee 30s linear infinite; }`}</style>
    </div>
  );
};

export default ProjectionScreen;
