import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import http from "http";
import { disconnectRedis } from "./lib/redis";
import { closeSocketServer, createSocketServer } from "./lib/socket";
import attendanceRoutes from "./routes/attendance.routes";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import teacherRoutes from "./routes/teacher.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Enable gzip compression
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/teacher", teacherRoutes);
app.use("/api/v1/attendance", attendanceRoutes);

const server = http.createServer(app);
const io = createSocketServer(server);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.emit("welcome", "Welcome to the ERP backend via Socket.io!");
});

app.get("/", (req: Request, res: Response) => {
  res.send("ERP Backend API is running!");
});

// Test endpoint
app.get("/api/test", (req: Request, res: Response) => {
  console.log("Test endpoint hit");
  res.json({ message: "Backend API is working!" });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Socket.io server should be available at ws://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await disconnectRedis();
  await closeSocketServer();
  process.exit(0);
});
