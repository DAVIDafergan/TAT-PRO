import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Donor, Representative, Path, CallList, Patrol } from '../types';
import { 
  MapPinned, PhoneCall, Search, Plus, X, Navigation, Clock, 
  Bus, Car, Footprints, Check, Send, FileText, Users, MapPin, 
  Map as MapIcon, ChevronRight, ListChecks, Activity, Phone, Printer, Sliders, AlertCircle, Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface TaskCreationPageProps {
  donors: Donor[];
  setDonors: React.Dispatch<React.SetStateAction<Donor[]>>;
  reps: Representative[];
  patrols: Patrol[]; 
  setPaths: React.Dispatch<React.SetStateAction<Path[]>>;
  setCallLists: React.Dispatch<React.SetStateAction<CallList[]>>;
  activeCampaignId: string;
}

const TaskCreationPage: React.FC<TaskCreationPageProps> = ({ donors = [], setDonors, reps = [], patrols = [], setPaths, setCallLists, activeCampaignId }) => {
  const [activeTab, setActiveTab] = useState<'paths' | 'calls' | 'patrols'>('paths');
  const [repSearch, setRepSearch] = useState('');
  const [patrolSearch, setPatrolSearch] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCustomDonors, setShowCustomDonors] = useState(false);
  const [selectedCustomDonors, setSelectedCustomDonors] = useState<string[]>([]);
  const [donorSearch, setDonorSearch] = useState('');
  const [activeTaskDonors, setActiveTaskDonors] = useState<Donor[]>([]);

  // Google Maps Autocomplete Logic
  const placesLib = useMapsLibrary('places');
  const cityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLib || !cityInputRef.current) return;
    const autocomplete = new placesLib.Autocomplete(cityInputRef.current, {
      types: ['(cities)'],
      componentRestrictions: { country: 'il' }
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.name) {
        if (activeTab === 'patrols') setPatrolForm(prev => ({ ...prev, city: place.name! }));
        else setPathForm(prev => ({ ...prev, city: place.name! }));
      }
    });
  }, [placesLib, activeTab]);

  const [pathForm, setPathForm] = useState({
    name: '', city: 'בני ברק', selectedRepIds: [] as string[],
    transport: 'walking' as 'walking' | 'bus' | 'car',
    startTime: '17:00', endTime: '22:00'
  });

  const [callForm, setCallForm] = useState({
    name: '', selectedRepIds: [] as string[], callCount: 20
  });

  const [patrolForm, setPatrolForm] = useState({
    selectedPatrolId: '', city: 'ירושלים', neighborhood: '',
    transport: 'car' as 'walking' | 'bus' | 'car',
    startTime: '10:00', endTime: '18:00',
    maxDistance: 500
  });

  const filteredReps = useMemo(() => (reps || []).filter(r => r.name?.toLowerCase().includes(repSearch.toLowerCase())), [reps, repSearch]);
  const filteredPatrols = useMemo(() => (patrols || []).filter(p => p.name?.toLowerCase().includes(patrolSearch.toLowerCase())), [patrols, patrolSearch]);
  
  // לוגיקת סינון לפי סיווגים (בית/פורים/טלפוני/כללי)
  const purimDonors = useMemo(() => {
    const currentCity = (activeTab === 'patrols' ? patrolForm.city : pathForm.city).trim().toLowerCase();
    return (donors || []).filter(d => {
      const cityMatch = !currentCity || d.city?.trim().toLowerCase().includes(currentCity);
      const statusMatch = !d.assignmentStatus || d.assignmentStatus === 'available' || d.assignmentStatus === 'potential';
      
      const isGeneral = d.preferences?.includes('general');
      let prefMatch = false;
      if (activeTab === 'paths') prefMatch = d.preferences?.includes('general_visit') || isGeneral;
      if (activeTab === 'patrols') prefMatch = d.preferences?.includes('purim_day') || isGeneral;
      if (activeTab === 'calls') prefMatch = d.preferences?.includes('telephonic') || isGeneral;

      const searchMatch = `${d.firstName} ${d.lastName}`.toLowerCase().includes(donorSearch.toLowerCase());
      return cityMatch && statusMatch && prefMatch && searchMatch;
    });
  }, [donors, pathForm.city, patrolForm.city, activeTab, donorSearch]);

  const toggleSelection = (id: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const exportToPDF = async () => {
    const element = document.getElementById('preview-card');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`TaskPro_Export_${new Date().getTime()}.pdf`);
  };

  const finalizeTask = () => {
    const donorIds = selectedCustomDonors.length > 0 ? selectedCustomDonors : purimDonors.slice(0, 15).map(d => d.id);
    if (donorIds.length === 0) { alert("לא נבחרו תורמים"); return; }
    const selectedDonorsData = donors.filter(d => donorIds.includes(d.id));
    setActiveTaskDonors(selectedDonorsData);
    setDonors(prev => prev.map(d => donorIds.includes(d.id) ? { ...d, assignmentStatus: 'in_treatment' } : d));
    setShowPreview(true);
    setShowMap(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans text-right" dir="rtl">
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 italic">TASK <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 font-medium text-[9px] uppercase tracking-widest">מערכת תכנון משימות וסנכרון CRM</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button onClick={() => {setActiveTab('paths'); setShowPreview(false);}} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === 'paths' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><MapPinned size={14}/> מסלול</button>
          <button onClick={() => {setActiveTab('patrols'); setShowPreview(false);}} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === 'patrols' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Bus size={14}/> סיירת</button>
          <button onClick={() => {setActiveTab('calls'); setShowPreview(false);}} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === 'calls' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}><PhoneCall size={14}/> שיחות</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <div className="w-[380px] flex flex-col gap-4 overflow-y-auto pr-1 scroll-hide shrink-0">
          <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
               <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> הגדרות משימה</h2>
               <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black italic shadow-sm">
                  <Activity size={10}/> {purimDonors.length} זמינים לסיווג זה
               </div>
            </div>
            
            {activeTab === 'paths' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שם המסלול</label><input value={pathForm.name} onChange={e => setPathForm({...pathForm, name: e.target.value})} placeholder="סבב ערב..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:bg-white outline-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">עיר (גוגל מפות)</label><input ref={cityInputRef} value={pathForm.city} onChange={e => setPathForm({...pathForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שיטה</label>
                    <div className="flex gap-1">
                      {['walking', 'bus', 'car'].map(m => (
                        <button key={m} onClick={() => setPathForm({...pathForm, transport: m as any})} className={`flex-1 p-2 rounded-lg border flex justify-center transition-all ${pathForm.transport === m ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                          {m === 'walking' ? <Footprints size={14}/> : m === 'bus' ? <Bus size={14}/> : <Car size={14}/>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'patrols' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase mr-1">בחירת סיירת</label>
                  <select value={patrolForm.selectedPatrolId} onChange={e => setPatrolForm({...patrolForm, selectedPatrolId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none">
                    <option value="">בחר סיירת מהרשימה...</option>
                    {filteredPatrols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">מרחק מקסימלי בין כתובות</label><span className="text-[10px] font-black text-blue-600 bg-white px-2 py-1 rounded-md shadow-sm border border-blue-100">{patrolForm.maxDistance} מ'</span></div>
                  <input type="range" min="100" max="2000" step="50" value={patrolForm.maxDistance} onChange={e => setPatrolForm({...patrolForm, maxDistance: Number(e.target.value)})} className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">עיר</label><input ref={cityInputRef} value={patrolForm.city} onChange={e => setPatrolForm({...patrolForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שכונה</label><input value={patrolForm.neighborhood} onChange={e => setPatrolForm({...patrolForm, neighborhood: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" /></div>
                </div>
                <button type="button" onClick={() => setShowCustomDonors(true)} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all"><ListChecks size={14}/> בחירת כתובות אישית</button>
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שם רשימת השיחות</label><input value={callForm.name} onChange={e => setCallForm({...callForm, name: e.target.value})} placeholder="שיחות זהב פורים..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:bg-white outline-none" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">כמות שיחות נדרשת</label><input type="number" value={callForm.callCount} onChange={e => setCallForm({...callForm, callCount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" /></div>
              </div>
            )}

            {activeTab !== 'patrols' && (
              <div className="pt-4 border-t">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">בחירת נציגי משימה</label>
                <div className="max-h-32 overflow-y-auto mt-2 space-y-1 scroll-hide">
                  {filteredReps.map(rep => (
                    <button key={rep.id} onClick={() => toggleSelection(rep.id, activeTab === 'paths' ? pathForm.selectedRepIds : callForm.selectedRepIds, (l) => activeTab === 'paths' ? setPathForm({...pathForm, selectedRepIds: l}) : setCallForm({...callForm, selectedRepIds: l}))} className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-[10px] font-bold transition-all ${(activeTab === 'paths' ? pathForm.selectedRepIds : callForm.selectedRepIds).includes(rep.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}>
                      {rep.name} {(activeTab === 'paths' ? pathForm.selectedRepIds : callForm.selectedRepIds).includes(rep.id) && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={finalizeTask} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              <Plus size={16}/> צור והצג משימה סנכרון חי
            </button>
          </div>
        </div>

        <div id="preview-card" className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative flex flex-col">
          {!showPreview ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 p-10 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner"><Activity size={40} className="opacity-10" /></div>
              <p className="text-[11px] font-black italic uppercase tracking-[0.2em] text-slate-400">המערכת ממתינה ליצירת משימה סנכרון חי...</p>
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in slide-in-from-left duration-700">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">תצוגת {activeTab === 'calls' ? 'שיחות' : 'מסלול'} - {activeTab === 'calls' ? callForm.name : pathForm.city}</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase shadow-sm border border-emerald-200 animate-pulse">
                    <Check size={8}/> סנכרון CRM פעיל
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeTab !== 'calls' && (
                    <button onClick={() => setShowMap(!showMap)} className={`px-3 py-1.5 rounded-lg border text-[9px] font-black flex items-center gap-2 transition-all ${showMap ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                       <MapIcon size={14}/> {showMap ? 'הסתר מפה' : 'הצג מסלול על מפה'}
                    </button>
                  )}
                  <button onClick={exportToPDF} className="p-2 bg-white rounded-lg border shadow-sm text-slate-400 hover:text-red-600 transition-all hover:border-red-100"><Printer size={16}/></button>
                  <button onClick={() => alert('המשימה נשלחה לנציגים!')} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95">שלח לנציגים</button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {activeTab === 'calls' ? (
                  <div className="w-full overflow-y-auto p-8 bg-white space-y-3 scroll-hide animate-fade-in">
                    <h3 className="text-sm font-black text-slate-900 border-b pb-4 mb-4 flex items-center gap-2"><PhoneCall size={18} className="text-emerald-500" /> רשימת שיחות מרוכזת (בטיפול)</h3>
                    {activeTaskDonors.map((donor, idx) => (
                      <div key={donor.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-400 shadow-sm border border-slate-100">{idx + 1}</div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{donor.firstName} {donor.lastName}</p>
                            <p className="text-[10px] font-bold text-slate-400 italic">עיר: {donor.city} | קשר: {donor.connectionType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-slate-900 tabular-nums tracking-tighter">{donor.phone}</span>
                          <button className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100 hover:scale-110 active:scale-90 transition-all"><Phone size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className={`transition-all duration-700 bg-slate-100 relative border-l ${showMap ? 'flex-[1.5]' : 'w-0 opacity-0 pointer-events-none'}`}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-2 text-center p-10">
                        <MapIcon size={32} className="opacity-10"/> Google Maps Live Navigation Active
                        <div className="mt-2 px-3 py-1 bg-white rounded-full text-[8px] border shadow-sm">API Connected</div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white scroll-hide border-r">
                       <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b pb-2">הוראות הגעה (In Treatment)</h3>
                       {activeTaskDonors.map((donor, idx) => (
                         <div key={donor.id} className="flex gap-4 group animate-fade-in">
                           <div className="flex flex-col items-center">
                             <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shadow-md shrink-0">{idx + 1}</div>
                             {idx < activeTaskDonors.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>}
                           </div>
                           <div className="pb-4 min-w-0">
                             <p className="text-xs font-black text-slate-900 truncate">{donor.firstName} {donor.lastName}</p>
                             <p className="text-[10px] font-bold text-slate-400 truncate">{donor.street} {donor.building}, {donor.city}</p>
                             <div className="mt-1 flex items-center gap-1 text-[8px] font-bold text-blue-400 italic opacity-0 group-hover:opacity-100 transition-all"><Navigation size={8}/> המשך ליעד הבא</div>
                           </div>
                         </div>
                       ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCustomDonors && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-8 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white/20">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm"><ListChecks size={18}/></div>
                <h2 className="text-lg font-black text-slate-900 italic tracking-tight">בחירת כתובות - <span className="text-blue-600">פורים PRO</span></h2>
              </div>
              <button onClick={() => setShowCustomDonors(false)} className="p-2 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-6 bg-slate-50 border-b">
               <div className="relative">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input type="text" placeholder="חפש תורם ברשימת הפורים..." value={donorSearch} onChange={e => setDonorSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pr-10 py-3 text-xs font-bold outline-none shadow-sm focus:ring-2 ring-indigo-100 transition-all" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-3 scroll-hide">
              {purimDonors.map(donor => (
                <button key={donor.id} onClick={() => toggleSelection(donor.id, selectedCustomDonors, setSelectedCustomDonors)} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedCustomDonors.includes(donor.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                   <div className="text-right min-w-0">
                      <p className="text-xs font-black truncate">{donor.firstName} {donor.lastName}</p>
                      <p className="text-[10px] font-bold opacity-60 truncate">{donor.street} {donor.building}</p>
                   </div>
                   {selectedCustomDonors.includes(donor.id) ? <Check size={18} /> : <Plus size={14} className="opacity-30" />}
                </button>
              ))}
              {purimDonors.length === 0 && <div className="col-span-2 py-20 text-center space-y-3">
                 <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center"><AlertCircle size={24} className="text-slate-200"/></div>
                 <p className="text-slate-300 font-black italic text-sm">לא נמצאו תורמים פנויים בעיר זו בסיווג המבוקש</p>
              </div>}
            </div>
            <div className="p-6 border-t bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400">{selectedCustomDonors.length} תורמים נבחרו</span>
              <button onClick={() => setShowCustomDonors(false)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all hover:bg-indigo-700">אשר בחירה וסנכרן ל-CRM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCreationPage;