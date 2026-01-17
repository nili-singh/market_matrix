import { io } from 'socket.io-client';

class SocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (this.socket?.connected) return this.socket;

        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
            this.socket.emit('subscribe:updates');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        return this.socket;
    }

    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);

        // Store listener for cleanup
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (!this.socket) this.connect();
        this.socket.emit(event, data);
    }

    off(event, callback) {
        if (!this.socket) return;
        this.socket.off(event, callback);

        // Remove from listeners
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }
}

export default new SocketManager();
