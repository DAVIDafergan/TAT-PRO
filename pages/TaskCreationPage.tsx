import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Donor, Representative, Path, CallList, Patrol, Donation } from '../types';
import { 
  MapPinned, PhoneCall, Search, Plus, X, Navigation, Clock, 
  Bus, Car, Footprints, Check, Send, FileText, Users, MapPin, 
  Map as MapIcon, ChevronRight, ListChecks, Activity, Phone, Printer, Sliders, AlertCircle, Eye, ArrowRight, Filter, Layers, Zap, Star
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useMapsLibrary, Map, useMap } from '@vis.gl/react-google-maps';
import { db } from '../services/db'; // חיבור למסד הנתונים

interface TaskCreationPageProps {
  donors: Donor[];
  setDonors: React.Dispatch<React.SetStateAction<Donor[]>>;
  donations: Donation[]; // הוספת הפרופס של התרומות לסינכרון
  reps: Representative[];
  patrols: Patrol[]; 
  setPaths: React.Dispatch<React.SetStateAction<Path[]>>;
  setCallLists: React.Dispatch<React.SetStateAction<CallList[]>>;
  activeCampaignId: string;
}

const TaskCreationPage: React.FC<TaskCreationPageProps> = ({ donors = [], setDonors, donations = [], reps = [], patrols = [], setPaths, setCallLists, activeCampaignId }) => {
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

  // --- מצבים חדשים לסינון וניהול רשימות שיחות ---
  const [pendingCallLists, setPendingCallLists] = useState<CallList[]>([]);
  const [selectedListIndex, setSelectedListIndex] = useState<number | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false); // מצב ליצירת רשימות מרובות
  
  const [callFilters, setCallFilters] = useState({
    minDonation: '',
    maxDonation: '',
    potential: 'all', // יכיל דירוג כוכבים 1-5
    connectionType: 'all', 
    callsPerList: 20,
    repsPerList: 1
  });

  // Google Maps Libraries
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const map = useMap();
  const cityInputRef = useRef<HTMLInputElement>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // פונקציה לחישוב סך תרומות לתורם (תואם CRM)
  const getDonorTotalConfirmed = (phone: string) => {
    return donations
      .filter(d => d.donorPhone === phone && d.status === 'confirmed')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  };

  // Autocomplete לעיר
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

  const calculateRoute = async (donorList: Donor[]) => {
    if (!routesLib || !map || donorList.length < 2) return;
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
    const directionsService = new routesLib.DirectionsService();
    const directionsRenderer = new routesLib.DirectionsRenderer({ 
        map, 
        suppressMarkers: false,
        polylineOptions: { strokeColor: '#2563eb', strokeWeight: 5, strokeOpacity: 0.8 }
    });
    directionsRendererRef.current = directionsRenderer;
    const origin = `${donorList[0].street} ${donorList[0].building}, ${donorList[0].city}`;
    const destination = `${donorList[donorList.length - 1].street} ${donorList[donorList.length - 1].building}, ${donorList[donorList.length - 1].city}`;
    const waypoints = donorList.slice(1, -1).map(d => ({
      location: `${d.street} ${d.building}, ${d.city}`,
      stopover: true
    }));
    const travelModeMap: Record<string, google.maps.TravelMode> = {
        'walking': google.maps.TravelMode.WALKING,
        'car': google.maps.TravelMode.DRIVING,
        'bus': google.maps.TravelMode.TRANSIT
    };
    const currentTransport = activeTab === 'patrols' ? patrolForm.transport : pathForm.transport;
    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: travelModeMap[currentTransport],
      optimizeWaypoints: currentTransport !== 'bus',
      transitOptions: currentTransport === 'bus' ? { 
        modes: [google.maps.TransitMode.BUS],
        routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS 
      } : undefined
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        setRouteLegs(result.routes[0].legs); 
      } else {
        console.error('Directions request failed due to ' + status);
        setRouteLegs([]);
      }
    });
  };

  const [pathForm, setPathForm] = useState({
    name: '', city: 'בני ברק', selectedRepIds: [] as string[],
    transport: 'walking' as 'walking' | 'car' | 'bus',
    startTime: '17:00', endTime: '22:00'
  });

  const [callForm, setCallForm] = useState({
    name: '', selectedRepIds: [] as string[]
  });

  const [patrolForm, setPatrolForm] = useState({
    selectedPatrolId: '', city: 'ירושלים', neighborhood: '',
    transport: 'car' as 'walking' | 'car' | 'bus',
    maxDistance: 500
  });

  const filteredReps = useMemo(() => (reps || []).filter(r => r.name?.toLowerCase().includes(repSearch.toLowerCase())), [reps, repSearch]);
  
  // --- לוגיקת סינון תורמים משופרת מותאמת ל-CRM של הישיבה - שמות שדות מתוקנים ---
  const purimDonors = useMemo(() => {
    const currentCity = activeTab === 'calls' ? '' : (activeTab === 'patrols' ? patrolForm.city : pathForm.city).trim().toLowerCase();
    
    return (donors || []).filter(d => {
      const cityMatch = !currentCity || d.city?.trim().toLowerCase().includes(currentCity);
      const statusMatch = !d.assignmentStatus || d.assignmentStatus === 'available' || d.assignmentStatus === 'potential';
      const searchMatch = `${d.firstName || ''} ${d.lastName || ''}`.toLowerCase().includes(donorSearch.toLowerCase());
      
      const isGeneral = d.preferences?.includes('general');
      let prefMatch = false;
      if (activeTab === 'paths') prefMatch = d.preferences?.includes('general_visit') || isGeneral;
      if (activeTab === 'patrols') prefMatch = d.preferences?.includes('purim_day') || isGeneral;
      if (activeTab === 'calls') prefMatch = d.preferences?.includes('telephonic') || isGeneral;

      if (activeTab === 'calls') {
        // חישוב תרומות לפי נתוני ה-CRM החיים
        const totalDonated = getDonorTotalConfirmed(d.phone);

        const minMatch = !callFilters.minDonation || totalDonated >= Number(callFilters.minDonation);
        const maxMatch = !callFilters.maxDonation || totalDonated <= Number(callFilters.maxDonation);
        
        // פוטנציאל לפי שדה potentialRank מה-CRM (מתואם לכוכבים)
        const potMatch = callFilters.potential === 'all' || Number(d.potentialRank || 0) >= Number(callFilters.potential);
        
        // סינון לפי קטגוריות CRM מדויקות (המפתחות באנגלית כפי שמופיעים ב-CRM)
        const connMatch = callFilters.connectionType === 'all' || d.connectionType === callFilters.connectionType;

        return statusMatch && prefMatch && searchMatch && minMatch && maxMatch && potMatch && connMatch;
      }

      return cityMatch && statusMatch && prefMatch && searchMatch;
    });
  }, [donors, pathForm.city, patrolForm.city, activeTab, donorSearch, callFilters, donations]);

  const toggleSelection = (id: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const generateMultipleLists = () => {
    const selectedReps = callForm.selectedRepIds;
    if (selectedReps.length === 0) { alert("בחר לפחות נציג אחד"); return; }
    
    let donorPool = [...purimDonors];
    if (selectedCustomDonors.length > 0) {
      donorPool = donors.filter(d => selectedCustomDonors.includes(d.id));
    }

    const newLists: CallList[] = [];

    if (isBulkMode) {
      // יצירת רשימות מרובות
      const repsPerList = callFilters.repsPerList;
      const callsPerList = callFilters.callsPerList;

      for (let i = 0; i < selectedReps.length; i += repsPerList) {
        const groupReps = selectedReps.slice(i, i + repsPerList);
        const groupDonors = donorPool.splice(0, callsPerList);
        if (groupDonors.length === 0) break;

        newLists.push({
          id: Math.random().toString(36).substr(2, 9),
          name: `${callForm.name || 'רשימת שיחות'} - קבוצה ${newLists.length + 1}`,
          assignedRepIds: groupReps,
          donors: groupDonors,
          campaignId: activeCampaignId
        });
      }
    } else {
      // יצירת רשימה אחת בודדת
      newLists.push({
        id: Math.random().toString(36).substr(2, 9),
        name: callForm.name || 'רשימת שיחות בודדת',
        assignedRepIds: selectedReps,
        donors: donorPool.slice(0, callFilters.callsPerList),
        campaignId: activeCampaignId
      });
    }

    setPendingCallLists(newLists);
    setSelectedListIndex(0);
    setShowPreview(true);
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
    pdf.save(`Mission_Plan_${activeTab}_${new Date().getTime()}.pdf`);
  };

  const handleSendToReps = async () => {
    const listsToSend = pendingCallLists.length > 0 ? pendingCallLists : (activeTab === 'calls' ? [{
        id: Math.random().toString(36).substr(2, 9),
        name: callForm.name || 'רשימת שיחות',
        assignedRepIds: callForm.selectedRepIds,
        donors: activeTaskDonors,
        campaignId: activeCampaignId
    } as CallList] : []);

    if (activeTab === 'paths' || activeTab === 'patrols') {
      const newPath: Path = {
        id: Math.random().toString(36).substr(2, 9),
        name: activeTab === 'patrols' ? (patrolForm.neighborhood || 'סיירת שטח') : pathForm.name,
        city: activeTab === 'patrols' ? patrolForm.city : pathForm.city,
        transport: activeTab === 'patrols' ? patrolForm.transport : pathForm.transport,
        assignedRepIds: activeTab === 'patrols' ? (patrols.find(p => p.id === patrolForm.selectedPatrolId)?.repIds || []) : pathForm.selectedRepIds,
        addresses: activeTaskDonors,
        campaignId: activeCampaignId
      };
      await (db as any).savePath?.(newPath) || await db.saveAll?.({ ...await db.loadAll(), paths: [...(await db.loadAll()).paths, newPath] } as any);
      setPaths(prev => [...prev, newPath]);
    } else {
      for (const list of listsToSend) {
        setCallLists(prev => [...prev, list]);
        for (const donor of list.donors) {
          await db.saveDonor({ ...donor, assignmentStatus: 'in_treatment' });
        }
      }
    }

    alert('המשימה/ות נשלחו בהצלחה לנציגים!');
    setShowPreview(false);
    setPendingCallLists([]);
  };

  const finalizeTask = () => {
    if (activeTab === 'calls') {
      generateMultipleLists();
      return;
    }
    const donorIds = selectedCustomDonors.length > 0 ? selectedCustomDonors : purimDonors.slice(0, 15).map(d => d.id);
    if (donorIds.length === 0) { alert("לא נבחרו תורמים"); return; }
    const selectedDonorsData = donors.filter(d => donorIds.includes(d.id));
    setActiveTaskDonors(selectedDonorsData);
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
          <p className="text-slate-500 font-medium text-[9px] uppercase tracking-widest mr-10">ניהול קמפיין & CRM Intelligence</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {['paths', 'patrols', 'calls'].map((tab: any) => (
            <button key={tab} onClick={() => {setActiveTab(tab); setShowPreview(false); setPendingCallLists([]);}} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400'}`}>
              {tab === 'paths' ? <MapPinned size={14}/> : tab === 'patrols' ? <Bus size={14}/> : <PhoneCall size={14}/>}
              {tab === 'paths' ? 'מסלול' : tab === 'patrols' ? 'סיירת' : 'שיחות'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <div className="w-[380px] flex flex-col gap-4 overflow-y-auto pr-1 scroll-hide shrink-0">
          <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Plus size={14} className="text-blue-600"/> הגדרות משימה</h2>
                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black shadow-sm italic">
                   <Activity size={10}/> {purimDonors.length} פוטנציאליים
                </div>
            </div>
            
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 mr-1 uppercase">שם המשימה / רשימה</label>
                  <input value={activeTab === 'calls' ? callForm.name : (activeTab === 'patrols' ? 'סיירת' : pathForm.name)} onChange={e => activeTab === 'calls' ? setCallForm({...callForm, name: e.target.value}) : setPathForm({...pathForm, name: e.target.value})} placeholder="לדוגמה: תורמי כבוד..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white transition-all" />
                </div>
                
                {/* סינונים מתקדמים לשיחות בלבד - שמות מזהים מתואמים ל-CRM */}
                {activeTab === 'calls' && (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600"><Filter size={12}/> פילטרים מה-CRM</div>
                       <div className="flex gap-1 bg-slate-200/50 p-1 rounded-full">
                         <button onClick={() => setIsBulkMode(false)} className={`px-3 py-1 rounded-full text-[8px] font-black transition-all ${!isBulkMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>בודדת</button>
                         <button onClick={() => setIsBulkMode(true)} className={`px-3 py-1 rounded-full text-[8px] font-black transition-all ${isBulkMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>מרובות</button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-500">מינימום תרומה (חי)</label>
                        <input type="number" value={callFilters.minDonation} onChange={e => setCallFilters({...callFilters, minDonation: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-500">מקסימום תרומה</label>
                        <input type="number" value={callFilters.maxDonation} onChange={e => setCallFilters({...callFilters, maxDonation: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="ללא" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-500">קשר לישיבה (CRM)</label>
                        <select value={callFilters.connectionType} onChange={e => setCallFilters({...callFilters, connectionType: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]">
                          <option value="all">הכל</option>
                          <option value="general">תורם כללי \ ידיד</option>
                          <option value="alumnus">בוגר הישיבה</option>
                          <option value="parent">הורה תלמיד \ בוגר</option>
                          <option value="staff_family">משפחת צוות</option>
                          <option value="student_family">משפחת תלמיד</option>
                          <option value="other">שיוך אחר</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-500">פוטנציאל (כוכבים)</label>
                        <select value={callFilters.potential} onChange={e => setCallFilters({...callFilters, potential: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]">
                          <option value="all">הכל</option>
                          <option value="5">5 כוכבים ⭐</option>
                          <option value="4">4 ומעלה</option>
                          <option value="3">3 ומעלה</option>
                          <option value="2">2 ומעלה</option>
                          <option value="1">1 ומעלה</option>
                        </select>
                      </div>
                    </div>

                    {!isBulkMode ? (
                      <div className="pt-2 border-t border-indigo-100">
                         <div className="space-y-1">
                             <label className="text-[8px] font-bold text-slate-500">כמות שיחות להקצאה</label>
                             <input type="number" value={callFilters.callsPerList} onChange={e => setCallFilters({...callFilters, callsPerList: Number(e.target.value)})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" />
                         </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-indigo-100">
                        <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-1">
                             <label className="text-[8px] font-bold text-slate-500">שיחות לרשימה</label>
                             <input type="number" value={callFilters.callsPerList} onChange={e => setCallFilters({...callFilters, callsPerList: Number(e.target.value)})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" />
                           </div>
                           <div className="space-y-1 animate-in zoom-in-95">
                               <label className="text-[8px] font-bold text-slate-500">נציגים לרשימה</label>
                               <input type="number" value={callFilters.repsPerList} onChange={e => setCallFilters({...callFilters, repsPerList: Number(e.target.value)})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" />
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {activeTab !== 'calls' && (
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 mr-1 uppercase">עיר (גוגל)</label><input ref={cityInputRef} value={activeTab === 'patrols' ? patrolForm.city : pathForm.city} onChange={e => activeTab === 'patrols' ? setPatrolForm({...patrolForm, city: e.target.value}) : setPathForm({...pathForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                  )}
                  {activeTab !== 'calls' && (
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 mr-1 uppercase">שיטת ניווט</label>
                      <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border">
                        {['walking', 'car', 'bus'].map(m => (
                          <button key={m} onClick={() => activeTab === 'patrols' ? setPatrolForm({...patrolForm, transport: m as any}) : setPathForm({...pathForm, transport: m as any})} className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${(activeTab === 'patrols' ? patrolForm.transport : pathForm.transport) === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                            {m === 'walking' ? <Footprints size={14}/> : m === 'bus' ? <Bus size={14}/> : <Car size={14}/>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1 block">בחירת נציגים לשיבוץ</label>
                  <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/><input type="text" placeholder="חפש נציג..." value={repSearch} onChange={e => setRepSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 py-2.5 text-[10px] font-bold outline-none" /></div>
                  <div className="max-h-36 overflow-y-auto mt-2 space-y-1 scroll-hide pr-1">
                    {filteredReps.map(rep => (
                      <button key={rep.id} onClick={() => toggleSelection(rep.id, activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds, (l) => activeTab === 'calls' ? setCallForm({...callForm, selectedRepIds: l}) : setPathForm({...pathForm, selectedRepIds: l}))} className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between text-[11px] font-bold ${ (activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds).includes(rep.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:bg-blue-50/30'}`}>
                        <div className="flex items-center gap-2">{rep.name}</div>
                        {(activeTab === 'calls' ? callForm.selectedRepIds : pathForm.selectedRepIds).includes(rep.id) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={() => setShowCustomDonors(true)} className="w-full py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"><ListChecks size={16}/> בחירת תורמים ידנית</button>
            </div>

            <button onClick={finalizeTask} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-black uppercase tracking-widest">
              {activeTab === 'calls' ? <Zap size={18} className="text-yellow-400"/> : <Plus size={18}/>} 
              {activeTab === 'calls' ? (isBulkMode ? 'חולל רשימות מרובות' : 'צור רשימה בודדת') : 'חשב מסלול גוגל'}
            </button>
          </div>
        </div>

        <div id="preview-card" className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative flex flex-col transition-all">
          {!showPreview ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 p-10 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><Activity size={48} className="opacity-10" /></div>
              <p className="text-[12px] font-black italic uppercase tracking-[0.3em] text-slate-400">המערכת ממתינה לפקודת יצירה</p>
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in slide-in-from-left duration-700">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">תצוגה מקדימה - {pendingCallLists.length > 0 ? `${pendingCallLists.length} רשימות` : activeTab}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-black uppercase shadow-sm border border-emerald-200 mt-1"><Check size={10}/> מחובר ל-CRM חי</div>
                    </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportToPDF} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500 hover:text-red-600 transition-all"><Printer size={18}/></button>
                  <button onClick={handleSendToReps} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                    {pendingCallLists.length > 1 ? `שלח את כל ${pendingCallLists.length} הרשימות` : 'אשר ושלח לנציגים'}
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {activeTab === 'calls' ? (
                  <div className="w-full flex">
                    {pendingCallLists.length > 0 && (
                      <div className="w-64 bg-slate-50 border-l overflow-y-auto p-4 space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-3">רשימות שנוצרו</p>
                        {pendingCallLists.map((list, idx) => (
                          <button key={list.id} onClick={() => setSelectedListIndex(idx)} className={`w-full p-3 rounded-xl text-right text-[11px] font-bold transition-all border ${selectedListIndex === idx ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'bg-transparent border-transparent text-slate-500'}`}>
                            <div className="flex items-center justify-between">
                               <span>{list.name}</span>
                               <ChevronRight size={14} className={selectedListIndex === idx ? 'opacity-100' : 'opacity-0'}/>
                            </div>
                            <div className="text-[9px] opacity-60 mt-1">{list.donors.length} תורמים · {list.assignedRepIds.length} נציגים</div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-10 bg-white space-y-4 scroll-hide animate-fade-in text-right">
                      {selectedListIndex !== null && pendingCallLists[selectedListIndex] ? (
                        <>
                          <div className="flex justify-between items-end border-b pb-4 mb-4">
                             <div>
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><PhoneCall size={20} className="text-emerald-500" /> {pendingCallLists[selectedListIndex].name}</h3>
                                <div className="flex gap-2 mt-2">
                                  {pendingCallLists[selectedListIndex].assignedRepIds.map(rid => (
                                    <span key={rid} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black">
                                      {reps.find(r => r.id === rid)?.name}
                                    </span>
                                  ))}
                                </div>
                             </div>
                             <div className="text-[10px] font-black text-slate-400">סה"כ {pendingCallLists[selectedListIndex].donors.length} שיחות</div>
                          </div>
                          {pendingCallLists[selectedListIndex].donors.map((donor, idx) => (
                            <div key={donor.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                              <div className="flex items-center gap-5">
                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-sm font-black text-slate-400 shadow-sm border border-slate-100">{idx + 1}</div>
                                <div>
                                  <p className="text-base font-black text-slate-900">{donor.firstName} {donor.lastName}</p>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase italic">
                                    פוטנציאל: {donor.potentialRank}⭐ | תרומה: ₪{getDonorTotalConfirmed(donor.phone).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <span className="text-base font-black text-slate-900 tabular-nums tracking-tighter">{donor.phone}</span>
                                <button className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200 hover:scale-110 active:scale-90 transition-all"><Phone size={18}/></button>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                           <Layers size={40} className="mb-4 opacity-20"/>
                           <p className="font-bold">בחר רשימה מהתפריט בצד לצפייה</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 bg-slate-100 relative border-l overflow-hidden shadow-inner">
                      <Map defaultCenter={{ lat: 32.1848, lng: 34.8713 }} defaultZoom={13} gestureHandling={'greedy'} disableDefaultUI={true} />
                      <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-white text-[9px] font-black text-blue-600 uppercase flex items-center gap-2">
                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div> Google Transit Live Info
                      </div>
                    </div>
                    <div className="w-[380px] overflow-y-auto p-6 bg-white scroll-hide border-r shadow-2xl z-20 text-right">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b pb-4 mb-6 flex items-center gap-2"><Navigation size={14}/> הוראות ניווט והגעה מדויקות</h3>
                        <div className="space-y-8">
                          {activeTaskDonors.map((donor, idx) => (
                            <div key={donor.id} className="animate-fade-in">
                              <div className="flex gap-4 group">
                                <div className="flex flex-col items-center shrink-0">
                                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors">{idx + 1}</div>
                                  {idx < activeTaskDonors.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-2"></div>}
                                </div>
                                <div className="pb-2 min-w-0 flex-1">
                                  <p className="text-[14px] font-black text-slate-900 truncate leading-tight">{donor.firstName} {donor.lastName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{donor.street} {donor.building}, {donor.city}</p>
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

      {showCustomDonors && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-8 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 italic tracking-tight">בחירה ידנית מתוך מאגר מסונן</h2>
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
                <button key={donor.id} onClick={() => toggleSelection(donor.id, selectedCustomDonors, setSelectedCustomDonors)} className={`p-5 rounded-[25px] border-2 transition-all text-right flex items-center justify-between group ${selectedCustomDonors.includes(donor.id) ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-blue-50/20'}`}>
                    <div className="min-w-0"><p className={`text-[13px] font-black truncate ${selectedCustomDonors.includes(donor.id) ? 'text-white' : 'text-slate-900'}`}>{donor.firstName} {donor.lastName}</p></div>
                    {selectedCustomDonors.includes(donor.id) ? <Check size={18} /> : <Plus size={14} className="opacity-30" />}
                </button>
              ))}
            </div>
            <div className="p-8 border-t bg-white flex items-center justify-between shadow-2xl">
              <span className="text-xl font-black text-slate-900 leading-none">{selectedCustomDonors.length} נבחרו</span>
              <button onClick={() => setShowCustomDonors(false)} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all hover:bg-blue-700">אשר בחירה וחזור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCreationPage;