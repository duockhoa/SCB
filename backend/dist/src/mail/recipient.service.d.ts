import { PrismaService } from '../prisma/prisma.service';
export declare class RecipientService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getRecipientsForEvent(eventName: string, context: any): Promise<string[]>;
}
