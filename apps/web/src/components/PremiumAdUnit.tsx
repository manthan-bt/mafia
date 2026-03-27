import React from 'react';
import { motion } from 'framer-motion';

const PremiumAdUnit: React.FC<{ size?: 'banner' | 'rectangle', title?: string }> = ({ size = 'rectangle', title = "SPONSORED INTELLIGENCE" }) => {
    return (
        <div className={`glass-panel border-white/5 bg-[#111827] relative overflow-hidden group shadow-lg ${size === 'banner' ? 'w-full h-24' : 'w-full aspect-[4/3] max-w-sm mx-auto'}`}>
            {/* Soft border glow */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-primary/30 to-transparent shadow-[0_0_15px_rgba(177,18,38,0.3)] transition-all group-hover:via-red-highlight/50 opacity-50" />

            {/* Tag */}
            <div className="absolute top-0 right-0 px-2 py-1 bg-dark-900 border-b border-l border-white/5 rounded-bl shadow-sm z-10">
                <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">AD</span>
            </div>

            <div className="w-full h-full flex flex-col p-4 relative z-0 opacity-40 group-hover:opacity-80 transition-opacity">
                {/* Simulated Content */}
                <span className="text-[9px] font-black uppercase tracking-widest text-red-primary mb-2 font-orbitron">{title}</span>
                <div className="flex-1 w-full rounded border border-dashed border-white/10 flex items-center justify-center bg-[#0B0F1A]">
                    <span className="text-[10px] uppercase font-bold text-gray-600 tracking-widest text-center px-4">
                        Ad Placement<br />Integrated non-intrusive container
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PremiumAdUnit;
