# Frontend Architecture & Reliability Guidelines

Tài liệu này định nghĩa các quy tắc phát triển giao diện (Rules) bắt buộc tuân thủ khi thao tác, viết mới hoặc chỉnh sửa mã nguồn trong thư mục `Frontend/`.

---

## 1. Cô lập CSS thuần (Vanilla CSS Isolation)
- Dự án sử dụng hệ thống CSS thuần tập trung tại `src/styles/index.css` với CSS Custom Properties (`--bg-primary`, `--text-primary`, `--accent`, v.v.). **Dự án KHÔNG có build pipeline cho Tailwind CSS**.
- Tuyệt đối **KHÔNG sử dụng các class tiện ích của Tailwind** (ví dụ: `.truncate`, `.w-full`, `.text-*-*`, `.bg-*-*`, v.v.) trong JSX trừ khi class đó đã được khai báo tường minh trong `index.css`.
- Khi bổ sung UI mới, luôn kiểm tra và định nghĩa các class CSS tương ứng trong `src/styles/index.css`.

---

## 2. Nguyên tắc Toàn vẹn Dữ liệu (No Fake Data in Components)
- Tuyệt đối **KHÔNG sử dụng `Math.random()` hoặc mảng số liệu hardcoded** để lấp đầy biểu đồ hoặc số liệu thống kê khi tài khoản người dùng chưa có dữ liệu hoạt động.
- Khi mảng dữ liệu rỗng (`data.length === 0`), luôn hiển thị giao diện **Empty State** trực quan hoặc hiển thị số `0` chính xác, kèm lời gọi hành động (CTA) hướng dẫn người dùng bắt đầu.
- Tránh giả lập các thẻ Hero hoặc danh sách công việc (Checklist) với nội dung bài học ảo gây hiểu lầm cho người dùng mới.

---

## 3. Đồng bộ Xác thực Ngoại tuyến (PWA Offline Persistence)
- Ứng dụng PWA hỗ trợ người dùng truy cập khi mất mạng. Do đó, cả **JWT token** và **đối tượng thông tin người dùng (`user`)** phải luôn được lưu trữ đồng bộ trong `localStorage`.
- Trạng thái `user` trong `AuthContext` phải được khởi tạo từ `localStorage` để tránh việc người dùng bị kích hoạt chuyển hướng (`Navigate`) về trang `/login` ngoài ý muốn khi mở ứng dụng ở chế độ ngoại tuyến.

---

## 4. Đa dạng hóa Loại câu hỏi Ôn tập (Multi-Question Type Support)
- Hệ thống Quiz AI hỗ trợ 4 dạng câu hỏi:
  1. `mcq`: Trắc nghiệm chọn phương án (A, B, C, D) với đáp án là chỉ số số nguyên (`correctAnswer`).
  2. `true_false`: Đúng / Sai với đáp án là giá trị boolean (`correctBoolean`).
  3. `fill_blank`: Điền từ vào chỗ trống với đáp án là chuỗi văn bản (`blankAnswer`).
  4. `short_answer`: Tự luận ngắn với đáp án chuẩn đối chiếu (`shortAnswer`).
- Tuyệt đối **KHÔNG giả định `questions` luôn có mảng `options`** hoặc câu trả lời luôn là chỉ số mảng (`index`). Luôn kiểm tra trường `type` để hiển thị input/giao diện và so sánh kết quả phù hợp.

---

## 5. Xử lý Múi giờ Địa phương (Local Timezone Handling)
- Đối với các chức năng liên quan đến ngày học, lịch streak và heatmap: luôn sử dụng định dạng ngày địa phương chuẩn `d.toLocaleDateString('en-CA')` (cho ra chuỗi `YYYY-MM-DD`).
- Tránh sử dụng `d.toISOString().split('T')[0]` vì sẽ lấy theo giờ UTC, dẫn đến việc dữ liệu đầu ngày (từ 00:00 đến 07:00 sáng tại Việt Nam GMT+7) bị nhảy lùi về ngày hôm trước.
