import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Donor, Path, CallList, Representative, Patrol, DonorPreference, ConnectionType } from '../types';
import { 
  Search, Plus, X, Navigation, Phone, Check, User, MapPin, 
  Trash2, MessageCircle, Home, Zap, Building2, Hash, 
  Layers, Edit2, CheckCircle2, ChevronLeft, Type, ArrowUpDown, Users,
  UserMinus, ClipboardList, Clock, Activity, Star, Download, Upload, FileText, AlertTriangle, Save
} from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import * as XLSX from 'xlsx';

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
  const [isEditing, setIsEditing] = useState(false);
  const [showSingleDonorModal, setShowSingleDonorModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importClassification, setImportClassification] = useState<DonorPreference>('general_visit');
  
  const [repSearchTerm, setRepSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'firstName' | 'city' | 'connectionType'>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newDonor, setNewDonor] = useState<any>({ 
    firstName: '', lastName: '', city: 'בני ברק', street: '', building: '', floor: '', apartment: '', addressNotes: '',
    phone: '', preferences: ['general_visit'], connectionType: 'general', connectionDetail: '', potentialRank: 3, notes: '',
    assignedRepIds: [], treatmentStatus: 'available', callbackTime: ''
  });

  const [editData, setEditData] = useState<any>(null);

  // Google Maps Autocomplete
  const placesLib = useMapsLibrary('places');
  const crmCityRef = useRef<HTMLInputElement>(null);
  const crmStreetRef = useRef<HTMLInputElement>(null);
  const editCityRef = useRef<HTMLInputElement>(null);
  const editStreetRef = useRef<HTMLInputElement>(null);

  // אתחול Autocomplete להוספת תורם
  useEffect(() => {
    if (!placesLib || !crmCityRef.current || !showSingleDonorModal) return;
    const cityAutocomplete = new placesLib.Autocomplete(crmCityRef.current, { types: ['(cities)'], componentRestrictions: { country: 'il' } });
    cityAutocomplete.addListener('place_changed', () => {
      const place = cityAutocomplete.getPlace();
      if (place.name) setNewDonor((prev: any) => ({ ...prev, city: place.name! }));
    });
  }, [placesLib, showSingleDonorModal]);

  // אתחול Autocomplete לעריכת תורם
  useEffect(() => {
    if (!placesLib || !editCityRef.current || !isEditing) return;
    const cityAutocomplete = new placesLib.Autocomplete(editCityRef.current, { types: ['(cities)'], componentRestrictions: { country: 'il' } });
    cityAutocomplete.addListener('place_changed', () => {
      const place = cityAutocomplete.getPlace();
      if (place.name) setEditData((prev: any) => ({ ...prev, city: place.name! }));
    });
  }, [placesLib, isEditing]);

  const getConnectionLabel = (type: ConnectionType, detail?: string) => {
    const labels: any = { alumnus: 'בוגר', parent: 'הורה', staff_family: 'משפחת צוות', student_family: 'משפחת תלמיד', general: 'תורם כללי / ידיד', other: 'אחר' };
    return labels[type] || 'כללי';
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = { donated: '✅ תרם', not_donated: '❌ לא תרם', in_treatment: '⏳ בטיפול', available: '⚪ פנוי', callback: '📞 חזור אליו' };
    return statuses[status] || 'פנוי';
  };

  const getAssignedRepsForDonor = (donorId: string, manuallyAssignedIds: string[] = []) => {
    const assignedRepIds = new Set<string>(manuallyAssignedIds || []);
    paths.forEach(p => { if (p.addresses?.some(d => d.id === donorId)) p.assignedRepIds?.forEach(id => assignedRepIds.add(id)); });
    callLists.forEach(cl => { if (cl.donors?.some(d => d.id === donorId)) cl.assignedRepIds?.forEach(id => assignedRepIds.add(id)); });
    return Array.from(assignedRepIds).map(id => reps.find(r => r.id === id)).filter(Boolean) as Representative[];
  };

  const sortedAndFilteredDonors = useMemo(() => {
    let result = (donors || []).filter(d => {
      const matchesPref = activeFilter === 'all' || d.preferences?.includes(activeFilter as DonorPreference);
      const searchString = `${d.firstName || ''} ${d.lastName || ''} ${d.phone || ''} ${d.city || ''} ${d.street || ''}`.toLowerCase();
      return matchesPref && searchString.includes(searchTerm.toLowerCase());
    });
    result.sort((a, b) => {
      let valA = a[sortBy] || ''; let valB = b[sortBy] || '';
      if (sortOrder === 'asc') return valA.toString().localeCompare(valB.toString());
      return valB.toString().localeCompare(valA.toString());
    });
    return result;
  }, [donors, activeFilter, searchTerm, sortBy, sortOrder]);

  const filteredRepsInModal = useMemo(() => reps.filter(r => r.name?.toLowerCase().includes(repSearchTerm.toLowerCase())), [reps, repSearchTerm]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const handleSaveDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonor.firstName) return;
    const donor: any = {
      ...newDonor,
      id: Math.random().toString(36).substr(2, 9),
      totalDonated: 0,
      status: 'potential',
      assignmentStatus: 'available',
      campaignId: activeCampaignId
    };
    setDonors(prev => [donor, ...prev]);
    setShowSingleDonorModal(false);
    setNewDonor({ firstName: '', lastName: '', city: 'בני ברק', street: '', building: '', floor: '', apartment: '', addressNotes: '', phone: '', preferences: ['general_visit'], connectionType: 'general', potentialRank: 3, notes: '', assignedRepIds: [], treatmentStatus: 'available' });
  };

  const handleDeleteDonor = (id: string) => {
    if (window.confirm("מחיקת תורם היא לצמיתות. האם להמשיך?")) {
      setDonors(prev => prev.filter(d => d.id !== id));
      setSelectedDonor(null);
    }
  };

  const handleUpdateDonor = () => {
    setDonors(prev => prev.map(d => d.id === editData.id ? { ...editData } : d));
    setSelectedDonor(editData);
    setIsEditing(false);
  };

  // פונקציות אקסל
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(donors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Donors_Database");
    XLSX.writeFile(wb, "TAT_PRO_Full_Donors_Export.xlsx");
  };

  const downloadTemplate = () => {
    const template = [{ firstName: "דוגמא", lastName: "תורם", phone: "0501234567", city: "ירושלים", street: "כנפי נשרים", building: "15", notes: "תורם פוטנציאלי" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "CRM_Import_Example.xlsx");
  };

  const handleImportExcel = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: 'binary' }).Sheets[XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]]);
      const imported = data.map((row: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        firstName: row.firstName || 'חדש',
        lastName: row.lastName || '',
        phone: row.phone || '',
        city: row.city || 'בני ברק',
        street: row.street || '',
        building: row.building || '',
        preferences: [importClassification],
        status: 'potential',
        assignmentStatus: 'available', // סטטוס פנוי אוטומטי בייבוא
        campaignId: activeCampaignId,
        notes: row.notes || ''
      }));
      setDonors(prev => [...imported, ...prev]);
      setShowImportModal(false);
      alert(`${imported.length} תורמים הועלו בהצלחה כ"פנויים". גוגל מפות יאמת את המיקום בהפעלת משימה.`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">ניהול תורמים <span className="text-blue-600">INTEL CRM</span></h1>
           <p className="text-slate-500 font-medium text-sm">ניהול דאטה מאסיבי, ייבוא אקסל וחיבור מפות גוגל</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportExcel} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all"><Download size={16} /> ייצוא</button>
          <button onClick={() => setShowImportModal(true)} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-all"><Upload size={16} /> ייבוא תורמים</button>
          <button onClick={() => setShowSingleDonorModal(true)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-all"><Plus size={16} /> הוספת תורם</button>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl border border-slate-200 p-1 mb-6 shadow-sm w-fit overflow-hidden">
         {['all', 'telephonic', 'general_visit', 'purim_day'].map(f => (
           <button key={f} onClick={() => setActiveFilter(f as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
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
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חפש תורם..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold outline-none focus:bg-white transition-all" />
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
                      <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase border-b border-slate-100">
                        <tr><th className="px-8 py-5">תורם</th><th className="px-8 py-5">קשר</th><th className="px-8 py-5">מיקום</th><th className="px-8 py-5 text-center">נציג</th><th className="px-8 py-5 text-center">סיווג</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {sortedAndFilteredDonors.map(donor => (
                             <tr key={donor.id} onClick={() => {setSelectedDonor(donor); setEditData(donor); setIsEditing(false);}} className={`hover:bg-blue-50/30 cursor-pointer transition-all ${selectedDonor?.id === donor.id ? 'bg-blue-50/50' : ''}`}>
                                <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{(donor.firstName || 'T')[0]}</div><div><p className="font-black text-slate-900 text-sm">{donor.firstName} {donor.lastName}</p><p className="text-[10px] text-slate-400 font-bold tabular-nums">{donor.phone}</p></div></div></td>
                                <td className="px-8 py-5"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">{getConnectionLabel(donor.connectionType)}</span></td>
                                <td className="px-8 py-5"><div><p className="text-xs font-bold text-slate-900">{donor.city}</p><p className="text-[9px] text-slate-400 font-bold">{donor.street} {donor.building}</p></div></td>
                                <td className="px-8 py-5 text-center"><div className="flex justify-center -space-x-1 rtl:space-x-reverse">{getAssignedRepsForDonor(donor.id, donor.assignedRepIds).map((r, i) => (<div key={i} className="w-6 h-6 rounded-lg bg-blue-600 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm" title={r.name}>{r.name[0]}</div>))}</div></td>
                                <td className="px-8 py-5 text-center"><div className="flex justify-center gap-1">{donor.preferences?.map((p: any) => (<div key={p} className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${p === 'telephonic' ? 'bg-orange-400' : p === 'purim_day' ? 'bg-indigo-500' : 'bg-blue-500'}`}>{p === 'telephonic' ? <Phone size={10}/> : p === 'purim_day' ? <Zap size={10}/> : <Home size={10}/>}</div>))}</div></td>
                             </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
            </div>
        </div>

        {selectedDonor && (
            <div className="col-span-12 lg:col-span-4 animate-fade-in">
                <div className="bg-white rounded-[30px] border border-slate-200 shadow-xl overflow-hidden sticky top-8">
                    <div className="p-5 bg-slate-900 text-white relative overflow-hidden">
                        <div className="flex gap-2 absolute top-4 left-4 z-20">
                           <button onClick={() => handleDeleteDonor(selectedDonor.id)} className="p-1.5 bg-red-500/20 text-red-500 rounded-full hover:bg-red-50 hover:text-white transition-all"><Trash2 size={14}/></button>
                           <button onClick={() => setSelectedDonor(null)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={14}/></button>
                        </div>
                        <div className="flex justify-between items-start relative z-10 mb-4">
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">{(selectedDonor.firstName || 'T')[0]}</div>
                            <div className="flex flex-col items-end gap-1">
                               <span className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">{getConnectionLabel(selectedDonor.connectionType)}</span>
                               <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= (selectedDonor.potentialRank || 0) ? "#fbbf24" : "transparent"} className={s <= (selectedDonor.potentialRank || 0) ? "text-yellow-400" : "text-white/20"} />)}</div>
                            </div>
                        </div>
                        <h2 className="text-xl font-black mb-0.5 relative z-10">{selectedDonor.firstName} {selectedDonor.lastName}</h2>
                        <p className="text-[10px] text-slate-400 font-bold tabular-nums relative z-10">{selectedDonor.phone}</p>
                    </div>

                    <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scroll-hide">
                        {isEditing ? (
                          <div className="space-y-4 animate-fade-in">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">שם פרטי</label><input value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" /></div>
                                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">שם משפחה</label><input value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" /></div>
                             </div>
                             <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">טלפון</label><input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" /></div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">עיר (גוגל)</label><input ref={editCityRef} value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" /></div>
                                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">רחוב</label><input value={editData.street} onChange={e => setEditData({...editData, street: e.target.value})} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" /></div>
                             </div>
                             <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">הערות</label><textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold h-20" /></div>
                             <button onClick={handleUpdateDonor} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Save size={14}/> שמור את כל השינויים</button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2"><Activity size={14} className="text-blue-600"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס טיפול</span></div>
                                <span className="text-xs font-black text-slate-900">{getStatusLabel(selectedDonor.treatmentStatus)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">מיקום מדויק</p><p className="text-xs font-bold">{selectedDonor.city}, {selectedDonor.street} {selectedDonor.building}</p></div>
                               <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">דירה / קומה</p><p className="text-xs font-bold">{selectedDonor.apartment || '0'} / {selectedDonor.floor || '0'}</p></div>
                            </div>
                            {selectedDonor.notes && (<div className="space-y-2"><p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mr-1">הערות כלליות</p><div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100 flex gap-2"><ClipboardList size={14} className="text-blue-500 shrink-0" /><p className="text-[11px] font-bold text-blue-900 italic leading-relaxed">"{selectedDonor.notes}"</p></div></div>)}
                            <button onClick={() => {setEditData(selectedDonor); setIsEditing(true);}} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] active:scale-95 shadow-lg flex items-center justify-center gap-2 mt-4 hover:bg-blue-700 transition-all"><Edit2 size={12}/> ערוך פרטי תורם</button>
                          </>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[700] flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm pt-10">
           <div className="bg-white rounded-[35px] w-full max-w-xl shadow-2xl p-8 border border-slate-100 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-900 italic">ייבוא <span className="text-emerald-600">SMART IMPORT</span></h2>
                 <button onClick={() => setShowImportModal(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><X size={20}/></button>
              </div>
              <div className="space-y-6">
                 <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 space-y-3">
                    <p className="text-xs font-black text-blue-700 flex items-center gap-2"><AlertTriangle size={16}/> הנחיות חשובות:</p>
                    <ul className="text-[11px] font-bold text-blue-900 list-disc list-inside space-y-1.5">
                       <li>כל תורם חדש שמיובא יוגדר אוטומטית כסטטוס <b>"פנוי"</b>.</li>
                       <li>גוגל מפות ינסה לאמת כל כתובת (ייתכנו כתובות שלא יזוהו).</li>
                       <li>יש להשתמש בשמות העמודות בדיוק כפי שמופיע בקובץ לדוגמה.</li>
                    </ul>
                    <button onClick={downloadTemplate} className="text-xs font-black text-blue-600 underline hover:text-blue-800 flex items-center gap-1"><Download size={14}/> הורד תבנית לדוגמה</button>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">בחר סיווג לייבוא</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['telephonic', 'purim_day', 'general_visit'].map((p: any) => (
                         <button key={p} onClick={() => setImportClassification(p)} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${importClassification === p ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-white'}`}>
                           {p === 'telephonic' ? '📞 טלפוני' : p === 'purim_day' ? '🎭 פורים' : '🏠 בית'}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-emerald-400 transition-all bg-slate-50/30">
                    <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-black text-slate-500">לחץ להעלאת קובץ אקסל</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Manual Modal */}
      {showSingleDonorModal && (
        <div className="fixed inset-0 z-[600] flex items-start justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto pt-10 lg:pt-16">
           <div className="bg-white rounded-[35px] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 overflow-hidden relative mb-10">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200"><Plus size={20} /></div>
                    <h2 className="text-lg font-black text-slate-900 italic">הוספת תורם <span className="text-blue-600">INTEL PRO</span></h2>
                 </div>
                 <button onClick={() => setShowSingleDonorModal(false)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-100 rounded-full transition-all"><X size={20} /></button>
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
                           <select value={newDonor.connectionType} onChange={e => setNewDonor({...newDonor, connectionType: e.target.value as ConnectionType})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black outline-none cursor-pointer transition-all">
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
                          <select value={newDonor.treatmentStatus} onChange={e => setNewDonor({...newDonor, treatmentStatus: e.target.value})} className="w-full bg-blue-50 border border-blue-100 rounded-xl p-3 text-[10px] font-black outline-none cursor-pointer transition-all">
                             <option value="available">⚪ פנוי</option>
                             <option value="in_treatment">⏳ בטיפול</option>
                             <option value="donated">✅ תרם</option>
                             <option value="callback">📞 חזור אליו</option>
                          </select>
                       </div>
                       <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">דירוג פוטנציאל</label>
                          <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 justify-center transition-all">
                             {[1,2,3,4,5].map(star => (
                                <button key={star} type="button" onClick={() => setNewDonor({...newDonor, potentialRank: star})} className="transition-all hover:scale-125">
                                   <Star size={18} fill={star <= (newDonor.potentialRank || 0) ? "#fbbf24" : "transparent"} className={star <= (newDonor.potentialRank || 0) ? "text-yellow-400" : "text-slate-300"} />
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center justify-between"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">קישור לנציג (חיפוש)</label><button type="button" onClick={() => setNewDonor({...newDonor, assignedRepIds: []})} className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100 shadow-sm transition-all hover:bg-red-100">נקה הכל</button></div>
                       <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          <input type="text" placeholder="חפש נציג לפי שם..." value={repSearchTerm} onChange={e => setRepSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold outline-none focus:ring-2 ring-blue-100 transition-all shadow-sm" />
                       </div>
                       <div className="max-h-24 overflow-y-auto bg-slate-50/50 rounded-2xl border border-slate-200 p-2 space-y-1 scroll-hide">
                          {filteredRepsInModal.map(rep => (
                             <button key={rep.id} type="button" onClick={() => {
                                const current = newDonor.assignedRepIds || [];
                                const next = current.includes(rep.id) ? current.filter((id:any) => id !== rep.id) : [...current, rep.id];
                                setNewDonor({...newDonor, assignedRepIds: next});
                             }} className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between text-[10px] font-bold ${newDonor.assignedRepIds?.includes(rep.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:bg-blue-50'}`}>
                                <span>{rep.name}</span> {newDonor.assignedRepIds?.includes(rep.id) && <Check size={14} />}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">סיווג תורם</label><div className="grid grid-cols-3 gap-2">{['telephonic', 'general_visit', 'purim_day'].map(p => (<button key={p} type="button" onClick={() => togglePreference(p as any)} className={`py-3 rounded-xl border transition-all font-black text-[9px] ${newDonor.preferences?.includes(p as any) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{p === 'telephonic' ? '📞 טלפוני' : p === 'purim_day' ? '🎭 פורים' : '🏠 ביקור בית'}</button>))}</div></div>

                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase mr-1">הערות כלליות</label><textarea rows={3} value={newDonor.notes} onChange={e => setNewDonor({...newDonor, notes: e.target.value})} placeholder="כתוב הערות חשובות..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none focus:bg-white transition-all resize-none shadow-sm" /></div>
                 </div>

                 <div className="col-span-1 lg:col-span-2 mt-4"><button type="submit" className="w-full py-5 bg-blue-600 text-white font-black text-sm rounded-[25px] shadow-xl shadow-blue-200 active:scale-95 transition-all hover:bg-blue-700 uppercase tracking-widest">שמור תורם במערכת וסנכרן</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CRMPage;