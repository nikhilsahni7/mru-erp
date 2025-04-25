import { io as clientIO, Socket } from 'socket.io-client';

export function createSocketClient(url: string): Socket {
  console.log(`[Socket.io] Connecting to server at ${url}...`);

  const socket = clientIO(url, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log(`[Socket.io] Connected to server with ID: ${socket.id}`);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket.io] Connection error:', error);
  });

  return socket;
}
