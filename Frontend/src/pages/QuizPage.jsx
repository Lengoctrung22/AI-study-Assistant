import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  HiOutlineArrowLeft, 
  HiOutlineTrash, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

function QuizPlayer({ quiz: initialQuiz }) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [current, setCurrent] = useState(0);
  const questions = quiz.questions || [];
  const total = questions.length;

  const [answers, setAnswers] = useState(() => Array(total).fill(null));
  const [submitted, setSubmitted] = useState(quiz.status === 'completed');
  const [result, setResult] = useState(quiz.result?.score != null ? quiz.result : null);
  const [submitting, setSubmitting] = useState(false);

  if (total === 0) {
    return (
      <div className="card empty-state" style={{ padding: 40 }}>
        <div className="empty-state-icon">📝</div>
        <h3>Bài quiz chưa có câu hỏi</h3>
        <p>Vui lòng thử tạo lại bài quiz từ tài liệu.</p>
      </div>
    );
  }

  const q = questions[current] || {};
  const qType = q.type || 'mcq';
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  const handleAnswerChange = (val) => {
    if (submitted) return;
    const a = [...answers];
    a[current] = val;
    setAnswers(a);
  };

  const isCurrentAnswered = () => {
    const ans = answers[current];
    if (ans === null || ans === undefined) return false;
    if (typeof ans === 'string' && !ans.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    const unAnsweredIndex = answers.findIndex(
      (a) => a === null || a === undefined || (typeof a === 'string' && !a.trim())
    );
    if (unAnsweredIndex !== -1) {
      setCurrent(unAnsweredIndex);
      return toast.error(`Vui lòng trả lời câu hỏi số ${unAnsweredIndex + 1}`);
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/quiz/${quiz._id}/submit`, { answers });
      setResult(res.data.result);
      setQuiz((prev) => ({ ...prev, questions: res.data.questions }));
      setSubmitted(true);
      toast.success('Đã nộp bài thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Render view sau khi nộp bài
  if (submitted && result) {
    const pct = Math.round(((result.score || 0) / (result.total || total || 1)) * 100);
    return (
      <div className="quiz-container fade-in">
        <div className="card quiz-result-card" style={{ padding: 40 }}>
          <div className="quiz-score">{pct}%</div>
          <h2 style={{ fontSize: 22, margin: '12px 0' }}>
            {result.score}/{result.total} câu đúng
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            {pct >= 80 ? '🎉 Xuất sắc!' : pct >= 60 ? '👍 Khá tốt!' : pct >= 40 ? '📖 Cần ôn thêm' : '💪 Cố gắng hơn nhé'}
          </p>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 16px' }}>Chi tiết đáp án</h3>
        {quiz.questions.map((question, i) => {
          const userAns = answers[i];
          const type = question.type || 'mcq';
          let isCorrect = false;

          if (type === 'mcq') {
            isCorrect = userAns === question.correctAnswer;
          } else if (type === 'true_false') {
            isCorrect = userAns === question.correctBoolean;
          } else if (type === 'fill_blank') {
            isCorrect = String(userAns || '').toLowerCase().trim() === String(question.blankAnswer || '').toLowerCase().trim();
          } else if (type === 'short_answer') {
            const u = String(userAns || '').toLowerCase().trim();
            const c = String(question.shortAnswer || '').toLowerCase().trim();
            isCorrect = u && (u === c || c.includes(u) || u.includes(c));
          }

          return (
            <div className="card" key={question._id || i} style={{ marginBottom: 16, padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                {isCorrect ? (
                  <HiOutlineCheckCircle color="var(--success)" size={22} style={{ flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <HiOutlineXCircle color="var(--danger)" size={22} style={{ flexShrink: 0, marginTop: 2 }} />
                )}
                <div>
                  <strong style={{ fontSize: 15 }}>
                    Câu {i + 1}: {question.question}
                  </strong>
                  <span className="badge badge-secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                    {type === 'mcq' ? 'Trắc nghiệm' : type === 'true_false' ? 'Đúng / Sai' : type === 'fill_blank' ? 'Điền khuyết' : 'Tự luận ngắn'}
                  </span>
                </div>
              </div>

              <div style={{ paddingLeft: 32 }}>
                {/* MCQ Result */}
                {type === 'mcq' && Array.isArray(question.options) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {question.options.map((opt, j) => {
                      const isSelected = userAns === j;
                      const isAnswerKey = question.correctAnswer === j;
                      let color = 'var(--text-secondary)';
                      if (isAnswerKey) color = 'var(--success)';
                      else if (isSelected && !isAnswerKey) color = 'var(--danger)';

                      return (
                        <div key={j} style={{ fontSize: 13.5, color, fontWeight: isAnswerKey || isSelected ? 600 : 400 }}>
                          {String.fromCharCode(65 + j)}. {opt}
                          {isAnswerKey && ' ✓ (Đáp án đúng)'}
                          {isSelected && !isAnswerKey && ' ✗ (Bạn đã chọn)'}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True / False Result */}
                {type === 'true_false' && (
                  <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                    <div>Bạn chọn: <strong>{userAns === true ? 'Đúng (True)' : userAns === false ? 'Sai (False)' : 'Chưa chọn'}</strong></div>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                      Đáp án đúng: {question.correctBoolean === true ? 'Đúng (True)' : 'Sai (False)'}
                    </div>
                  </div>
                )}

                {/* Fill in Blank Result */}
                {type === 'fill_blank' && (
                  <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                    <div>Bạn đã điền: <strong>{userAns || '(để trống)'}</strong></div>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                      Đáp án đúng: {question.blankAnswer}
                    </div>
                  </div>
                )}

                {/* Short Answer Result */}
                {type === 'short_answer' && (
                  <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                    <div>Câu trả lời của bạn: <strong>{userAns || '(để trống)'}</strong></div>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                      Gợi ý đáp án chuẩn: {question.shortAnswer}
                    </div>
                  </div>
                )}

                {question.explanation && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    💡 <strong>Giải thích:</strong> {question.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Render view làm bài
  return (
    <div className="quiz-container fade-in">
      {/* Thanh tiến độ */}
      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="quiz-progress-text">
          Câu {current + 1}/{total}
        </span>
      </div>

      {/* Nội dung câu hỏi */}
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="badge badge-accent" style={{ textTransform: 'uppercase', fontSize: 11 }}>
            {qType === 'mcq' ? 'Trắc nghiệm chọn phương án' : qType === 'true_false' ? 'Chọn Đúng hoặc Sai' : qType === 'fill_blank' ? 'Điền từ vào chỗ trống' : 'Trả lời ngắn'}
          </span>
          {q.topic && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Chủ đề: {q.topic}</span>}
        </div>

        <h3 className="quiz-question" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>
          {q.question}
        </h3>

        {/* 1. Dạng MCQ: Lựa chọn 1 trong 4 */}
        {qType === 'mcq' && Array.isArray(q.options) && (
          <div className="quiz-options">
            {q.options.map((opt, j) => (
              <div
                key={j}
                className={`quiz-option ${answers[current] === j ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(j)}
              >
                <div className="quiz-option-letter">{String.fromCharCode(65 + j)}</div>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}

        {/* 2. Dạng True / False */}
        {qType === 'true_false' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div
              className={`quiz-option ${answers[current] === true ? 'selected' : ''}`}
              onClick={() => handleAnswerChange(true)}
              style={{ justifyContent: 'center', padding: '18px 24px', fontSize: 16, fontWeight: 600 }}
            >
              <span>✓ Đúng (True)</span>
            </div>
            <div
              className={`quiz-option ${answers[current] === false ? 'selected' : ''}`}
              onClick={() => handleAnswerChange(false)}
              style={{ justifyContent: 'center', padding: '18px 24px', fontSize: 16, fontWeight: 600 }}
            >
              <span>✗ Sai (False)</span>
            </div>
          </div>
        )}

        {/* 3. Dạng Fill in Blank */}
        {qType === 'fill_blank' && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              className="input"
              placeholder="Nhập từ hoặc cụm từ còn thiếu vào đây..."
              value={answers[current] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', fontSize: 15 }}
              autoFocus
            />
          </div>
        )}

        {/* 4. Dạng Short Answer */}
        {qType === 'short_answer' && (
          <div style={{ marginTop: 12 }}>
            <textarea
              className="input"
              rows={3}
              placeholder="Nhập câu trả lời ngắn gọn của bạn..."
              value={answers[current] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', fontSize: 15, resize: 'vertical' }}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Điều khiển chuyển câu & nộp bài */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ← Câu trước
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {current === total - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ minWidth: 120 }}
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            >
              Câu tiếp →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api
        .get(`/quiz/${id}`)
        .then((r) => {
          setActiveQuiz(r.data.quiz);
          setLoading(false);
        })
        .catch(() => {
          toast.error('Không tìm thấy bài quiz');
          setLoading(false);
        });
    } else {
      setLoading(true);
      api
        .get('/quiz')
        .then((r) => {
          setQuizzes(r.data.quizzes || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async (e, qId) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bài quiz này?')) return;
    try {
      await api.delete(`/quiz/${qId}`);
      setQuizzes((q) => q.filter((x) => x._id !== qId));
      toast.success('Đã xóa bài quiz');
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  if (loading) {
    return (
      <div className="loader" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (activeQuiz) {
    const questionCount = activeQuiz.questions?.length || 0;
    return (
      <div className="page-container fade-in">
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/quiz')}
          style={{ marginBottom: 16 }}
        >
          <HiOutlineArrowLeft /> Quay lại danh sách
        </button>
        <div className="page-header">
          <h1>{activeQuiz.title}</h1>
          <p>
            {questionCount} câu hỏi • Độ khó: {activeQuiz.difficulty || 'Tổng hợp'}
          </p>
        </div>
        <QuizPlayer key={activeQuiz._id} quiz={activeQuiz} />
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Trắc nghiệm & Ôn luyện</h1>
        <p>Các bài quiz được tạo tự động từ tài liệu học tập của bạn</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>Chưa có bài quiz nào</h3>
          <p>Mở tài liệu và tạo quiz từ nội dung học tập của bạn để bắt đầu luyện tập</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/documents')}
          >
            Mở danh sách tài liệu
          </button>
        </div>
      ) : (
        <div className="doc-grid">
          {quizzes.map((q) => (
            <div
              className="card doc-card"
              key={q._id}
              onClick={() => navigate(`/quiz/${q._id}`)}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{q.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {q.documentId?.title || 'Tài liệu học'} • {q.questions?.length || 0} câu
              </p>
              <div className="doc-card-footer">
                <span
                  className={`badge ${
                    q.status === 'completed' ? 'badge-success' : 'badge-warning'
                  }`}
                >
                  {q.status === 'completed'
                    ? `${q.result?.score || 0}/${q.result?.total || q.questions?.length || 0} điểm`
                    : 'Chưa làm'}
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => handleDelete(e, q._id)}
                  title="Xóa bài quiz"
                >
                  <HiOutlineTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
