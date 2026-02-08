import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import setupSocketHandlers from './sockets/gameSocket.js';

// Routes
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import cardRoutes from './routes/cardRoutes.js';
import assetHistoryRoutes from './routes/assetHistoryRoutes.js';
import roundRoutes from './routes/roundRoutes.js';
import superadminAuthRoutes from './routes/superadminAuth.js';
import superadminRoutes from './routes/superadminRoutes.js';
import teamAuthRoutes from './routes/teamAuth.js';
import teamDataRoutes from './routes/teamDataRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/team-auth', teamAuthRoutes);
app.use('/api/team-data', teamDataRoutes);
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/assets', assetHistoryRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/superadmin', superadminAuthRoutes);
app.use('/api/superadmin', superadminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Setup WebSocket handlers
setupSocketHandlers(io);

// Connect to database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log(`\n🚀 Market Matrix Server Running`);
            console.log(`📍 HTTP: http://localhost:${PORT}`);
            console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
