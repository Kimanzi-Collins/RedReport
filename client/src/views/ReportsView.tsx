import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, ShieldAlert, Clock } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function ReportsView() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    // Pull saved reports from local storage
    const saved = JSON.parse(localStorage.getItem('redReport_reports') || '[]');
    // Reverse to show newest first
    setReports(saved.reverse());
  }, []);

  const handleDownload = (report: any) => {
    const printElement = document.createElement('div');
    printElement.innerHTML = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; padding: 40px; line-height: 1.6;">
        <div style="border-bottom: 4px solid #DC2626; padding-bottom: 20px; margin-bottom: 30px; display: flex; align-items: flex-end; justify-content: space-between;">
          <div>
            <h1 style="color: #DC2626; margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">Red<span style="color: #111827;">Report</span></h1>
            <p style="color: #6B7280; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Threat Intelligence Summary</p>
          </div>
          <div style="text-align: right; color: #4B5563; font-size: 11px; font-weight: bold;">
            GENERATED: ${new Date(report.date).toLocaleDateString()}<br/>
            ENGINE: Llama 3.1 70B<br/>
            REF: ${report.id.slice(-6)}
          </div>
        </div>
        <div style="font-size: 14px;">
           ${report.content.replace(/\n/g, '<br/>')}
        </div>
      </div>
    `;

    html2pdf().set({
      margin: 15,
      filename: `RedReport_Archive_${report.id.slice(-6)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(printElement).save();
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
        <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
        <p>No intelligence reports generated yet.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full max-w-7xl mx-auto items-start content-start pt-4">
      {reports.map((report) => (
        <div key={report.id} className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 border border-white dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center transition-colors">
               <FileText className="w-6 h-6"/>
             </div>
             <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
               <Clock className="w-3 h-3" /> {new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
           </div>
           <div>
             <h3 className="font-bold text-black dark:text-white mb-1">{report.title}</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{report.content.substring(0, 100)}...</p>
           </div>
           <button onClick={() => handleDownload(report)} className="w-full py-3 rounded-xl bg-[#F4F7F9] dark:bg-slate-800 text-black dark:text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300">
             <Download className="w-4 h-4"/> Access Secure Dossier
           </button>
        </div>
      ))}
    </motion.div>
  );
}