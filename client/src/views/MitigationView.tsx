import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Server, UploadCloud, Loader2, Play, Shield, TerminalSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeLogs } from '../services/api';

export default function MitigationView() {
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsLoading(true);
    setBlueprint(null);
    
    try {
      const filesArray = Array.from(e.target.files);
      // Calls blueprint endpoint to generate Terraform/Ansible code
      const response = await analyzeLogs('blueprint', filesArray, 'gemini', 'Generate a secure infrastructure blueprint (Terraform/Ansible) to patch vulnerabilities found in these logs.');
      
      setBlueprint(response.reportContent || "Error: Engine returned empty blueprint.");
    } catch (error) {
      console.error("Blueprint generation failed:", error);
      alert("Failed to generate mitigation blueprint.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full max-w-6xl mx-auto w-full pb-12 pt-4">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Server className="w-6 h-6 text-indigo-500" /> Defensive Orchestration
          </h2>
          <p className="text-sm text-slate-500 mt-1">Generate deployable Terraform/Ansible scripts to harden infrastructure.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isLoading}
            className="bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Upload Vuln Logs
          </button>
          {blueprint && (
            <button className="bg-[#0ea5e9] text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30">
              <Play className="w-4 h-4" /> Deploy Script
            </button>
          )}
        </div>
      </div>

      {/* Blueprint Editor Area */}
      <div className="flex-1 bg-[#1E293B] rounded-[2rem] p-6 shadow-2xl border border-slate-700 overflow-hidden flex flex-col relative">
        <div className="flex items-center gap-2 mb-4 px-2 pb-4 border-b border-slate-600/50 text-slate-400">
           <TerminalSquare className="w-5 h-5 text-emerald-400" />
           <span className="font-mono text-xs uppercase tracking-widest">Main.tf / Playbook.yml</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-sm px-2 text-slate-300">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-emerald-500">
                <Code2 className="w-12 h-12 mb-4 animate-pulse" />
                <p className="tracking-widest">COMPILING DEFENSIVE BLUEPRINT...</p>
              </motion.div>
            ) : !blueprint ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full opacity-30 text-center">
                <Shield className="w-16 h-16 mb-4" />
                <h3 className="text-lg">Infrastructure Secure</h3>
                <p className="text-xs max-w-xs mt-2">Upload vulnerability profiles or penetration logs to automatically generate IaC patching scripts.</p>
              </motion.div>
            ) : (
              <motion.div key="blueprint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-invert prose-emerald max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl">
                <ReactMarkdown>{blueprint}</ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}