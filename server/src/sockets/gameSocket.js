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

        // Deck shuffle event
        socket.on('deck:shuffle', async (data) => {
            if (!socket.isAdmin) {
                socket.emit('error', { message: 'Unauthorized' });
                return;
            }

            try {
                // Broadcast shuffle start to all admins
                io.to('game-updates').emit('deck:shuffle-start', {
                    timestamp: new Date(),
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Request deck state
        socket.on('deck:request-state', async () => {
            try {
                const cardService = (await import('../services/cardService.js')).default;
                const deckState = await cardService.getDeckState();
                socket.emit('deck:state', deckState);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Card drawn event (broadcast to all)
        socket.on('card:drawn', (data) => {
            io.to('game-updates').emit('card:drawn', data);
        });

        // Subscribe to graph updates (for player view)
        socket.on('graph:subscribe', () => {
            socket.join('graph-viewers');
            console.log(`📊 Client subscribed to graph updates: ${socket.id}`);
        });

        // Request current graph data
        socket.on('graph:request-data', async () => {
            try {
                const Asset = (await import('../models/Asset.js')).default;
                const assets = await Asset.find({}).select('assetType name currentValue baseValue');

                const graphData = assets.map(asset => ({
                    assetType: asset.assetType,
                    name: asset.name,
                    currentValue: asset.currentValue,
                    baseValue: asset.baseValue,
                }));

                socket.emit('graph:current-data', { assets: graphData });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export default setupSocketHandlers;
