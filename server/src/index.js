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

// FIXED: Proper CORS origins handling
const getAllowedOrigins = () => {
    const envOrigins = process.env.CORS_ORIGINS;
    
    if (envOrigins) {
        // If it contains comma, split it. Otherwise, use as single origin
        return envOrigins.includes(',') ? envOrigins.split(',').map(origin => origin.trim()) : [envOrigins.trim()];
    }
    
    // Default origins for development
    return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
};

const allowedOrigins = getAllowedOrigins();

console.log('🔐 Allowed CORS Origins:', allowedOrigins);

// Socket.IO CORS configuration
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});

// CRITICAL: Apply CORS middleware FIRST, before any routes
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set('io', io);

// Routes (AFTER CORS middleware)
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
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        allowedOrigins: allowedOrigins 
    });
});

// Setup WebSocket handlers
setupSocketHandlers(io);

// Connect to database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start HTTP server - Bind to 0.0.0.0 for Render
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Market Matrix Server Running`);
            console.log(`📍 Port: ${PORT}`);
            console.log(`🔌 WebSocket: ws://0.0.0.0:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔐 CORS Origins:`, allowedOrigins);
            console.log('\n');
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