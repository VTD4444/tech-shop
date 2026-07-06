# Hướng dẫn demo (3–7 phút)

Outline cho video demo hoặc slide trình bày đồ án. Thay URL bằng môi trường thực tế của nhóm.

---

## Thông tin deploy mẫu

| Thành phần | URL |
|------------|-----|
| Frontend | `https://tech-shop-psi-ecru.vercel.app` |
| Backend API | `https://tech-shop-2zf5.onrender.com/api/v1` |
| Tài khoản admin | `admin@techshop.com` / `admin123` (sau seed) |
| Tài khoản customer | `customer@test.com` / `customer123` |

---

## Cấu trúc trình bày đề xuất (~5 phút)

### 1. Giới thiệu (30s)
- TechShop: website bán linh kiện PC
- Stack: Nuxt 3 + NestJS + PostgreSQL + FastAPI (AI Advisor)
- Thanh toán: **SePay** (cổng thanh toán Việt Nam — QR/chuyển khoản/thẻ)

### 2. Duyệt & tìm sản phẩm (45s)
- Trang chủ → `/products`
- Tìm kiếm, lọc category/brand, sort, pagination
- Chi tiết sản phẩm

### 3. Tài khoản (45s)
- Đăng ký / đăng nhập
- (Tuỳ chọn) Quên mật khẩu — nhắc cần Resend trên production

### 4. Giỏ hàng & checkout (1 phút)
- Thêm sản phẩm → giỏ → wishlist
- Checkout: chọn địa chỉ, tạo đơn
- Thanh toán SePay sandbox → `/payments/return`

### 5. Đơn hàng (30s)
- `/orders` — danh sách
- Chi tiết đơn + timeline trạng thái

### 6. Admin (1 phút)
- Login admin → dashboard thống kê
- CRUD sản phẩm / brand / category
- Quản lý đơn, đổi trạng thái

### 7. Tính năng nổi bật (1 phút)
- PC Builder — kiểm tra tương thích linh kiện
- AI Advisor — tư vấn cấu hình theo ngân sách

### 8. Kỹ thuật & triển khai (30s)
- Monorepo Git, CI/CD (GitHub Actions)
- Docker, deploy Vercel + Render
- Tài liệu: API, flowchart, checklist test

---

## Slide gợi ý (7 slide)

1. **Cover** — Tên nhóm, đề tài, stack
2. **Kiến trúc** — Sơ đồ từ [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Chức năng khách hàng** — Catalog, cart, checkout, SePay
4. **Chức năng admin** — CRUD + dashboard
5. **Luồng thanh toán** — Sơ đồ từ [FLOWS.md](./FLOWS.md) §3–4
6. **Bảo mật** — JWT httpOnly, RBAC, validation
7. **Kết luận** — Link demo, repo GitHub, hướng phát triển

---

## Checklist trước khi quay video

- [ ] Backend Render đã wake (free tier có cold start ~30s)
- [ ] SePay sandbox credentials đã cấu hình
- [ ] Database đã seed có sản phẩm
- [ ] Resend (nếu demo forgot-password)
- [ ] Ghi màn hình 1080p, mic rõ

---

## Chạy local (nếu demo offline)

```bash
docker compose up -d postgres
cd backend && npm run start:dev
cd frontend && npm run dev
```

Chi tiết: [SETUP.md](./SETUP.md).
