import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Lock, CheckCircle, Star, Zap, ChevronRight, Gem, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { audioManager } from '../utils/audioManager';

const BattlePass: React.FC = () => {
    const navigate = useNavigate();
    // Current user level to determine state
    const currentLevel = 4;
    const isPremium = false;

    // Generate mock tier data
    const tiers = Array.from({ length: 15 }, (_, i) => {
        const level = i + 1;
        const state = level < currentLevel ? 'CLAIMED' : level === currentLevel ? 'UNLOCKED' : 'LOCKED';
        return {
            level,
            state,
            free: { type: 'Currency', amount: 100, icon: Star },
            premium: { type: level % 5 === 0 ? 'Cosmetic' : 'Currency', amount: level % 5 === 0 ? 'Skin' : 500, icon: level % 5 === 0 ? Shield : Gem }
        };
    });

    const getTileStateClass = (state: string, isPremiumTile: boolean) => {
        if (state === 'LOCKED') return 'opacity-30 grayscale border-white/5 bg-dark-900';
        if (state === 'CLAIMED') return 'border-red-primary/30 bg-red-primary/5 opacity-50';
        // UNLOCKED
        if (isPremiumTile && !isPremium) return 'border-white/10 bg-dark-800 relative overflow-hidden group hover:border-red-highlight/50 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]';
        return 'border-red-highlight bg-dark-800 shadow-[0_0_20px_rgba(255,46,76,0.3)] relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,46,76,0.5)] transition-all';
    };

    return (
        <div className="h-screen w-screen bg-[#050510] text-white font-michroma relative overflow-hidden flex flex-col">

            {/* --- CINEMATIC BACKGROUND --- */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-dark-900 to-[#050510] opacity-95" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[130px] bg-red-900/10 opacity-30 pointer-events-none" />
            </div>

            {/* --- BACK NAVIGATION --- */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => { audioManager.play('flip', 0.5); navigate('/'); }}
                className="absolute top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2"
            >
                <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Abort</span>
            </motion.button>

            <div className="relative z-10 p-6 md:p-10 flex flex-col gap-10 max-w-[100vw] mx-auto flex-1 overflow-hidden pt-20">

                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 shrink-0 relative z-10 max-w-7xl mx-auto w-full">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded bg-red-primary/20 border border-red-highlight/30 text-[9px] font-black uppercase tracking-[0.4em] text-red-highlight shadow-[0_0_15px_rgba(255,46,76,0.2)] flex items-center gap-2">
                                <Zap size={10} className="animate-pulse" /> Season 4
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-orbitron text-white">Elite Operation</h1>
                    </div>

                    <div className="glass-panel px-8 py-4 border-red-highlight/30 bg-red-highlight/5 flex items-center gap-6 shadow-[0_0_20px_rgba(177,18,38,0.2)]">
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-primary leading-none mb-1">Season Ends In</span>
                            <span className="text-xl font-black font-orbitron text-white leading-none">14D 08H</span>
                        </div>
                        <Clock className="text-red-highlight" size={24} />
                    </div>
                </header>

                {/* --- PROGRESSION TRACK --- */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-6 relative w-full pt-10">
                    <div className="flex gap-4 min-w-max pl-6 pr-12 relative h-full items-center">

                        {/* Background Progress Line */}
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-dark-900 -translate-y-1/2 z-0 border-y border-white/5" />
                        <div
                            className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-red-secondary to-red-highlight -translate-y-1/2 z-0 shadow-[0_0_15px_#FF2E4C] transition-all duration-1000"
                            style={{ width: `${(currentLevel / 15) * 100}%` }}
                        />

                        {/* Tiers Container */}
                        <div className="flex gap-6 relative z-10">
                            {tiers.map((tier) => (
                                <div key={tier.level} className="flex flex-col gap-12 items-center w-36 shrink-0 relative">

                                    {/* Center Node */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black z-20 transition-all ${tier.state === 'CLAIMED' ? 'bg-red-primary text-white border-none' : tier.state === 'UNLOCKED' ? 'bg-dark-900 border-2 border-red-highlight text-red-highlight shadow-[0_0_20px_#FF2E4C]' : 'bg-dark-900 border-2 border-white/10 text-gray-600'}`}>
                                            {tier.state === 'CLAIMED' ? <CheckCircle size={14} /> : tier.level}
                                        </div>
                                    </div>

                                    {/* Premium Track (Top) */}
                                    <div className={`w-full p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all h-36 ${getTileStateClass(tier.state, true)}`}>
                                        {tier.state === 'UNLOCKED' && !isPremium && (
                                            <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center group-hover:bg-dark-900/60 transition-colors">
                                                <Lock size={16} className="text-red-highlight mb-1" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-red-primary">Premium</span>
                                            </div>
                                        )}
                                        {tier.state === 'UNLOCKED' && isPremium && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-red-highlight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}

                                        <tier.premium.icon size={32} className={tier.level % 5 === 0 ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'text-gray-400'} />
                                        <div className="text-center">
                                            <span className="block text-[8px] font-black uppercase tracking-widest text-gray-500">{tier.premium.type}</span>
                                            <span className="block text-sm font-black font-orbitron">{tier.premium.amount}</span>
                                        </div>

                                        {tier.state === 'CLAIMED' && (
                                            <div className="absolute top-2 right-2">
                                                <CheckCircle size={12} className="text-red-primary" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Free Track (Bottom) */}
                                    <div className={`w-full p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all h-36 ${getTileStateClass(tier.state, false)}`}>
                                        {tier.state === 'UNLOCKED' && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-red-highlight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}

                                        <tier.free.icon size={28} className="text-gray-400" />
                                        <div className="text-center">
                                            <span className="block text-[8px] font-black uppercase tracking-widest text-gray-500">{tier.free.type}</span>
                                            <span className="block text-sm font-black font-orbitron">{tier.free.amount}</span>
                                        </div>

                                        {tier.state === 'CLAIMED' && (
                                            <div className="absolute top-2 right-2">
                                                <CheckCircle size={12} className="text-red-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- UPGRADE CTA --- */}
                <div className="shrink-0 flex justify-center py-6 mt-auto">
                    <button className="btn-premium px-12 py-5 text-sm tracking-widest flex items-center gap-4 group">
                        <Gem size={18} className="text-white group-hover:animate-pulse" />
                        Acquire Premium Access
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BattlePass;
