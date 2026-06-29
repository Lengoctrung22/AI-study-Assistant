import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { HiOutlineDocumentText, HiOutlineRectangleStack, HiOutlineClipboardDocumentCheck, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

export default function DashboardPage() {
  const [stats, setStats] = useState({ documents: 0, flashcards: 0, quizzes: 0, chats: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [docsRes, fcRes, quizRes] = await Promise.all([
          api.get('/documents'),
          api.get('/flashcards'),
          api.get('/quiz'),
        ]);
        setStats({
          documents: docsRes.data.documents?.length || 0,
          flashcards: fcRes.data.flashcardSets?.length || 0,
          quizzes: quizRes.data.quizzes?.length || 0,
          chats: 0,
        });
        setRecentDocs((docsRes.data.documents || []).slice(0, 5));
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const statItems = [
    { icon: <HiOutlineDocumentText />, value: stats.documents, label: 'Tài liệu', color: '#ef4444', bg: 'var(--danger-light)' },
    { icon: <HiOutlineRectangleStack />, value: stats.flashcards, label: 'Bộ Flashcard', color: '#6366f1', bg: 'var(--accent-light)' },
    { icon: <HiOutlineClipboardDocumentCheck />, value: stats.quizzes, label: 'Bài Quiz', color: '#10b981', bg: 'var(--success-light)' },
    { icon: <HiOutlineChatBubbleLeftRight />, value: stats.chats, label: 'Phiên Chat', color: '#3b82f6', bg: 'var(--info-light)' },
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Tổng quan</h1>
        <p>Chào mừng bạn quay trở lại!</p>
      </div>

      <div className="stats-grid">
        {statItems.map((s, i) => (
          <div className="card stat-card" key={i}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Tài liệu gần đây</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/documents')}>Xem tất cả</button>
      </div>

      {recentDocs.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>Chưa có tài liệu</h3>
          <p>Upload file PDF đầu tiên để bắt đầu học tập với AI</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/documents')}>Upload PDF</button>
        </div>
      ) : (
        <div className="doc-grid">
          {recentDocs.map((doc) => (
            <div className="card doc-card" key={doc._id} onClick={() => navigate(`/documents/${doc._id}`)}>
              <div className="doc-card-header">
                <div className="doc-card-icon"><HiOutlineDocumentText /></div>
                <div>
                  <div className="doc-card-title">{doc.title}</div>
                  <div className="doc-card-meta">{doc.pageCount} trang • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              {doc.summary && <div className="doc-card-summary">{doc.summary}</div>}
              <div className="doc-card-footer">
                <span className={`badge ${doc.status === 'ready' ? 'badge-success' : doc.status === 'processing' ? 'badge-warning' : 'badge-danger'}`}>
                  {doc.status === 'ready' ? 'Sẵn sàng' : doc.status === 'processing' ? 'Đang xử lý' : 'Lỗi'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
