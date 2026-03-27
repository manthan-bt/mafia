import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Monitor, Shield, Radio, ArrowLeft, Sliders, Zap, Fingerprint, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { audioManager } from '../utils/audioManager';

const Settings: React.FC = () => {
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        audioManager.play('flip', 0.5);
        navigate(path);
    };

    return (
        <div className="min-h-screen w-screen bg-[#050510] text-white font-michroma p-6 md:p-10 relative overflow-y-auto custom-scrollbar flex flex-col items-center">

            {/* --- CINEMATIC BACKGROUND --- */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-1000 fixed">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-dark-900 to-[#050510] opacity-90 transition-all duration-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] transition-all bg-gray-500/5 opacity-20 pointer-events-none" />
            </div>

            {/* --- BACK NAVIGATION --- */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleNavigation('/')}
                className="absolute top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2 fixed"
            >
                <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Abort</span>
            </motion.button>

            {/* --- HEADER --- */}
            <header className="flex flex-col items-center mt-12 mb-10 relative z-10 w-full max-w-6xl">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-gray-500 mb-4">System Configuration</h2>
                    <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>
            </header>

            {/* --- BENTO GRID SELECTION MATRIX --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl relative z-10 pb-20">

                {/* ACCOUNT CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="col-span-1 lg:col-span-2 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col transition-all duration-500 min-h-[250px] hover:bg-white/[0.05] hover:border-gray-500/30"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <Fingerprint size={24} className="text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white font-orbitron">Operative Identity</h3>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Account Control</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-auto">
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-black/40 border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-widest text-white">Callsign</span>
                                <span className="text-[9px] uppercase tracking-widest text-gray-500">Public Identifier</span>
                            </div>
                            <span className="text-lg font-black font-orbitron text-red-highlight">Shadow_01</span>
                        </div>

                        <div className="flex md:flex-row flex-col gap-4">
                            <button className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex justify-center items-center gap-2">
                                <Globe size={14} /> Link Intel Network
                            </button>
                            <button className="flex-1 px-4 py-3 bg-red-primary/10 hover:bg-red-primary/20 text-red-highlight text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-primary/20 flex justify-center items-center gap-2">
                                <Lock size={14} /> Reset Clearance Code
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* NOTIFICATIONS CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="col-span-1 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col transition-all duration-500 min-h-[250px] hover:bg-white/[0.05] hover:border-blue-500/30"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Radio size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white font-orbitron">Comms</h3>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Pings & Alerts</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-auto">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Global Matchmaking</span>
                            <button className="w-12 h-6 rounded-full p-1 bg-blue-500 transition-all">
                                <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Direct Messages</span>
                            <button className="w-12 h-6 rounded-full p-1 bg-white/10 transition-all">
                                <div className="w-4 h-4 rounded-full bg-white translate-x-0" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Phase Transition SFX</span>
                            <button className="w-12 h-6 rounded-full p-1 bg-blue-500 transition-all">
                                <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* AUDIO CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="col-span-1 lg:col-span-1 xl:col-span-1 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col transition-all duration-500 min-h-[250px] hover:bg-white/[0.05] hover:border-white/30"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <Volume2 size={24} className="text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white font-orbitron">Audio</h3>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Output Levels</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 mt-auto">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Master Level</span>
                                <span className="text-[10px] font-black text-gray-500">80%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-[80%]" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">BGM Volume</span>
                                <span className="text-[10px] font-black text-gray-500">40%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-[40%]" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* DISPLAY FIXTURES CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="col-span-1 lg:col-span-2 xl:col-span-2 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col transition-all duration-500 min-h-[250px] hover:bg-white/[0.05] hover:border-red-primary/50"
                >
                    <div className="absolute top-0 right-10 p-4 opacity-10 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 pointer-events-none mix-blend-screen">
                        <Monitor size={180} className="text-red-primary" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent group-hover:from-red-900/10 transition-all duration-500 pointer-events-none" />

                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-red-primary/10 flex items-center justify-center border border-red-primary/20 shadow-[0_0_15px_rgba(177,18,38,0.3)]">
                            <Sliders size={24} className="text-red-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white font-orbitron">Visuals</h3>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-primary">Rendering Control</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-auto relative z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Hardware Acceleration</span>
                            <button className="w-12 h-6 rounded-full p-1 bg-red-primary shadow-[0_0_10px_#B11226] transition-all">
                                <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Phase Change VFX</span>
                            <button className="w-12 h-6 rounded-full p-1 bg-red-primary shadow-[0_0_10px_#B11226] transition-all">
                                <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Cinematic Noise</span>
                            <button className="w-12 h-6 rounded-full p-1 bg-red-primary shadow-[0_0_10px_#B11226] transition-all">
                                <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Minimal HUD</span>
                            <button className="w-12 h-6 rounded-full p-1 bg-white/10 transition-all">
                                <div className="w-4 h-4 rounded-full bg-white translate-x-0" />
                            </button>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* --- APPLY PARAMETERS BAR --- */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-40 pointer-events-none flex justify-center">
                <button className="pointer-events-auto btn-premium px-16 py-4 text-xs font-black tracking-widest flex items-center gap-3">
                    <Zap size={14} /> Synchronize Subroutines
                </button>
            </motion.div>
        </div>
    );
};

export default Settings;
