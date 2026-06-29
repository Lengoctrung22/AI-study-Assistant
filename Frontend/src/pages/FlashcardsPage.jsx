import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineArrowLeft, HiOutlineTrash } from 'react-icons/hi2';
import toast from 'react-hot-toast';

function FlashcardStudy({ set }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = set.cards[currentIndex];
  const total = set.cards.length;

  const next = () => { if (currentIndex < total - 1) { setCurrentIndex(currentIndex + 1); setFlipped(false); } };
  const prev = () => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setFlipped(false); } };

  return (
    <div>
      <div className="flashcard-container" onClick={() => setFlipped(!flipped)} style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <div className="flashcard-label">Câu hỏi</div>
            <p style={{ fontSize: 18, fontWeight: 500 }}>{card.front}</p>
            <div style={{ marginTop: 16 }}>
              <span className={`badge badge-${card.difficulty === 'easy' ? 'success' : card.difficulty === 'hard' ? 'danger' : 'warning'}`}>
                {card.difficulty === 'easy' ? 'Dễ' : card.difficulty === 'hard' ? 'Khó' : 'Trung bình'}
              </span>
            </div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Đáp án</div>
            <p>{card.back}</p>
          </div>
        </div>
      </div>
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>Click để lật thẻ</p>
      <div className="flashcard-nav">
        <button className="btn btn-secondary btn-sm" onClick={prev} disabled={currentIndex === 0}><HiOutlineChevronLeft /></button>
        <span className="flashcard-counter">{currentIndex + 1} / {total}</span>
        <button className="btn btn-secondary btn-sm" onClick={next} disabled={currentIndex === total - 1}><HiOutlineChevronRight /></button>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/flashcards/${id}`).then((r) => { setActiveSet(r.data.flashcardSet); setLoading(false); }).catch(() => { toast.error('Không tìm thấy'); setLoading(false); });
    } else {
      api.get('/flashcards').then((r) => { setSets(r.data.flashcardSets || []); setLoading(false); });
    }
  }, [id]);

  const handleDelete = async (e, setId) => {
    e.stopPropagation();
    if (!confirm('Xóa bộ flashcard này?')) return;
    try { await api.delete(`/flashcards/${setId}`); setSets((s) => s.filter((x) => x._id !== setId)); toast.success('Đã xóa'); } catch { toast.error('Xóa thất bại'); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  if (activeSet) {
    return (
      <div className="page-container fade-in">
        <button className="btn btn-ghost" onClick={() => navigate('/flashcards')} style={{ marginBottom: 16 }}><HiOutlineArrowLeft /> Quay lại</button>
        <div className="page-header">
          <h1>{activeSet.title}</h1>
          <p>{activeSet.cards.length} thẻ • Tạo từ: {activeSet.documentId?.title || 'N/A'}</p>
        </div>
        <FlashcardStudy set={activeSet} />
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Flashcards</h1>
        <p>Các bộ flashcard được tạo từ tài liệu</p>
      </div>
      {sets.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🃏</div>
          <h3>Chưa có flashcard</h3>
          <p>Mở tài liệu và tạo flashcard từ nội dung PDF</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/documents')}>Mở tài liệu</button>
        </div>
      ) : (
        <div className="doc-grid">
          {sets.map((s) => (
            <div className="card doc-card" key={s._id} onClick={() => navigate(`/flashcards/${s._id}`)}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{s.cards.length} thẻ • {s.documentId?.title || ''}</p>
              <div className="doc-card-footer">
                <span className="badge badge-accent">{s.totalReviews} lượt ôn</span>
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, s._id)}><HiOutlineTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
