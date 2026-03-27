import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wifi, ChevronLeft, Monitor, Smartphone } from 'lucide-react';

/**
 * WiFi Multiplayer page — no manual IP needed.
 * The SocketContext already auto-connects to window.location.hostname:3005,
 * so any device on the same WiFi just needs to open the app's URL.
 */
const LanConnect: React.FC = () => {
    const navigate = useNavigate();

    // If user landed here via a direct /lan URL from another device, just redirect to play
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autoplay')) navigate('/play');
    }, [navigate]);

    const hostUrl = `${window.location.hostname}:${window.location.port || 5180}`;

    return (
        <div className="min-h-screen w-screen bg-[#050510] text-white font-michroma relative flex items-center justify-center overflow-hidden">

            {/* BG */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510] to-[#050510] opacity-95" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[130px] bg-green-900/20 opacity-60" />
            </div>

            {/* BACK */}
            <motion.button
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/play')}
                className="fixed top-8 left-8 z-30 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group p-2"
            >
                <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Back</span>
            </motion.button>

            <div className="relative z-10 w-full max-w-lg mx-6 flex flex-col gap-6">

                {/* HEADER */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <Wifi size={28} className="text-green-400" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter font-orbitron">WiFi Play</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2">Play with anyone on the same WiFi</p>
                </motion.div>

                {/* HOW IT WORKS */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                    className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 flex flex-col gap-6">

                    {/* STEP 1 */}
                    <div className="flex items-start gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                            <Monitor size={20} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">Step 1 — You (Host)</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-relaxed">
                                Make sure the server is running. Your game is accessible at:
                            </p>
                            <div className="mt-2 px-4 py-3 rounded-xl bg-black/40 border border-green-500/20 font-orbitron">
                                <p className="text-green-400 text-sm font-black tracking-widest">{hostUrl}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* STEP 2 */}
                    <div className="flex items-start gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Smartphone size={20} className="text-gray-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Step 2 — Friends (Same WiFi)</p>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider leading-relaxed">
                                Connect to the same WiFi, then open a browser and type the address above.
                                They'll land on the game and connect automatically — no apps, no IP entry.
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* STEP 3 */}
                    <div className="flex items-start gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-red-primary font-black text-sm font-orbitron">3</div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Step 3 — Start Playing</p>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider leading-relaxed">
                                Create a Private Room, share the 6-letter code with friends, and launch the game when everyone's in the lobby.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }}
                    onClick={() => navigate('/play')}
                    className="w-full py-5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                    Got It — Take Me to Play
                </motion.button>
            </div>
        </div>
    );
};

export default LanConnect;
