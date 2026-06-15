import { CongTyService } from './cong-ty.service';
import { CreateCongTyDto } from './dto/create-cong-ty.dto';
import { UpdateCongTyDto } from './dto/update-cong-ty.dto';
export declare class CongTyController {
    private readonly congTyService;
    constructor(congTyService: CongTyService);
    create(createCongTyDto: CreateCongTyDto): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_cong_ty: string;
        ten_cong_ty: string;
        ten_viet_tat: string | null;
        dia_chi: string | null;
        ma_so_thue: string | null;
        nguoi_dai_dien: string | null;
    }>;
    findAll(): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_cong_ty: string;
        ten_cong_ty: string;
        ten_viet_tat: string | null;
        dia_chi: string | null;
        ma_so_thue: string | null;
        nguoi_dai_dien: string | null;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_cong_ty: string;
        ten_cong_ty: string;
        ten_viet_tat: string | null;
        dia_chi: string | null;
        ma_so_thue: string | null;
        nguoi_dai_dien: string | null;
    }>;
    update(id: number, updateCongTyDto: UpdateCongTyDto): Promise<{
        id: number;
        trang_thai: boolean;
        created_at: Date;
        updated_at: Date;
        ma_cong_ty: string;
        ten_cong_ty: string;
        ten_viet_tat: string | null;
        dia_chi: string | null;
        ma_so_thue: string | null;
        nguoi_dai_dien: string | null;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
