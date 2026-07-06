# Luồng nghiệp vụ chính

Tài liệu mô tả các flow cốt lõi của TechShop. Chi tiết API: [API.md](./API.md). Thanh toán SePay: [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md).

---

## 1. Đăng nhập / đăng ký

```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant F as Nuxt Frontend
  participant B as NestJS API
  participant DB as PostgreSQL

  U->>F: Nhập email + password
  F->>B: POST /auth/login
  B->>DB: Tìm user, verify bcrypt
  alt Hợp lệ
    B-->>F: Set-Cookie access_token + refresh_token (httpOnly)
    B-->>F: { user }
    F-->>U: Redirect trang chủ / profile
  else Sai thông tin
    B-->>F: 401 Unauthorized
    F-->>U: Toast lỗi
  end

  Note over F,B: Refresh: POST /auth/refresh (cookie refresh_token)<br/>Logout: POST /auth/logout (xóa cookie)
```

**Google OAuth:** `GET /auth/google` → Google consent → `GET /auth/google/callback` → set cookie → redirect `FRONTEND_URL/?auth=google`.

---

## 2. Quên mật khẩu / đặt lại mật khẩu

```mermaid
sequenceDiagram
  participant U as User
  participant F as Nuxt
  participant B as NestJS
  participant M as Resend
  participant DB as PostgreSQL

  U->>F: Nhập email (/forgot-password)
  F->>B: POST /auth/forgot-password
  B->>DB: Tìm user active
  alt User tồn tại
    B->>DB: Lưu password_reset_tokens (hash SHA-256, TTL 1h)
    B->>M: sendPasswordReset(email, link)
    M-->>U: Email chứa link /reset-password?token=...
  end
  B-->>F: 200 (luôn trả message chung — chống lộ email)
  F-->>U: Toast hướng dẫn kiểm tra hộp thư

  U->>F: Mở link, nhập mật khẩu mới
  F->>B: POST /auth/reset-password { token, password }
  B->>DB: Verify token còn hạn
  B->>DB: Cập nhật passwordHash, xóa token
  B-->>F: 200
  F-->>U: Redirect /login
```

Cấu hình email: [RESEND_INTEGRATION.md](./RESEND_INTEGRATION.md).

---

## 3. Checkout + thanh toán SePay

```mermaid
sequenceDiagram
  participant U as User
  participant F as Nuxt
  participant B as NestJS
  participant DB as PostgreSQL
  participant S as SePay

  U->>F: Chọn địa chỉ, bấm đặt hàng (/checkout)
  F->>B: POST /orders/checkout
  B->>DB: Transaction: lock stock, tạo order, xóa cart
  B-->>F: { order }

  U->>F: Thanh toán SePay
  F->>B: POST /payments/sepay/init?orderId=
  B->>DB: Tạo payment_transaction (processing)
  B-->>F: { actionUrl, fields, invoiceNumber }
  F->>S: POST form (hidden fields + HMAC signature)
  S-->>U: Trang thanh toán SePay
```

---

## 4. Webhook IPN SePay (nguồn sự thật cho trạng thái `paid`)

```mermaid
sequenceDiagram
  participant S as SePay Server
  participant B as NestJS
  participant DB as PostgreSQL
  participant M as Resend
  participant U as User Browser
  participant F as Nuxt

  U->>S: Hoàn tất thanh toán
  par IPN (server-to-server)
    S->>B: POST /payments/sepay/ipn (ORDER_PAID)
    B->>DB: Cập nhật payment_transaction + order status
    B->>M: Email xác nhận thanh toán (nếu cấu hình)
    B-->>S: {"success": true}
  and Redirect trình duyệt
    S-->>U: Redirect success_url / error_url / cancel_url
    U->>F: /payments/return?status=...&invoice=...
    F->>B: GET /payments/sepay/status?invoice=...
    B->>DB: Đọc trạng thái (read-only)
    B-->>F: paid | processing | failed
    F-->>U: Hiển thị kết quả
  end
```

**Lưu ý:** Redirect trình duyệt chỉ để hiển thị. Chỉ IPN mới đánh dấu đơn `paid` trong database.

---

## 5. Phân quyền (RBAC)

```mermaid
flowchart TD
  A[Request tới route] --> B{Đã đăng nhập?}
  B -->|Không| C[Redirect /login]
  B -->|Có| D{Route /admin/** ?}
  D -->|Không| E[Cho phép customer routes]
  D -->|Có| F{role === admin?}
  F -->|Không| G[Redirect /]
  F -->|Có| H[Admin dashboard / CRUD]
```

Middleware frontend: `auth`, `customer`, `admin`. Backend: `@Roles('admin')` + JWT guard.

---

## Liên kết

| Tài liệu | Nội dung |
|----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Sơ đồ hệ thống tổng quan |
| [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md) | Cấu hình SePay, sandbox, IPN, troubleshooting |
| [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) | Checklist kiểm thử các luồng trên |
