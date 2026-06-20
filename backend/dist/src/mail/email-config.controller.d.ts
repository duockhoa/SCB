import { EmailConfigService } from './email-config.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class EmailConfigController {
    private readonly emailConfigService;
    private readonly prisma;
    constructor(emailConfigService: EmailConfigService, prisma: PrismaService);
    private checkManagePermission;
    getSmtp(req: any): Promise<{
        id: number;
        host: string;
        port: number;
        secure: boolean;
        user: string;
        from_email: string;
        is_active: boolean;
        pass_configured: boolean;
    } | null>;
    saveSmtp(req: any, data: any): Promise<{
        id: number;
        created_at: Date;
        updated_at: Date;
        host: string;
        user: string;
        port: number;
        secure: boolean;
        pass: string;
        from_email: string;
        is_active: boolean;
    }>;
    testSmtp(req: any, body: {
        test_email: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getRecipients(req: any): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }[]>;
    addRecipient(req: any, data: any): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }>;
    updateRecipient(req: any, id: string, data: any): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }>;
    deleteRecipient(req: any, id: string): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }>;
    getEvents(req: any): Promise<string[]>;
    saveEvents(req: any, data: {
        events: string[];
    }): Promise<{
        success: boolean;
    }>;
}
