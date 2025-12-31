
import React, { useState } from 'react';
import { User, UserRole, Representative } from '../types';
import { ShieldCheck, User as UserIcon, Lock, ArrowLeft, Smartphone, MessageSquare, ShieldAlert, Loader2, ArrowRight, UserCheck, Crown, Building2 } from 'lucide-react';

interface LoginProps {
  onLogin: (u: User) => void;
  managers: User[];
  allReps: Representative[];
  onRegisterClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, managers, allReps, onRegisterClick }) => {
  const [loginMethod, setLoginMethod] = useState<'username' | 'phone'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [error, setError] = useState('');

  const handleUsernameLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === 'admin') {
      onLogin({ id: 'admin1', name: 'מנהל מערכת', username: 'admin', role: UserRole.ADMIN });
      return;
    }

    const manager = managers.find(m => m.username === username);
    if (manager && (password === manager.password)) {
      onLogin(manager);
      return;
    }

    const rep = allReps.find(r => r.username === username);
    if (rep && (password === rep.password || password === '1234')) {
      onLogin(rep);
      return;
    }

    setError('פרטי ההתחברות אינם נכונים.');
  };

  const handleSendOtp = () => {
    setError('');
    const foundRep = allReps.find(r => r.phone === phone);
    
    if (!foundRep) {
      setError('מספר הטלפון לא נמצא במערכת.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setOtpSent(true);
      setIsVerifying(false);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    setTimeout(() => {
      const foundRep = allReps.find(r => r.phone === phone);
      if (foundRep && otpCode === '1234') {
        onLogin(foundRep);
      } else {
        setError('קוד שגוי (הקוד הוא 1234).');
        setIsVerifying(false);
      }
    }, 800);
  };

  const quickLoginAdmin = () => onLogin({ id: 'admin1', name: 'מנהל מערכת', username: 'admin', role: UserRole.ADMIN });
  const quickLoginRep = () => {
    const rep = allReps.find(r => r.id === 'r1') || allReps[0];
    if (rep) onLogin(rep);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] relative overflow-hidden font-sans" dir="rtl">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-100/30 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full px-6 relative z-10 flex flex-col items-center py-10">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1 italic">
            TAT <span className="text-brand-600 font-medium">PRO</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.4em] uppercase">Elite Fundraising System</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl w-full animate-fade-in relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
            <button onClick={quickLoginAdmin} className="flex flex-col items-center gap-2 p-5 bg-slate-900 rounded-3xl text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl group border border-white/10">
              <Crown size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">כניסת מנהל</span>
            </button>
            <button onClick={quickLoginRep} className="flex flex-col items-center gap-2 p-5 bg-blue-600 rounded-3xl text-white hover:bg-blue-500 transition-all active:scale-95 shadow-xl group border border-white/10">
              <UserIcon size={24} className="text-white group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">כניסת נציג</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative px-4 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest">או הזנת פרטים אישיים</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => { setLoginMethod('username'); setOtpSent(false); setError(''); }}
              className={`py-3 rounded-xl text-[11px] font-black transition-all ${loginMethod === 'username' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
            >
              שם משתמש
            </button>
            <button 
              onClick={() => { setLoginMethod('phone'); setError(''); }}
              className={`py-3 rounded-xl text-[11px] font-black transition-all ${loginMethod === 'phone' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
            >
              קוד לנייד
            </button>
          </div>

          {loginMethod === 'username' ? (
            <form onSubmit={handleUsernameLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">שם משתמש</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-brand-500/5 transition-all shadow-inner"
                  placeholder="הזן שם משתמש..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">סיסמה</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-brand-500/5 transition-all shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 py-3.5 px-5 rounded-2xl flex items-center gap-3 border border-red-100 animate-fade-in">
                  <ShieldAlert size={16} className="text-red-500" />
                  <p className="text-red-600 text-[11px] font-black uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button type="submit" className="w-full py-5 bg-brand-600 text-white font-black text-sm rounded-[22px] shadow-2xl shadow-brand-600/30 transition-all active:scale-[0.97] uppercase tracking-widest">כניסה למערכת</button>
            </form>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {!otpSent ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">מספר טלפון</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-black tabular-nums outline-none shadow-inner"
                      placeholder="הזן מספר טלפון..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 py-3.5 px-5 rounded-2xl flex items-center gap-3 border border-red-100 animate-fade-in">
                      <ShieldAlert size={16} className="text-red-500" />
                      <p className="text-red-600 text-[11px] font-black uppercase tracking-tight">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSendOtp}
                    disabled={isVerifying || phone.length < 5}
                    className={`w-full py-5 rounded-[22px] font-black text-sm transition-all uppercase tracking-widest ${isVerifying || phone.length < 5 ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30'}`}
                  >
                    {isVerifying ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'שלח קוד אימות'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
                   <div className="text-center bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50">
                      <p className="text-xs font-bold text-slate-600">קוד נשלח ל- <span className="font-black tabular-nums">{phone}</span></p>
                      <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] font-black text-brand-600 uppercase mt-2 underline">החלף מספר</button>
                   </div>
                   <div className="flex justify-center">
                     <input
                       type="text"
                       maxLength={4}
                       value={otpCode}
                       onChange={(e) => setOtpCode(e.target.value)}
                       autoFocus
                       className="w-48 text-center text-5xl font-black tracking-[0.4em] bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 text-brand-600 outline-none focus:border-brand-500 transition-all shadow-inner tabular-nums"
                       placeholder="----"
                     />
                   </div>
                   <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black text-sm rounded-[22px] shadow-2xl shadow-slate-900/30 uppercase tracking-widest">אימות וכניסה</button>
                </form>
              )}
            </div>
          )}
        </div>

        <button 
           onClick={onRegisterClick}
           className="w-full bg-slate-50 border border-slate-200 rounded-[30px] p-6 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between"
        >
           <div className="flex items-center gap-4 text-right">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                 <Building2 size={24}/>
              </div>
              <div>
                 <p className="text-sm font-black text-slate-900">מעוניינים ב-TAT PRO?</p>
                 <p className="text-[10px] font-medium text-slate-400">הגישו בקשה לרישום מוסד חדש</p>
              </div>
           </div>
           <ArrowLeft size={20} className="text-slate-300 group-hover:text-blue-600 transition-all translate-x-2 group-hover:translate-x-0" />
        </button>

        <p className="mt-10 text-center text-slate-300 text-[9px] font-bold uppercase tracking-[0.4em]">Powered by TAT PRO Infrastructure • v1.4.6</p>
      </div>
    </div>
  );
};

export default Login;
