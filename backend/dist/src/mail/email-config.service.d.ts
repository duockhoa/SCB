import { PrismaService } from '../prisma/prisma.service';
export declare class EmailConfigService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSmtpConfig(): Promise<{
        id: number;
        host: string;
        port: number;
        secure: boolean;
        user: string;
        from_email: string;
        is_active: boolean;
        pass_configured: boolean;
    } | null>;
    saveSmtpConfig(data: any): Promise<{
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
    testSmtpConnection(testEmail: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getRecipients(): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }[]>;
    addRecipient(data: any): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }>;
    updateRecipient(id: number, data: any): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }>;
    deleteRecipient(id: number): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_su_kien: string;
        loai_dieu_kien: string;
        gia_tri: string | null;
    }>;
    getEvents(): Promise<string[]>;
    saveEvents(data: {
        events: string[];
    }): Promise<{
        success: boolean;
    }>;
}
