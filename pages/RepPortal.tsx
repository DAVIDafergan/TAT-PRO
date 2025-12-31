
import React, { useState, useMemo } from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Representative, Donation, Path, CallList, Donor, AssignmentStatus, Patrol, SystemMessage, UserRole, PaymentMethod, ClearingSettings } from '../types';
import { mockRanks } from '../services/mockData';
import { 
  Home, PlusCircle, Clock, MapPin, 
  X, Smartphone, Wallet, CreditCard, Check, 
  Phone, TrendingUp, Banknote, Sun, Moon, 
  LogOut, MapPinned, PhoneCall, MessageCircle, 
  Navigation2, Share2, Award, Gem, Sprout, Trophy, ChevronLeft,
  FileText, Landmark, Info
} from 'lucide-react';

interface RepPortalProps {
  rep: Representative;
  allReps: Representative[];
  patrols: Patrol[];
  donations: Donation[];
  addDonation: (d: Donation) => void;
  paths: Path[];
  callLists: CallList[];
  updateDonorStatus: (donorId: string, status: AssignmentStatus) => void;
  systemMessages: SystemMessage[];
  sendRepMessage: (content: string) => void;
  donors: Donor[];
  onLogout: () => void;
  onBackToAdmin?: () => void;
  clearingSettings: ClearingSettings;
}

const RepPortal: React.FC<RepPortalProps> = ({ 
  rep, donations, addDonation, paths, callLists, updateDonorStatus, onLogout, onBackToAdmin, clearingSettings
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'myPath' | 'calls' | 'share'>('home');
  const [activeDonorForReporting, setActiveDonorForReporting] = useState<Donor | null>(null);
  const [reportingStep, setReportingStep] = useState<'initial' | 'amount' | 'details' | 'success'>('initial');
  
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donationNotes, setDonationNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bitTargetPhone, setBitTargetPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const isDark = theme === 'dark';

  const myActivePath = useMemo(() => (paths || []).find(p => p.assignedRepIds?.includes(rep?.id) || p.assignedRepIds?.includes(rep?.username)), [paths, rep]);
  const myCallList = useMemo(() => (callLists || []).find(cl => cl.assignedRepIds?.includes(rep?.id) || cl.assignedRepIds?.includes(rep?.username)), [callLists, rep]);
  
  const currentRank = useMemo(() => {
    const total = rep?.totalRaised || 0;
    return [...mockRanks].reverse().find(r => total >= r.minAmount) || mockRanks[0];
  }, [rep?.totalRaised]);

  const dailyRaised = useMemo(() => {
    const today = new Date().toDateString();
    return (donations || [])
      .filter(d => d.representativeId === rep?.id && new Date(d.timestamp).toDateString() === today && d.status === 'confirmed')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [donations, rep?.id]);

  const handleReportVisit = (donor: Donor | null) => {
    setActiveDonorForReporting(donor);
    setDonorName(donor ? `${donor.firstName} ${donor.lastName}` : '');
    setDonorPhone(donor?.phone || '');
    setReportingStep('initial');
    setAmount('');
    setDonationNotes('');
    setBitTargetPhone('');
    setReferenceNumber('');
    setShowAddDonation(true);
  };

  const finalizeReporting = (status: string) => {
    if (status === 'donated') {
       let finalStatus: Donation['status'] = 'pending_verification';
       if (paymentMethod === 'cash') finalStatus = 'pending_cash';
       if (paymentMethod === 'online' || paymentMethod === 'credit') finalStatus = 'confirmed'; 

       addDonation({
        id: Math.random().toString(36).substr(2, 9),
        donorName: donorName || 'תורם כללי',
        donorPhone: donorPhone,
        amount: Number(amount) || 0,
        representativeId: rep.id,
        representativeName: rep.name,
        timestamp: new Date().toISOString(),
        method: paymentMethod,
        campaignId: rep.campaignId || '1',
        status: finalStatus,
        source: 'manual_rep',
        bitTargetPhone: (paymentMethod === 'bit' || paymentMethod === 'paybox') ? bitTargetPhone : undefined,
        referenceNumber: (paymentMethod === 'check' || paymentMethod === 'transfer') ? referenceNumber : undefined
      });
      setReportingStep('success');
    } else {
      if (activeDonorForReporting) {
        const mapping: Record<string, AssignmentStatus> = { refused: 'not_donated', not_home: 'call_back', come_later: 'call_back' };
        updateDonorStatus(activeDonorForReporting.id, mapping[status] || 'available');
      }
      setShowAddDonation(false);
    }
  };

  const RankIcon = ({ name }: { name: string }) => {
    switch (name) {
      case 'יהלום': return <Gem size={12} />;
      case 'זהב': return <Trophy size={12} />;
      case 'מתחיל': return <Sprout size={12} />;
      default: return <Award size={12} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-sans pb-32 transition-colors duration-300 overflow-x-hidden relative`} dir="rtl">
      <div className={`sticky top-0 z-40 w-full ${isDark ? 'bg-slate-900/90 border-white/5' : 'bg-white/90 border-slate-200'} backdrop-blur-xl border-b shadow-sm`}>
        <header className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-lg shrink-0">
              {rep?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-right">
              <h1 className="text-[15px] font-black leading-none mb-1 truncate max-w-[120px]">{rep?.name || 'נציג'}</h1>
              <div className="flex items-center gap-1.5 text-blue-600 justify-start">
                 <RankIcon name={currentRank.name} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{currentRank.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {onBackToAdmin && rep.role !== UserRole.REPRESENTATIVE && (
               <button onClick={onBackToAdmin} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black flex items-center gap-1 shadow-lg active:scale-90 transition-all">
                 <ChevronLeft size={14} /> חזרה לניהול
               </button>
             )}
             <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl transition-all active:scale-90">
               {isDark ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
             <button onClick={onLogout} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl transition-all active:scale-90">
               <LogOut size={20}/>
             </button>
          </div>
        </header>
      </div>

      <main className="max-w-lg mx-auto p-5 space-y-6 flex flex-col">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in flex flex-col w-full">
             <section className={`rounded-[35px] p-8 border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'} shadow-sm relative overflow-hidden w-full`}>
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                <div className="flex justify-between items-end mb-6">
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">גייסת היום (מאושר)</p>
                      <p className="text-3xl font-black tabular-nums">₪{(dailyRaised || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">יעד אישי</p>
                      <p className="text-sm font-black text-slate-500">₪{(rep?.personalGoal || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                    style={{width: `${Math.min(100, ((rep?.totalRaised || 0) / (rep?.personalGoal || 1)) * 100)}%`}}
                  ></div>
                </div>
                <p className="mt-3 text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                   סה"כ מאושר: ₪{(rep?.totalRaised || 0).toLocaleString()}
                </p>
             </section>

             <div className="grid grid-cols-2 gap-4 w-full">
                <button onClick={() => setActiveTab('myPath')} className={`p-6 rounded-[28px] border transition-all active:scale-95 group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                   <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-3 group-hover:bg-blue-600 group-hover:text-white">
                     <MapPinned size={30}/>
                   </div>
                   <span className="text-xs font-black block text-center">המסלול שלי</span>
                </button>
                <button onClick={() => setActiveTab('calls')} className={`p-6 rounded-[28px] border transition-all active:scale-95 group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                   <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-3 group-hover:bg-orange-600 group-hover:text-white">
                     <PhoneCall size={30}/>
                   </div>
                   <span className="text-xs font-black block text-center">רשימת שיחות</span>
                </button>
             </div>
             
             <section className="space-y-4 w-full">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">דיווחים אחרונים</h3>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
                <div className="space-y-3">
                  {(donations || []).filter(d => d.representativeId === rep?.id).slice(0, 5).map(d => (
                      <div key={d.id} className={`p-5 rounded-[24px] border flex items-center justify-between transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-sm'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 ${d.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} rounded-xl flex items-center justify-center font-black text-lg`}>₪</div>
                             <div className="text-right">
                                <p className="text-[13px] font-black">{d.donorName}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">{d.method}</p>
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${d.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {d.status === 'confirmed' ? 'מאושר' : d.status === 'pending_cash' ? 'ממתין למנהל' : 'באימות'}
                                  </span>
                                </div>
                             </div>
                          </div>
                          <span className="text-lg font-black tabular-nums">₪{(d.amount || 0).toLocaleString()}</span>
                      </div>
                  ))}
                </div>
             </section>
          </div>
        )}

        {activeTab === 'calls' && (
            <div className="space-y-5 animate-fade-in flex flex-col w-full">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black italic">רשימת שיחות</h2>
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black border border-orange-100 uppercase tracking-widest">
                       {myCallList?.donors?.length || 0} פתוחות
                    </span>
                </div>
                <div className="space-y-4">
                  {(myCallList?.donors || []).map(donor => (
                      <div key={donor.id} className={`rounded-[32px] border p-5 flex items-center gap-4 group transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div onClick={() => handleReportVisit(donor)} className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-[22px] flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-all cursor-pointer"><Phone size={24}/></div>
                          <div className="flex-1 min-w-0 text-right" onClick={() => handleReportVisit(donor)}>
                              <h4 className="text-sm font-black truncate">{donor.firstName} {donor.lastName}</h4>
                              <p className="text-[10px] text-slate-400 font-bold tabular-nums mt-0.5">{donor.phone}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                              <a href={`tel:${donor.phone}`} className="p-3.5 bg-orange-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><Phone size={20}/></a>
                              <a href={`https://wa.me/972${donor.phone?.substring(1)}`} target="_blank" className="p-3.5 bg-emerald-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><MessageCircle size={20}/></a>
                          </div>
                      </div>
                  ))}
                </div>
            </div>
        )}

        {activeTab === 'myPath' && (
           <div className="space-y-5 flex flex-col w-full animate-fade-in">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black italic">מפת המשימה</h2>
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 uppercase tracking-widest">
                  {myActivePath?.addresses?.length || 0} כתובות
                </div>
              </div>
              
              <div className="h-72 w-full bg-slate-100 rounded-[35px] overflow-hidden shadow-inner border border-slate-200 relative shrink-0 z-0">
                  <Map 
                    defaultCenter={{ lat: 31.768, lng: 35.213 }} 
                    defaultZoom={14} 
                    disableDefaultUI 
                    mapId="REP_VIEW_MAP"
                  >
                      {(myActivePath?.addresses || []).map((d, i) => (
                          <AdvancedMarker 
                            key={`marker-${d.id}`} 
                            position={{ lat: 31.768 + (i * 0.003), lng: 35.213 + (i * 0.003) }}
                          >
                              <Pin background="#2563eb" glyphColor="#fff" scale={0.9} />
                          </AdvancedMarker>
                      ))}
                  </Map>
              </div>

              <div className="space-y-4">
                {(myActivePath?.addresses || []).map((donor, idx) => (
                   <div key={donor.id} className={`rounded-[32px] border p-5 flex items-center gap-4 group transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div onClick={() => handleReportVisit(donor)} className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 cursor-pointer">{idx + 1}</div>
                      <div className="flex-1 min-w-0 text-right" onClick={() => handleReportVisit(donor)}>
                         <h4 className="text-[14px] font-black truncate">{donor.firstName} {donor.lastName}</h4>
                         <p className="text-[10px] text-slate-400 font-bold truncate flex items-center gap-1 mt-0.5 justify-end"><MapPin size={10}/> {(donor.street || '')} {(donor.building || '')}</p>
                      </div>
                      <button onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent((donor.street || '') + ' ' + (donor.building || '') + ' ' + (donor.city || ''))}&navigate=yes`)} className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-xl active:scale-90 transition-all shrink-0">
                        <Navigation2 size={20}/>
                      </button>
                   </div>
                ))}
              </div>
           </div>
        )}
      </main>

      <div className={`fixed bottom-0 inset-x-0 z-50 w-full flex justify-center ${isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-3xl border-t border-slate-100 dark:border-white/10 pb-safe`}>
        <nav className="w-full max-w-lg flex items-center justify-around py-4 h-20 px-2">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <Home size={22}/>
            <span className="text-[8px] font-black uppercase">בית</span>
          </button>
          <button onClick={() => setActiveTab('myPath')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'myPath' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <MapPinned size={22}/>
            <span className="text-[8px] font-black uppercase">מסלול</span>
          </button>
          <div className="relative -mt-14 shrink-0">
            <button onClick={() => handleReportVisit(null)} className={`w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl border-[6px] ${isDark ? 'border-slate-950' : 'border-slate-50'} active:scale-90 transition-all shadow-blue-600/40`}>
              <PlusCircle size={32}/>
            </button>
          </div>
          <button onClick={() => setActiveTab('calls')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'calls' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <Phone size={22}/>
            <span className="text-[8px] font-black uppercase">שיחות</span>
          </button>
          <button onClick={() => setActiveTab('share')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'share' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <Share2 size={22}/>
            <span className="text-[8px] font-black uppercase">שיתוף</span>
          </button>
        </nav>
      </div>

      {showAddDonation && (
        <div className="fixed inset-0 z-[1000] backdrop-blur-3xl bg-slate-900/80 flex items-center justify-center p-4 overflow-y-auto pt-20 pb-20">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-fade-in relative flex flex-col overflow-hidden my-auto">
              <div className="flex items-center justify-between mb-8 shrink-0">
                 <h2 className="text-xl font-black text-right w-full">דיווח פעילות</h2>
                 <button onClick={() => setShowAddDonation(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto scroll-hide pb-4">
                  {reportingStep === 'initial' && (
                    <div className="space-y-4 animate-fade-in">
                       <button onClick={() => setReportingStep('amount')} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"><Banknote size={24}/> התקבלה תרומה</button>
                       <button onClick={() => finalizeReporting('not_home')} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95"><Clock size={24}/> לא היה בבית</button>
                       <button onClick={() => finalizeReporting('come_later')} className="w-full py-5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-3xl font-black flex items-center justify-center gap-3 border border-amber-100 dark:border-amber-900/50 active:scale-95"><Clock size={24}/> לחזור מאוחר יותר</button>
                    </div>
                  )}

                  {reportingStep === 'amount' && (
                    <div className="space-y-8 animate-fade-in">
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₪</span>
                          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full text-5xl font-black text-center text-emerald-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-3xl py-10 outline-none focus:bg-white transition-all tabular-nums" autoFocus />
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">בחר אמצעי תשלום</p>
                          <div className="grid grid-cols-3 gap-3">
                             {(['cash', 'bit', 'paybox', 'online', 'check', 'transfer'] as const).map(m => (
                                <button key={m} onClick={() => setPaymentMethod(m)} className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-white/5'}`}>
                                    {m === 'cash' ? <Wallet size={20}/> : (m === 'bit' || m === 'paybox') ? <Smartphone size={20}/> : m === 'check' ? <FileText size={20}/> : m === 'transfer' ? <Landmark size={20}/> : <CreditCard size={20}/>}
                                    <span className="text-[8px] font-black uppercase">
                                      {m === 'cash' ? 'מזומן' : m === 'bit' ? 'ביט' : m === 'paybox' ? 'פייבוקס' : m === 'check' ? 'שיק' : m === 'transfer' ? 'העברה' : 'אשראי'}
                                    </span>
                                </button>
                             ))}
                          </div>
                       </div>
                       <button onClick={() => setReportingStep('details')} className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[28px] font-black shadow-xl text-lg active:scale-95 transition-all">המשך לפרטים</button>
                    </div>
                  )}

                  {reportingStep === 'details' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="space-y-4">
                          <div className="space-y-1 text-right"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם התורם</label><input value={donorName} onChange={e => setDonorName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none text-right" /></div>
                          
                          {(paymentMethod === 'bit' || paymentMethod === 'paybox') && clearingSettings[paymentMethod].mode === 'manual' && (
                            <div className="space-y-2 text-right animate-fade-in">
                               <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mr-2">לאיזה מספר הועבר הכסף?</label>
                               <div className="flex flex-wrap gap-2">
                                  {clearingSettings[paymentMethod].manualPhones.map(p => (
                                    <button 
                                      key={p} 
                                      type="button" 
                                      onClick={() => setBitTargetPhone(p)}
                                      className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${bitTargetPhone === p ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-blue-50 text-blue-700 border-blue-100'}`}
                                    >
                                       {p}
                                    </button>
                                  ))}
                               </div>
                            </div>
                          )}

                          {paymentMethod === 'transfer' && (
                             <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-right">
                                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">פרטי חשבון להעברה</p>
                                <p className="text-xs font-bold text-blue-900">{clearingSettings.transfer.bankDetails}</p>
                             </div>
                          )}

                          {paymentMethod === 'check' && (
                             <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-right">
                                <p className="text-[10px] font-black text-amber-400 uppercase mb-1">לפקודת</p>
                                <p className="text-xs font-bold text-amber-900">{clearingSettings.check.payableTo}</p>
                             </div>
                          )}

                          {(paymentMethod === 'check' || paymentMethod === 'transfer') && (
                            <div className="space-y-1 text-right animate-fade-in">
                               <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mr-2">{paymentMethod === 'check' ? 'מספר שיק' : 'אסמכתא (אופציונלי)'}</label>
                               <input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 text-sm font-black text-right outline-none" />
                            </div>
                          )}

                          <div className="space-y-1 text-right"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">הערות</label><textarea value={donationNotes} onChange={e => setDonationNotes(e.target.value)} placeholder="מידע חשוב..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs font-medium outline-none resize-none text-right" rows={2} /></div>
                       </div>
                       <button onClick={() => finalizeReporting('donated')} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl active:scale-95 transition-all mt-4">סיום ודיווח תרומה</button>
                    </div>
                  )}

                  {reportingStep === 'success' && (
                    <div className="text-center py-10 space-y-8 animate-fade-in flex flex-col items-center">
                       <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center shadow-xl"><Check size={48} strokeWidth={3} /></div>
                       <div className="space-y-2"><h3 className="text-3xl font-black tracking-tighter">הדיווח נקלט!</h3><p className="text-sm font-bold text-slate-400">גייסת <span className="text-emerald-600 font-black">₪{(Number(amount) || 0).toLocaleString()}</span> הממתינים לאימות מנהל.</p></div>
                       <button onClick={() => setShowAddDonation(false)} className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[30px] font-black shadow-xl active:scale-95 transition-all">סגור וחזור</button>
                    </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RepPortal;
