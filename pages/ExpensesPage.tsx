
import React, { useState, useMemo } from 'react';
import { Expense, Donation, Campaign } from '../types';
import { 
  Receipt, Plus, Trash2, Edit2, X, Banknote, TrendingDown, 
  TrendingUp, Activity, Calendar, Tag, Info, AlertCircle, 
  CheckCircle2, ArrowRightLeft, PieChart, Wallet
} from 'lucide-react';

interface ExpensesPageProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  donations: Donation[];
  campaigns: Campaign[];
  activeCampaignId: string;
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({ expenses = [], setExpenses, donations = [], campaigns, activeCampaignId }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    amount: 0, category: 'פרסום', description: '', date: new Date().toISOString().split('T')[0], campaignId: activeCampaignId
  });

  const totalIncome = useMemo(() => donations.reduce((sum, d) => sum + (d.amount || 0), 0), [donations]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const netProfit = totalIncome - totalExpenses;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    if (editingExpense) {
      setExpenses(prev => prev.map(ex => ex.id === editingExpense.id ? { ...ex, ...formData } as Expense : ex));
    } else {
      const newExp: Expense = {
        id: Math.random().toString(36).substr(2, 9),
        amount: Number(formData.amount),
        category: formData.category || 'כללי',
        description: formData.description!,
        date: formData.date || new Date().toISOString(),
        campaignId: activeCampaignId 
      };
      setExpenses(prev => [newExp, ...prev]);
    }
    setShowAddModal(false);
    setEditingExpense(null);
    setFormData({ amount: 0, category: 'פרסום', description: '', date: new Date().toISOString().split('T')[0], campaignId: activeCampaignId });
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({ ...expense });
    setShowAddModal(true);
  };

  return (
    <div className="p-8 animate-fade-in bg-[#f8fafc] min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">ניהול הוצאות <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 font-medium text-sm">מעקב ובקרה אחר עלויות הקמפיין ורווח נקי</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-lg active:scale-95">
          <Plus size={16} /> הוספת הוצאה
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
           <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סה"כ הכנסות (ברוטו)</p>
              <TrendingUp size={20} className="text-emerald-500" />
           </div>
           <p className="text-4xl font-black text-slate-900 tabular-nums mb-1">{(totalIncome || 0).toLocaleString()} ש"ח</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Confirmed Donations</p>
        </div>

        <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
           <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סה"כ הוצאות קמפיין</p>
              <TrendingDown size={20} className="text-red-500" />
           </div>
           <p className="text-4xl font-black text-slate-900 tabular-nums mb-1">{(totalExpenses || 0).toLocaleString()} ש"ח</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Operational Costs</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[35px] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px]"></div>
           <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">סכום נטו (רווח)</p>
              <Activity size={20} className="text-blue-500 animate-pulse" />
           </div>
           <p className="text-4xl font-black text-white tabular-nums mb-1">{(netProfit || 0).toLocaleString()} ש"ח</p>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Net Campaign Revenue</p>
        </div>
      </section>

      <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <Receipt size={22} className="text-slate-400" />
              פירוט הוצאות מלא
           </h3>
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase">כל התקופה</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">תיאור ההוצאה</th>
                <th className="px-8 py-5">קטגוריה</th>
                <th className="px-8 py-5 text-center">תאריך</th>
                <th className="px-8 py-5 text-center">סכום</th>
                <th className="px-8 py-5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold italic">טרם הוזנו הוצאות לקמפיין</td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-900 text-sm">{expense.description}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {expense.id}</p>
                    </td>
                    <td className="px-8 py-5">
                       <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 uppercase">{expense.category}</span>
                    </td>
                    <td className="px-8 py-5 text-center text-xs font-bold text-slate-500 tabular-nums">
                       {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-center font-black text-red-600 text-md tabular-nums">{(expense.amount || 0).toLocaleString()} ש"ח</td>
                    <td className="px-8 py-5 text-center">
                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(expense)} className="p-2 text-slate-300 hover:text-blue-500 transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(expense.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><Receipt size={20} /></div>
                <h2 className="text-xl font-black text-slate-900">{editingExpense ? 'עריכת הוצאה' : 'הזנת הוצאה חדשה'}</h2>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingExpense(null); }} className="p-2 text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">תיאור ההוצאה</label>
                     <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-blue-500/5" placeholder="מהות ההוצאה..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">סכום ההוצאה (ש"ח)</label>
                     <input required type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-xl text-red-600 outline-none focus:ring-4 focus:ring-red-500/5" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">קטגוריה</label>
                     <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none cursor-pointer">
                        <option value="פרסום">📣 פרסום ומיתוג</option>
                        <option value="לוגיסטיקה">📦 לוגיסטיקה</option>
                        <option value="תחבורה">🚗 תחבורה והסעות</option>
                        <option value="מזון">🍕 מזון וכיבוד</option>
                        <option value="טכנולוגיה">💻 טכנולוגיה ותוכנה</option>
                        <option value="פרסים">🎁 פרסים והגרלות</option>
                        <option value="כללי">📁 הוצאות כלליות</option>
                     </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">תאריך הוצאה</label>
                     <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none" />
                  </div>
               </div>
               <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-[22px] shadow-xl active:scale-95 transition-all mt-4">
                  {editingExpense ? 'עדכן הוצאה במערכת' : 'אשר והזן הוצאה'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
