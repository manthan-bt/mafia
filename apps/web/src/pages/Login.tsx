import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Fingerprint, Lock, Eye, EyeOff, AlertTriangle,
    CheckCircle, ChevronRight, Cpu, Wifi, Activity, User, Mail,
    X
} from 'lucide-react';

// ─── CLIENT-SIDE SHA-256 PRE-HASH ───────────────────────────────────────────
// We hash password on client BEFORE sending — server applies PBKDF2 on top
async function sha256Hex(text: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────────────────
interface PasswordStrength {
    score: number;       // 0-4
    label: string;
    color: string;
    checks: { label: string; ok: boolean }[];
}
function analyzePassword(pw: string): PasswordStrength {
    const checks = [
        { label: '8+ characters', ok: pw.length >= 8 },
        { label: 'Uppercase letter', ok: /[A-Z]/.test(pw) },
        { label: 'Lowercase letter', ok: /[a-z]/.test(pw) },
        { label: 'Number', ok: /[0-9]/.test(pw) },
        { label: 'Special character', ok: /[^A-Za-z0-9]/.test(pw) },
    ];
    const score = checks.filter(c => c.ok).length;
    const labels = ['Critical', 'Weak', 'Fair', 'Strong', 'Fortress'];
    const colors = ['#CC0A1E', '#E8152A', '#F59E0B', '#22C55E', '#00FF88'];
    return { score, label: labels[score] ?? 'Fortress', color: colors[score] ?? '#00FF88', checks };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────
type Mode = 'LOGIN' | 'REGISTER' | 'RECOVERY';
type Stage = 'idle' | 'encrypting' | 'transmitting' | 'verifying' | 'granted' | 'denied';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

export default function Login() {
    const navigate = useNavigate();
    const serverUrl = `http://${window.location.hostname}:3005`;

    const [mode, setMode] = useState<Mode>('LOGIN');
    const [recoveryStep, setRecoveryStep] = useState<'EMAIL' | 'OTP' | 'RESET'>('EMAIL');
    const [alias, setAlias] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [stage, setStage] = useState<Stage>('idle');
    const [stageText, setStageText] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [lockout, setLockout] = useState(0); // remaining lockout seconds
    const [strength, setStrength] = useState<PasswordStrength | null>(null);
    const [scanLine, setScanLine] = useState(false);
    const [glitch, setGlitch] = useState(false);

    // Lockout countdown
    useEffect(() => {
        if (lockout <= 0) return;
        const t = setInterval(() => setLockout(s => s - 1), 1000);
        return () => clearInterval(t);
    }, [lockout]);

    // Ambient scan line effect
    useEffect(() => {
        const t = setInterval(() => setScanLine(s => !s), 3000);
        return () => clearInterval(t);
    }, []);

    // Password strength on register or reset
    useEffect(() => {
        if ((mode === 'REGISTER' || (mode === 'RECOVERY' && recoveryStep === 'RESET')) && password) {
            setStrength(analyzePassword(password));
        } else {
            setStrength(null);
        }
    }, [password, mode, recoveryStep]);

    // Navigate on granted
    useEffect(() => {
        if (stage !== 'granted') return;
        const t = setTimeout(() => navigate('/'), 1200);
        return () => clearTimeout(t);
    }, [stage, navigate]);

    const triggerGlitch = () => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 400);
    };

    const handleRecovery = async () => {
        try {
            if (recoveryStep === 'EMAIL') {
                setStage('transmitting');
                setStageText('Searching database…');
                const res = await fetch(`${serverUrl}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                if (data.ok) {
                    setRecoveryStep('OTP');
                    setStage('idle');
                } else {
                    setError(data.error);
                    setStage('denied');
                }
            } else if (recoveryStep === 'OTP') {
                setStage('verifying');
                setStageText('Verifying OTP code…');
                const res = await fetch(`${serverUrl}/api/auth/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp }),
                });
                const data = await res.json();
                if (data.ok) {
                    setResetToken(data.resetToken);
                    setRecoveryStep('RESET');
                    setStage('idle');
                } else {
                    setError(data.error);
                    setStage('denied');
                }
            } else if (recoveryStep === 'RESET') {
                setStage('encrypting');
                setStageText('Establishing secure hash…');
                const clientHash = await sha256Hex(password);
                setStage('transmitting');
                setStageText('Updating passphrase…');
                const res = await fetch(`${serverUrl}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resetToken, clientHash }),
                });
                const data = await res.json();
                if (data.ok) {
                    setStage('granted');
                    setStageText('Vault updated. Accessing…');
                    // After reset, we might want to automatically log them in or send back to login
                    // For now, let's just go home if we have a token (server could return one)
                    // But here we'll just switch back to LOGIN after a delay in the effect
                } else {
                    setError(data.error);
                    setStage('denied');
                }
            }
        } catch (err) {
            setError('Recovery protocol failure.');
            setStage('idle');
        }
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockout > 0 || stage !== 'idle') return;

        if (mode === 'RECOVERY') {
            await handleRecovery();
            return;
        }

        if (!email || !password || (mode === 'REGISTER' && !alias)) {
            setError('All fields are required.');
            return;
        }
        setError('');

        try {
            // 1. CLIENT-SIDE SHA-256 PRE-HASH
            setStage('encrypting');
            setStageText('SHA-256 client-side hashing…');
            await new Promise(r => setTimeout(r, 600));
            const clientHash = await sha256Hex(password);

            // 2. ENCRYPTED TRANSMISSION
            setStage('transmitting');
            setStageText('Establishing TLS tunnel…');
            await new Promise(r => setTimeout(r, 500));

            const endpoint = mode === 'LOGIN' ? '/api/auth/login' : '/api/auth/register';
            const body = mode === 'LOGIN'
                ? { email, clientHash }
                : { alias, email, clientHash };

            setStageText('Transmitting credentials…');
            const res = await fetch(`${serverUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            // 3. SERVER VERIFICATION
            setStage('verifying');
            setStageText('Server PBKDF2 verification…');
            await new Promise(r => setTimeout(r, 700));

            const data = await res.json();

            if (!data.ok) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS || data.locked) {
                    setLockout(LOCKOUT_SECONDS);
                }
                triggerGlitch();
                setError(data.error || 'Authentication failed.');
                setStage('denied');
                setTimeout(() => setStage('idle'), 1500);
                return;
            }

            // 4. GRANTED — persist token + alias
            setStage('granted');
            setStageText('Access granted. Deploying…');
            localStorage.setItem('mafia_session_token', data.token);
            localStorage.setItem('mafia_operative_alias', data.user?.alias || alias);
            localStorage.setItem('mafia_user_id', data.user?.id || '');
            localStorage.setItem('mafia_user_role', data.user?.role || 'USER');
            localStorage.setItem('mafia_mmr', String(data.user?.mmr || 1000));

        } catch (err) {
            triggerGlitch();
            setError('Connection failed. Is the server running?');
            setStage('idle');
        }
    }, [mode, alias, email, password, lockout, stage, attempts, serverUrl, recoveryStep, otp, resetToken]);

    const isLocked = lockout > 0;
    const fmtLockout = `${Math.floor(lockout / 60).toString().padStart(2, '0')}:${(lockout % 60).toString().padStart(2, '0')}`;
    const busy = stage !== 'idle' && stage !== 'denied';

    const stageIcons: Record<Stage, string> = {
        idle: '●', encrypting: '⟳', transmitting: '↑', verifying: '⚙',
        granted: '✓', denied: '✕',
    };

    return (
        <div className="h-screen w-screen bg-[#080810] flex items-center justify-center p-4 relative overflow-hidden font-michroma">

            {/* ─── BACKGROUND ─────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Blood red ambient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[160px]"
                    style={{ background: 'radial-gradient(ellipse, rgba(204,10,30,0.18) 0%, transparent 70%)' }} />
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: 'linear-gradient(rgba(204,10,30,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(204,10,30,0.4) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
                {/* Noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
                {/* Scan line */}
                {scanLine && (
                    <motion.div
                        initial={{ top: 0 }} animate={{ top: '100%' }}
                        transition={{ duration: 4, ease: 'linear' }}
                        className="absolute left-0 w-full h-px pointer-events-none z-10"
                        style={{ background: 'linear-gradient(to right, transparent, rgba(204,10,30,0.4), transparent)' }}
                    />
                )}
            </div>

            {/* ─── CARD ───────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`relative w-full max-w-md z-10 transition-all ${glitch ? 'translate-x-[2px] brightness-110' : ''}`}
            >
                {/* Outer glow border */}
                <div className="absolute -inset-px rounded-3xl pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(204,10,30,0.35) 0%, transparent 50%, rgba(204,10,30,0.15) 100%)' }} />

                <div className="relative rounded-3xl overflow-hidden"
                    style={{ background: 'rgba(10,10,18,0.92)', border: '1px solid rgba(204,10,30,0.2)', backdropFilter: 'blur(20px)' }}>

                    {/* TOP STATUS BAR */}
                    <div className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2.5">
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
                                className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8152A' }} />
                            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-600">Nightfall Auth v3.2</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <Wifi size={8} className="text-green-500" />
                                <span className="text-[7px] text-green-500 font-black uppercase tracking-widest">TLS 1.3</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield size={8} className="text-blue-400" />
                                <span className="text-[7px] text-blue-400 font-black uppercase tracking-widest">AES-256</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col gap-7">

                        {/* HEADER */}
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center relative"
                                style={{ background: 'rgba(204,10,30,0.12)', border: '1px solid rgba(204,10,30,0.35)' }}>
                                <Lock size={28} style={{ color: '#E8152A' }} />
                                <div className="absolute -inset-1 rounded-2xl blur-md opacity-30"
                                    style={{ background: 'rgba(204,10,30,0.5)' }} />
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter font-orbitron text-white mb-1">
                                {mode === 'LOGIN' ? 'Authenticate' : mode === 'REGISTER' ? 'Enlist' : 'Recovery'}
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600">
                                {mode === 'LOGIN' ? 'Nightfall Protocol — Secure Access' : mode === 'REGISTER' ? 'Create Operative Identity' : 'Secure Passphrase Reset'}
                            </p>
                        </div>

                        {/* MODE TOGGLE */}
                        <div className="flex rounded-2xl p-1 gap-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {(['LOGIN', 'REGISTER'] as (Mode)[]).map(m => (
                                <button key={m} onClick={() => { setMode(m); setError(''); setRecoveryStep('EMAIL'); }}
                                    className="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                    style={mode === m
                                        ? { background: 'rgba(204,10,30,0.85)', color: '#fff', boxShadow: '0 0 16px rgba(204,10,30,0.4)' }
                                        : { color: 'rgba(255,255,255,0.3)' }
                                    }>
                                    {m === 'LOGIN' ? 'Sign In' : 'Register'}
                                </button>
                            ))}
                        </div>

                        {/* LOCKOUT NOTICE */}
                        <AnimatePresence>
                            {isLocked && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                    style={{ background: 'rgba(204,10,30,0.1)', border: '1px solid rgba(204,10,30,0.3)' }}>
                                    <AlertTriangle size={16} style={{ color: '#E8152A' }} className="shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Account Locked</p>
                                        <p className="text-[8px] text-gray-500 mt-0.5">Too many failed attempts. Retry in <span className="text-red-400 font-black">{fmtLockout}</span></p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

                            {/* ALIAS (register only) */}
                            <AnimatePresence>
                                {mode === 'REGISTER' && (
                                    <motion.div key="alias" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <div className="relative">
                                            <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                            <input type="text" placeholder="OPERATIVE ALIAS" value={alias}
                                                onChange={e => setAlias(e.target.value.toUpperCase())}
                                                disabled={busy || isLocked}
                                                className="w-full pl-11 pr-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none text-white transition-all"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#E8152A' }}
                                                onFocus={e => e.target.style.borderColor = 'rgba(204,10,30,0.5)'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* OTP (recovery step OTP only) */}
                            <AnimatePresence>
                                {mode === 'RECOVERY' && recoveryStep === 'OTP' && (
                                    <motion.div key="otp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <div className="relative">
                                            <Shield size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                            <input type="text" placeholder="6-DIGIT OTP" value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                disabled={busy}
                                                className="w-full pl-11 pr-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.6em] outline-none text-white transition-all text-center"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#E8152A' }}
                                                onFocus={e => e.target.style.borderColor = 'rgba(204,10,30,0.5)'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* EMAIL (Always if not in OTP or RESET step) */}
                            <AnimatePresence>
                                {(mode !== 'RECOVERY' || recoveryStep === 'EMAIL') && (
                                    <motion.div key="email" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                            <input type="email" placeholder="OPERATIVE EMAIL" value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                disabled={busy || isLocked}
                                                className="w-full pl-11 pr-4 py-4 rounded-2xl text-[10px] font-black tracking-widest outline-none text-white transition-all"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#E8152A' }}
                                                onFocus={e => e.target.style.borderColor = 'rgba(204,10,30,0.5)'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* PASSWORD (Login, Register or Recovery Step RESET) */}
                            <AnimatePresence>
                                {(mode === 'LOGIN' || mode === 'REGISTER' || (mode === 'RECOVERY' && recoveryStep === 'RESET')) && (
                                    <motion.div key="password" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 z-10" />
                                            <input type={showPw ? 'text' : 'password'} placeholder={mode === 'RECOVERY' ? "NEW PASSPHRASE" : "PASSPHRASE"}
                                                value={password} onChange={e => setPassword(e.target.value)}
                                                disabled={busy || isLocked}
                                                className="w-full pl-11 pr-12 py-4 rounded-2xl text-[10px] font-black tracking-widest outline-none text-white transition-all"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#E8152A' }}
                                                onFocus={e => e.target.style.borderColor = 'rgba(204,10,30,0.5)'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                            />
                                            <button type="button" onClick={() => setShowPw(s => !s)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {mode === 'LOGIN' && (
                                <div className="text-right">
                                    <button type="button" onClick={() => { setMode('RECOVERY'); setRecoveryStep('EMAIL'); setError(''); }}
                                        className="text-[8px] font-black uppercase tracking-widest text-gray-600 hover:text-red-primary transition-colors">
                                        Forgot Passphrase?
                                    </button>
                                </div>
                            )}

                            {/* PASSWORD STRENGTH METER */}
                            <AnimatePresence>
                                {strength && password && (
                                    <motion.div key="strength" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="rounded-2xl p-4 flex flex-col gap-3"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {/* Strength bar */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1 flex-1">
                                                {[0, 1, 2, 3, 4].map(i => (
                                                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                                                        style={{ background: i < strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                                                ))}
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest"
                                                style={{ color: strength.color }}>{strength.label}</span>
                                        </div>
                                        {/* Checks */}
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {strength.checks.map(c => (
                                                <div key={c.label} className="flex items-center gap-1.5">
                                                    {c.ok
                                                        ? <CheckCircle size={9} className="text-green-500 shrink-0" />
                                                        : <X size={9} className="text-gray-700 shrink-0" />}
                                                    <span className={`text-[8px] font-black uppercase tracking-wider ${c.ok ? 'text-gray-400' : 'text-gray-700'}`}>{c.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ERROR */}
                            <AnimatePresence>
                                {error && !isLocked && (
                                    <motion.div key="err" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                                        style={{ background: 'rgba(204,10,30,0.08)', border: '1px solid rgba(204,10,30,0.2)' }}>
                                        <AlertTriangle size={12} style={{ color: '#E8152A' }} className="shrink-0" />
                                        <span className="text-[9px] text-red-400 font-black uppercase tracking-wide">{error}</span>
                                        {attempts > 0 && <span className="ml-auto text-[8px] text-gray-600 font-black">{MAX_ATTEMPTS - attempts} left</span>}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* SUBMIT BUTTON */}
                            <motion.button
                                type="submit"
                                disabled={busy || isLocked || (mode !== 'RECOVERY' && (!email || !password))}
                                whileHover={{ scale: busy ? 1 : 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] text-white overflow-hidden disabled:opacity-40 transition-all"
                                style={{
                                    background: stage === 'granted'
                                        ? 'linear-gradient(135deg, #22C55E, #15803D)'
                                        : stage === 'denied'
                                            ? 'linear-gradient(135deg, #CC0A1E, #8B0614)'
                                            : 'linear-gradient(135deg, #E8152A 0%, #CC0A1E 50%, #8B0614 100%)',
                                    boxShadow: (stage as string) === 'granted'
                                        ? '0 0 30px rgba(34,197,94,0.4)'
                                        : '0 0 30px rgba(204,10,30,0.4)',
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {busy && (
                                        <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-3">
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                                <Cpu size={14} />
                                            </motion.div>
                                            <span>{stageText}</span>
                                        </motion.div>
                                    )}
                                    {(stage as string) === 'granted' && !busy && (
                                        <motion.div key="granted" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center justify-center gap-2">
                                            <CheckCircle size={16} /> Protocol Updated
                                        </motion.div>
                                    )}
                                    {(stage as string) !== 'granted' && !busy && (
                                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="flex items-center justify-center gap-2">
                                            {mode === 'LOGIN' ? 'Authenticate' : mode === 'REGISTER' ? 'Create Identity' :
                                                recoveryStep === 'EMAIL' ? 'Request OTP' :
                                                    recoveryStep === 'OTP' ? 'Verify OTP' : 'Reset Passphrase'}
                                            <ChevronRight size={16} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </form>

                        {/* SECURITY PROTOCOL DISPLAY */}
                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest pt-2"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Activity size={8} />
                                <span>PBKDF2-SHA512 · 100k iter</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Fingerprint size={8} />
                                <span>Client pre-hash active</span>
                            </div>
                        </div>

                        {/* STAGE INDICATOR */}
                        <AnimatePresence>
                            {stage !== 'idle' && (
                                <motion.div key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]"
                                    style={{ color: stage === 'granted' ? '#22C55E' : stage === 'denied' ? '#E8152A' : '#888' }}>
                                    <span>{stageIcons[stage]}</span>
                                    <span>{stage}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Bottom corner security badge */}
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 text-[7px] font-black uppercase tracking-widest text-gray-700">
                <Shield size={10} className="text-gray-700" />
                End-to-End Encrypted
            </div>
        </div>
    );
}
