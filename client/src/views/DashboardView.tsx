import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full pb-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Scans" value="1,248" trend="+12%" icon={<Shield className="w-5 h-5"/>} color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400" />
        <StatCard title="Critical Alerts" value="3" trend="-2" icon={<AlertTriangle className="w-5 h-5"/>} color="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" />
        <StatCard title="Patched Systems" value="98.2%" trend="+4.1%" icon={<CheckCircle className="w-5 h-5"/>} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Threat Velocity" value="Low" trend="Stable" icon={<BarChart3 className="w-5 h-5"/>} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <div className="flex-1 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] transition-colors duration-500">
         <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4 transition-colors duration-500">
           <BarChart3 className="w-6 h-6 text-slate-300 dark:text-slate-600" />
         </div>
         <p className="text-slate-400 dark:text-slate-500 font-medium">Interactive Threat Matrix ready for deployment.</p>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, trend, icon, color }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white dark:border-slate-800 flex flex-col justify-between h-40 cursor-pointer transition-colors duration-500"
    >
       <div className="flex justify-between items-start w-full">
         <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", color)}>{icon}</div>
         <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm transition-colors duration-500">{trend}</span>
       </div>
       <div>
         <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">{title}</h3>
         <span className="text-3xl font-bold text-black dark:text-white transition-colors duration-500">{value}</span>
       </div>
    </motion.div>
  );
}