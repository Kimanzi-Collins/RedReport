import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Clock, ShieldCheck, Activity, Target, Loader2, TerminalSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeLogs } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TelemetryView() {
  const [events, setEvents] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsLoading(true);
    setEvents([]);
    setRawLogs('');
    
    const filesArray = Array.from(e.target.files);

    // 1. Read files locally to display in the Mac Terminal
    let combinedText = '';
    for (const file of filesArray) {
      const text = await file.text();
      combinedText += `\n--- Reading ${file.name} ---\n${text}\n`;
    }
    setRawLogs(combinedText);
    
    // 2. Send to backend for Timeline parsing
    try {
      const response = await analyzeLogs('timeline', filesArray, 'gemini', 'Extract chronological timeline');
      
      if (response.data && Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        alert("Engine failed to construct a valid chronological timeline.");
      }
    } catch (error) {
      console.error("Telemetry mapping failed:", error);
      setRawLogs(prev => prev + "\n\n[ERROR] Connection to intelligence engine severed.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-rose-500 text-white shadow-rose-500/40';
      case 'high': return 'bg-orange-500 text-white shadow-orange-500/40';
      case 'medium': return 'bg-yellow-500 text-white shadow-yellow-500/40';
      default: return 'bg-cyan-500 text-white shadow-cyan-500/40';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full max-w-6xl mx-auto w-full pb-12 pt-4 gap-6">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-500" /> Forensics Telemetry
          </h2>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isLoading}
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          Ingest Telemetry
        </button>
      </div>

      {/* MacOS Terminal Window */}
      <div className="w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-700/50 bg-[#1C1C1E] shrink-0 flex flex-col h-[350px]">
        
        {/* Traffic Light Header */}
        <div className="h-10 bg-[#2D2D2F] flex items-center px-4 relative shrink-0">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold text-slate-300 font-sans tracking-wide flex items-center gap-2">
              <TerminalSquare className="w-3.5 h-3.5" /> root@jarvis: ~ /var/log/telemetry
            </span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-5 font-mono text-sm text-[#00FF41] flex-1 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
          {!rawLogs && !isLoading ? (
            <div className="opacity-70">
              <span className="text-slate-400">Last login: {new Date().toUTCString()} on ttys001</span><br/><br/>
              Jarvis-Sec-Terminal:~ root# waiting for syslog ingestion...<br/>
              <span className="animate-pulse">_</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 {rawLogs}
                 {isLoading && <span className="animate-pulse ml-1 text-emerald-300">_</span>}
               </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Visual Timeline Render Area */}
      <div className="flex-1 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-cyan-600 dark:text-cyan-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-mono text-sm tracking-widest uppercase">Correlating Time Signatures...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <Clock className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-medium">No active timeline data</h3>
            <p className="text-sm">Upload syslogs above to generate the visual blast radius.</p>
          </div>
        ) : (
          <div className="relative pl-6 md:pl-8 border-l-2 border-slate-200 dark:border-slate-700 space-y-10 py-4">
            <AnimatePresence>
              {events.map((evt, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className={cn("absolute -left-[35px] md:-left-[43px] w-5 h-5 rounded-full shadow-lg border-[3px] border-white dark:border-slate-900", getSeverityColor(evt.severity))} />
                  
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 ml-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap gap-4 justify-between items-start mb-3">
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white">{evt.event}</h4>
                      <span className="font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-md text-slate-500 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {evt.timestamp}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{evt.details}</p>
                    
                    <div className="flex flex-wrap gap-3 mt-2">
                      {evt.sourceIp && evt.sourceIp !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-800/50">
                          <Target className="w-3 h-3" /> Source: {evt.sourceIp}
                        </div>
                      )}
                      {evt.targetIp && evt.targetIp !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                          <ShieldCheck className="w-3 h-3" /> Target: {evt.targetIp}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}