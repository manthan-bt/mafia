import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tournament: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('BRACKET');

    const matches = [
        { id: 'M1', p1: 'Team Alpha', p2: 'Team Bravo', status: 'LIVE', time: '00:14:22' },
        { id: 'M2', p1: 'Cyber Synd', p2: 'Neon Cartel', status: 'UPCOMING', time: '14:00 UTC' },
        { id: 'M3', p1: 'Void Runners', p2: 'Red Eclipse', status: 'COMPLETED', res: '2-1' },
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

                {/* --- HERO / COUNTDOWN --- */}
                <section className="relative w-full rounded-3xl overflow-hidden glass-panel border-none bg-dark-800 shadow-[0_20px_50px_rgba(11,15,26,0.8)] shrink-0">
                    <div className="absolute inset-0 z-0">
                        <img src="https://images.unsplash.com/photo-1542332213-31f87348057f?w=1200&h=400&fit=crop" alt="Tournament Hero" className="w-full h-full object-cover opacity-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay" />
                    </div>

                    <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded bg-red-primary/20 border border-red-highlight/30 text-[9px] font-black uppercase tracking-widest text-red-highlight animate-pulse shadow-[0_0_15px_rgba(255,46,76,0.4)]">
                                    Live Major
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-orbitron">Season 4</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-orbitron text-white drop-shadow-[0_0_20px_rgba(177,18,38,0.5)]">
                                Nightfall <span className="text-red-primary">Pro-Circuit</span>
                            </h1>
                            <p className="text-sm font-medium text-gray-400 max-w-xl">
                                The culmination of ranked operations. Elite squads compete for the 250,000c prize pool.
                            </p>
                        </div>

                        <div className="glass-panel p-8 border-white/5 bg-white/[0.02] flex flex-col items-center gap-4 text-center min-w-[300px]">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Grand Finals In</span>
                            <div className="flex items-center gap-4 text-4xl font-black font-orbitron text-white">
                                <div className="flex flex-col items-center"><span className="text-red-highlight drop-shadow-[0_0_10px_#FF2E4C]">48</span><span className="text-[8px] tracking-widest text-gray-500 mt-1">HRS</span></div>
                                <span className="text-red-primary pb-3">:</span>
                                <div className="flex flex-col items-center"><span>12</span><span className="text-[8px] tracking-widest text-gray-500 mt-1">MIN</span></div>
                                <span className="text-red-primary pb-3">:</span>
                                <div className="flex flex-col items-center"><span>04</span><span className="text-[8px] tracking-widest text-gray-500 mt-1">SEC</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- NAVIGATION TABS --- */}
                <nav className="flex items-center gap-8 border-b border-white/10 px-4 shrink-0">
                    {['BRACKET', 'LIVE MATCHES', 'STANDINGS'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="tourney-tab" className="absolute bottom-0 left-0 w-full h-1 bg-red-highlight rounded-t-lg shadow-[0_0_10px_#FF2E4C]" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 flex flex-col min-h-0 relative">

                    {/* Visual Bracket (Minimal Setup) */}
                    {activeTab === 'BRACKET' && (
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar flex items-center p-8 bg-dark-800/50 rounded-2xl border border-white/5">
                            <div className="flex gap-20 min-w-max">

                                {/* Round 1 */}
                                <div className="flex flex-col justify-around gap-12 w-64">
                                    <div className="glass-panel p-6 border-white/10 hover:border-red-primary/30 transition-colors bg-dark-900 group cursor-pointer relative">
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                            <span className="text-xs font-black uppercase tracking-widest font-orbitron text-gray-400">Team Alpha</span>
                                            <span className="text-sm font-bold opacity-30">2</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest font-orbitron text-gray-600">Team Bravo</span>
                                            <span className="text-sm font-bold opacity-30">0</span>
                                        </div>
                                        <div className="absolute right-0 top-1/2 w-10 h-px bg-white/10 translate-x-full group-hover:bg-red-primary/50 transition-colors" />
                                    </div>
                                    <div className="glass-panel p-6 border-red-highlight/30 bg-dark-900 shadow-[0_0_20px_rgba(255,46,76,0.1)] group cursor-pointer relative">
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-red-primary flex items-center gap-1">
                                            <Radio size={8} className="animate-pulse" />
                                            <span className="text-[7px] font-black uppercase tracking-widest">LIVE</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                            <span className="text-xs font-black uppercase tracking-widest font-orbitron text-white drop-shadow-[0_0_5px_#fff]">Cyber Synd</span>
                                            <span className="text-sm font-bold text-red-highlight">1</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest font-orbitron text-white">Neon Cartel</span>
                                            <span className="text-sm font-bold text-red-highlight">1</span>
                                        </div>
                                        <div className="absolute right-0 top-1/2 w-10 h-px bg-red-highlight translate-x-full shadow-[0_0_10px_#FF2E4C]" />
                                        {/* Vertical Connector */}
                                        <div className="absolute -right-10 bottom-1/2 w-px h-[calc(100%+3rem)] bg-white/10" />
                                    </div>
                                </div>

                                {/* Round 2 */}
                                <div className="flex flex-col justify-center gap-12 w-64 relative">
                                    <div className="absolute -left-10 top-1/2 w-10 h-px bg-white/10" />
                                    <div className="glass-panel p-6 border-white/5 bg-dark-900 group cursor-pointer relative opacity-50">
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                            <span className="text-xs font-black uppercase tracking-widest font-orbitron text-gray-400">Team Alpha</span>
                                            <span className="text-sm font-bold opacity-30">-</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest font-orbitron text-gray-500">TBD</span>
                                            <span className="text-sm font-bold opacity-30">-</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Live Matches List */}
                    {activeTab === 'LIVE MATCHES' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {matches.map((m) => (
                                <div key={m.id} className="glass-panel p-8 border-white/5 bg-dark-800 hover:border-red-primary/30 transition-all group">
                                    <div className="flex justify-between items-center mb-8">
                                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded ${m.status === 'LIVE' ? 'bg-red-highlight/20 border border-red-highlight/40 text-red-highlight shadow-[0_0_15px_rgba(255,46,76,0.3)]' : 'bg-dark-900 border border-white/10 text-gray-500'}`}>
                                            {m.status}
                                        </span>
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-orbitron">{m.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-lg font-black uppercase font-orbitron">{m.p1}</span>
                                        <span className="text-xl font-black text-gray-600">VS</span>
                                        <span className="text-lg font-black uppercase font-orbitron">{m.p2}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Clock size={12} />
                                            <span className="text-[9px] font-bold tracking-widest">{m.time || m.res}</span>
                                        </div>
                                        <button className="text-[9px] font-black uppercase tracking-widest text-red-primary group-hover:text-red-highlight transition-colors flex items-center gap-1">
                                            Spectate <ChevronRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Tournament;
