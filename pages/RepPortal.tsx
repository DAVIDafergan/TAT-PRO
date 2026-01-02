import React, { useState, useMemo, useEffect } from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Representative, Donation, Path, CallList, Donor, AssignmentStatus, Patrol, SystemMessage, UserRole, PaymentMethod, ClearingSettings, Gift, Lottery } from '../types';
import { mockRanks } from '../services/mockData';
import { db } from '../services/db'; // חיבור למסד הנתונים
import { 
  Home, PlusCircle, Clock, MapPin, 
  X, Smartphone, Wallet, CreditCard, Check, 
  Phone, TrendingUp, Banknote, Sun, Moon, 
  LogOut, MapPinned, PhoneCall, MessageCircle, 
  Navigation2, Share2, Award, Gem, Sprout, Trophy, ChevronLeft,
  FileText, Landmark, Info, Bell, Send, User, MessageSquare, ClipboardEdit,
  Gift as GiftIcon, Ticket, CheckCircle2, ChevronRight, Sparkles
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
  gifts: Gift[];
  lotteries: Lottery[];
}

const RepPortal: React.FC<RepPortalProps> = ({ 
  rep, donations, addDonation, paths, callLists, updateDonorStatus, onLogout, onBackToAdmin, clearingSettings, systemMessages, sendRepMessage, donors, gifts, lotteries
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'myPath' | 'calls' | 'share'>('home');
  const [activeDonorForReporting, setActiveDonorForReporting] = useState<Donor | null>(null);
  const [reportingStep, setReportingStep] = useState<'initial' | 'amount' | 'details' | 'success'>('initial');
  
  // State להודעות והתראות
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [repMessageToAdmin, setRepMessageToAdmin] = useState('');

  // State לשיתוף
  const [shareText, setShareText] = useState('היי, אני לוקח חלק בקמפיין החשוב הזה! אשמח שתעזור לי להגיע ליעד שלי דרך הלינק האישי:');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donationNotes, setDonationNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bitTargetPhone, setBitTargetPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const isDark = theme === 'dark';

  // --- תיקון סנכרון: חישוב סכום גיוס חי בזמן אמת ---
  const liveTotalRaised = useMemo(() => {
    return (donations || [])
      .filter(d => d.representativeId === rep?.id && d.status === 'confirmed')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [donations, rep?.id]);

  // חישובי מתנות והגרלות מסונכרנים לסכום החי
  const earnedGifts = useMemo(() => (gifts || []).filter(g => liveTotalRaised >= g.minAmount).sort((a,b) => b.minAmount - a.minAmount), [gifts, liveTotalRaised]);
  const nextGift = useMemo(() => (gifts || []).filter(g => liveTotalRaised < g.minAmount).sort((a,b) => a.minAmount - b.minAmount)[0], [gifts, liveTotalRaised]);
  const eligibleLotteries = useMemo(() => (lotteries || []).filter(l => liveTotalRaised >= (l.minThreshold || 0)), [lotteries, liveTotalRaised]);

  // סנכרון משימות מהמסד
  const myActivePath = useMemo(() => (paths || []).find(p => p.assignedRepIds?.includes(rep?.id) || p.assignedRepIds?.includes(rep?.username)), [paths, rep]);
  const myCallList = useMemo(() => (callLists || []).find(cl => cl.assignedRepIds?.includes(rep?.id) || cl.assignedRepIds?.includes(rep?.username)), [callLists, rep]);
  
  // סינון הודעות רלוונטיות לנציג
  const myMessages = useMemo(() => (systemMessages || []).filter(m => 
    m.targetType === 'all' || 
    (m.targetType === 'specific' && m.targetIds?.includes(rep.id)) ||
    (m.targetType === 'group' && m.targetGroup === rep.groupId)
  ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [systemMessages, rep]);

  const currentRank = useMemo(() => {
    const total = liveTotalRaised;
    return [...mockRanks].reverse().find(r => total >= r.minAmount) || mockRanks[0];
  }, [liveTotalRaised]);

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

  const finalizeReporting = async (status: string) => {
    if (status === 'donated') {
       let finalStatus: Donation['status'] = 'pending_verification';
       if (paymentMethod === 'cash') finalStatus = 'pending_cash';
       if (paymentMethod === 'online' || paymentMethod === 'credit') finalStatus = 'confirmed'; 

       const donationAmount = Number(amount) || 0;
       const donationData: Donation = {
        id: Math.random().toString(36).substr(2, 9),
        donorName: donorName || 'תורם כללי',
        donorPhone: donorPhone,
        amount: donationAmount,
        representativeId: rep.id,
        representativeName: rep.name,
        timestamp: new Date().toISOString(),
        method: paymentMethod,
        campaignId: rep.campaignId || '1',
        status: finalStatus,
        source: 'manual_rep',
        bitTargetPhone: (paymentMethod === 'bit' || paymentMethod === 'paybox') ? bitTargetPhone : undefined,
        referenceNumber: (paymentMethod === 'check' || paymentMethod === 'transfer') ? referenceNumber : undefined
      };

      addDonation(donationData);
      db.addDonation(donationData);
      
      // עדכון ה-CRM: הוספת סכום התרומה לפרטי התורם ושינוי סטטוס
      if (activeDonorForReporting) {
        const updatedDonor = { 
          ...activeDonorForReporting, 
          treatmentStatus: 'donated' as any,
          totalDonations: (activeDonorForReporting.totalDonations || 0) + donationAmount 
        };
        updateDonorStatus(activeDonorForReporting.id, 'donated');
        await db.saveDonor(updatedDonor);
      }

      setReportingStep('success');
    } else {
      // עדכון סטטוסים לפי דיווח (לא היה בבית / לחזור אליו)
      if (activeDonorForReporting) {
        const mapping: Record<string, AssignmentStatus> = { 
            refused: 'not_donated', 
            not_home: 'call_back', 
            come_later: 'call_back' 
        };
        const newStatus = mapping[status] || 'available';
        
        updateDonorStatus(activeDonorForReporting.id, newStatus);
        await db.saveDonor({ 
            ...activeDonorForReporting, 
            treatmentStatus: (status === 'refused' ? 'not_donated' : status) as any 
        });
      }
      setShowAddDonation(false);
    }
  };

  const handleSendMessageToAdmin = () => {
    if (!repMessageToAdmin.trim()) return;
    sendRepMessage(repMessageToAdmin);
    
    // סנכרון לשרת
    const msgId = Math.random().toString(36).substr(2, 9);
    db.saveRepToAdminMessage({
      id: msgId,
      repId: rep.id,
      repName: rep.name,
      content: repMessageToAdmin,
      timestamp: new Date().toISOString(),
      status: 'new'
    });

    setRepMessageToAdmin('');
    alert('ההודעה נשלחה למנהל');
  };

  const handleBulkShare = (method: 'whatsapp' | 'sms') => {
    const nums = phoneNumbers.split(/[, \n]+/).filter(n => n.length >= 9);
    const personalLink = `https://tatpro.online/rep/${rep.username || rep.id}`;
    const fullMessage = `${shareText}\n${personalLink}`;

    nums.forEach(num => {
      const formattedNum = num.startsWith('0') ? `972${num.substring(1)}` : num;
      const url = method === 'whatsapp' 
        ? `https://wa.me/${formattedNum}?text=${encodeURIComponent(fullMessage)}`
        : `sms:${num}?body=${encodeURIComponent(fullMessage)}`;
      window.open(url, '_blank');
    });

    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 5000);
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
      {/* Header */}
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
              <button onClick={() => setShowMessagesModal(true)} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl relative">
                <Bell size={20}/>
                {myMessages.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">{myMessages.length}</span>}
              </button>
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
             {/* כרטיס יעד ראשי מסונכרן חי */}
             <section className={`rounded-[35px] p-8 border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'} shadow-sm relative overflow-hidden w-full`}>
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                <div className="flex justify-between items-end mb-6">
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">גייסת היום (מאושר)</p>
                      <p className="text-3xl font-black tabular-nums text-blue-600">₪{(dailyRaised || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">יעד אישי</p>
                      <p className="text-sm font-black text-slate-500">₪{(rep?.personalGoal || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                    style={{width: `${Math.min(100, (liveTotalRaised / (rep?.personalGoal || 1)) * 100)}%`}}
                  ></div>
                </div>
                <p className="mt-3 text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                   סה"כ מאושר חי: <span className="font-black text-slate-600 dark:text-slate-300">₪{liveTotalRaised.toLocaleString()}</span>
                </p>
             </section>

             {/* מדור מתנות והגרלות Luxury - מסונכרן מהניהול */}
             <div className="grid grid-cols-1 gap-4">
                {/* כרטיס מתנות */}
                <section className={`rounded-[30px] p-6 border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'} shadow-sm space-y-6 relative overflow-hidden`}>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                            <GiftIcon size={22} />
                         </div>
                         <h3 className="text-[15px] font-black">המתנות שלי</h3>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{earnedGifts.length} בוצעו</span>
                   </div>

                   {nextGift ? (
                     <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-5 rounded-[24px] space-y-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">היעד הבא</p>
                              <p className="text-sm font-black text-blue-600">{nextGift.name}</p>
                           </div>
                           <div className="text-left">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">חסר עוד</p>
                              <p className="text-sm font-black tabular-nums text-slate-700 dark:text-slate-200">₪{(nextGift.minAmount - liveTotalRaised).toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-1000 shadow-lg" 
                             style={{width: `${Math.min(100, (liveTotalRaised / nextGift.minAmount) * 100)}%`}}
                           ></div>
                        </div>
                     </div>
                   ) : (
                     <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-[24px] border border-emerald-100 dark:border-emerald-900/20 flex items-center gap-4 animate-pulse">
                        <Sparkles className="text-emerald-600" size={24} />
                        <div>
                           <p className="text-xs font-black text-emerald-800 dark:text-emerald-400">הגעת לפסגה!</p>
                           <p className="text-[10px] font-bold text-emerald-600/80 uppercase">זכית בכל המתנות האפשריות בקמפיין.</p>
                        </div>
                     </div>
                   )}

                   {earnedGifts.length > 0 && (
                     <div className="flex gap-3 overflow-x-auto py-1 scroll-hide">
                        {earnedGifts.map(gift => (
                          <div key={gift.id} className="px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl flex items-center gap-3 shrink-0 border border-slate-100 dark:border-white/5 shadow-sm">
                             <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                <CheckCircle2 size={14} strokeWidth={3} />
                             </div>
                             <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{gift.name}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </section>

                {/* כרטיס הגרלות */}
                <section className={`rounded-[30px] p-6 border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'} shadow-sm space-y-5`}>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600">
                         <Ticket size={22} />
                      </div>
                      <h3 className="text-[15px] font-black">הגרלות פעילות</h3>
                   </div>

                   <div className="space-y-3">
                      {eligibleLotteries.length > 0 ? (
                        eligibleLotteries.map(lottery => (
                          <div key={lottery.id} className="group flex items-center justify-between p-4 bg-orange-50/20 dark:bg-orange-900/5 rounded-[22px] border border-orange-100/50 dark:border-orange-900/20 hover:border-orange-300 transition-all">
                             <div className="text-right">
                                <p className="text-[13px] font-black text-slate-800 dark:text-white leading-none mb-1.5">{lottery.title}</p>
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-tight flex items-center gap-1.5">
                                   <Star size={10} fill="currentColor" /> {lottery.prize}
                                </p>
                             </div>
                             <div className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-500/20 flex items-center gap-1">
                                <Check size={10} strokeWidth={3} /> זכאי להשתתף
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                           <Ticket className="mx-auto text-slate-300 mb-2 opacity-30" size={32} />
                           <p className="text-[11px] text-slate-400 font-bold uppercase italic tracking-widest">המשך לגייס כדי להיכנס להגרלות היוקרתיות!</p>
                        </div>
                      )}
                   </div>
                </section>
             </div>

             <div className="grid grid-cols-2 gap-4 w-full">
                <button onClick={() => setActiveTab('myPath')} className={`p-6 rounded-[28px] border transition-all active:scale-95 group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                   <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                     <MapPinned size={30}/>
                   </div>
                   <span className="text-xs font-black block text-center">המסלול שלי</span>
                </button>
                <button onClick={() => setActiveTab('calls')} className={`p-6 rounded-[28px] border transition-all active:scale-95 group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                   <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-3 group-hover:bg-orange-600 group-hover:text-white transition-all">
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

        {/* שאר הטאבים נשמרים ללא שינוי אות... */}
        {activeTab === 'calls' && (
            <div className="space-y-5 animate-fade-in flex flex-col w-full">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black italic">רשימת שיחות</h2>
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black border border-orange-100 uppercase tracking-widest">
                       {myCallList?.donors?.length || 0} פתוחות
                    </span>
                </div>
                <div className="space-y-4">
                  {(myCallList?.donors || []).map(donor => {
                      const isHandled = donor.treatmentStatus === 'donated' || donor.treatmentStatus === 'not_donated';
                      return (
                      <div key={donor.id} className={`rounded-[32px] border p-5 flex items-center gap-4 group transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'} ${isHandled ? 'opacity-60 bg-slate-50' : ''}`}>
                          <div onClick={!isHandled ? () => handleReportVisit(donor) : undefined} className={`w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 transition-all ${isHandled ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 group-hover:bg-orange-600 group-hover:text-white cursor-pointer'}`}>
                            {isHandled ? <Check size={24}/> : <ClipboardEdit size={24}/>}
                          </div>
                          <div className="flex-1 min-w-0 text-right" onClick={!isHandled ? () => handleReportVisit(donor) : undefined}>
                              <h4 className="text-sm font-black truncate">{donor.firstName} {donor.lastName}</h4>
                              <p className="text-[10px] text-slate-400 font-bold tabular-nums mt-0.5">{donor.phone}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                              <a href={`tel:${donor.phone}`} className="p-3.5 bg-orange-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all">
                                <Phone size={20}/>
                              </a>
                              <button onClick={() => handleReportVisit(donor)} className="p-3.5 bg-emerald-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all">
                                <PlusCircle size={20}/>
                              </button>
                          </div>
                      </div>
                  )})}
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
                {(myActivePath?.addresses || []).map((donor, idx) => {
                   const isHandled = donor.treatmentStatus === 'donated' || donor.treatmentStatus === 'not_donated';
                   return (
                   <div key={donor.id} className={`rounded-[32px] border p-5 flex items-center gap-4 group transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'} ${isHandled ? 'opacity-60 bg-slate-50' : ''}`}>
                      <div onClick={!isHandled ? () => handleReportVisit(donor) : undefined} className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all shrink-0 ${isHandled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white cursor-pointer'}`}>
                        {isHandled ? <Check size={20}/> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 text-right" onClick={!isHandled ? () => handleReportVisit(donor) : undefined}>
                         <h4 className="text-[14px] font-black truncate">{donor.firstName} {donor.lastName}</h4>
                         <p className="text-[10px] text-slate-400 font-bold truncate flex items-center gap-1 mt-0.5 justify-end"><MapPin size={10}/> {(donor.street || '')} {(donor.building || '')}</p>
                      </div>
                      <button onClick={() => handleReportVisit(donor)} className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-xl active:scale-90 transition-all shrink-0">
                        <PlusCircle size={24}/>
                      </button>
                   </div>
                )})}
              </div>
           </div>
        )}

        {activeTab === 'share' && (
          <div className="space-y-6 animate-fade-in flex flex-col w-full text-right">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Share2 size={24}/></div>
                <div>
                   <h2 className="text-xl font-black italic leading-none">מרכז השיתוף</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">שלח לינק אישי לנמענים</p>
                </div>
             </div>

             <div className={`p-6 rounded-[35px] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'} space-y-5`}>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase mr-1">הודעה מותאמת אישית</label>
                   <textarea value={shareText} onChange={e => setShareText(e.target.value)} rows={4} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs font-bold outline-none resize-none text-right" />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase mr-1">מספרי טלפון (הפרד בפסיק או רווח)</label>
                   <input value={phoneNumbers} onChange={e => setPhoneNumbers(e.target.value)} placeholder="0501234567, 0527654321..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs font-bold outline-none text-right" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <button onClick={() => handleBulkShare('whatsapp')} className="py-5 bg-emerald-500 text-white rounded-[24px] font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"><MessageCircle size={18}/> שלח בוואטסאפ</button>
                   <button onClick={() => handleBulkShare('sms')} className="py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"><Smartphone size={18}/> שלח כ-SMS</button>
                </div>

                {shareSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black text-center animate-bounce border border-emerald-100 mt-4">
                     ✅ ההודעות נשלחו בהצלחה. תוכל לעקוב אחרי ההכנסות מדף הבית באיזור האישי.
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      {/* הודעות והתראות Modal - סנכרון דו כיווני */}
      {showMessagesModal && (
        <div className="fixed inset-0 z-[1000] backdrop-blur-3xl bg-slate-900/80 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-6 shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-6 shrink-0">
                 <h2 className="text-xl font-black text-right w-full flex items-center gap-2 justify-end">הודעות מהנהלה <Bell size={20} className="text-blue-600"/></h2>
                 <button onClick={() => setShowMessagesModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-hide">
                 {myMessages.length === 0 ? (
                   <div className="py-10 text-center text-slate-400 text-xs font-bold uppercase italic">אין הודעות חדשות</div>
                 ) : (
                   myMessages.map(msg => (
                     <div key={msg.id} className={`p-4 rounded-3xl border-r-4 ${msg.type === 'urgent' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-blue-50 border-blue-500 text-blue-900'}`}>
                        <h4 className="font-black text-[13px] mb-1">{msg.title}</h4>
                        <p className="text-[11px] font-medium leading-relaxed">{msg.content}</p>
                        <p className="text-[8px] opacity-50 mt-2 font-black">{new Date(msg.timestamp).toLocaleString('he-IL')}</p>
                     </div>
                   ))
                 )}
              </div>

              <div className="pt-6 border-t mt-6 space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">שלח הודעה למנהל</p>
                 <div className="relative">
                    <textarea value={repMessageToAdmin} onChange={e => setRepMessageToAdmin(e.target.value)} rows={2} placeholder="כתוב כאן..." className="w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl p-4 text-xs font-bold outline-none text-right resize-none" />
                    <button onClick={handleSendMessageToAdmin} className="absolute left-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Send size={16}/></button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Navigation Bottom */}
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
           <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[40px] p-8 shadow-2xl animate-fade-in relative flex flex-col overflow-hidden my-auto">
              <div className="flex items-center justify-between mb-8 shrink-0">
                 <h2 className="text-xl font-black text-right w-full">דיווח פעילות</h2>
                 <button onClick={() => setShowAddDonation(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto scroll-hide pb-4">
                  {reportingStep === 'initial' && (
                    <div className="space-y-4 animate-fade-in">
                       <button onClick={() => setReportingStep('amount')} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"><Banknote size={24}/> התקבלה תרומה</button>
                       <button onClick={() => finalizeReporting('refused')} className="w-full py-5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 border border-red-100"><X size={24}/> לא תרם</button>
                       <button onClick={() => finalizeReporting('not_home')} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95"><Clock size={24}/> לא היה בבית</button>
                       <button onClick={() => finalizeReporting('come_later')} className="w-full py-5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-3xl font-black flex items-center justify-center gap-3 border border-amber-100 dark:border-amber-900/50 active:scale-95"><Phone size={24}/> לחזור אליו (שיחה)</button>
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