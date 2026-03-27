import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ExternalLink, Zap } from 'lucide-react';

interface AdContainerProps {
    type: 'BANNER' | 'SIDEBAR' | 'POST_MATCH';
    isPremium: boolean;
}

const AdContainer: React.FC<AdContainerProps> = ({ type, isPremium }) => {
    if (isPremium) return null;

    const config = {
        BANNER: "h-32 w-full max-w-4xl",
        SIDEBAR: "w-64 h-[600px]",
        POST_MATCH: "w-[400px] h-[300px]"
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`glass-panel relative overflow-hidden group border-white/5 hover:border-accent-red/30 transition-all ${config[type]}`}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

            <div className="absolute top-4 right-6 flex items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Sponsored Signal</span>
                <Shield size={10} className="opacity-40" />
            </div>

            <div className="h-full flex flex-col items-center justify-center p-8 text-center relative z-10">
                <div className="mb-6 p-5 rounded-3xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    <Zap size={24} className="text-gray-500 opacity-20" />
                </div>

                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Protocol Acquisition</h4>
                <p className="text-[9px] font-medium text-gray-500 uppercase tracking-tighter mb-8 leading-relaxed max-w-[200px]">
                    Secure assets for combat. <br /> Upgrade to ignore transmission.
                </p>

                <div className="flex gap-4">
                    <button className="px-6 py-2 glass-card bg-white/5 border-none text-[8px] font-black uppercase tracking-widest hover:text-white transition-all">Details</button>
                    <button className="px-6 py-2 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-accent-red hover:text-white transition-all shadow-none">Go Premium</button>
                </div>
            </div>

            <div className="absolute inset-y-0 left-[-100%] w-1/4 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[45deg] group-hover:left-[200%] transition-all duration-[2000ms] pointer-events-none" />
        </motion.div>
    );
};

export default AdContainer;
