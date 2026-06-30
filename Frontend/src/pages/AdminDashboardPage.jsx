import { useState, useEffect } from 'react';
import { HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineCpuChip, HiOutlineBell, HiOutlineCog6Tooth, HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    conversionRate: 0,
    totalDocuments: 0,
    storageUsed: 0,
    tokensUsed: 0,
    llmCost: 0,
    charts: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      uploads: [0, 0, 0, 0, 0, 0, 0],
      chats: [0, 0, 0, 0, 0, 0, 0],
      flashTokens: [0, 0, 0, 0, 0, 0, 0],
      proTokens: [0, 0, 0, 0, 0, 0, 0]
    }
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [health, setHealth] = useState({
    database: { status: 'connected', latency: '12ms' },
    geminiApi: { status: 'operational', latency: '180ms' },
    storage: { status: 'healthy', freeSpace: '1.8 TB available', percentFree: '92%' }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocsCount, setTotalDocsCount] = useState(0);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, docsRes, healthRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/recent-documents?page=${page}&status=${statusFilter}`),
        api.get('/admin/health')
      ]);

      setStats(statsRes.data);
      setRecentDocs(docsRes.data.documents);
      setTotalPages(docsRes.data.pagination.pages);
      setTotalDocsCount(docsRes.data.pagination.total);
      setHealth(healthRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu quản trị. Đang hiển thị bản xem trước.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [page, statusFilter]);

  const formatStorage = (bytes) => {
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    return `${(bytes / 1e6).toFixed(1)} MB`;
  };

  const formatTokens = (num) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}k`;
    return num;
  };

  const handleAddUserPlaceholder = () => {
    toast.success('Chức năng quản lý người dùng sẽ được thêm tại đây.');
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi hệ thống?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Đã xóa tài liệu thành công');
      fetchAdminData();
    } catch (err) {
      toast.error('Không thể xóa tài liệu');
    }
  };

  // Filter local copy by search term (in case DB search doesn't support populate search out-of-the-box easily)
  const filteredDocs = recentDocs.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (doc.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // SVG Sparkline generator from real data
  const generateSparkline = (data) => {
    if (!data || data.length === 0) return 'M 0 20 L 160 20';
    const max = Math.max(...data, 1);
    const stepX = 160 / (data.length - 1 || 1);
    return data.map((val, i) => {
      const x = Math.round(i * stepX);
      const y = Math.round(38 - (val / max) * 35);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const sparklines = stats.sparklines || { users: [], docs: [], tokens: [], premium: [] };
  const sparkline1 = generateSparkline(sparklines.users);
  const sparkline2 = generateSparkline(sparklines.docs);
  const sparkline3 = generateSparkline(sparklines.tokens);
  const sparkline4 = generateSparkline(sparklines.premium);

  // Dynamic Chart calculations
  const chartData = stats.charts || {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    uploads: [0, 0, 0, 0, 0, 0, 0],
    chats: [0, 0, 0, 0, 0, 0, 0],
    flashTokens: [0, 0, 0, 0, 0, 0, 0],
    proTokens: [0, 0, 0, 0, 0, 0, 0]
  };

  const xCoords = [50, 120, 190, 260, 330, 400, 470];
  const maxActivity = Math.max(...chartData.uploads, ...chartData.chats, 5);

  const uploadsPath = chartData.uploads.map((val, index) => {
    const x = xCoords[index];
    const y = 170 - (val / maxActivity) * 150;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const chatsPath = chartData.chats.map((val, index) => {
    const x = xCoords[index];
    const y = 170 - (val / maxActivity) * 150;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Bar Chart calculations
  const maxTokens = Math.max(...chartData.flashTokens, ...chartData.proTokens, 1000);
  const formatTokenAxis = (val) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(0)}k`;
    return val.toString();
  };
  const tokenYLabels = [
    formatTokenAxis(maxTokens),
    formatTokenAxis(maxTokens * 0.75),
    formatTokenAxis(maxTokens * 0.5),
    formatTokenAxis(maxTokens * 0.25),
    '0'
  ];

  return (
    <div className="admin-dashboard fade-in">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>Tổng quan hệ thống</h1>
          <p className="subtitle">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="admin-header-center">
          <div className="admin-search-wrapper">
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng, tài liệu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-icon-btn notification-btn" title="Thông báo">
            <HiOutlineBell />
            <span className="badge-dot"></span>
          </div>
          <div className="admin-icon-btn" title="Cài đặt">
            <HiOutlineCog6Tooth />
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleAddUserPlaceholder}>
            + Thêm người dùng
          </button>
        </div>
      </header>

      {/* Main dashboard content area */}
      <div className="admin-dashboard-container">
        
        {/* Metrics Grid */}
        <section className="admin-metrics-grid">
          {/* Card 1 */}
          <div className="admin-metric-card">
            <div className="card-header">
              <span className="card-title">Tổng người dùng</span>
              <HiOutlineUserGroup className="card-icon" />
            </div>
            <div className="card-value">{stats.totalUsers.toLocaleString()}</div>
            <div className={`card-trend ${stats.userGrowthPercent >= 0 ? 'green' : 'red'}`}>
              <span>{stats.userGrowthPercent >= 0 ? '↑' : '↓'} {stats.userGrowthPercent >= 0 ? '+' : ''}{stats.userGrowthPercent || 0}% tuần này</span>
            </div>
            <div className="card-sparkline">
              <svg viewBox="0 0 160 40" width="100%" height="40">
                <path d={sparkline1} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2 */}
          <div className="admin-metric-card">
            <div className="card-header">
              <span className="card-title">Tài liệu đã tải lên</span>
              <HiOutlineDocumentText className="card-icon" />
            </div>
            <div className="card-value">{stats.totalDocuments.toLocaleString()}</div>
            <div className="card-trend text-secondary">
              <span>Dung lượng: {formatStorage(stats.storageUsed)}</span>
            </div>
            <div className="card-sparkline">
              <svg viewBox="0 0 160 40" width="100%" height="40">
                <path d={sparkline2} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3 */}
          <div className="admin-metric-card">
            <div className="card-header">
              <span className="card-title">Token LLM đã dùng</span>
              <HiOutlineCpuChip className="card-icon" />
            </div>
            <div className="card-value">{formatTokens(stats.tokensUsed)}</div>
            <div className="card-trend text-secondary">
              <span>Chi phí: ${stats.llmCost} tháng này</span>
            </div>
            <div className="card-sparkline">
              <svg viewBox="0 0 160 40" width="100%" height="40">
                <path d={sparkline3} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4 */}
          <div className="admin-metric-card">
            <div className="card-header">
              <span className="card-title">Người dùng Premium</span>
              <PiCrownBold className="card-icon" style={{ color: '#f59e0b' }} />
            </div>
            <div className="card-value">{stats.premiumUsers.toLocaleString()}</div>
            <div className="card-trend yellow">
              <span>Tỷ lệ: {stats.conversionRate}%</span>
            </div>
            <div className="card-sparkline">
              <svg viewBox="0 0 160 40" width="100%" height="40">
                <path d={sparkline4} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="admin-charts-section">
          {/* Chart 1: Line chart (Activity) */}
          <div className="admin-chart-card">
            <div className="chart-header">
              <h3>Hoạt động hàng ngày — Tải lên & Chat AI</h3>
              <div className="chart-legend">
                <span className="legend-item"><span className="dot blue"></span>Tải lên</span>
                <span className="legend-item"><span className="dot green"></span>Chat AI</span>
              </div>
            </div>
            <div className="chart-body">
              {/* Pure SVG Line Chart */}
              <svg viewBox="0 0 500 200" className="svg-chart">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1" />

                {/* Y Axis Labels */}
                <text x="30" y="24" fontSize="9" fill="#94a3b8" textAnchor="end">{Math.round(maxActivity)}</text>
                <text x="30" y="64" fontSize="9" fill="#94a3b8" textAnchor="end">{Math.round(maxActivity * 0.75)}</text>
                <text x="30" y="104" fontSize="9" fill="#94a3b8" textAnchor="end">{Math.round(maxActivity * 0.5)}</text>
                <text x="30" y="144" fontSize="9" fill="#94a3b8" textAnchor="end">{Math.round(maxActivity * 0.25)}</text>
                <text x="30" y="174" fontSize="9" fill="#94a3b8" textAnchor="end">0</text>

                {/* X Axis Labels */}
                {chartData.labels.map((label, idx) => (
                  <text key={idx} x={xCoords[idx]} y="190" fontSize="9" fill="#94a3b8" textAnchor="middle">{label}</text>
                ))}

                {/* Blue Line: Uploads */}
                <path d={uploadsPath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                
                {/* Green Line: AI Chats */}
                <path d={chatsPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                {/* Dots on latest day points */}
                <circle cx={xCoords[6]} cy={170 - (chartData.uploads[6] / maxActivity) * 150} r="4" fill="#3b82f6" />
                <circle cx={xCoords[6]} cy={170 - (chartData.chats[6] / maxActivity) * 150} r="4" fill="#10b981" />
              </svg>
            </div>
          </div>

          {/* Chart 2: Bar chart (API Models) */}
          <div className="admin-chart-card">
            <div className="chart-header">
              <h3>Sử dụng API theo mô hình</h3>
              <div className="chart-legend">
                <span className="legend-item"><span className="dot blue"></span>Gemini 2.5 Flash</span>
                <span className="legend-item"><span className="dot navy"></span>Gemini 2.5 Pro</span>
              </div>
            </div>
            <div className="chart-body">
              {/* Pure CSS Bar Chart */}
              <div className="bar-chart-container">
                <div className="chart-axis-y">
                  {tokenYLabels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>
                <div className="bars-wrapper">
                  {chartData.labels.map((label, idx) => {
                    const flashVal = chartData.flashTokens[idx] || 0;
                    const proVal = chartData.proTokens[idx] || 0;
                    const flashHeight = `${Math.max((flashVal / maxTokens) * 100, 2)}%`;
                    const proHeight = `${Math.max((proVal / maxTokens) * 100, 2)}%`;
                    return (
                      <div className="bar-group" key={idx}>
                        <div className="bars">
                          <div 
                            className="bar flash" 
                            style={{ height: flashHeight }} 
                            title={`Flash: ${formatTokenAxis(flashVal)}`}
                          ></div>
                          <div 
                            className="bar pro" 
                            style={{ height: proHeight }} 
                            title={`Pro: ${formatTokenAxis(proVal)}`}
                          ></div>
                        </div>
                        <span className="bar-label">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="admin-table-section">
          <div className="table-header">
            <h3>Xử lý tài liệu gần đây</h3>
            <div className="table-actions">
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="table-filter-select"
              >
                <option value="All">Trạng thái: Tất cả</option>
                <option value="Ready">Trạng thái: Sẵn sàng</option>
                <option value="Processing">Trạng thái: Đang xử lý</option>
                <option value="Error">Trạng thái: Lỗi</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Tên tài liệu</th>
                  <th>Người tải lên</th>
                  <th>Kích thước</th>
                  <th>Mô hình AI</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                       Không tìm thấy tài liệu phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc._id}>
                      <td className="doc-name-cell">
                        <span className="doc-icon">📄</span>
                        <span className="doc-title" title={doc.title}>{doc.title}</span>
                      </td>
                      <td>{doc.userId?.name || 'Không xác định'}</td>
                      <td>{formatStorage(doc.fileSize)}</td>
                      <td><span className="badge badge-info">Gemini 2.5 Flash</span></td>
                      <td>
                        <span className={`badge ${
                          doc.status === 'ready' ? 'badge-success' : 
                          doc.status === 'processing' ? 'badge-warning' : 
                          'badge-danger'
                        }`}>
                          {doc.status === 'ready' ? 'Hoàn thành' : 
                           doc.status === 'processing' ? 'Đang xử lý' : 
                           'Thất bại'}
                        </span>
                      </td>
                      <td>{new Date(doc.createdAt).toLocaleDateString('vi-VN')} {new Date(doc.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="actions-cell">
                        <button className="action-btn view" title="Xem chi tiết tài liệu">
                          <HiOutlineEye />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteDoc(doc._id)} title="Xóa tài liệu">
                          <HiOutlineTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          <div className="table-footer">
            <span className="results-count">Trang {page} / {totalPages} ({totalDocsCount} tài liệu)</span>
            <div className="pagination-buttons">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="pagination-btn"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              ))}
              <button 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                disabled={page === totalPages}
                className="pagination-btn"
              >
                &gt;
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* System Health Footer Strip */}
      <footer className="admin-health-footer">
        <div className="health-status-items">
          <div className="health-item">
            <span className={`health-dot ${health.database.status === 'connected' ? 'green' : 'red'}`}></span>
            Cơ sở dữ liệu: {health.database.status === 'connected' ? `Đã kết nối (${health.database.latency})` : 'Mất kết nối'}
          </div>
          <div className="health-item">
            <span className={`health-dot ${health.geminiApi.status === 'operational' ? 'green' : 'red'}`}></span>
            Gemini API: {health.geminiApi.status === 'operational' ? `Hoạt động (${health.geminiApi.latency})` : 'Lỗi API'}
          </div>
          <div className="health-item">
            <span className="health-dot blue"></span>
            Lưu trữ: {health.storage.percentFree} còn trống ({health.storage.freeSpace})
          </div>
        </div>
        <div className="health-last-check">
          Kiểm tra lần cuối: vừa xong
        </div>
      </footer>
    </div>
  );
}
