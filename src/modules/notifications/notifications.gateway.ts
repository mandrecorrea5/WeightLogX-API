import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers['authorization']?.toString().replace('Bearer ', '');
      if (!token) {
        client.disconnect(true);
        return;
      }
      const secret = this.configService.get<string>('jwt.secret');
      const decoded = this.jwtService.verify(token, { secret });
      const userId: string = decoded.sub || decoded.userId;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      // store userId in socket
      (client.data as any).userId = userId;

      // track sockets
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);

      // join user room
      client.join(`user:${userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId: string | undefined = (client.data as any)?.userId;
    if (!userId) return;
    const set = this.userSockets.get(userId);
    if (set) {
      set.delete(client.id);
      if (set.size === 0) this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage('notification:read')
  async onRead(@ConnectedSocket() client: Socket, @MessageBody() payload: { id: string }) {
    const userId: string = (client.data as any).userId;
    await this.notificationsService.markAsRead(userId, payload.id);
    client.emit('notification:read', { id: payload.id, success: true });
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unread_count:update', { count: unreadCount });
  }

  @SubscribeMessage('notification:read_all')
  async onReadAll(@ConnectedSocket() client: Socket) {
    const userId: string = (client.data as any).userId;
    await this.notificationsService.markAllAsRead(userId);
    this.server.to(`user:${userId}`).emit('unread_count:update', { count: 0 });
    client.emit('notification:read_all', { success: true });
  }

  public async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    // persist and emit
    const saved = await this.notificationsService.saveNotification(notification);
    this.server.to(`user:${userId}`).emit('notification:new', saved);
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unread_count:update', { count: unreadCount });
  }
}
