import React, { useState } from 'react'; // הוספת useState
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  Database, 
  Monitor, 
  LogOut,
  Crosshair,
  Sparkles,
  MessageSquare,
  CreditCard,
  Banknote,
  Receipt,
  ChevronLeft,
  Settings,
  RefreshCw,
  Activity,
  UserCheck,
  Smartphone,
  Building2,
  Code,
  ShieldCheck,
  MapPinned,
  ExternalLink, // אייקון ללינק חיצוני
  PanelRightClose, // אייקון לסגירה
  PanelRightOpen // אייקון לפתיחה
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  activePage: string;
  setPage: (page: string) => void;
  onLogout: () => void;
  user: User;
  isSyncing?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, onLogout, user, isSyncing }) => {
  const [isCollapsed, setIsCollapsed] = useState(false); // State למצב מקופל
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;

  const allMenuItems = [
    { id: 'dashboard', label: 'דאשבורד', icon: <LayoutDashboard size={18} /> },
    { id: 'customers', label: 'ניהול לקוחות', icon: <Building2 size={18} /> },
    { id: 'campaigns', label: 'ניהול קמפיינים', icon: <Target size={18} /> },
    { id: 'reps', label: 'ניהול נציגים', icon: <Users size={18} /> },
    { id: 'crm', label: 'CRM תורמים', icon: <Database size={18} /> },
    { id: 'task_creation', label: 'יצירת משימות', icon: <MapPinned size={18} /> },
    { id: 'donations', label: 'ניהול תרומות', icon: <CreditCard size={18} /> },
    { id: 'cash_management', label: 'מרכז אימות', icon: <ShieldCheck size={18} /> },
    { id: 'expenses', label: 'ניהול הוצאות', icon: <Receipt size={18} /> },
    { id: 'rewards', label: 'הגרלות ופרסים', icon: <Sparkles size={18} /> },
    { id: 'messages', label: 'הודעות לנציגים', icon: <MessageSquare size={18} /> },
    { id: 'war_room', label: 'חדר פיקוד', icon: <Crosshair size={18} /> },
    { id: 'projection', label: 'מסך רתימה', icon: <Monitor size={18} /> },
    { id: 'settings', label: 'הגדרות מערכת', icon: <Settings size={18} /> },
  ];

  const menuItems = user.role === UserRole.CAMPAIGN_MANAGER && user.allowedPages
    ? allMenuItems.filter(item => user.allowedPages?.includes(item.id))
    : allMenuItems;

  return (
    <div className={`fixed inset-y-0 right-0 bg-white text-slate-900 flex flex-col z-50 border-l border-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.01)] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      {/* כפתור הסתרה/גילוי */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-600 shadow-sm transition-all hover:scale-110"
      >
        {isCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
      </button>

      <div className={`p-10 pb-6 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 invisible h-0 p-0' : 'opacity-100'}`}>
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
              TAT <span className="text-brand-600">PRO</span>
            </h1>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all ${isSyncing ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></div>
               <span className="text-[8px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing' : 'Live'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{isSuperAdmin ? 'מנהל על' : 'מנהל קמפיין'}</span>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 overflow-y-auto scroll-hide">
        <nav className="space-y-1 px-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] transition-all duration-200 group ${
                activePage === item.id 
                  ? 'bg-brand-600 text-white shadow-md font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-all duration-200 ${activePage === item.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && activePage === item.id && <ChevronLeft size={14} className="opacity-60" />}
            </button>
          ))}
          
          {isSuperAdmin && !isCollapsed && (
             <div className="pt-4 mt-4 border-t border-slate-50">
                <button
                  onClick={() => { setPage('settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all group"
                >
                  <CreditCard size={18} className="text-blue-500" />
                  הגדרות סליקה
                </button>
             </div>
          )}
        </nav>
      </div>

      <div className={`p-6 bg-slate-50/50 space-y-3 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-8'}`}>
        
        {/* כפתורי Switch ו-Charidy */}
        {(user.role === UserRole.ADMIN || user.role === UserRole.CAMPAIGN_MANAGER) && (
          <div className={`flex gap-2 ${isCollapsed ? 'flex-col items-center' : 'flex-row'}`}>
            <button
              onClick={() => setPage('rep_portal')}
              title="תצוגת נציג"
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black italic border-2 transition-all group ${
                activePage === 'rep_portal' 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                  : 'bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-sm'
              } ${isCollapsed ? 'w-12 h-12' : 'flex-1'}`}
            >
              <Smartphone size={16} />
              {!isCollapsed && <span>סוויץ' נציג</span>}
            </button>

            <a
              href="https://www.charidy.com/tatpro"
              target="_blank"
              rel="noopener noreferrer"
              title="דף הקמפיין ב-Charidy"
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black border transition-all bg-white border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-100 shadow-sm ${isCollapsed ? 'w-12 h-12' : 'px-3'}`}
            >
              <ExternalLink size={14} />
              {!isCollapsed && <span>דף קמפיין</span>}
            </a>
          </div>
        )}

        <button 
           onClick={() => setPage('dev_handoff')}
           className={`w-full flex items-center gap-3 py-2 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest ${isCollapsed ? 'justify-center' : 'px-4'}`}
        >
           <Code size={16} />
           {!isCollapsed && <span>Dev Suite</span>}
        </button>

        <div className={`flex items-center gap-3 pt-2 border-t border-slate-200 ${isCollapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white text-xs shadow-lg shrink-0">
            {user.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">{user.name}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate">{isSuperAdmin ? 'מנהל על' : 'מנהל'}</p>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-100 transition-all shadow-sm ${isCollapsed ? 'px-0' : 'px-4'}`}
        >
          <LogOut size={12} />
          {!isCollapsed && <span>יציאה</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;