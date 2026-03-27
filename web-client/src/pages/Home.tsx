import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Play, Trophy, Target, Settings, Store, Coins, Terminal } from 'lucide-react';
import PremiumAdUnit from '../components/PremiumAdUnit';
import { audioManager } from '../utils/audioManager';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('mafia_user_role') || 'USER';

    const [profile, setProfile] = React.useState<any>(null);

    // Start ambient low hum on mount (simulated night city)
    React.useEffect(() => {
        audioManager.startAmbient('ambientNight', 0.1);
        fetchProfile();
        return () => audioManager.stopAmbient();
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

    const handleNavigation = (path: string) => {
        audioManager.play('bassHit', 0.5); // Cinematic selection hit
        navigate(path);
    };

    return (
        <div className="h-screen w-screen bg-[#050510] relative flex items-center justify-center overflow-hidden font-michroma">

            {/* --- CINEMATIC BACKGROUND --- */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Deep dark base */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#0a0a18] to-[#080810] opacity-95" />
                {/* Vivid blood red ambient glow — top center */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[140px]"
                    style={{ background: 'radial-gradient(ellipse, rgba(204,10,30,0.20) 0%, rgba(140,5,18,0.06) 60%, transparent 100%)' }} />
                {/* Bottom blood red fog */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-64 blur-[80px]"
                    style={{ background: 'linear-gradient(to top, rgba(204,10,30,0.08) 0%, transparent 100%)' }} />
                {/* Noise overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
            </div>

            {/* --- CENTRAL MAIN MENU --- */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-6">

                {/* GAME LOGO */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="flex flex-col items-center mb-16"
                >
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white font-orbitron"
                        style={{ textShadow: '0 0 60px rgba(204,10,30,0.3), 0 0 120px rgba(204,10,30,0.1)' }}>
                        MAFIA
                    </h1>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] md:tracking-[1em] mt-2"
                        style={{ color: '#E8152A', textShadow: '0 0 20px rgba(232,21,42,0.7)' }}>
                        Nightfall Protocol
                    </span>
                </motion.div>

                {/* INTERACTIVE BENTO GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {/* PLAY - Large Card */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                        onClick={() => handleNavigation('/play')}
                        className="col-span-2 row-span-2 group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col items-start justify-end hover:bg-white/[0.08] hover:border-red-primary/50 transition-all duration-500 text-left min-h-[250px]"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                            <Play size={120} className="text-red-primary" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:from-[#CC0A1E]/25 transition-all duration-500" />
                        {/* Hover blood glow at bottom edge */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"
                            style={{ boxShadow: 'inset 0 -2px 0 rgba(204,10,30,0.8), inset 0 -20px 40px rgba(204,10,30,0.1)' }} />
                        <div className="relative z-10 w-full">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-primary mb-2 block">Primary Operation</span>
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white font-orbitron group-hover:translate-x-2 transition-transform duration-300">
                                Deploy
                            </h2>
                        </div>
                    </motion.button>

                    {/* RANKED */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        onClick={() => handleNavigation('/ranked')}
                        className="col-span-1 group relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-6 flex flex-col items-start justify-between hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 text-left min-h-[160px]"
                    >
                        <Shield size={28} className="text-gray-400 group-hover:text-white transition-colors" />
                        <h3 className="text-lg font-black uppercase tracking-widest text-gray-300 font-orbitron group-hover:text-white mt-4">
                            Ranked
                        </h3>
                    </motion.button>

                    {/* TOURNAMENTS */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        onClick={() => handleNavigation('/tournaments')}
                        className="col-span-1 group relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-6 flex flex-col items-start justify-between hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 text-left min-h-[160px]"
                    >
                        <Target size={28} className="text-gray-400 group-hover:text-white transition-colors" />
                        <h3 className="text-lg font-black uppercase tracking-widest text-gray-300 font-orbitron group-hover:text-white mt-4">
                            Events
                        </h3>
                    </motion.button>

                    {/* STORE */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        onClick={() => handleNavigation('/store')}
                        className="col-span-1 group relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-6 flex flex-col items-start justify-between hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 text-left min-h-[160px]"
                    >
                        <Store size={28} className="text-gray-400 group-hover:text-white transition-colors" />
                        <h3 className="text-lg font-black uppercase tracking-widest text-gray-300 font-orbitron group-hover:text-white mt-4">
                            Armory
                        </h3>
                    </motion.button>

                    {/* SETTINGS */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                        onClick={() => handleNavigation('/settings')}
                        className="col-span-1 group relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-6 flex flex-col items-start justify-between hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 text-left min-h-[160px]"
                    >
                        <Settings size={28} className="text-gray-400 group-hover:text-white transition-colors" />
                        <h3 className="text-lg font-black uppercase tracking-widest text-gray-300 font-orbitron group-hover:text-white mt-4">
                            System
                        </h3>
                    </motion.button>

                    {/* SUPERUSER COMMAND CENTER */}
                    {userRole === 'SUPERUSER' && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                            onClick={() => handleNavigation('/admin')}
                            className="col-span-1 group relative overflow-hidden rounded-3xl bg-red-600/[0.05] border border-red-500/20 p-6 flex flex-col items-start justify-between hover:bg-red-600/[0.1] hover:border-red-500/50 transition-all duration-500 text-left min-h-[160px]"
                        >
                            <Terminal size={28} className="text-red-500 group-hover:text-red-400 transition-colors animate-pulse" />
                            <h3 className="text-lg font-black uppercase tracking-widest text-red-500 font-orbitron group-hover:text-red-400 mt-4">
                                Control
                            </h3>
                        </motion.button>
                    )}
                </div>
            </div>

            {/* --- MINIMAL CORNER HUD --- */}
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0E0E1C] flex items-center justify-center overflow-hidden relative"
                    style={{ border: '1.5px solid rgba(204,10,30,0.45)', boxShadow: '0 0 20px rgba(204,10,30,0.25)' }}>
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.alias || localStorage.getItem('mafia_operative_alias') || 'Shadow'}`} alt="Avatar" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-red-primary/10 mix-blend-overlay" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{profile?.alias || localStorage.getItem('mafia_operative_alias') || 'Shadow_01'}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-highlight flex items-center gap-1">
                        <Trophy size={10} /> {profile?.mmr > 2000 ? 'LEGEND' : profile?.mmr > 1500 ? 'MASTER' : 'DIAMOND III'}
                    </span>
                </div>
            </div>

            <div className="absolute top-6 right-6 z-20 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-[12px] font-black tracking-widest text-white">{profile?.coins?.toLocaleString() || '0'}</span>
                    <Coins size={14} className="text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                </div>
            </div>

            {/* --- INTEGRATED AD STRIP (Subtle) --- */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl pb-4 hidden md:block opacity-50 hover:opacity-100 transition-opacity">
                <PremiumAdUnit size="banner" title="SPONSORED EVENT" />
            </div>

        </div>
    );
};

export default Home;
