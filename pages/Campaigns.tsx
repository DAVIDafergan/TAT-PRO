import React, { useState, useRef } from 'react';
import { Campaign, DonationButton, Donor, Representative } from '../types';
import { 
  Target, Calendar, Edit2, Play, Pause, Trash2, Plus, LayoutGrid, List, X, 
  Banknote, Image, Video, Upload, Trash, MoveRight, Heart, Star, 
  Home, RefreshCw, ArrowLeftRight, Check, AlertCircle, Hash, Zap
} from 'lucide-react';

interface CampaignManagerProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  activeCampaignId: string;
  setActiveCampaignId: (id: string) => void;
  donors: Donor[];
  setDonors: React.Dispatch<React.SetStateAction<Donor[]>>;
  reps: Representative[];
  setReps: React.Dispatch<React.SetStateAction<Representative[]>>;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ campaigns, setCampaigns, activeCampaignId, setActiveCampaignId, donors, setDonors, reps, setReps }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  
  const fileLogoRef = useRef<HTMLInputElement>(null);
  const fileImagesRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '', goal: 0, startDate: new Date().toISOString().split('T')[0], endDate: '', 
    status: 'active', currency: 'ILS', color: '#2563eb', logo: '', images: [], videos: [], customButtons: []
  });

  const [tempButton, setTempButton] = useState<DonationButton>({ name: '', icon: 'Heart', amount: 0 });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'images') => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files) as any as File[];
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'logo') setFormData(prev => ({ ...prev, logo: base64 }));
        else if (type === 'images') setFormData(prev => ({ ...prev, images: [...(prev.images || []), base64] }));
      };
      reader.readAsDataURL(file as Blob);
    });
    e.target.value = '';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.goal) return;

    if (editingCampaignId) {
      setCampaigns(prev => prev.map(c => c.id === editingCampaignId ? { ...c, ...formData } as Campaign : c));
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      const campaign: Campaign = {
        id: newId,
        name: formData.name!,
        goal: Number(formData.goal),
        raised: 0,
        startDate: formData.startDate!,
        endDate: formData.endDate || '2025-12-31',
        status: 'active',
        currency: 'ILS',
        color: formData.color || '#2563eb',
        logo: formData.logo,
        images: formData.images,
        videos: formData.videos,
        customButtons: formData.customButtons
      };
      setCampaigns(prev => [campaign, ...prev]);
      setActiveCampaignId(newId);
    }
    setShowModal(false);
    setEditingCampaignId(null);
  };

  const handleSetCampaignActive = (id: string) => {
    setActiveCampaignId(id);
    alert("המערכת הותאמה לקמפיין הנבחר. כל הנתונים (נציגים, תורמים, תרומות) הוחלפו.");
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ניהול קמפיינים <span className="text-blue-600">HUB</span></h1>
          <p className="text-slate-500 font-medium text-sm">הקמה, מיתוג וסנכרון נכסי גיוס</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingCampaignId(null); setFormData({name:'', goal:0, startDate: new Date().toISOString().split('T')[0], endDate:'', color:'#2563eb', logo:'', images:[], videos:[], customButtons:[], currency:'ILS'}); setShowModal(true); }} className="flex items-center gap-3 px-7 py-3.5 bg-blue-600 text-white rounded-[20px] font-black text-xs hover:bg-blue-700 shadow-xl active:scale-95 transition-all"><Plus size={20} /> קמפיין חדש</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {campaigns.map(campaign => (
          <div key={campaign.id} className={`bg-white rounded-[40px] border-2 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group ${activeCampaignId === campaign.id ? 'border-blue-600' : 'border-slate-200'}`}>
            <div className="h-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${campaign.color}22 0%, ${campaign.color}05 100%)` }}>
               <div className="absolute top-5 right-5 flex gap-2">
                 {activeCampaignId === campaign.id && <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">פעיל כרגע</span>}
                 <span className="px-3 py-1 bg-white border border-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">{campaign.status === 'active' ? 'סטטוס: פתוח' : 'מושהה'}</span>
               </div>
               <div className="absolute -bottom-8 right-8 w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center p-2 z-10 border border-slate-50">
                  {campaign.logo ? <img src={campaign.logo} className="w-full h-full object-contain rounded-2xl" /> : <Target size={36} className="text-blue-600" />}
               </div>
            </div>
            <div className="p-8 pt-12">
               <h3 className="text-xl font-black text-slate-900 mb-6">{campaign.name}</h3>
               <div className="flex justify-between items-center mb-2"><span className="text-[9px] font-black text-slate-400 uppercase">גיוס</span><span className="text-lg font-black text-slate-900">{campaign.raised.toLocaleString()} ש"ח</span></div>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(campaign.raised/campaign.goal)*100}%` }}></div></div>
               <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleSetCampaignActive(campaign.id)}
                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${activeCampaignId === campaign.id ? 'bg-blue-50 text-blue-600 cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    {activeCampaignId === campaign.id ? <><Check size={14}/> הקמפיין הפעיל</> : <><Zap size={14}/> בחר כקמפיין פעיל</>}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCampaignId(campaign.id); setFormData(campaign); setShowModal(true); }} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase">ערוך הגדרות</button>
                    <button onClick={() => setCampaigns(prev => prev.filter(c => c.id !== campaign.id))} className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-[45px] w-full max-w-4xl max-h-[90vh] shadow-2xl animate-fade-in border border-white/20 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">{editingCampaignId ? 'עריכת קמפיין' : 'הגדרת קמפיין חדש'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-10 overflow-y-auto scroll-hide flex-1">
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2"><Hash size={16} className="text-blue-600"/><h3 className="text-xs font-black text-slate-900 uppercase">מידע בסיסי ויעדים</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input required placeholder="שם הקמפיין..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none" />
                  <div className="grid grid-cols-1 gap-4">
                     {/* Fixed potentially ambiguous placeholder and ensured clean syntax on line 173 */}
                     <input required placeholder="יעד גיוס" value={formData.goal || ''} onChange={e => setFormData({...formData, goal: Number(e.target.value)})} type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none" />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2"><Image size={16} className="text-blue-600"/><h3 className="text-xs font-black text-slate-900 uppercase">מיתוג ומדיה</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div onClick={() => fileLogoRef.current?.click()} className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden p-4 relative group">
                      {formData.logo ? <img src={formData.logo} className="w-full h-full object-contain" /> : <><Upload className="text-slate-300 mb-2" size={32}/><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">לוגו הקמפיין</p></>}
                   </div>
                   <div className="md:col-span-2 space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">גלריית תמונות</p>
                      <div className="grid grid-cols-3 gap-3">
                         {formData.images?.map((img, idx) => (<div key={idx} className="aspect-video bg-slate-100 rounded-2xl relative overflow-hidden group border border-slate-200"><img src={img} className="w-full h-full object-cover" /></div>))}
                         <div onClick={() => fileImagesRef.current?.click()} className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all"><Plus size={20}/><span className="text-[7px] font-black">הוסף</span></div>
                      </div>
                   </div>
                </div>
                <input type="file" ref={fileLogoRef} onChange={e => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
                <input type="file" ref={fileImagesRef} onChange={e => handleFileUpload(e, 'images')} multiple accept="image/*" className="hidden" />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2"><LayoutGrid size={16} className="text-blue-600"/><h3 className="text-xs font-black text-slate-900 uppercase">כפתורי תרומה מהירים</h3></div>
                <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <input placeholder="תיאור..." value={tempButton.name} onChange={e => setTempButton({...tempButton, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold" />
                      {/* Fixed malformed placeholder attribute with double quotes that caused property parsing errors */}
                      <input placeholder="ש&quot;ח" type="number" value={tempButton.amount || ''} onChange={e => setTempButton({...tempButton, amount: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black" />
                      <select value={tempButton.icon} onChange={e => setTempButton({...tempButton, icon: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"><option value="Heart">❤️ Heart</option><option value="Star">⭐ Star</option></select>
                      <button type="button" onClick={() => { if(!tempButton.name || !tempButton.amount) return; setFormData(p => ({...p, customButtons: [...(p.customButtons || []), {...tempButton}]})); setTempButton({name:'', icon:'Heart', amount:0}); }} className="py-3 bg-slate-900 text-white rounded-xl font-black text-xs">הוסף כפתור</button>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      {formData.customButtons?.map((btn, idx) => (
                        <div key={idx} className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 flex items-center gap-4 group shadow-sm"><div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs"><Heart size={14} /></div><div className="text-right"><p className="text-xs font-black">{btn.amount.toLocaleString()} ש"ח</p><p className="text-[8px] font-bold text-slate-400 uppercase">{btn.name}</p></div></div>
                      ))}
                   </div>
                </div>
              </section>
              <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black text-lg rounded-[30px] shadow-2xl active:scale-98 transition-all hover:bg-blue-700">שמור והקם קמפיין כעת</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;