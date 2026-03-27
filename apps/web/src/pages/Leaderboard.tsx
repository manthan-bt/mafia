import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowUp, ArrowDown, Search, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard: React.FC = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('http://localhost:3005/api/leaderboard');
            const data = await res.json();
            if (data.ok) setPlayers(data.leaderboard);
        } catch (err) {
            console.error('Failed to fetch leaderboard', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-[#050505] text-white font-michroma p-8 md:p-10 relative overflow-hidden flex flex-col">
            {/* --- CINEMATIC BACKGROUND --- */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-1000 fixed">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-dark-900 to-[#050510] opacity-90 transition-all duration-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] transition-all bg-red-900/10 opacity-30 pointer-events-none" />
            </div>

            {/* --- BACK NAVIGATION --- */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2 fixed"
            >
                <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Abort</span>
            </motion.button>

            <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col min-h-0 pt-20">

                <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-8 shrink-0 relative z-20">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left">
                        <div className="flex items-center gap-4 mb-2 justify-center md:justify-start">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-red-primary leading-none">Global Network Integrity</h2>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter font-orbitron leading-none text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">Elite List</h1>
                    </motion.div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-12 py-4 bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/[0.08] hover:border-red-primary/50 transition-all text-white">
                            My Standing
                        </button>
                    </div>
                </header>

                <div className="hidden lg:grid grid-cols-12 px-10 py-5 mb-4 border-b border-white/5 opacity-30 text-[9px] font-black uppercase tracking-[0.4em] shrink-0">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-1">Bio-Auth</div>
                    <div className="col-span-4">Operative Alias</div>
                    <div className="col-span-2 text-center">Protocol MMR</div>
                    <div className="col-span-2 text-center">Success Rate</div>
                    <div className="col-span-2 text-right">Trend</div>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-50">
                            <div className="w-12 h-12 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Registry...</span>
                        </div>
                    ) : players.length === 0 ? (
                        <div className="text-center py-20 opacity-30 text-xs uppercase tracking-widest">No operatives found in global registry.</div>
                    ) : players.map((p, idx) => (
                        <motion.div
                            key={p.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`glass-panel grid grid-cols-1 lg:grid-cols-12 items-center px-8 py-6 md:px-10 md:py-8 group hover:bg-red-600/[0.03] transition-all border-white/[0.03] gap-6 lg:gap-0 ${idx < 1 ? 'border-red-600/20 shadow-[0_0_50px_rgba(255,0,0,0.05)]' : ''}`}
                        >
                            <div className="lg:col-span-1 flex items-center">
                                <span className={`text-3xl md:text-4xl font-black tracking-tighter font-orbitron ${idx === 0 ? 'text-red-600' : 'opacity-10'}`}>
                                    {String(p.rank).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="lg:col-span-1 flex justify-center">
                                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center p-1 border ${idx === 0 ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-white/5'}`}>
                                    <Shield size={idx === 0 ? 20 : 18} className={idx === 0 ? 'text-red-600' : 'opacity-20'} />
                                </div>
                            </div>

                            <div className="lg:col-span-4 flex flex-col justify-center">
                                <h3 className={`text-lg md:text-xl font-black uppercase tracking-widest truncate ${idx === 0 ? 'text-white' : 'opacity-70 group-hover:opacity-100'}`}>
                                    {p.username}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-red-600/60 leading-none">{p.tier} CLASS PROTOCOL</span>
                                    {idx === 0 && <span className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />}
                                </div>
                            </div>

                            <div className="lg:col-span-2 flex lg:justify-center items-center justify-between">
                                <span className="lg:hidden text-[8px] font-black uppercase tracking-widest opacity-20">Protocol MMR</span>
                                <span className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 font-orbitron">{p.mmr}</span>
                            </div>

                            <div className="lg:col-span-2 flex lg:justify-center items-center justify-between text-center text-xs md:text-sm font-black uppercase tracking-widest opacity-40">
                                <span className="lg:hidden text-[8px] font-black opacity-20 tracking-widest">Success Rate</span>
                                {p.successRate}
                            </div>

                            <div className="lg:col-span-2 flex justify-between lg:justify-end items-center">
                                <span className="lg:hidden text-[8px] font-black uppercase tracking-widest opacity-20">Recent Trend</span>
                                <div className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-3 ${p.delta.includes('+') ? 'bg-red-600/10 text-red-600 border border-red-600/20 shadow-[0_0_10px_rgba(255,0,0,0.2)]' : p.delta === '0' ? 'bg-white/5 text-gray-500' : 'bg-red-950/20 text-red-800'}`}>
                                    {p.delta.includes('+') ? <ArrowUp size={10} /> : p.delta.includes('-') ? <ArrowDown size={10} /> : null}
                                    {p.delta}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <footer className="shrink-0 flex justify-center py-6 border-t border-white/5">
                    <button className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.6em] text-gray-600 hover:text-red-600 transition-all leading-none">
                        <Search size={14} /> Scan Global Registry For More Operatives
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default Leaderboard;
