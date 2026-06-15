# 📊 TIÊU CHUẨN IMPORT DỮ LIỆU EXCEL (DATA DICTIONARY)

Tài liệu này định nghĩa cấu trúc file Excel dùng để import dữ liệu từ hệ thống AppSheet cũ sang Web App mới. Dữ liệu bắt buộc phải được làm sạch và map đúng với cấu trúc này trước khi đẩy vào hệ thống.

## 1. QUY ĐỊNH CHUNG
- **Định dạng:** `.xlsx`
- Mỗi sheet tương ứng với một bảng dữ liệu hoặc một nhóm dữ liệu.
- **Thứ tự import bắt buộc:** `dm_cong_ty` ➡️ `ho_so_chung` ➡️ `ho_so_*` (bảng riêng) ➡️ `tai_lieu_ho_so` ➡️ `lich_su_thay_doi_ho_so`.
- **Mã liên kết:** Dùng `ma_ho_so` để móc nối các bảng hồ sơ với nhau, dùng `ma_cong_ty` để móc nối công ty.
- Dòng nào bị lỗi validate sẽ bị từ chối import, hệ thống ghi nhật ký nguyên nhân.

---

## 2. CẤU TRÚC CÁC SHEET (EXCEL TEMPLATE SPECIFICATION)

### Sheet 1: `dm_cong_ty`
Quản lý danh mục các công ty (sở hữu, phân phối, đứng tên).

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã công ty | `ma_cong_ty` | Text | **Có** | `CTY_ABC` |
| Tên công ty | `ten_cong_ty` | Text | **Có** | `Công ty CP Dược phẩm ABC` |
| Tên viết tắt | `ten_viet_tat` | Text | Không | `ABC Pharma` |
| Địa chỉ | `dia_chi` | Text | Không | `123 Đường X, Quận Y, Hà Nội` |
| Mã số thuế | `ma_so_thue` | Text | Không | `0101234567` |
| Người đại diện | `nguoi_dai_dien` | Text | Không | `Nguyễn Văn A` |

---

### Sheet 2: `ho_so_chung`
Bảng trung tâm lưu trữ thông tin cơ bản của tất cả các loại hồ sơ.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-001` |
| Số chính (Số ĐK/Công bố) | `so_chinh` | Text | Không | `VD-12345-17` |
| Mã nội bộ | `ma_san_pham_noi_bo` | Text | Không | `SP-ABC-01` |
| Loại hồ sơ | `loai_ho_so` | Text | **Có** | `THUOC` *(phải khớp dm_loai_ho_so)* |
| Tên sản phẩm | `ten_san_pham` | Text | **Có** | `Paracetamol 500mg` |
| Tên SP không dấu | `ten_san_pham_khong_dau` | Text | Không | `paracetamol 500mg` |
| Mã công ty sở hữu | `ma_cong_ty_so_huu` | Text | Không | `CTY_ABC` *(link Sheet 1)* |
| Mã công ty đứng tên | `ma_cong_ty_dung_ten`| Text | Không | `CTY_XYZ` *(link Sheet 1)* |
| Mã công ty phân phối| `ma_cong_ty_phan_phoi`|Text | Không | `CTY_LMN` *(link Sheet 1)* |
| Ngày công bố | `ngay_cong_bo` | Date (YYYY-MM-DD)| Không | `2024-01-15` |
| Ngày hết hạn | `ngay_het_han` | Date (YYYY-MM-DD)| Không | `2029-01-15` |
| Tình trạng | `tinh_trang` | Text | Không | `CON_HIEU_LUC` *(khớp danh mục)*|
| Link hồ sơ lưu | `ho_so_luu_url` | Text (URL) | Không | `https://drive.google.com/file/d/...` |
| Ghi chú | `ghi_chu` | Text | Không | `Cần bổ sung giấy tờ X` |

---

### Sheet 3: `ho_so_thuoc`
Dành riêng cho hồ sơ loại `THUOC`. Bắt buộc `ma_ho_so` phải tồn tại trong Sheet 2.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-001` |
| Hoạt chất - Hàm lượng| `hoat_chat_ham_luong`| Text | Không | `Paracetamol 500mg, Cafein 50mg` |
| Dạng bào chế | `bao_che` | Text | Không | `Viên nén` |
| Quy cách đóng gói | `quy_cach_dong_goi` | Text | Không | `Hộp 10 vỉ x 10 viên` |
| Đợt cấp số | `dot_cap_so` | Text | Không | `Đợt 1 - 2024` |
| Gia hạn | `gia_han` | Text | Không | `Gia hạn lần 1 năm 2029` |
| Link Quyết định cấp SĐK| `quyet_dinh_cap_sdk_url`| Text(URL) | Không | `https://drive.google.com/...` |
| Link Kê khai giá | `ke_khai_gia_url` | Text(URL) | Không | `https://drive.google.com/...` |
| Link Quảng cáo | `quang_cao_url` | Text(URL) | Không | `https://drive.google.com/...` |

---

### Sheet 4: `ho_so_my_pham`
Dành riêng cho hồ sơ loại `MY_PHAM`. Bắt buộc `ma_ho_so` tồn tại trong Sheet 2.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-002` |
| Nhãn hàng | `nhan_hang` | Text | Không | `Olay` |
| Dạng mỹ phẩm | `dang_my_pham` | Text | Không | `Kem dưỡng da` |
| Link Phiếu công bố | `phieu_cong_bo_url` | Text(URL) | Không | `https://drive.google.com/...` |
| HS bị thay thế/Ghi chú| `hs_thay_the_ghi_chu`| Text | Không | `Thay thế cho hồ sơ HS-2022-001` |
| Link XN Quảng cáo | `xn_quang_cao_url` | Text(URL) | Không | `https://drive.google.com/...` |

---

### Sheet 5: `ho_so_tbyt`
Dành riêng cho hồ sơ loại `TBYT`. Bắt buộc `ma_ho_so` tồn tại trong Sheet 2.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-003` |
| Tên thương mại | `ten_thuong_mai` | Text | Không | `Máy đo huyết áp Omron` |
| Tên TBYT/Chủng loại | `ten_tbyt_chung_loai` | Text | Không | `Máy đo huyết áp điện tử` |
| Phân loại | `phan_loai` | Text | Không | `Loại B` |
| Chủ sở hữu | `chu_so_huu` | Text | Không | `Omron Healthcare Co., Ltd` |
| Link Phiếu tiếp nhận | `phieu_tiep_nhan_url`| Text(URL) | Không | `https://drive.google.com/...` |
| Link Tài liệu MTKT | `tai_lieu_mo_ta_kt_url`| Text(URL) | Không | `https://drive.google.com/...` |
| Link Tiêu chuẩn CS | `tieu_chuan_co_so_url`| Text(URL) | Không | `https://drive.google.com/...` |
| Link Nhãn | `nhan_url` | Text(URL) | Không | `https://drive.google.com/...` |
| Link HDSD | `hdsd_url` | Text(URL) | Không | `https://drive.google.com/...` |
| Link Quảng cáo | `quang_cao_url` | Text(URL) | Không | `https://drive.google.com/...` |

---

### Sheet 6: `ho_so_tpbvsk_tu_cong_bo`
Dành riêng cho hồ sơ loại `TPBVSK_TU_CONG_BO`. Bắt buộc `ma_ho_so` tồn tại trong Sheet 2.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-004` |
| Cơ sở đứng tên | `co_so_dung_ten` | Text | Không | `Cơ sở sản xuất X` |
| Dạng sản phẩm | `dang_san_pham` | Text | Không | `Bột pha uống` |

---

### Sheet 7: `ho_so_tpbvsk_cong_bo`
Dành riêng cho hồ sơ loại `TPBVSK_CONG_BO`. Bắt buộc `ma_ho_so` tồn tại trong Sheet 2.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-005` |
| Thành phần | `thanh_phan` | Text | Không | `Vitamin C 100mg, Kẽm 10mg` |
| Chủ sở hữu | `chu_so_huu` | Text | Không | `Công ty Y` |
| Link Phiếu công bố | `phieu_cong_bo_url` | Text(URL) | Không | `https://drive.google.com/...` |
| Link XN Quảng cáo | `xn_quang_cao_url` | Text(URL) | Không | `https://drive.google.com/...` |

---

*(Tương tự cho Sheet `ho_so_cfs_cpp` với các trường tương ứng đã định nghĩa trong schema)*

---

### Sheet 8: `tai_lieu_ho_so`
Nhập hàng loạt tài liệu đính kèm. Một `ma_ho_so` có thể có nhiều dòng trong sheet này.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-001` |
| Mã Loại tài liệu | `ma_loai_tai_lieu` | Text | **Có** | `PHIEU_CONG_BO` *(Khớp bảng danh mục)* |
| Tên tài liệu | `ten_tai_lieu` | Text | **Có** | `Bản scan phiếu công bố màu` |
| URL (Google Drive) | `duong_dan_url` | Text(URL) | **Có** | `https://drive.google.com/...` |
| Số phiên bản | `so_phien_ban` | Number | Không | `1` |
| Tài liệu hiện hành | `tai_lieu_hien_hanh` | Boolean | Không | `TRUE` |
| Ngày hiệu lực | `ngay_hieu_luc` | Date | Không | `2024-01-15` |
| Ngày hết hiệu lực | `ngay_het_hieu_luc` | Date | Không | `2029-01-15` |
| Ghi chú | `ghi_chu` | Text | Không | `Bản màu, có dấu đỏ` |

---

### Sheet 9: `lich_su_thay_doi_ho_so`
Nhập dữ liệu lịch sử thay đổi từ các file AppSheet cũ.

| Tên cột Excel | Tên trường DB | Kiểu dữ liệu | Bắt buộc | Ví dụ |
|---|---|---|---|---|
| Mã hồ sơ | `ma_ho_so` | Text | **Có** | `HS-2024-001` |
| Lần thứ | `lan_thu` | Number | **Có** | `1` |
| Mã Loại thay đổi | `ma_loai_thay_doi` | Text | **Có** | `BO_SUNG` *(Khớp bảng danh mục)* |
| Nội dung thay đổi | `noi_dung_thay_doi` | Text | Không | `Bổ sung thêm thành phần tá dược` |
| Mã số tham chiếu | `ma_so_tham_chieu` | Text | Không | `CV-123/2024` |
| Ngày thay đổi | `ngay_thay_doi` | Date | Không | `2024-06-10` |
| Ngày phê duyệt | `ngay_phe_duyet` | Date | Không | `2024-06-15` |
| Tình trạng duyệt | `tinh_trang` | Text | Không | `Đã duyệt` |
| Link Công văn | `cong_van_url` | Text(URL) | Không | `https://drive.google.com/...` |
| Ghi chú | `ghi_chu` | Text | Không | `Chờ bổ sung giấy phép` |
