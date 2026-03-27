import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { audioManager } from '../utils/audioManager';
import { Coins, Sparkles, Target, ArrowLeft, Zap, Shield, ShoppingCart, Diamond } from 'lucide-react';
import PremiumAdUnit from '../components/PremiumAdUnit';

const Store: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = React.useState<any>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [activeHover, setActiveHover] = useState<'BP' | 'COINS' | 'COSMETICS' | 'BUNDLES' | null>(null);

    React.useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('mafia_token');
            if (!token) return;
            const res = await fetch('http://localhost:3005/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) setProfile(data.profile);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    const handlePurchase = async (sku: string) => {
        if (isPurchasing) return;
        setIsPurchasing(true);
        audioManager.play('bassHit', 0.5);

        try {
            const token = localStorage.getItem('mafia_token');
            const res = await fetch('http://localhost:3005/api/store/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sku })
            });
            const data = await res.json();

            if (data.ok) {
                audioManager.play('levelUp', 0.6);
                alert(`SUCCESS: ${data.message}`);
                fetchProfile();
            } else {
                audioManager.play('error', 0.5);
                alert(`FAILED: ${data.error}`);
            }
        } catch (err) {
            console.error('Purchase failed', err);
            audioManager.play('error', 0.5);
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleNavigation = (path: string) => {
        audioManager.play('flip', 0.5);
        navigate(path);
    };

    return (
        <div className="h-screen w-screen bg-[#050510] relative flex flex-col items-center justify-center overflow-hidden font-michroma">

            {/* --- BACK NAVIGATION --- */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleNavigation('/')}
                className="absolute top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2"
            >
                <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Abort</span>
            </motion.button>

            {/* --- CURRENCY HUD --- */}
            <div className="absolute top-8 right-8 z-30 flex items-center gap-6">
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-3 backdrop-blur-md">
                    <Coins size={20} className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">Treasury</span>
                        <span className="text-lg font-black tracking-widest text-white font-orbitron">
                            {profile?.coins?.toLocaleString() || '0'}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- CINEMATIC BACKGROUND --- */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-1000">
                <div className={`absolute inset-0 bg-gradient-to-t from-[#050510] via-dark-900 to-[#050510] opacity-90 transition-all duration-700 ${activeHover === 'BP' ? 'bg-red-900/10' : activeHover === 'COSMETICS' ? 'bg-purple-900/10' : ''}`} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />

                {/* Reactive Glow Core */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] transition-all duration-1000 opacity-20 pointer-events-none ${activeHover === 'BP' ? 'bg-red-primary/30' : activeHover === 'COINS' ? 'bg-yellow-500/20' : activeHover === 'COSMETICS' ? 'bg-purple-500/20' : 'bg-transparent'}`} />
            </div>

            {/* --- CORE SELECTION MATRIX --- */}
            <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col gap-6 items-center pt-16">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-gray-500 mb-4">Asset Bureau</h2>
                    <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>

                {/* BENTO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

                    {/* BATTLE PASS / PREMIUM (Wide Card) */}
                    <motion.button
                        onMouseEnter={() => setActiveHover('BP')}
                        onMouseLeave={() => setActiveHover(null)}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="col-span-1 md:col-span-3 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col md:flex-row items-center justify-between hover:bg-white/[0.08] hover:border-red-primary/50 transition-all duration-500 text-left min-h-[220px]"
                    >
                        <div className="absolute top-0 right-10 p-4 opacity-10 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 pointer-events-none mix-blend-screen">
                            <Zap size={180} className="text-red-primary" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent group-hover:from-red-900/60 transition-all duration-500 pointer-events-none" />

                        <div className="relative z-10 w-full md:w-2/3">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-primary mb-2 flex items-center gap-2"><Target size={12} /> Season 4 Live</span>
                            <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white font-orbitron group-hover:translate-x-2 transition-transform duration-300">
                                Nightfall Elite
                            </h3>
                            <p className="text-xs uppercase tracking-widest text-gray-400 mt-4 max-w-md leading-relaxed hidden md:block">
                                Upgrade operational clearance. Unlock 100 tiers of exclusive covert assets, operator skins, and priority server access.
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 md:mt-0">
                            <button
                                onClick={() => handlePurchase('battle_pass_s4')}
                                disabled={isPurchasing}
                                className="px-8 py-4 bg-red-primary text-white text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-red-highlight shadow-[0_0_30px_rgba(177,18,38,0.5)] transition-all transform group-hover:scale-105 disabled:opacity-50"
                            >
                                {isPurchasing ? 'Processing...' : 'Authorize Upgrade (1,000)'}
                            </button>
                        </div>
                    </motion.button>

                    {/* COSMETICS VAULT */}
                    <motion.button
                        onMouseEnter={() => setActiveHover('COSMETICS')}
                        onMouseLeave={() => setActiveHover(null)}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="col-span-1 md:col-span-2 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col items-start justify-end hover:bg-white/[0.08] hover:border-purple-500/50 transition-all duration-500 text-left min-h-[280px]"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                            <Sparkles size={100} className="text-purple-400" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:from-purple-900/40 transition-all duration-500 pointer-events-none" />

                        <div className="relative z-10 w-full">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-2 block">Operator Customization</span>
                            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white font-orbitron group-hover:translate-x-2 transition-transform duration-300">
                                Apparel Vault
                            </h3>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-4 max-w-xs leading-relaxed">
                                Deploy with unique signal identifiers and legendary gear.
                            </p>
                        </div>
                    </motion.button>

                    {/* TREASURY FUNDING */}
                    <motion.button
                        onMouseEnter={() => setActiveHover('COINS')}
                        onMouseLeave={() => setActiveHover(null)}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="col-span-1 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col items-start justify-end hover:bg-white/[0.08] hover:border-yellow-500/50 transition-all duration-500 text-left min-h-[280px]"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                            <Diamond size={80} className="text-yellow-500" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:from-yellow-900/40 transition-all duration-500 pointer-events-none" />

                        <div className="relative z-10 w-full">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 mb-2 block">Syndicate Funds</span>
                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white font-orbitron group-hover:translate-x-2 transition-transform duration-300">
                                Currency
                            </h3>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-4 max-w-[200px] leading-relaxed">
                                Acquire premium allocation tokens.
                            </p>
                        </div>
                    </motion.button>

                </div>

                {/* AD STRIP CONTAINER */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-full max-w-2xl mt-4 opacity-50 hover:opacity-100 transition-opacity">
                    <PremiumAdUnit size="banner" title="SPONSORED REQUISITIONS" />
                </motion.div>

            </div>
        </div>
    );
};

export default Store;
