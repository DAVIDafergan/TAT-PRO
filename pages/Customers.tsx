
import React, { useState, useMemo } from 'react';
import { Customer, CustomerContact, SubscriptionType, ContactRole, User, UserRole, CustomerStatus } from '../types';
import { 
  Building2, Plus, Search, Mail, Phone, MapPin, 
  Trash2, Edit2, X, Check, Users, ShieldCheck, 
  Smartphone, CreditCard, ChevronLeft, MoreHorizontal, 
  CheckCircle2, AlertCircle, Clock, Info, Globe, MessageCircle,
  ThumbsUp, ThumbsDown, ShieldAlert, UserCog, History, Shield, LayoutGrid, List
} from 'lucide-react';

interface CustomersPageProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ customers, setCustomers }) => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | 'all'>('all');

  // Form State for Customer
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', city: '', street: '', houseNumber: '', officePhone: '', email: '',
    subscriptionType: 'paid', contacts: [], users: [], status: 'active'
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.city.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, filterStatus]);

  const allUsers = useMemo(() => {
    const users: (User & { tenantName: string; tenantId: string })[] = [];
    customers.forEach(c => {
      c.users.forEach(u => {
        users.push({ ...u, tenantName: c.name, tenantId: c.id });
      });
    });
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({ ...customer });
    } else {
      setEditingId(null);
      setFormData({
        name: '', city: 'בני ברק', street: '', houseNumber: '', officePhone: '', email: '',
        subscriptionType: 'demo', contacts: [], users: [], status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      setCustomers(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } as Customer : c));
    } else {
      const newCustomer: Customer = {
        ...formData as Customer,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        contacts: formData.contacts || [],
        users: formData.users || [],
        status: formData.status || 'active'
      };
      setCustomers(prev => [newCustomer, ...prev]);
    }
    setShowModal(false);
  };

  const updateCustomerStatus = (id: string, newStatus: CustomerStatus) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const addContact = () => {
    const newContact: CustomerContact = {
      id: Math.random().toString(36).substr(2, 5),
      name: '', phone: '', email: '', hasWhatsApp: true, role: 'מנהל ת"ת'
    };
    setFormData(prev => ({ ...prev, contacts: [...(prev.contacts || []), newContact] }));
  };

  const updateContact = (id: string, field: keyof CustomerContact, value: any) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts?.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeContact = (id: string) => {
    setFormData(prev => ({ ...prev, contacts: prev.contacts?.filter(c => c.id !== id) }));
  };

  const addUser = () => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 5),
      name: '', username: '', role: UserRole.CAMPAIGN_MANAGER, otpOnly: false, status: 'active', lastLogin: 'טרם התחבר'
    };
    setFormData(prev => ({ ...prev, users: [...(prev.users || []), newUser] }));
  };

  const updateUser = (id: string, field: keyof User, value: any) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users?.map(u => u.id === id ? { ...u, [field]: value } : u)
    }));
  };

  const removeUser = (id: string) => {
    setFormData(prev => ({ ...prev, users: prev.users?.filter(u => u.id !== id) }));
  };

  const getSubBadge = (type: SubscriptionType) => {
    const styles = {
      demo: 'bg-blue-50 text-blue-700 border-blue-100',
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      paused: 'bg-red-50 text-red-700 border-red-100',
      yearly: 'bg-purple-50 text-purple-700 border-purple-100'
    };
    const labels = { demo: 'דמו', paid: 'בתשלום', paused: 'מושהה', yearly: 'שנתי' };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${styles[type]}`}>{labels[type]}</span>;
  };

  const getStatusBadge = (status: CustomerStatus | 'active' | 'inactive') => {
     const styles = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        pending: 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse',
        rejected: 'bg-red-50 text-red-600 border-red-100',
        inactive: 'bg-slate-50 text-slate-400 border-slate-100'
     };
     const labels = { active: 'פעיל', pending: 'ממתין', rejected: 'נדחה', inactive: 'מנוטרל' };
     return <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest ${(styles as any)[status]}`}>{(labels as any)[status]}</span>;
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      [UserRole.SUPER_ADMIN]: 'bg-slate-900 text-white',
      [UserRole.CAMPAIGN_MANAGER]: 'bg-blue-600 text-white',
      [UserRole.VIEWER]: 'bg-slate-100 text-slate-600',
      [UserRole.DATA_UPDATER]: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      [UserRole.REPRESENTATIVE]: 'bg-indigo-50 text-indigo-600 border border-indigo-100'
    };
    return <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${(styles as any)[role]}`}>{role}</span>;
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">ניהול לקוחות <span className="text-blue-600">TENANTS</span></h1>
          <p className="text-slate-500 font-medium text-sm">ניהול מוסדות, מנויים וחשבונות גישה למערכת</p>
        </div>
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm overflow-hidden">
           <button onClick={() => { setActiveTab('tenants'); setSearchTerm(''); }} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'tenants' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={14} /> רשימת מוסדות
           </button>
           <button onClick={() => { setActiveTab('users'); setSearchTerm(''); }} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              <Users size={14} /> כל המשתמשים
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder={activeTab === 'tenants' ? "חפש לקוח..." : "חפש משתמש או מוסד..."} 
              className="bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold shadow-sm outline-none w-full focus:ring-4 focus:ring-blue-500/5 transition-all" 
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {activeTab === 'tenants' && (
              <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-300'}`}><LayoutGrid size={18}/></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-300'}`}><List size={18}/></button>
              </div>
            )}
            
            {activeTab === 'tenants' && (
               <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                  {['all', 'active', 'pending'].map(st => (
                      <button key={st} onClick={() => setFilterStatus(st as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${filterStatus === st ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                         {st === 'all' ? 'הכל' : st === 'active' ? 'פעילים' : 'ממתינים'}
                      </button>
                  ))}
               </div>
            )}
            
            {activeTab === 'tenants' && (
               <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg active:scale-95 whitespace-nowrap">
                <Plus size={18} /> לקוח חדש
               </button>
            )}
          </div>
      </div>

      {activeTab === 'tenants' ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                <div className="p-8 border-b border-slate-50 relative">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                         <Building2 size={32} />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                         {getSubBadge(customer.subscriptionType)}
                         {getStatusBadge(customer.status)}
                      </div>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-1">{customer.name}</h3>
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <MapPin size={14} />
                      {customer.city}, {customer.street} {customer.houseNumber}
                   </div>
                   {customer.status === 'pending' && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                         <div className="flex gap-3 scale-90 group-hover:scale-100 transition-all">
                            <button onClick={() => updateCustomerStatus(customer.id, 'active')} className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-emerald-600 active:scale-90"><ThumbsUp size={24}/></button>
                            <button onClick={() => updateCustomerStatus(customer.id, 'rejected')} className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 active:scale-90"><ThumbsDown size={24}/></button>
                         </div>
                      </div>
                   )}
                </div>
                
                <div className="p-6 bg-slate-50/50 space-y-4 flex-1 flex flex-col justify-between">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                         <span>אנשי קשר ({customer.contacts.length})</span>
                         <span>משתמשים ({customer.users.length})</span>
                      </div>
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                         {customer.contacts.map((c, i) => (
                           <div key={c.id} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[11px] font-black text-blue-600 shadow-sm transition-all hover:-translate-y-1" title={c.name}>{c.name.charAt(0)}</div>
                         ))}
                      </div>
                   </div>
                   <div className="pt-4 flex gap-2">
                      <button onClick={() => handleOpenModal(customer)} className="flex-1 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                         <Edit2 size={14} /> ניהול לקוח
                      </button>
                      <button onClick={() => setCustomers(prev => prev.filter(c => c.id !== customer.id))} className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-300 hover:text-red-500 transition-all shadow-sm">
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
             <table className="w-full text-right">
                <thead>
                   <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-6">מוסד / כתובת</th>
                      <th className="px-8 py-6">מנוי</th>
                      <th className="px-8 py-6 text-center">אנשי קשר</th>
                      <th className="px-8 py-6 text-center">משתמשים</th>
                      <th className="px-8 py-6 text-center">סטטוס</th>
                      <th className="px-8 py-6 text-center">פעולות</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredCustomers.map(customer => (
                      <tr key={customer.id} className="hover:bg-blue-50/20 transition-all group">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <Building2 size={24} />
                               </div>
                               <div>
                                  <p className="font-black text-slate-900 text-sm">{customer.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">{customer.city}, {customer.street} {customer.houseNumber}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            {getSubBadge(customer.subscriptionType)}
                         </td>
                         <td className="px-8 py-6 text-center">
                            <span className="text-xs font-black text-slate-700">{customer.contacts.length}</span>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <span className="text-xs font-black text-slate-700">{customer.users.length}</span>
                         </td>
                         <td className="px-8 py-6 text-center">
                            {getStatusBadge(customer.status)}
                         </td>
                         <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => handleOpenModal(customer)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 shadow-sm"><Edit2 size={16}/></button>
                               <button onClick={() => setCustomers(prev => prev.filter(c => c.id !== customer.id))} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-500 shadow-sm"><Trash2 size={16}/></button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
           <table className="w-full text-right">
              <thead>
                 <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-6">שם משתמש / מזהה</th>
                    <th className="px-8 py-6">תפקיד</th>
                    <th className="px-8 py-6">שיוך למוסד (Tenant)</th>
                    <th className="px-8 py-6 text-center">סטטוס</th>
                    <th className="px-8 py-6 text-center">חיבור אחרון</th>
                    <th className="px-8 py-6 text-center">פעולות</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {allUsers.length === 0 ? (
                   <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-300 font-bold italic">לא נמצאו משתמשים העונים על הקריטריון</td>
                   </tr>
                 ) : (
                   allUsers.map(user => (
                    <tr key={user.id} className="hover:bg-blue-50/20 transition-all group">
                       <td className="px-8 py-6 cursor-pointer" onClick={() => handleOpenModal(customers.find(c => c.id === user.tenantId))}>
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-blue-600 font-black text-xs shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {user.name.charAt(0)}
                             </div>
                             <div>
                                <p className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{user.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold tabular-nums">@{user.username}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          {getRoleBadge(user.role)}
                       </td>
                       <td className="px-8 py-6">
                          <button onClick={() => handleOpenModal(customers.find(c => c.id === user.tenantId))} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:border-blue-200 transition-all group/tenant">
                             <Building2 size={14} className="text-slate-400 group-hover/tenant:text-blue-500" />
                             <span className="text-xs font-black text-slate-600 group-hover/tenant:text-blue-700">{user.tenantName}</span>
                          </button>
                       </td>
                       <td className="px-8 py-6 text-center">
                          {getStatusBadge(user.status || 'active')}
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex flex-col items-center">
                             <span className="text-[10px] font-black text-slate-900 tabular-nums leading-none mb-1">{user.lastLogin || 'מעולם לא'}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Last Activity</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                             <button className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 shadow-sm" onClick={() => handleOpenModal(customers.find(c => c.id === user.tenantId))}><UserCog size={16}/></button>
                             <button className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-500 shadow-sm"><Trash2 size={16}/></button>
                          </div>
                       </td>
                    </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto pt-20">
          <div className="bg-[#FDFDFD] rounded-[45px] w-full max-w-5xl shadow-2xl animate-fade-in overflow-hidden border border-white/20 mb-20">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Building2 size={20} /></div>
                 <h2 className="text-2xl font-black text-slate-900">{editingId ? 'עריכת לקוח' : 'הקמת לקוח חדש'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-12">
               {/* Status Switcher */}
               <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <ShieldAlert size={20} className="text-blue-600"/>
                     <div>
                        <p className="text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter">סטטוס אישור הלקוח</p>
                        <p className="text-[10px] text-slate-400 font-medium">החליטו האם המוסד רשאי להשתמש במערכת</p>
                     </div>
                  </div>
                  <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                     {['active', 'pending', 'rejected'].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({...formData, status: s as any})} className={`px-5 py-2 rounded-lg text-[10px] font-black transition-all ${formData.status === s ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                           {s === 'active' ? 'מאושר' : s === 'pending' ? 'בהמתנה' : 'נדחה'}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Section 1: Basic Info */}
               <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Info size={14} className="text-blue-500" /> פרטים כלליים
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">שם הלקוח / מוסד</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="למשל: ישיבת אורייתא" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:bg-white transition-all shadow-inner" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">אימייל רשמי</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:bg-white transition-all shadow-inner" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">סוג מנוי</label>
                        <select value={formData.subscriptionType} onChange={e => setFormData({...formData, subscriptionType: e.target.value as SubscriptionType})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none cursor-pointer">
                           <option value="demo">סביבת דמו</option>
                           <option value="paid">בתשלום (חודשי)</option>
                           <option value="yearly">מנוי שנתי</option>
                           <option value="paused">מושהה</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">טלפון במוסד (אופציונלי)</label>
                        <input value={formData.officePhone} onChange={e => setFormData({...formData, officePhone: e.target.value})} placeholder="02-1234567" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none" />
                     </div>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                     <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">עיר</label>
                        <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">רחוב</label>
                        <input required value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">מספר</label>
                        <input required value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                     </div>
                  </div>
               </div>

               {/* Section 2: Contacts */}
               <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users size={14} className="text-blue-500" /> אנשי קשר במוסד
                     </h3>
                     <button type="button" onClick={addContact} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-100 transition-all">+ הוסף איש קשר</button>
                  </div>
                  <div className="space-y-4">
                     {formData.contacts?.map((contact) => (
                        <div key={contact.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 bg-slate-50 border border-slate-100 rounded-[28px] animate-fade-in relative group">
                           <button type="button" onClick={() => removeContact(contact.id)} className="absolute -top-2 -left-2 w-7 h-7 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                           <div className="md:col-span-2"><input placeholder="שם מלא" value={contact.name} onChange={e => updateContact(contact.id, 'name', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold shadow-sm" /></div>
                           <div><input placeholder="טלפון נייד" value={contact.phone} onChange={e => updateContact(contact.id, 'phone', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold tabular-nums shadow-sm" /></div>
                           <div><input placeholder="מייל" value={contact.email} onChange={e => updateContact(contact.id, 'email', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold shadow-sm" /></div>
                           <div>
                              <select value={contact.role} onChange={e => updateContact(contact.id, 'role', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none shadow-sm">
                                 <option value='מנהל ת"ת'>מנהל ת"ת</option>
                                 <option value='חבר ת"ת'>חבר ת"ת</option>
                                 <option value="מנהל ישיבה">מנהל ישיבה</option>
                                 <option value="ראש הישיבה">ראש הישיבה</option>
                              </select>
                           </div>
                           <div className="flex items-center justify-center">
                              <button type="button" onClick={() => updateContact(contact.id, 'hasWhatsApp', !contact.hasWhatsApp)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all shadow-sm ${contact.hasWhatsApp ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                 <MessageCircle size={14} />
                                 <span className="text-[10px] font-black uppercase">{contact.hasWhatsApp ? 'WhatsApp OK' : 'No WA'}</span>
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Section 3: User Accounts */}
               <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-blue-500" /> משתמשי ניהול ללקוח
                     </h3>
                     <button type="button" onClick={addUser} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all">+ הוסף משתמש</button>
                  </div>
                  <div className="space-y-4">
                     {formData.users?.map((user) => (
                        <div key={user.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6 bg-slate-50 border border-slate-100 rounded-[28px] animate-fade-in relative group">
                           <button type="button" onClick={() => removeUser(user.id)} className="absolute -top-2 -left-2 w-7 h-7 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                           <div className="md:col-span-1"><input placeholder="שם המשתמש" value={user.name} onChange={e => updateUser(user.id, 'name', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold shadow-sm" /></div>
                           <div><input placeholder="Username" value={user.username} onChange={e => updateUser(user.id, 'username', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold shadow-sm text-left" /></div>
                           <div><input placeholder="סיסמה / ברירת מחדל" className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold shadow-sm" type="password" /></div>
                           <div>
                              <select value={user.role} onChange={e => updateUser(user.id, 'role', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none shadow-sm">
                                 <option value={UserRole.SUPER_ADMIN}>מנהל על</option>
                                 <option value={UserRole.CAMPAIGN_MANAGER}>מנהל קמפיין</option>
                                 <option value={UserRole.VIEWER}>צופה</option>
                                 <option value={UserRole.DATA_UPDATER}>מעדכן נתונים</option>
                              </select>
                           </div>
                           <div className="flex items-center justify-center">
                              <button type="button" onClick={() => updateUser(user.id, 'otpOnly', !user.otpOnly)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all shadow-sm ${user.otpOnly ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                 <Smartphone size={14} />
                                 <span className="text-[10px] font-black uppercase">{user.otpOnly ? 'OTP ACTIVE' : 'NO OTP'}</span>
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-[30px] shadow-2xl shadow-blue-500/20 active:scale-98 transition-all hover:bg-blue-700 uppercase tracking-widest mt-10">עדכן לקוח ושמור שינויים</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
