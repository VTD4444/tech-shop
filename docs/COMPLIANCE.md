# Đối chiếu yêu cầu đầu ra

Bảng map nội dung `yeu cau dau ra.docx` với tài liệu và mã nguồn TechShop.

> **Lưu ý thanh toán:** Đề bài ghi VNPay; dự án triển khai **SePay** (cổng thanh toán Việt Nam tương đương: redirect + webhook/IPN). Chức năng checkout/return/IPN đã đủ; chỉ khác tên cổng. Chi tiết: [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md).

| Yêu cầu | Trạng thái | Tham chiếu |
|---------|------------|------------|
| Source code FE/BE trên Git | Đạt | Repo monorepo `frontend/`, `backend/` |
| README chạy dev/build/deploy | Đạt | [README.md](../README.md), [SETUP.md](./SETUP.md), [SETUP_PRODUCTION.md](./SETUP_PRODUCTION.md) |
| Auth: register/login/forgot/reset, profile, token | Đạt | [API.md](./API.md) §Auth, [FLOWS.md](./FLOWS.md) §1–2 |
| Product catalog: search, filter, sort, pagination, detail | Đạt | `frontend/pages/products/`, [API.md](./API.md) §Products |
| Cart & wishlist | Đạt | [API.md](./API.md) §Cart, §Wishlist |
| Checkout + cổng thanh toán (redirect + callback) | Đạt (SePay) | [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md), [FLOWS.md](./FLOWS.md) §3–4 |
| Orders: list, detail, timeline | Đạt | `frontend/pages/orders/` |
| Admin CRUD + dashboard | Đạt | `frontend/pages/admin/` |
| Responsive, loading, empty, toast | Đạt | UI components, product/order pages |
| RBAC, validate, token an toàn | Đạt | [ARCHITECTURE.md](./ARCHITECTURE.md) §Security |
| API docs | Đạt | [API.md](./API.md) |
| Flowchart luồng chính | Đạt | [FLOWS.md](./FLOWS.md) |
| Hướng dẫn cấu hình thanh toán + test | Đạt | [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md), [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) §Checkout |
| Test checklist + unit tests | Đạt | [TEST_CHECKLIST.md](./TEST_CHECKLIST.md), `backend/**/*.spec.ts` |
| Báo cáo bugs chính | Đạt | [BUG_REPORT.md](./BUG_REPORT.md) |
| Deploy staging/production + Docker | Đạt | `docker-compose.yml`, `render.yaml`, CI/CD `.github/workflows/` |
| Video/slide demo 3–7 phút | Cần nhóm tự quay | [DEMO.md](./DEMO.md) — outline sẵn |
