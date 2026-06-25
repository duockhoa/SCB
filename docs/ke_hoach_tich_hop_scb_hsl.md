# Kế hoạch Kiến trúc Chi tiết: Tích hợp SCB & Hồ sơ Lô Điện Tử (EBR) / SAP

Tài liệu này cung cấp bản thiết kế kỹ thuật chuyên sâu về cách xử lý bài toán **1 Thành phẩm (Mã SAP) có nhiều Số công bố (SCB) cùng hiệu lực** và cơ chế đồng bộ tự động giữa 2 hệ thống. Bạn có thể sử dụng tài liệu này để làm việc trực tiếp với đội ngũ phát triển (Dev) của phần mềm Hồ sơ Lô điện tử.

---

## 1. Thiết kế Mô hình Dữ liệu (Database Design)

Để giải quyết triệt để quan hệ Nhiều - Nhiều (N-N) giữa Mã SAP và Số công bố, chúng ta chia trách nhiệm lưu trữ cho 2 hệ thống như sau:

### 1.1. Tại phần mềm SCB (Nơi phát sinh dữ liệu)
Mục tiêu: Đánh dấu 1 hồ sơ công bố áp dụng cho những mã SAP nào.
*   **Bảng `ho_so_chung`:** Thêm cột `danh_sach_ma_sap` (Kiểu dữ liệu: `JSON` hoặc mảng `VARCHAR`).
*   *Ví dụ:* Hồ sơ "Paracetamol 500mg" có số công bố `VD-1234-26`, dùng chung cho mã hộp 10 vỉ (`TP_PARA_10V`) và hộp chai 100 viên (`TP_PARA_100V`). Cột `danh_sach_ma_sap` sẽ lưu giá trị: `["TP_PARA_10V", "TP_PARA_100V"]`.

### 1.2. Tại hệ thống Hồ sơ Lô / SAP (Nơi sử dụng dữ liệu)
Mục tiêu: Biết được 1 mã SAP hiện tại được phép chạy những Số công bố nào.
*   **KHÔNG** lưu số công bố trực tiếp vào Master Data của Thành phẩm (vì Master Data chỉ là quan hệ 1-1).
*   **TẠO MỚI** một Bảng Mapping (Bảng trung gian). Tên gợi ý: `Z_SCB_MAPPING` (nếu làm trên SAP) hoặc `EBR_SCB_Mapping` (trên phần mềm HSL).

**Cấu trúc bảng `EBR_SCB_Mapping`:**
| Tên cột | Kiểu dữ liệu | Ý nghĩa |
| :--- | :--- | :--- |
| `ma_sap` (PK) | VARCHAR(50) | Mã thành phẩm trên SAP |
| `so_cong_bo` (PK) | VARCHAR(100) | Số công bố (VD: VD-1234-26) |
| `ten_san_pham_scb`| VARCHAR(255) | Tên sản phẩm in trên giấy phép |
| `ngay_het_han` | DATE | Ngày hết hạn của Số công bố này |
| `trang_thai` | VARCHAR(50) | `ACTIVE` (Còn hiệu lực) / `EXPIRED` (Hết hạn) |
| `link_pdf` | VARCHAR(1000)| Link trỏ về SCB để xem giấy phép gốc |

---

## 2. Luồng Nghiệp vụ Lập Hồ sơ Lô (Business Flow)

Dưới đây là kịch bản cách nhân viên xưởng sử dụng hệ thống sau khi tích hợp:

1. Nhân viên mở phần mềm Hồ sơ Lô, nhấn tạo **Lệnh sản xuất** cho mã sản phẩm `TP_PARA_10V`.
2. Phần mềm HSL `SELECT * FROM EBR_SCB_Mapping WHERE ma_sap = 'TP_PARA_10V' AND trang_thai = 'ACTIVE'`.
3. Giả sử sản phẩm này đang trong giai đoạn chuyển giao, có 2 số công bố đều `ACTIVE` (số cũ sắp hết hạn, số mới vừa cấp). Phần mềm HSL sẽ xổ ra một **Dropdown List** gồm 2 dòng:
   * `VD-0000-21 (Hết hạn: 30/12/2026)`
   * `VD-1234-26 (Hết hạn: 30/12/2031)`
4. Người lập hồ sơ lô chọn Số công bố phù hợp với lô bao bì đang sử dụng trong kho.
5. Hồ sơ lô in ra sẽ lấy chính xác Số công bố, Tên sản phẩm khớp với lựa chọn đó.

---

## 3. Thiết kế luồng Đồng bộ Tự động (Webhook API)

Để dữ liệu trong bảng `EBR_SCB_Mapping` luôn được cập nhật mà không cần ai nhập tay, phần mềm SCB sẽ đóng vai trò là **Nhà xuất bản (Publisher)** và phần mềm HSL là **Người đăng ký nhận (Subscriber)**.

### Bước 1: Khi có thay đổi tại SCB
Bất cứ khi nào phòng Đăng ký thao tác trên SCB: Cấp số mới, Gia hạn, Thay đổi, hoặc Thu hồi số công bố. Phần mềm SCB tự động phát sinh một gói tin (JSON) đẩy sang phần mềm HSL.

**Cấu trúc Gói tin (Payload) SCB gửi đi:**
```json
{
  "event_type": "SCB_UPDATED",
  "data": {
    "so_cong_bo": "VD-1234-26",
    "ten_san_pham": "Paracetamol 500mg",
    "ngay_cap": "2026-06-20",
    "ngay_het_han": "2031-06-20",
    "trang_thai": "ACTIVE",
    "danh_sach_ma_sap": ["TP_PARA_10V", "TP_PARA_100V"],
    "file_quyet_dinh_url": "http://scb.dkpharma.vn/api/uploads/xyz.pdf"
  }
}
```

### Bước 2: Xử lý tại Hồ sơ Lô (EBR API Receiver)
Đội ngũ code App Hồ sơ Lô cần viết 1 API Endpoint dạng: `POST /api/webhooks/scb-sync`. Khi nhận được gói tin JSON trên, thuật toán xử lý trong Database của HSL như sau:

```sql
-- Dưới đây là logic giả mã (Pseudocode) cho đội dev HSL

-- 1. Xóa các mapping cũ của Số công bố này (để reset)
DELETE FROM EBR_SCB_Mapping WHERE so_cong_bo = 'VD-1234-26';

-- 2. Vòng lặp Insert lại các mã SAP mới nhất do SCB gửi sang
FOREACH ma_sap IN danh_sach_ma_sap:
    INSERT INTO EBR_SCB_Mapping 
    (ma_sap, so_cong_bo, ten_san_pham_scb, ngay_het_han, trang_thai, link_pdf)
    VALUES 
    (ma_sap, 'VD-1234-26', 'Paracetamol 500mg', '2031-06-20', 'ACTIVE', 'http...');
```
> **Lưu ý quan trọng:** Bằng cách Xóa (Delete) và Thêm lại (Insert) theo danh sách mã SAP mới nhất, hệ thống HSL sẽ xử lý được cả trường hợp phòng Đăng ký rút bớt 1 mã SAP ra khỏi Số công bố, hoặc thêm mới 1 mã SAP vào.

### Bước 3: Bảo mật (Security)
Để tránh việc người ngoài biết API của HSL và đẩy số liệu rác vào, hai hệ thống sẽ thống nhất một chuỗi khóa bí mật (Secret Key) gọi là `WEBHOOK_TOKEN`.
- SCB khi gọi API sẽ gắn header: `x-api-key: <WEBHOOK_TOKEN>`.
- App HSL khi nhận API phải kiểm tra, nếu đúng `<WEBHOOK_TOKEN>` mới cho phép thực thi lệnh SQL.

---

## 4. Các bước công việc cần làm tiếp theo (To-do List)

Nếu bạn chốt kế hoạch này, dưới đây là danh sách công việc cần triển khai cho hai bên:

### Về phía Phần mềm SCB (Mình sẽ code):
- [ ] Thiết kế lại giao diện Cập nhật Hồ sơ: Thêm trường nhập **Danh sách Mã SAP** (hỗ trợ nhập nhiều tag).
- [ ] Chỉnh sửa Database Schema để lưu trữ mảng `danh_sach_ma_sap`.
- [ ] Viết Module Webhook, cấu hình URL và Secret Key của HSL vào `.env`.
- [ ] Viết trigger: Cứ lưu/sửa hồ sơ thành công là tự động gọi HTTP POST đẩy payload chứa mảng mã SAP sang cho HSL.

### Về phía Phần mềm Hồ sơ Lô điện tử (Bên Dev HSL làm):
- [ ] Thiết kế bảng trung gian `EBR_SCB_Mapping`.
- [ ] Viết API `POST /api/webhooks/scb-sync` nhận JSON và thực hiện thuật toán Delete/Insert bảng Mapping như tài liệu.
- [ ] Sửa giao diện Lập hồ sơ lô: Lấy số công bố từ bảng Mapping qua Dropdown thay vì lấy fix cứng từ Master Data.
