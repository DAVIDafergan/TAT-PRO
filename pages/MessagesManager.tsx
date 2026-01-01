import React, { useState } from 'react';
import { Representative, SystemMessage, RepToAdminMessage } from '../types';
import { db } from '../services/db'; // חיבור למסד הנתונים
import { 
  Send, Users, User, LayoutGrid, X, CheckCircle2, MessageSquare, 
  AlertCircle, Info, Search, Mail, Clock, Trash2, ArrowLeft,
  Zap, Bell, Smartphone, Target, Trophy, Check, Reply, ChevronDown, ToggleLeft, ToggleRight
} from 'lucide-react';

interface MessagesManagerProps {
  reps: Representative[];
  sendSystemMessage: (msg: Omit<SystemMessage, 'id' | 'timestamp'>) => void;
  incomingMessages: RepToAdminMessage[];
  setIncomingMessages: React.Dispatch<React.SetStateAction<RepToAdminMessage[]>>;
}

const MessagesManager: React.FC<MessagesManagerProps> = ({ reps, sendSystemMessage, incomingMessages, setIncomingMessages }) => {
  const [activeTab, setActiveTab] = useState<'send' | 'inbox' | 'auto'>('send');
  const [targetType, setTargetType] = useState<'all' | 'group' | 'specific'>('all');
  const [selectedRepIds, setSelectedRepIds] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'urgent'>('info');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const groups = Array.from(new Set(reps.map(r => r.group))).filter(Boolean);
  const filteredReps = reps.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleRepSelection = (id: string) => {
    setSelectedRepIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    sendSystemMessage({
      title,
      content,
      type,
      targetType,
      targetIds: targetType === 'specific' ? selectedRepIds : undefined,
      targetGroup: targetType === 'group' ? selectedGroup : undefined
    });

    setTitle('');
    setContent('');
    alert("הודעה שוגרה בהצלחה!");
  };

  // תיקון פונקציית התגובה - שולחת הודעת מערכת חזרה לנציג ומעדכנת את השרת
  const handleReply = async (msg: RepToAdminMessage) => {
    if (!replyText) return;
    
    // 1. שליחת הודעת מערכת לנציג הספציפי
    sendSystemMessage({
      title: `תגובה מהמנהלת: ${msg.content.substring(0, 15)}...`,
      content: replyText,
      type: 'info',
      targetType: 'specific',
      targetIds: [msg.repId]
    });

    // 2. עדכון סטטוס ההודעה הנכנסת ל-'replied' בשרת ובמצב המקומי
    const updatedMsg = { ...msg, status: 'replied' as const };
    setIncomingMessages(prev => prev.map(m => m.id === msg.id ? updatedMsg : m));
    await db.saveRepToAdminMessage(updatedMsg);

    setReplyingToId(null);
    setReplyText('');
    alert(`תגובה נשלחה לנציג: ${msg.repName}`);
  };

  const [autoRules, setAutoRules] = useState([
    { id: 'rule1', name: 'אישור תרומה מוצלחת', trigger: 'Donation Success', template: 'כל הכבוד [Name]! תרומה של [Amount] ש"ח נקלטה בהצלחה. המשך כך!', enabled: true, icon: <Zap size={18}/> },
    { id: 'rule2', name: 'הגעה ל-50% מהיעד האישי', trigger: '50% Milestone', template: 'מזל טוב [Name]! חצית את קו החצי. נשארו לך רק עוד [Remaining] ש"ח ליעד!', enabled: true, icon: <Target size={18}/> },
    { id: 'rule3', name: 'פתיחת דרגה חדשה', trigger: 'New Rank', template: 'וואו! עלית לדרגת [RankName]! המערכת מעריכה את המאמץ שלך.', enabled: false, icon: <Trophy size={18}/> },
    { id: 'rule4', name: 'אישור קבלת מזומן', trigger: 'Cash Confirmed', template: 'הפקדת המזומן שלך בסך [Amount] ש"ח אושרה ע"י המערכת.', enabled: true, icon: <Bell size={18}/> }
  ]);

  const toggleRule = (id: string) => {
    setAutoRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">מרכז תקשורת <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 font-medium">ניהול הודעות מערכת ותקשורת עם נציגי השטח</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
              <button onClick={() => setActiveTab('send')} className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all ${activeTab === 'send' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>שליחת הודעה</button>
              <button onClick={() => setActiveTab('inbox')} className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all relative ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                הודעות נכנסות
                {incomingMessages.filter(m => m.status === 'new').length > 0 && <span className="absolute top-3 left-3 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{incomingMessages.filter(m => m.status === 'new').length}</span>}
              </button>
              <button onClick={() => setActiveTab('auto')} className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all ${activeTab === 'auto' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>אוטומציות <span className="text-[8px] opacity-60">AUTO PRO</span></button>
            </div>

            {activeTab === 'send' ? (
              <form onSubmit={handleSend} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">קהל יעד</label>
                    <div className="grid grid-cols-3 gap-3">
                       {[
                         { id: 'all', label: 'כולם', icon: <Users size={16} /> },
                         { id: 'group', label: 'קבוצה', icon: <LayoutGrid size={16} /> },
                         { id: 'specific', label: 'בחירה', icon: <User size={16} /> },
                       ].map(t => (
                         <button 
                            key={t.id}
                            type="button"
                            onClick={() => setTargetType(t.id as any)}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${targetType === t.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'}`}
                         >
                            {t.icon}
                            <span className="text-[10px] font-black">{t.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">סוג הודעה</label>
                     <div className="flex gap-3">
                        {[
                          { id: 'info', label: 'כללי', color: 'bg-blue-500' },
                          { id: 'success', label: 'בשורה', color: 'bg-emerald-500' },
                          { id: 'urgent', label: 'דחוף', color: 'bg-red-500' },
                        ].map(t => (
                          <button 
                             key={t.id}
                             type="button"
                             onClick={() => setType(t.id as any)}
                             className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black text-xs ${type === t.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                          >
                             {t.label}
                          </button>
                        ))}
                     </div>
                  </div>
                </div>

                {targetType === 'group' && (
                  <div className="animate-fade-in p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">בחר קבוצה</label>
                     <div className="flex flex-wrap gap-2">
                        {groups.map(g => (
                          <button 
                            key={g} 
                            type="button"
                            onClick={() => setSelectedGroup(g!)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black border transition-all ${selectedGroup === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
                          >
                            {g}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {targetType === 'specific' && (
                   <div className="animate-fade-in p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="חפש נציגים לבחירה..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-xs font-bold outline-none" 
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scroll-hide">
                         {filteredReps.map(r => (
                           <button 
                              key={r.id}
                              type="button"
                              onClick={() => toggleRepSelection(r.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${selectedRepIds.includes(r.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
                           >
                              {r.name}
                              {selectedRepIds.includes(r.id) && <CheckCircle2 size={14} />}
                           </button>
                         ))}
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedRepIds.length} נציגים נבחרו</p>
                   </div>
                )}

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">כותרת ההודעה</label>
                      <input 
                        type="text" 
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black text-lg outline-none focus:ring-4 focus:ring-blue-500/10" 
                        placeholder="למשל: עדכון לגבי ההגרלה" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">תוכן ההודעה</label>
                      <textarea 
                        rows={4}
                        required
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 resize-none" 
                        placeholder="כתוב כאן את תוכן ההודעה..." 
                      />
                   </div>
                </div>

                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-[30px] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-4">
                   <Send size={24} />
                   שגר הודעה לנציגים
                </button>
              </form>
            ) : activeTab === 'inbox' ? (
              <div className="p-10 space-y-6">
                 {incomingMessages.length === 0 ? (
                   <div className="p-20 text-center text-slate-300 font-bold">טרם התקבלו הודעות מנציגים</div>
                 ) : (
                   <div className="space-y-4">
                      {incomingMessages.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(msg => (
                        <div key={msg.id} className={`p-6 border rounded-[30px] transition-all ${msg.status === 'new' ? 'bg-blue-50/50 border-blue-100 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex gap-6">
                              <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-blue-600 font-black shrink-0 shadow-sm">
                                 {msg.repName.charAt(0)}
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start mb-2">
                                   <div>
                                       <h4 className="text-sm font-black text-slate-900">{msg.repName}</h4>
                                       <p className="text-[9px] text-slate-400 font-black tabular-nums">{new Date(msg.timestamp).toLocaleString('he-IL')}</p>
                                   </div>
                                   {msg.status === 'new' ? (
                                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase animate-pulse">ממתין למענה</span>
                                   ) : msg.status === 'replied' ? (
                                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[8px] font-black uppercase">נענה</span>
                                   ) : null}
                                 </div>
                                 <p className="text-sm font-bold text-slate-600 leading-relaxed">{msg.content}</p>
                                 
                                 {replyingToId === msg.id ? (
                                   <div className="mt-6 animate-fade-in space-y-4 bg-white p-5 rounded-2xl border border-slate-200">
                                      <textarea 
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="כתוב תגובה לנציג..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none resize-none"
                                        rows={2}
                                      />
                                      <div className="flex justify-end gap-2">
                                         <button onClick={() => setReplyingToId(null)} className="px-4 py-2 text-[10px] font-black text-slate-400">ביטול</button>
                                         <button onClick={() => handleReply(msg)} className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-lg">שלח תגובה</button>
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="mt-6 flex gap-2">
                                      <button onClick={() => setReplyingToId(msg.id)} className="px-5 py-2.5 bg-slate-900 text-white font-black text-[10px] rounded-xl active:scale-95 transition-all flex items-center gap-2">
                                         <Reply size={14} /> השב לנציג
                                      </button>
                                      {msg.status === 'new' && (
                                         <button onClick={() => setIncomingMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m))} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-400 font-black text-[10px] rounded-xl">סמן כנקרא</button>
                                      )}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            ) : (
              <div className="p-10 space-y-8 animate-fade-in">
                 <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg"><Zap size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 leading-none">AUTO PRO <span className="text-blue-600">AUTOMATION</span></h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ניהול הודעות מערכת אוטומטיות מבוססות טריגרים</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {autoRules.map(rule => (
                      <div key={rule.id} className={`p-6 rounded-[30px] border transition-all ${rule.enabled ? 'bg-white border-blue-200 shadow-md' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                         <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${rule.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                               {rule.icon}
                            </div>
                            <button onClick={() => toggleRule(rule.id)} className="transition-all active:scale-90">
                               {rule.enabled ? <ToggleRight size={32} className="text-blue-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                            </button>
                         </div>
                         <h4 className="font-black text-slate-900 mb-1">{rule.name}</h4>
                         <div className="flex items-center gap-2 mb-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-tight">Trigger: {rule.trigger}</span>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-600 leading-relaxed">"{rule.template}"</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="bg-amber-50 border border-amber-100 rounded-[30px] p-8 flex items-start gap-4">
                    <Info className="text-amber-500 shrink-0" size={20} />
                    <div>
                       <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">טיפ למנהל</p>
                       <p className="text-xs font-bold text-amber-600/80 leading-relaxed">שימוש בהודעות אוטומטיות מעלה את רמת ה-Engagement של הנציגים ב-40%. מומלץ להשתמש ב-Placeholders כמו [Name] ו-[Amount] כדי להתאים אישית את החוויה.</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px]"></div>
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                 <Mail size={22} className="text-blue-500" />
                 סטטיסטיקת תקשורת
              </h3>
              <div className="space-y-8">
                 <div className="flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-3xl">
                    <span className="text-xs font-black text-slate-500 uppercase">הודעות מערכת היום</span>
                    <span className="text-4xl font-black text-white tabular-nums">12</span>
                 </div>
                 <div className="flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-3xl">
                    <span className="text-xs font-black text-slate-500 uppercase">נציגים עם הודעות פתוחות</span>
                    <span className="text-4xl font-black text-blue-500 tabular-nums">{incomingMessages.filter(m => m.status === 'new').length}</span>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                 <Clock size={20} className="text-slate-400" />
                 הודעות אחרונות ששלחת
              </h3>
              <div className="space-y-4">
                 {[
                   { title: 'סיכום יום - ישיבת מיר', time: 'לפני 3 שעות', count: 24 },
                   { title: 'הודעת עידוד לכל הנציגים', time: 'הבוקר', count: 156 },
                   { title: 'הנחיות לסיירת ירושלים', time: 'אתמול', count: 12 }
                 ].map((msg, i) => (
                    <div key={i} className="p-4 border-r-2 border-slate-100 pr-4 hover:border-blue-500 transition-all cursor-pointer group">
                       <p className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">{msg.title}</p>
                       <p className="text-[9px] text-slate-400 mt-1 uppercase font-black">{msg.time} • ל-{msg.count} נציגים</p>
                    </div>
                 ))}
              </div>
              <button className="w-full py-4 text-blue-600 font-black text-xs bg-blue-50 rounded-2xl">היסטוריית הודעות מלאה</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesManager;