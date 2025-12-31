
import React, { useState, useMemo, useRef } from 'react';
import { RankDefinition, Gift, Lottery, EligibilityType, Representative, Donation } from '../types';
import { 
  Award, Gift as GiftIcon, Sparkles, Plus, Trash2, Edit2, X, Trophy, Gem, 
  Calendar, CheckCircle2, TrendingUp, Search, Clock, Image as ImageIcon,
  Target, Zap, Settings, ChevronLeft, PlayCircle, UserCheck, Upload
} from 'lucide-react';

interface RewardsManagerProps {
  lotteries: Lottery[];
  setLotteries: React.Dispatch<React.SetStateAction<Lottery[]>>;
  ranks: RankDefinition[];
  setRanks: React.Dispatch<React.SetStateAction<RankDefinition[]>>;
  gifts: Gift[];
  setGifts: React.Dispatch<React.SetStateAction<Gift[]>>;
  onTriggerDraw: (l: Lottery) => void;
  representatives: Representative[];
  donations: Donation[];
}

const RewardsManager: React.FC<RewardsManagerProps> = ({ 
  lotteries, setLotteries, ranks, setRanks, gifts, setGifts, onTriggerDraw, representatives, donations 
}) => {
  const [activeTab, setActiveTab] = useState<'ranks' | 'gifts' | 'lotteries'>('ranks');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    title: '', name: '', description: '', drawDate: new Date().toISOString().split('T')[0], drawTime: '22:00', 
    minThreshold: 0, milestoneAmount: 0, minAmount: 0, eligibilityCriteria: 'daily_amount', 
    eligibilityType: 'personal_goal', color: '#2563eb', autoActivate: true, dailyThreshold: 0, image: ''
  });

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        title: '', name: '', description: '', drawDate: new Date().toISOString().split('T')[0], drawTime: '22:00', 
        minThreshold: 0, milestoneAmount: 0, minAmount: 0, eligibilityCriteria: 'daily_amount', 
        eligibilityType: 'personal_goal', color: '#2563eb', autoActivate: true, dailyThreshold: 0, image: ''
      });
    }
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result as string }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDelete = (id: string, type: 'ranks' | 'gifts' | 'lotteries') => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return;
    if (type === 'ranks') setRanks(prev => prev.filter(r => r.id !== id));
    else if (type === 'gifts') setGifts(prev => prev.filter(g => g.id !== id));
    else if (type === 'lotteries') setLotteries(prev => prev.filter(l => l.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'ranks') {
      if (editingItem) setRanks(prev => prev.map(x => x.id === editingItem.id ? { ...x, ...formData } : x));
      else setRanks(prev => [...prev, { ...formData, id: Math.random().toString(36).substr(2, 9), icon: 'Award' }]);
    } else if (activeTab === 'gifts') {
      if (editingItem) setGifts(prev => prev.map(x => x.id === editingItem.id ? { ...x, ...formData } : x));
      else setGifts(prev => [...prev, { ...formData, id: Math.random().toString(36).substr(2, 9) }]);
    } else {
      if (editingItem) setLotteries(prev => prev.map(x => x.id === editingItem.id ? { ...x, ...formData } : x));
      else setLotteries(prev => [...prev, { ...formData, id: Math.random().toString(36).substr(2, 9), status: 'active' }]);
    }
    setShowModal(false);
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ניהול תגמולים <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 font-medium text-sm">הגדרת דרגות, מתנות ויעדי בונוס חכמים</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl active:scale-95">
          <Plus size={18} /> הוספת {activeTab === 'ranks' ? 'דרגה' : activeTab === 'gifts' ? 'מתנה' : 'הגרלה'}
        </button>
      </div>

      <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden mb-10">
        <div className="flex border-b border-slate-100 bg-slate-50/30">
          {[{ id: 'ranks', label: 'סולם דרגות' }, { id: 'gifts', label: 'מתנות ויעדים' }, { id: 'lotteries', label: 'הגרלות ובונוסים' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-5 text-xs font-black transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400'}`}>{tab.label}</button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'lotteries' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {lotteries.map(lottery => (
                  <div key={lottery.id} className="bg-slate-50/50 border border-slate-100 rounded-[35px] p-8 hover:bg-white hover:shadow-xl transition-all group flex flex-col">
                     <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${lottery.status === 'active' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>{lottery.status === 'active' ? '● פעיל' : 'הסתיים'}</span>
                        <div className="flex gap-2">
                           <button onClick={() => handleOpenModal(lottery)} className="p-2.5 bg-white text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Edit2 size={16} /></button>
                           <button onClick={() => handleDelete(lottery.id, 'lotteries')} className="p-2.5 bg-white text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                        </div>
                     </div>
                     <div className="flex gap-4 mb-4">
                       {lottery.image && <img src={lottery.image} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />}
                       <div>
                         <h3 className="text-2xl font-black text-slate-900 mb-1">{lottery.title}</h3>
                         <p className="text-xs font-bold text-slate-500 line-clamp-2">{lottery.description}</p>
                       </div>
                     </div>
                     {lottery.status === 'active' && <button onClick={() => onTriggerDraw(lottery)} className="w-full py-4 bg-slate-900 text-white rounded-[22px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"><PlayCircle size={20} className="text-blue-500" /> הפעל הגרלה כעת</button>}
                  </div>
                ))}
             </div>
          )}
          {activeTab === 'gifts' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gifts.map(gift => (
                  <div key={gift.id} className="bg-white border border-slate-100 rounded-[35px] p-8 flex gap-6 hover:shadow-xl transition-all group overflow-hidden relative">
                     <div className="w-24 h-24 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100 shadow-inner overflow-hidden">
                       {gift.image ? <img src={gift.image} className="w-full h-full object-cover" /> : <GiftIcon size={32} />}
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="text-lg font-black text-slate-900 truncate">{gift.name}</h4>
                           <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">{gift.milestoneAmount.toLocaleString()} ש"ח</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mb-4 line-clamp-2">{gift.description}</p>
                        <div className="flex gap-2">
                           <button onClick={() => handleOpenModal(gift)} className="flex-1 py-2.5 bg-slate-900 text-white font-black rounded-xl text-[10px] transition-all">ערוך</button>
                           <button onClick={() => handleDelete(gift.id, 'gifts')} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          )}
          {activeTab === 'ranks' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ranks.map(rank => (
                  <div key={rank.id} className="p-8 rounded-[35px] border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden" style={{ backgroundColor: rank.color }}>
                          {rank.image ? <img src={rank.image} className="w-full h-full object-cover" /> : <Trophy size={24} />}
                        </div>
                        <div className="flex gap-1">
                           <button onClick={() => handleOpenModal(rank)} className="p-2 text-slate-300 hover:text-blue-500 transition-all"><Edit2 size={14} /></button>
                           <button onClick={() => handleDelete(rank.id, 'ranks')} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                     </div>
                     <h3 className="text-xl font-black mb-1" style={{ color: rank.color }}>{rank.name}</h3>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">יעד פתיחה</p>
                     <div className="text-3xl font-black text-slate-900 tabular-nums">{rank.minAmount.toLocaleString()} ש"ח</div>
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl animate-fade-in border border-white/20 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingItem ? 'עריכה' : 'הוספת'} {activeTab === 'ranks' ? 'דרגה' : activeTab === 'gifts' ? 'מתנה' : 'הגרלה'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">תמונה מלווה</label>
                     <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group">
                        {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300 mb-2" size={32} />}
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">שם / כותרת</label><input required value={activeTab === 'lotteries' ? formData.title : formData.name} onChange={e => setFormData({ ...formData, [activeTab === 'lotteries' ? 'title' : 'name']: e.target.value })} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">סכום יעד (₪)</label><input type="number" value={activeTab === 'ranks' ? formData.minAmount : activeTab === 'gifts' ? formData.milestoneAmount : formData.minThreshold} onChange={e => setFormData({ ...formData, [activeTab === 'ranks' ? 'minAmount' : activeTab === 'gifts' ? 'milestoneAmount' : 'minThreshold']: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none" /></div>
                    {activeTab === 'ranks' && <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">צבע מזהה</label><input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl p-1 cursor-pointer" /></div>}
                    <div className="col-span-2 space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">תיאור</label><textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none resize-none text-xs" /></div>
                  </div>
               </div>
               <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-3xl shadow-xl active:scale-95 transition-all">שמור במערכת</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsManager;
