import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal, Shield, Cpu, Fingerprint } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

interface Message {
    id: string;
    sender: string;
    senderId?: string;
    content: string;
    timestamp: number;
    isSystem?: boolean;
    isBot?: boolean;
    isSelf?: boolean;
}

interface ChatProps {
    lobbyCode: string;
    encryptionKey: string;
    playerName?: string;
}

const Chat: React.FC<ChatProps> = ({ lobbyCode, encryptionKey, playerName }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState<Message[]>([
        { id: 'sys-init', sender: 'SYSTEM', content: 'Secure channel established. All communications encrypted.', timestamp: Date.now(), isSystem: true }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const onMessage = (msg: { sender: string; senderId: string; content: string; isBot?: boolean }) => {
            setMessages(prev => [...prev, {
                id: `${Date.now()}-${Math.random()}`,
                sender: msg.sender,
                senderId: msg.senderId,
                content: msg.content,
                timestamp: Date.now(),
                isBot: msg.isBot,
                isSelf: msg.senderId === socket.id,
            }]);
        };

        const onSystem = (msg: { content: string }) => {
            setMessages(prev => [...prev, {
                id: `sys-${Date.now()}`,
                sender: 'SYSTEM',
                content: msg.content,
                timestamp: Date.now(),
                isSystem: true,
            }]);
        };

        socket.on('chat_message', onMessage);
        socket.on('system_message', onSystem);

        return () => {
            socket.off('chat_message', onMessage);
            socket.off('system_message', onSystem);
        };
    }, [socket]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;
        const alias = playerName || localStorage.getItem('mafia_operative_alias') || 'Operative';
        socket.emit('send_message', {
            code: lobbyCode,
            sender: alias,
            content: input.trim(),
        });
        // Optimistic local message
        setMessages(prev => [...prev, {
            id: `local-${Date.now()}`,
            sender: alias,
            senderId: socket.id || '',
            content: input.trim(),
            timestamp: Date.now(),
            isSelf: true,
        }]);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-black/40 relative overflow-hidden font-michroma">
            {/* Terminal Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-red-500/20 no-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: msg.isSelf ? 10 : -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
                        >
                            {/* System message */}
                            {msg.isSystem ? (
                                <div className="w-full py-2 flex items-center gap-3">
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">
                                        SYS_BROADCAST: {msg.content}
                                    </span>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </div>
                            ) : (
                                <>
                                    {/* Sender label */}
                                    <div className="flex items-center gap-2 mb-1.5 px-1">
                                        <div className={`w-1 h-3 ${msg.isBot ? 'bg-purple-500/50' : msg.isSelf ? 'bg-red-500/50' : 'bg-white/10'}`} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${msg.isBot ? 'text-purple-400/50' : msg.isSelf ? 'text-red-400/50' : 'text-white/30'}`}>
                                            {msg.sender}
                                        </span>
                                    </div>
                                    {/* Bubble */}
                                    <div className={`max-w-[90%] px-4 py-3 rounded-xl text-[10px] font-medium leading-[1.6] border relative group transition-all duration-300 ${msg.isSelf
                                        ? 'bg-red-950/10 border-red-500/20 text-red-100/90 rounded-tr-none shadow-[0_4px_12px_rgba(239,68,68,0.05)]'
                                        : msg.isBot
                                            ? 'bg-purple-950/10 border-purple-500/20 text-purple-100/90 rounded-tl-none'
                                            : 'bg-white/[0.03] border-white/5 text-white/70 rounded-tl-none'
                                        }`}>
                                        <div className="relative z-10">{msg.content}</div>
                                        {/* Corner accent */}
                                        <div className={`absolute top-0 ${msg.isSelf ? 'right-0' : 'left-0'} w-2 h-2 border-t border-inherit opacity-40`} />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* INPUT ROW */}
            <div className="p-4 bg-black/40 border-t border-white/10 relative">
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-1.5 focus-within:border-red-500/30 transition-all">
                    <label htmlFor="chat-input" className="sr-only">Chat message</label>
                    <Terminal size={12} className="text-white/20" />
                    <input
                        id="chat-input"
                        type="text"
                        placeholder="INPUT_NEURAL_DATA..."
                        className="flex-1 bg-transparent py-2 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-white/10 text-white/80"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        autoComplete="off"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-1.5 text-white/20 hover:text-red-500 transition-all disabled:opacity-30 active:scale-90"
                        aria-label="Send message"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
