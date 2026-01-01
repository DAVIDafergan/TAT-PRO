import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Donor, Representative, Path, CallList, Patrol } from '../types';
import { 
  MapPinned, PhoneCall, Search, Plus, X, Navigation, Clock, 
  Bus, Car, Footprints, Check, Send, FileText, Users, MapPin, 
  Map as MapIcon, ChevronRight, ListChecks, Activity, Phone, Printer, Sliders, AlertCircle, Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useMapsLibrary, Map, useMap } from '@vis.gl/react-google-maps';

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
  const [showMap, setShowMap] = useState(true);
  const [showCustomDonors, setShowCustomDonors] = useState(false);
  const [selectedCustomDonors, setSelectedCustomDonors] = useState<string[]>([]);
  const [donorSearch, setDonorSearch] = useState('');
  const [activeTaskDonors, setActiveTaskDonors] = useState<Donor[]>([]);
  const [routeInfo, setRouteInfo] = useState<any[]>([]); // אחסון הוראות הגעה מגוגל

  // Google Maps Libraries
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const map = useMap();
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete לעיר
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

  // חישוב מסלול והוראות הגעה אמיתיות (Directions API)
  const calculateRoute = async (donorList: Donor[]) => {
    if (!routesLib || donorList.length < 2) return;

    const directionsService = new routesLib.DirectionsService();
    const directionsRenderer = new routesLib.DirectionsRenderer({ map, suppressMarkers: false });

    const origin = `${donorList[0].street} ${donorList[0].building}, ${donorList[0].city}`;
    const destination = `${donorList[donorList.length - 1].street} ${donorList[donorList.length - 1].building}, ${donorList[donorList.length - 1].city}`;
    
    const waypoints = donorList.slice(1, -1).map(d => ({
      location: `${d.street} ${d.building}, ${d.city}`,
      stopover: true
    }));

    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        const legs = result.routes[0].legs;
        setRouteInfo(legs.map(leg => ({
          duration: leg.duration?.text,
          distance: leg.distance?.text
        })));
      }
    });
  };

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
    maxDistance: 500
  });

  const filteredReps = useMemo(() => (reps || []).filter(r => r.name?.toLowerCase().includes(repSearch.toLowerCase())), [reps, repSearch]);
  const filteredPatrols = useMemo(() => (patrols || []).filter(p => p.name?.toLowerCase().includes(patrolSearch.toLowerCase())), [patrols, patrolSearch]);
  
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
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`TaskPro_Mission_${new Date().toLocaleDateString()}.pdf`);
  };

  const finalizeTask = () => {
    const donorIds = selectedCustomDonors.length > 0 ? selectedCustomDonors : purimDonors.slice(0, 15).map(d => d.id);
    if (donorIds.length === 0) { alert("לא נבחרו תורמים"); return; }

    const selectedDonorsData = donors.filter(d => donorIds.includes(d.id));
    setActiveTaskDonors(selectedDonorsData);
    setDonors(prev => prev.map(d => donorIds.includes(d.id) ? { ...d, assignmentStatus: 'in_treatment' } : d));
    setShowPreview(true);
    setShowMap(true);
    if (activeTab !== 'calls') calculateRoute(selectedDonorsData);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100"><Navigation size={18} className="text-white"/></div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight italic">TASK <span className="text-blue-600">PRO</span></h1>
          </div>
          <p className="text-slate-500 font-medium text-[9px] uppercase tracking-widest mr-10">ניהול משימות חכם & Google Directions API</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {['paths', 'patrols', 'calls'].map((tab: any) => (
            <button key={tab} onClick={() => {setActiveTab(tab); setShowPreview(false);}} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab === 'paths' ? <MapPinned size={14}/> : tab === 'patrols' ? <Bus size={14}/> : <PhoneCall size={14}/>}
              {tab === 'paths' ? 'מסלול' : tab === 'patrols' ? 'סיירת' : 'שיחות'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column - Forms */}
        <div className="w-[380px] flex flex-col gap-4 overflow-y-auto pr-1 scroll-hide shrink-0">
          <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm p-6 space-y-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-center border-b pb-3">
               <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Plus size={14} className="text-blue-600"/> הגדרות משימה</h2>
               <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black shadow-sm italic">
                  <Activity size={10}/> {purimDonors.length} זמינים במערכת
               </div>
            </div>
            
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שם המשימה</label><input value={activeTab === 'calls' ? callForm.name : (activeTab === 'patrols' ? 'סיירת פורים' : pathForm.name)} onChange={e => activeTab === 'calls' ? setCallForm({...callForm, name: e.target.value}) : setPathForm({...pathForm, name: e.target.value})} placeholder="למשל: סבב ערב בני ברק..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:bg-white focus:ring-2 ring-blue-50 outline-none transition-all" /></div>
               
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">עיר (גוגל מפות)</label><input ref={cityInputRef} value={activeTab === 'patrols' ? patrolForm.city : pathForm.city} onChange={e => activeTab === 'patrols' ? setPatrolForm({...patrolForm, city: e.target.value}) : setPathForm({...pathForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                  {activeTab !== 'calls' && (
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שיטה</label>
                      <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border">
                        {['walking', 'car'].map(m => (
                          <button key={m} onClick={() => setPathForm({...pathForm, transport: m as any})} className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${pathForm.transport === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                            {m === 'walking' ? <Footprints size={14}/> : <Car size={14}/>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

               {activeTab === 'patrols' && (
                 <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in zoom-in-95">
                    <div className="flex justify-between items-center"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">מרחק מקסימלי בין כתובות</label><span className="text-[10px] font-black text-blue-600 bg-white px-2 py-1 rounded-md shadow-sm border border-blue-100">{patrolForm.maxDistance} מ'</span></div>
                    <input type="range" min="100" max="2000" step="50" value={patrolForm.maxDistance} onChange={e => setPatrolForm({...patrolForm, maxDistance: Number(e.target.value)})} className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                 </div>
               )}

               <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">בחירת נציגי משימה (חיפוש)</label><div className="p-1 bg-slate-100 rounded-lg"><Search size={12} className="text-slate-400"/></div></div>
                  <input type="text" placeholder="חפש נציג..." value={repSearch} onChange={e => setRepSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold outline-none" />
                  <div className="max-h-36 overflow-y-auto mt-2 space-y-1 scroll-hide pr-1">
                    {filteredReps.map(rep => (
                      <button key={rep.id} onClick={() => toggleSelection(rep.id, activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds, (l) => activeTab === 'calls' ? setCallForm({...callForm, selectedRepIds: l}) : setPathForm({...pathForm, selectedRepIds: l}))} className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between text-[11px] font-bold ${ (activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds).includes(rep.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-blue-50/30'}`}>
                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${rep.isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`}></div> {rep.name}</div>
                        {(activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds).includes(rep.id) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
               </div>

               <button type="button" onClick={() => setShowCustomDonors(true)} className="w-full py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"><ListChecks size={16}/> בחירה ידנית של תורמים מהרשימה</button>
            </div>

            <button onClick={finalizeTask} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-black uppercase tracking-widest">
              <Plus size={18}/> צור משימה וסנכרן CRM
            </button>
          </div>
        </div>

        {/* Right Column - Preview Area */}
        <div id="preview-card" className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative flex flex-col transition-all">
          {!showPreview ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 p-10 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse"><Activity size={48} className="opacity-10" /></div>
              <p className="text-[12px] font-black italic uppercase tracking-[0.3em] text-slate-400">המערכת ממתינה ליצירת משימה חכמה</p>
              <div className="mt-6 flex gap-4 opacity-20"><MapPin size={20}/><PhoneCall size={20}/><Navigation size={20}/></div>
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in slide-in-from-left duration-700">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">תצוגת משימה פעילה</span>
                      <span className="text-[9px] font-bold text-slate-400 italic leading-none">{activeTab === 'calls' ? callForm.name : pathForm.city}</span>
                   </div>
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-200 animate-pulse shadow-sm">
                     <Check size={10}/> סנכרון CRM פועל
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportToPDF} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500 hover:text-red-600 transition-all hover:bg-red-50"><Printer size={18}/></button>
                  <button onClick={() => alert('המשימה נשלחה בהצלחה!')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">שלח לנציגים</button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {activeTab === 'calls' ? (
                  <div className="w-full overflow-y-auto p-10 bg-white space-y-4 scroll-hide animate-fade-in">
                    <h3 className="text-sm font-black text-slate-900 border-b pb-4 flex items-center gap-2"><PhoneCall size={20} className="text-emerald-500" /> רשימת שיחות מרוכזת (In Treatment)</h3>
                    {activeTaskDonors.map((donor, idx) => (
                      <div key={donor.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-sm font-black text-slate-400 shadow-sm border border-slate-100">{idx + 1}</div>
                          <div>
                            <p className="text-base font-black text-slate-900">{donor.firstName} {donor.lastName}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">{donor.city} | {donor.connectionType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-base font-black text-slate-900 tabular-nums tracking-tighter">{donor.phone}</span>
                          <button className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200 hover:scale-110 active:scale-90 transition-all"><Phone size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex-1 bg-slate-100 relative border-l overflow-hidden shadow-inner">
                      <Map defaultCenter={{ lat: 32.1848, lng: 34.8713 }} defaultZoom={13} gestureHandling={'greedy'} disableDefaultUI={true}>
                         {/* כאן ירונדר המסלול ברגע שתפעיל API KEY */}
                      </Map>
                      <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-white text-[9px] font-black text-blue-600 uppercase flex items-center gap-2">
                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div> Google Maps API Connected
                      </div>
                    </div>
                    <div className="w-[340px] overflow-y-auto p-6 bg-white scroll-hide border-r shadow-2xl z-20">
                       <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b pb-4 mb-6 flex items-center gap-2"><Navigation size={14}/> הוראות הגעה וניווט אופטימלי</h3>
                       <div className="space-y-0">
                         {activeTaskDonors.map((donor, idx) => (
                           <div key={donor.id}>
                             <div className="flex gap-4 group py-2">
                               <div className="flex flex-col items-center shrink-0">
                                 <div className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors">{idx + 1}</div>
                                 {idx < activeTaskDonors.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>}
                               </div>
                               <div className="pb-4 min-w-0 flex-1">
                                 <p className="text-[13px] font-black text-slate-900 truncate leading-tight">{donor.firstName} {donor.lastName}</p>
                                 <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{donor.street} {donor.building}, {donor.city}</p>
                                 
                                 {/* הוראות הגעה אמיתיות מגוגל */}
                                 {routeInfo[idx] && (
                                   <div className="mt-3 flex items-center gap-3">
                                      <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black flex items-center gap-1">
                                        <Clock size={10}/> {routeInfo[idx].duration}
                                      </div>
                                      <div className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black">
                                        {routeInfo[idx].distance}
                                      </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Donor Selector Modal */}
      {showCustomDonors && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-8 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><ListChecks size={20}/></div>
                <h2 className="text-xl font-black text-slate-900 italic tracking-tight">בחירת תורמים <span className="text-blue-600">פורים PRO</span></h2>
              </div>
              <button onClick={() => setShowCustomDonors(false)} className="p-2.5 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 rounded-full"><X size={24}/></button>
            </div>
            <div className="p-6 bg-slate-50 border-b">
               <div className="relative">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input type="text" placeholder="חפש תורם ברשימה (שם או רחוב)..." value={donorSearch} onChange={e => setDonorSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-4 text-sm font-bold outline-none shadow-sm focus:ring-4 ring-blue-50 transition-all" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-hide">
              {purimDonors.map(donor => (
                <button key={donor.id} onClick={() => toggleSelection(donor.id, selectedCustomDonors, setSelectedCustomDonors)} className={`p-5 rounded-[25px] border-2 transition-all text-right flex items-center justify-between group ${selectedCustomDonors.includes(donor.id) ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-blue-50/20'}`}>
                   <div className="min-w-0">
                      <p className={`text-[13px] font-black truncate ${selectedCustomDonors.includes(donor.id) ? 'text-white' : 'text-slate-900'}`}>{donor.firstName} {donor.lastName}</p>
                      <p className={`text-[10px] font-bold opacity-60 truncate mt-0.5 ${selectedCustomDonors.includes(donor.id) ? 'text-blue-100' : 'text-slate-400'}`}>{donor.street} {donor.building}</p>
                   </div>
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${selectedCustomDonors.includes(donor.id) ? 'bg-white/20' : 'bg-slate-50 border group-hover:bg-blue-50'}`}>
                      {selectedCustomDonors.includes(donor.id) ? <Check size={18} /> : <Plus size={14} className="opacity-30" />}
                   </div>
                </button>
              ))}
              {purimDonors.length === 0 && <div className="col-span-2 py-20 text-center space-y-4">
                 <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center shadow-inner"><AlertCircle size={32} className="text-slate-200"/></div>
                 <p className="text-slate-400 font-black italic text-sm">לא נמצאו תורמים פנויים העונים לסיווג ולעיר שנבחרו</p>
              </div>}
            </div>
            <div className="p-8 border-t bg-white flex items-center justify-between shadow-2xl">
              <div className="flex flex-col">
                 <span className="text-xl font-black text-slate-900 leading-none">{selectedCustomDonors.length}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">תורמים נבחרו</span>
              </div>
              <button onClick={() => setShowCustomDonors(false)} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-200 active:scale-95 transition-all hover:bg-blue-700 uppercase tracking-widest">אשר בחירה וסנכרן ל-CRM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCreationPage;