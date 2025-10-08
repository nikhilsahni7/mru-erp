import type { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
export declare function createSocketServer(httpServer: HTTPServer): Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function closeSocketServer(): Promise<void>;
