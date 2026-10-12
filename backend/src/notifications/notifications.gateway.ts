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
import { PrismaService } from '../prisma/prisma.service';

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

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

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

      // 4. Lấy dữ liệu vai trò và phòng ban thực tế từ database
      const ma_nguoi_dung = payload.username || payload.sub?.toString() || payload.id?.toString();
      let userRole = payload.role || payload.roleName || payload.position;
      let userDept = payload.department;
      let dbUser: any = null;

      if (ma_nguoi_dung) {
        dbUser = await this.prisma.nguoi_dung.findUnique({
          where: { ma_nguoi_dung },
          include: { vai_tro: true }
        });
        if (dbUser) {
          userRole = dbUser.vai_tro?.ma_vai_tro || userRole;
          userDept = dbUser.phong_ban || userDept;
        }
      }

      const username = payload.username || '';
      const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
      const isDeveloper = DEVELOPER_USERNAMES.includes(username.toLowerCase()) || userRole === 'ADMIN';

      if (isDeveloper || (userRole && (userRole.toString().toUpperCase().includes('ADMIN') || userRole.toString().toUpperCase().includes('MANAGER')))) {
        client.join('role_ADMIN');
        this.logger.log(`Client ${client.id} joined room role_ADMIN`);
      }

      // Nếu user có quyền thao tác/xem hồ sơ (RBAC), đưa vào room_ho_so
      let perms: string[] = [];
      if (dbUser?.vai_tro?.quyen_han) {
        try {
          perms = JSON.parse(dbUser.vai_tro.quyen_han);
        } catch {
          perms = [];
        }
      }
      if (isDeveloper || perms.includes('*') || perms.includes('HOSO_VIEW')) {
        client.join('room_ho_so');
        this.logger.log(`Client ${client.id} joined room room_ho_so`);
      }

      if (userRole) {
        client.join(`role_${userRole}`);
        this.logger.log(`Client ${client.id} joined room role_${userRole}`);
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
  @OnEvent('hoSo.*')
  handleProfileUpdated(data: any) {
    const ownerId = data.ownerId;
    // 1. Phát cho chủ sở hữu hồ sơ
    if (ownerId) {
      this.server.to(`user_${ownerId}`).emit('profileUpdated', data);
    }
    // 2. Phát cho tất cả Admin
    this.server.to('role_ADMIN').emit('profileUpdated', data);

    // 3. Phát cho tất cả người dùng có quyền xem/thao tác hồ sơ (room_ho_so)
    this.server.to('room_ho_so').emit('profileUpdated', data);
  }
}
