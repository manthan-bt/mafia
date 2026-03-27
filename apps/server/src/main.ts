import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { connectRedis } from './services/redis-service.js';
import { LobbyManager } from './managers/lobby-manager.js';
import AuthController from './controllers/auth-controller.js';
import UserController from './controllers/user-controller.js';
import { SocketManager } from './sockets/socket-manager.js';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true,
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { ok: false, error: 'Too many requests from this IP.' }
});

app.use('/api', apiLimiter);
app.use(express.json({ limit: '10kb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

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
