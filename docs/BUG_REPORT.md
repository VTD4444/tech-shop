# Báo cáo lỗi chính và cách xử lý

Tài liệu ghi lại các bug quan trọng đã phát hiện trong quá trình phát triển TechShop và hướng xử lý. Dùng kèm [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) khi regression test.

---

## 1. SePay production — “Yêu cầu không hợp lệ” / không redirect thanh toán

| | |
|---|---|
| **Triệu chứng** | Checkout SePay báo lỗi trên production; hoặc redirect fail |
| **Nguyên nhân** | `SEPAY_PAYMENT_METHOD=BANK_TRANSFER` không được merchant production hỗ trợ; callback URL không khớp portal; secret/merchant sai; env có dấu ngoặc thừa |
| **Cách fix** | Xóa hoặc đặt đúng `SEPAY_PAYMENT_METHOD`; đồng bộ `SEPAY_*_URL` với my.sepay.vn; dùng `stripEnvQuotes` trong `sepay.util.ts`; đăng ký IPN public HTTPS |
| **File liên quan** | `backend/src/common/utils/sepay.util.ts`, `payments.service.ts`, `docs/SEPAY_INTEGRATION.md` |

---

## 2. SePay — thanh toán thành công nhưng đơn vẫn `pending`

| | |
|---|---|
| **Triệu chứng** | User đã trả tiền trên SePay; app hiển thị “đang xử lý” |
| **Nguyên nhân** | IPN webhook không tới backend (localhost, firewall, URL IPN sai) |
| **Cách fix** | Local: ngrok `3000` + đăng ký IPN trên portal. Production: `https://<api>/api/v1/payments/sepay/ipn` |
| **File liên quan** | `payments.controller.ts`, `docs/SEPAY_INTEGRATION.md` |

---

## 3. Quên mật khẩu — không nhận email trên production

| | |
|---|---|
| **Triệu chứng** | API trả 200 nhưng không có email |
| **Nguyên nhân** | Thiếu `RESEND_API_KEY` / `MAIL_FROM` trên Render; `onboarding@resend.dev` chỉ gửi tới email chủ tài khoản Resend; user Google bị skip (code cũ); lỗi Resend bị nuốt im lặng |
| **Cách fix** | Cấu hình Resend trên server; verify domain cho production; cập nhật `mail.service.ts` log lỗi; cho phép reset cả user Google; set `FRONTEND_URL` đúng Vercel |
| **File liên quan** | `mail.service.ts`, `auth.service.ts`, `docs/RESEND_INTEGRATION.md` |

---

## 4. Admin PATCH order status — HTTP 500 (BigInt serialize)

| | |
|---|---|
| **Triệu chứng** | `PATCH /admin/orders/:id/status` trả 500 |
| **Nguyên nhân** | Prisma trả `BigInt` không serialize được sang JSON |
| **Cách fix** | Convert id sang string/number trước khi response trong `admin.service.ts` |
| **File liên quan** | `backend/src/modules/admin/admin.service.ts` |

---

## 5. Admin products list — màn hình đen

| | |
|---|---|
| **Triệu chứng** | `/admin/products` không render |
| **Nguyên nhân** | Thiếu khai báo `const products = ref([])` trong page |
| **Cách fix** | Khai báo ref và bind đúng trong `frontend/pages/admin/products/index.vue` |

---

## 6. Docker build backend — `PrismaConfigEnvError: DATABASE_URL`

| | |
|---|---|
| **Triệu chứng** | CI/CD hoặc Render build image fail tại `prisma generate` |
| **Nguyên nhân** | Build stage không có `DATABASE_URL` |
| **Cách fix** | Placeholder `ENV DATABASE_URL` trong `backend/Dockerfile`; migrate thật ở `docker-entrypoint.sh` runtime |
| **File liên quan** | `backend/Dockerfile`, `backend/docker-entrypoint.sh` |

---

## 7. GHCR image private — Render “No public image found”

| | |
|---|---|
| **Triệu chứng** | Render không pull được `ghcr.io/.../techshop-backend` |
| **Nguyên nhân** | Package GHCR mặc định private |
| **Cách fix** | Thêm Registry Credential (PAT `read:packages`) trên Render hoặc public package |

---

## Mẫu ghi bug mới

```markdown
### [Tên bug ngắn gọn]

| | |
|---|---|
| **Triệu chứng** | |
| **Môi trường** | local / staging / production |
| **Nguyên nhân** | |
| **Cách tái hiện** | 1. … 2. … |
| **Cách fix** | |
| **PR / commit** | |
| **Trạng thái** | Open / Fixed / Won't fix |
```
