import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';

export default function AIToolsPage() {
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';
  const [searchParams] = useSearchParams();
  const initDocId = searchParams.get('documentId');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(initDocId || '');
  const [activeTab, setActiveTab] = useState('mindmap');
  const [mindMap, setMindMap] = useState(null);
  const [concepts, setConcepts] = useState(null);
  const [multiSummary, setMultiSummary] = useState(null);
  const [summaryLevel, setSummaryLevel] = useState('undergraduate');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/documents').then(r => {
      const docs = r.data.documents?.filter(d => d.status === 'ready') || [];
      setDocuments(docs);
      if (initDocId) {
        setSelectedDoc(initDocId);
      } else if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]._id);
      }
    }).catch(console.error);
  }, [initDocId]);

  useEffect(() => {
    if (selectedDoc && isPremium) {
      setLoading(true);
      api.get(`/documents/${selectedDoc}`)
        .then(r => {
          const doc = r.data.document;
          setMindMap(doc.mindMap || null);
          setConcepts(doc.concepts || null);
          setMultiSummary(doc.multiLevelSummary || null);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setMindMap(null);
      setConcepts(null);
      setMultiSummary(null);
    }
  }, [selectedDoc, isPremium]);

  const generateMindMap = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    try { const r = await api.post(`/premium/documents/${selectedDoc}/mindmap`); setMindMap(r.data.mindMap); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const generateConcepts = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    try { const r = await api.post(`/premium/documents/${selectedDoc}/concepts`); setConcepts(r.data.concepts); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const generateMultiSummary = async (level) => {
    if (!selectedDoc) return;
    setLoading(true);
    try { const r = await api.post(`/premium/documents/${selectedDoc}/multi-summary`, { level }); setMultiSummary(prev => ({ ...prev, ...r.data.multiLevelSummary })); } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!isPremium) {
    return (
      <div className="page-container fade-in">
        <div className="premium-gate">
          <div className="premium-gate-icon"><PiCrownBold /></div>
          <h2>AI Tools Nâng cao</h2>
          <p>Nâng cấp Premium để sử dụng các công cụ AI học tập nâng cao.</p>
          <div className="premium-features-list">
            <div className="premium-feature-item">🧠 Sơ đồ tư duy AI</div>
            <div className="premium-feature-item">🔗 Đồ thị khái niệm</div>
            <div className="premium-feature-item">📝 Tóm tắt đa cấp độ</div>
          </div>
        </div>
      </div>
    );
  }

  const levelLabels = { child: '👶 Trẻ em', high_school: '🎓 THPT', undergraduate: '📚 Đại học', graduate: '🔬 Cao học', expert: '👨‍🔬 Chuyên gia' };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1><HiOutlineSparkles style={{ marginRight: 8 }} /> AI Tools Nâng cao</h1>
        <p>Công cụ AI hỗ trợ học tập chuyên sâu</p>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Chọn tài liệu:</label>
        <select className="input-field" value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}>
          <option value="">-- Chọn tài liệu --</option>
          {documents.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
        </select>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'mindmap' ? 'active' : ''}`} onClick={() => setActiveTab('mindmap')}>🧠 Sơ đồ tư duy</button>
        <button className={`tab-btn ${activeTab === 'concepts' ? 'active' : ''}`} onClick={() => setActiveTab('concepts')}>🔗 Khái niệm</button>
        <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>📝 Tóm tắt đa cấp</button>
      </div>

      {/* Mind Map Tab */}
      {activeTab === 'mindmap' && (
        <div>
          <button className="btn btn-primary" onClick={generateMindMap} disabled={loading || !selectedDoc} style={{ marginBottom: 20 }}>
            {loading ? 'Đang tạo...' : '🧠 Tạo sơ đồ tư duy'}
          </button>
          {mindMap && (
            <div className="card mindmap-container" style={{ padding: 24 }}>
              <div className="mindmap-central">{mindMap.central}</div>
              <div className="mindmap-branches">
                {mindMap.branches?.map((branch, i) => (
                  <div key={i} className="mindmap-branch" style={{ borderLeftColor: branch.color || '#6366f1' }}>
                    <div className="mindmap-branch-label" style={{ color: branch.color || '#6366f1' }}>{branch.label}</div>
                    {branch.children?.map((child, j) => (
                      <div key={j} className="mindmap-child">{child.label}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Concepts Tab */}
      {activeTab === 'concepts' && (
        <div>
          <button className="btn btn-primary" onClick={generateConcepts} disabled={loading || !selectedDoc} style={{ marginBottom: 20 }}>
            {loading ? 'Đang phân tích...' : '🔗 Phân tích khái niệm'}
          </button>
          {concepts && (
            <div>
              <div className="concepts-nodes">
                {concepts.nodes?.map((node, i) => (
                  <div key={i} className={`card concept-node importance-${node.importance}`}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{node.label}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{node.description}</p>
                  </div>
                ))}
              </div>
              {concepts.edges?.length > 0 && (
                <div className="card" style={{ padding: 20, marginTop: 16 }}>
                  <h3 style={{ marginBottom: 12 }}>🔗 Mối quan hệ</h3>
                  {concepts.edges.map((edge, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14 }}>
                      <span className="badge badge-info">{concepts.nodes?.find(n => n.id === edge.from)?.label || edge.from}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>→ {edge.relation} →</span>
                      <span className="badge badge-info">{concepts.nodes?.find(n => n.id === edge.to)?.label || edge.to}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Multi-Level Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {Object.entries(levelLabels).map(([key, label]) => (
              <button key={key} className={`btn ${summaryLevel === key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setSummaryLevel(key); if (!multiSummary?.[key]) generateMultiSummary(key); }}>
                {label}
              </button>
            ))}
          </div>
          {loading && <div className="loading-spinner"><div className="spinner" /></div>}
          {multiSummary?.[summaryLevel] && (
            <div className="card" style={{ padding: 24 }}>
              <div className="badge badge-info" style={{ marginBottom: 12 }}>{levelLabels[summaryLevel]}</div>
              <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{multiSummary[summaryLevel]}</div>
            </div>
          )}
          {!multiSummary?.[summaryLevel] && !loading && selectedDoc && (
            <button className="btn btn-primary" onClick={() => generateMultiSummary(summaryLevel)}>
              Tạo tóm tắt cấp độ {levelLabels[summaryLevel]}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
