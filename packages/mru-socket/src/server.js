"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketServer = createSocketServer;
exports.closeSocketServer = closeSocketServer;
const socket_io_1 = require("socket.io");
let io = null;
function createSocketServer(httpServer) {
    console.log('[Socket.io] Initializing server...');
    if (!io) {
        io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        console.log('[Socket.io] Server created with CORS enabled');
        io.on('connection', (socket) => {
            console.log('[Socket.io] Client connected:', socket.id);
            socket.on('disconnect', (reason) => {
                console.log(`[Socket.io] Client disconnected: ${socket.id}, reason: ${reason}`);
            });
            socket.on('error', (error) => {
                console.error(`[Socket.io] Socket error for ${socket.id}:`, error);
            });
        });
        io.engine.on('connection_error', (err) => {
            console.error('[Socket.io] Connection error:', err);
        });
    }
    return io;
}
async function closeSocketServer() {
    if (io) {
        await io.close();
        io = null;
        console.log('[Socket.io] Server closed gracefully');
    }
}
