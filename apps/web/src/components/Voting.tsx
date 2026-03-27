import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Skull, Check, UserX, AlertTriangle } from 'lucide-react';
import { Player } from '@mafia/shared';

interface VotingProps {
    players: Player[];
    onSubmit: (targetId: string) => void;
}

const Voting: React.FC<VotingProps> = ({ players, onSubmit }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleConfirm = () => {
        if (selectedId) {
            onSubmit(selectedId);
            setSubmitted(true);
        }
    };

    return (
        <div className="flex flex-col gap-16 w-full">
            <header className="text-center">
                <p className="heading-section tracking-[1.5em] mb-4">Mandate Verification</p>
                <h2 className="text-7xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">Termination</h2>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {players.filter(p => p.isAlive).map((p) => (
                    <motion.button
                        key={p.id}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => !submitted && setSelectedId(p.id)}
                        disabled={submitted}
                        className={`glass-panel p-10 flex flex-col items-center gap-6 transition-all duration-500 relative overflow-hidden group ${selectedId === p.id
                            ? 'border-accent-red bg-accent-red/[0.05] shadow-[0_0_50px_rgba(220,38,38,0.15)]'
                            : 'border-white/5 opacity-40 hover:opacity-100'
                            }`}
                    >
                        <div className={`w-16 h-16 rounded-full glass-card flex items-center justify-center border-white/10 group-hover:border-accent-red transition-all ${selectedId === p.id ? 'bg-accent-red border-none' : ''}`}>
                            {selectedId === p.id ? <UserX size={28} /> : <Target size={24} className="opacity-20" />}
                        </div>

                        <div className="text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mb-2 italic">Subject</p>
                            <h3 className={`text-sm font-black uppercase tracking-widest ${selectedId === p.id ? 'text-white' : 'text-gray-400'}`}>
                                {p.name}
                            </h3>
                        </div>
                    </motion.button>
                ))}
            </div>

            <footer className="flex flex-col items-center gap-8">
                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500 flex items-center justify-center text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                                <Check size={40} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.5em] text-green-500 animate-pulse">Signature Verified</span>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center gap-12 w-full max-w-sm">
                            <div className="flex items-center gap-4 text-accent-red/40">
                                <AlertTriangle size={14} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Action irreversible post-authorization</span>
                            </div>
                            <button
                                disabled={!selectedId}
                                onClick={handleConfirm}
                                className={`btn-premium w-full py-8 text-2xl italic tracking-tighter ${selectedId
                                    ? 'shadow-[0_0_60px_rgba(220,38,38,0.3)]'
                                    : 'opacity-5 bg-white/5 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                Confirm Order
                            </button>
                        </div>
                    )}
                </AnimatePresence>

                {!submitted && selectedId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-accent-red drop-shadow-lg">
                        <Skull size={14} /> Target Locked: {players.find(p => p.id === selectedId)?.name}
                    </motion.div>
                )}
            </footer>
        </div>
    );
};

export default Voting;
