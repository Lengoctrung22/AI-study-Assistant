import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import { HiOutlineArrowLeft, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';

function QuizPlayer({ quiz: initialQuiz }) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(quiz.status === 'completed');
  const [result, setResult] = useState(quiz.result?.score != null ? quiz.result : null);
  const [submitting, setSubmitting] = useState(false);

  const q = quiz.questions[current];
  const total = quiz.questions.length;
  const progress = ((current + 1) / total) * 100;

  const selectAnswer = (idx) => { if (!submitted) { const a = [...answers]; a[current] = idx; setAnswers(a); } };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) return toast.error('Vui lòng trả lời hết các câu hỏi');
    setSubmitting(true);
    try {
      const res = await api.post(`/quiz/${quiz._id}/submit`, { answers });
      setResult(res.data.result);
      setQuiz((prev) => ({ ...prev, questions: res.data.questions }));
      setSubmitted(true);
      toast.success('Đã nộp bài!');
    } catch (err) { toast.error(err.response?.data?.message || 'Nộp bài thất bại'); }
    finally { setSubmitting(false); }
  };

  if (submitted && result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="quiz-container fade-in">
        <div className="card quiz-result-card" style={{ padding: 40 }}>
          <div className="quiz-score">{pct}%</div>
          <h2 style={{ fontSize: 22, margin: '12px 0' }}>{result.score}/{result.total} câu đúng</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            {pct >= 80 ? '🎉 Xuất sắc!' : pct >= 60 ? '👍 Khá tốt!' : pct >= 40 ? '📖 Cần ôn thêm' : '💪 Cố gắng hơn nhé'}
          </p>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 16px' }}>Chi tiết đáp án</h3>
        {quiz.questions.map((question, i) => (
          <div className="card" key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
              {answers[i] === question.correctAnswer ? <HiOutlineCheckCircle color="var(--success)" size={20} /> : <HiOutlineXCircle color="var(--danger)" size={20} />}
              <strong style={{ fontSize: 14 }}>Câu {i + 1}: {question.question}</strong>
            </div>
            <div style={{ paddingLeft: 28 }}>
              {question.options.map((opt, j) => (
                <div key={j} style={{ padding: '4px 0', fontSize: 13, color: j === question.correctAnswer ? 'var(--success)' : answers[i] === j ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {String.fromCharCode(65 + j)}. {opt} {j === question.correctAnswer && ' ✓'}
                </div>
              ))}
              {question.explanation && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>💡 {question.explanation}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="quiz-container fade-in">
      <div className="quiz-progress">
        <div className="quiz-progress-bar"><div className="quiz-progress-fill" style={{ width: `${progress}%` }} /></div>
        <span className="quiz-progress-text">Câu {current + 1}/{total}</span>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="quiz-question">{q.question}</div>
        <div className="quiz-options">
          {q.options.map((opt, j) => (
            <div key={j} className={`quiz-option ${answers[current] === j ? 'selected' : ''}`} onClick={() => selectAnswer(j)}>
              <div className="quiz-option-letter">{String.fromCharCode(65 + j)}</div>
              <span>{opt}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>← Trước</button>
        {current === total - 1 ? (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Đang nộp...' : 'Nộp bài'}</button>
        ) : (
          <button className="btn btn-primary" onClick={() => setCurrent(current + 1)}>Tiếp →</button>
        )}
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
      api.get(`/quiz/${id}`).then((r) => { setActiveQuiz(r.data.quiz); setLoading(false); }).catch(() => { toast.error('Không tìm thấy'); setLoading(false); });
    } else {
      api.get('/quiz').then((r) => { setQuizzes(r.data.quizzes || []); setLoading(false); });
    }
  }, [id]);

  const handleDelete = async (e, qId) => {
    e.stopPropagation();
    if (!confirm('Xóa bài quiz này?')) return;
    try { await api.delete(`/quiz/${qId}`); setQuizzes((q) => q.filter((x) => x._id !== qId)); toast.success('Đã xóa'); } catch { toast.error('Xóa thất bại'); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  if (activeQuiz) {
    return (
      <div className="page-container fade-in">
        <button className="btn btn-ghost" onClick={() => navigate('/quiz')} style={{ marginBottom: 16 }}><HiOutlineArrowLeft /> Quay lại</button>
        <div className="page-header">
          <h1>{activeQuiz.title}</h1>
          <p>{activeQuiz.questions.length} câu hỏi • Độ khó: {activeQuiz.difficulty}</p>
        </div>
        <QuizPlayer quiz={activeQuiz} />
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Trắc nghiệm</h1>
        <p>Các bài quiz được tạo từ tài liệu</p>
      </div>
      {quizzes.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>Chưa có bài quiz</h3>
          <p>Mở tài liệu và tạo quiz từ nội dung tài liệu học tập của bạn</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/documents')}>Mở tài liệu</button>
        </div>
      ) : (
        <div className="doc-grid">
          {quizzes.map((q) => (
            <div className="card doc-card" key={q._id} onClick={() => navigate(`/quiz/${q._id}`)}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{q.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{q.documentId?.title || ''}</p>
              <div className="doc-card-footer">
                <span className={`badge ${q.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {q.status === 'completed' ? `${q.result?.score}/${q.result?.total} điểm` : 'Chưa làm'}
                </span>
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, q._id)}><HiOutlineTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
