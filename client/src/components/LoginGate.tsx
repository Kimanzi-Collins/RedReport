import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { createSession } from '../services/api';

export default function LoginGate({ onLogin }: { onLogin: (username: string) => void }) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const username = value.trim();
    if (!username) {
      setError('Enter a callsign to continue.');
      return;
    }
    if (username.length > 32) {
      setError('Keep it under 32 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await createSession(username);
      localStorage.setItem('redReport_username', username);
      onLogin(username);
    } catch (err) {
      setError('Could not reach the intelligence engine. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1121] flex items-center justify-center p-4 transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 shadow-xl border border-slate-200 dark:border-slate-800 text-center"
      >
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-lg">
          <Shield className="w-7 h-7 text-white dark:text-black" />
        </div>
        <h1 className="text-2xl font-black text-black dark:text-white tracking-tight mb-2">Identify yourself, Operator</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8">
          Enter a callsign to unlock the Jarvis Intelligence Engine. Your chat history and reports will follow this name.
        </p>

        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isSubmitting) handleSubmit(); }}
            placeholder="e.g. Collins"
            disabled={isSubmitting}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-3 text-sm font-medium text-black dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-red-500/30 transition-shadow"
          />
          {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white px-5 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Engage <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
