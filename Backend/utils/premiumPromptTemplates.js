/**
 * Premium Prompt Templates for AI Services
 */

const PREMIUM_PROMPTS = {
  MINDMAP: (text) => `Bạn là trợ lý học tập AI. Hãy phân tích nội dung sau và tạo một sơ đồ tư duy (mind map) có cấu trúc.

Yêu cầu:
- Xác định chủ đề trung tâm
- Tạo 4-8 nhánh chính
- Mỗi nhánh có 2-5 nhánh con
- Giữ nhãn ngắn gọn (tối đa 6 từ)
- Bao quát toàn bộ nội dung chính

Trả về ĐÚNG format JSON (không có markdown code block):
{
  "central": "Chủ đề trung tâm",
  "branches": [
    {
      "label": "Nhánh chính 1",
      "color": "#6366f1",
      "children": [
        { "label": "Nhánh con 1.1" },
        { "label": "Nhánh con 1.2" }
      ]
    }
  ]
}

Sử dụng các màu khác nhau cho mỗi nhánh: #6366f1, #ec4899, #10b981, #f59e0b, #3b82f6, #ef4444, #8b5cf6, #14b8a6

Nội dung:
"""
${text}
"""

JSON mind map:`,

  CONCEPTS: (text) => `Bạn là trợ lý học tập AI. Hãy phân tích nội dung sau và xác định các khái niệm chính cùng mối quan hệ giữa chúng.

Yêu cầu:
- Trích xuất 8-15 khái niệm chính
- Xác định mối quan hệ: causes (gây ra), depends_on (phụ thuộc), contrasts (đối lập), part_of (thành phần), leads_to (dẫn đến), similar_to (tương tự)
- Mỗi khái niệm có mô tả ngắn

Trả về ĐÚNG format JSON (không có markdown code block):
{
  "nodes": [
    { "id": "concept_1", "label": "Tên khái niệm", "description": "Mô tả ngắn", "importance": "high" }
  ],
  "edges": [
    { "from": "concept_1", "to": "concept_2", "relation": "causes", "description": "Mô tả mối quan hệ" }
  ]
}

importance: "high", "medium", "low"

Nội dung:
"""
${text}
"""

JSON concepts:`,

  MULTILEVEL_SUMMARY: (text, level) => {
    const levelDescriptions = {
      child: 'một em nhỏ 10 tuổi. Dùng ngôn ngữ rất đơn giản, ví dụ gần gũi, có thể dùng emoji.',
      high_school: 'học sinh trung học phổ thông. Dùng ngôn ngữ rõ ràng, giải thích các thuật ngữ chuyên môn.',
      undergraduate: 'sinh viên đại học. Trình bày chi tiết với thuật ngữ chuyên ngành phù hợp.',
      graduate: 'học viên cao học. Phân tích chuyên sâu, đề cập các nghiên cứu liên quan.',
      expert: 'chuyên gia trong lĩnh vực. Phân tích kỹ thuật sâu, đánh giá phê bình, liên hệ lý thuyết.',
    };

    return `Bạn là trợ lý học tập AI. Hãy tóm tắt nội dung sau cho ${levelDescriptions[level] || levelDescriptions.undergraduate}

Yêu cầu:
- Tóm tắt phù hợp với trình độ người đọc
- Giữ lại các ý chính quan trọng
- Sử dụng markdown formatting
- Độ dài 200-600 từ tùy mức độ chi tiết

Nội dung:
"""
${text}
"""

Tóm tắt:`;
  },

  ANALYTICS: (text) => `Bạn là trợ lý phân tích học thuật AI. Hãy phân tích nội dung tài liệu sau và đưa ra đánh giá.

Trả về ĐÚNG format JSON (không có markdown code block):
{
  "difficultyScore": 7.2,
  "readabilityLevel": "undergraduate",
  "estimatedStudyHours": 4.5,
  "topicBreakdown": [
    { "topic": "Chủ đề 1", "weight": 0.4, "description": "Mô tả ngắn" }
  ],
  "prerequisiteKnowledge": ["Kiến thức 1", "Kiến thức 2"],
  "keyTermsCount": 45,
  "contentType": "textbook",
  "languageComplexity": "academic",
  "recommendedApproach": "Lời khuyên cách tiếp cận tài liệu"
}

Quy tắc:
- difficultyScore: thang 1-10 (1=rất dễ, 10=rất khó)
- readabilityLevel: "high_school", "undergraduate", "graduate", "expert"
- estimatedStudyHours: ước tính thời gian cần để nắm vững
- topicBreakdown: tổng weight = 1.0
- contentType: "textbook", "research_paper", "lecture_notes", "reference"

Nội dung:
"""
${text}
"""

JSON analytics:`,

  GLOSSARY: (text) => `Bạn là trợ lý học tập AI. Hãy trích xuất tất cả thuật ngữ chuyên ngành/kỹ thuật từ nội dung sau và định nghĩa chúng.

Yêu cầu:
- Trích xuất 10-30 thuật ngữ quan trọng nhất
- Mỗi thuật ngữ có định nghĩa rõ ràng, dễ hiểu
- Liệt kê thuật ngữ liên quan
- Phân loại theo chủ đề

Trả về ĐÚNG format JSON (không có markdown code block):
[
  {
    "term": "Tên thuật ngữ",
    "definition": "Định nghĩa chi tiết, dễ hiểu",
    "relatedTerms": ["Thuật ngữ liên quan 1"],
    "category": "Chủ đề/Danh mục",
    "importance": "high"
  }
]

importance: "high", "medium", "low"

Nội dung:
"""
${text}
"""

JSON glossary:`,

  STUDY_PLAN: (documentTitles, totalDays, dailyHours) => `Bạn là trợ lý lập kế hoạch học tập AI. Hãy tạo kế hoạch học tập chi tiết.

Thông tin:
- Tài liệu cần học: ${documentTitles.join(', ')}
- Số ngày: ${totalDays}
- Thời gian học mỗi ngày: ${dailyHours} giờ

Yêu cầu:
- Phân bổ đều các tài liệu
- Xen kẽ giữa đọc, ôn tập flashcard, và làm quiz
- Ngày cuối dành cho ôn tổng và làm quiz tổng hợp
- Mỗi task có mô tả rõ ràng

Trả về ĐÚNG format JSON (không có markdown code block):
[
  {
    "day": 1,
    "tasks": [
      {
        "type": "read",
        "documentIndex": 0,
        "description": "Đọc và ghi chú chương 1",
        "duration": 60
      },
      {
        "type": "flashcard",
        "documentIndex": 0,
        "description": "Ôn tập flashcard chương 1",
        "duration": 30
      }
    ]
  }
]

type: "read", "flashcard", "quiz", "review", "practice"
documentIndex: index trong danh sách tài liệu (bắt đầu từ 0)
duration: phút

JSON study plan:`,

  MULTI_TYPE_QUIZ: (text, count, difficulty, types) => `Bạn là trợ lý học tập AI. Hãy tạo ${count} câu hỏi ôn tập từ nội dung sau.
Độ khó: ${difficulty}
Loại câu hỏi cần tạo: ${types.join(', ')}

Yêu cầu cho mỗi loại:
- mcq: 4 đáp án, 1 đúng, correctAnswer là index (0-3)
- fill_blank: Câu có chỗ trống _____, blankAnswer là đáp án
- true_false: Câu khẳng định, correctBoolean là true/false
- short_answer: Câu hỏi mở ngắn, shortAnswer là đáp án gợi ý

Phân bổ đều các loại câu hỏi.

Trả về ĐÚNG format JSON (không có markdown code block):
[
  {
    "type": "mcq",
    "question": "Câu hỏi trắc nghiệm?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Giải thích",
    "topic": "Chủ đề"
  },
  {
    "type": "fill_blank",
    "question": "_____ là quá trình...",
    "blankAnswer": "Đáp án",
    "explanation": "Giải thích",
    "topic": "Chủ đề"
  },
  {
    "type": "true_false",
    "question": "Câu khẳng định đúng hoặc sai",
    "correctBoolean": true,
    "explanation": "Giải thích",
    "topic": "Chủ đề"
  },
  {
    "type": "short_answer",
    "question": "Câu hỏi mở ngắn?",
    "shortAnswer": "Đáp án gợi ý ngắn gọn",
    "explanation": "Giải thích chi tiết",
    "topic": "Chủ đề"
  }
]

Nội dung:
"""
${text}
"""

JSON quiz:`,

  CHAT_WITH_PERSONA: (question, context, persona) => {
    const personaInstructions = {
      friendly: 'Bạn là một gia sư thân thiện, dùng ngôn ngữ ấm áp, thỉnh thoảng dùng emoji, luôn động viên người học. Giải thích bằng ví dụ đời thường.',
      strict: 'Bạn là một giáo sư nghiêm túc, đi thẳng vào vấn đề, yêu cầu chính xác, không rườm rà. Chỉ trả lời dựa trên dữ kiện.',
      socratic: 'Bạn là một gia sư theo phương pháp Socratic. Thay vì trả lời trực tiếp, hãy đặt câu hỏi gợi mở để dẫn dắt người học tự tìm ra đáp án. Chỉ tiết lộ đáp án khi cần thiết.',
      encouraging: 'Bạn là một mentor luôn động viên tích cực. Khen ngợi nỗ lực, nhấn mạnh tiến bộ, chia nhỏ vấn đề khó để không gây nản. Dùng nhiều lời khích lệ.',
      concise: 'Bạn là trợ lý AI ngắn gọn. Chỉ dùng bullet points, không giải thích dài dòng, tập trung vào ý chính. Tối đa 100 từ cho mỗi câu trả lời.',
    };

    return `${personaInstructions[persona] || personaInstructions.friendly}

Quy tắc:
- CHỈ trả lời dựa trên thông tin trong tài liệu
- Nếu tài liệu không có thông tin liên quan, hãy nói rõ
- Trích dẫn phần liên quan khi trả lời
- Trả lời bằng tiếng Việt
- Sử dụng markdown formatting

Nội dung tài liệu liên quan:
"""
${context}
"""

Câu hỏi: ${question}

Trả lời:`;
  },

  CHAT_WITH_FOLLOWUP: (question, context, persona) => {
    const personaInstructions = {
      friendly: 'Bạn là một gia sư thân thiện, dùng ngôn ngữ ấm áp, thỉnh thoảng dùng emoji.',
      strict: 'Bạn là một giáo sư nghiêm túc, đi thẳng vào vấn đề.',
      socratic: 'Bạn theo phương pháp Socratic, đặt câu hỏi gợi mở.',
      encouraging: 'Bạn là mentor luôn động viên tích cực.',
      concise: 'Bạn ngắn gọn, chỉ dùng bullet points.',
    };

    return `${personaInstructions[persona] || personaInstructions.friendly}

Quy tắc:
- CHỈ trả lời dựa trên thông tin trong tài liệu
- Trả lời bằng tiếng Việt, sử dụng markdown
- Sau câu trả lời, đề xuất 3 câu hỏi tiếp theo mà người học có thể muốn hỏi

Nội dung tài liệu liên quan:
"""
${context}
"""

Câu hỏi: ${question}

Hãy trả lời theo format sau:
---ANSWER---
[Câu trả lời của bạn]
---SUGGESTIONS---
1. [Câu hỏi gợi ý 1]
2. [Câu hỏi gợi ý 2]
3. [Câu hỏi gợi ý 3]`;
  },

  WEAK_AREAS: (quizResults) => `Bạn là trợ lý phân tích học tập AI. Hãy phân tích kết quả quiz sau và xác định các điểm yếu.

Kết quả quiz:
"""
${JSON.stringify(quizResults, null, 2)}
"""

Trả về ĐÚNG format JSON (không có markdown code block):
[
  {
    "topic": "Chủ đề yếu",
    "incorrectRate": 0.6,
    "totalQuestions": 10,
    "incorrectCount": 6,
    "suggestedAction": "Lời khuyên cụ thể để cải thiện",
    "priority": "high"
  }
]

priority: "high" (>60% sai), "medium" (40-60% sai), "low" (<40% sai)

JSON weak areas:`,
};

module.exports = PREMIUM_PROMPTS;
