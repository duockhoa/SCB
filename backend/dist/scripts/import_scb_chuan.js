"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
require("dotenv/config");
const XLSX = __importStar(require("xlsx"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const adapter = new adapter_mariadb_1.PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new client_1.PrismaClient({ adapter });
function parseSafeDate(val) {
    if (!val)
        return null;
    if (typeof val === 'number') {
        const epoch = new Date(1899, 11, 30);
        return new Date(epoch.getTime() + val * 86400000);
    }
    if (typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d.getTime()))
            return d;
    }
    return null;
}
const tinhTrangMap = [
    { ma: 'CON_HIEU_LUC', ten: 'Còn hiệu lực', mau: 'green' },
    { ma: 'DA_HET_HAN', ten: 'Đã hết hạn', mau: 'red' },
    { ma: 'SAP_HET_HAN', ten: 'Sắp hết hạn', mau: 'orange' },
    { ma: 'DANG_XU_LY', ten: 'Đang xử lý', mau: 'blue' },
    { ma: 'CAN_XAC_NHAN', ten: 'Cần xác nhận', mau: 'default' },
    { ma: 'DA_HUY', ten: 'Đã hủy', mau: 'default' },
    { ma: 'BI_THU_HOI', ten: 'Đã thu hồi', mau: 'red' },
];
async function main() {
    console.log('--- STARTING IMPORT SCB FROM EXCEL ---');
    console.log('Upserting Master Data...');
    for (const tt of tinhTrangMap) {
        await prisma.dm_tinh_trang.upsert({
            where: { ma_tinh_trang: tt.ma },
            update: { ten_tinh_trang: tt.ten, mau_sac: tt.mau },
            create: { ma_tinh_trang: tt.ma, ten_tinh_trang: tt.ten, mau_sac: tt.mau, thu_tu: 1 },
        });
    }
    let defaultLoaiThayDoi = await prisma.dm_loai_thay_doi.findFirst({ where: { ma_loai_thay_doi: 'KHAC' } });
    if (!defaultLoaiThayDoi) {
        defaultLoaiThayDoi = await prisma.dm_loai_thay_doi.create({ data: { ma_loai_thay_doi: 'KHAC', ten_loai_thay_doi: 'Khác' } });
    }
    const filePath = path.join(__dirname, '../../docs/SCB_toi_uu_import.xlsx');
    console.log('Reading file:', filePath);
    if (!fs.existsSync(filePath)) {
        console.error('File không tồn tại!');
        return;
    }
    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames.includes('IMPORT_CHUAN')) {
        console.error('Không tìm thấy sheet IMPORT_CHUAN!');
        return;
    }
    const sheet = workbook.Sheets['IMPORT_CHUAN'];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`Tìm thấy ${data.length} dòng dữ liệu.`);
    let stats = { total: data.length, created: 0, updated: 0, skipped: 0, warning: 0 };
    let errors = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.ma_ho_so || !row.ten_san_pham) {
            errors.push({ row: i + 2, data: row, error: 'Thiếu mã hồ sơ hoặc tên sản phẩm' });
            stats.skipped++;
            continue;
        }
        try {
            await prisma.$transaction(async (tx) => {
                const loaiHoSo = await tx.dm_loai_ho_so.findUnique({ where: { ma_loai: row.loai_ho_so_ma } });
                if (!loaiHoSo)
                    throw new Error(`Không tìm thấy loại hồ sơ: ${row.loai_ho_so_ma}`);
                const tinhTrang = await tx.dm_tinh_trang.findUnique({ where: { ma_tinh_trang: row.tinh_trang_ma } });
                if (!tinhTrang)
                    throw new Error(`Không tìm thấy tình trạng: ${row.tinh_trang_ma}`);
                let congTySoHuuId = null;
                if (row.cong_ty_so_huu_ten) {
                    const cty = await tx.dm_cong_ty.findFirst({ where: { ten_cong_ty: row.cong_ty_so_huu_ten } });
                    if (cty) {
                        congTySoHuuId = cty.id;
                    }
                    else {
                        const newCty = await tx.dm_cong_ty.create({
                            data: { ma_cong_ty: `CTY_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ten_cong_ty: row.cong_ty_so_huu_ten }
                        });
                        congTySoHuuId = newCty.id;
                    }
                }
                let congTyDungTenId = null;
                if (row.cong_ty_dung_ten) {
                    const cty = await tx.dm_cong_ty.findFirst({ where: { ten_cong_ty: row.cong_ty_dung_ten } });
                    if (cty) {
                        congTyDungTenId = cty.id;
                    }
                    else {
                        const newCty = await tx.dm_cong_ty.create({
                            data: { ma_cong_ty: `CTY_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ten_cong_ty: row.cong_ty_dung_ten }
                        });
                        congTyDungTenId = newCty.id;
                    }
                }
                const thongTinRieng = row.thong_tin_rieng_json ? JSON.parse(row.thong_tin_rieng_json) : {};
                const taiLieu = row.tai_lieu_json ? JSON.parse(row.tai_lieu_json) : {};
                const lichSuList = row.lich_su_json ? JSON.parse(row.lich_su_json) : [];
                const hoSoLuuUrl = taiLieu.ho_so_luu_tru || null;
                let action = 'updated';
                const existingHoSo = await tx.ho_so_chung.findUnique({ where: { ma_ho_so: String(row.ma_ho_so) } });
                if (!existingHoSo)
                    action = 'created';
                const hoSoChung = await tx.ho_so_chung.upsert({
                    where: { ma_ho_so: String(row.ma_ho_so) },
                    update: {
                        so_chinh: row.so_chinh ? String(row.so_chinh) : null,
                        ten_san_pham: row.ten_san_pham,
                        loai_ho_so_id: loaiHoSo.id,
                        tinh_trang_id: tinhTrang.id,
                        cong_ty_so_huu_id: congTySoHuuId,
                        cong_ty_dung_ten_id: congTyDungTenId,
                        ngay_cong_bo: parseSafeDate(row.ngay_cong_bo),
                        ngay_het_han: parseSafeDate(row.ngay_het_han),
                        ngay_nhac_han: parseSafeDate(row.ngay_nhac_han),
                        ghi_chu: row.ghi_chu,
                        ho_so_luu_url: hoSoLuuUrl,
                    },
                    create: {
                        ma_ho_so: String(row.ma_ho_so),
                        so_chinh: row.so_chinh ? String(row.so_chinh) : null,
                        ten_san_pham: row.ten_san_pham,
                        loai_ho_so_id: loaiHoSo.id,
                        tinh_trang_id: tinhTrang.id,
                        cong_ty_so_huu_id: congTySoHuuId,
                        cong_ty_dung_ten_id: congTyDungTenId,
                        ngay_cong_bo: parseSafeDate(row.ngay_cong_bo),
                        ngay_het_han: parseSafeDate(row.ngay_het_han),
                        ngay_nhac_han: parseSafeDate(row.ngay_nhac_han),
                        ghi_chu: row.ghi_chu,
                        ho_so_luu_url: hoSoLuuUrl,
                    }
                });
                if (row.loai_ho_so_ma === 'THUOC') {
                    await tx.ho_so_thuoc.upsert({
                        where: { ho_so_chung_id: hoSoChung.id },
                        update: {
                            hoat_chat_ham_luong: thongTinRieng.hoat_chat_ham_luong ? String(thongTinRieng.hoat_chat_ham_luong) : null,
                            bao_che: thongTinRieng.bao_che ? String(thongTinRieng.bao_che) : null,
                            quy_cach_dong_goi: thongTinRieng.quy_cach_dong_goi ? String(thongTinRieng.quy_cach_dong_goi) : null,
                            dot_cap_so: thongTinRieng.dot_cap_so ? String(thongTinRieng.dot_cap_so) : null,
                            gia_han: thongTinRieng.gia_han ? String(thongTinRieng.gia_han) : null,
                            quyet_dinh_cap_sdk_url: taiLieu.quyet_dinh_cap_sdk,
                            ke_khai_gia_url: taiLieu.ke_khai_gia,
                            quang_cao_url: taiLieu.quang_cao
                        },
                        create: {
                            ho_so_chung_id: hoSoChung.id,
                            hoat_chat_ham_luong: thongTinRieng.hoat_chat_ham_luong ? String(thongTinRieng.hoat_chat_ham_luong) : null,
                            bao_che: thongTinRieng.bao_che ? String(thongTinRieng.bao_che) : null,
                            quy_cach_dong_goi: thongTinRieng.quy_cach_dong_goi ? String(thongTinRieng.quy_cach_dong_goi) : null,
                            dot_cap_so: thongTinRieng.dot_cap_so ? String(thongTinRieng.dot_cap_so) : null,
                            gia_han: thongTinRieng.gia_han ? String(thongTinRieng.gia_han) : null,
                            quyet_dinh_cap_sdk_url: taiLieu.quyet_dinh_cap_sdk,
                            ke_khai_gia_url: taiLieu.ke_khai_gia,
                            quang_cao_url: taiLieu.quang_cao
                        }
                    });
                }
                else if (row.loai_ho_so_ma === 'MY_PHAM') {
                    await tx.ho_so_my_pham.upsert({
                        where: { ho_so_chung_id: hoSoChung.id },
                        update: {
                            nhan_hang: thongTinRieng.nhan_hang,
                            dang_my_pham: thongTinRieng.dang_my_pham,
                            hs_thay_the_ghi_chu: thongTinRieng.hs_thay_the_ghi_chu,
                            phieu_cong_bo_url: taiLieu.phieu_cong_bo,
                            xn_quang_cao_url: taiLieu.xn_quang_cao
                        },
                        create: {
                            ho_so_chung_id: hoSoChung.id,
                            nhan_hang: thongTinRieng.nhan_hang,
                            dang_my_pham: thongTinRieng.dang_my_pham,
                            hs_thay_the_ghi_chu: thongTinRieng.hs_thay_the_ghi_chu,
                            phieu_cong_bo_url: taiLieu.phieu_cong_bo,
                            xn_quang_cao_url: taiLieu.xn_quang_cao
                        }
                    });
                }
                else if (row.loai_ho_so_ma === 'TBYT') {
                    await tx.ho_so_tbyt.upsert({
                        where: { ho_so_chung_id: hoSoChung.id },
                        update: {
                            ten_thuong_mai: thongTinRieng.ten_thuong_mai,
                            ten_tbyt_chung_loai: thongTinRieng.ten_tbyt_chung_loai,
                            phan_loai: thongTinRieng.phan_loai,
                            chu_so_huu: thongTinRieng.chu_so_huu,
                            phieu_tiep_nhan_url: taiLieu.phieu_tiep_nhan,
                            tai_lieu_mo_ta_kt_url: taiLieu.mo_ta_ky_thuat,
                            tieu_chuan_co_so_url: taiLieu.tieu_chuan_co_so,
                            nhan_url: taiLieu.nhan,
                            hdsd_url: taiLieu.hdsd,
                            quang_cao_url: taiLieu.quang_cao
                        },
                        create: {
                            ho_so_chung_id: hoSoChung.id,
                            ten_thuong_mai: thongTinRieng.ten_thuong_mai,
                            ten_tbyt_chung_loai: thongTinRieng.ten_tbyt_chung_loai,
                            phan_loai: thongTinRieng.phan_loai,
                            chu_so_huu: thongTinRieng.chu_so_huu,
                            phieu_tiep_nhan_url: taiLieu.phieu_tiep_nhan,
                            tai_lieu_mo_ta_kt_url: taiLieu.mo_ta_ky_thuat,
                            tieu_chuan_co_so_url: taiLieu.tieu_chuan_co_so,
                            nhan_url: taiLieu.nhan,
                            hdsd_url: taiLieu.hdsd,
                            quang_cao_url: taiLieu.quang_cao
                        }
                    });
                }
                else if (row.loai_ho_so_ma === 'TPBVSK_CONG_BO') {
                    await tx.ho_so_tpbvsk_cong_bo.upsert({
                        where: { ho_so_chung_id: hoSoChung.id },
                        update: {
                            thanh_phan: thongTinRieng.thanh_phan,
                            chu_so_huu: thongTinRieng.chu_so_huu,
                            phieu_cong_bo_url: taiLieu.phieu_cong_bo,
                            xn_quang_cao_url: taiLieu.xn_quang_cao
                        },
                        create: {
                            ho_so_chung_id: hoSoChung.id,
                            thanh_phan: thongTinRieng.thanh_phan,
                            chu_so_huu: thongTinRieng.chu_so_huu,
                            phieu_cong_bo_url: taiLieu.phieu_cong_bo,
                            xn_quang_cao_url: taiLieu.xn_quang_cao
                        }
                    });
                }
                else if (row.loai_ho_so_ma === 'TPBVSK_TU_CONG_BO') {
                    await tx.ho_so_tpbvsk_tu_cong_bo.upsert({
                        where: { ho_so_chung_id: hoSoChung.id },
                        update: {
                            co_so_dung_ten: thongTinRieng.co_so_dung_ten,
                            dang_san_pham: thongTinRieng.dang_san_pham,
                        },
                        create: {
                            ho_so_chung_id: hoSoChung.id,
                            co_so_dung_ten: thongTinRieng.co_so_dung_ten,
                            dang_san_pham: thongTinRieng.dang_san_pham,
                        }
                    });
                }
                else if (row.loai_ho_so_ma === 'CFS_CPP') {
                    await tx.ho_so_cfs_cpp.upsert({
                        where: { ho_so_chung_id: hoSoChung.id },
                        update: {
                            loai_hinh: thongTinRieng.loai_hinh,
                            nuoc_xuat_khau: thongTinRieng.nuoc_xuat_khau,
                            cong_van_cap_url: taiLieu.cong_van_cap
                        },
                        create: {
                            ho_so_chung_id: hoSoChung.id,
                            loai_hinh: thongTinRieng.loai_hinh,
                            nuoc_xuat_khau: thongTinRieng.nuoc_xuat_khau,
                            cong_van_cap_url: taiLieu.cong_van_cap
                        }
                    });
                }
                if (lichSuList.length > 0) {
                    await tx.lich_su_thay_doi_ho_so.deleteMany({ where: { ho_so_chung_id: hoSoChung.id } });
                    let lanThu = 1;
                    for (const ls of lichSuList) {
                        let typeId = defaultLoaiThayDoi?.id || 1;
                        let lsType = await tx.dm_loai_thay_doi.findFirst({ where: { ten_loai_thay_doi: ls.loai_thay_doi || 'Khác' } });
                        if (!lsType) {
                            lsType = await tx.dm_loai_thay_doi.create({ data: { ma_loai_thay_doi: `TD_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ten_loai_thay_doi: ls.loai_thay_doi || 'Khác' } });
                        }
                        typeId = lsType.id;
                        await tx.lich_su_thay_doi_ho_so.create({
                            data: {
                                ho_so_chung_id: hoSoChung.id,
                                lan_thu: lanThu++,
                                loai_thay_doi_id: typeId,
                                noi_dung_thay_doi: ls.noi_dung_thay_doi,
                                ma_so_tham_chieu: ls.ma_so_ngay,
                                tinh_trang: ls.tinh_trang,
                                cong_van_url: ls.cong_van
                            }
                        });
                    }
                }
                await tx.nhat_ky_ho_so.create({
                    data: {
                        ho_so_chung_id: hoSoChung.id,
                        hanh_dong: 'IMPORT_EXCEL',
                        noi_dung: 'Import tự động từ file SCB chuẩn hóa'
                    }
                });
                if (action === 'created')
                    stats.created++;
                else
                    stats.updated++;
            });
        }
        catch (e) {
            errors.push({ row: i + 2, data: row, error: e.message });
            stats.skipped++;
        }
    }
    console.log('\n--- KẾT QUẢ IMPORT ---');
    console.log(`Tổng số dòng đọc: ${stats.total}`);
    console.log(`- Created: ${stats.created}`);
    console.log(`- Updated: ${stats.updated}`);
    console.log(`- Skipped (Lỗi): ${stats.skipped}`);
    if (errors.length > 0) {
        const errorLogPath = path.join(__dirname, '../../logs/import_scb_errors.json');
        if (!fs.existsSync(path.dirname(errorLogPath)))
            fs.mkdirSync(path.dirname(errorLogPath), { recursive: true });
        fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
        console.log(`\nCẢNH BÁO: Đã có ${errors.length} dòng lỗi. Kiểm tra log tại: ${errorLogPath}`);
    }
    console.log('--- HOÀN TẤT ---');
}
main()
    .catch((e) => {
    console.error('Fatal Error:', e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=import_scb_chuan.js.map