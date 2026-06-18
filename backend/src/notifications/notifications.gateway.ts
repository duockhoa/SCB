import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*', // Tạm thời allow all, có thể điều chỉnh lại sau
  },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // 1. Extract token
      let token = client.handshake.auth?.token;
      if (!token && client.handshake.headers?.authorization) {
        token = client.handshake.headers.authorization.split(' ')[1];
      }

      if (!token) {
        this.logger.warn(`Client disconnected (no token): ${client.id}`);
        client.disconnect();
        return;
      }

      // 2. Verify token
      const secret = process.env.JWT_SECRET || 'DO_NOT_USE_IN_PRODUCTION_JWT_SECRET_KEY_12345';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      const userId = payload.sub || payload.id;

      // 3. Join rooms
      if (userId) {
        client.join(`user_${userId}`);
        this.logger.log(`Client ${client.id} joined room user_${userId}`);
      }

      // Tùy theo cấu trúc token HRM mà map role phù hợp, tạm check các trường phổ biến
      const role = payload.role || payload.roleName || payload.position;
      if (role && (role.toString().toUpperCase().includes('ADMIN') || role.toString().toUpperCase().includes('MANAGER'))) {
        client.join('role_ADMIN');
        this.logger.log(`Client ${client.id} joined room role_ADMIN`);
      }

      this.logger.log(`Client connected: ${client.id} - User ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Client connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Bắt sự kiện qua Event Emitter
  @OnEvent('hoSo.updated')
  handleProfileUpdated(data: any) {
    const ownerId = data.ownerId;
    // 1. Phát cho chủ sở hữu hồ sơ
    if (ownerId) {
      this.server.to(`user_${ownerId}`).emit('profileUpdated', data);
    }
    // 2. Phát cho tất cả Admin/Manager
    this.server.to('role_ADMIN').emit('profileUpdated', data);
  }
}
