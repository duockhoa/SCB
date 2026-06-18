import { MailerService } from '@nestjs-modules/mailer';
import { RecipientService } from './recipient.service';
export declare class MailService {
    private mailerService;
    private recipientService;
    private readonly logger;
    constructor(mailerService: MailerService, recipientService: RecipientService);
    handleHoSoUpdatedEvent(data: any): Promise<void>;
}
