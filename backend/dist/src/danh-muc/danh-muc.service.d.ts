import { PrismaService } from '../prisma/prisma.service';
export declare class DanhMucService {
    private prisma;
    constructor(prisma: PrismaService);
    getLoaiHoSo(): Promise<{
        id: number;
        ma_loai: string;
        ten_loai: string;
        mo_ta: string | null;
        thu_tu: number;
        trang_thai: boolean;
    }[]>;
    getTinhTrang(): Promise<{
        id: number;
        thu_tu: number;
        ma_tinh_trang: string;
        ten_tinh_trang: string;
        mau_sac: string | null;
    }[]>;
    getLoaiTaiLieu(): Promise<{
        id: number;
        thu_tu: number;
        trang_thai: boolean;
        ma_loai_tai_lieu: string;
        ten_loai_tai_lieu: string;
    }[]>;
    getLoaiThayDoi(): Promise<{
        id: number;
        ma_loai_thay_doi: string;
        ten_loai_thay_doi: string;
    }[]>;
}
