import React from 'react';
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
  MapPinned // ייבוא האייקון החדש ליצירת משימות
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
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;

  const allMenuItems = [
    { id: 'dashboard', label: 'דאשבורד', icon: <LayoutDashboard size={18} /> },
    { id: 'customers', label: 'ניהול לקוחות', icon: <Building2 size={18} /> },
    { id: 'campaigns', label: 'ניהול קמפיינים', icon: <Target size={18} /> },
    { id: 'reps', label: 'ניהול נציגים', icon: <Users size={18} /> },
    { id: 'crm', label: 'CRM תורמים', icon: <Database size={18} /> },
    { id: 'task_creation', label: 'יצירת משימות', icon: <MapPinned size={18} /> }, // הטאב החדש שהוספנו
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
    <div className="fixed inset-y-0 right-0 w-72 bg-white text-slate-900 flex flex-col z-50 border-l border-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.01)]">
      <div className="p-10 pb-6">
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
        <nav className="space-y-1 px-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[14px] transition-all duration-200 group ${
                activePage === item.id 
                  ? 'bg-brand-600 text-white shadow-md font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-all duration-200 ${activePage === item.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`}>
                  {item.icon}
                </span>
                {item.label}
              </div>
              {activePage === item.id && <ChevronLeft size={14} className="opacity-60" />}
            </button>
          ))}
          
          {/* Quick link to Clearing for Super Admin */}
          {isSuperAdmin && (
             <div className="pt-4 mt-4 border-t border-slate-50">
                <button
                  onClick={() => { setPage('settings'); /* we logic will handle jumping to subpage */ }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all group"
                >
                  <CreditCard size={18} className="text-blue-500" />
                  הגדרות סליקה
                </button>
             </div>
          )}
        </nav>
      </div>

      <div className="p-8 bg-slate-50/50 space-y-4">
        {(user.role === UserRole.ADMIN || user.role === UserRole.CAMPAIGN_MANAGER) && (
          <button
            onClick={() => setPage('rep_portal')}
            className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-[13px] font-black italic border-2 transition-all group ${
              activePage === 'rep_portal' 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' 
                : 'bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-sm'
            }`}
          >
            <Smartphone size={18} className={activePage === 'rep_portal' ? '' : 'text-indigo-400'} />
            סוויץ' לתצוגת נציג
          </button>
        )}

        <button 
           onClick={() => setPage('dev_handoff')}
           className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"
        >
           <Code size={16} /> Dev Handoff Suite
        </button>

        <div className="flex items-center gap-3 px-1 pt-2 border-t border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white text-sm shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{user.name}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{isSuperAdmin ? 'מנהל מערכת' : 'מנהל קמפיין'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
        >
          <LogOut size={14} />
          יציאה מהחשבון
        </button>
      </div>
    </div>
  );
};

export default Sidebar;