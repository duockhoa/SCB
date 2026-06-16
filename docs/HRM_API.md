# API Guide HRM

Tài liệu này mô tả các API đang được khai báo trong NestJS backend của hệ thống HRM.

Base URL khi chạy local:

```text
http://localhost:3000
```

Các API có `Auth: Bearer` cần gửi header:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Với API upload file, dùng `multipart/form-data`.

## Quy Ước Chung
- Date/time dùng ISO 8601, ví dụ: `2026-06-11T08:00:00.000Z`.
- ID trên URL thường là số nguyên.
- Response lỗi theo chuẩn NestJS, thường có `statusCode`, `message`, `error`.
- Các API export trả về file binary, không trả JSON.

## Auth
### Đăng nhập
```http
POST /auth/login
```
Auth: Public

Body:
```json
{
  "username": "admin",
  "password": "password"
}
```

Response:
```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Lấy thông tin user đang đăng nhập
```http
GET /users/me
```
Auth: Bearer

Response:
```json
{
  "id": 1,
  "username": "admin",
  "name": "Admin User",
  "email": "admin@example.com",
  "department": "IT",
  "position": "Manager"
}
```

(Các API khác như Đăng ký, Refresh token, Reset mật khẩu, Users, Companies, v.v. được ghi chi tiết trong chat log)
