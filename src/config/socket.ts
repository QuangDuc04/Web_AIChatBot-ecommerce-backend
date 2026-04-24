const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:4000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

export const SocketConfig = {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
  pingTimeout: 60000,
  pingInterval: 25000,
};
