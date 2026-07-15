import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Database, Wrench, BarChart, FileText, Moon, Sun, RefreshCw, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import AnalysisView from './views/AnalysisView';
import DashboardView from './views/DashboardView';
import TelemetryView from './views/TelemetryView';
import MitigationView from './views/MitigationView';
import ReportsView from './views/ReportsView';
import LoginGate from './components/LoginGate';
import { fetchHistory } from './services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export default function App() {
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('redReport_username'));
  const [activeView, setActiveView] = useState('Analysis');
  const [isDark, setIsDark] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());
  const mainRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const [analysisState, setAnalysisState] = useState({
    selectedFiles: [] as File[],
    promptText: '',
    isExecuting: false,
    chatHistory: [] as { id: string; role: 'user' | 'jarvis'; content: string; files?: string[] }[]
  });

  const [mitigationState, setMitigationState] = useState({
    blueprint: null as string | null,
    isLoading: false
  });

  const [telemetryState, setTelemetryState] = useState({
    events: [] as any[],
    rawLogs: '',
    isLoading: false
  });

  const handleNewSession = () => {
    setAnalysisState({ selectedFiles: [], promptText: '', isExecuting: false, chatHistory: [] });
    setMitigationState({ blueprint: null, isLoading: false });
    setTelemetryState({ events: [], rawLogs: '', isLoading: false });
    setActiveView('Analysis');
  };

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0 });
  }, [activeView]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    if (!username) return;

    fetchHistory('analysis', username)
      .then((messages) => setAnalysisState((prev) => ({ ...prev, chatHistory: messages })))
      .catch((err) => console.error('Failed to hydrate analysis history:', err));

    fetchHistory('mitigation', username)
      .then((messages) => {
        const lastJarvis = [...messages].reverse().find((m) => m.role === 'jarvis');
        if (lastJarvis) setMitigationState((prev) => ({ ...prev, blueprint: lastJarvis.content }));
      })
      .catch((err) => console.error('Failed to hydrate mitigation history:', err));

    fetchHistory('telemetry', username)
      .then((messages) => {
        const lastJarvis = [...messages].reverse().find((m) => m.role === 'jarvis');
        if (lastJarvis?.metadata) {
          setTelemetryState((prev) => ({
            ...prev,
            events: lastJarvis.metadata?.events || [],
            rawLogs: lastJarvis.metadata?.rawLogs || ''
          }));
        }
      })
      .catch((err) => console.error('Failed to hydrate telemetry history:', err));
  }, [username]);

  const handleSwitchUser = () => {
    localStorage.removeItem('redReport_username');
    setUsername(null);
  };

  const navItems = [
    { id: 'Dashboards', icon: BarChart, label: 'Dashboards' },
    { id: 'Telemetry', icon: Database, label: 'Telemetry' },
    { id: 'Analysis', icon: Shield, label: 'Analysis' },
    { id: 'Mitigation', icon: Wrench, label: 'Mitigation' },
    { id: 'Reports', icon: FileText, label: 'Reports' },
  ];

  if (!username) return <LoginGate onLogin={setUsername} />;

  return (
    <div ref={mainRef} className="relative h-[100dvh] bg-[#F8FAFC] dark:bg-[#0B1121] transition-colors duration-500 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-200 p-2 md:p-4 gap-2 md:gap-6 overflow-hidden pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">

      {/* Red Ambient Wavy Code Background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30vh] md:h-[60vh] pointer-events-none z-0 overflow-hidden transition-opacity duration-500 opacity-100 dark:opacity-80"
        style={{
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
        }}
      >
        {/* Base Red Glow */}
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="absolute bottom-[-20%] left-0 w-[200%] h-full opacity-30 mix-blend-multiply dark:mix-blend-screen"
          style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.2) 0%, rgba(255,255,255,0) 70%)', transform: 'scaleY(0.5)' }}
        />

        {/* Animated Cyber Code Waves */}
        <div className="absolute inset-0 flex flex-col justify-end pb-2 opacity-20 dark:opacity-25 md:opacity-30 md:dark:opacity-40 mix-blend-overlay dark:mix-blend-lighten">
          {[...Array(6)].map((_, i) => {
            const direction = i % 2 === 0 ? 1 : -1;
            return (
              <motion.div
                key={i}
                animate={{
                  x: direction === 1 ? ["0%", "-50%"] : ["-50%", "0%"],
                  y: ["0px", `${12 + i * 2}px`, "0px", `-${12 + i * 2}px`, "0px"]
                }}
                transition={{
                  x: { repeat: Infinity, duration: 40 + i * 15, ease: "linear" },
                  y: { repeat: Infinity, duration: 8 + i * 2, ease: "easeInOut" }
                }}
                className="whitespace-nowrap font-mono text-[11px] md:text-xs text-red-600 dark:text-red-500 leading-[2.5] tracking-[0.2em] select-none"
              >
                {`0x${(i * 1024 + 255).toString(16).toUpperCase()} NULL_PTR_DEREF [SYS_EXECVE] PAYLOAD_DELIVERED // TACTIC_TA000${2+i} // BYPASS_ICE_PROTOCOL `.repeat(15)}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating Sidebar (Bottom Nav on Mobile) */}
      <aside className="gsap-sidebar relative z-20 w-full md:w-[80px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] flex flex-row md:flex-col items-center justify-between md:justify-start px-4 md:px-0 py-3 md:py-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] md:shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200 dark:border-slate-800 shrink-0 order-last md:order-first">
        <div className="hidden md:flex w-12 h-12 mb-10 items-center justify-center bg-black dark:bg-white rounded-full shadow-lg">
          <Shield className="w-6 h-6 text-white dark:text-black" />
        </div>
        
        <div className="flex flex-row md:flex-col gap-2 md:gap-6 w-full md:w-auto items-center justify-between md:justify-start flex-1 md:flex-none">
          {navItems.map((item) => (
            <button key={`side-${item.id}`} onClick={() => setActiveView(item.id)} className="relative w-12 h-12 md:w-12 md:h-12 flex items-center justify-center rounded-full group transition-transform hover:scale-105">
              {activeView === item.id && <motion.div layoutId="sidebarActive" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700" transition={{ type: "spring", stiffness: 300, damping: 25 }} />}
              <item.icon className={cn("w-5 h-5 relative z-10 transition-colors duration-300", activeView === item.id ? "text-red-600 dark:text-red-500" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")} />
            </button>
          ))}
        </div>

        <div className="hidden md:flex flex-col items-center mt-auto">
          <button onClick={handleNewSession} className="mb-6 w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 hover:scale-110 transition-all shadow-sm border border-red-100 dark:border-red-800 group" title="New Session">
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>

          <div className="flex flex-col gap-2 bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
            <button onClick={() => setIsDark(false)} className={cn("w-10 h-10 flex items-center justify-center rounded-full transition-all", !isDark ? "bg-black text-white shadow-md" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700")}><Sun className="w-4 h-4" /></button>
            <button onClick={() => setIsDark(true)} className={cn("w-10 h-10 flex items-center justify-center rounded-full transition-all", isDark ? "bg-white text-black shadow-md" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700")}><Moon className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0">
        <header className="gsap-header h-auto md:h-24 py-2 md:py-0 flex flex-col md:flex-row items-start md:items-center justify-between px-2 shrink-0 gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            <div className="flex flex-col">
              <AnimatePresence mode="wait">
                <motion.h1 key={activeView} initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.4 }} className="text-xl sm:text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight leading-tight wrap-break-word">
                  {activeView === 'Analysis' ? `${greeting}, ${username}` : `${activeView} Center`}
                </motion.h1>
              </AnimatePresence>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1 font-medium hidden sm:block">System secure. Engine ready.</p>
            </div>
            
            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button onClick={handleNewSession} className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 shadow-sm shrink-0">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                {isDark ? <Sun className="w-4 h-4 text-slate-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>
          </div>

          {/* Red/Black Premium Pill Navigation (Desktop Only) */}
          <div className="hidden lg:flex items-center bg-white dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
            {navItems.map((item) => (
              <button 
                key={`top-${item.id}`} 
                onClick={() => setActiveView(item.id)} 
                className={cn(
                  "relative px-6 py-2.5 text-sm font-bold transition-colors duration-300 rounded-full", 
                  activeView === item.id ? "text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {activeView === item.id && (
                  <motion.div 
                    layoutId="topNavPill" 
                    className="absolute inset-0 bg-red-600 rounded-full shadow-md" 
                    transition={{ type: "spring", stiffness: 350, damping: 30 }} 
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md flex items-center px-5 py-3 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-red-500/20 w-72 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="text" placeholder="Search Workspace..." className="bg-transparent border-none focus:outline-none ml-3 w-full text-sm font-medium placeholder:text-slate-400 text-black dark:text-white" />
            </div>
            <button onClick={handleSwitchUser} className="group relative w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:border-red-600 transition-colors shrink-0" title="Switch user">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=000&color=fff`} alt={username} className="w-full h-full object-cover dark:invert" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <LogOut className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        </header>

        <div ref={contentScrollRef} className="flex-1 overflow-y-auto pb-4 md:pb-10 pr-2 md:pr-4 mt-2 md:mt-4 custom-scrollbar relative">
           <AnimatePresence mode="wait">
             {activeView === 'Analysis' && <AnalysisView key="analysis" state={analysisState} setState={setAnalysisState} username={username} />}
             {activeView === 'Dashboards' && <DashboardView key="dashboard" />}
             {activeView === 'Telemetry' && <TelemetryView key="telemetry" state={telemetryState} setState={setTelemetryState} username={username} />}
             {activeView === 'Mitigation' && <MitigationView key="mitigation" state={mitigationState} setState={setMitigationState} username={username} />}
             {activeView === 'Reports' && <ReportsView key="reports" username={username} />}
           </AnimatePresence>
           <footer className="mt-8 pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
             Copyright &copy; {new Date().getFullYear()} Collins Mwandikwa. All rights reserved.
           </footer>
        </div>
      </main>
    </div>
  );
}
