import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { PiGraduationCapBold } from 'react-icons/pi';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const initDocId = searchParams.get('documentId');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(initDocId || '');
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/documents').then((r) => {
      const docs = (r.data.documents || []).filter((d) => d.status === 'ready');
      setDocuments(docs);
      if (initDocId) setSelectedDoc(initDocId);
      else if (docs.length > 0 && !selectedDoc) setSelectedDoc(docs[0]._id);
    });
  }, []);

  useEffect(() => {
    if (selectedDoc) {
      api.get(`/chat/sessions?documentId=${selectedDoc}`).then((r) => setSessions(r.data.sessions || []));
      setCurrentSession(null);
      setMessages([]);
    }
  }, [selectedDoc]);

  const loadSession = async (sessionId) => {
    const res = await api.get(`/chat/sessions/${sessionId}`);
    setCurrentSession(sessionId);
    setMessages(res.data.session.messages || []);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedDoc || sending) return;
    const msg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setSending(true);
    try {
      const res = await api.post(`/chat/${selectedDoc}/send`, { message: msg, sessionId: currentSession });
      setCurrentSession(res.data.sessionId);
      setMessages((m) => [...m, { role: 'assistant', content: res.data.answer, citations: res.data.citations }]);
      if (!currentSession) {
        api.get(`/chat/sessions?documentId=${selectedDoc}`).then((r) => setSessions(r.data.sessions || []));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi tin nhắn thất bại');
      setMessages((m) => m.slice(0, -1));
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <select className="input" value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)} style={{ width: '100%' }}>
            <option value="">Chọn tài liệu...</option>
            {documents.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => { setCurrentSession(null); setMessages([]); }}>
            + Cuộc trò chuyện mới
          </button>
        </div>
        <div className="chat-session-list">
          {sessions.map((s) => (
            <div key={s._id} className={`chat-session-item ${currentSession === s._id ? 'active' : ''}`} onClick={() => loadSession(s._id)}>
              <div className="chat-session-title">{s.title}</div>
              <div className="chat-session-time">{new Date(s.updatedAt).toLocaleDateString('vi-VN')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">💬</div>
              <h3>Chat với tài liệu</h3>
              <p>Đặt câu hỏi về nội dung tài liệu, AI sẽ trả lời dựa trên nội dung PDF</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-msg-avatar">
                {msg.role === 'assistant' ? <PiGraduationCapBold /> : '👤'}
              </div>
              <div className="chat-msg-content">
                {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
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

        <div className="chat-input-bar">
          <div className="chat-input-wrapper">
            <textarea className="chat-input" placeholder={selectedDoc ? 'Hỏi về nội dung tài liệu...' : 'Vui lòng chọn tài liệu trước'}
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown} disabled={!selectedDoc || sending} rows={1} />
            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || !selectedDoc || sending}>
              <HiOutlinePaperAirplane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
