# Learning Forum UI (Demo)

Giao diện web mô phỏng hệ thống **Learning Forum for FPT University Students**.

## Chạy project

```bash
npm install
npm run dev
```

Mở: http://localhost:5173

## Tài khoản demo

- student@fpt.edu.vn / 123456
- mod@fpt.edu.vn / 123456
- admin@fpt.edu.vn / 123456

## Tính năng đã dựng (UI + mock data)

- Trang Home + danh mục/chủ đề
- Danh sách bài viết mới, danh sách bài theo chủ đề (layout kiểu forum như ảnh bạn gửi)
- Chi tiết bài + comment + report
- Đăng bài nhanh (bài mới ở trạng thái `pending`)
- Moderator dashboard: duyệt bài pending + xem report
- Admin dashboard: bảng tracking từ file Excel (Project_Tracking_Forum.xlsx)

## Ghi chú

- Dữ liệu demo được seed từ `src/data/forum.json` và được lưu vào `localStorage` (mock DB).
- Đây là UI demo để nộp/đưa vào slide; nếu bạn có API thật, mình có thể giúp nối API (login, posts, comments, reports).
