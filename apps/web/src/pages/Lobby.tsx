import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { Player } from '@mafia/shared';
import { Network, Fingerprint, Play, Cpu, ArrowLeft, Hexagon, Copy, Check } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

const Lobby: React.FC = () => {
    const { code: rawCode } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [lobbyCode, setLobbyCode] = useState(rawCode?.toUpperCase() || '');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        const alias = localStorage.getItem('mafia_operative_alias') || `Operative_${Math.floor(Math.random() * 1000)}`;
        const hostCode = localStorage.getItem('mafia_host_code');

        if (hostCode) {
            // This player is the host — emit create_lobby
            const code = hostCode === 'NEW' ? undefined : hostCode;
            localStorage.removeItem('mafia_host_code');
            socket.emit('create_lobby', { playerName: alias, code });

            socket.on('lobby_created', (data: any) => {
                setLobbyCode(data.code);
                setPlayers(data.players);
                setIsHost(true);
                // Update URL without navigation
                window.history.replaceState({}, '', `/lobby/${data.code}`);
            });
        } else {
            // Joiner — emit join_lobby
            socket.emit('join_lobby', { code: rawCode?.toUpperCase(), playerName: alias });
        }

        socket.on('player_joined', (data: any) => {
            setPlayers(data.players || []);
            // Check if we are the host (first player)
            const me = (data.players as Player[]).find(p => p.id === socket.id);
            if (me?.isHost) setIsHost(true);
        });

        socket.on('game_started', ({ code: gameCode }: { code: string }) => {
            audioManager.play('bassHit', 0.8);
            navigate(`/game/${gameCode || lobbyCode}`);
        });

        socket.on('error', (msg: { message: string }) => {
            setError(msg.message);
            setTimeout(() => navigate('/play'), 2500);
        });

        return () => {
            socket.off('lobby_created');
            socket.off('player_joined');
            socket.off('game_started');
            socket.off('error');
        };
    }, [socket, rawCode]);

    const handleStart = () => {
        audioManager.play('flip', 0.8);
        socket?.emit('start_game', { code: lobbyCode });
    };

    const handleBack = () => {
        audioManager.play('flip', 0.5);
        socket?.emit('leave_lobby', { code: lobbyCode });
        navigate('/play');
    };

    const copyCode = () => {
        navigator.clipboard.writeText(lobbyCode).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const numSlots = Math.max(8, players.length);
    const radius = 280;

    return (
        <div className="h-screen w-screen bg-[#050510] relative flex items-center justify-center overflow-hidden font-michroma">

            <button onClick={handleBack} className="absolute top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2">
                <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Disconnect</span>
            </button>

            {/* CINEMATIC BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-[#050510] to-[#050510]" />
                <div className="absolute inset-0 bg-red-primary/5 animate-fog mix-blend-screen" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-primary/5 blur-[150px] pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
            </div>

            {/* ERROR TOAST */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute top-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 bg-red-primary/20 border border-red-primary rounded-2xl text-red-highlight text-[10px] font-black uppercase tracking-widest">
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CIRCULAR SEATING TABLE */}
            <div className="relative z-10 w-[800px] h-[800px] flex items-center justify-center scale-75 md:scale-100">

                {/* CENTRAL CONSOLE */}
                <div className="absolute flex flex-col items-center justify-center w-64 h-64 rounded-full border border-white/5 bg-black/40 shadow-[0_0_50px_rgba(11,15,26,0.9)] z-20 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-highlight/60 mb-2">Proxy Node</span>

                    {/* Clickable code copy */}
                    <button onClick={copyCode} className="flex items-center gap-2 group">
                        <h1 className="text-4xl font-black tracking-tighter uppercase font-orbitron text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:text-red-highlight transition-colors">
                            {lobbyCode || '------'}
                        </h1>
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={14} className="text-gray-600 group-hover:text-white transition-colors" />}
                    </button>

                    <div className="flex items-center gap-2 mt-3 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                        <Network size={12} /> {players.length} / 12 Active
                    </div>

                    <AnimatePresence>
                        {isHost && players.length >= 1 && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                onClick={handleStart}
                                className="absolute -bottom-8 bg-red-primary text-white px-8 py-4 rounded-full font-black tracking-[0.3em] text-[10px] uppercase shadow-[0_0_20px_#FF2E4C] hover:bg-red-highlight hover:shadow-[0_0_30px_#FF2E4C] transition-all flex items-center gap-3"
                            >
                                <Play size={14} /> Deploy
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {!isHost && (
                        <p className="absolute -bottom-10 text-[9px] font-black uppercase tracking-widest text-gray-600">
                            Waiting for host...
                        </p>
                    )}
                </div>

                {/* PLAYER AVATARS (CIRCLE) */}
                {Array.from({ length: numSlots }).map((_, i) => {
                    const player = players[i];
                    const angle = (2 * Math.PI * i) / numSlots;
                    const x = Math.cos(angle - Math.PI / 2) * radius;
                    const y = Math.sin(angle - Math.PI / 2) * radius;

                    return (
                        <motion.div
                            key={player?.id || `empty-${i}`}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            style={{ position: 'absolute', left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, x: '-50%', y: '-50%' }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all duration-500 ${player ? 'bg-[#111827] border-2 border-red-primary shadow-[0_0_20px_rgba(177,18,38,0.4)]' : 'bg-transparent border border-white/5 border-dashed'}`}>
                                {player ? (
                                    <>
                                        <div className="absolute inset-0 rounded-full bg-red-primary/10" />
                                        {player.id.startsWith('bot_')
                                            ? <Cpu size={28} className="text-red-highlight/60" />
                                            : <Fingerprint size={28} className={player.id === socket?.id ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-gray-400'} />
                                        }
                                        <div className="absolute -inset-1 border border-red-highlight/40 rounded-full animate-[spin_6s_linear_infinite]" />
                                    </>
                                ) : (
                                    <Hexagon size={24} className="text-white/10" />
                                )}
                            </div>

                            <div className={`text-center transition-all ${player ? 'opacity-100' : 'opacity-0'}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest font-orbitron drop-shadow-md max-w-[100px] truncate">
                                    {player?.name || ''}
                                </p>
                                {player?.id.startsWith('bot_') && (
                                    <p className="text-[8px] font-black uppercase tracking-widest text-red-primary/60 mt-1">BOT</p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Lobby;
