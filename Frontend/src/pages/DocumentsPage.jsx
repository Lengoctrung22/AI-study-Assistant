import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { HiOutlineDocumentText, HiOutlineCloudArrowUp, HiOutlineTrash } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const loadDocs = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      return toast.error('Chỉ hỗ trợ file PDF hoặc Word (.docx, .doc)');
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Upload thành công! Đang xử lý...');
      loadDocs();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload thất bại'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Xóa tài liệu này?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Đã xóa');
      setDocuments((d) => d.filter((doc) => doc._id !== id));
    } catch (err) { toast.error('Xóa thất bại'); }
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Tài liệu</h1>
        <p>Upload và quản lý tài liệu PDF hoặc Word của bạn</p>
      </div>

      <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" hidden onChange={(e) => handleUpload(e.target.files[0])} />
        <div className="upload-zone-icon"><HiOutlineCloudArrowUp /></div>
        <h3>{uploading ? 'Đang upload...' : 'Kéo thả PDF hoặc Word vào đây'}</h3>
        <p>hoặc click để chọn file (tối đa 10MB)</p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 16px' }}>Tất cả tài liệu ({documents.length})</h2>

      {documents.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>Chưa có tài liệu nào</h3>
          <p>Upload file PDF hoặc Word để bắt đầu</p>
        </div>
      ) : (
        <div className="doc-grid">
          {documents.map((doc) => (
            <div className="card doc-card" key={doc._id} onClick={() => navigate(`/documents/${doc._id}`)}>
              <div className="doc-card-header">
                <div className="doc-card-icon"><HiOutlineDocumentText /></div>
                <div>
                  <div className="doc-card-title">{doc.title}</div>
                  <div className="doc-card-meta">
                    {doc.pageCount} trang • {(doc.fileSize / 1024).toFixed(0)} KB • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
              {doc.summary && <div className="doc-card-summary">{doc.summary}</div>}
              <div className="doc-card-footer">
                <span className={`badge ${doc.status === 'ready' ? 'badge-success' : doc.status === 'processing' ? 'badge-warning' : 'badge-danger'}`}>
                  {doc.status === 'ready' ? 'Sẵn sàng' : doc.status === 'processing' ? 'Đang xử lý...' : 'Lỗi'}
                </span>
                <div className="doc-card-actions">
                  <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, doc._id)}><HiOutlineTrash /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
