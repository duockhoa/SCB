import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHoSoDto } from './dto/create-ho-so.dto';
import { UpdateHoSoDto } from './dto/update-ho-so.dto';
import { CapSoDto } from './dto/cap-so.dto';
import { GiaHanDto } from './dto/gia-han.dto';
import { ThayTheDto } from './dto/thay-the.dto';
import { ThayDoiDto } from './dto/thay-doi.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class HoSoService {
  constructor(private prisma: PrismaService) {}

  private async getLoaiThayDoi(ma: string, ten: string) {
    let loaiThayDoi = await this.prisma.dm_loai_thay_doi.findFirst({ where: { ma_loai_thay_doi: ma } });
    if (!loaiThayDoi) {
      loaiThayDoi = await this.prisma.dm_loai_thay_doi.create({ data: { ma_loai_thay_doi: ma, ten_loai_thay_doi: ten } });
    }
    return loaiThayDoi;
  }

  async findAll(query: any) {
    const {
      search,
      loai_ho_so,
      tinh_trang,
      cong_ty_id,
      ngay_het_han_from,
      ngay_het_han_to,
      page = 1,
      limit = 10
    } = query;

    const where: Prisma.ho_so_chungWhereInput = {};

    if (search) {
      where.OR = [
        { ma_ho_so: { contains: search } },
        { so_chinh: { contains: search } },
        { ten_san_pham: { contains: search } },
        { ten_san_pham_khong_dau: { contains: search } },
        { ma_san_pham_noi_bo: { contains: search } }
      ];
    }
    if (loai_ho_so) where.loai_ho_so_id = Number(loai_ho_so);
    if (tinh_trang) where.tinh_trang_id = Number(tinh_trang);
    if (cong_ty_id) {
      const cid = Number(cong_ty_id);
      where.OR = [
        ...(where.OR ? where.OR : []),
        { cong_ty_so_huu_id: cid },
        { cong_ty_dung_ten_id: cid },
        { cong_ty_phan_phoi_id: cid }
      ];
    }
    if (ngay_het_han_from || ngay_het_han_to) {
      where.ngay_het_han = {};
      if (ngay_het_han_from) where.ngay_het_han.gte = new Date(ngay_het_han_from);
      if (ngay_het_han_to) where.ngay_het_han.lte = new Date(ngay_het_han_to);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      this.prisma.ho_so_chung.count({ where }),
      this.prisma.ho_so_chung.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          loai_ho_so: true,
          tinh_trang: true,
          cong_ty_so_huu: true
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    return { total, page: Number(page), limit: Number(limit), data };
  }

  async findOne(id: number) {
    const hoSo = await this.prisma.ho_so_chung.findUnique({
      where: { id },
      include: {
        loai_ho_so: true,
        tinh_trang: true,
        cong_ty_so_huu: true,
        cong_ty_dung_ten: true,
        cong_ty_phan_phoi: true,
        ho_so_thuoc: true,
        ho_so_my_pham: true,
        ho_so_tbyt: true,
        ho_so_tpbvsk_tu_cong_bo: true,
        ho_so_tpbvsk_cong_bo: true,
        ho_so_cfs_cpp: true,
        tai_lieu: true,
        lich_su_thay_doi: true,
        nhat_ky: { orderBy: { created_at: 'desc' } }
      }
    });

    if (!hoSo) throw new NotFoundException('Không tìm thấy hồ sơ');
    return hoSo;
  }

  async create(data: CreateHoSoDto) {
    const { thong_tin_rieng, nguoi_thuc_hien_id, ...chungData } = data;

    const exists = await this.prisma.ho_so_chung.findUnique({ where: { ma_ho_so: data.ma_ho_so } });
    if (exists) throw new ConflictException('Mã hồ sơ đã tồn tại');

    const loaiHoSo = await this.prisma.dm_loai_ho_so.findUnique({ where: { id: data.loai_ho_so_id } });
    if (!loaiHoSo) throw new NotFoundException('Không tìm thấy loại hồ sơ');

    return this.prisma.$transaction(async (tx) => {
      const hoSoChung = await tx.ho_so_chung.create({
        data: {
          ...chungData,
          ngay_cong_bo: chungData.ngay_cong_bo ? new Date(chungData.ngay_cong_bo) : null,
          ngay_het_han: chungData.ngay_het_han ? new Date(chungData.ngay_het_han) : null,
        }
      });

      if (thong_tin_rieng) {
        const maLoai = loaiHoSo.ma_loai;
        if (maLoai === 'THUOC') await tx.ho_so_thuoc.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
        else if (maLoai === 'MY_PHAM') await tx.ho_so_my_pham.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
        else if (maLoai === 'TBYT') await tx.ho_so_tbyt.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
        else if (maLoai === 'TPBVSK_TU_CONG_BO') await tx.ho_so_tpbvsk_tu_cong_bo.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
        else if (maLoai === 'TPBVSK_CONG_BO') await tx.ho_so_tpbvsk_cong_bo.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
        else if (maLoai === 'CFS_CPP') await tx.ho_so_cfs_cpp.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
      }

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoChung.id,
          hanh_dong: 'CREATE',
          nguoi_thuc_hien_id: nguoi_thuc_hien_id || null,
          noi_dung: `Tạo mới hồ sơ ${chungData.ma_ho_so}`,
          du_lieu_cu: null,
          du_lieu_moi: JSON.stringify({ chung: chungData, rieng: thong_tin_rieng })
        }
      });

      return hoSoChung;
    });
  }

  async update(id: number, data: UpdateHoSoDto) {
    const hoSo = await this.findOne(id);
    const { thong_tin_rieng, nguoi_thuc_hien_id, ...chungData } = data;

    if (data.ma_ho_so) {
      const exists = await this.prisma.ho_so_chung.findFirst({
        where: { ma_ho_so: data.ma_ho_so, id: { not: id } }
      });
      if (exists) throw new ConflictException('Mã hồ sơ đã tồn tại');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedChung = await tx.ho_so_chung.update({
        where: { id },
        data: {
          ...chungData,
          ngay_cong_bo: chungData.ngay_cong_bo ? new Date(chungData.ngay_cong_bo) : undefined,
          ngay_het_han: chungData.ngay_het_han ? new Date(chungData.ngay_het_han) : undefined,
        }
      });

      if (thong_tin_rieng) {
        const maLoai = hoSo.loai_ho_so.ma_loai;
        if (maLoai === 'THUOC') await tx.ho_so_thuoc.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_thuoc.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
        else if (maLoai === 'MY_PHAM') await tx.ho_so_my_pham.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_my_pham.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
        else if (maLoai === 'TBYT') await tx.ho_so_tbyt.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_tbyt.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
        else if (maLoai === 'TPBVSK_TU_CONG_BO') await tx.ho_so_tpbvsk_tu_cong_bo.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_tpbvsk_tu_cong_bo.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
        else if (maLoai === 'TPBVSK_CONG_BO') await tx.ho_so_tpbvsk_cong_bo.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_tpbvsk_cong_bo.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
        else if (maLoai === 'CFS_CPP') await tx.ho_so_cfs_cpp.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_cfs_cpp.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
      }

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: nguoi_thuc_hien_id || null,
          noi_dung: `Cập nhật hồ sơ ${updatedChung.ma_ho_so}`,
          du_lieu_cu: JSON.stringify(hoSo),
          du_lieu_moi: JSON.stringify({ chung: chungData, rieng: thong_tin_rieng })
        }
      });

      return updatedChung;
    });
  }

  async capSo(id: number, data: CapSoDto) {
    const hoSo = await this.findOne(id);
    const ttConHieuLuc = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'CON_HIEU_LUC' } });
    
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ho_so_chung.update({
        where: { id },
        data: {
          so_chinh: data.so_chinh,
          ngay_cong_bo: new Date(data.ngay_cong_bo),
          ngay_het_han: data.ngay_het_han ? new Date(data.ngay_het_han) : null,
          ngay_nhac_han: data.ngay_nhac_han ? new Date(data.ngay_nhac_han) : null,
          tinh_trang_id: ttConHieuLuc?.id || hoSo.tinh_trang_id
        }
      });

      await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: id,
          lan_thu: data.lan_thu || hoSo.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('CAP_SO', 'Cấp số')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi || `Cấp số: ${data.so_chinh}`,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang || 'DA_PHE_DUYET',
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu
        }
      });
      
      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'CAP_SO',
          noi_dung: `Cấp số công bố ${data.so_chinh} cho hồ sơ`,
          du_lieu_cu: JSON.stringify({ so_chinh: hoSo.so_chinh, tinh_trang_id: hoSo.tinh_trang_id }),
          du_lieu_moi: JSON.stringify({ so_chinh: data.so_chinh, tinh_trang_id: ttConHieuLuc?.id })
        }
      });
      return updated;
    });
  }

  async giaHan(id: number, data: GiaHanDto) {
    const hoSo = await this.findOne(id);
    const ttConHieuLuc = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'CON_HIEU_LUC' } });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ho_so_chung.update({
        where: { id },
        data: {
          ngay_het_han: new Date(data.ngay_het_han),
          ngay_nhac_han: data.ngay_nhac_han ? new Date(data.ngay_nhac_han) : null,
          tinh_trang_id: ttConHieuLuc?.id || hoSo.tinh_trang_id
        }
      });

      await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: id,
          lan_thu: data.lan_thu || hoSo.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('GIA_HAN', 'Gia hạn')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi || `Gia hạn đến ngày: ${data.ngay_het_han}`,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang || 'DA_PHE_DUYET',
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu || `Ngày hết hạn cũ: ${hoSo.ngay_het_han}`
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'GIA_HAN',
          noi_dung: `Gia hạn số công bố ${hoSo.so_chinh}`,
          du_lieu_cu: JSON.stringify({ ngay_het_han: hoSo.ngay_het_han }),
          du_lieu_moi: JSON.stringify({ ngay_het_han: data.ngay_het_han })
        }
      });
      return updated;
    });
  }

  async thayThe(id: number, data: ThayTheDto) {
    const hoSoCu = await this.findOne(id);
    const ttDaThayThe = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'DA_THAY_THE' } });
    if (!ttDaThayThe) {
      await this.prisma.dm_tinh_trang.create({ data: { ma_tinh_trang: 'DA_THAY_THE', ten_tinh_trang: 'Đã bị thay thế' } });
    }
    const ttDaThayTheMoi = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'DA_THAY_THE' } });
    const ttConHieuLuc = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'CON_HIEU_LUC' } });

    return this.prisma.$transaction(async (tx) => {
      // Create new
      const hoSoMoi = await tx.ho_so_chung.create({
        data: {
          ma_ho_so: data.ma_ho_so_moi,
          so_chinh: data.so_chinh_moi,
          loai_ho_so_id: hoSoCu.loai_ho_so_id,
          ten_san_pham: hoSoCu.ten_san_pham,
          ten_san_pham_khong_dau: hoSoCu.ten_san_pham_khong_dau,
          ma_san_pham_noi_bo: hoSoCu.ma_san_pham_noi_bo,
          cong_ty_so_huu_id: hoSoCu.cong_ty_so_huu_id,
          cong_ty_dung_ten_id: hoSoCu.cong_ty_dung_ten_id,
          cong_ty_phan_phoi_id: hoSoCu.cong_ty_phan_phoi_id,
          ngay_cong_bo: new Date(data.ngay_cong_bo),
          ngay_het_han: data.ngay_het_han ? new Date(data.ngay_het_han) : null,
          ngay_nhac_han: data.ngay_nhac_han ? new Date(data.ngay_nhac_han) : null,
          tinh_trang_id: ttConHieuLuc?.id,
          ho_so_cu_id: hoSoCu.id
        }
      });

      // Update old status
      await tx.ho_so_chung.update({
        where: { id: hoSoCu.id },
        data: { tinh_trang_id: ttDaThayTheMoi?.id }
      });

      await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: hoSoCu.id,
          lan_thu: data.lan_thu || hoSoCu.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('THAY_THE', 'Thay thế hồ sơ')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi || `Bị thay thế bởi hồ sơ: ${data.ma_ho_so_moi}`,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang || 'DA_PHE_DUYET',
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoCu.id,
          hanh_dong: 'THAY_THE',
          noi_dung: `Đã thay thế bằng hồ sơ mới ${hoSoMoi.ma_ho_so}`,
        }
      });

      return hoSoMoi;
    });
  }

  async thayDoi(id: number, data: ThayDoiDto) {
    const hoSo = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const thayDoi = await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: id,
          lan_thu: data.lan_thu || hoSo.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('KHAC', 'Khác')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang,
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'THAY_DOI',
          noi_dung: `Thêm thay đổi: ${data.noi_dung_thay_doi || 'Bổ sung thông tin'}`,
        }
      });
      return thayDoi;
    });
  }

  async updateLichSuThayDoi(hoSoId: number, lichSuId: number, data: ThayDoiDto) {
    const lichSu = await this.prisma.lich_su_thay_doi_ho_so.findUnique({ where: { id: lichSuId } });
    if (!lichSu || lichSu.ho_so_chung_id !== hoSoId) {
      throw new NotFoundException('Không tìm thấy lịch sử thay đổi');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lich_su_thay_doi_ho_so.update({
        where: { id: lichSuId },
        data: {
          tinh_trang: data.tinh_trang !== undefined ? data.tinh_trang : lichSu.tinh_trang,
          ngay_phe_duyet: data.ngay_phe_duyet !== undefined ? (data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : null) : lichSu.ngay_phe_duyet,
          ma_so_tham_chieu: data.ma_so_tham_chieu !== undefined ? data.ma_so_tham_chieu : lichSu.ma_so_tham_chieu,
          cong_van_url: data.cong_van_url !== undefined ? data.cong_van_url : lichSu.cong_van_url,
          ghi_chu: data.ghi_chu !== undefined ? data.ghi_chu : lichSu.ghi_chu,
          noi_dung_thay_doi: data.noi_dung_thay_doi !== undefined ? data.noi_dung_thay_doi : lichSu.noi_dung_thay_doi,
          loai_thay_doi_id: data.loai_thay_doi_id !== undefined ? data.loai_thay_doi_id : lichSu.loai_thay_doi_id,
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          hanh_dong: 'UPDATE',
          noi_dung: `Cập nhật thông tin lịch sử thay đổi (Lần ${lichSu.lan_thu})`,
          du_lieu_cu: JSON.stringify(lichSu),
          du_lieu_moi: JSON.stringify(updated)
        }
      });

      return updated;
    });
  }

  async remove(id: number) {
    const hoSo = await this.findOne(id);
    await this.prisma.ho_so_chung.delete({ where: { id } });
    return { message: 'Xóa thành công' };
  }
}
