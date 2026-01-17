/**
 * WebSocket event handlers for real-time updates
 */

const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Admin authentication for socket
        socket.on('admin:authenticate', async (data) => {
            try {
                // In production, verify JWT token here
                socket.isAdmin = true;
                socket.emit('admin:authenticated', { success: true });
                console.log(`🔐 Admin authenticated: ${socket.id}`);
            } catch (error) {
                socket.emit('admin:authenticated', { success: false, error: error.message });
            }
        });

        // Subscribe to updates
        socket.on('subscribe:updates', (data) => {
            socket.join('game-updates');
            console.log(`📡 Client subscribed to updates: ${socket.id}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export default setupSocketHandlers;
