
import React, { useState, useMemo } from 'react';
import { Donation, Representative } from '../types';
import { 
  Search, Banknote, CheckCircle2, User, Clock, X, 
  AlertCircle, Receipt, History, 
  ArrowUpRight, Check, ChevronLeft, Landmark, FileText, Smartphone, CreditCard,
  Ban, ShieldCheck, Zap
} from 'lucide-react';

interface CashManagementProps {
  donations: Donation[];
  representatives: Representative[];
  onConfirm: (repId: string, finalAmount: number, pendingIds: string[]) => void;
}

const CashManagement: React.FC<CashManagementProps> = ({ donations, representatives, onConfirm }) => {
  const [activeTab, setActiveTab] = useState<'cash' | 'individual' | 'history'>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [finalConfirmedAmount, setFinalConfirmedAmount] = useState<number>(0);

  // Filter pending cash
  const pendingCashDonations = useMemo(() => 
    donations.filter(d => d.status === 'pending_cash' && d.method === 'cash'),
    [donations]
  );

  // Filter pending verification (Checks, Transfers, Manual Bit, Credit)
  const pendingIndividualDonations = useMemo(() =>
    donations.filter(d => d.status === 'pending_verification' && d.method !== 'cash'),
    [donations]
  );

  const pendingByRep = useMemo(() => 
    representatives.map(rep => {
      const repDonations = pendingCashDonations.filter(d => d.representativeId === rep.id);
      return {
        ...rep,
        pendingCount: repDonations.length,
        pendingTotal: repDonations.reduce((sum, d) => sum + d.amount, 0),
        pendingDonations: repDonations
      };
    }).filter(r => r.pendingCount > 0 && r.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [representatives, pendingCashDonations, searchTerm]
  );

  const selectedRep = pendingByRep.find(r => r.id === selectedRepId);

  const handleSelectRep = (rep: any) => {
    setSelectedRepId(rep.id);
    setFinalConfirmedAmount(rep.pendingTotal);
  };

  const handleConfirmBatch = () => {
    if (!selectedRep) return;
    onConfirm(selectedRep.id, finalConfirmedAmount, selectedRep.pendingDonations.map(d => d.id));
    setSelectedRepId(null);
  };

  const handleConfirmSingle = (donationId: string, amount: number, repId: string) => {
    onConfirm(repId, amount, [donationId]);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'check': return <FileText size={16} className="text-amber-600" />;
      case 'transfer': return <Landmark size={16} className="text-blue-600" />;
      case 'bit': return <Smartphone size={16} className="text-brand-600" />;
      case 'online': case 'credit': return <CreditCard size={16} className="text-slate-400" />;
      default: return <Banknote size={16} className="text-emerald-500" />;
    }
  };

  const getMethodLabel = (method: string) => {
    const map: Record<string, string> = { check: 'שיק', transfer: 'העברה', bit: 'ביט', credit: 'אשראי', online: 'אשראי (אונליין)' };
    return map[method] || method;
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">מרכז אימות תרומות <span className="text-blue-600">VERIFY</span></h1>
          <p className="text-slate-500 font-medium text-sm">ניהול הפקדות מזומן ואימות פרטני של שיקים והעברות</p>
        </div>
        
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm overflow-x-auto scroll-hide">
           <button 
             onClick={() => setActiveTab('cash')} 
             className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'cash' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <Banknote size={14} />
              אישור מזומן ({pendingByRep.length})
           </button>
           <button 
             onClick={() => setActiveTab('individual')} 
             className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'individual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <ShieldCheck size={14} />
              אימות פרטני ({pendingIndividualDonations.length})
           </button>
           <button 
             onClick={() => setActiveTab('history')} 
             className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <History size={14} />
              היסטוריה
           </button>
        </div>
      </div>

      {activeTab === 'cash' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-4 space-y-6">
             <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm p-6 overflow-hidden">
                <div className="relative mb-6">
                   <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חפש נציג להפקדה..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-4 py-4 text-sm font-bold outline-none shadow-sm" />
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scroll-hide">
                   {pendingByRep.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><CheckCircle2 size={32} /></div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">אין הפקדות מזומן ממתינות</p>
                      </div>
                   ) : (
                      pendingByRep.map(rep => (
                         <button key={rep.id} onClick={() => handleSelectRep(rep)} className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all ${selectedRepId === rep.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                            <div className="flex items-center gap-4 text-right">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${selectedRepId === rep.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>{rep.name.charAt(0)}</div>
                               <div><p className="text-sm font-black">{rep.name}</p><p className={`text-[10px] font-bold uppercase tracking-widest ${selectedRepId === rep.id ? 'text-blue-100' : 'text-slate-400'}`}>{rep.pendingCount} תרומות</p></div>
                            </div>
                            <div className="text-left font-black tabular-nums text-lg">{rep.pendingTotal.toLocaleString()} ש"ח</div>
                         </button>
                      ))
                   )}
                </div>
             </div>
          </div>

          <div className="xl:col-span-8">
             {selectedRep ? (
                <div className="bg-white rounded-[45px] border border-slate-200 shadow-2xl overflow-hidden animate-fade-in">
                   <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20"><User size={32} /></div>
                         <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-none mb-2">{selectedRep.name}</h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">אימות הפקדת מזומן יומית</span>
                         </div>
                      </div>
                      <button onClick={() => setSelectedRepId(null)} className="p-3 text-slate-400 hover:text-red-500 transition-all"><X size={24} /></button>
                   </div>
                   <div className="p-10 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mr-2">פירוט התרומות</h3>
                            <div className="space-y-3">
                               {selectedRep.pendingDonations.map(d => (
                                  <div key={d.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                     <div><p className="text-xs font-black text-slate-900">{d.donorName}</p><p className="text-[9px] text-slate-400 font-bold tabular-nums">{new Date(d.timestamp).toLocaleString()}</p></div>
                                     <div className="font-black text-sm tabular-nums text-slate-700">{d.amount.toLocaleString()} ₪</div>
                                  </div>
                               ))}
                            </div>
                         </div>
                         <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px]"></div>
                            <div>
                               <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Banknote size={24} className="text-blue-500" /> סגירת הפקדה</h3>
                               <div className="space-y-6">
                                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">סכום מדווח</p>
                                     <p className="text-4xl font-black tabular-nums">{selectedRep.pendingTotal.toLocaleString()} ₪</p>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest mr-2">סכום שהתקבל בפועל (₪)</label>
                                     <input type="number" value={finalConfirmedAmount} onChange={e => setFinalConfirmedAmount(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-3xl p-6 text-3xl font-black text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all text-center tabular-nums" />
                                  </div>
                               </div>
                            </div>
                            <div className="mt-10 pt-10 border-t border-white/5">
                               <button onClick={handleConfirmBatch} className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-[30px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"><CheckCircle2 size={28} /> אשר וקלוט תרומות</button>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[45px] flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-60">
                   <Banknote size={64} className="text-slate-300" />
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">בחר נציג מהרשימה לאישור הפקדה</p>
                </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                 <h3 className="text-lg font-black text-slate-900">אימות פרטני</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">שיקים, העברות בנקאיות ותרומות ביט ידניות</p>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead>
                    <tr className="bg-slate-50/30 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                       <th className="px-10 py-5">תורם / נציג</th>
                       <th className="px-10 py-5">סוג תשלום</th>
                       <th className="px-10 py-5">פרטי אימות</th>
                       <th className="px-10 py-5 text-center">סכום</th>
                       <th className="px-10 py-5 text-center">פעולות</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {pendingIndividualDonations.length === 0 ? (
                       <tr><td colSpan={5} className="px-10 py-24 text-center text-slate-300 font-bold italic">אין תרומות הממתינות לאימות פרטני</td></tr>
                    ) : (
                       pendingIndividualDonations.map(donation => (
                          <tr key={donation.id} className="hover:bg-slate-50/50 transition-all">
                             <td className="px-10 py-5">
                                <p className="font-black text-slate-900 text-sm">{donation.donorName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">דווח ע"י: {donation.representativeName}</p>
                             </td>
                             <td className="px-10 py-5">
                                <div className="flex items-center gap-2">
                                   {getMethodIcon(donation.method)}
                                   <span className="text-[11px] font-black text-slate-600">{getMethodLabel(donation.method)}</span>
                                </div>
                             </td>
                             <td className="px-10 py-5">
                                {donation.method === 'bit' && donation.bitTargetPhone && (
                                   <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
                                      <span className="text-[9px] font-black text-blue-600 uppercase">נשלח ל:</span>
                                      <span className="text-[11px] font-black text-blue-800 tabular-nums">{donation.bitTargetPhone}</span>
                                   </div>
                                )}
                                {donation.referenceNumber && (
                                   <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
                                      <span className="text-[9px] font-black text-slate-500 uppercase">אסמכתא:</span>
                                      <span className="text-[11px] font-black text-slate-700">{donation.referenceNumber}</span>
                                   </div>
                                )}
                                {(!donation.bitTargetPhone && !donation.referenceNumber) && <span className="text-[10px] text-slate-300 italic">אין פרטים נוספים</span>}
                             </td>
                             <td className="px-10 py-5 text-center font-black tabular-nums text-sm">₪{donation.amount.toLocaleString()}</td>
                             <td className="px-10 py-5 text-center">
                                <div className="flex justify-center gap-2">
                                   <button onClick={() => handleConfirmSingle(donation.id, donation.amount, donation.representativeId)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black shadow-lg hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2"><Check size={14}/> אשר תרומה</button>
                                   <button className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Ban size={14}/></button>
                                </div>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><History size={20} className="text-blue-600" /> יומן אישורים אחרונים</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead>
                    <tr className="bg-slate-50/30 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                       <th className="px-10 py-5">תורם</th>
                       <th className="px-10 py-5">נציג</th>
                       <th className="px-10 py-5 text-center">אמצעי תשלום</th>
                       <th className="px-10 py-5 text-center">זמן אישור</th>
                       <th className="px-10 py-5 text-center">סכום</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {donations.filter(d => d.status === 'confirmed').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20).map(donation => (
                       <tr key={donation.id} className="hover:bg-slate-50/50">
                          <td className="px-10 py-5 font-black text-slate-900 text-sm">{donation.donorName}</td>
                          <td className="px-10 py-5 font-bold text-slate-600 text-xs">{donation.representativeName}</td>
                          <td className="px-10 py-5 text-center"><div className="flex items-center justify-center gap-2">{getMethodIcon(donation.method)} <span className="text-[10px] font-bold text-slate-400 uppercase">{donation.method}</span></div></td>
                          <td className="px-10 py-5 text-center text-[10px] font-black text-slate-400 tabular-nums">{new Date(donation.timestamp).toLocaleString('he-IL')}</td>
                          <td className="px-10 py-5 text-center font-black text-emerald-600 tabular-nums">₪{donation.amount.toLocaleString()}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default CashManagement;
