import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  HiOutlineBookOpen, HiOutlinePlus, HiOutlineTrash, 
  HiOutlineChatBubbleLeftRight, HiOutlineDocumentText, 
  HiOutlinePaperAirplane, HiOutlineArrowLeft, HiOutlineXMark,
  HiOutlineClock, HiOutlineQuestionMarkCircle, HiOutlineSparkles,
  HiOutlineListBullet, HiOutlineChatBubbleBottomCenterText
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function NotebookPage() {
  const { id: notebookId } = useParams();
  const navigate = useNavigate();

  const [notebook, setNotebook] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Document addition
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);

  // Notes state
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Tabs for Center Panel (AI Artifacts)
  // Types: briefingDoc | studyGuide | timeline | faq | deepDiveScript | tableOfContents
  const [activeTab, setActiveTab] = useState('briefingDoc');
  const [generatingArtifact, setGeneratingArtifact] = useState({});

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  
  const chatEndRef = useRef(null);

  const loadNotebookData = async () => {
    try {
      const [nbRes, allDocsRes] = await Promise.all([
        api.get(`/notebooks/${notebookId}`),
        api.get('/documents')
      ]);
      
      setNotebook(nbRes.data.notebook);
      
      // Filter out documents already in this notebook, and only keep ready ones
      const currentDocIds = nbRes.data.notebook.documents.map(d => d._id);
      setAvailableDocs(
        (allDocsRes.data.documents || []).filter(
          d => d.status === 'ready' && !currentDocIds.includes(d._id)
        )
      );

      // Load chat sessions for this notebook
      const sessionsRes = await api.get(`/notebooks/${notebookId}/chat/sessions`);
      setChatSessions(sessionsRes.data.sessions || []);
      
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu sổ tay');
      navigate('/notebooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotebookData();
  }, [notebookId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notes CRUD
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/notebooks/${notebookId}/notes`, { content: noteContent });
      setNotebook(prev => ({ ...prev, notes: res.data.notes }));
      setNoteContent('');
      toast.success('Đã thêm ghi chú');
    } catch (err) {
      toast.error('Không thể thêm ghi chú');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Xóa ghi chú này?')) return;
    try {
      const res = await api.delete(`/notebooks/${notebookId}/notes/${noteId}`);
      setNotebook(prev => ({ ...prev, notes: res.data.notes }));
      toast.success('Đã xóa ghi chú');
    } catch (err) {
      toast.error('Xóa thất bại');
    }
  };

  // Document Management
  const handleAddDocsToNotebook = async (selectedDocIds) => {
    if (selectedDocIds.length === 0) return;
    try {
      const res = await api.post(`/notebooks/${notebookId}/documents`, { documentIds: selectedDocIds });
      setNotebook(res.data.notebook);
      setIsAddDocOpen(false);
      toast.success('Đã thêm tài liệu vào sổ tay');
      loadNotebookData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm tài liệu');
    }
  };

  const handleRemoveDoc = async (docId) => {
    if (!confirm('Xóa tài liệu này khỏi sổ tay? (Bản gốc vẫn nằm ở kho tài liệu của bạn)')) return;
    try {
      const res = await api.delete(`/notebooks/${notebookId}/documents/${docId}`);
      setNotebook(res.data.notebook);
      toast.success('Đã gỡ tài liệu khỏi sổ tay');
      loadNotebookData();
    } catch (err) {
      toast.error('Lỗi gỡ tài liệu');
    }
  };

  // AI Output Generator
  const handleGenerateArtifact = async (type) => {
    setGeneratingArtifact(prev => ({ ...prev, [type]: true }));
    try {
      const res = await api.post(`/notebooks/${notebookId}/generate/${type}`);
      
      let formattedContent = res.data.content;
      // If it returned object (JSON for FAQ/Timeline/TOC), save it stringified to represent in UI
      if (typeof formattedContent === 'object') {
        formattedContent = JSON.stringify(formattedContent);
      }

      setNotebook(prev => ({
        ...prev,
        generatedOutputs: {
          ...prev.generatedOutputs,
          [type]: {
            content: formattedContent,
            generatedAt: res.data.generatedAt
          }
        }
      }));
      toast.success('Đã tạo xong tài liệu học tập!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi AI xử lý');
    } finally {
      setGeneratingArtifact(prev => ({ ...prev, [type]: false }));
    }
  };

  // Chat implementation
  const handleSendMessage = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || inputMessage;
    if (!textToSend.trim()) return;

    // Optimistically update messages
    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!directText) setInputMessage('');
    setSendingMessage(true);

    try {
      const res = await api.post(`/notebooks/${notebookId}/chat`, {
        message: textToSend,
        sessionId
      });

      setSessionId(res.data.sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations
      }]);

      // Reload chat sessions list if new session
      if (!sessionId) {
        const sessionsRes = await api.get(`/notebooks/${notebookId}/chat/sessions`);
        setChatSessions(sessionsRes.data.sessions || []);
      }
    } catch (err) {
      toast.error('Lỗi kết nối với AI');
    } finally {
      setSendingMessage(false);
    }
  };

  // Load old chat session
  const handleLoadSession = async (session) => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/sessions/${session._id}`);
      setSessionId(session._id);
      setMessages(res.data.messages || []);
      toast.success(`Đã mở: ${session.title}`);
    } catch (err) {
      toast.error('Không thể tải cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setSessionId(null);
    setMessages([]);
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!notebook) return null;

  // Parsers for structured JSON artifacts
  let timelineData = null;
  let faqData = null;
  let tocData = null;

  if (activeTab === 'timeline' && notebook.generatedOutputs?.timeline?.content) {
    try { timelineData = JSON.parse(notebook.generatedOutputs.timeline.content); } catch (e) {}
  }
  if (activeTab === 'faq' && notebook.generatedOutputs?.faq?.content) {
    try { faqData = JSON.parse(notebook.generatedOutputs.faq.content); } catch (e) {}
  }
  if (activeTab === 'tableOfContents' && notebook.generatedOutputs?.tableOfContents?.content) {
    try { tocData = JSON.parse(notebook.generatedOutputs.tableOfContents.content); } catch (e) {}
  }

  // Parse podcast scripts for role lines
  const parseDeepDiveScript = (scriptText) => {
    if (!scriptText) return [];
    
    const lines = scriptText.split('\n');
    const dialogs = [];
    let currentHost = null;
    let currentText = '';

    const pushDialog = () => {
      if (currentHost && currentText) {
        dialogs.push({ host: currentHost, text: currentText.trim() });
      }
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('**Minh:**') || trimmed.startsWith('Minh:')) {
        pushDialog();
        currentHost = 'Minh';
        currentText = trimmed.replace(/^\*\*Minh:\*\*\s*|^\*Minh:\*\s*|^Minh:\s*/, '');
      } else if (trimmed.startsWith('**Lan:**') || trimmed.startsWith('Lan:')) {
        pushDialog();
        currentHost = 'Lan';
        currentText = trimmed.replace(/^\*\*Lan:\*\*\s*|^\*Lan:\*\s*|^Lan:\s*/, '');
      } else if (trimmed.startsWith('**[MỞ ĐẦU]**') || trimmed.startsWith('**[KẾT LUẬN]**') || trimmed.startsWith('**[PHẦN') || trimmed.startsWith('---')) {
        pushDialog();
        currentHost = 'System';
        currentText = trimmed;
      } else if (currentHost) {
        currentText += '\n' + trimmed;
      }
    });
    pushDialog();

    return dialogs;
  };

  const scriptDialogs = activeTab === 'deepDiveScript' && notebook.generatedOutputs?.deepDiveScript?.content
    ? parseDeepDiveScript(notebook.generatedOutputs.deepDiveScript.content)
    : [];

  return (
    <div className="notebook-workspace fade-in">
      {/* Top Title Bar */}
      <div className="notebook-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/notebooks')} style={{ padding: 6 }}>
            <HiOutlineArrowLeft style={{ fontSize: 18 }} />
          </button>
          <div>
            <h1 className="notebook-title">{notebook.title}</h1>
            <span className="notebook-subtitle">{notebook.description || 'Sổ tay hỗ trợ nghiên cứu đa nguồn'}</span>
          </div>
        </div>
      </div>

      {/* Main 3-Panel Content */}
      <div className="notebook-panels">
        
        {/* ================= LEFT PANEL: SOURCES & NOTES ================= */}
        <div className="notebook-panel notebook-panel-left">
          <div className="panel-header">
            <h3>Tài liệu nguồn ({notebook.documents?.length || 0})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddDocOpen(true)} style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 8px' }}>
              <HiOutlinePlus /> Thêm
            </button>
          </div>

          {notebook.documents?.length === 0 ? (
            <div className="empty-source-state">
              <p>Chưa có tài liệu nào trong sổ tay này.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddDocOpen(true)}>Thêm ngay</button>
            </div>
          ) : (
            <div className="source-list">
              {notebook.documents.map((doc) => (
                <div className="source-item" key={doc._id}>
                  <div className="source-item-info">
                    <span className="source-item-icon"><HiOutlineDocumentText /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="source-item-title" title={doc.title}>{doc.title}</div>
                      <span className="source-item-meta">{doc.pageCount} trang • {(doc.fileSize / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                  <button className="source-item-delete" onClick={() => handleRemoveDoc(doc._id)} title="Gỡ khỏi sổ tay">
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* User Notes Section */}
          <div className="panel-header" style={{ marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
            <h3>Ghi chú cá nhân ({notebook.notes?.length || 0})</h3>
          </div>

          <form onSubmit={handleAddNote} className="note-input-form" style={{ marginBottom: 12 }}>
            <textarea 
              className="input note-textarea" 
              placeholder="Viết ghi chú nhanh hoặc lưu lại kết quả..." 
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={2}
              style={{ fontSize: 13, resize: 'none', width: '100%', marginBottom: 6, borderRadius: 8, padding: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={addingNote || !noteContent.trim()}>Lưu</button>
            </div>
          </form>

          <div className="notes-list">
            {notebook.notes?.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>Chưa có ghi chú nào</p>
            ) : (
              [...notebook.notes].reverse().map((note) => (
                <div className="note-card" key={note._id}>
                  <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{note.content}</div>
                  <div className="note-card-footer">
                    <span>{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                    <button className="note-delete-btn" onClick={() => handleDeleteNote(note._id)}><HiOutlineTrash /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= CENTER PANEL: STUDY GUIDE & ARTIFACTS ================= */}
        <div className="notebook-panel notebook-panel-center">
          {/* Artifacts Tabs Navigation */}
          <div className="artifact-tabs">
            <button className={`artifact-tab ${activeTab === 'briefingDoc' ? 'active' : ''}`} onClick={() => setActiveTab('briefingDoc')}>Briefing Doc</button>
            <button className={`artifact-tab ${activeTab === 'studyGuide' ? 'active' : ''}`} onClick={() => setActiveTab('studyGuide')}>Hướng dẫn học</button>
            <button className={`artifact-tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Dòng thời gian</button>
            <button className={`artifact-tab ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>FAQ</button>
            <button className={`artifact-tab ${activeTab === 'deepDiveScript' ? 'active' : ''}`} onClick={() => setActiveTab('deepDiveScript')}>Podcast Script</button>
            <button className={`artifact-tab ${activeTab === 'tableOfContents' ? 'active' : ''}`} onClick={() => setActiveTab('tableOfContents')}>Mục lục AI</button>
          </div>

          <div className="artifact-body">
            {generatingArtifact[activeTab] ? (
              <div className="artifact-loading">
                <div className="spinner" style={{ marginBottom: 12 }} />
                <h3>AI đang tổng hợp và phân tích...</h3>
                <p>Quá trình này có thể mất 1-2 phút cho tài liệu dài.</p>
              </div>
            ) : notebook.generatedOutputs?.[activeTab]?.content ? (
              
              /* Render Loaded Artifacts */
              <div className="artifact-content">
                <div className="artifact-meta-bar">
                  <span>✨ Tạo bởi AI vào {new Date(notebook.generatedOutputs[activeTab].generatedAt).toLocaleString('vi-VN')}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleGenerateArtifact(activeTab)} style={{ color: 'var(--primary-color)' }}>
                    Tạo lại
                  </button>
                </div>

                {/* BRIEFING DOC & STUDY GUIDE: MARKDOWN */}
                {(activeTab === 'briefingDoc' || activeTab === 'studyGuide') && (
                  <div className="markdown-body">
                    <ReactMarkdown>{notebook.generatedOutputs[activeTab].content}</ReactMarkdown>
                  </div>
                )}

                {/* TIMELINE VIEW */}
                {activeTab === 'timeline' && timelineData && (
                  <div className="timeline-container">
                    <h2 className="timeline-title">{timelineData.title}</h2>
                    <p className="timeline-desc">{timelineData.description}</p>
                    
                    <div className="timeline-flow">
                      {timelineData.events?.map((ev, index) => (
                        <div className="timeline-event" key={index}>
                          <div className="timeline-badge-date">{ev.date}</div>
                          <div className="timeline-event-card">
                            <h4 className="timeline-event-title">{ev.title}</h4>
                            <p className="timeline-event-desc">{ev.description}</p>
                            <div className="timeline-event-footer">
                              <span className={`importance-badge ${ev.importance}`}>{ev.importance}</span>
                              <span className="timeline-event-source">📍 {ev.source}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ VIEW */}
                {activeTab === 'faq' && faqData && (
                  <div className="faq-container">
                    <h2>Danh sách Câu hỏi Thường gặp</h2>
                    <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {faqData.map((item, index) => (
                        <details className="faq-item-card" key={index} style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, background: 'var(--bg-card)' }}>
                          <summary style={{ fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-primary)' }}>{index + 1}. {item.question}</span>
                            <span className="badge badge-secondary" style={{ textTransform: 'capitalize', fontSize: 11 }}>{item.difficulty}</span>
                          </summary>
                          <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12, color: 'var(--text-secondary)', fontSize: 14, lineHeight: '1.6' }}>
                            <p>{item.answer}</p>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {item.sources?.map((s, si) => (
                                <span key={si} style={{ background: 'var(--bg-tertiary)', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>📖 {s}</span>
                              ))}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* PODCAST SCRIPT VIEW */}
                {activeTab === 'deepDiveScript' && (
                  <div className="podcast-script-container">
                    <h2>Podcast Script: Thảo luận Đối thoại Chi tiết</h2>
                    <div className="podcast-chat-flow">
                      {scriptDialogs.map((dialog, index) => {
                        if (dialog.host === 'System') {
                          return (
                            <div key={index} className="podcast-system-divider">
                              <span>{dialog.text}</span>
                            </div>
                          );
                        }
                        
                        const isMinh = dialog.host === 'Minh';
                        return (
                          <div key={index} className={`podcast-bubble-row ${isMinh ? 'host-minh' : 'host-lan'}`}>
                            <div className="podcast-avatar">
                              {isMinh ? '👨‍🏫' : '👩‍🎓'}
                            </div>
                            <div className="podcast-bubble">
                              <div className="podcast-speaker-name">{isMinh ? 'Minh (Chuyên gia)' : 'Lan (Host)'}</div>
                              <p className="podcast-text">{dialog.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TABLE OF CONTENTS VIEW */}
                {activeTab === 'tableOfContents' && tocData && (
                  <div className="toc-container">
                    <h2>{tocData.title}</h2>
                    <div className="toc-tree">
                      {tocData.sections?.map((sec, idx) => (
                        <div key={idx} className="toc-section" style={{ marginBottom: 20 }}>
                          <h3 style={{ fontSize: 16, color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                            {idx + 1}. {sec.title}
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 12px' }}>{sec.description}</p>
                          
                          <div className="toc-subsections" style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {sec.subsections?.map((sub, sidx) => (
                              <div key={sidx} className="toc-subsection-card" style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 600 }}>{idx + 1}.{sidx + 1} {sub.title}</h4>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0' }}>{sub.description}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11 }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>Nguồn: {sub.sources?.join(', ')}</span>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {sub.keyTerms?.map((term, ti) => (
                                      <span key={ti} style={{ background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 4 }}>{term}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            ) : (
              /* Not yet generated state */
              <div className="artifact-empty">
                <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
                <h3>Chưa có nội dung tổng hợp</h3>
                <p style={{ marginBottom: 16 }}>Nhấn nút dưới để AI phân tích và biên soạn nội dung cho phần này.</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleGenerateArtifact(activeTab)}
                  disabled={!notebook.documents || notebook.documents.length === 0}
                >
                  🚀 Tạo ngay
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: CHAT AI ================= */}
        <div className="notebook-panel notebook-panel-right">
          <div className="panel-header">
            <h3>Trò chuyện với Sổ tay</h3>
            {messages.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={handleStartNewChat} style={{ fontSize: 12 }}>
                Làm mới
              </button>
            )}
          </div>

          {/* Quick suggestions if chat is empty */}
          {messages.length === 0 && (
            <div className="chat-welcome-container">
              <div className="chat-welcome-icon">💬</div>
              <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-secondary)', margin: '12px 0 20px' }}>
                Hỏi bất kỳ điều gì dựa trên các tài liệu trong Sổ tay này. AI sẽ phân tích và trích xuất câu trả lời kèm nguồn tham chiếu.
              </p>
              
              <div className="chat-suggestions-grid">
                <button className="chat-suggestion-btn" onClick={() => handleSendMessage(null, 'Tóm tắt các tài liệu chính trong sổ tay này')}>
                  💡 Tóm tắt các tài liệu
                </button>
                <button className="chat-suggestion-btn" onClick={() => handleSendMessage(null, 'Có sự khác biệt hoặc mâu thuẫn nào giữa các tài liệu không?')}>
                  🔍 Tìm điểm mâu thuẫn
                </button>
                <button className="chat-suggestion-btn" onClick={() => handleSendMessage(null, 'Liệt kê các khái niệm cốt lõi nhất được đề cập')}>
                  🔑 Các khái niệm cốt lõi
                </button>
              </div>

              {/* Chat Sessions list inside Chat tab */}
              {chatSessions.length > 0 && (
                <div style={{ marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 16, width: '100%' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HiOutlineClock /> Lịch sử trò chuyện gần đây
                  </div>
                  <div className="chat-sessions-list" style={{ maxHeight: 120, overflowY: 'auto' }}>
                    {chatSessions.slice(0, 3).map((session) => (
                      <div 
                        key={session._id} 
                        className="chat-session-history-item" 
                        onClick={() => handleLoadSession(session)}
                        style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: 'var(--bg-tertiary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {session.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages Flow */}
          {messages.length > 0 && (
            <div className="chat-messages-container">
              {messages.map((msg, index) => (
                <div className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`} key={index}>
                  <div className="chat-message-bubble">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    
                    {/* Citations list for assistant messages */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="chat-citations-section">
                        <div className="citations-header">Trích dẫn tham chiếu ({msg.citations.length}):</div>
                        <div className="citations-grid">
                          {msg.citations.map((cite, ci) => (
                            <div className="citation-chip" key={ci} title={cite.chunkText}>
                              <span className="cite-doc-title">{cite.documentTitle}</span>
                              {cite.pageNumber && <span className="cite-page">Trang {cite.pageNumber}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Chat Input */}
          <form className="chat-input-row" onSubmit={(e) => handleSendMessage(e)}>
            <input 
              type="text" 
              className="input chat-input-field" 
              placeholder="Hỏi AI về các tài liệu..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sendingMessage || !notebook.documents || notebook.documents.length === 0}
            />
            <button 
              type="submit" 
              className="btn btn-primary chat-submit-btn" 
              disabled={sendingMessage || !inputMessage.trim() || !notebook.documents || notebook.documents.length === 0}
            >
              <HiOutlinePaperAirplane style={{ transform: 'rotate(-45deg)' }} />
            </button>
          </form>
        </div>

      </div>

      {/* ================= ADD DOCUMENTS MODAL ================= */}
      {isAddDocOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card modal-content" style={{ width: '100%', maxWidth: 450, padding: 24, position: 'relative' }}>
            <button className="btn btn-ghost" onClick={() => setIsAddDocOpen(false)} style={{ position: 'absolute', top: 16, right: 16, padding: 6 }}>
              <HiOutlineXMark style={{ fontSize: 18 }} />
            </button>
            
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Thêm tài liệu vào Sổ tay</h2>
            
            {availableDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Không còn tài liệu sẵn sàng nào để thêm. Hãy upload thêm tài liệu tại trang Tài Liệu trước.
                </p>
                <button className="btn btn-secondary" onClick={() => navigate('/documents')}>Đi tới trang Tài Liệu</button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Chọn tài liệu dưới đây để gộp vào sổ tay (tối đa 10 tài liệu tổng cộng):
                </p>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: 8, background: 'var(--bg-tertiary)', marginBottom: 20 }}>
                  {availableDocs.map((doc) => (
                    <label key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, cursor: 'pointer', padding: '4px 6px', borderRadius: 4 }} className="hover-bg">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocs(prev => [...prev, doc._id]);
                          } else {
                            setSelectedDocs(prev => prev.filter(id => id !== doc._id));
                          }
                        }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
                    </label>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setIsAddDocOpen(false)}>Hủy</button>
                  <button className="btn btn-primary" onClick={() => handleAddDocsToNotebook(selectedDocs)}>Xác nhận thêm</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

}
