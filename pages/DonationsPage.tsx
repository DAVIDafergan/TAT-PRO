
import React, { useState, useMemo } from 'react';
import { Donation, Representative, Campaign, Donor, CampaignGroup, PaymentMethod } from '../types';
import { 
  CreditCard, Search, Plus, X, Wallet, Smartphone, Globe, ListFilter, 
  Calendar, Clock, UserCircle, Banknote, ShieldCheck, Info, Check,
  ExternalLink, ArrowUpRight, Link as LinkIcon, RefreshCw, Layers,
  FileText, Landmark, Ban, ShieldAlert, CloudLightning
} from 'lucide-react';

interface DonationsPageProps {
  donations: Donation[];
  addDonation: (d: Donation) => void;
  reps: Representative[];
  campaigns: Campaign[];
  donors: Donor[];
  groups: CampaignGroup[];
  activeCampaignId: string;
}

const DonationsPage: React.FC<DonationsPageProps> = ({ donations, addDonation, reps, campaigns, donors, groups, activeCampaignId }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'charidy'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [filters, setFilters] = useState({ searchTerm: '', repId: '', method: '' });

  const [newDonation, setNewDonation] = useState<Partial<Donation>>({
    donorName: '', amount: 0, representativeId: '', method: 'cash', campaignId: activeCampaignId, source: 'system'
  });

  const filteredDonations = useMemo(() => {
    let base = donations;
    if (activeTab === 'charidy') base = donations.filter(d => d.source === 'charidy');
    
    return base.filter(d => {
      const matchesSearch = d.donorName.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
                           d.representativeName.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesRep = !filters.repId || d.representativeId === filters.repId;
      const matchesMethod = !filters.method || d.method === filters.method;
      return matchesSearch && matchesRep && matchesMethod;
    });
  }, [donations, filters, activeTab]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonation.donorName || !newDonation.amount || !newDonation.representativeId) return;
    
    const rep = reps.find(r => r.id === newDonation.representativeId);
    let status: Donation['status'] = 'pending_verification';
    if (newDonation.method === 'cash') status = 'pending_cash';
    if (newDonation.method === 'online' || newDonation.method === 'credit') status = 'confirmed';

    const donation: Donation = {
      id: Math.random().toString(36).substr(2, 9),
      donorName: newDonation.donorName!,
      amount: Number(newDonation.amount),
      representativeId: newDonation.representativeId!,
      representativeName: rep?.name || 'נציג לא ידוע',
      timestamp: new Date().toISOString(),
      method: (newDonation.method as PaymentMethod) || 'cash',
      campaignId: activeCampaignId,
      status: status,
      source: 'system'
    };
    
    addDonation(donation);
    setShowAddModal(false);
    setNewDonation({ donorName: '', amount: 0, representativeId: '', method: 'cash', campaignId: activeCampaignId, source: 'system' });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'online': case 'credit': return <CreditCard size={14} className="text-slate-400" />;
      case 'cash': return <Wallet size={14} className="text-emerald-500" />;
      case 'bit': return <Smartphone size={14} className="text-brand-600" />;
      case 'check': return <FileText size={14} className="text-amber-600" />;
      case 'transfer': return <Landmark size={14} className="text-blue-700" />;
      default: return <Banknote size={14} className="text-slate-400" />;
    }
  };

  const getStatusLabel = (status: Donation['status']) => {
    switch (status) {
      case 'confirmed': return { label: 'מאושר', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'pending_cash': return { label: 'ממתין להפקדה', color: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'pending_verification': return { label: 'באימות', color: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'rejected': return { label: 'בוטל', color: 'bg-red-50 text-red-600 border-red-100' };
      default: return { label: status, color: 'bg-slate-50' };
    }
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">ניהול תרומות <span className="text-blue-600">FINANCE</span></h1>
          <p className="text-slate-500 font-medium text-sm">מעקב מלא אחר כלל הגיוסים כולל אימות רב-ערוצי</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" value={filters.searchTerm} onChange={e => setFilters({...filters, searchTerm: e.target.value})} placeholder="חפש תרומה..." className="bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold shadow-sm outline-none w-64" />
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg active:scale-95"><Plus size={18} /> הוספת תרומה</button>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl border border-slate-200 p-1 mb-6 shadow-sm w-fit overflow-hidden">
         <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>כל התרומות</button>
         <button onClick={() => setActiveTab('charidy')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'charidy' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>סנכרון חיצוני (צ'רידי)</button>
      </div>

      <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[1100px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
              <th className="px-8 py-5">תורם / מקור</th>
              <th className="px-8 py-5">נציג / קבוצה</th>
              <th className="px-8 py-5">אמצעי תשלום</th>
              <th className="px-8 py-5 text-center">פרטי אימות</th>
              <th className="px-8 py-5 text-center">סטטוס</th>
              <th className="px-8 py-5 text-center">סכום</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDonations.length === 0 ? (
               <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold italic">אין תרומות להצגה</td></tr>
            ) : (
              filteredDonations.map(donation => {
                const st = getStatusLabel(donation.status);
                return (
                  <tr key={donation.id} className="hover:bg-blue-50/20 transition-all cursor-pointer group">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${donation.source === 'charidy' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                             {donation.source === 'charidy' ? 'C' : 'S'}
                          </div>
                          <div>
                             <p className="font-black text-slate-900 text-sm">{donation.donorName}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tabular-nums">{new Date(donation.timestamp).toLocaleDateString()}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-black text-slate-700">{donation.representativeName}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{reps.find(r => r.id === donation.representativeId)?.group || 'כללי'}</p>
                    </td>
                    <td className="px-8 py-5"><div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase">{getMethodIcon(donation.method)} {donation.method}</div></td>
                    
                    <td className="px-8 py-5 text-center">
                       {donation.source === 'charidy' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                             <CloudLightning size={10} className="text-blue-500" />
                             <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter italic">סונכרן עם צ'רידי</span>
                          </div>
                       ) : donation.verifiedBy ? (
                          <div className="flex flex-col items-center">
                             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
                                <Check size={10} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">אומת ע"י מנהל</span>
                             </div>
                             <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase">@{donation.verifiedBy} | {donation.verifiedAt}</span>
                          </div>
                       ) : (
                          <div className="flex flex-col items-center gap-1">
                             {donation.bitTargetPhone && <span className="text-[9px] font-black text-blue-600 tabular-nums">יעד: {donation.bitTargetPhone}</span>}
                             {donation.referenceNumber && <span className="text-[9px] font-black text-slate-500">אסמכתא: {donation.referenceNumber}</span>}
                             {!donation.bitTargetPhone && !donation.referenceNumber && <span className="text-[10px] text-slate-300 italic">טרם אומת</span>}
                          </div>
                       )}
                    </td>

                    <td className="px-8 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase inline-flex items-center gap-1.5 border ${st.color}`}>
                          {donation.status === 'confirmed' ? <Check size={10} strokeWidth={4} /> : <Clock size={10} />}
                          {st.label}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                        <span className="text-md font-black text-slate-900 tabular-nums">{donation.amount.toLocaleString()} ₪</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">הוספת תרומה ידנית</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם התורם</label>
                 <input required placeholder="הזן שם מלא..." value={newDonation.donorName} onChange={e => setNewDonation({...newDonation, donorName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">סכום (₪)</label>
                 <input required type="number" placeholder="0" value={newDonation.amount || ''} onChange={e => setNewDonation({...newDonation, amount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-2xl font-black text-blue-600 outline-none focus:bg-white tabular-nums" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שיוך לנציג</label>
                    <select required value={newDonation.representativeId} onChange={e => setNewDonation({...newDonation, representativeId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none cursor-pointer">
                      <option value="">בחר נציג...</option>
                      {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שיטת תשלום</label>
                    <select value={newDonation.method} onChange={e => setNewDonation({...newDonation, method: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none cursor-pointer">
                      <option value="cash">מזומן</option>
                      <option value="check">שיק</option>
                      <option value="transfer">העברה בנקאיות</option>
                      <option value="bit">ביט (ידני)</option>
                      <option value="online">אשראי (סליקה)</option>
                    </select>
                 </div>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-[25px] shadow-xl active:scale-95 transition-all mt-4 uppercase tracking-widest">שמור תרומה במערכת</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
