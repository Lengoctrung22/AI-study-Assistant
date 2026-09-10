# Backend Architecture & Reliability Guidelines

Tài liệu này định nghĩa các quy chuẩn và nguyên tắc bắt buộc tuân thủ khi xây dựng, mở rộng hoặc sửa lỗi mã nguồn trong thư mục `Backend/`.

---

## 1. Phân quyền Kế thừa (Role Inheritance)
- Quản trị viên (`role === 'admin'`) luôn có toàn quyền truy cập hệ thống.
- Middleware kiểm tra gói dịch vụ (`middleware/requirePremium.js`) phải luôn kiểm tra `req.user.role === 'admin'` để miễn trừ cho quản trị viên trước khi kiểm tra gói `req.user.plan === 'premium'`.

---

## 2. Ép kiểu và Xác thực Tham số Mảng/Chỉ số (Strict Index & Type Validation)
- Tuyệt đối không dùng trực tiếp các chỉ số mảng (`dayIndex`, `taskIndex`, `cardIndex`) từ `req.body` hoặc `req.params` mà không ép kiểu qua `Number(val)` và kiểm tra `Number.isInteger()`.
- Luôn kiểm tra biên mảng hợp lệ (`idx >= 0 && idx < arr.length`) trước khi truy xuất phần tử để tránh gây sập server với `TypeError: Cannot read properties of undefined`.

---

## 3. Nguyên tắc Định vị Rate Limiting (Precise Rate Limiting)
- Không bao giờ gán `aiLimiter` lên toàn bộ router gốc chứa cả các route `GET` đọc dữ liệu.
- `aiLimiter` CHỈ được gán trực tiếp lên các route `POST`/`PUT` thực sự kích hoạt gọi API LLM (Gemini) để tránh chặn nhầm người dùng duyệt xem danh sách dữ liệu.

---

## 4. Bóc tách JSON An toàn từ LLM (Resilient JSON Parsing)
- Không dùng phương thức `.replace(/```json/g, '')` đơn giản vì LLM thường kèm văn bản dẫn nhập hoặc kết luận.
- Luôn sử dụng Regex tìm kiếm cặp ngoặc ngoài cùng: `str.match(/\{[\s\S]*\}/)` cho Object hoặc `str.match(/\[[\s\S]*\]/)` cho Array trước khi gọi `JSON.parse()`.

---

## 5. Chuẩn hóa Múi giờ Hoạt động Học tập (Timezone Invariant)
- Toàn bộ hàm tính toán chuỗi ngày học (`streak`), heatmap và kế hoạch học tập phải đồng nhất sử dụng múi giờ Việt Nam:
  `new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())`
- Tuyệt đối không dùng `new Date().toISOString().split('T')[0]` vì sẽ lấy theo giờ UTC, gây lệch 1 ngày đối với các hoạt động học tập trước 07:00 sáng.

---

## 6. Toàn vẹn Dữ liệu Hoạt động (No Destructive Overwrite)
- Trong các service đồng bộ lịch sử (`activityService`), tuyệt đối không dùng `$set` ghi đè toàn bộ mảng `activities`. Chỉ bổ sung các hoạt động mới bằng `$addToSet` hoặc kiểm tra điều kiện tồn tại để bảo toàn thời gian học thực tế của người dùng.
