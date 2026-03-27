import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Role } from '../../../shared/game-engine';

interface CardRevealProps {
    role: Role;
    onComplete: () => void;
}

const CardReveal: React.FC<CardRevealProps> = ({ role, onComplete }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm aspect-[2/3] relative cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ perspective: 1000 }}
            >
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="w-full h-full relative"
                >
                    {/* Front (Card Back) */}
                    <div
                        className="absolute inset-0 backface-hidden glass-panel border-4 border-red-500/50 flex flex-col items-center justify-center gap-4 bg-[#0a0a12]"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        <div className="w-24 h-24 border-2 border-red-500/20 rounded-full flex items-center justify-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black red-gradient-text tracking-widest">NIGHTFALL</h2>
                        <p className="text-secondary text-sm">TAP TO REVEAL IDENTITY</p>
                    </div>

                    {/* Back (Card Front) */}
                    <div
                        className="absolute inset-0 backface-hidden glass-panel border-4 border-red-500 flex flex-col items-center justify-center gap-6 bg-[#1a0a0a]"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        <h1 className="text-5xl font-black tracking-tighter text-white">{role}</h1>
                        <div className="w-px h-24 bg-red-500/50" />
                        <p className="text-center px-12 text-secondary">
                            {role === Role.MAFIA && "Eliminate all villagers to seize control of the city."}
                            {role === Role.VILLAGER && "Find the mafia and eliminate them before it's too late."}
                            {role === Role.POLICE && "Investigate players at night to reveal their true identity."}
                            {role === Role.DOCTOR && "Protect one player each night from being eliminated."}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default CardReveal;
