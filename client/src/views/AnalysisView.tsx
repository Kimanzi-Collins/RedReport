import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Send, Loader2, Download, Shield, User, X, FileTerminal, Network, Code2, Database } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import { analyzeLogs } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const loadingPhrases = [
  "Bypassing ICE protocols...",
  "Correlating event timestamps...",
  "Mapping MITRE ATT&CK vectors...",
  "Forging defensive blueprints...",
  "Running heuristic analysis..."
];

const nudges = [
  { id: 1, title: "Analyze Attack Vector", desc: "Map the blast radius of an active threat.", icon: FileTerminal, prompt: "I have a Metasploit log. Guide me through analyzing the primary attack vector.", color: "from-red-600 to-red-900" },
  { id: 2, title: "Defensive Blueprint", desc: "Generate infrastructure patching rules.", icon: Network, prompt: "Generate a defensive Terraform blueprint to lock down my external SSH ports.", color: "from-slate-800 to-black" },
  { id: 3, title: "Zero-Day Explanation", desc: "Understand complex exploits step-by-step.", icon: Code2, prompt: "Act as my cyber mentor. Explain how a buffer overflow attack works step-by-step.", color: "from-red-500 to-red-800" }
];

export default function AnalysisView({ state, setState }: any) {
  const { selectedFiles, promptText, isExecuting, chatHistory } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [reportType, setReportType] = useState<'executive'|'investor'>('executive');

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [chatHistory, isExecuting]);

  useEffect(() => {
    if (isExecuting) {
      const interval = setInterval(() => setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length), 2500);
      return () => clearInterval(interval);
    }
  }, [isExecuting]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setState({ ...state, selectedFiles: [...state.selectedFiles, ...Array.from(e.target.files)] });
    }
  };

  const removeFile = (indexToRemove: number) => {
    setState({ ...state, selectedFiles: state.selectedFiles.filter((_: any, i: number) => i !== indexToRemove) });
  };

  const executeAction = async (forcedPrompt?: string) => {
    const finalPrompt = forcedPrompt || promptText;
    if (!finalPrompt.trim() && selectedFiles.length === 0) return;

    const filesToSend = [...selectedFiles];
    const fileNames = filesToSend.map(f => f.name);

    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: finalPrompt,
      files: fileNames
    };
    
    const conversationContext = chatHistory.map((m: any) => `${m.role === 'jarvis' ? 'Assistant' : 'User'}: ${m.content}`).join('\n');
    const enrichedPrompt = chatHistory.length > 0 
      ? `Previous conversation context:\n${conversationContext}\n\nUser's new input:\n${finalPrompt}` 
      : finalPrompt;

    setState((prev: any) => ({ 
      ...prev, 
      chatHistory: [...prev.chatHistory, userMessage], 
      promptText: '', 
      isExecuting: true,
      selectedFiles: [] 
    }));

    try {
      const data = await analyzeLogs('report', filesToSend, 'gemini', enrichedPrompt, reportType);
      const rawContent = data.reportContent || JSON.stringify(data.data, null, 2);
      const jarvisMessage = { id: (Date.now() + 1).toString(), role: 'jarvis', content: rawContent };

      const existingReports = JSON.parse(localStorage.getItem('redReport_reports') || '[]');
      existingReports.push({ id: jarvisMessage.id, date: new Date().toISOString(), title: `Threat Intel: ${new Date().toLocaleTimeString()}`, content: jarvisMessage.content });
      localStorage.setItem('redReport_reports', JSON.stringify(existingReports));

      setState((prev: any) => ({ ...prev, chatHistory: [...prev.chatHistory, jarvisMessage], isExecuting: false }));
    } catch (error) {
      setState((prev: any) => ({ ...prev, isExecuting: false, chatHistory: [...prev.chatHistory, { id: Date.now().toString(), role: 'jarvis', content: "⚠️ **System Error:** Connection severed." }] }));
    }
  };

  const handleFinalizeReport = async (messageContent: string, messageId: string) => {
    const splitDelimiter = "**Your PDF is ready Sir.**";
    let reportMarkdown = messageContent;
    
    if (messageContent.includes(splitDelimiter)) {
        reportMarkdown = messageContent.split(splitDelimiter)[1].trim();
    } else if (messageContent.includes("Your PDF is ready Sir.")) {
        reportMarkdown = messageContent.split("Your PDF is ready Sir.")[1].trim();
    }

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
            <p style="color: #6B7280; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Threat Intelligence Summary</p>
          </div>
          <div style="text-align: right; color: #4B5563; font-size: 11px; font-weight: bold;">
            GENERATED: ${new Date().toLocaleDateString()}<br/>
            REF: ${messageId.slice(-6)}
          </div>
        </div>
        <div class="pdf-content" style="font-size: 14px;">
           ${htmlContent}
        </div>
      </div>
    `;

    html2pdf().set({
      margin: 15,
      filename: `RedReport_Intel_${messageId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(printElement).save();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full max-w-5xl mx-auto h-full gap-6 pb-4">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Chat History Interface */}
      <div className="flex-1 overflow-y-auto w-full rounded-[2rem] p-4 space-y-6 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-10">
             <Shield className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
             <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight">Jarvis Intelligence Engine</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 text-center max-w-md font-medium">How can I assist your operations today? Upload telemetry or select a quick action below.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
                {nudges.map((nudge) => (
                  <motion.div 
                    key={nudge.id} 
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => executeAction(nudge.prompt)}
                    className="relative rounded-3xl overflow-hidden cursor-pointer shadow-lg group border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div className={cn("h-24 w-full bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity duration-500", nudge.color)} />
                    <div className="p-5 relative bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2 mb-2">
                         <nudge.icon className="w-4 h-4 text-red-600 dark:text-red-500" />
                         <h4 className="font-bold text-sm text-black dark:text-white">{nudge.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{nudge.desc}</p>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        ) : (
          chatHistory.map((msg: any) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("flex w-full gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
              {msg.role === 'jarvis' && (
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-md mt-2 border border-red-500">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div className={cn("rounded-[2rem] p-6 shadow-sm", msg.role === 'user' ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200" : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200")}>
                  
                  {msg.role === 'user' && msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.files.map((fileName: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200 dark:border-red-800/50">
                          <Database className="w-3 h-3" /> {fileName}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-a:text-red-600 prose-headings:text-black dark:prose-headings:text-white">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {msg.role === 'jarvis' && msg.content.includes("Your PDF is ready") && (
                  <button onClick={() => handleFinalizeReport(msg.content, msg.id)} className="self-start flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors ml-4 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Download className="w-3 h-3" /> Exfiltrate Intel Payload
                  </button>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-black dark:bg-slate-800 flex items-center justify-center shrink-0 border-2 border-slate-800 dark:border-slate-700 shadow-sm mt-2">
                  <User className="w-5 h-5 text-white dark:text-slate-300" />
                </div>
              )}
            </motion.div>
          ))
        )}

        {isExecuting && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full gap-4 justify-start">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-md mt-2 border border-red-500">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="rounded-[2rem] p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 flex items-center gap-3">
               <span className="text-sm font-mono text-red-600 dark:text-red-500 font-bold">{loadingPhrases[phraseIndex]}</span>
               <span className="flex gap-1"><span className="animate-bounce text-red-600">.</span><span className="animate-bounce delay-75 text-red-600">.</span><span className="animate-bounce delay-150 text-red-600">.</span></span>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="w-full shrink-0 flex flex-col gap-2 relative z-20">
        <div className="flex justify-between items-end px-2">
          
          {selectedFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file: File, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 dark:border-red-800 shadow-sm">
                  <Database className="w-3 h-3" /> {file.name}
                  <button onClick={() => removeFile(idx)} className="hover:text-black dark:hover:text-white transition-colors"><X className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          ) : <div />}

          {selectedFiles.length > 0 && (
            <div className="flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
               <button onClick={() => setReportType('executive')} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", reportType === 'executive' ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:text-black dark:hover:text-white")}>
                 Executive Intel
               </button>
               <button onClick={() => setReportType('investor')} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", reportType === 'investor' ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:text-black dark:hover:text-white")}>
                 Investor Brief
               </button>
            </div>
          )}
        </div>

        {/* The Red/Black Glowing Execution Border */}
        <div className={cn("relative rounded-[2rem] p-[2px] transition-all duration-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm border border-slate-200 dark:border-slate-800", isExecuting ? "bg-gradient-to-r from-red-600 via-black to-red-600 dark:via-white bg-[length:200%_auto] animate-[pulse_2s_ease-in-out_infinite] border-transparent" : "")}>
          <div className="flex items-end gap-3 p-2 bg-white dark:bg-slate-950 rounded-[calc(2rem-2px)]">
            <button onClick={handleUploadClick} className="p-3 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 shrink-0">
              <Plus className="w-5 h-5" />
            </button>
            <textarea 
              value={promptText}
              onChange={(e) => setState({ ...state, promptText: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); executeAction(); } }}
              placeholder="Message Jarvis or drop telemetry files..." 
              className="flex-1 max-h-32 min-h-[44px] py-3 resize-none outline-none text-sm text-slate-800 dark:text-slate-200 bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 custom-scrollbar font-medium" 
              disabled={isExecuting}
            />
            <button onClick={() => executeAction()} disabled={isExecuting} className="bg-red-600 text-white p-3 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 shrink-0">
              {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}