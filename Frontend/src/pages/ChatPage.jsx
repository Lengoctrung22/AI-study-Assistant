import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import { 
  HiOutlinePaperAirplane, 
  HiOutlineMicrophone, 
  HiOutlineMagnifyingGlass, 
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineFolderOpen,
  HiOutlineUser
} from 'react-icons/hi2';
import { PiGraduationCapBold, PiCrownBold } from 'react-icons/pi';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user, updateUser } = useAuth();
  const isPremium = user?.plan === 'premium';

  const [searchParams] = useSearchParams();
  const initDocId = searchParams.get('documentId');
  const [documents, setDocuments] = useState([]);
  
  // Single doc mode selection
  const [selectedDoc, setSelectedDoc] = useState(initDocId || '');
  
  // Multi doc mode selection (premium)
  const [multiDocMode, setMultiDocMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);

  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Search Chat History (premium)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Suggested follow-up questions
  const [suggestions, setSuggestions] = useState([]);

  // Voice recognition (premium)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Load user persona
  const [persona, setPersona] = useState(user?.tutorPersona || 'friendly');

  // Fetch documents
  useEffect(() => {
    api.get('/documents').then((r) => {
      const docs = (r.data.documents || []).filter((d) => d.status === 'ready');
      setDocuments(docs);
      if (initDocId) {
        setSelectedDoc(initDocId);
      } else if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]._id);
      }
    });
  }, []);

  // Fetch sessions for selected single doc
  useEffect(() => {
    if (selectedDoc && !multiDocMode) {
      api.get(`/chat/sessions?documentId=${selectedDoc}`).then((r) => setSessions(r.data.sessions || []));
      setCurrentSession(null);
      setMessages([]);
      setSuggestions([]);
    }
  }, [selectedDoc, multiDocMode]);

  // Handle history search
  useEffect(() => {
    if (!isPremium) return;
    if (searchQuery.trim().length >= 2) {
      api.get(`/chat/search?q=${searchQuery}`)
        .then(r => setSearchResults(r.data.results || []))
        .catch(console.error);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, isPremium]);

  const loadSession = async (sessionId) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      setCurrentSession(sessionId);
      setMessages(res.data.session.messages || []);
      setSuggestions([]);
      // Select the document from session
      if (res.data.session.documentId?._id) {
        setSelectedDoc(res.data.session.documentId._id);
        setMultiDocMode(false);
      }
    } catch (err) {
      toast.error('Không thể tải lịch sử trò chuyện');
    }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (overrideMessage = null) => {
    const msg = (overrideMessage || input).trim();
    if (!msg || sending) return;
    
    if (!multiDocMode && !selectedDoc) {
      toast.error('Vui lòng chọn tài liệu trước');
      return;
    }
    if (multiDocMode && selectedDocs.length < 2) {
      toast.error('Vui lòng chọn ít nhất 2 tài liệu');
      return;
    }

    if (!overrideMessage) setInput('');
    setSuggestions([]);
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setSending(true);

    try {
      if (multiDocMode) {
        // Multi-doc Chat (premium)
        const res = await api.post('/chat/multi-doc', { message: msg, documentIds: selectedDocs });
        setMessages((m) => [...m, { role: 'assistant', content: res.data.answer, citations: res.data.citations }]);
        setSuggestions(res.data.suggestedQuestions || []);
      } else {
        // Single-doc Chat
        const res = await api.post(`/chat/${selectedDoc}/send`, { message: msg, sessionId: currentSession });
        setCurrentSession(res.data.sessionId);
        setMessages((m) => [...m, { role: 'assistant', content: res.data.answer, citations: res.data.citations }]);
        setSuggestions(res.data.suggestedQuestions || []);
        
        // Refresh sessions list if it is a new session
        if (!currentSession) {
          api.get(`/chat/sessions?documentId=${selectedDoc}`).then((r) => setSessions(r.data.sessions || []));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi tin nhắn thất bại');
      setMessages((m) => m.slice(0, -1));
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // Update AI Persona (premium)
  const handlePersonaChange = async (newPersona) => {
    if (!isPremium) {
      toast.error('Tính năng này yêu cầu gói Premium');
      return;
    }
    try {
      await api.put('/chat/persona', { persona: newPersona });
      setPersona(newPersona);
      updateUser({ tutorPersona: newPersona });
      toast.success('Đã thay đổi phong cách gia sư AI');
    } catch (err) {
      toast.error('Không thể cập nhật persona');
    }
  };

  // Toggle multi-doc mode
  const handleToggleMultiDoc = () => {
    if (!isPremium) {
      toast.error('Trò chuyện đa tài liệu yêu cầu gói Premium');
      return;
    }
    setMultiDocMode(!multiDocMode);
    setCurrentSession(null);
    setMessages([]);
    setSuggestions([]);
  };

  const handleDocCheckboxChange = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // Web Speech API Voice Input (premium)
  const startVoiceInput = () => {
    if (!isPremium) {
      toast.error('Nhận dạng giọng nói yêu cầu gói Premium');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'vi-VN';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
      toast.success('Đang ghi âm giọng nói...');
    };

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + text);
    };

    rec.onerror = (e) => {
      console.error(e);
      toast.error('Lỗi nhận diện giọng nói');
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  return (
    <div className="chat-layout">
      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          {/* Mode Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Chế độ chat</span>
            <button 
              className={`btn btn-sm ${multiDocMode ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleToggleMultiDoc}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
            >
              <HiOutlineFolderOpen /> Nhiều tài liệu {!isPremium && '🔒'}
            </button>
          </div>

          {/* Document Selector */}
          {!multiDocMode ? (
            <select className="input" value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)} style={{ width: '100%' }}>
              <option value="">Chọn tài liệu...</option>
              {documents.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}
            </select>
          ) : (
            <div className="card" style={{ padding: 10, background: 'var(--bg-tertiary)', maxHeight: 150, overflowY: 'auto' }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Chọn tài liệu học tập (chọn từ 2):</div>
              {documents.map((d) => (
                <label key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDocs.includes(d._id)} onChange={() => handleDocCheckboxChange(d._id)} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                </label>
              ))}
            </div>
          )}

          {/* New Chat Button */}
          {!multiDocMode && (
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => { setCurrentSession(null); setMessages([]); setSuggestions([]); }}>
              <HiOutlinePlus /> Cuộc trò chuyện mới
            </button>
          )}
        </div>

        {/* Chat History Search */}
        <div className="chat-search-wrapper" style={{ padding: '0 16px 8px 16px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="input btn-sm" 
              placeholder={isPremium ? "Tìm lịch sử chat..." : "Tìm lịch sử chat (Premium 🔒)"}
              value={searchQuery}
              onChange={(e) => isPremium ? setSearchQuery(e.target.value) : toast.error('Tìm kiếm tin nhắn yêu cầu gói Premium')}
              style={{ width: '100%', paddingLeft: 32, fontSize: 13 }}
              disabled={!isPremium}
            />
            <HiOutlineMagnifyingGlass style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>
        </div>

        {/* Sessions list */}
        <div className="chat-session-list">
          {searchQuery.trim().length >= 2 ? (
            searchResults.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>Không tìm thấy kết quả</div>
            ) : (
              searchResults.map((r) => (
                <div key={r.sessionId} className={`chat-session-item ${currentSession === r.sessionId ? 'active' : ''}`} onClick={() => loadSession(r.sessionId)}>
                  <div className="chat-session-title" style={{ fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0' }}>Tài liệu: {r.documentTitle || 'Nhiều tài liệu'}</div>
                  {r.matchingMessages?.map((m, idx) => (
                    <div key={idx} style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.8, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      • {m.content}
                    </div>
                  ))}
                </div>
              ))
            )
          ) : (
            !multiDocMode && sessions.map((s) => (
              <div key={s._id} className={`chat-session-item ${currentSession === s._id ? 'active' : ''}`} onClick={() => loadSession(s._id)}>
                <div className="chat-session-title">{s.title}</div>
                <div className="chat-session-time">{new Date(s.updatedAt).toLocaleDateString('vi-VN')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Main Area */}
      <div className="chat-main">
        {/* Chat Header with Persona Selector */}
        <div className="chat-header" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PiGraduationCapBold style={{ fontSize: 24, color: 'var(--primary-color)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Gia sư học tập AI</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {multiDocMode 
                  ? `Đang chat với ${selectedDocs.length} tài liệu` 
                  : (selectedDoc ? `Đang chat với: ${documents.find(d => d._id === selectedDoc)?.title || 'Tài liệu'}` : 'Chưa chọn tài liệu')
                }
              </div>
            </div>
          </div>

          {/* Persona selector (Premium) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiOutlineUser /> Phong cách:
            </span>
            <select 
              value={persona} 
              onChange={(e) => handlePersonaChange(e.target.value)} 
              className="input btn-sm"
              style={{ fontSize: 13, padding: '4px 8px', width: 'auto', minWidth: 120, height: 32 }}
            >
              <option value="friendly">Thân thiện {!isPremium && '🔒'}</option>
              <option value="strict">Nghiêm khắc {!isPremium && '🔒'}</option>
              <option value="socratic">Gợi mở Socratic {!isPremium && '🔒'}</option>
              <option value="encouraging">Khích lệ {!isPremium && '🔒'}</option>
              <option value="concise">Ngắn gọn {!isPremium && '🔒'}</option>
            </select>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">💬</div>
              <h3>Trò chuyện học tập</h3>
              <p>Hỏi đáp chi tiết về tài liệu học tập của bạn. Đặt câu hỏi và gia sư AI sẽ hỗ trợ bạn.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-msg-avatar">
                {msg.role === 'assistant' ? <PiGraduationCapBold /> : '👤'}
              </div>
              <div className="chat-msg-content">
                {msg.role === 'assistant' ? (
                  <div>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.citations?.length > 0 && (
                      <div className="citations-box" style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>Nguồn trích dẫn:</div>
                        {msg.citations.map((c, idx) => (
                          <div key={idx} style={{ marginBottom: 2 }}>
                            [{idx + 1}] {c.documentTitle ? `Tài liệu: ${c.documentTitle}` : ''} {c.pageNumber ? `Trang ${c.pageNumber}` : ''} • <span style={{ opacity: 0.8 }}>{c.chunkText}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="chat-message assistant">
              <div className="chat-msg-avatar"><PiGraduationCapBold /></div>
              <div className="chat-msg-content"><div className="spinner" style={{ width: 20, height: 20 }} /></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Follow-ups & Input Bar */}
        <div className="chat-input-bar">
          {/* AI suggested follow-up chips */}
          {suggestions.length > 0 && (
            <div className="suggestions-container" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, padding: '0 8px' }}>
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => handleSend(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', fontSize: 12, textTransform: 'none' }}
                >
                  <HiOutlineSparkles style={{ color: 'var(--accent-color)' }} /> {s}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-wrapper">
            {/* Voice Input Button */}
            <button 
              className={`btn btn-ghost chat-voice-btn ${isListening ? 'listening-pulse' : ''}`}
              onClick={startVoiceInput}
              style={{ fontSize: 20, padding: 8, color: isListening ? '#ef4444' : 'var(--text-secondary)' }}
              title="Nhập giọng nói (Premium)"
            >
              <HiOutlineMicrophone />
            </button>

            <textarea 
              className="chat-input" 
              placeholder={multiDocMode ? "Nhập câu hỏi thảo luận đa tài liệu..." : (selectedDoc ? 'Hỏi về nội dung tài liệu...' : 'Vui lòng chọn tài liệu trước')}
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown} 
              disabled={(!multiDocMode && !selectedDoc) || sending} 
              rows={1} 
            />
            
            <button className="chat-send-btn" onClick={() => handleSend()} disabled={!input.trim() || sending}>
              <HiOutlinePaperAirplane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
