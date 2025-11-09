import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { AggregatorService } from './services/aggregator.service';
import { SocketHandler } from './websocket/socketHandler';
import { createTokenRoutes } from './routes/tokens.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler'; // ADD THIS

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const aggregator = new AggregatorService(
  parseInt(process.env.CACHE_TTL || '30')
);

app.use('/api', createTokenRoutes(aggregator));

// ADD THESE TWO LINES:
app.use(notFoundHandler);
app.use(errorHandler);

const socketHandler = new SocketHandler(server, aggregator);
socketHandler.startPeriodicUpdates(
  parseInt(process.env.UPDATE_INTERVAL || '10000')
);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api/tokens`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  socketHandler.stopPeriodicUpdates();
  server.close(() => {
    console.log('Server shut down gracefully');
  });
});
