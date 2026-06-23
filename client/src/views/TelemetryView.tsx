import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Clock, ShieldCheck, Activity, Target, Loader2, TerminalSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeLogsStream } from '../services/api';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function TelemetryView({ state, setState }: any) {
  const { events, rawLogs, isLoading } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setState({ ...state, isLoading: true, events: [], rawLogs: '' });
    
    const filesArray = Array.from(e.target.files);
    let combinedText = '';
    for (const file of filesArray) {
      const text = await file.text();
      combinedText += `\n--- Reading ${file.name} ---\n${text}\n`;
    }
    setState((prev: any) => ({ ...prev, rawLogs: combinedText }));
    
    try {
      const stream = analyzeLogsStream('timeline', filesArray, 'nvidia', 'Extract chronological timeline');
      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
      }
      const cleanJsonString = fullContent.replace(/```json|```/g, '').trim();
      const timelineData = JSON.parse(cleanJsonString);
      if (Array.isArray(timelineData)) {
         setState((prev: any) => ({ ...prev, events: timelineData }));
      } else {
         alert("Engine failed to construct a valid chronological timeline.");
      }
    } catch (error) {
      setState((prev: any) => ({ ...prev, rawLogs: prev.rawLogs + "\n\n[ERROR] Connection to intelligence engine severed." }));
    } finally {
      setState((prev: any) => ({ ...prev, isLoading: false }));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-600 border-white shadow-red-600/50';
      case 'high': return 'bg-red-500 border-white shadow-red-500/50';
      case 'medium': return 'bg-slate-800 border-slate-400 shadow-slate-800/50';
      default: return 'bg-black border-slate-600 shadow-black/50';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col max-w-6xl mx-auto w-full pb-12 pt-4 gap-6">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-3">
          <Activity className="w-6 h-6 text-red-600" /> Forensics Telemetry
        </h2>
        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 shadow-md">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <UploadCloud className="w-4 h-4" />} Ingest Telemetry
        </button>
      </div>

      <div className="w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-800 bg-[#0A0A0A] shrink-0 flex flex-col h-[280px]">
        <div className="h-10 bg-[#1A1A1A] flex items-center px-4 relative shrink-0 border-b border-slate-800">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-slate-400 font-sans tracking-wide flex items-center gap-2">
              <TerminalSquare className="w-3.5 h-3.5 text-red-600" /> root@jarvis: ~ /var/log/telemetry
            </span>
          </div>
        </div>
        <div className="p-5 font-mono text-sm text-slate-200 flex-1 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
          {!rawLogs && !isLoading ? (
            <div className="opacity-70 text-slate-500">
              Last login: {new Date().toUTCString()} on ttys001<br/><br/>
              Jarvis-Sec-Terminal:~ root# waiting for syslog ingestion...<br/>
              <span className="animate-pulse text-red-500">_</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 {rawLogs}
                 {isLoading && <span className="animate-pulse ml-1 text-red-600 font-black">_</span>}
               </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-mono text-sm font-bold tracking-widest uppercase text-black dark:text-white">Correlating Signatures...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
            <Clock className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-black dark:text-white">No active timeline data</h3>
            <p className="text-sm font-medium">Upload syslogs above to generate the visual blast radius.</p>
          </div>
        ) : (
          <div className="relative pl-6 md:pl-8 border-l-2 border-slate-200 dark:border-slate-700 space-y-10 py-4">
            <AnimatePresence>
              {events.map((evt, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="relative">
                  <div className={cn("absolute -left-[35px] md:-left-[43px] w-5 h-5 rounded-full shadow-lg border-[3px] dark:border-slate-900", getSeverityColor(evt.severity))} />
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 ml-4 hover:border-red-600 dark:hover:border-red-500 transition-colors">
                    <div className="flex flex-wrap gap-4 justify-between items-start mb-3">
                      <h4 className="font-bold text-lg text-black dark:text-white">{evt.event}</h4>
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-md text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {evt.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium">{evt.details}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {evt.sourceIp && evt.sourceIp !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50">
                          <Target className="w-3 h-3" /> Source: {evt.sourceIp}
                        </div>
                      )}
                      {evt.targetIp && evt.targetIp !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700">
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