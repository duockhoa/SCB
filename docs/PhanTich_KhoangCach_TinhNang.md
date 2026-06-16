# Phân tích mức độ đáp ứng tính năng (Gap Analysis)
*Ngày đánh giá: 16/06/2026*

Tài liệu này đối chiếu danh sách 8 nhóm tính năng yêu cầu với thực trạng mã nguồn và cơ sở dữ liệu hiện tại của hệ thống Quản lý Hồ sơ SCB.

---

## 1. Danh mục nền
**Yêu cầu:** Loại hồ sơ, Tình trạng hồ sơ, Loại tài liệu, Vai trò công ty.
**Thực trạng:** 🟡 **Thiếu một phần**
- Đã có đầy đủ các danh mục: `dm_loai_ho_so`, `dm_tinh_trang`, `dm_loai_tai_lieu`.
- **Thiếu:** Chưa có danh mục `Vai trò công ty` độc lập (hiện đang hardcode thông qua các khóa ngoại `cong_ty_so_huu_id`, `cong_ty_dung_ten_id`, `cong_ty_phan_phoi_id` trong bảng hồ sơ).

## 2. Quản lý sản phẩm
**Yêu cầu:** Tạo/sửa/xem sản phẩm; Tìm theo tên, dạng bào chế, quy cách; Gắn sản phẩm với hồ sơ công bố.
**Thực trạng:** 🔴 **Thiếu hoàn toàn**
- Hệ thống hiện tại **không có bảng Quản lý Sản phẩm độc lập**. Tên sản phẩm đang được nhập tay dạng Text (`ten_san_pham`) thẳng vào bảng `ho_so_chung`.
- Các trường Dạng bào chế, Quy cách đóng gói đang nằm rải rác bên trong các bảng con (ví dụ `ho_so_thuoc`).
- **Hành động cần thiết:** Tạo bảng Master `dm_san_pham`, gỡ bỏ text `ten_san_pham` ở hồ sơ và thay bằng `san_pham_id`. Chuyển các trường quy cách, bào chế về bảng sản phẩm.

## 3. Quản lý công ty
**Yêu cầu:** Chủ sở hữu, Nhà sản xuất, Cơ sở đứng tên, Đơn vị đăng ký, Một công ty dùng cho nhiều hồ sơ.
**Thực trạng:** 🟡 **Thiếu một phần**
- Đã có bảng `dm_cong_ty`, một công ty đã dùng được cho nhiều hồ sơ.
- **Thiếu:** Hệ thống hiện chỉ hỗ trợ gán 3 vai trò (Sở hữu, Đứng tên, Phân phối). Chưa có các vai trò như **Nhà sản xuất** hay **Đơn vị đăng ký**.
- **Hành động cần thiết:** Thiết kế lại cơ chế map Công ty - Hồ sơ thành quan hệ N-N (tạo bảng `ho_so_cong_ty`) để linh hoạt thêm vô hạn các vai trò công ty.

## 4. Quản lý hồ sơ
**Yêu cầu:** Tạo hồ sơ mới, Chọn loại, Nhập số công bố, Ngày cấp/hết hạn, Tình trạng, Gắn sản phẩm, Gắn công ty.
**Thực trạng:** 🟢 **Hoàn thành**
- Đã đáp ứng rất tốt. Trừ phần "Gắn sản phẩm" hiện tại đang là nhập Text chứ chưa phải chọn từ danh mục sản phẩm (như đã nêu ở mục 2).

## 5. Chi tiết theo loại hồ sơ
**Yêu cầu:** Hồ sơ thuốc, mỹ phẩm, TBYT, TPBVSK, CPP/CFS, tự công bố.
**Thực trạng:** 🟢 **Hoàn thành**
- Đã thiết kế hoàn chỉnh các bảng con 1-1 cho từng loại (`ho_so_thuoc`, `ho_so_my_pham`, `ho_so_tbyt`, v.v.) và hiển thị tốt trên UI (Phần thông tin đặc thù).

## 6. Thay đổi hồ sơ
**Yêu cầu:** Thêm lần thay đổi, Nội dung, Mã số + ngày, Tình trạng xử lý, Công văn phê duyệt.
**Thực trạng:** 🟢 **Hoàn thành**
- Bảng `lich_su_thay_doi_ho_so` đáp ứng đúng thiết kế này. UI đã có các Modal Cấp số, Gia hạn, Thay thế.

## 7. Tài liệu hồ sơ
**Yêu cầu:** Upload file, Gắn loại tài liệu, Gắn hồ sơ chính, Gắn từng lần thay đổi, Lưu link GD/PDF.
**Thực trạng:** 🟡 **Thiếu một phần**
- Đã làm tốt phần gắn tài liệu vào hồ sơ chính (qua `ho_so_chung_id`).
- **Thiếu:** Chưa có cơ chế gắn tài liệu cụ thể vào **từng lần thay đổi hồ sơ**. 
- **Hành động cần thiết:** Bổ sung trường `lich_su_thay_doi_id` vào bảng `tai_lieu_ho_so`.

## 8. Tra cứu & báo cáo
**Yêu cầu:** Tìm theo số CB, sản phẩm, công ty, loại hồ sơ, sắp hết hạn, báo cáo số lượng.
**Thực trạng:** 🔴 **Thiếu Giao diện & API lọc nâng cao**
- Hiện tại trang danh sách chỉ có ô Input tìm kiếm chuỗi đơn giản (tên, mã hồ sơ).
- **Thiếu:** Chưa có bộ lọc thả xuống cho Công ty, Loại hồ sơ. Chưa có bộ lọc Cảnh báo sắp hết hạn. Chưa có màn hình Dashboard thống kê (Biểu đồ).

---

## 🎯 Tóm tắt Kế hoạch Đề xuất (Next Steps)
1. **Refactor Database (Ưu tiên Cao):** 
   - Tách bảng `dm_san_pham`.
   - Tạo bảng mapping `ho_so_cong_ty`.
   - Cập nhật Prisma Schema và chạy Migration.
2. **Cập nhật Backend API:** Sửa lại các controller Create/Update/Get hồ sơ cho phù hợp cấu trúc DB mới.
3. **Cập nhật UI Form:** Sửa `HoSoFormModal` để chọn Sản phẩm thay vì nhập Text. Thêm Select đa luồng cho Công ty theo vai trò.
4. **Xây dựng Màn hình Báo cáo:** Tạo UI Dashboard biểu đồ và bộ lọc nâng cao cho trang danh sách.
