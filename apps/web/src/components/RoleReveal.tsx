import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '../utils/audioManager';
import { Skull, Shield, Search, Users } from 'lucide-react';

interface RoleRevealProps {
    role: string;
    onComplete: () => void;
}

const ROLE_DATA: Record<string, {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    glow: string;
    ambientColor: string;
    title: string;
    codename: string;
    objective: string;
    ability: string;
}> = {
    MAFIA: {
        icon: Skull,
        color: 'text-red-400',
        bg: 'from-red-950/80 to-black',
        border: 'border-red-500/30',
        glow: 'shadow-[0_0_80px_rgba(239,68,68,0.25)]',
        ambientColor: 'bg-red-600/20',
        title: 'MAFIA',
        codename: 'Shadow Operative',
        objective: 'Eliminate all Villagers before dawn.',
        ability: 'Each night, select one operative to eliminate.',
    },
    DOCTOR: {
        icon: Shield,
        color: 'text-green-400',
        bg: 'from-green-950/70 to-black',
        border: 'border-green-500/30',
        glow: 'shadow-[0_0_80px_rgba(34,197,94,0.2)]',
        ambientColor: 'bg-green-600/15',
        title: 'DOCTOR',
        codename: 'Field Medic',
        objective: 'Keep the villagers alive until the Mafia is exposed.',
        ability: 'Each night, select one operative to protect from elimination.',
    },
    POLICE: {
        icon: Search,
        color: 'text-blue-400',
        bg: 'from-blue-950/70 to-black',
        border: 'border-blue-500/30',
        glow: 'shadow-[0_0_80px_rgba(59,130,246,0.2)]',
        ambientColor: 'bg-blue-600/15',
        title: 'DETECTIVE',
        codename: 'Intelligence Officer',
        objective: 'Identify and expose the Mafia operatives.',
        ability: 'Each night, investigate one operative to learn their allegiance.',
    },
    VILLAGER: {
        icon: Users,
        color: 'text-gray-300',
        bg: 'from-gray-900/60 to-black',
        border: 'border-white/10',
        glow: 'shadow-[0_0_40px_rgba(255,255,255,0.05)]',
        ambientColor: 'bg-white/5',
        title: 'VILLAGER',
        codename: 'Field Operative',
        objective: 'Identify and vote out all Mafia members.',
        ability: 'Participate in public trials to eliminate suspects.',
    },
};

const RoleReveal: React.FC<RoleRevealProps> = ({ role, onComplete }) => {
    const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
    // 0: dark silence, 1: card slides in, 2: role revealed, 3: lore fades in

    const config = ROLE_DATA[role?.toUpperCase()] || ROLE_DATA['VILLAGER'];
    const Icon = config.icon;

    useEffect(() => {
        const run = async () => {
            await new Promise(r => setTimeout(r, 600));
            setPhase(1);
            audioManager.play('flip', 0.7);
            await new Promise(r => setTimeout(r, 900));
            setPhase(2);
            audioManager.play('bassHit', 1.0);
            await new Promise(r => setTimeout(r, 700));
            setPhase(3);
            await new Promise(r => setTimeout(r, 4500));
            onComplete();
        };
        run();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2 } }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
        >
            {/* AMBIENT GLOW */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: phase >= 2 ? 1 : 0, scale: phase >= 2 ? 1 : 0.5 }}
                transition={{ duration: 1.5 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[120px] ${config.ambientColor} pointer-events-none`}
            />

            {/* SCAN LINES */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none mix-blend-overlay" />

            {/* HORIZONTAL SCAN */}
            <motion.div
                initial={{ top: '-2px' }}
                animate={{ top: '102%' }}
                transition={{ duration: 2, delay: 0.5, ease: 'linear' }}
                className="absolute left-0 w-full h-px bg-white/10 pointer-events-none z-50"
            />

            {/* MAIN CARD */}
            <AnimatePresence>
                {phase >= 1 && (
                    <motion.div
                        key="card"
                        initial={{ y: 60, opacity: 0, scale: 0.92 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative w-80 rounded-3xl border bg-gradient-to-b ${config.bg} ${config.border} ${config.glow} overflow-hidden`}
                    >
                        {/* TOP CLASSIFICATION BAR */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">Classified</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Eyes Only</span>
                            </div>
                        </div>

                        {/* ROLE ICON */}
                        <div className="flex flex-col items-center pt-10 pb-6 px-8">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: phase >= 2 ? 1 : 0, rotate: phase >= 2 ? 0 : -180 }}
                                transition={{ type: 'spring', damping: 12, stiffness: 120, delay: 0.1 }}
                                className={`w-28 h-28 rounded-2xl border ${config.border} flex items-center justify-center mb-6 relative`}
                            >
                                <div className={`absolute inset-0 rounded-2xl ${config.ambientColor} blur-sm`} />
                                <Icon size={52} className={`${config.color} relative z-10`} />
                                {/* Corner ticks */}
                                <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${config.border}`} />
                                <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${config.border}`} />
                                <div className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l ${config.border}`} />
                                <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${config.border}`} />
                            </motion.div>

                            {/* ROLE TITLE */}
                            <AnimatePresence>
                                {phase >= 2 && (
                                    <motion.div
                                        key="title"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center"
                                    >
                                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-1">{config.codename}</p>
                                        <h2 className={`text-5xl font-black uppercase tracking-tighter font-orbitron ${config.color}`}>
                                            {config.title}
                                        </h2>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ROLE LORE */}
                        <AnimatePresence>
                            {phase >= 3 && (
                                <motion.div
                                    key="lore"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="px-8 pb-10 flex flex-col gap-5 border-t border-white/5 pt-6"
                                >
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600 mb-2">Objective</p>
                                        <p className="text-[11px] text-gray-300 font-medium leading-relaxed">{config.objective}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600 mb-2">Night Ability</p>
                                        <p className="text-[11px] text-gray-300 font-medium leading-relaxed">{config.ability}</p>
                                    </div>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 1, 0.5, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className={`text-[9px] font-black uppercase tracking-[0.3em] text-center mt-2 ${config.color}`}
                                    >
                                        Tap to Continue
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clicking anywhere dismisses */}
            {phase >= 3 && (
                <button
                    className="absolute inset-0 cursor-pointer bg-transparent border-none w-full h-full focus:outline-none"
                    onClick={onComplete}
                    aria-label="Click to continue"
                    autoFocus
                />
            )}
        </motion.div>
    );
};

export default RoleReveal;
