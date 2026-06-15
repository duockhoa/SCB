import { PrismaService } from '../prisma/prisma.service';
export declare class CronjobService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleExpirationCheck(): Promise<void>;
}
