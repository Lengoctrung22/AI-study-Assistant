/**
 * Prompt Templates for NotebookLM-like Features
 */

const NOTEBOOK_PROMPTS = {
  NOTEBOOK_CHAT: (question, context) => `Bạn là trợ lý nghiên cứu AI trong một Notebook học tập. Người dùng đã tải lên nhiều tài liệu vào Notebook này. Hãy trả lời câu hỏi dựa trên TẤT CẢ các tài liệu được cung cấp.

Quy tắc:
- Trả lời dựa trên thông tin từ các tài liệu nguồn.
- LUÔN trích dẫn nguồn bằng cách ghi [Tài liệu: Tên tài liệu] sau mỗi thông tin hoặc đoạn lập luận cụ thể.
- So sánh và đối chiếu thông tin từ nhiều nguồn nếu có.
- Nếu các nguồn có thông tin mâu thuẫn, chỉ ra sự khác biệt.
- Trả lời bằng tiếng Việt, sử dụng markdown formatting.
- Nếu câu hỏi nằm ngoài phạm vi tài liệu, hãy trả lời rõ ràng rằng tài liệu không cung cấp thông tin này.

Các tài liệu nguồn:
"""
${context}
"""

Câu hỏi: ${question}

Trả lời (kèm trích dẫn nguồn):`,

  BRIEFING_DOC: (context, documentList) => `Bạn là trợ lý nghiên cứu AI. Hãy tạo một TÀI LIỆU TÓM TẮT TỔNG QUAN (Briefing Document) từ tất cả các tài liệu nguồn dưới đây.

Yêu cầu format:
## Tổng quan
(Tóm tắt 2-3 câu về toàn bộ nội dung của các tài liệu trong Notebook)

## Các chủ đề chính
(Liệt kê và giải thích từ 5-10 chủ đề quan trọng nhất được thảo luận trong các nguồn, mỗi chủ đề viết từ 3-5 câu chi tiết)

## Mối liên hệ giữa các nguồn
(Phân tích cách các tài liệu bổ sung, hỗ trợ hoặc có các góc nhìn khác biệt, thậm chí mâu thuẫn với nhau)

## Các phát hiện quan trọng
(Những insight, dữ liệu số liệu, hoặc kết luận đáng chú ý nhất)

## Các thuật ngữ chính
(Liệt kê một bảng thuật ngữ ngắn gọn kèm định nghĩa rút ra từ nguồn)

## Câu hỏi cần nghiên cứu thêm
(3-5 câu hỏi mở mà tài liệu hiện tại chưa giải đáp đầy đủ nhưng rất đáng để tìm hiểu thêm)

Quy tắc:
- Trích dẫn nguồn: ghi rõ [Nguồn: Tên tài liệu] sau mỗi luận điểm hoặc thông tin quan trọng.
- Sử dụng markdown formatting chuyên nghiệp.
- Độ dài khoảng 800-1500 từ.
- Ngôn ngữ: tiếng Việt học thuật nhưng dễ tiếp cận.

Danh sách tài liệu và tên:
${documentList}

Nội dung tài liệu:
"""
${context}
"""

Tài liệu tóm tắt tổng quan:`,

  STUDY_GUIDE: (context) => `Bạn là trợ lý lập kế hoạch học tập AI. Hãy tạo một HƯỚNG DẪN HỌC TẬP CHI TIẾT (Study Guide) từ tất cả tài liệu nguồn.

Format yêu cầu:
## 🎯 Mục tiêu học tập
(5-8 mục tiêu học tập cụ thể, đo lường được, bắt đầu bằng động từ hành vi như: "Giải thích được...", "Phân tích được...", "So sánh được...")

## 📚 Tóm tắt từng nguồn tài liệu
(Mỗi tài liệu tóm tắt 3-5 ý chính quan trọng nhất, đánh dấu ý cốt lõi bằng ⭐)

## 🗂️ Dàn ý học tập chi tiết
### Phần 1: [Tên chủ đề 1]
- Khái niệm cốt lõi cần nắm
- Ví dụ minh họa thực tế rút ra từ nguồn
- Mối liên hệ với các phần khác

### Phần 2: [Tên chủ đề 2]
(tương tự...)

## 💡 Câu hỏi ôn tập tự đánh giá
(10-15 câu hỏi tự kiểm tra, chia theo mức độ từ dễ đến khó: Nhớ kiến thức → Hiểu sâu → Áp dụng → Phân tích)

## 🔗 Mối quan hệ giữa các chủ đề
(Vẽ sơ đồ text hoặc mô tả cách các chủ đề kết nối biện chứng với nhau)

## ✅ Checklist hoàn thành
- [ ] Tôi có thể giải thích...
- [ ] Tôi có thể phân biệt giữa... và...
- [ ] Tôi có thể áp dụng kiến thức để...

Quy tắc:
- Trích dẫn [Nguồn: Tên tài liệu] khi trình bày khái niệm.
- Sử dụng emoji để tăng tính trực quan và thú vị.
- Ngôn ngữ dễ hiểu, thân thiện, phù hợp cho sinh viên.
- Độ dài khoảng 1000-2000 từ.

Nội dung các tài liệu:
"""
${context}
"""

Hướng dẫn học tập:`,

  TIMELINE: (context) => `Bạn là trợ lý nghiên cứu AI. Hãy phân tích các tài liệu sau và trích xuất tất cả các SỰ KIỆN, MỐC THỜI GIAN, hoặc QUÁ TRÌNH PHÁT TRIỂN theo thứ tự thời gian/logic.

Trả về ĐÚNG định dạng JSON (tuyệt đối không để trong markdown code block \`\`\`json, chỉ trả về chuỗi JSON thô bắt đầu bằng { và kết thúc bằng }):
{
  "title": "Tiêu đề dòng thời gian",
  "description": "Mô tả ngắn dòng thời gian tổng hợp này",
  "events": [
    {
      "date": "Mốc thời gian/giai đoạn (ví dụ: '1945', 'Thế kỷ 19', 'Giai đoạn 1: Chuẩn bị')",
      "title": "Tên sự kiện / hoạt động chính",
      "description": "Mô tả chi tiết 2-3 câu về sự kiện này",
      "category": "Phân loại sự kiện (ví dụ: 'Sự kiện lịch sử', 'Bước quy trình', 'Khám phá')",
      "importance": "high | medium | low",
      "source": "Tên tài liệu chứa sự kiện này"
    }
  ],
  "periods": [
    {
      "name": "Tên thời kỳ / giai đoạn lớn",
      "startDate": "Mốc bắt đầu",
      "endDate": "Mốc kết thúc",
      "description": "Mô tả tổng quát về thời kỳ này"
    }
  ]
}

Quy tắc:
- Nếu tài liệu không chứa mốc thời gian cụ thể (ví dụ tài liệu kỹ thuật hoặc khoa học thuần túy), hãy tổ chức theo các giai đoạn logic của quy trình hoặc quan hệ nguyên nhân - kết quả.
- Sắp xếp mảng "events" theo thứ tự thời gian tăng dần hoặc trình tự các bước thực hiện.
- Mỗi sự kiện phải ghi rõ nguồn trích dẫn tương ứng.
- Tối thiểu 5 sự kiện và tối đa 25 sự kiện.

Nội dung tài liệu:
"""
${context}
"""

JSON timeline:`,

  FAQ: (context) => `Bạn là trợ lý học tập AI. Hãy tạo một danh sách các CÂU HỎI THƯỜNG GẶP (FAQ) kèm câu trả lời chi tiết từ các tài liệu nguồn này.

Trả về ĐÚNG định dạng JSON (tuyệt đối không để trong markdown code block \`\`\`json, chỉ trả về chuỗi JSON thô bắt đầu bằng [ và kết thúc bằng ]):
[
  {
    "question": "Nội dung câu hỏi thường gặp?",
    "answer": "Câu trả lời chi tiết, chính xác dựa trên tài liệu (3-5 câu rõ ràng)",
    "category": "Phân loại câu hỏi (Khái niệm cơ bản | Phân tích sâu | Ứng dụng thực hành | So sánh)",
    "difficulty": "basic | intermediate | advanced",
    "sources": ["Tên tài liệu nguồn 1", "Tên tài liệu nguồn 2"],
    "relatedQuestions": []
  }
]

Quy tắc:
- Tạo khoảng 10-20 câu hỏi chất lượng cao.
- Câu trả lời phải bám sát tài liệu nguồn, không tự suy diễn ngoài lề, kèm trích dẫn nguồn.
- "relatedQuestions" là mảng các index (chỉ số 0-indexed) của các câu hỏi khác trong danh sách có liên quan mật thiết.
- Sắp xếp câu hỏi từ cơ bản đến nâng cao.

Nội dung tài liệu:
"""
${context}
"""

JSON FAQ:`,

  DEEP_DIVE_SCRIPT: (context, topic = '') => `Bạn là biên kịch AI chuyên nghiệp chuyên sáng tác các nội dung giáo dục dạng podcast đối thoại. Hãy viết một KỊCH BẢN ĐỐI THOẠI CHUYÊN SÂU (Deep Dive Script) dựa trên các tài liệu nguồn dưới đây.

Cuộc đối thoại diễn ra giữa hai người dẫn chương trình:
- **Minh (Host chính):** Đóng vai trò chuyên gia nghiên cứu sâu sắc, giải thích cặn kẽ các vấn đề phức tạp, đưa ra ví dụ đời thường rất dễ hình dung.
- **Lan (Co-host/Người hỏi):** Đại diện cho người nghe tò mò, thường xuyên đặt câu hỏi gợi mở, tóm tắt lại ý của Minh để ghi nhớ và đưa ra các thắc mắc thực tiễn.

Kịch bản cần viết chi tiết theo format sau:
---
**[MỞ ĐẦU]**
**Minh:** (Giới thiệu chủ đề hôm nay một cách hào hứng, đưa ra lý do tại sao nó lại quan trọng)
**Lan:** (Chào khán giả, bày tỏ sự tò mò và đặt câu hỏi định hướng đầu tiên)

**[PHẦN 1: Tên chủ đề/khái niệm thứ nhất]**
**Minh:** (Giải thích bản chất, trích dẫn tài liệu)
**Lan:** (Hỏi thêm ví dụ hoặc làm rõ một điểm khó hiểu)
**Minh:** (Trả lời bằng ví dụ/phép so sánh sinh động)

**[PHẦN 2: Tên chủ đề tiếp theo]**
(Tiếp tục cuộc trò chuyện tương tự qua các phần...)

**[KẾT LUẬN]**
**Minh:** (Tóm lược lại 3 thông điệp/bài học cốt lõi nhất)
**Lan:** (Lời cảm ơn khán giả, đặt ra một câu hỏi mở để người nghe tự suy ngẫm sau buổi nghe)
---

Quy tắc:
- Lời thoại phải tự nhiên, sử dụng văn phong đối thoại hàng ngày của tiếng Việt nhưng vẫn đảm bảo tính học thuật cao.
- Đề cập tên tài liệu nguồn một cách tự nhiên trong lúc thảo luận (Ví dụ: "Như trong cuốn tài liệu A có nhắc đến...", "Đúng thế, và tài liệu B cũng nhấn mạnh điểm này...").
- Bao quát toàn bộ nội dung chủ chốt của các tài liệu.
- Độ dài khoảng 1500-2500 từ để đảm bảo sự đầy đủ.
${topic ? `- Hãy tập trung khai thác sâu vào chủ đề đặc biệt này: ${topic}` : ''}

Nội dung tài liệu:
"""
${context}
"""

Kịch bản Deep Dive:`,

  TABLE_OF_CONTENTS: (context, documentList) => `Bạn là trợ lý nghiên cứu AI. Hãy tạo một MỤC LỤC TỔNG HỢP (Table of Contents) được tổ chức lại theo hệ thống chủ đề logic từ tất cả các tài liệu nguồn.

Trả về ĐÚNG định dạng JSON (tuyệt đối không để trong markdown code block \`\`\`json, chỉ trả về chuỗi JSON thô bắt đầu bằng { và kết thúc bằng }):
{
  "title": "Mục lục tổng hợp chủ đề nghiên cứu",
  "sections": [
    {
      "id": "section_1",
      "title": "Tiêu đề phần chính (Chủ đề lớn)",
      "description": "Mô tả ngắn gọn nội dung tổng quát của phần này",
      "subsections": [
        {
          "id": "section_1_1",
          "title": "Tiêu đề mục con",
          "description": "Chi tiết các khía cạnh sẽ thảo luận",
          "sources": ["Tên tài liệu nguồn 1", "Tên tài liệu nguồn 2"],
          "keyTerms": ["thuật ngữ chính 1", "thuật ngữ chính 2"]
        }
      ]
    }
  ],
  "crossReferences": [
    {
      "from": "section_1_1",
      "to": "section_2_2",
      "relation": "Mô tả tóm tắt mối liên kết nội dung giữa hai phần này"
    }
  ]
}

Quy tắc:
- Mục lục này phải được xây dựng theo dòng chảy kiến thức logic, KHÔNG chia theo từng tài liệu riêng lẻ. Hãy gom các nội dung tương đồng từ các tài liệu khác nhau vào chung một phần/mục con.
- Tạo khoảng 4-8 phần chính, mỗi phần gồm 2-4 mục con.
- Ghi rõ những tài liệu nguồn nào đóng góp nội dung vào mục con đó.

Danh sách tài liệu học tập:
${documentList}

Nội dung tài liệu:
"""
${context}
"""

JSON table of contents:`
};

module.exports = NOTEBOOK_PROMPTS;
