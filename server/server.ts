import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { connectRedis } from './src/services/redis-service.js';
import { LobbyManager } from './lobby-manager.js';
import AuthController from './src/controllers/auth-controller.js';
import UserController from './src/controllers/user-controller.js';
import { SocketManager } from './src/sockets/socket-manager.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Services & Managers
const lobbyManager = new LobbyManager();

// Routes
app.use('/api/auth', AuthController);
app.use('/api/user', UserController);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Initialize Services
async function bootstrap() {
    try {
        // Connect to Redis for scaling & rate limiting
        await connectRedis();
        
        // Initialize Socket Manager (Handles Redis Adapter & Events)
        new SocketManager(io, lobbyManager);
        
        const PORT = process.env.PORT || 3005;
        httpServer.listen(PORT, () => {
            console.log(`
  🚀 Mafia: Nightfall Server Ready
  📡 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
            `);
        });
    } catch (error) {
        console.error('Failed to bootstrap server:', error);
        process.exit(1);
    }
}

bootstrap();
