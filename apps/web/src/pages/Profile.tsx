import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Award, ChevronLeft, Fingerprint, Activity, LogOut, Trophy, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { audioManager } from '../utils/audioManager';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const alias = localStorage.getItem('mafia_operative_alias') || 'SHADOW_01';

    const stats = [
        { label: 'Operations', value: '412', icon: Shield, accent: 'text-red-primary' },
        { label: 'Victories', value: '254', icon: Target, accent: 'text-red-highlight' },
        { label: 'Win Rate', value: '62%', icon: Activity, accent: 'text-gray-300' },
        { label: 'Rank', value: 'LEGEND II', icon: Trophy, accent: 'text-yellow-500' },
    ];

    const recentOps = [
        { role: 'Mafia', result: 'VICTORY', mmr: '+25', date: '2h ago' },
        { role: 'Doctor', result: 'DEFEAT', mmr: '−18', date: '5h ago' },
        { role: 'Detective', result: 'VICTORY', mmr: '+32', date: '1d ago' },
    ];

    const handleNav = (path: string) => {
        audioManager.play('flip', 0.5);
        navigate(path);
    };

    return (
        <div className="min-h-screen w-screen bg-[#050510] text-white font-michroma relative overflow-y-auto custom-scrollbar">

            {/* --- CINEMATIC BACKGROUND (fixed) --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-dark-900 to-[#050510] opacity-95" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] bg-red-900/15 opacity-40" />
            </div>

            {/* --- BACK NAVIGATION --- */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleNav('/')}
                className="fixed top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2"
            >
                <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Abort</span>
            </motion.button>

            {/* --- LOGOUT BUTTON --- */}
            <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleNav('/login')}
                className="fixed top-8 right-8 z-30 flex items-center gap-3 text-gray-600 hover:text-red-highlight transition-colors group p-2"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Log Out</span>
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* --- BENTO GRID LAYOUT --- */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 flex flex-col gap-6">

                {/* IDENTITY CARD (wide) */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="w-full rounded-3xl bg-white/[0.03] border border-white/10 p-10 flex flex-col md:flex-row items-center gap-10 hover:bg-white/[0.05] hover:border-red-primary/30 transition-all duration-500 group overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-4 border border-dashed border-red-primary/20 rounded-full"
                        />
                        <div className="w-32 h-32 rounded-full bg-red-primary/10 border border-red-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(177,18,38,0.2)] relative overflow-hidden">
                            <Fingerprint size={56} className="text-red-primary opacity-60" />
                            <motion.div
                                animate={{ top: ['-10%', '110%'] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                className="absolute left-0 w-full h-px bg-red-highlight/50 shadow-[0_0_10px_#FF2E4C]"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-xl">
                            <Star size={16} className="text-black" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-3 text-center md:text-left">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-primary">Elite Operative</span>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-orbitron text-white">{alias}</h1>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 max-w-sm">
                            Season 4 active. Currently ranked in the top 3% of global operatives.
                        </p>
                    </div>

                    {/* Season badge */}
                    <div className="md:ml-auto flex flex-col items-center gap-2 shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Award size={36} className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Legend II</span>
                    </div>
                </motion.div>

                {/* STAT CARDS ROW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                            className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 flex flex-col items-center gap-3 hover:bg-white/[0.06] hover:scale-[1.03] transition-all duration-300"
                        >
                            <s.icon size={28} className={s.accent} />
                            <span className={`text-2xl font-black font-orbitron tracking-tighter ${s.accent}`}>{s.value}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{s.label}</span>
                        </motion.div>
                    ))}
                </div>

                {/* RECENT OPS + PERFORMANCE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Recent Ops (wide) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="md:col-span-2 rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col gap-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black uppercase tracking-tighter font-orbitron">Operation Logs</h3>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Recent Activity</span>
                        </div>

                        {recentOps.map((op, i) => (
                            <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${op.result === 'VICTORY' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-primary shadow-[0_0_8px_rgba(177,18,38,0.6)]'}`} />
                                    <div>
                                        <span className="text-sm font-black uppercase tracking-widest">{op.role}</span>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${op.result === 'VICTORY' ? 'text-green-500' : 'text-red-primary'}`}>{op.result}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className={`text-sm font-black font-orbitron ${op.mmr.startsWith('+') ? 'text-green-400' : 'text-gray-500'}`}>{op.mmr}</span>
                                    <span className="text-[9px] text-gray-600 uppercase tracking-widest">{op.date}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Performance Radar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col items-center justify-center gap-6"
                    >
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 self-start">Tactical Profile</h3>

                        {/* Mock Radar */}
                        <div className="relative w-40 h-40">
                            <div className="absolute inset-0 rounded-full border border-white/10" />
                            <div className="absolute inset-4 rounded-full border border-white/5" />
                            <div className="absolute inset-8 rounded-full border border-white/5" />
                            <div className="absolute w-full h-px top-1/2 bg-white/5" />
                            <div className="absolute h-full w-px left-1/2 bg-white/5" />
                            <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_10px_#FF2E4C]" viewBox="0 0 100 100">
                                <polygon points="50,12 82,32 88,65 55,88 18,68 14,38" fill="rgba(177,18,38,0.15)" stroke="#FF2E4C" strokeWidth="1.5" />
                                <circle cx="50" cy="12" r="2.5" fill="#fff" />
                                <circle cx="82" cy="32" r="2.5" fill="#fff" />
                                <circle cx="88" cy="65" r="2.5" fill="#fff" />
                                <circle cx="55" cy="88" r="2.5" fill="#fff" />
                                <circle cx="18" cy="68" r="2.5" fill="#fff" />
                                <circle cx="14" cy="38" r="2.5" fill="#fff" />
                            </svg>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            {[['Deceit', '88%'], ['Leadership', '72%'], ['Detection', '65%']].map(([label, val]) => (
                                <div key={label} className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{label}</span>
                                    <span className="text-[9px] font-black text-red-primary">{val}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
