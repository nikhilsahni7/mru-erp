import { disconnectRedis } from 'db/redis';
import type { Request, Response } from 'express';
import http from 'http';
import { closeSocketServer, createSocketServer } from 'mru-socket/server';
import app from './app';


// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const server = http.createServer(app);
const io = createSocketServer(server);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('welcome', 'Welcome to the ERP backend via Socket.io!');
});

app.get('/', (req: Request, res: Response) => {
  res.send('ERP Backend API is running!');
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Backend API is working!' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Socket.io server should be available at ws://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await disconnectRedis();
  await closeSocketServer();
  process.exit(0);
});
