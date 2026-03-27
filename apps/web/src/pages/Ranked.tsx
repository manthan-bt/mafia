import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, Crosshair, Skull, Activity, Calendar, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Ranked: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = React.useState<any>(null);
    const [_isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('mafia_token');
            if (!token) return;
            const res = await fetch('http://localhost:3005/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) setProfile(data.profile);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getRankTier = (mmr: number) => {
        if (mmr > 2000) return 'Legend I';
        if (mmr > 1500) return 'Master I';
        return 'Diamond III';
    };

    const history = [
        { id: 'MTCH-092X', role: 'Mafia', res: 'VICTORY', mmr: '+24', date: '2H AGO', duration: '18m 20s' },
        { id: 'MTCH-091V', role: 'Doctor', res: 'DEFEAT', mmr: '-18', date: '5H AGO', duration: '24m 10s' },
        { id: 'MTCH-090A', role: 'Detective', res: 'VICTORY', mmr: '+32', date: '1D AGO', duration: '31m 05s' },
        { id: 'MTCH-089P', role: 'Civilian', res: 'DEFEAT', mmr: '-12', date: '1D AGO', duration: '12m 40s' },
        { id: 'MTCH-088Z', role: 'Mafia', res: 'VICTORY', mmr: '+28', date: '2D AGO', duration: '22m 15s' },
    ];

    return (
        <div className="h-screen w-screen bg-[#050505] text-white font-michroma relative overflow-hidden flex flex-col items-center">

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

            <div className="relative z-10 p-6 md:p-10 flex flex-col gap-10 max-w-7xl mx-auto min-h-full w-full pt-28 overflow-y-auto custom-scrollbar">

                {/* --- RANK & PROGRESS SECTION --- */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 shrink-0">

                    {/* Current Rank Display */}
                    <div className="lg:col-span-8 glass-panel p-1 border-red-primary/20 bg-dark-800 shadow-[0_0_50px_rgba(177,18,38,0.1)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay" />
                        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-highlight/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

                        <div className="relative z-10 p-10 h-full flex flex-col md:flex-row items-center gap-12">
                            {/* Rank Emblem */}
                            <div className="relative shrink-0">
                                <motion.div
                                    animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                                    className="absolute -inset-6 border-2 border-dashed border-red-primary/30 rounded-full"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                                    className="absolute -inset-10 border border-red-highlight/10 rounded-full"
                                />
                                <div className="w-48 h-48 rounded-full bg-dark-900 border-2 border-red-highlight shadow-[0_0_50px_rgba(255,46,76,0.3)] flex items-center justify-center relative overflow-hidden">
                                    <Trophy size={80} className="text-red-highlight drop-shadow-[0_0_20px_rgba(255,46,76,0.8)]" />
                                    <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-red-primary to-transparent opacity-50" />
                                </div>
                            </div>

                            {/* MMR Progress */}
                            <div className="flex-1 w-full flex flex-col gap-6">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-highlight mb-2">Current Echelon</p>
                                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter font-orbitron text-white">
                                        {profile ? getRankTier(profile.mmr) : 'Diamond III'}
                                    </h1>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">MMR Progress</span>
                                        <span className="text-sm font-black font-orbitron text-white">
                                            {profile?.mmr || 1000} <span className="text-red-highlight">/ 3,000</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-dark-900 border border-white/5 overflow-hidden relative shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((profile?.mmr || 1000) / 30, 100)}%` }}
                                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-secondary to-red-highlight shadow-[0_0_15px_#FF2E4C]"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-600">
                                        <span>Diamond II</span>
                                        <span>Master I</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Radar Module */}
                    <div className="lg:col-span-4 glass-panel p-8 border-white/5 bg-dark-800 flex flex-col justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
                            <Activity size={100} className="text-red-highlight" />
                        </div>
                        <div className="w-full mb-8 relative z-10">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Tactical Output</h3>
                        </div>

                        {/* CSS Mock Radar Chart for Visual Fidelity */}
                        <div className="relative w-48 h-48 rounded-full border border-white/10 flex items-center justify-center mb-6 z-10">
                            <div className="absolute inset-0 rounded-full border border-white/5 scale-75" />
                            <div className="absolute inset-0 rounded-full border border-white/5 scale-50" />
                            <div className="absolute w-full h-px bg-white/10" />
                            <div className="absolute h-full w-px bg-white/10" />
                            <div className="absolute w-full h-px bg-white/10 rotate-45" />
                            <div className="absolute w-full h-px bg-white/10 -rotate-45" />

                            {/* The Neon Red Data Polygon */}
                            <div className="absolute inset-0 bg-red-highlight/20" style={{ clipPath: 'polygon(50% 10%, 80% 30%, 90% 60%, 60% 90%, 20% 70%, 15% 40%)' }} />
                            <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_10px_#FF2E4C]" viewBox="0 0 100 100">
                                <polygon points="50,10 80,30 90,60 60,90 20,70 15,40" fill="none" stroke="#FF2E4C" strokeWidth="1.5" />
                                {/* Data Points */}
                                <circle cx="50" cy="10" r="2" fill="#fff" />
                                <circle cx="80" cy="30" r="2" fill="#fff" />
                                <circle cx="90" cy="60" r="2" fill="#fff" />
                                <circle cx="60" cy="90" r="2" fill="#fff" />
                                <circle cx="20" cy="70" r="2" fill="#fff" />
                                <circle cx="15" cy="40" r="2" fill="#fff" />
                            </svg>
                        </div>

                        <div className="w-full flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-500 z-10">
                            <span className="flex items-center gap-1"><Shield size={10} className="text-red-highlight" /> Defense</span>
                            <span className="flex items-center gap-1"><Crosshair size={10} className="text-red-highlight" /> Attack</span>
                            <span className="flex items-center gap-1"><Skull size={10} className="text-red-highlight" /> Deceit</span>
                        </div>
                    </div>

                </section>

                {/* --- MATCH HISTORY SECTION --- */}
                <section className="glass-panel border-white/5 flex-1 bg-dark-800 p-8 flex flex-col overflow-hidden gap-6">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter font-orbitron text-white">Operation Archives</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Recent ranked deployments</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                                <Calendar size={12} /> All Seasons
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                                <Search size={12} /> Filter
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-600">
                                    <th className="pb-4 pt-2 font-normal">Operation ID</th>
                                    <th className="pb-4 pt-2 font-normal">Assigned Role</th>
                                    <th className="pb-4 pt-2 font-normal">Outcome</th>
                                    <th className="pb-4 pt-2 font-normal text-center">MMR Delta</th>
                                    <th className="pb-4 pt-2 font-normal">Duration</th>
                                    <th className="pb-4 pt-2 font-normal">Date</th>
                                    <th className="pb-4 pt-2 font-normal text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((match, _i) => (
                                    <tr key={match.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                        <td className="py-5 text-sm font-black font-orbitron">{match.id}</td>
                                        <td className="py-5 text-xs font-bold text-gray-300">{match.role}</td>
                                        <td className={`py-5 text-[10px] font-black uppercase tracking-widest ${match.res === 'VICTORY' ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'text-red-primary drop-shadow-[0_0_8px_rgba(177,18,38,0.4)]'}`}>
                                            {match.res}
                                        </td>
                                        <td className={`py-5 text-center text-sm font-black font-orbitron ${match.mmr.startsWith('+') ? 'text-green-400' : 'text-gray-500'}`}>
                                            {match.mmr}
                                        </td>
                                        <td className="py-5 text-xs text-gray-500 font-medium">{match.duration}</td>
                                        <td className="py-5 text-[10px] font-bold tracking-widest text-gray-600">{match.date}</td>
                                        <td className="py-5 text-right">
                                            <button className="opacity-30 group-hover:opacity-100 group-hover:text-red-highlight inline-flex transition-colors">
                                                <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="shrink-0 flex justify-center pt-4">
                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors">Load Extended Archives</button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Ranked;
