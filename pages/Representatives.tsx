import React, { useState, useMemo } from 'react';
import { Representative, UserRole, User, CampaignGroup, Patrol } from '../types';
import { 
  UserPlus, Search, X, User as UserIcon, Trash2, Edit2, 
  Users, Award, Smartphone, ShieldAlert, Check, Plus, Palette, Banknote, Target, Shield, MapPin, Settings2, Trophy, TrendingUp, Smartphone as PhoneIcon, Mail, Star, Wand2, RefreshCw, Key, ShieldCheck, Ban, Zap, MapPinned, LayoutGrid, ShieldQuestion, ToggleLeft, ToggleRight, Lock, MapIcon, LayoutDashboard, Crown, CalendarDays, GraduationCap,
  Info
} from 'lucide-react';

interface RepresentativesPageProps {
  reps: Representative[];
  setReps: React.Dispatch<React.SetStateAction<Representative[]>>;
  managers: User[];
  setManagers: React.Dispatch<React.SetStateAction<User[]>>;
  groups: CampaignGroup[];
  setGroups: React.Dispatch<React.SetStateAction<CampaignGroup[]>>;
  patrols: Patrol[];
  setPatrols: React.Dispatch<React.SetStateAction<Patrol[]>>;
  activeCampaignId: string;
}

const CURRENT_HEBREW_YEAR = 5786; // תשפ"ו
const HEBREW_YEAR_LABEL = "תשפ\"ו";

const RepresentativesPage: React.FC<RepresentativesPageProps> = ({ reps, setReps, managers, setManagers, groups, setGroups, patrols, setPatrols, activeCampaignId }) => {
  const [activeTab, setActiveTab] = useState<'reps' | 'managers' | 'groups' | 'patrols'>('reps');
  const [showModal, setShowModal] = useState(false);
  const [editRepId, setEditRepId] = useState<string | null>(null);
  const [editManagerId, setEditManagerId] = useState<string | null>(null);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editPatrolId, setEditPatrolId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [patrolRepSearch, setPatrolRepSearch] = useState(''); // חיפוש נציג בתוך סיירת
  
  const [formData, setFormData] = useState<Partial<Representative>>({
    name: '', username: '', password: '', phone: '', email: '', groupId: '', personalGoal: 50000, loginMethod: 'credentials', otpOnly: false, classYear: ''
  });

  const [groupFormData, setGroupFormData] = useState<Partial<CampaignGroup>>({
    name: '', color: '#3b82f6', shnaton: 'תשפ"ו', goal: 250000 // הוספת יעד קבוצה
  });

  const [managerFormData, setManagerFormData] = useState<Partial<User>>({
    name: '', username: '', password: '', role: UserRole.CAMPAIGN_MANAGER, managerArea: '', allowedPages: ['dashboard', 'crm', 'donations']
  });

  const [patrolFormData, setPatrolFormData] = useState<Partial<Patrol>>({
    name: '', city: 'בני ברק', repIds: [], type: 'regular', goal: 100000 // הוספת יעד סיירת
  });

  // לוגיקה לחישוב שיעור לפי שנתון (מעודכן לתשפ"ו)
  const calculateShiur = (shnatonStr: string | undefined) => {
    if (!shnatonStr) return 'כללי';
    
    const yearMap: Record<string, number> = {
      'תשפ"ו': 5786,
      'תשפ"ה': 5785,
      'תשפ"ד': 5784,
      'תשפ"ג': 5783,
      'תשפ"ב': 5782,
      'תשפ"א': 5781,
      'תש"פ': 5780,
      'תשע"ט': 5779,
    };

    const year = yearMap[shnatonStr];
    if (!year) return shnatonStr;

    const diff = CURRENT_HEBREW_YEAR - year;
    
    if (diff === 0) return 'שיעור א\'';
    if (diff === 1) return 'שיעור ב\'';
    if (diff === 2) return 'שיעור ג\'';
    if (diff === 3) return 'שיעור ד\'';
    if (diff === 4) return 'ועד';
    return 'אברכים';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'reps') {
      if (!formData.name) return;
      if (editRepId) {
        setReps(prev => prev.map(r => r.id === editRepId ? { ...r, ...formData, group: groups.find(g => g.id === formData.groupId)?.name } as Representative : r));
      } else {
        const rep: Representative = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name!,
          username: formData.otpOnly ? (formData.phone || `user_${Date.now()}`) : (formData.username || `rep_${Date.now()}`),
          password: formData.otpOnly ? '1234' : (formData.password || '1234'),
          phone: formData.phone,
          email: formData.email,
          groupId: formData.groupId,
          group: groups.find(g => g.id === formData.groupId)?.name || 'כללי',
          role: UserRole.REPRESENTATIVE,
          personalGoal: Number(formData.personalGoal),
          totalRaised: 0, rank: 'מתחיל', status: 'active',
          campaignId: activeCampaignId, 
          loginMethod: formData.otpOnly ? 'phone' : 'credentials',
          otpOnly: formData.otpOnly,
          classYear: groups.find(g => g.id === formData.groupId)?.shnaton
        };
        setReps(prev => [rep, ...prev]);
      }
    } else if (activeTab === 'managers') {
      if (editManagerId) setManagers(prev => prev.map(m => m.id === editManagerId ? { ...m, ...managerFormData } as User : m));
      else setManagers(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...managerFormData as User, role: UserRole.CAMPAIGN_MANAGER }]);
    } else if (activeTab === 'groups') {
      if (editGroupId) setGroups(prev => prev.map(g => g.id === editGroupId ? { ...g, ...groupFormData } as CampaignGroup : g));
      else setGroups(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...groupFormData } as CampaignGroup]);
    } else if (activeTab === 'patrols') {
      if (editPatrolId) setPatrols(prev => prev.map(p => p.id === editPatrolId ? { ...p, ...patrolFormData } as Patrol : p));
      else setPatrols(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...patrolFormData } as Patrol]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRepId(null); setEditManagerId(null); setEditGroupId(null); setEditPatrolId(null);
    setPatrolRepSearch('');
    setFormData({ name: '', username: '', password: '', phone: '', email: '', groupId: '', personalGoal: 50000, loginMethod: 'credentials', otpOnly: false, classYear: '' });
    setGroupFormData({ name: '', color: '#3b82f6', shnaton: 'תשפ"ו', goal: 250000 });
    setManagerFormData({ name: '', username: '', password: '', role: UserRole.CAMPAIGN_MANAGER, managerArea: '', allowedPages: ['dashboard', 'crm', 'donations'] });
    setPatrolFormData({ name: '', city: 'בני ברק', repIds: [], type: 'regular', goal: 100000 });
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">ניהול כוח אדם <span className="text-blue-600">HR PRO</span></h1>
          <p className="text-slate-500 font-medium text-sm">הגדרת נציגים, קבוצות שנתון וסיירת שטח (שנה נוכחית: {HEBREW_YEAR_LABEL})</p>
        </div>
        
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm overflow-x-auto scroll-hide">
           <button onClick={() => setActiveTab('reps')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'reps' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>נציגים ({reps.length})</button>
           <button onClick={() => setActiveTab('patrols')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'patrols' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>סיירת ({patrols.length})</button>
           <button onClick={() => setActiveTab('groups')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'groups' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>קבוצות / שנתונים ({groups.length})</button>
           <button onClick={() => setActiveTab('managers')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'managers' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>מנהלים ({managers.length})</button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש מהיר..." className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold shadow-sm outline-none" />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
            <Plus size={16} /> הוספת {activeTab === 'reps' ? 'נציג' : activeTab === 'patrols' ? 'סיירת' : activeTab === 'groups' ? 'קבוצה' : 'מנהל'}
          </button>
        </div>

        <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {activeTab === 'reps' && (
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-4">נציג</th>
                  <th className="px-8 py-4 text-center">קבוצה</th>
                  <th className="px-8 py-4 text-center">סטטוס ישיבתי</th>
                  <th className="px-8 py-4 text-center">שיטת חיבור</th>
                  <th className="px-8 py-4 text-center">יעד אישי</th>
                  <th className="px-8 py-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reps.filter(r => r.name.includes(searchTerm)).map(rep => {
                  const group = groups.find(g => g.id === rep.groupId);
                  const currentShiur = calculateShiur(group?.shnaton);
                  
                  return (
                    <tr key={rep.id} className="hover:bg-blue-50/5 transition-all group">
                      <td className="px-8 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-blue-600 text-xs">{rep.name.charAt(0)}</div>
                            <div>
                               <span className="font-black text-slate-900 text-sm block leading-none mb-1">{rep.name}</span>
                               <span className="text-[10px] text-slate-400 font-bold tabular-nums">{rep.phone}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                         <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black text-white shadow-sm" style={{ backgroundColor: group?.color || '#94a3b8' }}>{group?.name || 'כללי'}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                         <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black border border-blue-100 uppercase tracking-tighter italic">{currentShiur}</span>
                            <span className="text-[8px] font-bold text-slate-300 mt-0.5 uppercase">מחזור {group?.shnaton || '??'}</span>
                         </div>
                      </td>
                      <td className="px-8 py-4 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${rep.otpOnly ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>{rep.otpOnly ? 'OTP בלבד' : 'סיסמה'}</span></td>
                      <td className="px-8 py-4 text-center font-black tabular-nums text-sm">₪{rep.personalGoal.toLocaleString()}</td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => { setEditRepId(rep.id); setFormData(rep); setShowModal(true); }} className="p-2 text-slate-300 hover:text-blue-500 transition-all"><Edit2 size={14} /></button>
                          <button onClick={() => setReps(prev => prev.filter(r => r.id !== rep.id))} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'groups' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {groups.map(group => {
                 const currentShiur = calculateShiur(group.shnaton);
                 return (
                   <div key={group.id} className="p-6 rounded-[25px] border border-slate-100 bg-white shadow-sm flex flex-col group hover:shadow-lg transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1.5 h-full opacity-50" style={{ backgroundColor: group.color }}></div>
                      <div className="flex items-center justify-between mb-4">
                         <div className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: group.color }}>{group.name.charAt(0)}</div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditGroupId(group.id); setGroupFormData(group); setShowModal(true); }} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"><Edit2 size={14}/></button>
                            <button onClick={() => setGroups(prev => prev.filter(g => g.id !== group.id))} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                         </div>
                      </div>
                      <div>
                           <h3 className="font-black text-slate-900 text-lg leading-none mb-2">{group.name}</h3>
                           <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase border border-blue-100">{currentShiur}</span>
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">מחזור {group.shnaton}</span>
                           </div>
                           {/* תצוגת יעד קבוצה */}
                           <div className="mb-4">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">יעד קבוצתי: ₪{(group.goal || 0).toLocaleString()}</p>
                             <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-600 opacity-30" style={{ width: '45%' }}></div>
                             </div>
                           </div>
                           <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{reps.filter(r => r.groupId === group.id).length} נציגים</p>
                              <div className="flex -space-x-1.5 rtl:space-x-reverse">
                                 {reps.filter(r => r.groupId === group.id).slice(0, 3).map(r => (
                                    <div key={r.id} className="w-5 h-5 rounded-full bg-white border border-slate-50 flex items-center justify-center text-[7px] font-black text-slate-400 shadow-sm">{r.name.charAt(0)}</div>
                                 ))}
                              </div>
                           </div>
                      </div>
                   </div>
                 );
               })}
            </div>
          )}

          {activeTab === 'patrols' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {patrols.map(patrol => (
                    <div key={patrol.id} className="bg-slate-50 border border-slate-100 rounded-[25px] p-5 hover:bg-white hover:shadow-lg transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner"><MapPinned size={20}/></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setEditPatrolId(patrol.id); setPatrolFormData(patrol); setShowModal(true); }} className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-blue-500"><Edit2 size={13}/></button>
                                <button onClick={() => setPatrols(prev => prev.filter(p => p.id !== patrol.id))} className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-red-500"><Trash2 size={13}/></button>
                            </div>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mb-1">{patrol.name}</h3>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2"><MapPin size={10} className="text-slate-400"/><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{patrol.city}</span></div>
                           {/* תצוגת יעד סיירת */}
                           <div className="text-left">
                              <p className="text-[8px] font-black text-indigo-600 uppercase">יעד: ₪{(patrol.goal || 0).toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">נציגים משוייכים ({patrol.repIds.length})</p>
                            <div className="flex -space-x-2 rtl:space-x-reverse overflow-hidden">
                                {patrol.repIds.map(id => {
                                    const rep = reps.find(r => r.id === id);
                                    return <div key={id} className="w-8 h-8 rounded-full bg-white border border-slate-50 flex items-center justify-center text-[9px] font-black text-indigo-600 shadow-sm" title={rep?.name}>{rep?.name.charAt(0)}</div>
                                })}
                                {patrol.repIds.length === 0 && <span className="text-[9px] font-bold text-slate-300 italic tracking-tight">טרם שויכו נציגים</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}

          {activeTab === 'managers' && (
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {managers.map(manager => (
                    <div key={manager.id} className="bg-white border border-slate-100 rounded-[30px] p-6 flex items-center gap-5 hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                        <div className="w-16 h-16 bg-emerald-50 rounded-[22px] flex items-center justify-center text-emerald-600 shadow-inner shrink-0 relative">
                            <Crown size={28} className="relative z-10" />
                            <div className="absolute inset-0 bg-emerald-200/10 blur-xl"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                                <h3 className="text-lg font-black text-slate-900 truncate">{manager.name}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setEditManagerId(manager.id); setManagerFormData(manager); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={14}/></button>
                                    <button onClick={() => setManagers(prev => prev.filter(m => m.id !== manager.id))} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3">{manager.managerArea || 'ניהול כללי'}</p>
                            <div className="flex flex-wrap gap-1">
                                {manager.allowedPages?.slice(0, 3).map(page => (
                                    <span key={page} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[7px] font-black text-slate-400 uppercase tracking-tighter">{page}</span>
                                ))}
                                {(manager.allowedPages?.length || 0) > 3 && <span className="text-[7px] font-black text-slate-300">+{manager.allowedPages!.length - 3}</span>}
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
           <div className="bg-white rounded-[30px] w-full max-md shadow-2xl animate-fade-in overflow-hidden border border-slate-100 my-auto">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <h2 className="text-base font-black text-slate-900 tracking-tight italic">פרטי {activeTab === 'reps' ? 'נציג' : activeTab === 'patrols' ? 'סיירת' : activeTab === 'groups' ? 'קבוצת שנתון' : 'מנהל'}</h2>
                 <button onClick={closeModal} className="p-2 text-slate-400 hover:text-red-500 transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                 {activeTab === 'reps' && (
                   <>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">שם הנציג</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:bg-white transition-colors" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">טלפון (OTP)</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold outline-none tabular-nums focus:bg-white" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">אימייל (אופציונלי)</label><input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="mail@pro.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:bg-white" /></div>
                      </div>
                      
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">קבוצת שנתון</label>
                         <select value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer">
                            <option value="">בחר קבוצה...</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name} (מחזור {g.shnaton})</option>)}
                         </select>
                         {formData.groupId && (
                            <p className="text-[8px] font-black text-blue-600 mt-1.5 flex items-center gap-1 uppercase tracking-tighter">
                               <GraduationCap size={10} /> משויך כעת ל: {calculateShiur(groups.find(g => g.id === formData.groupId)?.shnaton)}
                            </p>
                         )}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 mt-2">
                         <div className="flex items-center gap-2"><Lock size={12} className="text-blue-600" /><span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">חיבור OTP בלבד</span></div>
                         <button type="button" onClick={() => setFormData({...formData, otpOnly: !formData.otpOnly})} className="transition-all active:scale-90">{formData.otpOnly ? <ToggleRight size={28} className="text-blue-600" /> : <ToggleLeft size={28} className="text-slate-300" />}</button>
                      </div>
                      {!formData.otpOnly && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in">
                          <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">משתמש</label><input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none" /></div>
                          <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">סיסמה</label><input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none" /></div>
                        </div>
                      )}
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">יעד אישי (₪)</label><input value={formData.personalGoal} onChange={e => setFormData({...formData, personalGoal: Number(e.target.value)})} type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-black outline-none" /></div>
                   </>
                 )}

                 {activeTab === 'groups' && (
                    <div className="space-y-5">
                       <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שם הקבוצה</label><input required value={groupFormData.name} onChange={e => setGroupFormData({...groupFormData, name: e.target.value})} placeholder="בני תורה א'" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-sm" /></div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase mr-1 flex items-center gap-1"><CalendarDays size={10} className="text-blue-600" /> שנתון</label>
                             <select value={groupFormData.shnaton} onChange={e => setGroupFormData({...groupFormData, shnaton: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold">
                                <option value="תשפ&quot;ו">תשפ"ו (שיעור א')</option>
                                <option value="תשפ&quot;ה">תשפ"ה (שיעור ב')</option>
                                <option value="תשפ&quot;ד">תשפ"ד (שיעור ג')</option>
                                <option value="תשפ&quot;ג">תשפ"ג (שיעור ד')</option>
                                <option value="תשפ&quot;ב">תשפ"ב (ועד)</option>
                                <option value="תשפ&quot;א">תשפ"א (אברכים)</option>
                                <option value="תש&quot;פ">תש"פ (אברכים)</option>
                                <option value="תשע&quot;ט">תשע"ט (אברכים)</option>
                             </select>
                          </div>
                          <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">צבע</label><input type="color" value={groupFormData.color} onChange={e => setGroupFormData({...groupFormData, color: e.target.value})} className="w-full h-10 rounded-xl cursor-pointer p-1 bg-white border" /></div>
                       </div>
                       {/* הוספת שדה יעד לקבוצה */}
                       <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase tracking-widest mr-1">יעד קבוצתי מצטבר (₪)</label><input type="number" value={groupFormData.goal} onChange={e => setGroupFormData({...groupFormData, goal: Number(e.target.value)})} className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 font-black text-sm outline-none focus:ring-2 ring-blue-500" /></div>
                       <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                          <Info size={16} className="text-blue-600 shrink-0" />
                          <div className="text-right">
                             <p className="text-[8px] font-black text-blue-700 uppercase tracking-widest mb-0.5">מידע מערכת</p>
                             <p className="text-[10px] font-bold text-blue-900 leading-tight">יוצג כעת כ-**{calculateShiur(groupFormData.shnaton)}**.</p>
                          </div>
                       </div>
                    </div>
                 )}

                 {activeTab === 'patrols' && (
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שם הסיירת</label><input required value={patrolFormData.name} onChange={e => setPatrolFormData({...patrolFormData, name: e.target.value})} placeholder="סיירת ברכפלד" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">עיר פעילות</label><input required value={patrolFormData.city} onChange={e => setPatrolFormData({...patrolFormData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold" /></div>
                            <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">סוג</label>
                                <select value={patrolFormData.type} onChange={e => setPatrolFormData({...patrolFormData, type: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold">
                                    <option value="regular">קבוע</option>
                                    <option value="purim_day">יום פורים</option>
                                </select>
                            </div>
                        </div>
                        {/* הוספת שדה יעד לסיירת */}
                        <div className="space-y-1"><label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mr-1">יעד סיירת (₪)</label><input type="number" value={patrolFormData.goal} onChange={e => setPatrolFormData({...patrolFormData, goal: Number(e.target.value)})} className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-sm font-black outline-none focus:ring-2 ring-indigo-500" /></div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase mr-1">שיוך נציגים ({patrolFormData.repIds?.length})</label>
                            
                            {/* שדה חיפוש בתוך בחירת נציג */}
                            <div className="relative mb-2">
                                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                <input 
                                    type="text" 
                                    placeholder="חפש נציג ברשימה..." 
                                    value={patrolRepSearch}
                                    onChange={(e) => setPatrolRepSearch(e.target.value)}
                                    className="w-full bg-white border border-slate-100 rounded-lg pr-8 pl-3 py-1.5 text-[10px] font-bold outline-none focus:border-indigo-200"
                                />
                            </div>

                            <div className="max-h-32 overflow-y-auto bg-slate-50/50 rounded-xl border border-slate-200 p-1.5 space-y-1 scroll-hide">
                                {reps.filter(r => r.name.includes(patrolRepSearch)).map(r => (
                                    <button key={r.id} type="button" onClick={() => setPatrolFormData(prev => ({...prev, repIds: prev.repIds?.includes(r.id) ? prev.repIds.filter(id => id !== r.id) : [...(prev.repIds || []), r.id]}))} className={`w-full text-right p-2 rounded-lg text-[10px] font-bold border transition-all flex justify-between items-center ${patrolFormData.repIds?.includes(r.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                                        {r.name}
                                        {patrolFormData.repIds?.includes(r.id) && <Check size={12}/>}
                                    </button>
                                ))}
                                {reps.filter(r => r.name.includes(patrolRepSearch)).length === 0 && <p className="text-[9px] text-center py-2 text-slate-300 font-bold italic">לא נמצאו נציגים תואמים</p>}
                            </div>
                        </div>
                    </div>
                 )}

                 {activeTab === 'managers' && (
                   <div className="space-y-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שם המנהל</label><input required value={managerFormData.name} onChange={e => setManagerFormData({...managerFormData, name: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold outline-none" /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">תחום ניהול</label><input required value={managerFormData.managerArea} onChange={e => setManagerFormData({...managerFormData, managerArea: e.target.value})} type="text" placeholder="תרומות ומסלולים" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold outline-none" /></div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">שם משתמש</label><input required value={managerFormData.username} onChange={e => setManagerFormData({...managerFormData, username: e.target.value})} type="text" className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold outline-none focus:bg-white" /></div>
                         <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase mr-1">סיסמה</label><input required value={managerFormData.password} onChange={e => setManagerFormData({...managerFormData, password: e.target.value})} type="password" className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold outline-none focus:bg-white" /></div>
                      </div>
                   </div>
                 )}

                 <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black text-xs rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest mt-2 hover:bg-blue-700">שמור שינויים במערכת</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default RepresentativesPage;