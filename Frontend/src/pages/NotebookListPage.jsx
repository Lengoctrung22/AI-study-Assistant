import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { HiOutlineBookOpen, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function NotebookListPage() {
  const [notebooks, setNotebooks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [nbRes, docRes] = await Promise.all([
        api.get('/notebooks'),
        api.get('/documents')
      ]);
      setNotebooks(nbRes.data.notebooks || []);
      // Only allow adding ready documents
      setDocuments((docRes.data.documents || []).filter(d => d.status === 'ready'));
    } catch (err) {
      console.error('Error fetching notebooks data:', err);
      toast.error('Không thể tải danh sách sổ tay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedNotebookId(null);
    setTitle('');
    setDescription('');
    setSelectedDocs([]);
    setIsModalOpen(true);
  };

  const openEditModal = (notebook) => {
    setIsEditMode(true);
    setSelectedNotebookId(notebook._id);
    setTitle(notebook.title);
    setDescription(notebook.description);
    setSelectedDocs(notebook.documents.map(d => d._id));
    setIsModalOpen(true);
  };

  const handleDocCheckboxChange = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return toast.error('Vui lòng nhập tiêu đề sổ tay');
    }

    try {
      if (isEditMode) {
        const res = await api.put(`/notebooks/${selectedNotebookId}`, {
          title,
          description,
          documentIds: selectedDocs
        });
        setNotebooks(prev => prev.map(nb => nb._id === selectedNotebookId ? res.data.notebooks || res.data.notebook : nb));
        toast.success('Đã cập nhật sổ tay');
      } else {
        const res = await api.post('/notebooks', {
          title,
          description,
          documentIds: selectedDocs
        });
        setNotebooks(prev => [res.data.notebook, ...prev]);
        toast.success('Đã tạo sổ tay mới');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa sổ tay này? Toàn bộ lịch sử chat liên quan cũng sẽ bị xóa.')) return;
    try {
      await api.delete(`/notebooks/${id}`);
      toast.success('Đã xóa sổ tay');
      setNotebooks(prev => prev.filter(nb => nb._id !== id));
    } catch (err) {
      toast.error('Xóa sổ tay thất bại');
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Sổ tay nghiên cứu</h1>
          <p>Tạo các không gian học tập (Notebook) kết hợp nhiều tài liệu để nghiên cứu sâu rộng</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiOutlinePlus style={{ strokeWidth: 2 }} /> Tạo Sổ tay mới
        </button>
      </div>

      {notebooks.length === 0 ? (
        <div className="card empty-state" style={{ padding: 48, textAlign: 'center', marginTop: 24 }}>
          <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 16 }}>📓</div>
          <h3>Chưa có Sổ tay nghiên cứu nào</h3>
          <p>Tạo sổ tay mới và thêm các tài liệu học tập của bạn vào để bắt đầu phân tích đa nguồn</p>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: 16 }}>Tạo Sổ tay đầu tiên</button>
        </div>
      ) : (
        <div className="doc-grid" style={{ marginTop: 24 }}>
          {notebooks.map((nb) => (
            <div 
              className="card doc-card" 
              key={nb._id} 
              onClick={() => navigate(`/notebooks/${nb._id}`)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s', height: '100%', position: 'relative' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="doc-card-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                    <HiOutlineBookOpen style={{ fontSize: 24 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={(e) => { e.stopPropagation(); openEditModal(nb); }}
                      style={{ padding: 4, minWidth: 28, height: 28 }}
                    >
                      <HiOutlinePencil />
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={(e) => handleDelete(e, nb._id)}
                      style={{ padding: 4, minWidth: 28, height: 28, color: 'var(--danger-color)' }}
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'var(--text-primary)' }}>{nb.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 38, marginBottom: 12 }}>
                  {nb.description || 'Không có mô tả cho sổ tay này.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>{nb.documents?.length || 0} tài liệu nguồn</span>
                <span>Cập nhật: {new Date(nb.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card modal-content" style={{ width: '100%', maxWidth: 500, padding: 24, position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, padding: 6 }}
            >
              <HiOutlineXMark style={{ fontSize: 18 }} />
            </button>
            
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{isEditMode ? 'Chỉnh sửa Sổ tay' : 'Tạo Sổ tay nghiên cứu mới'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Tiêu đề sổ tay <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ví dụ: Nghiên cứu Hệ quản trị Cơ sở Dữ liệu"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Mô tả ngắn</label>
                <textarea 
                  className="input" 
                  placeholder="Mô tả về mục tiêu hoặc tài liệu trong sổ tay này..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={2}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Chọn tài liệu liên quan (Tối đa 10)</label>
                {documents.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    Chưa có tài liệu sẵn sàng. Hãy upload tài liệu PDF/Word ở trang Tài Liệu trước.
                  </div>
                ) : (
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: 8, background: 'var(--bg-tertiary)' }}>
                    {documents.map((doc) => (
                      <label key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6, cursor: 'pointer', padding: '4px 6px', borderRadius: 4, transition: 'background 0.2s' }} className="hover-bg">
                        <input 
                          type="checkbox" 
                          checked={selectedDocs.includes(doc._id)} 
                          onChange={() => handleDocCheckboxChange(doc._id)}
                          disabled={!selectedDocs.includes(doc._id) && selectedDocs.length >= 10}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{isEditMode ? 'Lưu thay đổi' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
