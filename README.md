# CookieEdit

Extension Chrome/Edge (Manifest V3) để xem, sửa, thêm, xoá cookie của tab đang mở — kiểu tiện
ích **EditThisCookie**. Không cần app VB.NET/bridge server nữa: mọi thao tác cookie làm trực
tiếp qua `chrome.cookies` API ngay trong trình duyệt, không gửi dữ liệu đi đâu cả.

## Cài đặt

1. Vào `chrome://extensions` (hoặc `edge://extensions`).
2. Bật **Developer mode** (Chế độ nhà phát triển).
3. Bấm **Load unpacked** (Tải tiện ích chưa đóng gói) → chọn thư mục `CookieEditExtension/`.

## Cách dùng

1. Mở trang web cần xem/sửa cookie.
2. Bấm icon extension → danh sách cookie của tab hiện tại hiện ra (tên, domain, path, hạn dùng).
3. Sửa giá trị trong ô textarea rồi bấm **Lưu** để ghi đè cookie đó.
4. Bấm **Xoá** để xoá 1 cookie.
5. Mục "Thêm cookie mới" để tạo cookie mới cho domain/path tuỳ chọn.
6. **Xuất JSON** copy toàn bộ cookie của tab hiện tại (dạng JSON) vào clipboard.

## Lưu ý

- Cookie có cờ `HttpOnly` vẫn xem/sửa/xoá được qua `chrome.cookies` API (extension có quyền cao
  hơn JavaScript trên trang), nhưng trang web sẽ không đọc được các cookie này qua `document.cookie`.
- Sửa cookie phiên đăng nhập của trang khác có thể làm bạn bị đăng xuất hoặc gặp lỗi phiên nếu giá
  trị không hợp lệ — chỉ nên dùng trên tài khoản/trang của chính bạn hoặc khi debug.
- Quyền `host_permissions: <all_urls>` là cần thiết để đọc cookie của bất kỳ domain nào bạn đang
  mở; nếu chỉ cần dùng cho 1-2 trang cụ thể, có thể sửa lại thành domain cụ thể trong `manifest.json`.
