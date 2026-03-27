import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { audioManager } from '../utils/audioManager';
import { Network, TerminalSquare, Shield, ArrowLeft, Loader2, X, Wifi, Cpu } from 'lucide-react';

const Play: React.FC = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [joinCode, setJoinCode] = useState('');
    const [activeHover, setActiveHover] = useState<'CASUAL' | 'RANKED' | 'LAN' | 'SOLO' | null>(null);
    const [searching, setSearching] = useState<'CASUAL' | 'RANKED' | null>(null);
    const [searchTime, setSearchTime] = useState(0);

    const alias = localStorage.getItem('mafia_operative_alias') || `Operative_${Math.floor(Math.random() * 1000)}`;
    const mmr = parseInt(localStorage.getItem('mafia_mmr') || '1000');

    // Match found listener
    useEffect(() => {
        if (!socket) return;
        const onMatchFound = ({ code }: { code: string }) => {
            audioManager.play('bassHit', 0.8);
            setSearching(null);
            navigate(`/lobby/${code}`);
        };
        socket.on('match_found', onMatchFound);
        return () => { socket.off('match_found', onMatchFound); };
    }, [socket, navigate]);

    // Search timer
    useEffect(() => {
        if (!searching) { setSearchTime(0); return; }
        const t = setInterval(() => setSearchTime(s => s + 1), 1000);
        return () => clearInterval(t);
    }, [searching]);

    const handleQueue = (mode: 'CASUAL' | 'RANKED') => {
        if (!socket) return;
        audioManager.play('bassHit', 0.6);
        setSearching(mode);
        socket.emit('join_queue', { mmr, mode, playerName: alias });
    };

    const handleCancelQueue = () => {
        socket?.emit('leave_queue');
        setSearching(null);
    };

    const handleCreatePrivate = async () => {
        try {
            audioManager.play('bassHit', 0.6);
            const serverUrl = `http://${window.location.hostname}:3005`;
            const res = await fetch(`${serverUrl}/api/lobby/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostName: alias }),
            });
            const data = await res.json();
            if (data.code) {
                localStorage.setItem('mafia_host_code', data.code);
                navigate(`/lobby/${data.code}`);
            }
        } catch {
            localStorage.setItem('mafia_host_code', 'NEW');
            navigate('/lobby/NEW');
        }
    };

    const handleJoin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (joinCode.length === 6) {
            audioManager.play('flip', 0.8);
            localStorage.removeItem('mafia_host_code');
            navigate(`/lobby/${joinCode.toUpperCase()}`);
        }
    };

    const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div className="h-screen w-screen bg-[#050510] relative flex flex-col items-center justify-center overflow-hidden font-michroma">

            {/* ABORT */}
            <motion.button
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2"
            >
                <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Abort</span>
            </motion.button>

            {/* CINEMATIC BG */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-dark-900 to-[#050510] opacity-90" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] transition-all duration-1000 opacity-20 pointer-events-none ${activeHover === 'RANKED' ? 'bg-red-primary/30' : activeHover === 'SOLO' ? 'bg-purple-500/20' : activeHover === 'LAN' ? 'bg-green-500/15' : 'bg-transparent'}`} />
            </div>

            {/* MAIN GRID */}
            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col gap-10 items-center">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h2 className="text-[10px] font-black uppercase tracking-[1em] text-gray-500 mb-4">Select Operation Type</h2>
                    <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 w-full">

                    {/* CASUAL */}
                    <motion.button
                        onMouseEnter={() => setActiveHover('CASUAL')} onMouseLeave={() => setActiveHover(null)}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        onClick={() => handleQueue('CASUAL')}
                        className="group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-7 flex flex-col items-start justify-end hover:bg-white/[0.08] hover:border-blue-500/50 transition-all duration-500 text-left min-h-[240px]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                            <Network size={80} className="text-blue-400" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:from-blue-900/40 transition-all duration-500" />
                        <div className="relative z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2 block">Public</span>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white font-orbitron">Casual</h3>
                            <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-2 leading-relaxed">Unranked, fast queues</p>
                        </div>
                    </motion.button>

                    {/* RANKED */}
                    <motion.button
                        onMouseEnter={() => setActiveHover('RANKED')} onMouseLeave={() => setActiveHover(null)}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        onClick={() => handleQueue('RANKED')}
                        className="group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-7 flex flex-col items-start justify-end hover:bg-white/[0.08] hover:border-red-primary/50 transition-all duration-500 text-left min-h-[240px]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                            <Shield size={80} className="text-red-primary" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:from-red-900/40 transition-all duration-500" />
                        <div className="relative z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-primary mb-2 block">Competitive</span>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white font-orbitron">Ranked</h3>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">MMR-based pairing</p>
                        </div>
                    </motion.button>

                    {/* VS BOTS → navigates to /bots dedicated page */}
                    <motion.button
                        onMouseEnter={() => setActiveHover('SOLO')} onMouseLeave={() => setActiveHover(null)}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        onClick={() => { audioManager.play('flip', 0.5); navigate('/bots'); }}
                        className="group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-7 flex flex-col items-start justify-end hover:bg-white/[0.08] hover:border-purple-500/40 transition-all duration-500 text-left min-h-[240px] col-span-2 md:col-span-1"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                            <Cpu size={80} className="text-purple-400" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:from-purple-900/30 transition-all duration-500" />
                        <div className="relative z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400 mb-2 block">Solo Training</span>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white font-orbitron">vs Bots</h3>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">You vs AI operatives</p>
                        </div>
                    </motion.button>

                    {/* JOIN CODE */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-5 flex items-center col-span-2 transition-all hover:bg-white/[0.05]"
                    >
                        <form onSubmit={handleJoin} className="w-full relative flex items-center">
                            <TerminalSquare className="absolute left-4 text-gray-500 group-focus-within:text-red-highlight transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="ENTER 6-CHAR CODE..."
                                maxLength={6}
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-12 py-5 text-[12px] font-black tracking-[0.4em] uppercase text-center text-white outline-none focus:border-red-highlight/50 transition-all placeholder:text-gray-700 font-orbitron"
                            />
                            <AnimatePresence>
                                {joinCode.length === 6 && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                        type="submit"
                                        className="absolute right-4 bg-red-primary hover:bg-red-highlight text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                                    >Connect</motion.button>
                                )}
                            </AnimatePresence>
                        </form>
                    </motion.div>

                    {/* PRIVATE ROOM */}
                    <motion.button
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        onClick={handleCreatePrivate}
                        className="group rounded-3xl bg-white/[0.03] border border-white/10 p-5 flex flex-col items-center justify-center hover:bg-white/[0.08] hover:border-gray-400/30 transition-all"
                    >
                        <Shield size={22} className="text-gray-400 group-hover:text-white mb-2 transition-colors" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Private Room</span>
                    </motion.button>

                    {/* WIFI PLAY */}
                    <motion.button
                        onMouseEnter={() => setActiveHover('LAN')} onMouseLeave={() => setActiveHover(null)}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        onClick={() => navigate('/lan')}
                        className="group rounded-3xl bg-white/[0.03] border border-white/10 p-5 flex flex-col items-center justify-center hover:bg-white/[0.08] hover:border-green-500/30 transition-all"
                    >
                        <Wifi size={22} className="text-gray-400 group-hover:text-green-400 mb-2 transition-colors" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-green-400 transition-colors">WiFi Play</span>
                    </motion.button>
                </div>
            </div>

            {/* MATCHMAKING OVERLAY */}
            <AnimatePresence>
                {searching && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
                    >
                        <Loader2 size={48} className="text-red-primary animate-spin" />
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-500 mb-2">
                                {searching === 'RANKED' ? 'Ranked Deployment' : 'Public Deployment'}
                            </p>
                            <h2 className="text-3xl font-black uppercase tracking-tighter font-orbitron text-white">Scanning Network...</h2>
                            <p className="text-red-primary font-black font-orbitron text-2xl mt-4">{fmtTime(searchTime)}</p>
                        </div>
                        <button
                            onClick={handleCancelQueue}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-red-primary/50 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                            <X size={16} /> Abort Search
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Play;
