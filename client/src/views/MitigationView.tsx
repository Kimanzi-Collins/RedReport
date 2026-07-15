import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Server, UploadCloud, Loader2, Play, Shield, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeLogsStream, postHistoryMessage } from '../services/api';

export default function MitigationView({ state, setState, username }: any) {
  const { blueprint, isLoading } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setState({ ...state, isLoading: true, blueprint: '' });

    const filesArray = Array.from(e.target.files);
    const fileNames = filesArray.map((f) => f.name);
    const instruction = 'Generate a secure infrastructure blueprint (Terraform/Ansible) to patch vulnerabilities found in these logs.';
    const clientId = Date.now().toString();

    try {
      const stream = analyzeLogsStream('blueprint', filesArray, 'claude', instruction, undefined, username);

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setState((prev: any) => ({ ...prev, blueprint: fullContent }));
      }

      postHistoryMessage({ username, section: 'mitigation', role: 'user', content: instruction, files: fileNames, clientId: `${clientId}-u` }).catch(console.error);
      postHistoryMessage({ username, section: 'mitigation', role: 'jarvis', content: fullContent, clientId: `${clientId}-j` }).catch(console.error);
    } catch (error) {
      console.error("Blueprint generation failed:", error);
      alert("Failed to generate mitigation blueprint.");
      setState((prev: any) => ({ ...prev, blueprint: "Error: Connection severed." }));
    } finally {
      setState((prev: any) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col h-full max-w-6xl mx-auto w-full pb-12 pt-4 gap-6">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 text-center md:text-left">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-black dark:text-white flex items-center justify-center md:justify-start gap-3 tracking-tight">
            <Server className="w-6 h-6 text-red-600 shrink-0" /> Defensive Orchestration
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 md:mt-1 font-medium">Generate deployable Terraform/Ansible scripts to harden infrastructure.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isLoading}
            className="w-full md:w-auto justify-center bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-700 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:border-red-600 dark:hover:border-red-500 transition-colors disabled:opacity-50 shadow-sm shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <UploadCloud className="w-4 h-4 text-red-600" />}
            Upload Vuln Logs
          </button>
          {blueprint && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full md:w-auto justify-center bg-red-600 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" /> Deploy Blueprint
            </motion.button>
          )}
        </div>
      </div>

      {/* Blueprint Editor Area */}
      <div className="flex-1 bg-[#0A0A0A] dark:bg-black rounded-[2rem] p-4 md:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative group transition-colors hover:border-red-900/50">
        
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-4 px-2 pb-4 border-b border-slate-800 text-slate-400">
           <Terminal className="w-5 h-5 text-red-600" />
           <span className="font-mono text-xs font-bold text-white tracking-widest">Main.tf / Playbook.yml</span>
        </div>

        {/* Code Output Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-sm px-2 text-slate-300">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-red-600">
                <Code2 className="w-12 h-12 mb-4 animate-pulse" />
                <p className="tracking-widest font-bold">COMPILING DEFENSIVE BLUEPRINT...</p>
              </motion.div>
            ) : !blueprint ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full opacity-40 text-center">
                <Shield className="w-16 h-16 mb-4 text-white" />
                <h3 className="text-lg font-bold text-white">Infrastructure Secure</h3>
                <p className="text-xs max-w-xs mt-2 text-slate-400">Upload vulnerability profiles or penetration logs to automatically generate IaC patching scripts.</p>
              </motion.div>
            ) : (
              <motion.div key="blueprint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-invert max-w-none prose-a:text-red-500 prose-headings:text-white prose-pre:bg-[#111111] prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl">
                <ReactMarkdown>{blueprint}</ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}