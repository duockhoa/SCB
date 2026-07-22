import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { RecipientService } from './recipient.service';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';
import { MailController } from './mail.controller';

@Module({
  controllers: [EmailConfigController, MailController],
  providers: [MailService, RecipientService, EmailConfigService],
  exports: [MailService, RecipientService, EmailConfigService],
})
export class MailModule {}
