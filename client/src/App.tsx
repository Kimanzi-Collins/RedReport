import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { 
  Search, Share2, Star, Plus, Trash2, Database, 
  Send, AlertCircle, Moon, Sun, Shield, Activity, Map, Wrench
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Analysis');
  const [activeSidebar, setActiveSidebar] = useState('Home');
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP Initial Load Orchestration
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gsap-slide-up', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.2
      });
      gsap.from('.gsap-fade-in', {
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const tabs = ['Dashboards', 'Telemetry', 'Analysis', 'Mitigation', 'Reports'];
  const sidebarIcons = [
    { id: 'Home', icon: Shield },
    { id: 'Share', icon: Share2 },
    { id: 'Export', icon: Send },
    { id: 'Starred', icon: Star },
    { id: 'Add', icon: Plus },
    { id: 'Database', icon: Database },
    { id: 'Alerts', icon: AlertCircle },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#E6EAEF] flex font-sans text-slate-800 p-3 gap-4">
      
      {/* Floating Pill Sidebar */}
      <aside className="gsap-fade-in w20 w-[80px] bg-[#F1F4F7] rounded-[2.5rem] flex flex-col items-center py-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_10px_20px_rgba(0,0,0,0.02)] border border-white/50 shrink-0">
        <div className="w-10 h-10 mb-8 flex items-center justify-center">
          <Shield className="w-7 h-7 text-black" />
        </div>
        
        <div className="flex flex-col gap-4 w-full items-center">
          {sidebarIcons.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveSidebar(item.id)}
              className="relative w-12 h-12 flex items-center justify-center rounded-full group"
            >
              {activeSidebar === item.id && (
                <motion.div 
                  layoutId="sidebarActive"
                  className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-100"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 relative z-10 transition-colors duration-300", 
                activeSidebar === item.id ? "text-black" : "text-slate-400 group-hover:text-slate-600"
              )} />
            </button>
          ))}
        </div>

        {/* Theme Toggle at bottom */}
        <div className="mt-auto flex flex-col gap-3 bg-white p-2 rounded-full shadow-sm">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <Moon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white shadow-md">
            <Sun className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-24px)] overflow-hidden">
        
        {/* Top Navigation */}
        <header className="gsap-slide-up h-20 flex items-center justify-between px-4 shrink-0">
          <h1 className="text-3xl font-semibold text-black tracking-tight">
            Threat Analysis
          </h1>

          {/* Central Pill Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-[#F1F4F7] p-1.5 rounded-full border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-300",
                  activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="topNavActive"
                    className="absolute inset-0 bg-black rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white flex items-center px-4 py-2.5 rounded-full shadow-sm border border-slate-100 w-64 group focus-within:ring-2 focus-within:ring-black/5 transition-all">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search Logs..." 
                className="bg-transparent border-none focus:outline-none ml-3 w-full text-sm placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"><Search className="w-4 h-4 text-slate-600"/></button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"><Activity className="w-4 h-4 text-slate-600"/></button>
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden cursor-pointer border border-slate-100">
                <img src="https://ui-avatars.com/api/?name=C+K&background=000&color=fff" alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto pb-10 pr-2 custom-scrollbar">
          
          <div className="grid grid-cols-12 gap-6 mt-6">
            
            {/* Left Prompt/Upload Card */}
            <div className="gsap-slide-up col-span-12 xl:col-span-4 bg-[#F1F4F7] rounded-[2.5rem] p-8 border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,1),0_10px_30px_rgba(0,0,0,0.03)] flex flex-col">
              <h2 className="text-xl font-semibold mb-6">Execution Engine</h2>
              
              <div className="flex-1 flex flex-col gap-4">
                <WorkflowCard 
                  title="Upload Penetration Logs" 
                  desc="Awaiting Nmap or Metasploit data."
                  icon={<Database className="w-5 h-5" />}
                  isActive={true}
                />
                <WorkflowCard 
                  title="Contextual Processing" 
                  desc="Claude 3.5 Sonnet pipeline."
                  icon={<Activity className="w-5 h-5" />}
                />
                <WorkflowCard 
                  title="Draft Final Report" 
                  desc="Markdown and Mermaid.js export."
                  icon={<Map className="w-5 h-5" />}
                />
              </div>

              {/* Input Area */}
              <div className="mt-8 bg-white rounded-3xl p-4 shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                <textarea 
                  placeholder="Direct Jarvis to initiate a specific protocol..."
                  className="w-full h-20 resize-none outline-none text-sm text-slate-700 bg-transparent placeholder:text-slate-400"
                />
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-50">
                   <button className="p-2 text-slate-400 hover:text-black transition-colors rounded-full hover:bg-slate-50"><Plus className="w-5 h-5" /></button>
                   <button className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
                     Execute <Send className="w-4 h-4 ml-1" />
                   </button>
                </div>
              </div>
            </div>

            {/* Right Flowchart/Results Area */}
            <div className="gsap-slide-up col-span-12 xl:col-span-8 bg-white rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col">
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-semibold">Incident Resolution Pipeline</h2>
                 <div className="flex gap-2">
                   <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><Plus className="w-4 h-4 text-slate-600" /></button>
                   <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><Share2 className="w-4 h-4 text-slate-600" /></button>
                 </div>
               </div>

               {/* Simulated Workflow Area (Matching the image's CRM style) */}
               <div className="flex-1 bg-[#F9FAFB] rounded-[2rem] border border-slate-100 p-6 flex items-center justify-center overflow-hidden relative">
                  
                  {/* Decorative Connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                     <path d="M 250 200 C 350 200, 350 150, 450 150" fill="transparent" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="5,5" />
                     <path d="M 250 200 C 350 200, 350 250, 450 250" fill="transparent" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>

                  <div className="flex gap-12 relative z-10 w-full max-w-4xl">
                     {/* Column 1 */}
                     <div className="flex-1 flex flex-col gap-4">
                       <TaskNode title="Identify Threat Vector" status="done" user="CK" />
                       <TaskNode title="Isolate Affected Subnet" status="active" user="CK" />
                     </div>
                     
                     {/* Column 2 */}
                     <div className="flex-1 flex flex-col gap-4">
                       <TaskNode title="Map to MITRE ATT&CK" status="pending" />
                       <TaskNode title="Generate Remediation Code" status="pending" />
                       <TaskNode title="Patch Vulnerability" status="pending" />
                     </div>

                     {/* Column 3 (The Black Accent) */}
                     <div className="flex-1 flex flex-col justify-center">
                       <div className="bg-black text-white p-6 rounded-[1.5rem] shadow-xl transform transition-transform hover:scale-105 cursor-pointer">
                         <h3 className="text-sm font-medium mb-1">Finalize Report</h3>
                         <p className="text-xs text-slate-400">Generate executive PDF</p>
                       </div>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components for the pristine UI blocks
function WorkflowCard({ title, desc, icon, isActive = false }: { title: string, desc: string, icon: any, isActive?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={cn(
        "p-5 rounded-3xl flex gap-4 transition-all duration-300 border cursor-pointer",
        isActive ? "bg-white shadow-sm border-slate-100" : "bg-transparent border-transparent hover:bg-white/50"
      )}
    >
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", isActive ? "bg-[#F1F4F7] text-black" : "bg-white text-slate-400 shadow-sm")}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function TaskNode({ title, status, user }: { title: string, status: 'done' | 'active' | 'pending', user?: string }) {
  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between shadow-sm",
      status === 'active' ? "bg-white border-black/10 ring-1 ring-black/5" : "bg-white border-slate-100",
      status === 'pending' && "opacity-60 bg-transparent border-dashed border-slate-300 shadow-none"
    )}>
      <div>
        <h4 className="text-sm font-medium text-slate-800">{title}</h4>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{status}</p>
      </div>
      {user ? (
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white shadow-sm">
          {user}
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-200" />
      )}
    </div>
  );
}