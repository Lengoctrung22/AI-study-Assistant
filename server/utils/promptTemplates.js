/**
 * Prompt Templates for AI Services
 */

const PROMPTS = {
  SUMMARIZE: (text) => `Bạn là trợ lý học tập AI. Hãy tóm tắt nội dung sau đây một cách chi tiết, rõ ràng, dễ hiểu cho sinh viên.

Yêu cầu:
- Tóm tắt các ý chính theo dạng bullet points
- Giữ lại các khái niệm quan trọng
- Sử dụng ngôn ngữ dễ hiểu
- Độ dài khoảng 300-500 từ

Nội dung cần tóm tắt:
"""
${text}
"""

Hãy tóm tắt:`,

  SUMMARIZE_MERGE: (summaries) => `Bạn là trợ lý học tập AI. Dưới đây là các bản tóm tắt từng phần của một tài liệu. Hãy kết hợp chúng thành MỘT bản tóm tắt toàn diện.

Yêu cầu:
- Kết hợp logic, không trùng lặp
- Giữ tất cả ý chính quan trọng
- Trình bày có cấu trúc rõ ràng
- Sử dụng heading và bullet points

Các bản tóm tắt:
"""
${summaries}
"""

Bản tóm tắt tổng hợp:`,

  FLASHCARD: (text, count = 10) => `Bạn là trợ lý học tập AI. Hãy tạo ${count} flashcard từ nội dung sau để giúp sinh viên ghi nhớ kiến thức.

Yêu cầu:
- Mỗi flashcard có mặt trước (câu hỏi/khái niệm) và mặt sau (đáp án/giải thích)
- Đa dạng loại câu hỏi: định nghĩa, so sánh, ứng dụng
- Phân loại độ khó: easy, medium, hard
- Thêm tags phân loại

Trả về ĐÚNG format JSON (không có markdown code block):
[
  {
    "front": "Câu hỏi hoặc khái niệm",
    "back": "Đáp án hoặc giải thích chi tiết",
    "difficulty": "easy|medium|hard",
    "tags": ["tag1", "tag2"]
  }
]

Nội dung:
"""
${text}
"""

JSON flashcards:`,

  QUIZ: (text, count = 10, difficulty = 'mixed') => `Bạn là trợ lý học tập AI. Hãy tạo ${count} câu hỏi trắc nghiệm (multiple choice) từ nội dung sau.
Độ khó: ${difficulty}

Yêu cầu:
- Mỗi câu có 4 đáp án (A, B, C, D)
- Chỉ có 1 đáp án đúng
- Các đáp án sai phải hợp lý (không quá dễ loại)
- Có giải thích cho đáp án đúng
- correctAnswer là index (0-3) của đáp án đúng

Trả về ĐÚNG format JSON (không có markdown code block):
[
  {
    "question": "Nội dung câu hỏi?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctAnswer": 0,
    "explanation": "Giải thích tại sao đáp án đúng",
    "topic": "Chủ đề"
  }
]

Nội dung:
"""
${text}
"""

JSON quiz:`,

  EXPLAIN: (text, context = '', level = 'student') => {
    const levelMap = {
      eli5: 'một đứa trẻ 5 tuổi, dùng ví dụ đơn giản và phép so sánh',
      student: 'sinh viên đại học năm 2, dùng ví dụ thực tế',
      expert: 'chuyên gia trong lĩnh vực, phân tích sâu',
    };

    return `Bạn là trợ lý học tập AI. Hãy giải thích đoạn text sau đây cho ${levelMap[level] || levelMap.student}.

${context ? `Ngữ cảnh xung quanh:\n"""\n${context}\n"""\n` : ''}

Đoạn cần giải thích:
"""
${text}
"""

Yêu cầu:
- Giải thích từng khái niệm khó
- Sử dụng ví dụ minh họa thực tế
- Dùng analogy (phép so sánh) nếu phù hợp
- Tóm tắt ý chính ở cuối

Giải thích:`;
  },

  CHAT: (question, context) => `Bạn là trợ lý học tập AI thông minh. Hãy trả lời câu hỏi dựa trên nội dung tài liệu được cung cấp.

Quy tắc:
- CHỈ trả lời dựa trên thông tin trong tài liệu
- Nếu tài liệu không có thông tin liên quan, hãy nói rõ
- Trích dẫn phần liên quan khi trả lời
- Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu
- Sử dụng markdown formatting

Nội dung tài liệu liên quan:
"""
${context}
"""

Câu hỏi: ${question}

Trả lời:`,
};

module.exports = PROMPTS;
