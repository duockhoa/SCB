"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    jwtService;
    server;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            let token = client.handshake.auth?.token;
            if (!token && client.handshake.headers?.authorization) {
                token = client.handshake.headers.authorization.split(' ')[1];
            }
            if (!token) {
                this.logger.warn(`Client disconnected (no token): ${client.id}`);
                client.disconnect();
                return;
            }
            const secret = process.env.JWT_SECRET || 'DO_NOT_USE_IN_PRODUCTION_JWT_SECRET_KEY_12345';
            const payload = await this.jwtService.verifyAsync(token, { secret });
            const userId = payload.sub || payload.id;
            if (userId) {
                client.join(`user_${userId}`);
                this.logger.log(`Client ${client.id} joined room user_${userId}`);
            }
            const role = payload.role || payload.roleName || payload.position;
            if (role && (role.toString().toUpperCase().includes('ADMIN') || role.toString().toUpperCase().includes('MANAGER'))) {
                client.join('role_ADMIN');
                this.logger.log(`Client ${client.id} joined room role_ADMIN`);
            }
            this.logger.log(`Client connected: ${client.id} - User ID: ${userId}`);
        }
        catch (error) {
            this.logger.error(`Client connection failed: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleProfileUpdated(data) {
        const ownerId = data.ownerId;
        if (ownerId) {
            this.server.to(`user_${ownerId}`).emit('profileUpdated', data);
        }
        this.server.to('role_ADMIN').emit('profileUpdated', data);
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, event_emitter_1.OnEvent)('hoSo.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleProfileUpdated", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map