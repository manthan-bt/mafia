import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { GameState, Role, Player, NightRoundResult } from '@mafia/shared';
import { Skull, Target, Heart, Search, Moon, Sun, Cpu, Fingerprint, ShieldAlert, Shield, Users, Clock, ChevronRight } from 'lucide-react';
import Chat from '../components/Chat';
import RoleReveal from '../components/RoleReveal';
import { audioManager } from '../utils/audioManager';

const ROLE_STYLES: Record<string, { color: string, border: string, bg: string, label: string }> = {
    MAFIA: { color: 'text-red-500', border: 'border-red-500/40', bg: 'bg-red-950/30', label: 'Infiltrator' },
    DOCTOR: { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20', label: 'Bio-Medic' },
    POLICE: { color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/20', label: 'Tactical Recon' },
    VILLAGER: { color: 'text-slate-400', border: 'border-slate-500/20', bg: 'bg-slate-900/10', label: 'Operative' },
};

const Game: React.FC = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
    const [players, setPlayers] = useState<Player[]>([]);
    const [role, setRole] = useState<Role | null>(null);
    const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
    const [showRoleReveal, setShowRoleReveal] = useState(false);
    const [gameOver, setGameOver] = useState<{ winner: string } | null>(null);
    const [nightEvent, setNightEvent] = useState<NightRoundResult | null>(null);
    const [elimination, setElimination] = useState<{ eliminatedId: string | null; voteCounts?: Record<string, number> } | null>(null);
    const [hasActed, setHasActed] = useState(false);
    const [phaseTimer, setPhaseTimer] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const alias = localStorage.getItem('mafia_operative_alias') || 'Operative';

    const startTimer = (seconds: number) => {
        setPhaseTimer(seconds);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setPhaseTimer(t => Math.max(0, t - 1)), 1000);
    };

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('assigned_role', (r: Role) => {
            // Fallback: in case the event arrives after mount
            setRole(r);
            setShowRoleReveal(true);
        });

        socket.on('game_state_changed', ({ gameState: ns, encryptionKey: k, players: updatedPlayers, yourRole: yr }: any) => {
            setGameState(ns);
            if (k) setEncryptionKey(k);
            if (updatedPlayers) setPlayers(updatedPlayers);
            if (ns === GameState.ROLE_REVEAL) {
                // yourRole is baked into the ROLE_REVEAL payload — always works
                if (yr) {
                    setRole(yr as Role);
                }
                setShowRoleReveal(true);
            }
            if (ns === GameState.NIGHT_PHASE) {
                setHasActed(false);
                startTimer(60);
                audioManager.startAmbient('ambientNight', 0.3);
            } else if (ns === GameState.DISCUSSION_PHASE) {
                startTimer(10);
                audioManager.stopAmbient();
            } else if (ns === GameState.VOTING_PHASE) {
                startTimer(30);
                audioManager.startAmbient('tick', 0.2);
            }
        });

        socket.on('player_joined', (l: any) => setPlayers(l.players || []));

        socket.on('night_resolved', (result: NightRoundResult) => {
            setNightEvent(result);
            if (result.deathId) {
                setPlayers(prev => prev.map(p => p.id === result.deathId ? { ...p, isAlive: false } : p));
            }
            setTimeout(() => setNightEvent(null), 5000);
        });

        socket.on('voting_resolved', (data: { eliminatedId: string | null; voteCounts: Record<string, number> }) => {
            setElimination(data);
            if (data.eliminatedId) {
                setPlayers(prev => prev.map(p => p.id === data.eliminatedId ? { ...p, isAlive: false } : p));
            }
            setTimeout(() => setElimination(null), 4000);
        });

        socket.on('game_over', (r: { winner: string }) => {
            audioManager.stopAmbient();
            if (timerRef.current) clearInterval(timerRef.current);
            setGameOver(r);
            socket.emit('game_finished', { code, winner: r.winner });
        });

        return () => {
            socket.off('assigned_role');
            socket.off('game_state_changed');
            socket.off('player_joined');
            socket.off('night_resolved');
            socket.off('voting_resolved');
            socket.off('game_over');
        };
    }, [socket, code]);

    const submitAction = useCallback((targetId: string, actionType: 'KILL' | 'SAVE' | 'INVESTIGATE') => {
        if (hasActed) return;
        setHasActed(true);
        audioManager.play('flip', 0.6);
        socket?.emit('submit_action', {
            code,
            action: { playerId: socket.id, targetId, actionType },
        });
    }, [socket, code, hasActed]);

    const isNight = gameState === GameState.NIGHT_PHASE;
    const isVoting = gameState === GameState.VOTING_PHASE;
    const isDiscussion = gameState === GameState.DISCUSSION_PHASE;
    const me = players.find(p => p.id === socket?.id);
    const alivePlayers = players.filter(p => p.isAlive);
    const deadPlayers = players.filter(p => !p.isAlive);
    const deadPlayer = nightEvent?.deathId ? players.find(p => p.id === nightEvent.deathId) : null;
    const eliminatedPlayer = elimination?.eliminatedId ? players.find(p => p.id === elimination.eliminatedId) : null;

    const phaseLabel = isNight ? 'NIGHTFALL PROTOCOL' : isVoting ? 'TRIBUNAL INITIATED' : isDiscussion ? 'SECURE CHANNEL' : gameState.replace(/_/g, ' ');
    const roleStyle = role ? ROLE_STYLES[role] || ROLE_STYLES.VILLAGER : ROLE_STYLES.VILLAGER;
    const fmtTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div className="h-screen w-screen bg-[#050510] text-[#EAEAEA] flex font-michroma relative overflow-hidden selection:bg-red-500/30">

            {/* ─── ATMOSPHERIC HUD LAYERS ────────────────────── */}
            <div className="crt-overlay" />
            <div className="vignette" />

            <div className="absolute inset-0 z-0 pointer-events-none">
                <AnimatePresence>
                    {isNight ? (
                        <motion.div key="night" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 transition-colors duration-1000">
                            <div className="absolute inset-0 bg-black/95" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-full rounded-full blur-[160px] bg-red-950/30 opacity-60" />
                            <div className="absolute inset-0 bg-red-950/[0.02]" />
                        </motion.div>
                    ) : (
                        <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 transition-colors duration-1000">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510] to-[#080820]" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[180px] bg-cyan-950/20 opacity-40" />
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-soft-light" />
            </div>

            {/* ─── LEFT SIDEBAR: PLAYER LIST ──────────────────── */}
            <aside className="relative z-10 w-64 shrink-0 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-sm">

                {/* GAME STATUS */}
                <div className={`p-4 border-b border-white/5 flex items-center gap-3 ${isNight ? 'bg-red-900/10' : 'bg-white/[0.02]'}`}>
                    <motion.div key={gameState} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${isNight ? 'bg-red-900/40' : 'bg-white/5'}`}>
                        {isNight ? <Moon size={16} className="text-red-400" /> : <Sun size={16} className="text-yellow-400/60" />}
                    </motion.div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600">Phase</p>
                        <p className="text-[10px] font-black uppercase tracking-wide text-white">{phaseLabel}</p>
                    </div>
                    {phaseTimer > 0 && (
                        <div className="ml-auto flex items-center gap-1.5">
                            <Clock size={10} className={phaseTimer < 10 ? 'text-red-400 animate-pulse' : 'text-gray-600'} />
                            <span className={`text-[10px] font-black font-orbitron ${phaseTimer < 10 ? 'text-red-400' : 'text-gray-500'}`}>
                                {fmtTimer(phaseTimer)}
                            </span>
                        </div>
                    )}
                </div>

                {/* MY ROLE */}
                {role && (
                    <div className={`mx-3 mt-3 px-3 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all duration-500 ${roleStyle.color} ${roleStyle.border} ${roleStyle.bg}`}>
                        {role === Role.MAFIA ? <Skull size={12} /> : role === Role.POLICE ? <Search size={12} /> : role === Role.DOCTOR ? <Shield size={12} /> : <Users size={12} />}
                        {roleStyle.label}
                        {me && !me.isAlive && <span className="ml-auto text-red-400/70">DECEASED</span>}
                    </div>
                )}

                {/* NIGHT ACTION STATUS */}
                {isNight && role !== Role.VILLAGER && me?.isAlive && (
                    <div className={`mx-3 mt-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${hasActed ? 'text-green-400/70 bg-green-900/10 border border-green-500/20' : 'text-red-400/80 bg-red-900/15 border border-red-500/20 animate-pulse'}`}>
                        {hasActed ? '✓ Action Sent' : '⚡ Choose Target'}
                    </div>
                )}

                {/* ALIVE PLAYERS */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 mt-2 no-scrollbar">
                    <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/20 mb-1 px-1 flex items-center gap-2">
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        ACTIVE_OPERATIVES [{alivePlayers.length}]
                    </p>
                    {alivePlayers.map((p) => {
                        const isBot = p.id.startsWith('bot_');
                        const isSelf = p.id === socket?.id;
                        return (
                            <div key={p.id}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${isSelf ? 'bg-red-950/10 border-red-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${isSelf ? 'bg-red-950/40 border-red-500/30' : isBot ? 'bg-purple-950/30 border-purple-500/10' : 'bg-white/5 border-white/5'}`}>
                                    {isBot ? <Cpu size={12} className="text-purple-500/50" /> : <Fingerprint size={12} className={isSelf ? 'text-red-500' : 'text-white/20'} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[10px] font-black uppercase tracking-wide truncate ${isSelf ? 'text-red-200' : 'text-white/60'}`}>
                                        {p.name}
                                    </span>
                                    <span className="text-[6px] font-bold text-white/20 tracking-tighter">OS_VER.4.22</span>
                                </div>
                                {isSelf && <div className="ml-auto w-1 h-1 bg-red-500 rounded-full animate-pulse" />}
                            </div>
                        );
                    })}

                    {deadPlayers.length > 0 && (
                        <>
                            <p className="text-[7px] font-black uppercase tracking-[0.4em] text-red-500/30 mt-4 mb-1 px-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-500/30 rounded-full" />
                                TERMINATED [{deadPlayers.length}]
                            </p>
                            {deadPlayers.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-red-950/[0.05] border border-red-500/5 opacity-50">
                                    <Skull size={10} className="text-red-500/40 shrink-0" />
                                    <span className="text-[9px] font-bold uppercase tracking-wide truncate text-red-500/40 line-through">{p.name}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </aside>

            {/* ─── CENTER: ORBITAL TACTICAL BOARD ─────────────── */}
            <main className="flex-1 relative z-10 flex items-center justify-center overflow-hidden">

                {/* NEURAL NETWORK (SVG LAYER) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                        <radialGradient id="line-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={isNight ? '#B11226' : '#22D3EE'} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={isNight ? '#B11226' : '#22D3EE'} stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <AnimatePresence>
                        {alivePlayers.map((p, i) => {
                            const total = players.length;
                            const radius = Math.min(window.innerWidth, window.innerHeight) * 0.28;
                            const angle = (2 * Math.PI * i) / total;
                            const x2 = 50 + (Math.cos(angle - Math.PI / 2) * radius / window.innerWidth * 100);
                            const y2 = 50 + (Math.sin(angle - Math.PI / 2) * radius / window.innerHeight * 100);

                            return (
                                <motion.line
                                    key={`line-${p.id}`}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    x1="50%" y1="50%"
                                    x2={`${x2}%`} y2={`${y2}%`}
                                    stroke="url(#line-grad)"
                                    strokeWidth="1.5"
                                    className="neural-line"
                                />
                            );
                        })}
                    </AnimatePresence>
                </svg>

                {/* PHASE CONTROL CENTER */}
                <motion.div
                    key={gameState}
                    initial={{ y: -40, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    className="absolute top-8 left-1/2 -translate-x-1/2 z-30"
                >
                    <div className={`px-8 py-3 rounded-2xl backdrop-blur-xl border-2 flex flex-col items-center gap-1 min-w-[320px] shadow-2xl relative overflow-hidden ${isNight ? 'border-red-500/40 bg-black/80' : 'border-cyan-500/20 bg-black/60'}`}>
                        <div className={`absolute inset-0 opacity-10 ${isNight ? 'bg-red-500' : 'bg-cyan-500'}`} />
                        <div className="flex items-center gap-3">
                            <motion.div animate={isNight ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}} transition={{ repeat: Infinity, duration: 3 }}>
                                {isNight ? <Moon size={16} className="text-red-500" /> : <Sun size={16} className="text-cyan-400" />}
                            </motion.div>
                            <span className={`text-[12px] font-black uppercase tracking-[0.5em] font-orbitron glitch-text ${isNight ? 'text-red-500' : 'text-cyan-400'}`}>
                                {phaseLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 w-full mt-1">
                            <div className={`h-[1px] flex-1 ${isNight ? 'bg-red-500/20' : 'bg-cyan-500/20'}`} />
                            <span className="text-[10px] font-black font-orbitron text-white/40 tracking-[0.2em]">{fmtTimer(phaseTimer)}</span>
                            <div className={`h-[1px] flex-1 ${isNight ? 'bg-red-500/20' : 'bg-cyan-500/20'}`} />
                        </div>
                    </div>
                </motion.div>

                {/* PLAYER RING */}
                <div className="relative w-full h-full flex items-center justify-center">

                    {/* CENTRAL HUB DISPLAY */}
                    <div className="relative flex flex-col items-center gap-2 z-10 w-48 h-48 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center backdrop-blur-md">
                        <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
                        {isNight && !hasActed && role !== Role.VILLAGER && me?.isAlive ? (
                            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
                                className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500 text-center px-4">
                                SELECT_TARGET
                            </motion.p>
                        ) : (
                            <div className="text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">OPERATIVES</p>
                                <p className="text-3xl font-black font-orbitron text-white/80">{alivePlayers.length}</p>
                                <p className="text-[7px] font-black uppercase tracking-[0.4em] text-emerald-500/60 mt-2">LINK_STABLE</p>
                            </div>
                        )}
                    </div>

                    {players.map((p, i) => {
                        const isBot = p.id.startsWith('bot_');
                        const total = players.length;
                        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.28;
                        const angle = (2 * Math.PI * i) / total;
                        const x = Math.cos(angle - Math.PI / 2) * radius;
                        const y = Math.sin(angle - Math.PI / 2) * radius;
                        const isSelf = p.id === socket?.id;
                        const canKill = isNight && p.isAlive && !isSelf && role === Role.MAFIA && !hasActed;
                        const canSave = isNight && p.isAlive && role === Role.DOCTOR && !hasActed;
                        const canInvest = isNight && p.isAlive && !isSelf && role === Role.POLICE && !hasActed;
                        const canVote = isVoting && p.isAlive && !isSelf;

                        return (
                            <motion.div
                                key={p.id}
                                initial={false}
                                animate={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                                style={{ position: 'absolute', x: '-50%', y: '-50%' }}
                                className="group z-20"
                            >
                                {/* IDENTITY BADGE */}
                                <div className={`relative w-24 h-32 rounded-lg flex flex-col items-center justify-between p-2 border transition-all duration-500 overflow-hidden identity-badge-glow ${!p.isAlive ? 'dead-glitch grayscale' : isSelf ? 'identity-badge-active border-red-500/50 bg-red-950/20 shadow-red-500/20 shadow-lg' : 'bg-[#0E0E1C]/80 border-white/10 group-hover:border-cyan-500/40 group-hover:shadow-cyan-500/10 group-hover:shadow-xl'}`}>

                                    {/* Badge Header: ID & Indicators */}
                                    <div className="w-full flex justify-between items-center text-[6px] font-black font-orbitron text-white/20 px-1 pt-1">
                                        <span>ID_{p.id.slice(0, 4).toUpperCase()}</span>
                                        <div className="flex gap-1">
                                            <div className={`w-1 h-1 rounded-full ${p.isAlive ? 'bg-emerald-500/40' : 'bg-red-500/40'}`} />
                                            {isBot && <Cpu size={8} className="text-purple-500/40" />}
                                        </div>
                                    </div>

                                    {/* Scanline Texture */}
                                    <div className="absolute inset-0 badge-scanline opacity-10 pointer-events-none" />

                                    {/* Main Avatar Area */}
                                    <div className="relative py-3">
                                        <div className={`absolute inset-0 blur-xl opacity-20 ${isSelf ? 'bg-red-500' : 'bg-cyan-500'}`} />
                                        <div className={`p-3 rounded-full border ${isSelf ? 'border-red-500/40 bg-red-500/5' : 'border-white/5 bg-white/5'}`}>
                                            {!p.isAlive ? <Skull size={28} className="text-red-500" /> : <Fingerprint size={28} className={isSelf ? 'text-red-400' : 'text-white/40 group-hover:text-cyan-400'} />}
                                        </div>
                                    </div>

                                    {/* Operative Info Footer */}
                                    <div className="w-full bg-black/40 p-2 rounded border border-white/5 flex flex-col items-center">
                                        <p className={`text-[8px] font-black uppercase tracking-widest truncate w-full text-center ${isSelf ? 'text-red-400' : 'text-white/60 group-hover:text-white'}`}>
                                            {p.name}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            <div className="w-3 h-[1px] bg-white/10" />
                                            <div className="w-1 h-[1px] bg-white/20" />
                                            <div className="w-3 h-[1px] bg-white/10" />
                                        </div>
                                    </div>

                                    {/* TACTICAL OVERLAYS (INTEGRATED) */}
                                    <AnimatePresence>
                                        {(canKill || canSave || canInvest || canVote) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="absolute inset-0 z-40 flex items-center justify-center p-2"
                                            >
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                                                {canKill && (
                                                    <button onClick={() => submitAction(p.id, 'KILL')}
                                                        className="z-50 flex flex-col items-center gap-1 group/btn">
                                                        <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center bg-red-500/10 group-hover/btn:bg-red-500 group-hover/btn:scale-110 transition-all">
                                                            <Target size={24} className="text-red-500 group-hover/btn:text-white" />
                                                        </div>
                                                        <span className="text-[6px] font-black text-red-500 uppercase tracking-widest">ELIMINATE</span>
                                                    </button>
                                                )}
                                                {canSave && (
                                                    <button onClick={() => submitAction(p.id, 'SAVE')}
                                                        className="z-50 flex flex-col items-center gap-1 group/btn">
                                                        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10 group-hover/btn:bg-emerald-500 group-hover/btn:scale-110 transition-all">
                                                            <Heart size={24} className="text-emerald-500 group-hover/btn:text-white" />
                                                        </div>
                                                        <span className="text-[6px] font-black text-emerald-500 uppercase tracking-widest">SHIELD</span>
                                                    </button>
                                                )}
                                                {canInvest && (
                                                    <button onClick={() => submitAction(p.id, 'INVESTIGATE')}
                                                        className="z-50 flex flex-col items-center gap-1 group/btn">
                                                        <div className="w-12 h-12 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-cyan-500/10 group-hover/btn:bg-cyan-500 group-hover/btn:scale-110 transition-all">
                                                            <Search size={24} className="text-cyan-500 group-hover/btn:text-white" />
                                                        </div>
                                                        <span className="text-[6px] font-black text-cyan-500 uppercase tracking-widest">DECRYPT</span>
                                                    </button>
                                                )}
                                                {canVote && (
                                                    <button onClick={() => { audioManager.play('flip', 0.5); socket?.emit('submit_vote', { code, targetId: p.id }); }}
                                                        className="z-50 flex flex-col items-center gap-1 group/btn">
                                                        <div className="w-12 h-12 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-yellow-500/10 group-hover/btn:bg-yellow-500 group-hover/btn:scale-110 transition-all">
                                                            <Fingerprint size={24} className="text-yellow-500 group-hover/btn:text-white" />
                                                        </div>
                                                        <span className="text-[6px] font-black text-yellow-500 uppercase tracking-widest">ACCUSE</span>
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* STATUS INDICATORS (DEATH/ROLE) */}
                                {!p.isAlive && (
                                    <div className="absolute -top-2 -right-2 bg-red-600 p-1.5 rounded-lg border border-red-400/50 shadow-xl z-50 animate-pulse">
                                        <Skull size={10} className="text-white" />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* ─── RIGHT SIDEBAR: SECURE COMMS TERMINAL ──────── */}
            <aside className="relative z-10 w-80 shrink-0 flex flex-col border-l border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="p-5 border-b border-white/10 flex flex-col gap-2 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Neural Uplink</span>
                        <div className="ml-auto flex items-center gap-1 opacity-30">
                            <div className="w-1 h-2 bg-white/40" />
                            <div className="w-1 h-3 bg-white/40" />
                            <div className="w-1 h-1 bg-white/40" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-h-0 relative">
                    {/* Terminal background texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
                    {code && (
                        <Chat
                            lobbyCode={code}
                            encryptionKey={encryptionKey || ''}
                            playerName={alias}
                        />
                    )}
                </div>
            </aside>

            {/* ─── NIGHT RESOLVED OVERLAY ─────────────────────── */}
            <AnimatePresence>
                {nightEvent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none backdrop-blur-2xl bg-black/80">

                        <div className="crt-overlay opacity-30" />

                        <motion.div initial={{ scale: 0.9, y: 40, rotateX: 20 }} animate={{ scale: 1, y: 0, rotateX: 0 }}
                            className={`text-center relative max-w-lg w-full p-16 rounded-[40px] border-4 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden ${nightEvent.deathId ? 'bg-red-950/20 border-red-500/40' : 'bg-emerald-950/20 border-emerald-500/30'}`}>

                            {/* Scanning line */}
                            <div className={`absolute top-0 left-0 w-full h-1 animate-scan ${nightEvent.deathId ? 'bg-red-500/50' : 'bg-emerald-500/50'}`} />

                            {nightEvent.deathId ? (
                                <>
                                    <div className="relative mb-8">
                                        <Skull size={80} className="text-red-500 mx-auto drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
                                        <div className="absolute inset-0 text-red-500 animate-pulse opacity-20">
                                            <Skull size={80} className="mx-auto" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-500/60 mb-4">Flatlined / Deceased</p>
                                    <h2 className="text-6xl font-black uppercase tracking-tighter font-orbitron text-white mt-2 glitch-text">{deadPlayer?.name}</h2>
                                    <div className="mt-8 flex items-center justify-center gap-4">
                                        <div className="h-[1px] w-12 bg-red-500/30" />
                                        <span className="text-[11px] text-red-400 font-bold uppercase tracking-[0.3em]">{deadPlayer?.role || 'NEURAL GHOST'}</span>
                                        <div className="h-[1px] w-12 bg-red-500/30" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ShieldAlert size={80} className="text-emerald-400 mx-auto mb-8 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-500/60 mb-4">Neural Integrity Stable</p>
                                    <h2 className="text-5xl font-black uppercase tracking-tighter font-orbitron text-white mt-2">Zero Casualties</h2>
                                    <p className="text-[11px] text-emerald-400/60 mt-6 font-black uppercase tracking-widest">Awaiting Dawn Synthesis...</p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── VOTING RESOLVED OVERLAY ────────────────────── */}
            <AnimatePresence>
                {elimination && !isVoting && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none backdrop-blur-3xl bg-black/70">

                        <div className="crt-overlay opacity-20" />

                        <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }}
                            className="text-center relative max-w-xl w-full p-20 rounded-[50px] border-2 border-white/10 bg-black/95 shadow-2xl overflow-hidden">

                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-24" />

                            {elimination.eliminatedId ? (
                                <>
                                    <div className="w-20 h-[2px] bg-yellow-500/40 mx-auto mb-8" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.8em] text-white/30 mb-4">Tribunal Execution</p>
                                    <h2 className="text-7xl font-black uppercase tracking-tighter font-orbitron text-white mt-2 glitch-text">{eliminatedPlayer?.name}</h2>
                                    <p className="text-[12px] text-yellow-500/80 mt-8 font-black uppercase tracking-[0.4em]">Identity Confirmed: {eliminatedPlayer?.role}</p>
                                    <div className="w-20 h-[2px] bg-yellow-500/40 mx-auto mt-8" />
                                </>
                            ) : (
                                <>
                                    <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white/20 mb-6">Consensus Not Reached</p>
                                    <h2 className="text-5xl font-black uppercase tracking-tighter font-orbitron text-white/80 mt-2">Tribunal Stalled</h2>
                                    <p className="text-[11px] text-white/40 mt-8 font-black uppercase tracking-widest">Protocol Resuming...</p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── ROLE REVEAL ────────────────────────────────── */}
            <AnimatePresence>
                {showRoleReveal && role && (
                    <RoleReveal role={role} onComplete={() => setShowRoleReveal(false)} />
                )}
            </AnimatePresence>

            {/* ─── GAME OVER: MISSION TERMINATION ────────────── */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl bg-black/98 relative overflow-hidden">

                        <div className="crt-overlay opacity-40" />
                        <div className={`absolute inset-0 opacity-10 animate-blood-pulse ${gameOver.winner === 'MAFIA' ? 'bg-red-500' : 'bg-emerald-500'}`} />

                        <div className="text-center max-w-4xl w-full z-10">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
                                <p className="text-[12px] font-black uppercase tracking-[1em] text-white/30 mb-8">Mission Outcome: Finalized</p>
                                <h2 className={`text-9xl font-black uppercase tracking-tighter font-orbitron mb-4 drop-shadow-[0_0_50px_rgba(0,0,0,1)] glitch-text ${gameOver.winner === 'MAFIA' ? 'text-red-600' : 'text-emerald-500'}`}>
                                    {gameOver.winner === 'MAFIA' ? 'NET_CORRUPTED' : 'CITY_SAVED'}
                                </h2>
                                <p className={`text-2xl font-black uppercase tracking-[0.5em] mb-12 ${gameOver.winner === 'MAFIA' ? 'text-red-400/60' : 'text-emerald-400/60'}`}>
                                    {gameOver.winner} VICTORY
                                </p>
                            </motion.div>

                            <div className={`h-1 w-full max-w-2xl mx-auto mb-16 relative ${gameOver.winner === 'MAFIA' ? 'bg-red-600/20' : 'bg-emerald-600/20'}`}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className={`absolute inset-0 ${gameOver.winner === 'MAFIA' ? 'bg-red-600' : 'bg-emerald-500'} shadow-[0_0_20px_rgba(255,255,255,0.4)]`}
                                />
                            </div>

                            <div className="flex gap-6 justify-center">
                                <button onClick={() => navigate('/bots')}
                                    className="px-12 py-5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-white font-black uppercase tracking-widest text-[11px] transition-all duration-300 active:scale-95 holographic-border">
                                    NEW OPERATION
                                </button>
                                <button onClick={() => navigate('/')}
                                    className="px-12 py-5 rounded-xl border border-white/5 text-white/30 hover:text-white font-black uppercase tracking-widest text-[11px] transition-all duration-300">
                                    DISCONNECT
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Game;
