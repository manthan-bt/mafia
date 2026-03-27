import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PremiumReveal: React.FC<{ role: string; onComplete: () => void }> = ({ role, onComplete }) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                onAnimationComplete={onComplete}
                className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/40 backdrop-blur-xl"
            >
                <motion.div
                    initial={{ y: 50 }}
                    animate={{ y: 0 }}
                    className="relative p-12 glass-panel border-4 border-red-600 shadow-[0_0_100px_rgba(220,38,38,0.5)]"
                >
                    <motion.h2
                        animate={{ textShadow: ["0 0 20px #ff0000", "0 0 40px #ff0000", "0 0 20px #ff0000"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-7xl font-black uppercase tracking-tighter text-red-600"
                    >
                        {role}
                    </motion.h2>
                    <p className="text-center text-secondary uppercase font-bold tracking-widest mt-4">Premium Reveal Active</p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PremiumReveal;
