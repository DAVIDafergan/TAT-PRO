import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Donor, Path, CallList, Representative, Patrol, DonorPreference, ConnectionType } from '../types';
import { 
  Search, Plus, X, Navigation, Phone, Check, User, MapPin, 
  Trash2, MessageCircle, Home, Zap, Building2, Hash, 
  Layers, Edit2, CheckCircle2, ChevronLeft, Type, ArrowUpDown, Users,
  UserMinus, ClipboardList, Clock, Activity, Star
} from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface CRMPageProps {
  donors: Donor[];
  setDonors: React.Dispatch<React.SetStateAction<Donor[]>>;
  reps: Representative[];
  paths: Path[];
  callLists: CallList[];
  activeCampaignId: string;
}

const CRMPage: React.FC<CRMPageProps> = ({ donors = [], setDonors, reps = [], paths = [], callLists = [], activeCampaignId }) => {
  const [activeFilter, setActiveFilter] = useState<DonorPreference | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);
  const [showSingleDonorModal, setShowSingleDonorModal] = useState(false);
  
  // State for representative search in modal
  const [repSearchTerm, setRepSearchTerm] = useState('');
  
  // Sorting State
  const [sortBy, setSortBy] = useState<'firstName' | 'city' | 'connectionType'>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newDonor, setNewDonor] = useState<any>({ 
    firstName: '', lastName: '', city: 'בני ברק', street: '', building: '', floor: '', apartment: '', addressNotes: '',
    phone: '', preferences: ['general_visit'], connectionType: 'general', connectionDetail: '', potentialRank: 3, notes: '',
    assignedRepIds: [], treatmentStatus: 'available', callbackTime: ''
  });

  // Google Maps Logic for Modal
  const placesLib = useMapsLibrary('places');
  const crmCityRef = useRef<HTMLInputElement>(null);
  const crmStreetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLib || !crmCityRef.current || !showSingleDonorModal) return;
    const cityAutocomplete = new placesLib.Autocomplete(crmCityRef.current, { types: ['(cities)'], componentRestrictions: { country: 'il' } });
    cityAutocomplete.addListener('place_changed', () => {
      const place = cityAutocomplete.getPlace();
      if (place.name) setNewDonor(prev => ({ ...prev, city: place.name! }));
    });
  }, [placesLib, showSingleDonorModal]);

  useEffect(() => {
    if (!placesLib || !crmStreetRef.current || !showSingleDonorModal) return;
    const streetAutocomplete = new placesLib.Autocomplete(crmStreetRef.current, { types: ['address'], componentRestrictions: { country: 'il' } });
    streetAutocomplete.addListener('place_changed', () => {
      const place = streetAutocomplete.getPlace();
      if (place.name) setNewDonor(prev => ({ ...prev, street: place.name! }));
    });
  }, [placesLib, showSingleDonorModal]);

  const getConnectionLabel = (type: ConnectionType, detail?: string) => {
    if (type === 'other' && detail) return detail;
    const labels = {
      alumnus: 'בוגר',
      parent: 'הורה תלמיד/בוגר',
      staff_family: 'משפחת צוות',
      student_family: 'משפחת תלמיד',
      general: 'תורם כללי',
      other: 'שיוך אחר'
    };
    let label = labels[type] || 'כללי';
    if (type === 'alumnus' && detail) label += ` (${detail})`;
    return label;
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      donated: '✅ תרם',
      not_donated: '❌ לא תרם',
      in_treatment: '⏳ בטיפול',
      available: '⚪ פנוי',
      callback: '📞 חזור אליו'
    };
    return statuses[status] || 'פנוי';
  };

  const getAssignedRepsForDonor = (donorId: string, manuallyAssignedIds: string[] = []) => {
    const assignedRepIds = new Set<string>(manuallyAssignedIds);
    
    paths.forEach(p => {
      if (p.addresses.some(d => d.id === donorId)) {
        p.assignedRepIds.forEach(id => assignedRepIds.add(id));
      }
    });

    callLists.forEach(cl => {
      if (cl.donors.some(d => d.id === donorId)) {
        cl.assignedRepIds.forEach(id => assignedRepIds.add(id));
      }
    });

    return Array.from(assignedRepIds).map(id => reps.find(r => r.id === id)).filter(Boolean) as Representative[];
  };

  const sortedAndFilteredDonors = useMemo(() => {
    let result = (donors || []).filter(d => {
      const matchesPref = activeFilter === 'all' || d.preferences.includes(activeFilter as DonorPreference);
      const searchString = (d.firstName + ' ' + d.lastName + ' ' + (d.phone || '') + ' ' + (d.street || '') + ' ' + (d.connectionDetail || '')).toLowerCase();
      return matchesPref && searchString.includes(searchTerm.toLowerCase());
    });

    result.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      
      if (sortBy === 'connectionType') {
        valA = getConnectionLabel(a.connectionType, a.connectionDetail);
        valB = getConnectionLabel(b.connectionType, b.connectionDetail);
      }

      if (sortOrder === 'asc') return valA.toString().localeCompare(valB.toString());
      return valB.toString().localeCompare(valA.toString());
    });

    return result;
  }, [donors, activeFilter, searchTerm, sortBy, sortOrder]);

  const filteredRepsInModal = useMemo(() => {
    return reps.filter(r => r.name.toLowerCase().includes(repSearchTerm.toLowerCase()));
  }, [reps, repSearchTerm]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSaveDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonor.firstName || !newDonor.lastName) return;
    
    const donor: any = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: newDonor.firstName!,
      lastName: newDonor.lastName!,
      city: newDonor.city || 'בני ברק',
      street: newDonor.street || '',
      building: newDonor.building || '',
      floor: newDonor.floor || '',
      apartment: newDonor.apartment || '',
      addressNotes: newDonor.addressNotes || '',
      phone: newDonor.phone || '',
      preferences: newDonor.preferences || ['general_visit'],
      connectionType: newDonor.connectionType || 'general',
      connectionDetail: newDonor.connectionDetail,
      totalDonated: 0,
      lastVisit: '',
      status: 'potential',
      assignmentStatus: 'available',
      visitStatus: 'not_visited',
      potentialRank: newDonor.potentialRank || 3,
      notes: newDonor.notes || '',
      campaignId: activeCampaignId,
      assignedRepIds: newDonor.assignedRepIds || [],
      treatmentStatus: newDonor.treatmentStatus,
      callbackTime: newDonor.callbackTime
    };
    
    setDonors(prev => [donor, ...prev]);
    setShowSingleDonorModal(false);
    setRepSearchTerm('');
    setNewDonor({ 
      firstName: '', lastName: '', city: 'בני ברק', street: '', building: '', floor: '', apartment: '', addressNotes: '',
      phone: '', preferences: ['general_visit'], connectionType: 'general', connectionDetail: '', potentialRank: 3, notes: '',
      assignedRepIds: [], treatmentStatus: 'available', callbackTime: ''
    });
  };

  const togglePreference = (pref: DonorPreference) => {
    setNewDonor((prev: any) => {
      const current = prev.preferences || [];
      const next = current.includes(pref) ? current.filter((p: any) => p !== pref) : [...current, pref];
      return { ...prev, preferences: next };
    });
  };

  const toggleRepAssignment = (repId: string) => {
    setNewDonor((prev: any) => {
      const current = prev.assignedRepIds || [];
      const next = current.includes(repId) ? current.filter((id: any) => id !== repId) : [...current, repId];
      return { ...prev, assignedRepIds: next };
    });
  };

  const clearRepAssignments = () => {
    setNewDonor((prev: any) => ({ ...prev, assignedRepIds: [] }));
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">ניהול תורמים <span className="text-blue-600">INTEL CRM</span></h1>
           <p className="text-slate-500 font-medium text-sm">פילוח תורמים והקצאת משימות חכמה מגובה Google Maps</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowSingleDonorModal(true)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-all"><Plus size={16} /> הוספת תורם</button>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl border border-slate-200 p-1 mb-6 shadow-sm w-fit overflow-hidden">
         {['all', 'telephonic', 'general_visit', 'purim_day'].map(f => (
           <button key={f} onClick={() => setActiveFilter(f as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
             {f === 'all' ? 'הכל' : f === 'telephonic' ? 'טלפוני' : f === 'general_visit' ? 'ביקור בית' : 'יום פורים'}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className={selectedDonor ? 'col-span-12 lg:col-span-8' : 'col-span-12'}>
            <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חפש תורם לפי שם, שיוך או כתובת..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold outline-none focus:bg-white transition-all" />
                    </div>
                    <div className="flex gap-2">
                       {['firstName', 'city', 'connectionType'].map((f: any) => (
                         <button key={f} onClick={() => toggleSort(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 ${sortBy === f ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                           {f === 'firstName' ? 'שם' : f === 'city' ? 'עיר' : 'שיוך'} <ArrowUpDown size={12}/>
                         </button>
                       ))}
                    </div>
                </div>
                <div className="overflow-x-auto scroll-hide">
                  <table className="w-full text-right">
                      <thead><tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase border-b border-slate-100"><th className="px-8 py-5">תורם</th><th className="px-8 py-5">קשר ושיוך</th><th className="px-8 py-5">מיקום (עיר)</th><th className="px-8 py-5 text-center">נציג</th><th className="px-8 py-5 text-center">העדפות</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                          {sortedAndFilteredDonors.map(donor => {
                              const allAssignedReps = getAssignedRepsForDonor(donor.id, donor.assignedRepIds);
                              return (
                                <tr key={donor.id} onClick={() => setSelectedDonor(donor)} className={`hover:bg-blue-50/30 cursor-pointer transition-all ${selectedDonor?.id === donor.id ? 'bg-blue-50/50' : ''}`}><td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{donor.firstName.charAt(0)}</div><div><p className="font-black text-slate-900 text-sm">{donor.firstName} {donor.lastName}</p><p className="text-[10px] text-slate-400 font-bold tabular-nums">{donor.phone}</p></div></div></td><td className="px-8 py-5"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase inline-block max-w-[120px] truncate">{getConnectionLabel(donor.connectionType, donor.connectionDetail)}</span></td><td className="px-8 py-5"><div><p className="text-xs font-bold text-slate-900">{donor.city}</p><p className="text-[9px] text-slate-400 font-bold">{donor.street} {donor.building}</p></div></td><td className="px-8 py-5 text-center"><div className="flex justify-center -space-x-1 rtl:space-x-reverse">{allAssignedReps.length > 0 ? allAssignedReps.map((r, i) => (<div key={i} className="w-6 h-6 rounded-lg bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm" title={r.name}>{r.name.charAt(0)}</div>)) : <span className="text-[10px] text-slate-300 italic font-bold">טרם</span>}</div></td><td className="px-8 py-5 text-center"><div className="flex justify-center gap-1">{donor.preferences.map(p => (<div key={p} className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${p === 'telephonic' ? 'bg-orange-400' : p === 'purim_day' ? 'bg-indigo-500' : 'bg-blue-500'}`}>{p === 'telephonic' ? <Phone size={10}/> : p === 'purim_day' ? <Zap size={10}/> : <Home size={10}/>}</div>))}</div></td></tr>
                              );
                          })}
                      </tbody>
                  </table>
                </div>
            </div>
        </div>

        {selectedDonor && (
            <div className="col-span-12 lg:col-span-4 animate-fade-in">
                <div className="bg-white rounded-[30px] border border-slate-200 shadow-xl overflow-hidden sticky top-8">
                    <div className="p-5 bg-slate-900 text-white relative overflow-hidden">
                        <button onClick={() => setSelectedDonor(null)} className="absolute top-4 left-4 p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-all z-20"><X size={14}/></button>
                        <div className="flex justify-between items-start relative z-10 mb-4">
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">{selectedDonor.firstName.charAt(0)}</div>
                            <div className="flex flex-col items-end gap-1">
                               <span className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">{getConnectionLabel(selectedDonor.connectionType, selectedDonor.connectionDetail)}</span>
                               <div className="flex gap-0.5 mt-1">
                                  {[1,2,3,4,5].map(star => <Star key={star} size={10} fill={star <= selectedDonor.potentialRank ? "#fbbf24" : "transparent"} className={star <= selectedDonor.potentialRank ? "text-yellow-400" : "text-white/20"} />)}
                               </div>
                            </div>
                        </div>
                        <h2 className="text-xl font-black mb-0.5 relative z-10">{selectedDonor.firstName} {selectedDonor.lastName}</h2>
                        <p className="text-[10px] text-slate-400 font-bold tabular-nums relative z-10">{selectedDonor.phone}</p>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2"><Activity size={14} className="text-blue-600"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס טיפול</span></div>
                            <span className="text-xs font-black text-slate-900">{getStatusLabel(selectedDonor.treatmentStatus)}</span>
                        </div>
                        {selectedDonor.notes && (
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mr-1">הערות כלליות</p>
                                <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100 flex gap-2">
                                    <ClipboardList size={14} className="text-blue-500 shrink-0" /><p className="text-[11px] font-bold text-blue-900 italic leading-relaxed">"{selectedDonor.notes}"</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1">נציגים מטפלים</p>
                           <div className="flex flex-wrap gap-1.5">
                              {getAssignedRepsForDonor(selectedDonor.id, selectedDonor.assignedRepIds).map(r => (
                                <div key={r.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5">
                                   <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-[9px] font-black text-blue-600">{r.name.charAt(0)}</div>
                                   <span className="text-[10px] font-bold text-slate-700">{r.name}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] active:scale-95 shadow-lg flex items-center justify-center gap-2 mt-4 hover:bg-blue-700 transition-all"><Edit2 size={12}/> ערוך פרטי תורם</button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {showSingleDonorModal && (
        <div className="fixed inset-0 z-[600] flex items-start justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto pt-10 lg:pt-20">
           <div className="bg-white rounded-[35px] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 overflow-hidden relative mb-10">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200"><Plus size={20} /></div>
                    <h2 className="text-lg font-black text-slate-900 italic">הוספת תורם <span className="text-blue-600">INTEL PRO</span></h2>
                 </div>
                 <button onClick={() => {setShowSingleDonorModal(false); setRepSearchTerm('');}} className="p-2 text-slate-400 hover:text-red-500 transition-all bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveDonor} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b pb-2">פרטי התקשרות ומיקום</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">שם פרטי</label><input required value={newDonor.firstName} onChange={e => setNewDonor({...newDonor, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 ring-blue-100 transition-all" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">שם משפחה</label><input required value={newDonor.lastName} onChange={e => setNewDonor({...newDonor, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 ring-blue-100 transition-all" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">טלפון</label><input value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 ring-blue-100 transition-all" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">קשר לישיבה</label>
                           <select value={newDonor.connectionType} onChange={e => setNewDonor({...newDonor, connectionType: e.target.value as ConnectionType})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black outline-none cursor-pointer">
                               <option value="general">תורם כללי / ידיד</option>
                               <option value="alumnus">בוגר הישיבה</option>
                               <option value="parent">הורה תלמיד / בוגר</option>
                               <option value="staff_family">משפחת צוות</option>
                               <option value="student_family">משפחת תלמיד</option>
                               <option value="other">שיוך אחר</option>
                           </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">עיר (גוגל מפות)</label><input ref={crmCityRef} value={newDonor.city} onChange={e => setNewDonor({...newDonor, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                       <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">רחוב (גוגל מפות)</label><input ref={crmStreetRef} value={newDonor.street} onChange={e => setNewDonor({...newDonor, street: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">בניין</label><input value={newDonor.building} onChange={e => setNewDonor({...newDonor, building: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">קומה</label><input value={newDonor.floor} onChange={e => setNewDonor({...newDonor, floor: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">דירה</label><input value={newDonor.apartment} onChange={e => setNewDonor({...newDonor, apartment: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" /></div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b pb-2">סיווג, הקצאה ודירוג</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase mr-1">סטטוס טיפול</label>
                          <select value={newDonor.treatmentStatus} onChange={e => setNewDonor({...newDonor, treatmentStatus: e.target.value})} className="w-full bg-blue-50 border border-blue-100 rounded-xl p-3 text-[10px] font-black outline-none cursor-pointer">
                             <option value="available">⚪ פנוי</option>
                             <option value="in_treatment">⏳ בטיפול</option>
                             <option value="donated">✅ תרם</option>
                             <option value="callback">📞 חזור אליו</option>
                          </select>
                       </div>
                       <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">דירוג פוטנציאל</label>
                          <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 justify-center">
                             {[1,2,3,4,5].map(star => (
                                <button key={star} type="button" onClick={() => setNewDonor({...newDonor, potentialRank: star})} className="transition-all hover:scale-125">
                                   <Star size={18} fill={star <= newDonor.potentialRank ? "#fbbf24" : "transparent"} className={star <= newDonor.potentialRank ? "text-yellow-400" : "text-slate-300"} />
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center justify-between"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">קישור לנציג (חיפוש)</label><button type="button" onClick={clearRepAssignments} className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100">נקה הכל</button></div>
                       <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          <input type="text" placeholder="חפש נציג לפי שם..." value={repSearchTerm} onChange={e => setRepSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold outline-none focus:ring-2 ring-blue-100 transition-all shadow-sm" />
                       </div>
                       <div className="max-h-24 overflow-y-auto bg-slate-50/50 rounded-2xl border border-slate-200 p-2 space-y-1 scroll-hide">
                          {filteredRepsInModal.map(rep => (
                             <button key={rep.id} type="button" onClick={() => toggleRepAssignment(rep.id)} className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between text-[10px] font-bold ${newDonor.assignedRepIds?.includes(rep.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:bg-blue-50'}`}>
                                <span>{rep.name}</span> {newDonor.assignedRepIds?.includes(rep.id) && <Check size={14} />}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">סיווג תורם</label><div className="grid grid-cols-3 gap-2">{['telephonic', 'general_visit', 'purim_day'].map(p => (<button key={p} type="button" onClick={() => togglePreference(p as any)} className={`py-3 rounded-xl border transition-all font-black text-[9px] ${newDonor.preferences?.includes(p as any) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{p === 'telephonic' ? '📞 טלפוני' : p === 'purim_day' ? '🎭 פורים' : '🏠 ביקור בית'}</button>))}</div></div>

                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">הערות כלליות</label><textarea rows={3} value={newDonor.notes} onChange={e => setNewDonor({...newDonor, notes: e.target.value})} placeholder="כתוב הערות חשובות על התורם..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none focus:bg-white transition-all resize-none" /></div>
                 </div>

                 <div className="col-span-1 lg:col-span-2 mt-4"><button type="submit" className="w-full py-5 bg-blue-600 text-white font-black text-sm rounded-[20px] shadow-xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-[0.2em] hover:bg-blue-700">שמור תורם במערכת וסנכרן</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CRMPage;