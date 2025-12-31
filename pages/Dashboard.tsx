
import React from 'react';
import { Campaign, Donation, Representative } from '../types';
import { 
  TrendingUp, 
  Users, 
  Banknote, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Monitor,
  Activity
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  campaigns: Campaign[];
  donations: Donation[];
  representatives: Representative[];
  setCurrentPage: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ campaigns, donations, representatives, setCurrentPage }) => {
  const activeCampaign = campaigns.find(c => c.status === 'active') || campaigns[0];
  
  if (!activeCampaign) {
    return (
      <div className="p-16 text-center animate-fade-in flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 border border-slate-100">
           <Activity size={32} className="text-slate-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">אין קמפיינים פעילים</h1>
        <p className="text-slate-400 font-medium mb-6">נא להגדיר קמפיין ראשון בניהול הקמפיינים</p>
        <button 
          onClick={() => setCurrentPage('campaigns')}
          className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-sm active:scale-95 transition-all"
        >
          הקם קמפיין כעת
        </button>
      </div>
    );
  }

  const activeDonations = donations.filter(d => d.campaignId === activeCampaign.id);
  const totalRaised = activeCampaign.raised ?? 0;
  const totalGoal = activeCampaign.goal ?? 1;
  const percent = Math.round((totalRaised / totalGoal) * 100);

  const stats = [
    { label: 'סך גיוס נוכחי', value: `${(totalRaised).toLocaleString()} ש"ח`, icon: <Banknote size={20} className="text-brand-600" />, trend: '+12.5%', color: 'brand' },
    { label: 'נציגים במשימה', value: (representatives?.length || 0).toString(), icon: <Users size={20} className="text-slate-600" />, trend: 'Live', color: 'slate' },
    { label: 'גויס היום', value: `${(activeDonations.reduce((sum, d) => sum + (new Date(d.timestamp).toDateString() === new Date().toDateString() ? (d.amount ?? 0) : 0), 0)).toLocaleString()} ש"ח`, icon: <TrendingUp size={20} className="text-slate-600" />, trend: 'מעודכן', color: 'slate' },
    { label: 'עמידה ביעד', value: `${percent}%`, icon: <CheckCircle2 size={20} className="text-slate-600" />, trend: 'יעד הקמפיין', color: 'slate' },
  ];

  const chartData = [
    { name: 'א\'', value: 4000 },
    { name: 'ב\'', value: 3000 },
    { name: 'ג\'', value: 5000 },
    { name: 'ד\'', value: 2780 },
    { name: 'ה\'', value: 6890 },
    { name: 'ו\'', value: 2390 },
  ];

  return (
    <div className="p-10 lg:p-14 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
            דאשבורד <span className="text-brand-600 font-medium">ניהול</span>
          </h1>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
             <p className="text-slate-400 font-semibold text-[11px] tracking-widest uppercase">
               קמפיין נוכחי: <span className="text-slate-900">{activeCampaign.name}</span>
             </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setCurrentPage('projection')}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <Monitor size={16} />
            מסך הקרנה
          </button>
          <button 
            onClick={() => setCurrentPage('donations')}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-brand-500 transition-all flex items-center gap-2"
          >
            ניהול תרומות
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="f-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">{stat.icon}</div>
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                {stat.trend}
              </div>
            </div>
            <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 f-card p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-bold text-lg text-slate-900">ביצועים שבועיים</h3>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Live Fundraising Analytics</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', padding: '12px', fontFamily: 'Heebo'}} 
                  labelStyle={{fontWeight: 700, marginBottom: '4px', color: '#0f172a'}}
                  itemStyle={{fontWeight: 600, color: '#3b82f6'}}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="f-card p-10 flex flex-col">
          <h3 className="font-bold text-lg text-slate-900 mb-8">גיוסים אחרונים</h3>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 scroll-hide">
            {activeDonations.slice(0, 6).map((donation) => (
              <div key={donation.id} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-brand-600 text-xs transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  {donation.donorName?.charAt(0) || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{donation.donorName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{donation.representativeName}</p>
                </div>
                <div className="text-left">
                  <p className="text-md font-black text-slate-900 tabular-nums">{(donation.amount ?? 0).toLocaleString()} ש"ח</p>
                  <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Success</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setCurrentPage('donations')}
            className="w-full mt-8 py-3 text-slate-600 text-xs font-bold bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
          >
            כל הגיוסים
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
