# Tài liệu API Webhook Tích hợp: Phần mềm SCB & Hồ sơ Lô (HSL)

Tài liệu này mô tả chi tiết phương thức và cấu trúc dữ liệu mà phần mềm Số Công Bố (SCB) sẽ tự động gửi sang phần mềm Hồ sơ Lô điện tử (HSL) mỗi khi có sự thay đổi về trạng thái hoặc thông tin của một Số công bố. 

Đội ngũ phát triển (Dev) của HSL cần xây dựng một API Endpoint để nhận dữ liệu từ SCB (Webhook Receiver) theo chuẩn sau:

## 1. Thông tin Endpoint

- **Phương thức:** `POST`
- **URL đề xuất (bên HSL):** `https://<domain-hsl>/api/webhooks/scb-sync` *(URL cụ thể sẽ do bên HSL cung cấp lại cho bên SCB sau khi code xong)*
- **Content-Type:** `application/json`

## 2. Bảo mật (Authentication)

Để đảm bảo chỉ phần mềm SCB mới có quyền gửi dữ liệu cập nhật (tránh bị tấn công), API của HSL cần yêu cầu một Header bảo mật chứa Secret Key.

- **Header Key:** `x-api-key`
- **Value:** `<WEBHOOK_TOKEN>` *(Chuỗi token bí mật hai bên sẽ thống nhất)*

**Ví dụ Header Request:**
```http
POST /api/webhooks/scb-sync HTTP/1.1
Host: api.hosolo.dkpharma.vn
Content-Type: application/json
x-api-key: <chuoi-token-bi-mat>
```

## 3. Cấu trúc Gói tin (Request Payload)

Phần mềm SCB sẽ gửi một chuỗi JSON chứa thông tin của Số công bố vừa được cập nhật (Tạo mới, Gia hạn, Sửa đổi mã SAP,...).

### Chi tiết các trường (Fields)

| Trường (Field) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `event_type` | `String` | Có | Loại sự kiện. Luôn mang giá trị `SCB_UPDATED` trong ngữ cảnh này. |
| `data` | `Object` | Có | Chứa các thông tin chi tiết về Số công bố. |
| `data.so_cong_bo` | `String` | Có | Mã định danh Số công bố (VD: `VD-1234-26`). |
| `data.ten_san_pham` | `String` | Có | Tên sản phẩm in trên giấy phép công bố. |
| `data.ngay_cap` | `String` (YYYY-MM-DD) | Có | Ngày cấp số công bố. |
| `data.ngay_het_han` | `String` (YYYY-MM-DD) | Có | Ngày hết hạn của số công bố. |
| `data.trang_thai` | `String` | Có | Trạng thái hiệu lực. Bao gồm: `ACTIVE` (Còn hiệu lực), `EXPIRED` (Hết hạn), `REVOKED` (Bị thu hồi). |
| `data.danh_sach_ma_sap` | `Array[String]` | Có | Mảng chứa các Mã SAP (Thành phẩm) được phép áp dụng Số công bố này. VD: `["TP_PARA_10V", "TP_PARA_100V"]`. (Mảng có thể rỗng `[]` nếu SCB bị rút khỏi tất cả các mã SAP). |
| `data.file_quyet_dinh_url` | `String` | Không | Link URL trỏ về file PDF quyết định cấp phép gốc trên SCB. Có thể `null`. |

### Ví dụ JSON Payload từ SCB gửi sang HSL

```json
{
  "event_type": "SCB_UPDATED",
  "data": {
    "so_cong_bo": "VD-1234-26",
    "ten_san_pham": "Paracetamol 500mg",
    "ngay_cap": "2026-06-20",
    "ngay_het_han": "2031-06-20",
    "trang_thai": "ACTIVE",
    "danh_sach_ma_sap": [
      "TP_PARA_10V",
      "TP_PARA_100V"
    ],
    "file_quyet_dinh_url": "http://scb.dkpharma.vn/api/uploads/quyet-dinh.pdf"
  }
}
```

## 4. Phản hồi dự kiến từ HSL (Response)

Sau khi xử lý xong (Cập nhật database thành công), API của HSL cần trả về HTTP Status Code `200 OK` cho phần mềm SCB để xác nhận.

**Ví dụ HTTP 200 OK:**
```json
{
  "success": true,
  "message": "Mapping updated successfully"
}
```

*Lưu ý: Nếu API của HSL phát hiện lỗi dữ liệu, hoặc Header bảo mật không khớp, vui lòng trả về các HTTP Status Code lỗi tương ứng (VD: 401 Unauthorized, 400 Bad Request).*

## 5. Hướng dẫn Logic Xử lý (dành cho Dev HSL)

Mục tiêu cốt lõi của API này là duy trì bảng trung gian (Mapping) giữa **Mã SAP** và **Số công bố** trên hệ thống HSL luôn đồng bộ với những gì SCB báo sang.

**Thuật toán đề xuất mỗi khi nhận được payload trên:**

1. **Xóa dữ liệu cũ:** Xóa tất cả các bản ghi trong bảng Mapping hiện tại có `so_cong_bo` bằng với `data.so_cong_bo` gửi sang. (Điều này giúp loại bỏ các Mã SAP cũ đã bị phòng Đăng ký gỡ khỏi số công bố).
2. **Thêm dữ liệu mới:** Duyệt qua vòng lặp mảng `data.danh_sach_ma_sap` và thêm mới (Insert) từng bản ghi vào bảng Mapping.

**Ví dụ (Mã giả SQL):**
```sql
BEGIN TRANSACTION;

-- Bước 1: Xóa trắng mapping cũ của số VD-1234-26
DELETE FROM EBR_SCB_Mapping WHERE so_cong_bo = 'VD-1234-26';

-- Bước 2: Insert lại với danh sách mã SAP mới
-- (Lặp lại lệnh Insert theo số phần tử của mảng data.danh_sach_ma_sap)
INSERT INTO EBR_SCB_Mapping 
  (ma_sap, so_cong_bo, ten_san_pham_scb, ngay_het_han, trang_thai, link_pdf)
VALUES 
  ('TP_PARA_10V', 'VD-1234-26', 'Paracetamol 500mg', '2031-06-20', 'ACTIVE', 'http://scb.dkpharma.vn/api/uploads/quyet-dinh.pdf');
  
INSERT INTO EBR_SCB_Mapping 
  (ma_sap, so_cong_bo, ten_san_pham_scb, ngay_het_han, trang_thai, link_pdf)
VALUES 
  ('TP_PARA_100V', 'VD-1234-26', 'Paracetamol 500mg', '2031-06-20', 'ACTIVE', 'http://scb.dkpharma.vn/api/uploads/quyet-dinh.pdf');

COMMIT;
```
