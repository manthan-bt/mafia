import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

/** Derives the server URL from the current browser hostname — works for localhost AND any WiFi device */
function getServerUrl(): string {
    const host = window.location.hostname;   // e.g. "localhost" or "192.168.1.42"
    const port = 3005;
    return `http://${host}:${port}`;
}

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const url = getServerUrl();
        const newSocket = io(url, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => console.log(`[Socket] Connected to ${url}`));
        newSocket.on('connect_error', (err) => console.warn('[Socket] Failed:', err.message));

        setSocket(newSocket);
        return () => { newSocket.close(); };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
