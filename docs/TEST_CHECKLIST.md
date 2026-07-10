# Test checklist — luồng chính

Dùng khi kiểm thử local, staging hoặc production. Đánh dấu `[x]` khi pass.

**Môi trường test:** `local` / `staging` / `production`  
**Ngày:** ___________  
**Người test:** ___________

---

## Authentication

| # | Kịch bản | Kỳ vọng | Pass |
|---|----------|---------|------|
| 1 | Đăng ký email mới hợp lệ | Tạo user, redirect/login thành công | [ ] |
| 2 | Đăng ký email trùng | Lỗi 409, thông báo rõ | [ ] |
| 3 | Đăng nhập đúng mật khẩu | Cookie JWT, vào được `/cart` | [ ] |
| 4 | Đăng nhập sai mật khẩu | 401, không set cookie | [ ] |
| 5 | Refresh token hết hạn access | API tự refresh, không logout | [ ] |
| 6 | Quên mật khẩu (email tồn tại) | API 200, nhận email reset (nếu Resend cấu hình) | [ ] |
| 7 | Đặt lại mật khẩu với token hợp lệ | Đăng nhập được bằng mật khẩu mới | [ ] |
| 8 | Token reset hết hạn / sai | 400, thông báo lỗi | [ ] |
| 9 | Cập nhật profile | PATCH `/users/profile` thành công | [ ] |
| 10 | Google OAuth (nếu bật) | Redirect về frontend, session OK | [ ] |

---

## Product catalog

| # | Kịch bản | Kỳ vọng | Pass |
|---|----------|---------|------|
| 11 | Danh sách sản phẩm + phân trang | Skeleton → grid, pagination hoạt động | [ ] |
| 12 | Tìm kiếm theo từ khóa | Kết quả khớp, empty state khi không có | [ ] |
| 13 | Lọc category / brand / giá | URL query sync, kết quả đúng | [ ] |
| 14 | Sắp xếp (giá, tên, mới nhất) | Thứ tự đúng | [ ] |
| 15 | Chi tiết sản phẩm `/products/:slug` | Specs, giá, nút thêm giỏ | [ ] |

---

## Cart & wishlist

| # | Kịch bản | Kỳ vọng | Pass |
|---|----------|---------|------|
| 16 | Thêm / tăng / giảm số lượng giỏ | Tổng tiền cập nhật | [ ] |
| 17 | Xóa item khỏi giỏ | Item biến mất | [ ] |
| 18 | Giỏ persist sau reload (đã login) | Dữ liệu giữ nguyên | [ ] |
| 19 | Thêm / xóa wishlist | Danh sách cập nhật | [ ] |
| 20 | Vượt tồn kho | Lỗi validation rõ ràng | [ ] |

---

## Checkout & SePay

| # | Kịch bản | Kỳ vọng | Pass |
|---|----------|---------|------|
| 21 | Checkout không có địa chỉ | Empty state, hướng dẫn thêm địa chỉ | [ ] |
| 22 | Tạo đơn hàng | Order `pending`, giỏ trống | [ ] |
| 23 | Init SePay → redirect cổng thanh toán | Form POST thành công | [ ] |
| 24 | Thanh toán sandbox thành công | IPN → order `paid` + `confirmed`, email (nếu có) | [ ] |
| 25 | Trang `/payments/return` success | Hiển thị trạng thái đúng từ DB | [ ] |
| 26 | Hủy thanh toán trên SePay | Redirect cancel, đơn chưa paid | [ ] |
| 27 | IPN không tới (local không ngrok) | UI “đang xử lý” — documented behavior | [ ] |

Xem [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md) để cấu hình sandbox + ngrok.

---

## Orders (user)

| # | Kịch bản | Kỳ vọng | Pass |
|---|----------|---------|------|
| 28 | Danh sách đơn `/orders` | Phân trang, trạng thái hiển thị | [ ] |
| 29 | Chi tiết đơn + timeline | Items, payment status, timeline | [ ] |
| 30 | Hủy đơn `pending` | Status `cancelled` | [ ] |

---

## Admin

| # | Kịch bản | Kỳ vọng | Pass |
|---|----------|---------|------|
| 31 | Customer truy cập `/admin` | Redirect về `/` | [ ] |
| 32 | Admin dashboard | Thống kê doanh thu / đơn gần đây | [ ] |
| 33 | CRUD sản phẩm | Tạo/sửa/xóa (soft delete) | [ ] |
| 34 | CRUD brand / category | Hoạt động đúng | [ ] |
| 35 | Cập nhật trạng thái đơn | PATCH status, không lỗi 500 | [ ] |

---

## UX & bảo mật

| # | Kịch bản | Kỳ vọng | Pass |
|---|----------|---------|------|
| 36 | Responsive mobile | Layout không vỡ trên viewport nhỏ | [ ] |
| 37 | Loading skeleton | Hiện khi fetch API | [ ] |
| 38 | Lỗi mạng / API down | Toast hoặc fallback catalog (nếu có) | [ ] |
| 39 | Route bảo vệ chưa login | Redirect `/login` | [ ] |
| 40 | HTTPS trên production | Cookie Secure, không mixed content | [ ] |

---

## Unit / automated tests

```bash
cd backend && npm test
cd frontend && npm test   # nếu có
```

| Suite | Pass |
|-------|------|
| `backend` Jest (auth, sepay, products, …) | [ ] |
| `frontend` Vitest (nếu chạy) | [ ] |
| CI GitHub Actions `ci.yml` green trên `main` | [ ] |
