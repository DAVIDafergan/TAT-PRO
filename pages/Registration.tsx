
import React, { useState } from 'react';
import { Customer, CustomerContact, SubscriptionType, User, UserRole } from '../types';
import { 
  Building2, ArrowLeft, ArrowRight, CheckCircle2, 
  Users, ShieldCheck, Mail, Phone, MapPin, 
  Globe, Smartphone, CreditCard, Info, MessageCircle,
  Sparkles, Lock, ShieldAlert
} from 'lucide-react';

interface RegistrationProps {
  onRegister: (customer: Customer) => void;
  onBack: () => void;
}

const Registration: React.FC<RegistrationProps> = ({ onRegister, onBack }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', city: 'בני ברק', street: '', houseNumber: '', officePhone: '', email: '', subscriptionType: 'demo', contacts: [], users: []
  });
  const [adminUser, setAdminUser] = useState({ name: '', username: '', password: '', phone: '' });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer: Customer = {
      ...formData as Customer,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date().toISOString(),
      contacts: formData.contacts || [],
      users: [{
        id: Math.random().toString(36).substr(2, 5),
        name: adminUser.name,
        username: adminUser.username,
        password: adminUser.password,
        phone: adminUser.phone,
        role: UserRole.SUPER_ADMIN,
        otpOnly: true
      }]
    };
    onRegister(customer);
    setStep(4); // Success step
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><ArrowRight size={24} /></button>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">TAT <span className="text-blue-600">PRO</span> <span className="text-slate-300 font-medium">ONBOARDING</span></h1>
        </div>
        <div className="flex items-center gap-2">
           {[1,2,3].map(s => (
             <div key={s} className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600 w-8' : 'bg-slate-100'}`}></div>
           ))}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-10">
        {step === 1 && (
          <div className="animate-fade-in space-y-12">
            <div className="space-y-2">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">נעים להכיר, בואו נתחיל.</h2>
               <p className="text-slate-500 text-lg font-medium italic">ספרו לנו קצת על המוסד או הארגון שלכם</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם המוסד / ארגון</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="למשל: ישיבת אורייתא" className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">אימייל רשמי</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">עיר</label>
                        <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">מספר</label>
                        <input value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">רחוב</label>
                    <input value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                  </div>
               </div>
               
               <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">בחר סוג מנוי מבוקש</label>
                  <div className="space-y-4">
                     {[
                       { id: 'demo', label: 'סביבת דמו חינמית', desc: 'להתנסות במערכת ללא התחייבות', icon: <Sparkles size={20}/> },
                       { id: 'paid', label: 'מנוי חודשי רגיל', desc: 'תשלום לפי שימוש (נציגים)', icon: <CreditCard size={20}/> },
                       { id: 'yearly', label: 'מנוי שנתי VIP', desc: 'ליווי אישי ותמיכה טכנית צמודה', icon: <Globe size={20}/> }
                     ].map(opt => (
                       <button key={opt.id} onClick={() => setFormData({...formData, subscriptionType: opt.id as any})} className={`w-full p-6 rounded-3xl border-2 text-right transition-all flex items-center gap-5 group ${formData.subscriptionType === opt.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.subscriptionType === opt.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-400 group-hover:bg-white shadow-inner'}`}>
                             {opt.icon}
                          </div>
                          <div>
                             <p className="font-black text-slate-900">{opt.label}</p>
                             <p className="text-xs font-medium text-slate-400">{opt.desc}</p>
                          </div>
                       </button>
                     ))}
                  </div>
               </div>
            </div>
            
            <button onClick={nextStep} className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-[35px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
               המשך לשלב הבא
               <ArrowLeft size={24} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-12">
            <div className="space-y-2">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">מי האנשים שלנו?</h2>
               <p className="text-slate-500 text-lg font-medium italic">הוסיפו אנשי קשר שיוכלו לנהל את המוסד מולנו</p>
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-blue-500"/> רשימת אנשי קשר</h3>
                  <button onClick={addContact} className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-100 transition-all">+ הוסף איש קשר</button>
               </div>
               
               <div className="space-y-4">
                  {formData.contacts?.map((contact) => (
                    <div key={contact.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-8 bg-white border border-slate-100 rounded-[35px] shadow-sm animate-fade-in relative group border-r-4 border-r-blue-500">
                       <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[9px] font-black text-slate-300 uppercase mr-1">שם מלא</label>
                          <input placeholder="ישראל ישראלי" value={contact.name} onChange={e => updateContact(contact.id, 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-300 uppercase mr-1">טלפון נייד</label>
                          <input placeholder="050-0000000" value={contact.phone} onChange={e => updateContact(contact.id, 'phone', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold tabular-nums" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-300 uppercase mr-1">תפקיד</label>
                          <select value={contact.role} onChange={e => updateContact(contact.id, 'role', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none">
                             <option value='מנהל ת"ת'>מנהל ת"ת</option>
                             <option value='חבר ת"ת'>חבר ת"ת</option>
                             <option value="מנהל ישיבה">מנהל ישיבה</option>
                             <option value="ראש הישיבה">ראש הישיבה</option>
                          </select>
                       </div>
                       <div className="flex items-end justify-center">
                          <button type="button" onClick={() => updateContact(contact.id, 'hasWhatsApp', !contact.hasWhatsApp)} className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${contact.hasWhatsApp ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                             <MessageCircle size={16} />
                             <span className="text-[10px] font-black uppercase">{contact.hasWhatsApp ? 'WhatsApp' : 'No WA'}</span>
                          </button>
                       </div>
                    </div>
                  ))}
                  {(!formData.contacts || formData.contacts.length === 0) && (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] text-slate-300 font-bold italic flex flex-col items-center gap-4">
                       <Users size={48} className="opacity-20" />
                       חובה להוסיף לפחות איש קשר אחד
                    </div>
                  )}
               </div>
            </div>

            <div className="flex gap-4">
               <button onClick={prevStep} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black text-lg rounded-[35px] transition-all">חזור</button>
               <button onClick={nextStep} disabled={!formData.contacts || formData.contacts.length === 0} className="flex-[2] py-5 bg-slate-900 text-white font-black text-lg rounded-[35px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50">
                  המשך לשלב האחרון
                  <ArrowLeft size={24} />
               </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-12">
            <div className="space-y-2 text-center">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">רגע לפני סיום...</h2>
               <p className="text-slate-500 text-lg font-medium italic">הגדירו את חשבון הניהול הראשי שלכם</p>
            </div>

            <div className="max-w-md mx-auto bg-white rounded-[45px] border border-slate-200 shadow-2xl p-12 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -z-10"></div>
               <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20"><Lock size={36}/></div>
               
               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם מלא (מנהל)</label>
                    <input required value={adminUser.name} onChange={e => setAdminUser({...adminUser, name: e.target.value})} placeholder="ישראל ישראלי" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם משתמש (לועזית)</label>
                    <input required value={adminUser.username} onChange={e => setAdminUser({...adminUser, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} placeholder="admin_user" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none text-left" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">סיסמה ראשונית</label>
                    <input required type="password" value={adminUser.password} onChange={e => setAdminUser({...adminUser, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">טלפון לאימות OTP</label>
                    <input required value={adminUser.phone} onChange={e => setAdminUser({...adminUser, phone: e.target.value})} placeholder="050-0000000" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none tabular-nums" />
                  </div>
               </div>

               <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <ShieldCheck className="text-blue-600 shrink-0" size={20} />
                  <p className="text-[10px] font-bold text-blue-700 leading-relaxed">שימו לב: לאחר ההרשמה הבקשה תעבור לאישור מנהלי המערכת. הודעה תשלח אליכם בסיום הבדיקה.</p>
               </div>

               <button onClick={handleSubmit} className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-[30px] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">סיום והגשת בקשה</button>
            </div>
            
            <button onClick={prevStep} className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">חזור לעריכת אנשי קשר</button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center space-y-10">
             <div className="w-40 h-40 bg-emerald-50 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-emerald-200/20 rounded-full animate-ping"></div>
                <CheckCircle2 size={100} className="text-emerald-500 relative z-10" strokeWidth={3} />
             </div>
             <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">הבקשה נקלטה בהצלחה!</h2>
                <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto">תודה שבחרת ב-TAT PRO. המערכת בוחנת את הפרטים שלך ותשלח עדכון לנייד <span className="text-blue-600 font-black">{adminUser.phone}</span> ברגע שהסביבה תהיה מוכנה.</p>
             </div>
             <button onClick={onBack} className="px-12 py-5 bg-slate-900 text-white font-black text-lg rounded-[30px] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-4">
                חזרה לדף הבית
                <ArrowLeft size={24} />
             </button>
          </div>
        )}
      </main>
      
      <footer className="p-10 text-center border-t border-slate-50">
         <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">TAT PRO Infrastructure • Elite Fundraising Systems</p>
      </footer>
    </div>
  );
};

export default Registration;
