import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, ShieldAlert, Clock } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import { fetchReports } from '../services/api';

export default function ReportsView({ username }: { username: string }) {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchReports(username)
      .then(setReports)
      .catch((err) => console.error('Failed to fetch reports:', err));
  }, [username]);

  const handleDownload = async (report: any) => {
    // PDF Rendering logic remains the same
    const splitDelimiter = "**Your PDF is ready Sir.**";
    let reportMarkdown = report.content;
    if (report.content.includes(splitDelimiter)) reportMarkdown = report.content.split(splitDelimiter)[1].trim();
    else if (report.content.includes("Your PDF is ready Sir.")) reportMarkdown = report.content.split("Your PDF is ready Sir.")[1].trim();

    const htmlContent = await marked.parse(reportMarkdown);
    const printElement = document.createElement('div');
    printElement.innerHTML = `
      <style>
        .pdf-content h1, .pdf-content h2, .pdf-content h3 { color: #111827; margin-top: 24px; margin-bottom: 12px; }
        .pdf-content h1 { border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; font-size: 24px; }
        .pdf-content h2 { font-size: 18px; color: #DC2626; }
        .pdf-content p { margin-bottom: 16px; }
        .pdf-content table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .pdf-content th, .pdf-content td { border: 1px solid #E5E7EB; padding: 12px; text-align: left; }
        .pdf-content th { background-color: #F9FAFB; font-weight: bold; color: #374151; }
        .pdf-content tr:nth-child(even) { background-color: #F9FAFB; }
        .pdf-content blockquote { border-left: 4px solid #DC2626; padding: 12px 16px; color: #111827; background: #F3F4F6; margin: 20px 0; font-weight: bold;}
        .pdf-content ul, .pdf-content ol { margin-bottom: 16px; padding-left: 24px; }
        .pdf-content li { margin-bottom: 6px; }
        .pdf-content code { background-color: #F3F4F6; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #DC2626; font-weight: bold; }
      </style>
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; padding: 40px; line-height: 1.6;">
        <div style="border-bottom: 4px solid #DC2626; padding-bottom: 20px; margin-bottom: 30px; display: flex; align-items: flex-end; justify-content: space-between;">
          <div>
            <h1 style="color: #DC2626; margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">Red<span style="color: #111827;">Report</span></h1>
            <p style="color: #111827; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Threat Intelligence Summary</p>
          </div>
          <div style="text-align: right; color: #111827; font-size: 11px; font-weight: bold;">
            GENERATED: ${new Date(report.date).toLocaleDateString()}<br/>
            REF: ${report.id.slice(-6)}
          </div>
        </div>
        <div class="pdf-content" style="font-size: 14px;">
           ${htmlContent}
        </div>
      </div>
    `;

    html2pdf().set({
      margin: 15, filename: `RedReport_Archive_${report.id.slice(-6)}.pdf`, image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(printElement).save();
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
        <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-bold">No intelligence reports generated yet.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full max-w-7xl mx-auto items-start content-start pt-4">
      {reports.map((report) => (
        <div key={report.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-red-600 dark:hover:border-red-500 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-800/50 shadow-sm">
               <FileText className="w-6 h-6"/>
             </div>
             <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
               <Clock className="w-3 h-3" /> {new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
           </div>
           <div>
             <h3 className="font-black text-black dark:text-white mb-1">{report.title}</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 font-medium">Threat intel and mitigation parameters successfully archived.</p>
           </div>
           <button onClick={() => handleDownload(report)} className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white transition-colors duration-300 shadow-md">
             <Download className="w-4 h-4"/> Access Secure Dossier
           </button>
        </div>
      ))}
    </motion.div>
  );
}