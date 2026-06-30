import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineChartBarSquare, HiOutlineExclamationTriangle, HiOutlineAcademicCap, HiOutlineClock, HiOutlineBookOpen } from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';

function PremiumGate({ title, features }) {
  return (
    <div className="page-container fade-in">
      <div className="premium-gate">
        <div className="premium-gate-icon"><PiCrownBold /></div>
        <h2>{title}</h2>
        <p>Nâng cấp lên Premium để truy cập tính năng này.</p>
        <div className="premium-features-list">
          {features.map((f, i) => <div key={i} className="premium-feature-item">{f}</div>)}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';
  const [searchParams] = useSearchParams();
  const initDocId = searchParams.get('documentId');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(initDocId || '');
  const [analytics, setAnalytics] = useState(null);
  const [glossary, setGlossary] = useState(null);
  const [weakAreas, setWeakAreas] = useState(null);
  const [quizAnalytics, setQuizAnalytics] = useState(null);
  const [loading, setLoading] = useState({});
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    api.get('/documents').then(r => {
      const docs = r.data.documents || [];
      setDocuments(docs);
      if (initDocId) {
        setSelectedDoc(initDocId);
      } else if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]._id);
      }
    }).catch(console.error);

    if (isPremium) {
      api.get('/premium/analytics/weak-areas').then(r => setWeakAreas(r.data)).catch(console.error);
      api.get('/quiz/analytics').then(r => setQuizAnalytics(r.data.analytics)).catch(console.error);
    }
  }, [isPremium, initDocId]);

  const loadAnalytics = async (docId) => {
    setLoading(p => ({ ...p, analytics: true }));
    try { const r = await api.post(`/premium/documents/${docId}/analytics`); setAnalytics(r.data.analytics); } catch (e) { console.error(e); }
    setLoading(p => ({ ...p, analytics: false }));
  };

  const loadGlossary = async (docId) => {
    setLoading(p => ({ ...p, glossary: true }));
    try { const r = await api.post(`/premium/documents/${docId}/glossary`); setGlossary(r.data.glossary); } catch (e) { console.error(e); }
    setLoading(p => ({ ...p, glossary: false }));
  };

  useEffect(() => {
    if (selectedDoc && isPremium) {
      if (activeTab === 'analytics') {
        loadAnalytics(selectedDoc);
      } else if (activeTab === 'glossary') {
        loadGlossary(selectedDoc);
      }
    }
  }, [selectedDoc, activeTab, isPremium]);

  if (!isPremium) return <PremiumGate title="Phân tích & Thống kê" features={['📊 Phân tích độ khó tài liệu', '📖 Bảng thuật ngữ tự động', '⚠️ Phát hiện điểm yếu', '📈 Thống kê quiz chi tiết']} />;

  const tabs = [
    { key: 'analytics', label: '📊 Phân tích tài liệu' },
    { key: 'glossary', label: '📖 Bảng thuật ngữ' },
    { key: 'weakAreas', label: '⚠️ Điểm yếu' },
    { key: 'quizStats', label: '📈 Thống kê Quiz' },
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1><HiOutlineChartBarSquare style={{ marginRight: 8 }} /> Phân tích & Thống kê</h1>
        <p>Hiểu sâu tài liệu và theo dõi tiến trình học tập</p>
      </div>

      <div className="tabs-container">
        {tabs.map(t => <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      {(activeTab === 'analytics' || activeTab === 'glossary') && (
        <div className="card" style={{ marginBottom: 20, padding: 16 }}>
          <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Chọn tài liệu:</label>
          <select className="input-field" value={selectedDoc || ''} onChange={e => setSelectedDoc(e.target.value)}>
            <option value="">-- Chọn tài liệu --</option>
            {documents.filter(d => d.status === 'ready').map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
          </select>
        </div>
      )}

      {activeTab === 'analytics' && analytics && !loading.analytics && (
        <div className="analytics-grid">
          <div className="card stat-card"><div className="stat-value">{analytics.difficultyScore}/10</div><div className="stat-label">Độ khó</div></div>
          <div className="card stat-card"><div className="stat-value">{analytics.readabilityLevel}</div><div className="stat-label">Trình độ</div></div>
          <div className="card stat-card"><div className="stat-value">{analytics.estimatedStudyHours}h</div><div className="stat-label">Thời gian</div></div>
          <div className="card stat-card"><div className="stat-value">{analytics.keyTermsCount}</div><div className="stat-label">Thuật ngữ</div></div>
          <div className="card" style={{ gridColumn: '1 / -1', padding: 20 }}>
            <h3 style={{ marginBottom: 16 }}>📊 Phân bổ chủ đề</h3>
            {(analytics.topicBreakdown || []).map((t, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 500 }}>{t.topic}</span><span style={{ color: 'var(--text-secondary)' }}>{Math.round(t.weight * 100)}%</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${t.weight * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'glossary' && glossary && (
        <div className="glossary-grid">
          {glossary.map((item, i) => (
            <div key={i} className="card glossary-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{item.term}</h3>
                <span className={`badge ${item.importance === 'high' ? 'badge-danger' : 'badge-warning'}`}>{item.importance}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{item.definition}</p>
              {item.relatedTerms?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {item.relatedTerms.map((rt, j) => <span key={j} className="badge badge-info" style={{ fontSize: 11 }}>{rt}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'weakAreas' && weakAreas?.weakAreas?.length > 0 && (
        <div className="weak-areas-list">
          {weakAreas.weakAreas.map((area, i) => (
            <div key={i} className={`card weak-area-card priority-${area.priority}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{area.topic}</h3>
                <span className={`badge ${area.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                  {area.priority === 'high' ? '🔴 Cần ôn gấp' : '🟡 Cần cải thiện'}
                </span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 8 }}>
                <div className="progress-fill" style={{ width: `${area.incorrectRate * 100}%`, background: area.priority === 'high' ? '#ef4444' : '#f59e0b' }} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sai {area.incorrectCount}/{area.totalQuestions} câu • 💡 {area.suggestedAction}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'quizStats' && quizAnalytics && (
        <div className="analytics-grid">
          <div className="card stat-card"><div className="stat-value">{quizAnalytics.totalQuizzes}</div><div className="stat-label">Tổng Quiz</div></div>
          <div className="card stat-card"><div className="stat-value">{quizAnalytics.averageScore}%</div><div className="stat-label">Điểm TB</div></div>
          <div className="card stat-card"><div className="stat-value" style={{ color: quizAnalytics.improvement >= 0 ? '#10b981' : '#ef4444' }}>{quizAnalytics.improvement > 0 ? '+' : ''}{quizAnalytics.improvement}%</div><div className="stat-label">Xu hướng</div></div>
          {quizAnalytics.topicPerformance && (
            <div className="card" style={{ gridColumn: '1 / -1', padding: 20 }}>
              <h3 style={{ marginBottom: 16 }}>📊 Hiệu suất theo chủ đề</h3>
              {quizAnalytics.topicPerformance.map((t, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>{t.topic}</span><span style={{ fontWeight: 600, color: t.accuracy >= 80 ? '#10b981' : '#f59e0b' }}>{t.accuracy}%</span></div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${t.accuracy}%`, background: t.accuracy >= 80 ? '#10b981' : '#f59e0b' }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {Object.values(loading).some(Boolean) && <div className="loading-spinner"><div className="spinner" /></div>}
    </div>
  );
}
