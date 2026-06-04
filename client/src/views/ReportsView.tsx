import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';

export default function ReportsView() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "circOut" }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full max-w-7xl mx-auto"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 border border-white dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-300 cursor-pointer h-64">
           <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-500">
             <FileText className="w-6 h-6"/>
           </div>
           <div>
             <h3 className="font-semibold text-black dark:text-white mb-1 transition-colors duration-500">Executive Summary_v{i}.pdf</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 transition-colors duration-500">Generated via Claude 3.5 Sonnet</p>
           </div>
           <button className="w-full py-3 rounded-xl bg-[#F4F7F9] dark:bg-slate-800 text-black dark:text-white font-medium text-sm flex items-center justify-center gap-2 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-300">
             <Download className="w-4 h-4"/> Download Artifact
           </button>
        </div>
      ))}
    </motion.div>
  );
}