import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { audioManager } from '../utils/audioManager';
import {
    ArrowLeft, Cpu, Play, ChevronRight,
    Zap, Brain, Target, Shield, Heart, Search, Users
} from 'lucide-react';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface DifficultyInfo {
    label: string;
    description: string;
    color: string;
    borderColor: string;
    glowColor: string;
    icon: React.ReactNode;
    traits: string[];
}

const DIFFICULTIES: Record<Difficulty, DifficultyInfo> = {
    EASY: {
        label: 'Recruit',
        description: 'Bots make random decisions. Good for learning the game.',
        color: 'text-green-400',
        borderColor: 'border-green-500/40',
        glowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]',
        icon: <Zap size={20} className="text-green-400" />,
        traits: ['Random targeting', 'Slow voting', 'Poor deception'],
    },
    MEDIUM: {
        label: 'Operative',
        description: 'Bots use basic strategy. Focused targeting during night.',
        color: 'text-yellow-400',
        borderColor: 'border-yellow-500/40',
        glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
        icon: <Brain size={20} className="text-yellow-400" />,
        traits: ['Strategic kills', 'Coordinated voting', 'Basic bluffing'],
    },
    HARD: {
        label: 'Elite',
        description: 'Bots play near-optimally. Expect surgical precision.',
        color: 'text-red-highlight',
        borderColor: 'border-red-primary/50',
        glowColor: 'shadow-[0_0_20px_rgba(177,18,38,0.25)]',
        icon: <Target size={20} className="text-red-highlight" />,
        traits: ['Optimal targeting', 'Vote manipulation', 'Advanced deception'],
    },
};

const ROLE_RULES: { icon: React.ReactNode; role: string; count: (n: number) => string }[] = [
    { icon: <Target size={14} className="text-red-primary" />, role: 'Mafia', count: (n) => `${Math.floor(n / 4)}` },
    { icon: <Search size={14} className="text-blue-400" />, role: 'Detective', count: () => '1' },
    { icon: <Heart size={14} className="text-green-400" />, role: 'Doctor', count: () => '1' },
    { icon: <Shield size={14} className="text-gray-400" />, role: 'Villager', count: (n) => `${n - Math.floor(n / 4) - 2}` },
];

const BotTraining: React.FC = () => {
    const navigate = useNavigate();
    const socket = useSocket();

    const [botCount, setBotCount] = useState(7);     // 7 bots + 1 human = 8 total
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [launching, setLaunching] = useState(false);

    const totalPlayers = botCount + 1;
    const alias = localStorage.getItem('mafia_operative_alias') || `Operative_${Math.floor(Math.random() * 1000)}`;

    // Listen for role assignment while on this page (in case game_started arrives late)
    useEffect(() => {
        if (!socket) return;
        const onGameStarted = ({ code }: { code: string }) => {
            setLaunching(false);
            navigate(`/game/${code}`);
        };
        socket.on('game_started', onGameStarted);
        return () => { socket.off('game_started', onGameStarted); };
    }, [socket, navigate]);

    const handleLaunch = () => {
        if (!socket || launching) return;
        audioManager.play('bassHit', 0.8);
        setLaunching(true);

        // Emit with acknowledgement callback — server replies with { code } immediately
        (socket as any).emit('start_solo_game', { playerName: alias, botCount, difficulty }, (ack: { code: string } | null) => {
            if (ack?.code) {
                navigate(`/game/${ack.code}`);
            } else {
                // Fallback: server may not support ack yet — wait for game_started event
                setTimeout(() => setLaunching(false), 5000);
            }
        });
    };

    const diff = DIFFICULTIES[difficulty];

    return (
        <div className="min-h-screen w-screen bg-[#050510] text-white font-michroma relative overflow-hidden">

            {/* BG */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
                <div className={`absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[160px] opacity-10 transition-all duration-700 ${difficulty === 'EASY' ? 'bg-green-500' : difficulty === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-primary'}`} />
            </div>

            {/* BACK */}
            <motion.button
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/play')}
                className="fixed top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2"
            >
                <ArrowLeft size={22} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Back</span>
            </motion.button>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 flex flex-col gap-10">

                {/* TITLE */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Cpu size={28} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-purple-400">Solo Training Ground</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-orbitron">vs Bots</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-4">
                        Practice your deception and deduction against AI operatives
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* LEFT COLUMN: Settings */}
                    <div className="flex flex-col gap-5">

                        {/* DIFFICULTY */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
                            className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3 mb-1">
                                <Brain size={16} className="text-gray-500" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">AI Difficulty</h2>
                            </div>
                            <div className="flex flex-col gap-2">
                                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
                                    const info = DIFFICULTIES[d];
                                    const active = difficulty === d;
                                    return (
                                        <button key={d} onClick={() => setDifficulty(d)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${active ? `${info.borderColor} bg-white/[0.05] ${info.glowColor}` : 'border-white/5 hover:border-white/10 hover:bg-white/[0.03]'}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-white/10' : 'bg-white/5'}`}>
                                                {info.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${active ? info.color : 'text-gray-400'}`}>{info.label}</span>
                                                    {active && <ChevronRight size={12} className={info.color} />}
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mt-0.5 leading-relaxed">{info.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* BOT TRAITS */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}
                            className={`rounded-3xl border p-5 flex flex-col gap-3 transition-all duration-500 ${diff.borderColor} bg-white/[0.02]`}>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Bot Behaviour at {diff.label}</p>
                            {diff.traits.map((t) => (
                                <div key={t} className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${difficulty === 'EASY' ? 'bg-green-400' : difficulty === 'MEDIUM' ? 'bg-yellow-400' : 'bg-red-primary'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">{t}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Players + Preview */}
                    <div className="flex flex-col gap-5">

                        {/* PLAYER COUNT */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
                            className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <Users size={16} className="text-gray-500" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Number of Bots</h2>
                            </div>

                            {/* Slider */}
                            <div className="flex flex-col gap-3">
                                <input
                                    type="range" min={5} max={14} value={botCount}
                                    onChange={(e) => setBotCount(Number(e.target.value))}
                                    className="w-full accent-purple-500 cursor-pointer h-1.5"
                                />
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-600">
                                    <span>Min 6</span>
                                    <span className="text-purple-400 text-sm font-black font-orbitron">{totalPlayers} players</span>
                                    <span>Max 15</span>
                                </div>
                            </div>

                            {/* Dot grid — you + bots */}
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: totalPlayers }).map((_, i) => (
                                    <div key={i} title={i === 0 ? 'You' : `Bot ${i}`}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[8px] font-black transition-all ${i === 0
                                            ? 'bg-white/20 border border-white/40 text-white shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                                            : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'}`}>
                                        {i === 0 ? '👤' : <Cpu size={10} />}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                                <span className="text-white">1</span> human · <span className="text-purple-400">{botCount}</span> bots
                            </p>
                        </motion.div>

                        {/* ROLE BREAKDOWN PREVIEW */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}
                            className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 flex flex-col gap-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Estimated Role Split</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {ROLE_RULES.map(({ icon, role, count }) => (
                                    <div key={role} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
                                        {icon}
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{role}</p>
                                            <p className="text-lg font-black font-orbitron text-white">{count(totalPlayers)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* LAUNCH BUTTON */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                            onClick={handleLaunch}
                            disabled={launching}
                            className={`relative overflow-hidden w-full py-6 rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 ${launching
                                ? 'border border-purple-500/20 text-purple-400/50 cursor-wait'
                                : 'bg-purple-500/10 border border-purple-500/40 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/70 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]'}`}
                        >
                            {/* Animated shimmer on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />

                            <AnimatePresence mode="wait">
                                {launching ? (
                                    <motion.span key="launching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-3">
                                        <Cpu size={18} className="animate-spin" /> Deploying AI Operatives...
                                    </motion.span>
                                ) : (
                                    <motion.span key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-3">
                                        <Play size={18} /> Deploy Solo Mission
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotTraining;
