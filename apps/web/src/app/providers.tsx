'use client';

import { createSocketClient } from 'mru-socket';
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

// Create Socket Context
type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// Socket Provider Component
export function SocketProvider({ children }: PropsWithChildren) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    console.log('Setting up socket connection...');
    const socketClient = createSocketClient('http://localhost:4000');
    setSocket(socketClient);

    // Socket event handlers
    const onConnect = () => {
      console.log('Socket connected!', socketClient.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    const onWelcome = (msg: string) => {
      console.log('Socket.io:', msg);
    };

    // Add event listeners
    socketClient.on('connect', onConnect);
    socketClient.on('disconnect', onDisconnect);
    socketClient.on('welcome', onWelcome);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socketClient.off('connect', onConnect);
      socketClient.off('disconnect', onDisconnect);
      socketClient.off('welcome', onWelcome);
      socketClient.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to use the socket
export const useSocket = () => useContext(SocketContext);
