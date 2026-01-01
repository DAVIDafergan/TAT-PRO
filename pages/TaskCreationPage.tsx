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
  const [routeLegs, setRouteLegs] = useState<any[]>([]); // אחסון שלבי המסלול המפורטים

  // Google Maps Libraries
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const map = useMap();
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete לעיר - מופעל רק כשיש שדה (לא בשיחות)
  useEffect(() => {
    if (!placesLib || !cityInputRef.current || activeTab === 'calls') return;
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

  // חישוב מסלול מפורט עם שלבי הגעה (Step-by-Step)
  const calculateRoute = async (donorList: Donor[]) => {
    if (!routesLib || !map || donorList.length < 2) return;

    const directionsService = new routesLib.DirectionsService();
    const directionsRenderer = new routesLib.DirectionsRenderer({ 
        map, 
        suppressMarkers: false,
        polylineOptions: { strokeColor: '#2563eb', strokeWeight: 5, strokeOpacity: 0.8 }
    });

    const origin = `${donorList[0].street} ${donorList[0].building}, ${donorList[0].city}`;
    const destination = `${donorList[donorList.length - 1].street} ${donorList[donorList.length - 1].building}, ${donorList[donorList.length - 1].city}`;
    
    const waypoints = donorList.slice(1, -1).map(d => ({
      location: `${d.street} ${d.building}, ${d.city}`,
      stopover: true
    }));

    // קביעת מצב נסיעה (רכב, הליכה או אוטובוס)
    const travelModeMap = {
        'walking': google.maps.TravelMode.WALKING,
        'car': google.maps.TravelMode.DRIVING,
        'bus': google.maps.TravelMode.TRANSIT
    };

    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: travelModeMap[pathForm.transport] || google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        setRouteLegs(result.routes[0].legs); // שומר את כל שלבי הדרך המפורטים
      }
    });
  };

  const [pathForm, setPathForm] = useState({
    name: '', city: 'בני ברק', selectedRepIds: [] as string[],
    transport: 'walking' as 'walking' | 'car' | 'bus',
    startTime: '17:00', endTime: '22:00'
  });

  const [callForm, setCallForm] = useState({
    name: '', selectedRepIds: [] as string[], callCount: 20
  });

  const [patrolForm, setPatrolForm] = useState({
    selectedPatrolId: '', city: 'ירושלים', neighborhood: '',
    transport: 'car' as 'walking' | 'car' | 'bus',
    maxDistance: 500
  });

  const filteredReps = useMemo(() => (reps || []).filter(r => r.name?.toLowerCase().includes(repSearch.toLowerCase())), [reps, repSearch]);
  const filteredPatrols = useMemo(() => (patrols || []).filter(p => p.name?.toLowerCase().includes(patrolSearch.toLowerCase())), [patrols, patrolSearch]);
  
  const purimDonors = useMemo(() => {
    const currentCity = activeTab === 'calls' ? '' : (activeTab === 'patrols' ? patrolForm.city : pathForm.city).trim().toLowerCase();
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
    pdf.save(`Mission_Plan_${new Date().getTime()}.pdf`);
  };

  const finalizeTask = () => {
    const donorIds = selectedCustomDonors.length > 0 ? selectedCustomDonors : purimDonors.slice(0, 15).map(d => d.id);
    if (donorIds.length === 0) { alert("לא נבחרו תורמים"); return; }
    const selectedDonorsData = donors.filter(d => donorIds.includes(d.id));
    setActiveTaskDonors(selectedDonorsData);
    setDonors(prev => prev.map(d => donorIds.includes(d.id) ? { ...d, assignmentStatus: 'in_treatment' } : d));
    setShowPreview(true);
    if (activeTab !== 'calls') setTimeout(() => calculateRoute(selectedDonorsData), 500);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg"><Navigation size={18} className="text-white"/></div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight italic">TASK <span className="text-blue-600">PRO</span></h1>
          </div>
          <p className="text-slate-500 font-medium text-[9px] uppercase tracking-widest mr-10">ניווט אופטימלי & Google Transit Intelligence</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {['paths', 'patrols', 'calls'].map((tab: any) => (
            <button key={tab} onClick={() => {setActiveTab(tab); setShowPreview(false);}} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400'}`}>
              {tab === 'paths' ? <MapPinned size={14}/> : tab === 'patrols' ? <Bus size={14}/> : <PhoneCall size={14}/>}
              {tab === 'paths' ? 'מסלול' : tab === 'patrols' ? 'סיירת' : 'שיחות'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column - Forms */}
        <div className="w-[380px] flex flex-col gap-4 overflow-y-auto pr-1 scroll-hide shrink-0">
          <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
               <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Plus size={14} className="text-blue-600"/> הגדרות משימה</h2>
               <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black shadow-sm italic">
                  <Activity size={10}/> {purimDonors.length} זמינים
               </div>
            </div>
            
            <div className="space-y-4 animate-in fade-in duration-500">
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 mr-1 uppercase">שם המשימה</label><input value={activeTab === 'calls' ? callForm.name : (activeTab === 'patrols' ? 'סיירת' : pathForm.name)} onChange={e => activeTab === 'calls' ? setCallForm({...callForm, name: e.target.value}) : setPathForm({...pathForm, name: e.target.value})} placeholder="סבב פורים..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white transition-all" /></div>
               
               <div className="grid grid-cols-2 gap-3">
                  {/* שדה העיר מופיע רק אם זה לא טאב שיחות */}
                  {activeTab !== 'calls' && (
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 mr-1 uppercase">עיר (גוגל)</label><input ref={cityInputRef} value={activeTab === 'patrols' ? patrolForm.city : pathForm.city} onChange={e => activeTab === 'patrols' ? setPatrolForm({...patrolForm, city: e.target.value}) : setPathForm({...pathForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                  )}
                  {activeTab !== 'calls' && (
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 mr-1 uppercase">שיטת ניווט</label>
                      <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border">
                        {['walking', 'car', 'bus'].map(m => (
                          <button key={m} onClick={() => setPathForm({...pathForm, transport: m as any})} className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${pathForm.transport === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                            {m === 'walking' ? <Footprints size={14}/> : m === 'bus' ? <Bus size={14}/> : <Car size={14}/>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

               {activeTab === 'patrols' && (
                 <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in zoom-in-95">
                    <div className="flex justify-between items-center"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">מרחק מקסימלי (מטרים)</label><span className="text-[10px] font-black text-blue-600">{patrolForm.maxDistance} מ'</span></div>
                    <input type="range" min="100" max="2000" step="50" value={patrolForm.maxDistance} onChange={e => setPatrolForm({...patrolForm, maxDistance: Number(e.target.value)})} className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                 </div>
               )}

               <div className="pt-4 border-t space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1 block">בחירת נציגים (חיפוש)</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    <input type="text" placeholder="חפש נציג לפי שם..." value={repSearch} onChange={e => setRepSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 py-2.5 text-[10px] font-bold outline-none" />
                  </div>
                  <div className="max-h-36 overflow-y-auto mt-2 space-y-1 scroll-hide">
                    {filteredReps.map(rep => (
                      <button key={rep.id} onClick={() => toggleSelection(rep.id, activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds, (l) => activeTab === 'calls' ? setCallForm({...callForm, selectedRepIds: l}) : setPathForm({...pathForm, selectedRepIds: l}))} className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between text-[11px] font-bold ${ (activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds).includes(rep.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}>
                        {rep.name} {(activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds).includes(rep.id) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
               </div>

               <button type="button" onClick={() => setShowCustomDonors(true)} className="w-full py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"><ListChecks size={16}/> בחירת תורמים ידנית</button>
            </div>

            <button onClick={finalizeTask} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-black uppercase tracking-widest">
              <Plus size={18}/> צור משימה וחשב מסלול גוגל
            </button>
          </div>
        </div>

        {/* Right Column - Results Display */}
        <div id="preview-card" className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative flex flex-col transition-all">
          {!showPreview ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 p-10 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><Activity size={48} className="opacity-10" /></div>
              <p className="text-[12px] font-black italic uppercase tracking-[0.3em] text-slate-400">המערכת ממתינה ליצירת משימה חכמה</p>
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in slide-in-from-left duration-700">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">משימה פעילה - {activeTab}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-black uppercase shadow-sm animate-pulse border border-emerald-200 mt-1">
                        <Check size={10}/> סנכרון CRM פעיל
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportToPDF} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500 hover:text-red-600 transition-all"><Printer size={18}/></button>
                  <button onClick={() => alert('המשימה נשלחה לנציגים!')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">שלח לנציגים</button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {activeTab === 'calls' ? (
                  <div className="w-full overflow-y-auto p-10 bg-white space-y-4 scroll-hide animate-fade-in text-right">
                    <h3 className="text-sm font-black text-slate-900 border-b pb-4 flex items-center gap-2"><PhoneCall size={20} className="text-emerald-500" /> רשימת שיחות מרוכזת (בטיפול)</h3>
                    {activeTaskDonors.map((donor, idx) => (
                      <div key={donor.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-sm font-black text-slate-400 shadow-sm border border-slate-100">{idx + 1}</div>
                          <div><p className="text-base font-black text-slate-900">{donor.firstName} {donor.lastName}</p><p className="text-[11px] font-bold text-slate-400 uppercase italic">{donor.connectionType}</p></div>
                        </div>
                        <div className="flex items-center gap-6"><span className="text-base font-black text-slate-900 tabular-nums tracking-tighter">{donor.phone}</span><button className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200 hover:scale-110 active:scale-90 transition-all"><Phone size={18}/></button></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex-1 bg-slate-100 relative border-l overflow-hidden shadow-inner">
                      <Map defaultCenter={{ lat: 32.1848, lng: 34.8713 }} defaultZoom={13} gestureHandling={'greedy'} disableDefaultUI={true} />
                      <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-white text-[9px] font-black text-blue-600 uppercase flex items-center gap-2">
                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div> Google Live Routing Active
                      </div>
                    </div>
                    <div className="w-[360px] overflow-y-auto p-6 bg-white scroll-hide border-r shadow-2xl z-20 text-right">
                       <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b pb-4 mb-6 flex items-center gap-2"><Navigation size={14}/> הוראות הגעה (Step-by-Step)</h3>
                       <div className="space-y-6">
                         {activeTaskDonors.map((donor, idx) => (
                           <div key={donor.id} className="animate-fade-in">
                             <div className="flex gap-4 group">
                               <div className="flex flex-col items-center shrink-0">
                                 <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors">{idx + 1}</div>
                                 {idx < activeTaskDonors.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>}
                               </div>
                               <div className="pb-2 min-w-0 flex-1">
                                 <p className="text-[13px] font-black text-slate-900 truncate leading-tight">{donor.firstName} {donor.lastName}</p>
                                 <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{donor.street} {donor.building}, {donor.city}</p>
                                 
                                 {/* הוראות גוגל מפורטות בין הנקודות */}
                                 {routeLegs[idx] && (
                                   <div className="mt-4 space-y-3">
                                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black border border-blue-100">
                                         <Clock size={12}/> {routeLegs[idx].duration.text} ({routeLegs[idx].distance.text})
                                      </div>
                                      <div className="space-y-2 pr-2 border-r-2 border-slate-50">
                                         {routeLegs[idx].steps.map((step: any, sIdx: number) => (
                                           <div key={sIdx} className="text-[9px] text-slate-500 font-medium leading-relaxed bg-slate-50/50 p-2 rounded-lg" dangerouslySetInnerHTML={{ __html: step.instructions }} />
                                         ))}
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
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg"><ListChecks size={20}/></div>
                <h2 className="text-lg font-black text-slate-900 italic tracking-tight">בחירת תורמים פנימית</h2>
              </div>
              <button onClick={() => setShowCustomDonors(false)} className="p-2.5 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 rounded-full"><X size={24}/></button>
            </div>
            <div className="p-6 bg-slate-50 border-b">
               <div className="relative">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input type="text" placeholder="חפש תורם..." value={donorSearch} onChange={e => setDonorSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-4 text-sm font-bold outline-none shadow-sm focus:ring-4 ring-blue-50 transition-all" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-hide">
              {purimDonors.map(donor => (
                <button key={donor.id} onClick={() => toggleSelection(donor.id, selectedCustomDonors, setSelectedCustomDonors)} className={`p-5 rounded-[25px] border-2 transition-all text-right flex items-center justify-between group ${selectedCustomDonors.includes(donor.id) ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'}`}>
                   <div className="min-w-0">
                      <p className={`text-[13px] font-black truncate ${selectedCustomDonors.includes(donor.id) ? 'text-white' : 'text-slate-900'}`}>{donor.firstName} {donor.lastName}</p>
                      <p className={`text-[10px] font-bold opacity-60 truncate mt-0.5 ${selectedCustomDonors.includes(donor.id) ? 'text-blue-100' : 'text-slate-400'}`}>{donor.street} {donor.building}</p>
                   </div>
                   {selectedCustomDonors.includes(donor.id) ? <Check size={18} /> : <Plus size={14} className="opacity-30" />}
                </button>
              ))}
            </div>
            <div className="p-8 border-t bg-white flex items-center justify-between shadow-2xl">
              <span className="text-xl font-black text-slate-900 leading-none">{selectedCustomDonors.length} נבחרו</span>
              <button onClick={() => setShowCustomDonors(false)} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all hover:bg-blue-700">אשר בחירה וסנכרן</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCreationPage;