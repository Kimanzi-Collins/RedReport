import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Activity, Server, Lock, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simulated SOC Data
const trafficData = [
  { time: '00:00', safe: 4000, malicious: 240 },
  { time: '04:00', safe: 3000, malicious: 139 },
  { time: '08:00', safe: 2000, malicious: 980 },
  { time: '12:00', safe: 2780, malicious: 390 },
  { time: '16:00', safe: 1890, malicious: 480 },
  { time: '20:00', safe: 2390, malicious: 380 },
  { time: '24:00', safe: 3490, malicious: 430 },
];

const threatDistribution = [
  { name: 'Brute Force', count: 420 },
  { name: 'SQLi', count: 300 },
  { name: 'XSS', count: 200 },
  { name: 'DDoS', count: 680 },
  { name: 'Malware', count: 150 },
];

export default function DashboardView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
      className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full pb-12 pt-2"
    >
      {/* Top Metric Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Global Risk Score" value="A-" subtitle="System highly secure" trend="up" icon={<Shield className="w-5 h-5"/>} color="cyan" />
        <StatCard title="Active Threats" value="24" subtitle="4 Critical, 20 Low" trend="down" icon={<AlertTriangle className="w-5 h-5"/>} color="rose" />
        <StatCard title="MTTD" value="1.2m" subtitle="Mean Time to Detect" trend="down" icon={<Eye className="w-5 h-5"/>} color="indigo" />
        <StatCard title="Automated Mitigations" value="14,802" subtitle="Packets dropped (24h)" trend="up" icon={<CheckCircle className="w-5 h-5"/>} color="emerald" />
      </div>
      
      {/* Main Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        
        {/* Network Traffic Area Chart */}
        <div className="xl:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500" /> Network Telemetry Stream
            </h3>
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">Live 24h</span>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="safe" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorSafe)" />
                <Area type="monotone" dataKey="malicious" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorMalicious)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Bar Chart */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-indigo-500" /> Vector Distribution
          </h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="count" fill="#312e81" radius={[0, 8, 8, 0]} barSize={20}>
                  {threatDistribution.map((entry, index) => (
                    <cell key={`cell-${index}`} fill={index === 0 ? '#e11d48' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function StatCard({ title, value, subtitle, trend, icon, color }: any) {
  const colorMap: any = {
    cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-44 cursor-pointer"
    >
       <div className="flex justify-between items-start w-full">
         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", colorMap[color])}>{icon}</div>
         <span className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md", trend === 'up' ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" : "text-rose-600 bg-rose-100 dark:bg-rose-900/40")}>
           {trend === 'up' ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>} {trend === 'up' ? '+12%' : '-4%'}
         </span>
       </div>
       <div>
         <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</span>
         <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{title}</h3>
            <span className="text-[10px] text-slate-400">{subtitle}</span>
         </div>
       </div>
    </motion.div>
  );
}