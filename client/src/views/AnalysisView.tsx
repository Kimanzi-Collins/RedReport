import { motion } from 'framer-motion';
import { Database, Activity, Plus, Send, Share2, Map } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AnalysisView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center w-full max-w-5xl mx-auto h-full gap-8 pb-12"
    >
      {/* Top: Resolution Pipeline */}
      <div className="w-full bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white dark:border-slate-800 flex flex-col shrink-0 transition-colors duration-500">
         <div className="flex justify-between items-center mb-8">
           <h2 className="text-xl font-semibold text-black dark:text-white">Resolution Pipeline</h2>
           <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
             <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
           </button>
         </div>
         <div className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full">
            <TaskNode title="Identify Threat Vector" status="done" user="CK" />
            <TaskNode title="Isolate Subnet" status="active" />
            <TaskNode title="MITRE Mapping" status="pending" />
            <div className="flex-1 max-w-[200px] w-full">
              <div className="bg-black dark:bg-white text-white dark:text-black p-6 rounded-[2rem] shadow-xl transform transition-transform hover:-translate-y-2 cursor-pointer border border-slate-800 dark:border-white flex flex-col items-center text-center">
                <Map className="w-6 h-6 text-cyan-400 dark:text-cyan-600 mb-3" />
                <h3 className="text-sm font-medium mb-1">Finalize Report</h3>
              </div>
            </div>
         </div>
      </div>

      {/* Bottom Center: Execution Engine */}
      <div className="w-full max-w-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white dark:border-slate-800 flex flex-col mt-auto transition-colors duration-500">
        <h2 className="text-lg font-semibold mb-6 text-black dark:text-white text-center">Execution Engine</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <WorkflowCard title="Upload Logs" desc="Nmap/Metasploit" icon={<Database className="w-5 h-5"/>} isActive />
          <WorkflowCard title="Context Processing" desc="Claude 3.5 Pipeline" icon={<Activity className="w-5 h-5"/>} />
        </div>

        <div className="bg-[#F4F7F9] dark:bg-slate-950/50 rounded-3xl p-5 border border-white dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-md transition-all duration-300">
          <textarea 
            placeholder="Direct Jarvis to initiate a protocol or analyze a log..." 
            className="w-full h-16 resize-none outline-none text-base text-slate-800 dark:text-slate-200 bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-600" 
          />
          <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-200 dark:border-slate-800">
             <button className="p-2 text-slate-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
               <Plus className="w-5 h-5" />
             </button>
             <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-sm font-medium flex items-center gap-2 hover:scale-105 transition-transform shadow-lg">
               Execute <Send className="w-4 h-4 ml-1" />
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function WorkflowCard({ title, desc, icon, isActive = false }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }} 
      className={cn(
        "flex-1 p-4 rounded-3xl flex items-center gap-4 transition-all duration-300 cursor-pointer border",
        isActive ? "bg-white dark:bg-slate-800 shadow-sm border-white dark:border-slate-700" : "bg-transparent border-slate-200 dark:border-slate-800 hover:bg-white/40 dark:hover:bg-slate-800/40"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
        isActive ? "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400" : "bg-white dark:bg-slate-800 text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700"
      )}>
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
    </motion.div>
  );
}

function TaskNode({ title, status, user }: any) {
  return (
    <div className={cn(
      "flex-1 p-5 rounded-[2rem] border transition-all duration-300 flex flex-col items-center text-center gap-3 w-full",
      status === 'active' ? "bg-white dark:bg-slate-800 border-white dark:border-slate-700 shadow-md ring-1 ring-black/5 dark:ring-white/5" : "bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-slate-700/40",
      status === 'pending' && "opacity-50 bg-transparent border-dashed border-slate-300 dark:border-slate-700 shadow-none"
    )}>
      <div className="w-full flex justify-between items-start">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">{status}</p>
        {user ? (
          <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-[10px] font-bold text-cyan-700 dark:text-cyan-400 border border-white dark:border-slate-800 shadow-sm">
            {user}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700" />
        )}
      </div>
      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</h4>
    </div>
  );
}