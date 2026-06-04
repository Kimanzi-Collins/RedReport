import { motion } from 'framer-motion';

export default function TelemetryView() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white dark:border-slate-800 h-full transition-colors duration-500"
    >
      <h2 className="text-xl font-semibold mb-6 text-black dark:text-white">Raw Log Ingestion Stream</h2>
      <div className="w-full h-[calc(100%-4rem)] bg-[#1E1E1E] dark:bg-black/80 rounded-3xl p-6 overflow-hidden relative shadow-inner border border-transparent dark:border-slate-800">
         <div className="absolute top-4 right-4 flex gap-2">
           <div className="w-3 h-3 rounded-full bg-rose-500"></div>
           <div className="w-3 h-3 rounded-full bg-amber-500"></div>
           <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
         </div>
         <pre className="text-emerald-400 font-mono text-sm leading-loose mt-8">
            <span className="text-slate-500">[2026-06-04 14:32:01]</span> JARVIS_SYS_ONLINE<br/>
            <span className="text-slate-500">[2026-06-04 14:32:05]</span> AWAITING_PCAP_OR_SYSLOG_INPUT<br/>
            <span className="text-slate-500">[2026-06-04 14:32:08]</span> LISTENING_ON_PORT_5000...<br/>
         </pre>
      </div>
    </motion.div>
  );
}