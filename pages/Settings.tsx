
import React, { useState } from 'react';
import { 
  Settings, Shield, Globe, Database, Video, Bell, 
  ChevronLeft, User, Smartphone, Save, Download, 
  RefreshCw, Trash2, ShieldCheck, CreditCard, Banknote,
  Smartphone as PhoneIcon, Landmark, FileText, Plus, X, Zap
} from 'lucide-react';
import { User as UserType, UserRole, ClearingSettings } from '../types';

interface SettingsPageProps {
  setCurrentPage: (page: string) => void;
  user: UserType;
  clearingSettings: ClearingSettings;
  setClearingSettings: React.Dispatch<React.SetStateAction<ClearingSettings>>;
}

type SubPage = 'menu' | 'profile' | 'security' | 'notifications' | 'data' | 'clearing';

const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage, user, clearingSettings, setClearingSettings }) => {
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('menu');
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;

  const handleResetData = () => {
    if (confirm('זהירות: פעולה זו תמחק את כל המידע שהזנת ותחזיר את המערכת למצב "דמו" המקורי. האם להמשיך?')) {
      localStorage.removeItem('tat_pro_db_v1');
      localStorage.removeItem('tat_pro_user');
      window.location.reload();
    }
  };

  const addPhone = (type: 'bit' | 'paybox') => {
    const phone = prompt('הזן מספר טלפון לקבלת כספים:');
    if (phone && phone.length >= 9) {
      setClearingSettings(prev => ({
        ...prev,
        [type]: { ...prev[type], manualPhones: [...prev[type].manualPhones, phone] }
      }));
    }
  };

  const removePhone = (type: 'bit' | 'paybox', index: number) => {
    setClearingSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], manualPhones: prev[type].manualPhones.filter((_, i) => i !== index) }
    }));
  };

  const renderContent = () => {
    switch (activeSubPage) {
      case 'clearing':
        return (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-white rounded-[40px] border border-slate-200 p-10 space-y-10 shadow-sm">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                   <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><CreditCard size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 leading-none mb-1">הגדרות סליקה ותשלומים</h3>
                      <p className="text-xs font-medium text-slate-400">קביעת שיטות עבודה עבור כל אמצעי תשלום במערכת</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Bit Configuration */}
                   <div className="space-y-6 p-8 bg-slate-50 rounded-[35px] border border-slate-100">
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><PhoneIcon size={20}/></div>
                            <h4 className="font-black text-slate-800">אפליקציית BIT</h4>
                         </div>
                         <select 
                            value={clearingSettings.bit.mode} 
                            onChange={e => setClearingSettings(p => ({...p, bit: {...p.bit, mode: e.target.value as any}}))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none"
                         >
                            <option value="manual">עדכון ידני</option>
                            <option value="clearing">חברת סליקה (API)</option>
                         </select>
                      </div>
                      {clearingSettings.bit.mode === 'manual' && (
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מספרי טלפון להעברה (יוצגו לנציג):</p>
                            <div className="flex flex-wrap gap-2">
                               {clearingSettings.bit.manualPhones.map((p, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                                     <span className="text-xs font-bold tabular-nums">{p}</span>
                                     <button onClick={() => removePhone('bit', i)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                                  </div>
                               ))}
                               <button onClick={() => addPhone('bit')} className="p-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all"><Plus size={16}/></button>
                            </div>
                         </div>
                      )}
                   </div>

                   {/* PayBox Configuration */}
                   <div className="space-y-6 p-8 bg-slate-50 rounded-[35px] border border-slate-100">
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><PhoneIcon size={20}/></div>
                            <h4 className="font-black text-slate-800">אפליקציית פייבוקס</h4>
                         </div>
                         <select 
                            value={clearingSettings.paybox.mode} 
                            onChange={e => setClearingSettings(p => ({...p, paybox: {...p.paybox, mode: e.target.value as any}}))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none"
                         >
                            <option value="manual">עדכון ידני</option>
                            <option value="clearing">חברת סליקה (API)</option>
                         </select>
                      </div>
                      {clearingSettings.paybox.mode === 'manual' && (
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מספרי טלפון להעברה (יוצגו לנציג):</p>
                            <div className="flex flex-wrap gap-2">
                               {clearingSettings.paybox.manualPhones.map((p, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                                     <span className="text-xs font-bold tabular-nums">{p}</span>
                                     <button onClick={() => removePhone('paybox', i)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                                  </div>
                               ))}
                               <button onClick={() => addPhone('paybox')} className="p-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all"><Plus size={16}/></button>
                            </div>
                         </div>
                      )}
                   </div>

                   {/* Bank Transfer */}
                   <div className="space-y-4 p-8 bg-white border border-slate-100 rounded-[35px] shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Landmark size={20}/></div>
                         <h4 className="font-black text-slate-800">העברה בנקאית (ידני)</h4>
                      </div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">פרטי חשבון להצגה לנציג</label>
                      <textarea 
                        value={clearingSettings.transfer.bankDetails} 
                        onChange={e => setClearingSettings(p => ({...p, transfer: {bankDetails: e.target.value}}))}
                        rows={2} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none resize-none" 
                        placeholder="שם בנק, סניף, מספר חשבון..." 
                      />
                   </div>

                   {/* Checks */}
                   <div className="space-y-4 p-8 bg-white border border-slate-100 rounded-[35px] shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><FileText size={20}/></div>
                         <h4 className="font-black text-slate-800">שיקים (ידני)</h4>
                      </div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">לפקודת מי לכתוב?</label>
                      <input 
                        type="text"
                        value={clearingSettings.check.payableTo} 
                        onChange={e => setClearingSettings(p => ({...p, check: {payableTo: e.target.value}}))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none" 
                        placeholder="שם העמותה / המוסד" 
                      />
                   </div>
                </div>
                
                <div className="pt-10 border-t border-slate-50 flex justify-end">
                   <button onClick={() => setActiveSubPage('menu')} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">שמור הגדרות תשלומים</button>
                </div>
             </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white f-card p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם מלא</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" defaultValue={user.name} className="w-full pr-12 bg-slate-50 border border-slate-100 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">מספר טלפון</label>
                  <div className="relative">
                    <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" defaultValue={user.phone || 'לא הוגדר'} className="w-full pr-12 tabular-nums bg-slate-50 border border-slate-100 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-end">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-blue-500 transition-all">
                  <Save size={18} /> שמור שינויים
                </button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white f-card p-10 flex flex-col justify-between min-h-[240px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Download size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">ייצוא CRM תורמים</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">הורדת כל רשימת התורמים לקובץ Excel.</p>
                </div>
                <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl">
                   הורד דוח CSV
                </button>
              </div>

              <div className="bg-red-50/50 border border-red-100 rounded-[32px] p-10 flex flex-col justify-between min-h-[240px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                    <RefreshCw size={24} />
                  </div>
                  <h3 className="text-xl font-black text-red-900">איפוס לנתוני דמו</h3>
                  <p className="text-xs font-medium text-red-700/70 leading-relaxed">מחיקת כל השינויים והחזרת המערכת למצב המצגת המקורי.</p>
                </div>
                <button 
                  onClick={handleResetData}
                  className="w-full mt-8 py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl"
                >
                   <Trash2 size={18} /> איפוס מערכת מלא
                </button>
              </div>
            </div>
          </div>
        );

      default:
        const menuSections = [
          {
            title: 'ניהול מערכת',
            items: [
              { id: 'profile', label: 'פרופיל משתמש', icon: <Globe size={18} />, desc: 'ניהול פרטי ההתחברות והרשאות' },
              ...(isSuperAdmin ? [{ id: 'clearing', label: 'הגדרות סליקה ותשלומים', icon: <CreditCard size={18} />, desc: 'ניהול ביט, פייבוקס, העברות וסליקה', isSpecial: true }] : []),
              { id: 'security', label: 'אבטחה ופרטיות', icon: <Shield size={18} />, desc: 'מפתחות API, אימות דו-שלבי' },
              { id: 'notifications', label: 'התראות', icon: <Bell size={18} />, desc: 'הגדרות פוש וסמס לנציגים' },
            ]
          },
          {
            title: 'כלים מתקדמים ומעבדה',
            items: [
              { id: 'studio', label: 'TAT AI Studio', icon: <Video size={18} />, desc: 'הפקת וידאו והדמיות (Gemini Veo)', isSpecial: true, isExternal: true },
              { id: 'data', label: 'ניהול נתונים ודמו', icon: <Database size={18} />, desc: 'ייצוא נתונים ואיפוס לסביבת דמו' },
            ]
          }
        ];

        return (
          <div className="space-y-12 animate-fade-in">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px]"></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h3 className="text-xl font-black italic">סטטוס רכיבי ליבה</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Integrity Audit (v1.4.6)</p>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Stable Build</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                    {[
                       { label: 'מנוע ניווט', status: 'Active', icon: <Zap size={14}/> },
                       { label: 'CRM פנים', status: 'Active', icon: <Database size={14}/> },
                       { label: 'סנכרון חי', status: 'Live', icon: <RefreshCw size={14}/> },
                       { label: 'אבטחת SSL', status: 'Secure', icon: <ShieldCheck size={14}/> },
                    ].map((s, idx) => (
                        <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">{s.icon}</div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{s.label}</p>
                                <p className="text-[10px] font-black text-emerald-400">{s.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {menuSections.map((section, idx) => (
              <div key={idx} className="space-y-6">
                <h3 className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mr-2">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => item.isExternal ? setCurrentPage(item.id) : setActiveSubPage(item.id as SubPage)}
                      className={`f-card p-6 text-right group flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all duration-300 ${item.isSpecial ? 'border-blue-100 hover:border-blue-500' : 'hover:scale-[1.02]'}`}
                    >
                      {item.isSpecial && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.isSpecial ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                          {item.icon}
                        </div>
                        <ChevronLeft size={16} className="text-slate-300 group-hover:text-slate-900 transition-all translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">{item.label}</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="p-10 lg:p-14 animate-fade-in max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none mb-1">הגדרות <span className="text-blue-600">כלליות</span></h1>
            <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Configuration & Finance Rules</p>
          </div>
        </div>
      </div>

      {activeSubPage !== 'menu' && (
        <div className="flex items-center gap-2 mb-8 animate-fade-in">
          <button onClick={() => setActiveSubPage('menu')} className="text-slate-400 hover:text-slate-900 font-bold text-xs flex items-center gap-1 transition-all">הגדרות</button>
          <ChevronLeft size={12} className="text-slate-300" />
          <span className="text-blue-600 font-black text-xs">{activeSubPage === 'clearing' ? 'הגדרות סליקה ותשלומים' : activeSubPage === 'profile' ? 'פרופיל' : activeSubPage}</span>
        </div>
      )}

      <div className="mb-20">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
