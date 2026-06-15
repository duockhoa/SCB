# Frontend Design Specification: Quản lý Số Công Bố

Với tư cách là Senior Product Designer và Frontend Architect, tôi đã phân tích nghiệp vụ quản lý Số Công Bố và đề xuất bộ tài liệu Thiết kế UI/UX & Kiến trúc Frontend dưới đây. Hệ thống được thiết kế theo tiêu chuẩn Admin Dashboard (B2B Enterprise), ưu tiên hiệu suất, luồng công việc rõ ràng và sự tối giản.

## 1. Kiến trúc UI/UX (Layout Foundation)
- **Framework & Thư viện**: React (Vite) + Ant Design (AntD).
- **Màu sắc chủ đạo**: Xanh dương đậm (Navy/Primary Blue) kết hợp với màu trung tính (Xám/Trắng) tạo cảm giác chuyên nghiệp, tin cậy của ngành Dược.
- **Layout Chính**:
  - **Sidebar (Trái)**: Chứa Navigation menu (Dashboard, Quản lý Hồ sơ, Quản lý Danh mục). Có thể thu gọn.
  - **Header (Trên)**: Chứa Global Search (Tìm nhanh theo Số công bố), Avatar User, Notification (Báo nhắc hạn).
  - **Content Area**: Chứa Breadcrumb điều hướng và khu vực thao tác chính. Nền màu xám nhạt (`#f0f2f5`) để làm nổi bật các thẻ nội dung (Card) màu trắng.

---

## 2. Danh sách Màn hình và Chức năng

### 2.1. Dashboard (Màn hình Trang chủ)
Nơi cung cấp cái nhìn toàn cảnh về tình hình chứng từ, giúp nhân viên không bỏ sót hồ sơ nào.
- **Top Stats Cards**: 4 thẻ hiển thị số lượng (Tổng hồ sơ, Đang xử lý, Sắp hết hạn, Đã hết hạn) với icon minh họa.
- **Widget Cảnh Báo (Critical Widget)**:
  - Một danh sách dạng bảng rút gọn hiển thị các hồ sơ đang nằm ở trạng thái **Sắp hết hạn** (màu Cam) và **Đã hết hạn** (màu Đỏ).
  - Có cột "Ngày nhắc hạn" / "Ngày hết hạn" kèm nút Action để chuyển thẳng tới trang Gia hạn.
- **Biểu đồ (Tùy chọn)**: Biểu đồ cột thể hiện số lượng hồ sơ được Cấp số theo từng tháng.

### 2.2. Màn hình Danh sách Hồ sơ (Hồ sơ Management)
Trung tâm tra cứu và xử lý hồ sơ.
- **Advanced Search Panel (Khung tìm kiếm nâng cao)**:
  - Tích hợp phía trên bảng: Tìm theo *Từ khóa (Tên SP/Số CB)*, Select *Loại hồ sơ*, Select *Trạng thái*, DateRange *Ngày hết hạn*.
- **Data Table (Bảng dữ liệu - AntD Table)**:
  - Các cột: Mã HS, Số Công Bố, Tên Sản Phẩm, Loại Hồ Sơ, Ngày Hết Hạn, Trạng Thái.
  - **Thiết kế Trạng thái bằng AntD Tag**: 
    - `Đang xử lý` (Xanh nhạt/Blue)
    - `Còn hiệu lực` (Xanh lá/Success)
    - `Sắp hết hạn` (Vàng cam/Warning)
    - `Đã hết hạn` (Đỏ/Error)
    - `Đã bị thay thế` (Xám/Default)
    - `Bị thu hồi` (Đen viền đỏ).
  - Cột Action: Dấu `...` (Dropdown) chứa các thao tác nhanh hoặc click trực tiếp vào dòng để mở trang Chi tiết.

### 2.3. Màn hình Chi tiết Hồ sơ (Hồ sơ 360° View)
Sử dụng mô hình **Page Header + Tabs** để tối ưu không gian hiển thị thông tin đồ sộ.
- **Page Header**: Hiển thị to, rõ Tên sản phẩm, Mã hồ sơ, Số công bố (nếu có) và Tag trạng thái hiện tại.
- **Vùng Content (Các Tabs - AntD Tabs)**:
  - **Tab 1 - Tổng quan**: Thông tin chung của hồ sơ (Công ty sở hữu, loại, ngày cấp...).
  - **Tab 2 - Thông tin kỹ thuật**: Form chi tiết tùy biến theo từng loại hồ sơ (ví dụ: Tab Hồ sơ Thuốc sẽ có Hoạt chất, Bào chế; Tab TBYT có Phân loại...).
  - **Tab 3 - Tài liệu**: Bảng danh sách các file đính kèm.
  - **Tab 4 - Timeline Lịch sử**: Sử dụng component `AntD Timeline` để vẽ lại vòng đời: `Khởi tạo -> Cấp số -> Gia hạn lần 1...`.
  - **Tab 5 - Nhật ký**: Bảng lưới ghi nhận ai đã thực hiện thao tác gì, lúc nào.
- **Sticky Footer Action Bar (Thanh công cụ cố định dưới cùng)**:
  - Hệ thống tự động nhận diện Trạng thái hiện tại để hiển thị nút phù hợp.
  - Nếu `Đang xử lý`: Hiện nút **[Cấp Số Công Bố]** (Primary).
  - Nếu `Còn hiệu lực / Sắp hết hạn`: Hiện nút **[Gia Hạn]** và **[Thay Thế Số]**.
  - Tùy chọn **[Thu Hồi]** nằm trong menu Mở rộng (dấu `...`).

### 2.4. Các Modal/Drawer Nghiệp Vụ
Sử dụng Modal để thao tác nhanh mà không rời khỏi trang:
- **Modal Cấp Số**: Form có `Số công bố` (Text input), `Ngày cấp` (DatePicker), `Ngày hết hạn` (DatePicker), `Ngày nhắc hạn` (DatePicker).
- **Modal Gia Hạn**: Hiển thị Số công bố hiện tại (ReadOnly), yêu cầu nhập `Ngày hết hạn mới`, `Ngày nhắc hạn mới`.
- **Modal Thay Thế (Nguy cơ cao)**: Cảnh báo bằng Text Đỏ: *"Hành động này sẽ tạo mới 100% một bộ hồ sơ và vô hiệu hóa hồ sơ cũ"*. Form yêu cầu nhập Mã hồ sơ hệ thống mới, Số công bố mới, Ngày cấp, Ngày hết hạn.
- **Modal Thu Hồi**: Form yêu cầu nhập "Lý do thu hồi" và "Tệp quyết định đính kèm" (Upload).

---

## 3. Luồng Thao Tác (User Workflow)

**Luồng 1: Khởi tạo và Cấp số**
1. User bấm "Tạo mới hồ sơ" -> Nhập Tên sản phẩm, Loại hồ sơ -> Submit.
2. Hồ sơ nằm ở trạng thái `Đang xử lý`. 
3. User nộp cơ quan NN. Khi có kết quả -> User mở trang Chi tiết Hồ sơ.
4. Bấm nút **[Cấp Số]** -> Điền thông tin vào Modal -> Lưu.
5. Hồ sơ nhảy sang `Còn hiệu lực`.

**Luồng 2: Nhắc hạn và Gia hạn**
1. User đăng nhập, nhìn thấy Widget trên Dashboard báo "Có 3 hồ sơ sắp hết hạn".
2. User click vào hồ sơ để xem chi tiết.
3. User làm thủ tục xin gia hạn. Khi xong, bấm **[Gia hạn]**.
4. Điền ngày hết hạn mới. Hệ thống ghi Log và Timeline. Hồ sơ quay về `Còn hiệu lực` (màu Xanh lá).

**Luồng 3: Thay thế số công bố**
1. Sản phẩm đổi bảng thành phần, phải xin số CB hoàn toàn mới.
2. User mở hồ sơ cũ -> Chọn **[Thay thế số công bố]**.
3. Điền Số mới vào Modal -> Submit.
4. Hệ thống redirect User sang trang Chi tiết của Hồ Sơ Mới vừa được clone ra. Hồ sơ cũ ẩn đi hoặc hiện màu xám (`Đã bị thay thế`).
