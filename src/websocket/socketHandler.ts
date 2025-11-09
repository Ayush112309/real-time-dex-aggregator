import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AggregatorService } from '../services/aggregator.service';
import { AggregatedToken } from '../types/token.types';

export class SocketHandler {
  private io: SocketIOServer;
  private aggregator: AggregatorService;
  private updateInterval: NodeJS.Timeout | null = null;
  private previousData: Map<string, AggregatedToken> = new Map();

  constructor(server: HTTPServer, aggregator: AggregatorService) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    this.aggregator = aggregator;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe', async () => {
        console.log(`Client ${socket.id} subscribed to updates`);
        const tokens = await this.aggregator.aggregateTokens(true);
        socket.emit('initial_data', tokens);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  startPeriodicUpdates(intervalMs: number = 10000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const tokens = await this.aggregator.aggregateTokens(false);
        const updates = this.detectSignificantChanges(tokens);

        if (updates.length > 0) {
          this.io.emit('price_updates', updates);
          console.log(`Pushed ${updates.length} updates to clients`);
        }
      } catch (error) {
        console.error('Error in periodic update:', error);
      }
    }, intervalMs);
  }

  private detectSignificantChanges(
    currentTokens: AggregatedToken[]
  ): AggregatedToken[] {
    const updates: AggregatedToken[] = [];

    currentTokens.forEach(token => {
      const previous = this.previousData.get(token.token_address);

      if (!previous) {
        updates.push(token);
      } else {
        const priceChange = Math.abs(
          (token.price_sol - previous.price_sol) / previous.price_sol
        );
        const volumeChange = Math.abs(
          (token.volume_sol - previous.volume_sol) / previous.volume_sol
        );

        if (priceChange > 0.05 || volumeChange > 0.2) {
          updates.push(token);
        }
      }

      this.previousData.set(token.token_address, token);
    });

    return updates;
  }

  stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
