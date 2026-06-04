import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Activity, Server, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full pb-12 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Global Risk Score" value="A-" subtitle="System highly secure" trend="up" icon={<Shield className="w-5 h-5"/>} theme="black" />
        <StatCard title="Active Threats" value="24" subtitle="4 Critical, 20 Low" trend="down" icon={<AlertTriangle className="w-5 h-5"/>} theme="red" />
        <StatCard title="MTTD" value="1.2m" subtitle="Mean Time to Detect" trend="down" icon={<Eye className="w-5 h-5"/>} theme="slate" />
        <StatCard title="Automated Mitigations" value="14,802" subtitle="Packets dropped (24h)" trend="up" icon={<CheckCircle className="w-5 h-5"/>} theme="outline" />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        <div className="xl:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-black dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" /> Network Telemetry Stream
            </h3>
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 border border-slate-200 dark:border-slate-700">Live 24h</span>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="safe" stroke="#475569" strokeWidth={3} fillOpacity={1} fill="url(#colorSafe)" />
                <Area type="monotone" dataKey="malicious" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorMalicious)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <h3 className="font-bold text-lg text-black dark:text-white flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-black dark:text-slate-400" /> Vector Distribution
          </h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} fontWeight="bold" />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#DC2626' : '#111827'} />
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

function StatCard({ title, value, subtitle, trend, icon, theme }: any) {
  const themes: any = {
    black: "bg-black text-white border-black dark:border-slate-800",
    red: "bg-red-600 text-white border-red-600",
    slate: "bg-slate-800 text-white border-slate-800",
    outline: "bg-white dark:bg-slate-900 text-black dark:text-white border-slate-200 dark:border-slate-700",
  };

  return (
    <motion.div whileHover={{ scale: 1.02, y: -4 }} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-44 cursor-pointer">
       <div className="flex justify-between items-start w-full">
         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm", themes[theme])}>{icon}</div>
         <span className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border", trend === 'up' ? "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" : "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50")}>
           {trend === 'up' ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>} {trend === 'up' ? '+12%' : '-4%'}
         </span>
       </div>
       <div>
         <span className="text-3xl font-black text-black dark:text-white tracking-tight">{value}</span>
         <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold">{title}</h3>
            <span className="text-[10px] text-slate-400 font-medium">{subtitle}</span>
         </div>
       </div>
    </motion.div>
  );
}