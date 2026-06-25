# Tài liệu API: Quản lý Hồ sơ & Số công bố (SCB)

Tài liệu này cung cấp danh sách các API Endpoint để thao tác với module **Hồ sơ / Số công bố** của hệ thống SCB. Tài liệu này dành cho Developer FE (Frontend) hoặc các hệ thống khác muốn gọi vào Backend.

## 1. Thông tin chung

- **Base URL:** `http://<domain-backend>/api` *(VD: http://localhost:3000/api)*
- **Authentication:** Tất cả các API dưới đây đều yêu cầu xác thực bằng JWT Token.
  - Truyền trong Header: `Authorization: Bearer <your_jwt_token>`

## 2. Danh sách các Endpoints chính

### 2.1. Lấy danh sách Hồ sơ (GET `/ho-so`)
- **Mô tả:** Lấy danh sách các hồ sơ/số công bố, có hỗ trợ phân trang và bộ lọc.
- **Query Parameters:**
  - `search` (string): Tìm kiếm theo tên hoặc mã.
  - `loai_ho_so` (number): ID loại hồ sơ.
  - `tinh_trang` (number): ID tình trạng hiện tại.
  - `cong_ty_id` (number): ID công ty sở hữu.
  - `ngay_het_han_from` (YYYY-MM-DD): Lọc từ ngày hết hạn.
  - `ngay_het_han_to` (YYYY-MM-DD): Lọc đến ngày hết hạn.
  - `page` (number): Số trang hiện tại.
  - `limit` (number): Số lượng bản ghi trên một trang.
- **Quyền hạn:** Mọi user đã đăng nhập.

### 2.2. Lấy chi tiết một Hồ sơ (GET `/ho-so/:id`)
- **Mô tả:** Lấy toàn bộ thông tin chi tiết của một hồ sơ dựa vào ID.
- **Path Variable:** `id` (number) - ID của hồ sơ.
- **Quyền hạn:** Mọi user đã đăng nhập.

### 2.3. Tạo mới Hồ sơ (POST `/ho-so`)
- **Mô tả:** Khởi tạo một hồ sơ mới lên hệ thống.
- **Body:** JSON Request Body tương ứng với `CreateHoSoDto`.
- **Quyền hạn:** Yêu cầu thuộc phòng **Đăng ký**.

### 2.4. Cập nhật thông tin chung Hồ sơ (PUT `/ho-so/:id`)
- **Mô tả:** Chỉnh sửa các thông tin của hồ sơ.
- **Path Variable:** `id` (number) - ID của hồ sơ.
- **Body:** JSON Request Body tương ứng với `UpdateHoSoDto`.
- **Quyền hạn:** Yêu cầu thuộc phòng **Đăng ký** VÀ có chức vụ **Phụ trách (PT)**.

### 2.5. Xóa Hồ sơ (DELETE `/ho-so/:id`)
- **Mô tả:** Xóa vĩnh viễn một hồ sơ khỏi hệ thống.
- **Path Variable:** `id` (number) - ID của hồ sơ.
- **Quyền hạn:** Yêu cầu thuộc phòng **Đăng ký** VÀ có chức vụ **Phụ trách (PT)**.

---

## 3. Các API Nghiệp vụ đặc thù

### 3.1. Cấp Số công bố (PATCH `/ho-so/:id/cap-so`)
- **Mô tả:** Cập nhật số công bố chính thức cho một hồ sơ đang chờ.
- **Body:** Dữ liệu cấp số (`CapSoDto`).
- **Quyền hạn:** Thuộc phòng **Đăng ký**.

### 3.2. Gia hạn Hồ sơ (POST `/ho-so/:id/gia-han`)
- **Mô tả:** Xử lý nghiệp vụ gia hạn hiệu lực cho hồ sơ đã hoặc sắp hết hạn.
- **Body:** Dữ liệu gia hạn (`GiaHanDto`).
- **Quyền hạn:** Thuộc phòng **Đăng ký**.

### 3.3. Thay thế Hồ sơ (POST `/ho-so/:id/thay-the`)
- **Mô tả:** Nghiệp vụ thay thế hồ sơ bằng một số công bố hoàn toàn mới (liên kết với hồ sơ cũ).
- **Body:** Dữ liệu thay thế (`ThayTheDto`).
- **Quyền hạn:** Yêu cầu thuộc phòng **Đăng ký** VÀ chức vụ **Phụ trách (PT)**.

---

## 4. Quản lý Lịch sử thay đổi & Tài liệu đính kèm

### 4.1. Lịch sử thay đổi bổ sung
- **Thêm lịch sử mới:** `POST /ho-so/:id/thay-doi` (Quyền: Phòng `Đăng ký`)
- **Sửa lịch sử:** `PATCH /ho-so/:id/lich-su-thay-doi/:lichSuId` (Quyền: Phòng `Đăng ký`)
- **Xóa lịch sử:** `DELETE /ho-so/:id/lich-su-thay-doi/:lichSuId` (Quyền: Phòng `Đăng ký`)

### 4.2. Tài liệu đính kèm khác
- **Thêm tài liệu:** `POST /ho-so/:id/tai-lieu` (Quyền: Phòng `Đăng ký`)
- **Xóa tài liệu:** `DELETE /ho-so/:id/tai-lieu/:taiLieuId` (Quyền: Phòng `Đăng ký`)

---
**Ghi chú dành cho Developer:** 
Hệ thống có tích hợp sẵn Swagger (OpenAPI). Để xem chi tiết các field (trường dữ liệu) truyền lên trong Body JSON của từng API, vui lòng truy cập đường dẫn Swagger UI của project (mặc định thường là `http://localhost:3000/api/docs`).
