import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Video, Sparkles, Wand2, Loader2, Download, Play, Info, AlertCircle, Monitor, Smartphone } from 'lucide-react';

const Studio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setError(null);
    setVideoUrl(null);

    // Check for API Key
    // Note: window.aistudio and process.env.API_KEY are provided by the environment
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
      // Proceed assuming key selection was triggered
    }

    setIsGenerating(true);
    setStatus('יוזם חיבור למנוע Veo 3.1...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt + ". Cinematic high-end simulation, professional lighting, 4k detail.",
        config: {
          numberOfVideos: 1,
          resolution,
          aspectRatio
        }
      });

      setStatus('ה-AI מתחיל לצייר את הפריימים... זה עשוי לקחת כדקה');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setStatus('מעבד נתונים... המתינו, הקסם קורה ברקע ✨');
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatus('הסרטון מוכן! מוריד נתונים...');
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setIsGenerating(false);
        setStatus('');
      } else {
        throw new Error('לא התקבל קישור לסרטון');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("מפתח ה-API לא נמצא או לא הוגדר כראוי ב-GCP. אנא בחר מפתח מפרויקט בתשלום.");
        await (window as any).aistudio.openSelectKey();
      } else {
        setError(err.message || 'אירעה שגיאה בייצור הסרטון');
      }
      setIsGenerating(false);
      setStatus('');
    }
  };

  const suggestions = [
    "סרטון תדמית: חדר מצב טכנולוגי עם גרפים כחולים של TAT PRO, אנשים חוגגים הצלחה.",
    "הדמיה קולנועית: נציג שטח משתמש באפליקציה בערב ירושלמי קריר, אורות העיר ברקע.",
    "פתיח מרשים: לוגו תלת מימדי של TAT PRO נוצר מתוך חלקיקים של אור וזהב.",
    "אווירת ניצחון: מסכי ענק מראים את יעד הגיוס מושג, זיקוקים דיגיטליים על המסך."
  ];

  return (
    <div className="p-10 lg:p-14 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic">
            AI <span className="text-brand-600 font-medium">Studio</span>
          </h1>
          <p className="text-slate-400 font-semibold text-[11px] tracking-widest uppercase">
            יצירת סרטוני הדמיה ותדמית באמצעות מנוע ה-Veo של Gemini
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-sm">
          <Video size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="f-card p-8 bg-slate-900 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 blur-[60px]"></div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">תאר את הסצנה להדמיה</label>
             <textarea 
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="למשל: סרטון תדמית יוקרתי המציג את חדר הפיקוד של TAT PRO ברגע השיא של הקמפיין..."
               className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium text-white outline-none focus:border-brand-500 transition-all resize-none"
             />
             
             <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">יחס גובה-רוחב</p>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setAspectRatio('16:9')}
                        className={`flex-1 py-3 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${aspectRatio === '16:9' ? 'bg-brand-600 border-brand-600' : 'bg-white/5 border-white/10 text-slate-400'}`}
                      >
                         <Monitor size={14} /> 16:9
                      </button>
                      <button 
                        onClick={() => setAspectRatio('9:16')}
                        className={`flex-1 py-3 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${aspectRatio === '9:16' ? 'bg-brand-600 border-brand-600' : 'bg-white/5 border-white/10 text-slate-400'}`}
                      >
                         <Smartphone size={14} /> 9:16
                      </button>
                   </div>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">רזולוציה</p>
                   <select 
                     value={resolution}
                     onChange={(e) => setResolution(e.target.value as any)}
                     className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white outline-none"
                   >
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p Full HD</option>
                   </select>
                </div>
             </div>

             <button 
               onClick={handleGenerate}
               disabled={isGenerating || !prompt}
               className={`w-full mt-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isGenerating || !prompt ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/20'}`}
             >
               {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
               {isGenerating ? 'מייצר וידאו...' : 'צור וידאו עכשיו'}
             </button>
          </div>

          <div className="f-card p-10 bg-white border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
             {videoUrl ? (
               <div className="w-full space-y-6">
                  <div className="relative rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 aspect-video bg-black">
                     <video src={videoUrl} controls autoPlay className="w-full h-full" />
                  </div>
                  <div className="flex gap-4">
                     <a 
                       href={videoUrl} 
                       download="tat-pro-simulation.mp4"
                       className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                     >
                        <Download size={16} /> הורד סרטון
                     </a>
                  </div>
               </div>
             ) : isGenerating ? (
               <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center">
                     <Loader2 size={32} className="text-brand-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{status}</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-[280px]">הבינה המלאכותית מעבדת את הבקשה שלך. זהו תהליך מורכב שלוקח זמן, תודה על הסבלנות.</p>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                     <Play size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-400">הסרטון שלך יופיע כאן</h3>
                    <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-2">Waiting for prompt generation</p>
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="f-card p-8 bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <Sparkles size={16} className="text-brand-600" />
                 הצעות ל-Prompts
              </h3>
              <div className="space-y-4">
                 {suggestions.map((s, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setPrompt(s)}
                     className="w-full text-right p-4 bg-white border border-slate-100 rounded-xl text-[11px] font-medium text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-all"
                   >
                     {s}
                   </button>
                 ))}
              </div>
           </div>

           <div className="f-card p-8 bg-brand-50 border border-brand-100 space-y-4">
              <h3 className="font-bold text-brand-900 flex items-center gap-2">
                 <Info size={16} />
                 חשוב לדעת
              </h3>
              <ul className="space-y-3">
                 <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
                    <p className="text-[11px] font-medium text-brand-800 leading-relaxed">הפקת וידאו צורכת משאבי מחשוב רבים (Gemini API Credits).</p>
                 </li>
                 <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
                    <p className="text-[11px] font-medium text-brand-800 leading-relaxed">זמן יצירה ממוצע: 60-120 שניות.</p>
                 </li>
                 <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
                    <p className="text-[11px] font-medium text-brand-800 leading-relaxed">ניתן ליצור סרטונים בפורמט אנכי (9:16) המתאימים לרשתות חברתיות.</p>
                 </li>
              </ul>
           </div>

           {error && (
             <div className="f-card p-6 bg-red-50 border border-red-100 flex gap-4">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-[11px] font-bold text-red-700 leading-relaxed">{error}</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Studio;