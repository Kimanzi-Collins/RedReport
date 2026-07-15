import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, Loader2, Download, Shield, User, X, Terminal, Network, Code, Database } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import { analyzeLogsStream, postHistoryMessage } from '../services/api';

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
  { 
    id: 1, 
    title: "Analyze Attack Vector", 
    desc: "Map the blast radius of an active threat.", 
    icon: Terminal, 
    prompt: "I have a Metasploit log. Guide me through analyzing the primary attack vector.", 
    img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=500&q=80" 
  },
  { 
    id: 2, 
    title: "Defensive Blueprint", 
    desc: "Generate infrastructure patching rules.", 
    icon: Network, 
    prompt: "Generate a defensive Terraform blueprint to lock down my external SSH ports.", 
    img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=500&q=80" 
  },
  { 
    id: 3, 
    title: "Zero-Day Explanation", 
    desc: "Understand complex exploits step-by-step.", 
    icon: Code, 
    prompt: "Act as my cyber mentor. Explain how a buffer overflow attack works step-by-step.", 
    img: "https://images.unsplash.com/photo-1579567761406-4684ee0c75b6?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
  }
];

export default function AnalysisView({ state, setState, username }: any) {
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

    postHistoryMessage({ username, section: 'analysis', role: 'user', content: finalPrompt, files: fileNames, clientId: userMessage.id }).catch(console.error);

    try {
      const stream = analyzeLogsStream('report', filesToSend, 'claude', enrichedPrompt, reportType, username);
      const jarvisMessageId = (Date.now() + 1).toString();
      
      const initialMessage = { id: jarvisMessageId, role: 'jarvis', content: '' };
      setState((prev: any) => ({ 
        ...prev, 
        chatHistory: [...prev.chatHistory, initialMessage],
        isExecuting: true 
      }));

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setState((prev: any) => {
          const newHistory = [...prev.chatHistory];
          const lastMsgIndex = newHistory.findIndex(m => m.id === jarvisMessageId);
          if (lastMsgIndex !== -1) {
            newHistory[lastMsgIndex] = { ...newHistory[lastMsgIndex], content: fullContent };
          }
          return { ...prev, chatHistory: newHistory, isExecuting: false };
        });
      }

      postHistoryMessage({ username, section: 'analysis', role: 'jarvis', content: fullContent, clientId: jarvisMessageId, metadata: { reportType } }).catch(console.error);

      setState((prev: any) => ({ ...prev, isExecuting: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection severed.';
      setState((prev: any) => ({ ...prev, isExecuting: false, chatHistory: [...prev.chatHistory, { id: Date.now().toString(), role: 'jarvis', content: `**System Error:** ${message}` }] }));
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .pdf-container {
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1E293B;
          padding: 40px 50px;
          line-height: 1.6;
          background-color: #FFFFFF;
        }
        .pdf-header {
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 25px;
          margin-bottom: 35px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .pdf-logo {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #0F172A;
          margin: 0;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pdf-logo span {
          color: #B91C1C;
        }
        .pdf-subtitle {
          color: #64748B;
          margin: 6px 0 0 0;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2.5px;
        }
        .pdf-meta {
          text-align: right;
          color: #475569;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .pdf-content h1 {
          color: #0F172A;
          font-size: 22px;
          font-weight: 800;
          border-bottom: 1px solid #CBD5E1;
          padding-bottom: 8px;
          margin-top: 30px;
          margin-bottom: 16px;
        }
        .pdf-content h2 {
          font-size: 16px;
          color: #B91C1C;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
        }
        .pdf-content h3 {
          font-size: 14px;
          color: #334155;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .pdf-content p {
          margin-bottom: 16px;
          font-size: 12px;
          color: #334155;
        }
        .pdf-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 11px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .pdf-content th, .pdf-content td {
          border: 1px solid #E2E8F0;
          padding: 12px 14px;
          text-align: left;
        }
        .pdf-content th {
          background-color: #F8FAFC;
          font-weight: 600;
          color: #0F172A;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }
        .pdf-content tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        .pdf-content blockquote {
          border-left: 3px solid #B91C1C;
          padding: 16px 20px;
          color: #1E293B;
          background: #FEF2F2;
          margin: 24px 0;
          font-weight: 600;
          font-size: 12px;
          border-radius: 0 8px 8px 0;
        }
        .pdf-content ul, .pdf-content ol {
          margin-bottom: 16px;
          padding-left: 24px;
          font-size: 12px;
          color: #334155;
        }
        .pdf-content li {
          margin-bottom: 8px;
        }
        .pdf-content code {
          background-color: #F1F5F9;
          padding: 3px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #B91C1C;
          font-weight: 600;
        }
        .pdf-footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #E2E8F0;
          font-size: 9px;
          color: #94A3B8;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }
        .confidential-stamp {
          position: absolute;
          top: 45px;
          right: 50px;
          color: #DC2626;
          border: 2px solid #DC2626;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          border-radius: 4px;
          opacity: 0.8;
          transform: rotate(5deg);
        }
      </style>
      <div class="pdf-container">
        <div class="confidential-stamp">CONFIDENTIAL / INTERNAL ONLY</div>
        <div class="pdf-header">
          <div>
            <h1 class="pdf-logo">Red<span>Report</span></h1>
            <p class="pdf-subtitle">Enterprise Threat Intelligence Summary</p>
          </div>
          <div class="pdf-meta">
            DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
            TIME: ${new Date().toLocaleTimeString('en-US')}<br/>
            INCIDENT REF: ${messageId.slice(-8)}
          </div>
        </div>
        <div class="pdf-content">
           ${htmlContent}
        </div>
        <div class="pdf-footer">
          © ${new Date().getFullYear()} RedReport Security Ops. Strictly Confidential. Do Not Distribute.
        </div>
      </div>
    `;

    html2pdf().set({
      margin: 10,
      filename: `RedReport_Intel_${messageId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(printElement).save();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full max-w-5xl mx-auto h-full gap-4 md:gap-6 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Chat History Interface */}
      <div className="flex-1 overflow-y-auto w-full rounded-[2rem] p-3 md:p-4 space-y-4 md:space-y-6 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-4 md:pt-10">
             <Shield className="w-12 h-12 md:w-16 md:h-16 text-slate-200 dark:text-slate-800 mb-4 md:mb-6" />
             <h3 className="text-xl md:text-2xl font-black text-black dark:text-white mb-2 tracking-tight">Jarvis Intelligence Engine</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 md:mb-10 text-center max-w-md font-medium px-4">How can I assist your operations today? Upload telemetry or select a quick action below.</p>

             {/* Themed Image Nudge Cards - compact horizontal row on mobile, hero grid on desktop */}
             <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-2 -mx-4 w-full md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:mx-0 md:px-4 md:pb-0 max-w-4xl">
                {nudges.map((nudge) => (
                  <motion.div
                    key={nudge.id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => executeAction(nudge.prompt)}
                    className="relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer shadow-lg group border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row md:flex-col shrink-0 w-55 md:w-auto snap-start"
                  >
                    {/* Clean Image Container */}
                    <div className="h-full w-20 md:h-28 md:w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={nudge.img}
                        alt={nudge.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    <div className="p-3 md:p-5 relative bg-white dark:bg-slate-900 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                         <nudge.icon className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                         <h4 className="font-bold text-sm text-black dark:text-white truncate">{nudge.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block">{nudge.desc}</p>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        ) : (
          chatHistory.filter((msg: any) => msg.role === 'user' || msg.content.length > 0).map((msg: any) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("flex w-full gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
              {msg.role === 'jarvis' && (
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-md mt-2 border border-red-500">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div className={cn("rounded-[2rem] p-4 md:p-6 shadow-sm", msg.role === 'user' ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200" : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200")}>
                  
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-2 gap-2">
          
          {selectedFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {selectedFiles.map((file: File, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 dark:border-red-800 shadow-sm">
                  <Database className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[100px] md:max-w-xs">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="hover:text-black dark:hover:text-white transition-colors"><X className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          ) : <div />}

          {selectedFiles.length > 0 && (
            <div className="flex w-full md:w-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
               <button onClick={() => setReportType('executive')} className={cn("flex-1 md:flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all", reportType === 'executive' ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:text-black dark:hover:text-white")}>
                 Executive Intel
               </button>
               <button onClick={() => setReportType('investor')} className={cn("flex-1 md:flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all", reportType === 'investor' ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:text-black dark:hover:text-white")}>
                 Investor Brief
               </button>
            </div>
          )}
        </div>

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
