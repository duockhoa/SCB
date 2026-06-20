import { MailerService } from '@nestjs-modules/mailer';
import { RecipientService } from './recipient.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class MailService {
    private mailerService;
    private recipientService;
    private prisma;
    private readonly logger;
    constructor(mailerService: MailerService, recipientService: RecipientService, prisma: PrismaService);
    handleHoSoEvents(data: any): Promise<void>;
}
