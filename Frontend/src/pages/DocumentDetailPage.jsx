import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { HiOutlineChatBubbleLeftRight, HiOutlineRectangleStack, HiOutlineClipboardDocumentCheck, HiOutlineLightBulb, HiOutlineArrowPath, HiOutlineArrowLeft, HiOutlineChartBarSquare, HiOutlineSparkles } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [explainText, setExplainText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [genLoading, setGenLoading] = useState('');

  useEffect(() => {
    api.get(`/documents/${id}`).then((r) => setDoc(r.data.document)).catch(() => toast.error('Không tìm thấy tài liệu')).finally(() => setLoading(false));
  }, [id]);

  const handleExplain = async () => {
    if (!explainText.trim()) return;
    setExplaining(true);
    try {
      const res = await api.post(`/documents/${id}/explain`, { text: explainText });
      setExplanation(res.data.explanation);
    } catch (err) { toast.error('Giải thích thất bại'); }
    finally { setExplaining(false); }
  };

  const handleGenerate = async (type) => {
    setGenLoading(type);
    try {
      if (type === 'flashcard') {
        const res = await api.post(`/flashcards/generate/${id}`, { count: 10 });
        toast.success('Tạo flashcard thành công!');
        navigate(`/flashcards/${res.data.flashcardSet._id}`);
      } else if (type === 'quiz') {
        const res = await api.post(`/quiz/generate/${id}`, { count: 10, difficulty: 'mixed' });
        toast.success('Tạo quiz thành công!');
        navigate(`/quiz/${res.data.quiz._id}`);
      } else if (type === 'chat') {
        navigate(`/chat?documentId=${id}`);
      } else if (type === 'resummarize') {
        const res = await api.post(`/documents/${id}/summarize`);
        setDoc((d) => ({ ...d, summary: res.data.summary }));
        toast.success('Tóm tắt lại thành công!');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setGenLoading(''); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!doc) return <div className="page-container"><p>Không tìm thấy tài liệu</p></div>;

  return (
    <div className="page-container fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/documents')} style={{ marginBottom: 16 }}>
        <HiOutlineArrowLeft /> Quay lại
      </button>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{doc.title}</h1>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{doc.pageCount} trang</span>
              <span className="badge badge-accent">{doc.chunkCount} chunks</span>
              <span className={`badge ${doc.status === 'ready' ? 'badge-success' : 'badge-warning'}`}>
                {doc.status === 'ready' ? 'Sẵn sàng' : 'Đang xử lý'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={() => handleGenerate('chat')} disabled={!!genLoading}>
          <HiOutlineChatBubbleLeftRight /> Chat với tài liệu
        </button>
        <button className="btn btn-secondary" onClick={() => handleGenerate('flashcard')} disabled={!!genLoading}>
          {genLoading === 'flashcard' ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <HiOutlineRectangleStack />}
          Tạo Flashcard
        </button>
        <button className="btn btn-secondary" onClick={() => handleGenerate('quiz')} disabled={!!genLoading}>
          {genLoading === 'quiz' ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <HiOutlineClipboardDocumentCheck />}
          Tạo Quiz
        </button>
        <button className="btn btn-secondary" onClick={() => handleGenerate('resummarize')} disabled={!!genLoading}>
          {genLoading === 'resummarize' ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <HiOutlineArrowPath />}
          Tóm tắt lại
        </button>
      </div>

      {/* Premium AI Study Tools Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 24 }}>
        <button className={`btn ${isPremium ? 'btn-primary' : 'btn-secondary nav-link-locked'}`} onClick={() => navigate(`/analytics?documentId=${id}`)} style={isPremium ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}>
          <HiOutlineChartBarSquare /> Phân tích & Thuật ngữ {!isPremium && '🔒'}
        </button>
        <button className={`btn ${isPremium ? 'btn-primary' : 'btn-secondary nav-link-locked'}`} onClick={() => navigate(`/ai-tools?documentId=${id}`)} style={isPremium ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}>
          <HiOutlineSparkles /> Sơ đồ tư duy & Tóm tắt AI {!isPremium && '🔒'}
        </button>
      </div>

      {/* Summary */}
      {doc.summary && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📝 Tóm tắt nội dung</h2>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <ReactMarkdown>{doc.summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Explain Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>💡 Giải thích đoạn khó hiểu</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowExplain(!showExplain)}>
            {showExplain ? 'Ẩn' : 'Mở'}
          </button>
        </div>
        {showExplain && (
          <div>
            <textarea className="input" rows={4} placeholder="Dán đoạn text khó hiểu vào đây..."
              value={explainText} onChange={(e) => setExplainText(e.target.value)}
              style={{ width: '100%', marginBottom: 12, resize: 'vertical' }} />
            <button className="btn btn-primary btn-sm" onClick={handleExplain} disabled={explaining || !explainText.trim()}>
              {explaining ? 'Đang giải thích...' : <><HiOutlineLightBulb /> Giải thích</>}
            </button>
            {explanation && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, fontSize: 14, lineHeight: 1.8 }}>
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
