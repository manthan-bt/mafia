import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Users, Server, HardDrive, Cpu,
    ShieldAlert, Terminal, RefreshCcw, Search,
    ChevronRight, Zap,
    Database, Network, Clock
} from 'lucide-react';

interface SystemStats {
    cpuUsage: string;
    memoryUsage: string;
    totalMemory: string;
    freeMemory: string;
    uptime: number;
    activeLobbies: number;
    activeSockets: number;
    usedMemory?: string;
}

interface Operative {
    id: string;
    alias: string;
    email: string;
    role: string;
    createdAt: number;
    mmr: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [users, setUsers] = useState<Operative[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'OPERATIVES' | 'TERMINAL'>('OVERVIEW');
    const [searchQuery, setSearchQuery] = useState('');

    const serverUrl = `http://${window.location.hostname}:3005`;
    const token = localStorage.getItem('mafia_session_token');

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                fetch(`${serverUrl}/api/admin/system-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${serverUrl}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();

            if (statsData.ok) setStats(statsData.stats);
            if (usersData.ok) setUsers(usersData.users);

            if (!statsData.ok || !usersData.ok) {
                setError(statsData.error || usersData.error || 'Access Denied');
            }
        } catch (err) {
            setError('Failed to connect to Neural Link.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const promoteUser = async (email: string) => {
        try {
            const res = await fetch(`${serverUrl}/api/admin/promote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.ok) fetchData();
            else alert(data.error);
        } catch (err) {
            alert('Promotion protocol failed.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#080810] flex items-center justify-center p-6">
                <div className="max-w-md w-full glass-panel p-8 text-center border-red-900/30">
                    <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-black uppercase text-white mb-2">Access Denied</h2>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <button onClick={() => window.location.href = '/'} className="btn-premium w-full py-3">Return to Surface</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 pb-20 max-w-[1600px] mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <Terminal size={18} className="text-red-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Command Center</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Neural Net <span className="text-red-500">Oversight</span></h1>
                    <p className="text-gray-500 text-sm mt-2 max-w-xl">Centralized administrative hub for Nightfall Protocol management and real-time system monitoring.</p>
                </div>

                <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                    {(['OVERVIEW', 'OPERATIVES', 'TERMINAL'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'OVERVIEW' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {/* SYSTEM HEALTH CARDS */}
                        <StatCard
                            icon={<Cpu className="text-blue-400" />}
                            label="Neural Load"
                            value={`${stats?.cpuUsage || '0.0'}%`}
                            trend="Steady Flow"
                            color="blue"
                        />
                        <StatCard
                            icon={<HardDrive className="text-amber-400" />}
                            label="Core Memory"
                            value={`${stats?.memoryUsage || '0.0'}%`}
                            trend={`${stats?.usedMemory || 'Calculated'} of ${stats?.totalMemory || 'N/A'}`}
                            color="amber"
                        />
                        <StatCard
                            icon={<Network className="text-green-400" />}
                            label="Data Streams"
                            value={String(stats?.activeSockets || 0)}
                            trend="Active Connections"
                            color="green"
                        />
                        <StatCard
                            icon={<Users className="text-purple-400" />}
                            label="Deployed Gates"
                            value={String(stats?.activeLobbies || 0)}
                            trend="Active Lobbies"
                            color="purple"
                        />

                        {/* DETAILED STATS */}
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                            <div className="glass-panel p-6 border-white/5 col-span-2">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                                        <Activity size={14} className="text-red-500" />
                                        System Uptime Pulse
                                    </h3>
                                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[8px] font-black uppercase">Service Online</span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <DetailItem label="Uptime" value={stats ? formatUptime(stats.uptime) : '0h 0m 0s'} />
                                    <DetailItem label="Free Mem" value={stats?.freeMemory || '0 GB'} />
                                    <DetailItem label="Active PIDs" value="24 Active" />
                                    <DetailItem label="Neural Latency" value="12ms" />
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol Integrity</span>
                                        <span className="text-[10px] font-bold text-green-500">99.98%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '99.98%' }}
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-6 border-red-500/10 bg-red-500/[0.02]">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                                    <Zap size={14} className="text-red-500" />
                                    Quick Directives
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <AdminButton icon={<RefreshCcw size={14} />} label="Reboot Neural Link" danger />
                                    <AdminButton icon={<ShieldAlert size={14} />} label="Infiltrator Lockdown" />
                                    <AdminButton icon={<Database size={14} />} label="Purge Ghost Sessions" />
                                    <AdminButton icon={<Terminal size={14} />} label="Deploy Hotfix 2.1" />
                                </div>
                            </div>
                        </div>

                        {/* ACTIVITY LOG (MOCK) */}
                        <div className="lg:col-span-1 glass-panel p-6 border-white/5 mt-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                                <Clock size={14} className="text-blue-500" />
                                Network Event Log
                            </h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <LogEntry time="18:04:12" msg="Admin: Promotion script initiated" type="info" />
                                <LogEntry time="18:02:55" msg="System: Database backup verified" type="success" />
                                <LogEntry time="17:58:10" msg="Security: Unauthorized spike blocked" type="warn" />
                                <LogEntry time="17:45:22" msg="Server: Hotpatch applied to GameEngine" type="info" />
                                <LogEntry time="17:30:01" msg="Operative: Ghost_X joined Cluster 4" type="user" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'OPERATIVES' && (
                    <motion.div
                        key="operatives"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel border-white/5 overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="relative w-full md:w-96">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search alias or neural-identifier…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 transition-all text-white placeholder:text-gray-600"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">
                                    <RefreshCcw size={14} /> Refresh Roster
                                </button>
                                <button className="bg-red-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">
                                    Manual Enlistment
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Operative</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Neural Role</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">MMR Rating</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Activation Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Directives</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-red-500/30 transition-all">
                                                        <UserAvatar alias={user.alias} />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-sm tracking-tight">{user.alias}</div>
                                                        <div className="text-gray-500 text-[10px]">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <RoleBadge role={user.role} />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-white font-mono font-bold">{user.mmr}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-gray-400 text-xs font-medium">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.role !== 'SUPERUSER' && (
                                                        <button
                                                            onClick={() => promoteUser(user.email)}
                                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Promote to Super User"
                                                        >
                                                            <Zap size={14} />
                                                        </button>
                                                    )}
                                                    <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all">
                                                        <Terminal size={14} />
                                                    </button>
                                                    <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all">
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string, trend: string, color: string }) {
    const colors = {
        blue: 'border-blue-500/20 bg-blue-500/[0.02] text-blue-400',
        amber: 'border-amber-500/20 bg-amber-500/[0.02] text-amber-400',
        green: 'border-green-500/20 bg-green-500/[0.02] text-green-400',
        purple: 'border-purple-500/20 bg-purple-500/[0.02] text-purple-400',
    };

    return (
        <div className={`glass-panel p-6 border-l-4 ${colors[color as keyof typeof colors]}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    {icon}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40">RT Monitoring</div>
            </div>
            <div className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">{value}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current`} />
                <span className="text-[10px] font-medium text-gray-600 uppercase tracking-widest">{trend}</span>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600 mb-1">{label}</div>
            <div className="text-sm font-mono font-bold text-white tracking-widest uppercase">{value}</div>
        </div>
    );
}

function AdminButton({ icon, label, danger }: { icon: React.ReactNode, label: string, danger?: boolean }) {
    return (
        <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${danger
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-white/20'
            }`}>
            {icon}
            {label}
        </button>
    );
}

function LogEntry({ time, msg, type }: { time: string, msg: string, type: string }) {
    const colors = {
        info: 'text-blue-400',
        success: 'text-green-400',
        warn: 'text-amber-400',
        user: 'text-purple-400'
    };
    return (
        <div className="flex gap-3 text-[10px] font-mono group">
            <span className="text-gray-600 shrink-0">{time}</span>
            <span className={colors[type as keyof typeof colors]}>{msg}</span>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const styles = {
        SUPERUSER: 'bg-red-500/20 text-red-500 border-red-500/30',
        ADMIN: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
        USER: 'bg-white/10 text-gray-400 border-white/10'
    };
    return (
        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${styles[role as keyof typeof styles] || styles.USER}`}>
            {role}
        </span>
    );
}

function UserAvatar({ alias }: { alias: string }) {
    const char = alias.charAt(0).toUpperCase();
    return <span className="text-sm font-black text-white/40">{char}</span>;
}
