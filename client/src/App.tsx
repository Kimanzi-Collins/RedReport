import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { 
  Search, Shield, Database, Wrench, BarChart3, FileText, Moon, Sun, Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Import our Views
import AnalysisView from './views/AnalysisView';
import DashboardView from './views/DashboardView';
import TelemetryView from './views/TelemetryView';
import ReportsView from './views/ReportsView';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dynamic Time-Based Greeting Helper
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export default function App() {
  const [activeView, setActiveView] = useState('Analysis');
  const [isDark, setIsDark] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());
  const mainRef = useRef<HTMLDivElement>(null);

  // Keep greeting updated if the app stays open across time boundaries
  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Initial GSAP Entry
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.gsap-sidebar', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: 'power4.out' });
      gsap.fromTo('.gsap-header', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.3 });
    }, mainRef);
    return () => ctx.revert();
  }, []);

  const navItems = [
    { id: 'Dashboards', icon: BarChart3, label: 'Dashboards' },
    { id: 'Telemetry', icon: Database, label: 'Telemetry' },
    { id: 'Analysis', icon: Shield, label: 'Analysis' },
    { id: 'Mitigation', icon: Wrench, label: 'Mitigation' },
    { id: 'Reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <div ref={mainRef} className="relative min-h-screen bg-[#E6EAEF] dark:bg-[#0B1121] transition-colors duration-500 flex font-sans text-slate-800 dark:text-slate-200 p-4 gap-6 overflow-hidden">
      
      {/* Background Ocean Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] pointer-events-none z-0 overflow-hidden transition-opacity duration-500 opacity-100 dark:opacity-30">
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute bottom-[-20%] left-0 w-[200%] h-full opacity-40 mix-blend-multiply dark:mix-blend-screen" style={{ background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, rgba(255,255,255,0) 70%)', transform: 'scaleY(0.5)' }} />
        <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute bottom-[-10%] left-0 w-[200%] h-full opacity-30 mix-blend-multiply dark:mix-blend-screen" style={{ background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.2) 0%, rgba(255,255,255,0) 60%)', transform: 'scaleY(0.6)' }} />
      </div>

      {/* Floating Sidebar */}
      <aside className="gsap-sidebar relative z-10 w-[80px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[3rem] flex flex-col items-center py-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white dark:border-slate-800 transition-colors duration-500 shrink-0">
        <div className="w-12 h-12 mb-10 flex items-center justify-center bg-black dark:bg-white rounded-full shadow-lg transition-colors duration-500">
          <Shield className="w-6 h-6 text-white dark:text-black" />
        </div>
        
        <div className="flex flex-col gap-6 w-full items-center">
          {navItems.map((item) => (
            <button key={`side-${item.id}`} onClick={() => setActiveView(item.id)} className="relative w-12 h-12 flex items-center justify-center rounded-full group transition-transform hover:scale-105">
              {activeView === item.id && <motion.div layoutId="sidebarActive" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700" transition={{ type: "spring", stiffness: 300, damping: 25 }} />}
              <item.icon className={cn("w-5 h-5 relative z-10 transition-colors duration-300", activeView === item.id ? "text-black dark:text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")} />
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-500">
          <button onClick={() => setIsDark(false)} className={cn("w-10 h-10 flex items-center justify-center rounded-full transition-all", !isDark ? "bg-black text-white shadow-md" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700")}><Sun className="w-4 h-4" /></button>
          <button onClick={() => setIsDark(true)} className={cn("w-10 h-10 flex items-center justify-center rounded-full transition-all", isDark ? "bg-white text-black shadow-md" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700")}><Moon className="w-4 h-4" /></button>
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 flex flex-col h-[calc(100vh-32px)]">
        
        <header className="gsap-header h-24 flex items-center justify-between px-2 shrink-0">
          <div className="flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.h1 key={activeView} initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: "easeOut" }} className="text-3xl font-semibold text-black dark:text-white tracking-tight">
                {activeView === 'Analysis' ? `${greeting}, Collins` : `${activeView} Center`}
              </motion.h1>
            </AnimatePresence>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">System secure. Engine ready.</p>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-full border border-white dark:border-slate-800 shadow-sm transition-colors duration-500">
            {navItems.map((item) => (
              <motion.button key={`top-${item.id}`} onClick={() => setActiveView(item.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={cn("relative px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-300", activeView === item.id ? "text-white dark:text-black" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")}>
                {activeView === item.id && <motion.div layoutId="topNavActive" className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-md" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center px-5 py-3 rounded-full shadow-sm border border-white dark:border-slate-800 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all w-72">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search Workspace..." className="bg-transparent border-none focus:outline-none ml-3 w-full text-sm placeholder:text-slate-400 text-black dark:text-white" />
            </div>
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm overflow-hidden cursor-pointer border-2 border-white dark:border-slate-700 hover:scale-105 transition-transform">
              <img src="https://ui-avatars.com/api/?name=C+K&background=000&color=fff" alt="User" className="w-full h-full object-cover dark:invert" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 pr-4 mt-4 custom-scrollbar relative">
           <AnimatePresence mode="wait">
             {activeView === 'Analysis' && <AnalysisView key="analysis" />}
             {activeView === 'Dashboards' && <DashboardView key="dashboard" />}
             {activeView === 'Telemetry' && <TelemetryView key="telemetry" />}
             {activeView === 'Reports' && <ReportsView key="reports" />}
             {activeView === 'Mitigation' && <motion.div key="mitigation" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">Mitigation Blueprints pending architecture...</motion.div>}
           </AnimatePresence>
        </div>

      </main>
    </div>
  );
}