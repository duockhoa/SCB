import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleProfileUpdated(data: any): void;
}
