# BÁO CÁO TÀI LIỆU API TRA CỨU & HƯỚNG DẪN GỌI GET HỆ THỐNG SCB

Tài liệu này tổng hợp danh sách các API tra cứu, lấy dữ liệu, xem tệp tin và nhận thông báo thời gian thực của Hệ thống Quản lý Hồ sơ Công bố Sản phẩm (**SCB Backend**), kèm theo **hướng dẫn chi tiết cách gọi API (GET Request Examples)** trên nhiều ngôn ngữ/thư viện.

> **Lưu ý bảo mật:** Mọi thông tin nhạy cảm (như Mật khẩu SMTP, Khóa bí mật JWT, Token cá nhân, Tài khoản quản trị nội bộ hoặc IP Server thật) được ẩn/thay thế bằng các biến giữ chỗ (placeholder) tiêu chuẩn để đảm bảo an toàn thông tin.

---

## 1. TỔNG QUAN HỆ THỐNG

- **Framework**: NestJS (TypeScript)
- **Cơ sở dữ liệu**: Prisma ORM (PostgreSQL / MySQL)
- **Xác thực**: JWT Bearer Token kết hợp với hệ thống SSO / HRM
- **Giao thức thời gian thực**: WebSocket (Socket.io)
- **Document OpenAPI / Swagger**: `/api/docs` (Truy cập tại URL triển khai khi bật server)
- **Base URL**:
  - Môi trường phát triển: `http://localhost:3000/api`
  - Môi trường thử nghiệm / Production: `https://<YOUR_DOMAIN>/api`

---

## 2. QUY CHUẨN PHẢN HỒI (STANDARD RESPONSE FORMAT)

Hệ thống SCB sử dụng Interceptor và Exception Filter toàn cục để đồng bộ hóa cấu trúc dữ liệu trả về cho tất cả các endpoint.

### 2.1. Phản hồi thành công (HTTP Status 200)
```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... }
}
```

### 2.2. Phản hồi lỗi (HTTP Status 400, 401, 403, 404, 500)
```json
{
  "success": false,
  "message": "Thông báo lỗi chi tiết",
  "error": { ... }
}
```

---

## 3. HƯỚNG DẪN CHI TIẾT CÁCH GỌI API GET (FETCH / AXIOS / CURL)

### 3.1. Phương thức 1: Sử dụng cURL (Command Line)

#### Lấy thông tin cá nhân:
```bash
curl -X GET "https://<YOUR_DOMAIN>/api/users/me" \
     -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
     -H "Content-Type: application/json"
```

#### Lấy danh sách hồ sơ có bộ lọc & phân trang:
```bash
curl -X GET "https://<YOUR_DOMAIN>/api/ho-so?search=Pharma&loai_ho_so=1&page=1&limit=10" \
     -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

#### Tải/Xem file tĩnh qua Query Token:
```bash
curl -X GET "https://<YOUR_DOMAIN>/api/upload/files/sample_document.pdf?token=<YOUR_ACCESS_TOKEN>" \
     --output sample_document.pdf
```

---

### 3.2. Phương thức 2: Sử dụng JavaScript Vanilla `fetch`

```javascript
// Hàm helper gọi API GET tổng quát
async function fetchScbApi(endpoint, params = {}, token = null) {
  const baseUrl = 'https://<YOUR_DOMAIN>/api';
  
  // Tự động nối Query Parameters vào URL
  const url = new URL(`${baseUrl}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });

  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi HTTP status: ${response.status}`);
  }

  return await response.json();
}

// === VÍ DỤ SỬ DỤNG ===
// 1. Lấy danh sách hồ sơ
fetchScbApi('/ho-so', { search: 'Thực phẩm', page: 1, limit: 10 }, '<YOUR_TOKEN>')
  .then(res => console.log('Danh sách hồ sơ:', res.data))
  .catch(err => console.error('Lỗi:', err));

// 2. Lấy chi tiết hồ sơ ID = 5
fetchScbApi('/ho-so/5', {}, '<YOUR_TOKEN>')
  .then(res => console.log('Chi tiết hồ sơ:', res.data))
  .catch(err => console.error('Lỗi:', err));
```

---

### 3.3. Phương thức 3: Sử dụng Axios (React / Node.js)

```typescript
import axios from 'axios';

// Khởi tạo instance cho SCB API
const scbApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://<YOUR_DOMAIN>/api',
  timeout: 10000,
});

// Thêm Interceptor tự động đính kèm Token vào Header
scbApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Ví dụ hàm lấy danh sách công ty
export const getDanhSachCongTy = async () => {
  const response = await scbApiClient.get('/cong-ty');
  return response.data; // Trả về { success: true, message, data }
};

// Ví dụ hàm tra cứu danh mục loại hồ sơ
export const getLoaiHoSo = async () => {
  const response = await scbApiClient.get('/danh-muc/loai-ho-so');
  return response.data;
};
```

---

## 4. DANH SÁCH CHI TIẾT ENDPOINTS API TRA CỨU & RESPONSE MẪU

### 4.1. Thông tin Tài khoản & Người dùng (`/api/users`)

#### `GET /api/users/me`
- **Mô tả**: Lấy thông tin tài khoản đang đăng nhập kèm theo vai trò và phòng ban thực tế từ cơ sở dữ liệu.
- **Yêu cầu xác thực**: Có (Bearer Token)
- **Response mẫu**:
  ```json
  {
    "success": true,
    "message": "Thành công",
    "data": {
      "userId": 1,
      "username": "user_demo",
      "name": "Nguyễn Văn A",
      "department": "Đăng ký",
      "position": "Nhân viên",
      "role": "USER"
    }
  }
  ```

#### `GET /api/users`
- **Mô tả**: Lấy danh sách toàn bộ người dùng trong hệ thống SCB.
- **Quyền hạn**: Developer / Admin
- **Yêu cầu xác thực**: Có (Bearer Token)
- **Response mẫu**:
  ```json
  {
    "success": true,
    "message": "Thành công",
    "data": [
      {
        "id": 1,
        "ma_nguoi_dung": "user_demo",
        "ho_ten": "Nguyễn Văn A",
        "email": "nguyenvana@example.com",
        "phong_ban": "Đăng ký",
        "chuc_vu": "Nhân viên",
        "vai_tro": {
          "id": 1,
          "ten_vai_tro": "Người dùng",
          "ma_vai_tro": "USER"
        }
      }
    ]
  }
  ```

#### `GET /api/users/roles`
- **Mô tả**: Lấy danh sách các vai trò (Roles) trong hệ thống.
- **Quyền hạn**: Developer / Admin
- **Yêu cầu xác thực**: Có (Bearer Token)

---

### 4.2. Tra cứu Hồ sơ Công bố (`/api/ho-so`)

#### `GET /api/ho-so`
- **Mô tả**: Lấy danh sách hồ sơ công bố sản phẩm (có hỗ trợ phân trang, tìm kiếm và bộ lọc đa tiêu chí).
- **Yêu cầu xác thực**: Có (Bearer Token)
- **Query Parameters**:
  - `search` *(string, tùy chọn)*: Từ khóa tìm kiếm (tên sản phẩm, mã hồ sơ, số chính)
  - `loai_ho_so` *(number, tùy chọn)*: ID Loại hồ sơ (Ví dụ: 1)
  - `tinh_trang` *(number, tùy chọn)*: ID Tình trạng hồ sơ (Ví dụ: 1)
  - `cong_ty_id` *(number, tùy chọn)*: ID Công ty liên quan
  - `ngay_het_han_from` *(string, tùy chọn)*: Ngày bắt đầu khoảng hết hạn (`YYYY-MM-DD`)
  - `ngay_het_han_to` *(string, tùy chọn)*: Ngày kết thúc khoảng hết hạn (`YYYY-MM-DD`)
  - `page` *(number, tùy chọn)*: Số trang (Mặc định: 1)
  - `limit` *(number, tùy chọn)*: Số bản ghi mỗi trang (Mặc định: 10)
- **Response mẫu**:
  ```json
  {
    "success": true,
    "message": "Thành công",
    "data": {
      "data": [
        {
          "id": 1,
          "ma_ho_so": "HS-2026-001",
          "so_chinh": "12345/2026/DKSP",
          "ma_san_pham_noi_bo": "SP-001",
          "ten_san_pham": "Sản phẩm Mẫu A",
          "ngay_cong_bo": "2026-01-15T00:00:00.000Z",
          "ngay_het_han": "2031-01-15T00:00:00.000Z",
          "loai_ho_so": { "id": 1, "ten_loai": "Thực phẩm bảo vệ sức khỏe" },
          "tinh_trang": { "id": 1, "ten_tinh_trang": "Đã cấp số" },
          "cong_ty_so_huu": { "id": 1, "ten_cong_ty": "Công ty TNHH Dược phẩm A" }
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
  }
  ```

#### `GET /api/ho-so/:id`
- **Mô tả**: Lấy thông tin chi tiết một hồ sơ công bố (bao gồm thông tin chung, thông tin riêng của loại hồ sơ, danh sách công ty liên quan, lịch sử thay đổi bổ sung và danh sách tài liệu đính kèm).
- **Yêu cầu xác thực**: Có (Bearer Token)
- **Response mẫu**:
  ```json
  {
    "success": true,
    "message": "Thành công",
    "data": {
      "id": 1,
      "ma_ho_so": "HS-2026-001",
      "so_chinh": "12345/2026/DKSP",
      "ten_san_pham": "Sản phẩm Mẫu A",
      "thong_tin_rieng": {
        "thanh_phan": "Hoạt chất X",
        "quy_cach_dong_goi": "Hộp 3 vỉ x 10 viên"
      },
      "lich_su_thay_doi": [
        {
          "id": 10,
          "noi_dung_thay_doi": "Bổ sung công văn thay đổi bao bì",
          "ngay_thay_doi": "2026-02-01T00:00:00.000Z"
        }
      ],
      "tai_lieu_dinh_kem": [
        {
          "id": 101,
          "ten_tai_lieu": "Bản công bố sản phẩm.pdf",
          "url": "/api/upload/files/abc123xyz.pdf"
        }
      ]
    }
  }
  ```

---

### 4.3. Tra cứu Danh mục Hệ thống (`/api/danh-muc`)

Tất cả các API Danh mục đều dùng phương thức `GET` để truy vấn dữ liệu danh mục hiển thị:

- `GET /api/danh-muc/loai-ho-so`: Lấy danh sách các Loại hồ sơ.
  - **Response mẫu**:
    ```json
    {
      "success": true,
      "message": "Thành công",
      "data": [
        { "id": 1, "ma_loai": "TPBVSK", "ten_loai": "Thực phẩm bảo vệ sức khỏe" },
        { "id": 2, "ma_loai": "MY_PHAM", "ten_loai": "Mỹ phẩm" }
      ]
    }
    ```
- `GET /api/danh-muc/tinh-trang`: Lấy danh sách các Tình trạng hồ sơ (Đã cấp số, Đang xử lý, Hết hạn,...).
- `GET /api/danh-muc/loai-tai-lieu`: Lấy danh sách các Loại tài liệu đính kèm.
- `GET /api/danh-muc/loai-thay-doi`: Lấy danh sách các Loại thay đổi / bổ sung hồ sơ.

---

### 4.4. Tra cứu Thông tin Công ty (`/api/cong-ty`)

#### `GET /api/cong-ty`
- **Mô tả**: Lấy danh sách tất cả các công ty/doanh nghiệp.
- **Yêu cầu xác thực**: Có (Bearer Token)
- **Response mẫu**:
  ```json
  {
    "success": true,
    "message": "Thành công",
    "data": [
      {
        "id": 1,
        "ma_cong_ty": "CTY_DEMO",
        "ten_cong_ty": "Công ty TNHH Dược phẩm Demo",
        "ten_viet_tat": "DEMO PHARMA",
        "dia_chi": "Hà Nội",
        "ma_so_thue": "0101234567"
      }
    ]
  }
  ```

#### `GET /api/cong-ty/:id`
- **Mô tả**: Lấy thông tin chi tiết của một công ty theo ID.
- **Yêu cầu xác thực**: Có (Bearer Token)

---

### 4.5. Xem & Tải Tệp Tin Đính Kèm (`/api/upload`)

#### `GET /api/upload/files/:filename`
- **Mô tả**: Xem hoặc tải trực tiếp tệp tin tĩnh (PDF, hình ảnh, tài liệu) theo tên file đã lưu trong hệ thống.
- **Yêu cầu xác thực**: Có (Token qua Bearer Header hoặc Query `?token=<ACCESS_TOKEN>`).

#### `GET /api/uploads/:filename`
- **Mô tả**: Endpoint hỗ trợ xem file tương thích ngược (Legacy support) cho các đường dẫn cũ.

---

### 4.6. Xem Cấu hình Email & Thông báo (`/api/email-config`, `/api/mail`)

#### `GET /api/email-config/smtp`
- **Mô tả**: Xem thông số cấu hình máy chủ SMTP gửi mail hiện tại (Mật khẩu được che/bảo vệ).
- **Response mẫu**:
  ```json
  {
    "success": true,
    "message": "Thành công",
    "data": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "user": "notification@example.com",
      "from": "\"Hệ thống SCB\" <notification@example.com>"
    }
  }
  ```

#### `GET /api/email-config/recipients`
- **Mô tả**: Xem danh sách danh bạ người nhận email cảnh báo hết hạn hồ sơ.

#### `GET /api/email-config/events`
- **Mô tả**: Xem danh sách các sự kiện được bật tính năng tự động gửi mail.

#### `GET /api/mail/logo.png`
- **Mô tả**: Tải/Hiển thị logo công khai dùng trong các mẫu email HTML (Trả về định dạng image/png).

---

### 4.7. Xem Nhật ký Hệ thống (`/api/logs`)

#### `GET /api/logs`
- **Mô tả**: Xem danh sách nhật ký thao tác và biến động dữ liệu hệ thống (Hỗ trợ phân trang).
- **Quyền hạn**: Ban quản lý / Phó phòng trở lên (`PT`, `TP`, `Admin`)
- **Query Parameters**:
  - `page` *(number, tùy chọn)*: Số trang (Mặc định: 1)
  - `limit` *(number, tùy chọn)*: Số bản ghi (Mặc định: 20)

---

## 5. NHẬN THÔNG BÁO THỜI GIAN THỰC (WEBSOCKET / SOCKET.IO)

- **URL kết nối**: `ws://localhost:3000` (hoặc `wss://<YOUR_DOMAIN>`)
- **Xác thực kết nối**: Truyền token qua object `auth` khi tạo kết nối socket.
```javascript
import { io } from "socket.io-client";

const socket = io("https://<YOUR_DOMAIN>", {
  auth: {
    token: "<YOUR_ACCESS_TOKEN>"
  }
});

socket.on("connect", () => {
  console.log("Đã kết nối WebSocket thành công:", socket.id);
});

socket.on("profileUpdated", (data) => {
  console.log("Có cập nhật mới từ hệ thống:", data);
});
```

---

## 6. DANH SÁCH MÃ LỖI THƯỜNG GẶP (HTTP STATUS CODES)

| Mã lỗi | Tên lỗi | Nguyên nhân phổ biến |
| :--- | :--- | :--- |
| **200 OK** | Successful | Truy vấn dữ liệu thành công |
| **400 Bad Request** | Bad Request | Tham số Query truyền vào không hợp lệ |
| **401 Unauthorized** | Unauthorized | Token không hợp lệ, hết hạn hoặc chưa đăng nhập |
| **403 Forbidden** | Forbidden | Tài khoản không có đủ thẩm quyền truy vấn |
| **404 Not Found** | Not Found | ID hồ sơ/công ty/file không tồn tại trong hệ thống |
| **500 Internal Error** | Server Error | Lỗi nội bộ server hoặc lỗi kết nối cơ sở dữ liệu |

---

> **Tài liệu tra cứu API & Hướng dẫn GET được tổng hợp tự động từ SCB Backend.**
