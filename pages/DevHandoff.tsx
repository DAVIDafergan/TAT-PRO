
import React, { useState } from 'react';
import { 
  Code, Layout, Database, FileCode, Copy, Check, 
  ExternalLink, Smartphone, Monitor, Palette,
  Globe, ShieldCheck, UserCheck, Building2,
  Users, Heart, CreditCard, ChevronLeft, ChevronRight,
  Info, Server, Link2, Box, Cpu
} from 'lucide-react';

const DevHandoff: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeSchema, setActiveSchema] = useState<'tenants' | 'users' | 'donors' | 'donations'>('tenants');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Adding filament_resource property to each schema object to match expectations in the UI
  const schemas = {
    tenants: {
      title: 'לקוחות (tenants)',
      icon: <Building2 size={20} />,
      desc: 'טבלת האב של המערכת - Multi-tenant structure',
      filament_resource: 'TenantResource',
      json: `{
  "table": "tenants",
  "fields": {
    "id": "uuid / primary",
    "name": "string (Institution Name)",
    "slug": "string (unique)",
    "city": "string",
    "street": "string",
    "house_number": "string",
    "office_phone": "string (nullable)",
    "email": "string (unique)",
    "subscription_type": "enum (demo, paid, yearly, paused)",
    "status": "enum (active, pending, rejected)",
    "settings": "json (clearing_settings, UI_colors)",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "filament_resource": "TenantResource"
}`
    },
    users: {
      title: 'נציגים ומנהלים (users)',
      icon: <Users size={20} />,
      desc: 'כולל את כל משתמשי המערכת עם הרשאות מבוססות תפקיד',
      filament_resource: 'UserResource',
      json: `{
  "table": "users",
  "fields": {
    "id": "bigint / primary",
    "tenant_id": "uuid (Foreign Key -> tenants)",
    "name": "string",
    "email": "string (unique)",
    "phone": "string (unique)",
    "username": "string (unique)",
    "password": "string",
    "role": "enum (SUPER_ADMIN, ADMIN, CAMPAIGN_MANAGER, REPRESENTATIVE, VIEWER)",
    "group_id": "unsignedBigInteger (Foreign Key -> groups, nullable)",
    "campaign_id": "unsignedBigInteger (Foreign Key -> campaigns, nullable)",
    "personal_goal": "decimal (12,2)",
    "total_raised": "decimal (12,2) - Calculated",
    "rank": "string (nullable)",
    "otp_only": "boolean (default: false)",
    "status": "enum (active, inactive)",
    "last_login_at": "timestamp"
  },
  "relationships": {
    "tenant": "belongsTo",
    "group": "belongsTo",
    "donations": "hasMany"
  }
}`
    },
    donors: {
      title: 'תורמים (donors)',
      icon: <Heart size={20} />,
      desc: 'מאגר התורמים של הקמפיין',
      filament_resource: 'DonorResource',
      json: `{
  "table": "donors",
  "fields": {
    "id": "bigint / primary",
    "tenant_id": "uuid (Foreign Key)",
    "campaign_id": "unsignedBigInteger (Foreign Key)",
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "city": "string",
    "street": "string",
    "building": "string",
    "floor": "string",
    "apartment": "string",
    "address_notes": "text (nullable)",
    "preferences": "json (telephonic, visit, purim)",
    "connection_type": "enum (alumnus, parent, staff, student, general)",
    "connection_detail": "string (nullable)",
    "potential_rank": "tinyInteger (1-5)",
    "notes": "text (nullable)",
    "total_donated": "decimal (12,2)",
    "last_visit_at": "timestamp (nullable)"
  },
  "filament_resource": "DonorResource"
}`
    },
    donations: {
      title: 'תרומות (donations)',
      icon: <CreditCard size={20} />,
      desc: 'תיעוד כלל העסקאות והאימותים במערכת',
      filament_resource: 'DonationResource',
      json: `{
  "table": "donations",
  "fields": {
    "id": "bigint / primary",
    "tenant_id": "uuid (Foreign Key)",
    "campaign_id": "unsignedBigInteger (Foreign Key)",
    "donor_id": "unsignedBigInteger (Foreign Key, nullable)",
    "representative_id": "unsignedBigInteger (Foreign Key)",
    "donor_name": "string (cached for speed)",
    "amount": "decimal (12,2)",
    "method": "enum (cash, bit, paybox, online, check, transfer)",
    "status": "enum (confirmed, pending_verification, pending_cash, rejected)",
    "source": "enum (system, charidy, manual_rep)",
    "bit_target_phone": "string (nullable)",
    "reference_number": "string (nullable)",
    "verified_by": "string (nullable - Admin Name)",
    "verified_at": "timestamp (nullable)",
    "external_id": "string (nullable - Charidy UUID)",
    "created_at": "timestamp"
  },
  "filament_resource": "DonationResource"
}`
    }
  };

  return (
    <div className="p-10 lg:p-16 bg-[#F8FAF9] min-h-screen font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-200 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <Cpu size={20} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">FILAMENT <span className="text-blue-600">STRUCTURE</span></h1>
            </div>
            <p className="text-slate-500 font-medium italic">מפרט בסיס נתונים וארכיטקטורה עבור פיתוח Backend ב-Laravel Filament</p>
          </div>
          <div className="text-left space-y-2">
            <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Schema Ready for Migrations</span>
          </div>
        </header>

        {/* Database Schema Explorer */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
               <Database size={24} className="text-blue-500" /> הגדרת טבלאות (Migrations Info)
             </h2>
             <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm overflow-x-auto scroll-hide">
                {(Object.keys(schemas) as Array<keyof typeof schemas>).map(key => (
                  <button 
                    key={key}
                    onClick={() => setActiveSchema(key)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeSchema === key ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {schemas[key].icon}
                    {schemas[key].title}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[40px] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-slate-900 rounded-[35px] overflow-hidden shadow-2xl">
                   <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <div className="flex gap-1.5">
                         <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                         <div className="w-3 h-3 rounded-full bg-amber-500/20"></div>
                         <div className="w-3 h-3 rounded-full bg-emerald-500/20"></div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{activeSchema}_migration.php</span>
                         <button 
                            onClick={() => copyToClipboard(schemas[activeSchema].json, activeSchema)}
                            className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
                         >
                            {copied === activeSchema ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                         </button>
                      </div>
                   </div>
                   <pre className="p-8 text-blue-300 text-[11px] font-mono leading-relaxed overflow-x-auto scroll-hide h-[450px]">
                      {schemas[activeSchema].json}
                   </pre>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm">
                   <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Box size={20} className="text-blue-500" /> דגשים לפילהמנט
                   </h3>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                      {schemas[activeSchema].desc}
                   </p>
                   <ul className="space-y-4">
                      {[
                        { label: 'Resource Name', val: schemas[activeSchema].filament_resource },
                        { label: 'Multitenancy', val: 'Team/Tenant aware' },
                        { label: 'Soft Deletes', val: 'Recommended' }
                      ].map((item, i) => (
                        <li key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                           <span className="text-[11px] font-bold text-blue-600">{item.val}</span>
                        </li>
                      ))}
                   </ul>
                </div>

                <div className="bg-blue-600 rounded-[35px] p-8 text-white shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px]"></div>
                   <h4 className="text-sm font-black mb-2 italic">קשרים לוגיים</h4>
                   <p className="text-xs font-medium text-blue-100 leading-relaxed">
                      ודא שה-`tenant_id` מוגדר כ-Index בכל הטבלאות לצורך ביצועים וסינון מהיר במערכת ה-Multi-tenant.
                   </p>
                </div>
             </div>
          </div>
        </section>

        {/* System Logic Relationships */}
        <section className="space-y-6">
           <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
             <Link2 size={24} className="text-blue-500" /> ארכיטקטורת נתונים (Relationships)
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'אימות (Verification)', desc: 'תרומות במזומן מועברות מ-Pending ל-Confirmed רק לאחר אישור מנהל המעדכן את verified_by.', icon: <ShieldCheck size={20} /> },
                { title: 'קמפיינים (Campaigns)', desc: 'כל המידע מוגדר תחת Campaign Context. מעבר בין קמפיינים משנה את ה-Scope של ה-Queries.', icon: <Server size={20} /> },
                { title: 'שנתונים (Shiurim)', desc: 'הקבוצות משוייכות ל-shnaton. ה-frontend מחשב את ה"שיעור" (א-ד) בצורה דינמית לפי השנה הנוכחית.', icon: <Users size={20} /> },
                { title: 'סנכרון (Sync)', desc: 'תרומות עם source: "charidy" מתעדכנות אוטומטית דרך Webhook/API ומסומנות כמאושרות.', icon: <Globe size={20} /> }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm hover:shadow-md transition-all">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
                   <h4 className="font-black text-slate-900 mb-2">{item.title}</h4>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </section>

        <footer className="text-center py-10 border-t border-slate-200">
           <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">TAT PRO BACKEND INFRASTRUCTURE • FILAMENT COMPATIBLE • v1.5.0</p>
        </footer>
      </div>
    </div>
  );
};

export default DevHandoff;
