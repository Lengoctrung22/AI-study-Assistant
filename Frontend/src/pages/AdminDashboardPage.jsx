import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  HiOutlineUserGroup, 
  HiOutlineDocumentText, 
  HiOutlineCpuChip, 
  HiOutlineMagnifyingGlass, 
  HiOutlineEye, 
  HiOutlineTrash, 
  HiOutlineCreditCard, 
  HiOutlineClipboardDocumentList, 
  HiOutlineLockClosed, 
  HiOutlineKey 
} from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const location = useLocation();
  
  // Determine active view based on URL path
  let activeTab = 'overview';
  if (location.pathname === '/admin/users') {
    activeTab = 'users';
  } else if (location.pathname === '/admin/documents') {
    activeTab = 'documents';
  } else if (location.pathname === '/admin/api-settings') {
    activeTab = 'api-settings';
  } else if (location.pathname === '/admin/billing') {
    activeTab = 'billing';
  } else if (location.pathname === '/admin/packages') {
    activeTab = 'packages';
  } else if (location.pathname === '/admin/logs') {
    activeTab = 'logs';
  }

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    conversionRate: 0,
    totalDocuments: 0,
    storageUsed: 0,
    tokensUsed: 0,
    llmCost: 0,
    userGrowthPercent: 0,
    sparklines: {
      users: [],
      docs: [],
      tokens: [],
      premium: []
    },
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
    database: { status: 'connected', latency: 'N/A' },
    geminiApi: { status: 'operational', latency: 'N/A' },
    storage: { status: 'healthy', freeSpace: 'N/A', percentFree: 'N/A' }
  });

  // Users Management State
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');

  // Documents Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocsCount, setTotalDocsCount] = useState(0);

  // Billing (Payments) State
  const [payments, setPayments] = useState([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Logs (LLM Logs) State
  const [llmLogs, setLlmLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);

  // API/LLM Configs state
  const [apiConfig, setApiConfig] = useState({
    geminiApiKey: '••••••••••••••••••••••••••••••••••••',
    defaultModel: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
    safetyLevel: 'medium'
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Packages (Pricing Plans) State
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [newPackage, setNewPackage] = useState({
    name: '',
    code: '',
    price: 0,
    durationMonths: 1,
    description: '',
    features: '',
    isActive: true
  });

  // Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', plan: 'free' });
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docModalLoading, setDocModalLoading] = useState(false);

  const fetchStatsAndHealth = async () => {
    try {
      setLoading(true);
      const [statsRes, healthRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/health')
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get(`/admin/users?page=${usersPage}&limit=10`);
      setUsers(res.data.users);
      setUsersTotalPages(res.data.pagination.pages);
      setTotalUsersCount(res.data.pagination.total);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách người dùng.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRecentDocs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/recent-documents?page=${page}&status=${statusFilter}&limit=10`);
      setRecentDocs(res.data.documents);
      setTotalPages(res.data.pagination.pages);
      setTotalDocsCount(res.data.pagination.total);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const res = await api.get(`/admin/payments?page=${paymentsPage}&limit=10`);
      setPayments(res.data.payments);
      setPaymentsTotalPages(res.data.pagination.pages);
      setTotalPaymentsCount(res.data.pagination.total);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải lịch sử giao dịch.');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchLlmLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.get(`/admin/logs?page=${logsPage}&limit=10`);
      setLlmLogs(res.data.logs);
      setLogsTotalPages(res.data.pagination.pages);
      setTotalLogsCount(res.data.pagination.total);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải nhật ký LLM.');
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true);
      const res = await api.get('/admin/plans');
      setPackages(res.data.plans);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách gói dịch vụ');
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStatsAndHealth();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'documents') {
      fetchRecentDocs();
    } else if (activeTab === 'billing') {
      fetchPayments();
    } else if (activeTab === 'packages') {
      fetchPackages();
    } else if (activeTab === 'logs') {
      fetchLlmLogs();
    }
  }, [activeTab, page, statusFilter, usersPage, paymentsPage, logsPage]);

  const formatStorage = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    return `${(bytes / 1e6).toFixed(1)} MB`;
  };

  const formatTokens = (num) => {
    if (!num) return 0;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}k`;
    return num;
  };

  const handleToggleLock = async (user) => {
    const newLockStatus = !user.isLocked;
    const actionText = newLockStatus ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của "${user.name}"?`)) return;

    try {
      await api.put(`/admin/users/${user._id}/lock`, { isLocked: newLockStatus });
      toast.success(`Đã ${actionText} tài khoản của "${user.name}" thành công`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || `Không thể ${actionText} tài khoản`);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}"?\nTất cả tài liệu và lịch sử chat của họ sẽ bị xóa vĩnh viễn.`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success(`Đã xóa người dùng "${user.name}" thành công`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      toast.success('Đã tạo tài khoản mới thành công');
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', plan: 'free' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo tài khoản');
    }
  };

  // Package Action Handlers
  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newPackage,
        features: newPackage.features.split('\n').map(f => f.trim()).filter(Boolean)
      };
      await api.post('/admin/plans', payload);
      toast.success('Đã tạo gói học tập mới thành công');
      setShowAddPackageModal(false);
      setNewPackage({ name: '', code: '', price: 0, durationMonths: 1, description: '', features: '', isActive: true });
      fetchPackages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo gói học tập');
    }
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...selectedPackage,
        features: typeof selectedPackage.features === 'string'
          ? selectedPackage.features.split('\n').map(f => f.trim()).filter(Boolean)
          : selectedPackage.features
      };
      await api.put(`/admin/plans/${selectedPackage._id}`, payload);
      toast.success('Đã cập nhật gói học tập thành công');
      setShowEditPackageModal(false);
      fetchPackages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật gói học tập');
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${pkg.name}"?`)) return;
    try {
      await api.delete(`/admin/plans/${pkg._id}`);
      toast.success(`Đã xóa gói dịch vụ "${pkg.name}" thành công`);
      fetchPackages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa gói dịch vụ');
    }
  };

  const handleTogglePackageActive = async (pkg) => {
    try {
      await api.put(`/admin/plans/${pkg._id}`, { isActive: !pkg.isActive });
      toast.success(`Đã ${!pkg.isActive ? 'kích hoạt' : 'tạm ngưng'} gói dịch vụ thành công`);
      fetchPackages();
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái gói dịch vụ');
    }
  };

  // Document Actions
  const handleViewDoc = async (id) => {
    try {
      setDocModalLoading(true);
      setShowDocModal(true);
      const res = await api.get(`/admin/documents/${id}`);
      setSelectedDoc(res.data.document);
    } catch (err) {
      toast.error('Không thể tải chi tiết tài liệu');
      setShowDocModal(false);
    } finally {
      setDocModalLoading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi hệ thống?')) return;
    try {
      await api.delete(`/admin/documents/${id}`);
      toast.success('Đã xóa tài liệu thành công');
      if (activeTab === 'documents') {
        fetchRecentDocs();
      } else {
        fetchStatsAndHealth();
      }
    } catch (err) {
      toast.error('Không thể xóa tài liệu');
    }
  };

  const handleSaveApiConfig = (e) => {
    e.preventDefault();
    toast.success('Cấu hình API & LLM đã được cập nhật thành công!');
  };

  // Filters
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(usersSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(usersSearch.toLowerCase())
  );

  const filteredDocs = recentDocs.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (doc.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sparkline generators
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

  // Chart data
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
          <h1>
            {activeTab === 'overview' && 'Tổng quan hệ thống'}
            {activeTab === 'users' && 'Quản lý người dùng'}
            {activeTab === 'documents' && 'Tài liệu & Lưu trữ'}
            {activeTab === 'api-settings' && 'Cài đặt cấu hình API & LLM'}
            {activeTab === 'billing' && 'Quản lý gói & Giao dịch'}
            {activeTab === 'logs' && 'Nhật ký cuộc gọi AI'}
          </h1>
          <p className="subtitle">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="admin-header-center">
          {activeTab === 'users' && (
            <div className="admin-search-wrapper">
              <HiOutlineMagnifyingGlass className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm kiếm người dùng theo tên, email..." 
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
              />
            </div>
          )}
          {activeTab === 'documents' && (
            <div className="admin-search-wrapper">
              <HiOutlineMagnifyingGlass className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm kiếm tài liệu theo tiêu đề..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="admin-header-right">
          <button className="admin-btn admin-btn-primary" onClick={() => setShowAddUserModal(true)}>
            + Thêm người dùng
          </button>
        </div>
      </header>

      {/* Main dashboard content area */}
      <div className="admin-dashboard-container" style={{ paddingTop: '10px' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
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

                    <path d={uploadsPath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                    <path d={chatsPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                    {chartData.uploads[6] > 0 && <circle cx={xCoords[6]} cy={170 - (chartData.uploads[6] / maxActivity) * 150} r="4" fill="#3b82f6" />}
                    {chartData.chats[6] > 0 && <circle cx={xCoords[6]} cy={170 - (chartData.chats[6] / maxActivity) * 150} r="4" fill="#10b981" />}
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
          </>
        )}

        {/* USERS MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <section className="admin-table-section">
            <div className="table-header">
              <h3>Danh sách người dùng hệ thống</h3>
              <span className="results-count">Tổng số: {totalUsersCount} thành viên</span>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Gói dịch vụ</th>
                    <th>Ngày đăng ký</th>
                    <th style={{ textAlign: 'center' }}>Thao tác quản trị</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        Không có người dùng phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td className="doc-name-cell">
                          <span className="doc-icon">👤</span>
                          <span className="doc-title">
                            {u.name}
                            {u.isLocked && <span style={{ color: '#ef4444', fontSize: '11px', marginLeft: '6px', fontWeight: '500' }}>🔒 Đã khóa</span>}
                          </span>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                            {u.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.plan === 'premium' ? 'badge-success' : 'badge-warning'}`}>
                            {u.plan === 'premium' ? 'Premium' : 'Miễn phí'}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="actions-cell" style={{ justifyContent: 'center', gap: '8px' }}>
                          <button 
                            className={`admin-action-btn-mini ${u.isLocked ? 'btn-unlock' : 'btn-lock'}`}
                            onClick={() => handleToggleLock(u)}
                            title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {u.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteUser(u)}
                            title="Xóa người dùng"
                          >
                            <HiOutlineTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="table-footer">
              <span className="results-count">Trang {usersPage} / {usersTotalPages}</span>
              <div className="pagination-buttons">
                <button 
                  onClick={() => setUsersPage(p => Math.max(p - 1, 1))} 
                  disabled={usersPage === 1}
                  className="pagination-btn"
                >
                  &lt;
                </button>
                {Array.from({ length: usersTotalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setUsersPage(pageNum)}
                    className={`pagination-btn ${pageNum === usersPage ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button 
                  onClick={() => setUsersPage(p => Math.min(p + 1, usersTotalPages))} 
                  disabled={usersPage === usersTotalPages}
                  className="pagination-btn"
                >
                  &gt;
                </button>
              </div>
            </div>
          </section>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <section className="admin-table-section">
            <div className="table-header">
              <h3>Danh sách tài liệu đã tải lên</h3>
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
                    <th>Ngày tải</th>
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
                         Không tìm thấy tài liệu nào.
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
                          <button 
                            className="action-btn view" 
                            onClick={() => handleViewDoc(doc._id)} 
                            title="Xem chi tiết tài liệu & RAG metadata"
                          >
                            <HiOutlineEye />
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteDoc(doc._id)} 
                            title="Xóa tài liệu"
                          >
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
        )}

        {/* API & LLM SETTINGS TAB */}
        {activeTab === 'api-settings' && (
          <section className="admin-table-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="table-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineCpuChip size={24} style={{ color: 'var(--primary-color)' }} />
                <h3>Cấu hình hệ thống mô hình LLM (Gemini)</h3>
              </div>
            </div>
            
            <form className="checkout-form" onSubmit={handleSaveApiConfig} style={{ padding: '24px 0' }}>
              <div className="input-group">
                <label>Gemini API Key</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="input" 
                    type={showApiKey ? "text" : "password"} 
                    value={apiConfig.geminiApiKey}
                    onChange={(e) => setApiConfig({...apiConfig, geminiApiKey: e.target.value})}
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <HiOutlineEye size={18} />
                  </button>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Khóa API dùng cho các chức năng RAG, tóm tắt bài giảng, làm quiz và chat AI.</p>
              </div>

              <div className="checkout-form-row">
                <div className="input-group">
                  <label>Mô hình mặc định</label>
                  <select 
                    className="input"
                    value={apiConfig.defaultModel}
                    onChange={(e) => setApiConfig({...apiConfig, defaultModel: e.target.value})}
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh & Tối ưu)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Thông minh & Logic sâu)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Độ sáng tạo (Temperature: {apiConfig.temperature})</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={apiConfig.temperature}
                    onChange={(e) => setApiConfig({...apiConfig, temperature: parseFloat(e.target.value)})}
                    style={{ height: '38px', accentColor: 'var(--primary-color)' }}
                  />
                </div>
              </div>

              <div className="checkout-form-row">
                <div className="input-group">
                  <label>Max Output Tokens</label>
                  <input 
                    className="input"
                    type="number"
                    value={apiConfig.maxTokens}
                    onChange={(e) => setApiConfig({...apiConfig, maxTokens: parseInt(e.target.value)})}
                  />
                </div>

                <div className="input-group">
                  <label>Bộ lọc an toàn (Safety Filter)</label>
                  <select 
                    className="input"
                    value={apiConfig.safetyLevel}
                    onChange={(e) => setApiConfig({...apiConfig, safetyLevel: e.target.value})}
                  >
                    <option value="low">Thấp (Safety Low)</option>
                    <option value="medium">Trung bình (Safety Medium)</option>
                    <option value="high">Cao (Safety High)</option>
                  </select>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" type="submit" style={{ marginTop: '16px', justifyContent: 'center' }}>
                Lưu cấu hình API
              </button>
            </form>
          </section>
        )}

        {/* BILLING & TRANSACTIONS TAB */}
        {activeTab === 'billing' && (
          <section className="admin-table-section">
            <div className="table-header">
              <h3>Lịch sử giao dịch Premium</h3>
              <span className="results-count">Tổng số: {totalPaymentsCount} hóa đơn</span>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Khách hàng</th>
                    <th>Email</th>
                    <th>Gói đăng ký</th>
                    <th>Số tiền</th>
                    <th>Hình thức</th>
                    <th>Trạng thái</th>
                    <th>Ngày thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        Chưa có giao dịch thanh toán nào được thực hiện.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: '600', fontFamily: 'monospace', color: 'var(--primary-color)' }}>{p.transactionId}</td>
                        <td>{p.userId?.name || 'Không xác định'}</td>
                        <td>{p.userId?.email || 'N/A'}</td>
                        <td>
                          <span className={`badge ${p.plan === 'yearly' ? 'badge-success' : 'badge-info'}`}>
                            {p.plan === 'yearly' ? 'Premium 1 Năm' : 'Premium 1 Tháng'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{p.amount.toLocaleString('vi-VN')} {p.currency}</td>
                        <td>
                          {p.method === 'card' && 'Thẻ tín dụng'}
                          {p.method === 'bank_transfer' && 'Chuyển khoản QR'}
                          {p.method === 'momo' && 'Ví MoMo'}
                        </td>
                        <td>
                          <span className={`badge ${
                            p.status === 'completed' ? 'badge-success' :
                            p.status === 'pending' ? 'badge-warning' :
                            'badge-danger'
                          }`}>
                            {p.status === 'completed' ? 'Thành công' :
                             p.status === 'pending' ? 'Chờ quét mã' :
                             'Thất bại'}
                          </span>
                        </td>
                        <td>{new Date(p.createdAt).toLocaleDateString('vi-VN')} {new Date(p.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span className="results-count">Trang {paymentsPage} / {paymentsTotalPages}</span>
              <div className="pagination-buttons">
                <button 
                  onClick={() => setPaymentsPage(p => Math.max(p - 1, 1))} 
                  disabled={paymentsPage === 1}
                  className="pagination-btn"
                >
                  &lt;
                </button>
                {Array.from({ length: paymentsTotalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setPaymentsPage(pageNum)}
                    className={`pagination-btn ${pageNum === paymentsPage ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button 
                  onClick={() => setPaymentsPage(p => Math.min(p + 1, paymentsTotalPages))} 
                  disabled={paymentsPage === paymentsTotalPages}
                  className="pagination-btn"
                >
                  &gt;
                </button>
              </div>
            </div>
          </section>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <section className="admin-table-section">
            <div className="table-header">
              <h3>Nhật ký hoạt động cuộc gọi LLM</h3>
              <span className="results-count">Tổng số: {totalLogsCount} logs</span>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Mô hình LLM</th>
                    <th>Token đã tiêu thụ</th>
                    <th>Chi phí ước tính</th>
                    <th>Thời gian gọi</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : llmLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        Chưa có cuộc gọi LLM nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    llmLogs.map((l) => (
                      <tr key={l._id}>
                        <td style={{ fontWeight: '500' }}>
                          <span className={`badge ${l.modelName.includes('pro') ? 'badge-danger' : 'badge-info'}`}>
                            {l.modelName}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{l.tokensUsed.toLocaleString()} tokens</td>
                        <td style={{ color: '#ef4444', fontWeight: '600' }}>${l.cost.toFixed(5)}</td>
                        <td>{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span className="results-count">Trang {logsPage} / {logsTotalPages}</span>
              <div className="pagination-buttons">
                <button 
                  onClick={() => setLogsPage(p => Math.max(p - 1, 1))} 
                  disabled={logsPage === 1}
                  className="pagination-btn"
                >
                  &lt;
                </button>
                {Array.from({ length: logsTotalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setLogsPage(pageNum)}
                    className={`pagination-btn ${pageNum === logsPage ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button 
                  onClick={() => setLogsPage(p => Math.min(p + 1, logsTotalPages))} 
                  disabled={logsPage === logsTotalPages}
                  className="pagination-btn"
                >
                  &gt;
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PACKAGES TAB */}
        {activeTab === 'packages' && (
          <section className="admin-table-section">
            <div className="table-header">
              <h3>Quản lý gói học Premium</h3>
              <button className="admin-btn admin-btn-primary" onClick={() => setShowAddPackageModal(true)}>
                + Tạo gói học tập
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Mã gói</th>
                    <th>Tên gói học</th>
                    <th>Giá tiền</th>
                    <th>Thời hạn</th>
                    <th>Mô tả</th>
                    <th>Tính năng nổi bật</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {packagesLoading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        Chưa cấu hình gói dịch vụ nào. Nhấn nút để thêm.
                      </td>
                    </tr>
                  ) : (
                    packages.map((pkg) => (
                      <tr key={pkg._id}>
                        <td style={{ fontWeight: '600', fontFamily: 'monospace', color: 'var(--primary-color)' }}>{pkg.code}</td>
                        <td style={{ fontWeight: '600' }}>{pkg.name}</td>
                        <td style={{ fontWeight: '600' }}>{pkg.price.toLocaleString('vi-VN')} đ</td>
                        <td>{pkg.durationMonths} tháng</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pkg.description}>
                          {pkg.description || 'N/A'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {pkg.features.map((feat, idx) => (
                              <span key={idx} style={{ fontSize: '11px', background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                {feat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button 
                            className={`badge ${pkg.isActive ? 'badge-success' : 'badge-danger'}`}
                            onClick={() => handleTogglePackageActive(pkg)}
                            style={{ border: 'none', cursor: 'pointer' }}
                            title="Nhấp để thay đổi trạng thái hoạt động"
                          >
                            {pkg.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedPackage({
                                  ...pkg,
                                  features: pkg.features.join('\n')
                                });
                                setShowEditPackageModal(true);
                              }}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeletePackage(pkg)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>

      {/* Add Package Modal */}
      {showAddPackageModal && (
        <div className="modal-overlay" onClick={() => setShowAddPackageModal(false)}>
          <div className="checkout-modal admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-header">
              <h2>Tạo gói học tập mới</h2>
              <button className="modal-close" onClick={() => setShowAddPackageModal(false)}>×</button>
            </div>
            <form className="checkout-form" onSubmit={handleCreatePackage} style={{ marginTop: '16px' }}>
              <div className="checkout-form-row">
                <div className="input-group">
                  <label>Tên gói học</label>
                  <input 
                    className="input" 
                    type="text" 
                    placeholder="Ví dụ: Premium 3 Tháng"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Mã gói (viết liền không dấu)</label>
                  <input 
                    className="input" 
                    type="text" 
                    placeholder="Ví dụ: premium_3m"
                    value={newPackage.code}
                    onChange={(e) => setNewPackage({...newPackage, code: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="checkout-form-row">
                <div className="input-group">
                  <label>Giá tiền (VNĐ)</label>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="Ví dụ: 199000"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({...newPackage, price: parseInt(e.target.value) || 0})}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Thời hạn (Tháng)</label>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="Ví dụ: 3"
                    value={newPackage.durationMonths}
                    onChange={(e) => setNewPackage({...newPackage, durationMonths: parseInt(e.target.value) || 1})}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Mô tả gói học</label>
                <textarea 
                  className="input" 
                  rows="2"
                  placeholder="Nhập mô tả ngắn..."
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                />
              </div>

              <div className="input-group">
                <label>Các tính năng nổi bật (Mỗi tính năng một dòng)</label>
                <textarea 
                  className="input" 
                  rows="4"
                  placeholder="Tính năng 1&#10;Tính năng 2&#10;Tính năng 3"
                  value={newPackage.features}
                  onChange={(e) => setNewPackage({...newPackage, features: e.target.value})}
                />
              </div>

              <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="newPackageActive"
                  checked={newPackage.isActive}
                  onChange={(e) => setNewPackage({...newPackage, isActive: e.target.checked})}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                />
                <label htmlFor="newPackageActive" style={{ marginBottom: 0, cursor: 'pointer' }}>Kích hoạt gói này ngay lập tức</label>
              </div>

              <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                Xác nhận tạo gói
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditPackageModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowEditPackageModal(false)}>
          <div className="checkout-modal admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-header">
              <h2>Cập nhật gói học</h2>
              <button className="modal-close" onClick={() => setShowEditPackageModal(false)}>×</button>
            </div>
            <form className="checkout-form" onSubmit={handleUpdatePackage} style={{ marginTop: '16px' }}>
              <div className="checkout-form-row">
                <div className="input-group">
                  <label>Tên gói học</label>
                  <input 
                    className="input" 
                    type="text" 
                    value={selectedPackage.name}
                    onChange={(e) => setSelectedPackage({...selectedPackage, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Mã gói (không thể sửa)</label>
                  <input 
                    className="input" 
                    type="text" 
                    value={selectedPackage.code}
                    disabled 
                    style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="checkout-form-row">
                <div className="input-group">
                  <label>Giá tiền (VNĐ)</label>
                  <input 
                    className="input" 
                    type="number" 
                    value={selectedPackage.price}
                    onChange={(e) => setSelectedPackage({...selectedPackage, price: parseInt(e.target.value) || 0})}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Thời hạn (Tháng)</label>
                  <input 
                    className="input" 
                    type="number" 
                    value={selectedPackage.durationMonths}
                    onChange={(e) => setSelectedPackage({...selectedPackage, durationMonths: parseInt(e.target.value) || 1})}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Mô tả gói học</label>
                <textarea 
                  className="input" 
                  rows="2"
                  value={selectedPackage.description || ''}
                  onChange={(e) => setSelectedPackage({...selectedPackage, description: e.target.value})}
                />
              </div>

              <div className="input-group">
                <label>Các tính năng nổi bật (Mỗi tính năng một dòng)</label>
                <textarea 
                  className="input" 
                  rows="4"
                  value={selectedPackage.features}
                  onChange={(e) => setSelectedPackage({...selectedPackage, features: e.target.value})}
                />
              </div>

              <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="selectedPackageActive"
                  checked={selectedPackage.isActive}
                  onChange={(e) => setSelectedPackage({...selectedPackage, isActive: e.target.checked})}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                />
                <label htmlFor="selectedPackageActive" style={{ marginBottom: 0, cursor: 'pointer' }}>Kích hoạt gói học</label>
              </div>

              <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                Cập nhật thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="checkout-modal admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-header">
              <h2>Tạo người dùng mới</h2>
              <button className="modal-close" onClick={() => setShowAddUserModal(false)}>×</button>
            </div>
            <form className="checkout-form" onSubmit={handleCreateUser} style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Họ và tên</label>
                <input 
                  className="input" 
                  type="text" 
                  placeholder="Nguyễn Văn A"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Email đăng nhập</label>
                <input 
                  className="input" 
                  type="email" 
                  placeholder="nva@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Mật khẩu ban đầu</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required 
                />
              </div>
              <div className="checkout-form-row">
                <div className="input-group">
                  <label>Vai trò</label>
                  <select 
                    className="input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">Thành viên (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Gói ban đầu</label>
                  <select 
                    className="input"
                    value={newUser.plan}
                    onChange={(e) => setNewUser({...newUser, plan: e.target.value})}
                  >
                    <option value="free">Miễn phí (Free)</option>
                    <option value="premium">Cao cấp (Premium)</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                Xác nhận tạo tài khoản
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="checkout-modal admin-modal doc-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-header">
              <h2>Chi tiết tài liệu RAG</h2>
              <button className="modal-close" onClick={() => setShowDocModal(false)}>×</button>
            </div>
            
            {docModalLoading ? (
              <div className="spinner" style={{ margin: '60px auto' }} />
            ) : selectedDoc ? (
              <div className="admin-doc-details-content" style={{ marginTop: '20px' }}>
                <div className="doc-details-grid">
                  <div className="detail-field">
                    <span className="label">Tiêu đề:</span>
                    <span className="val">{selectedDoc.title}</span>
                  </div>
                  <div className="detail-field">
                    <span className="label">Chủ sở hữu:</span>
                    <span className="val">{selectedDoc.userId?.name || 'Không xác định'} ({selectedDoc.userId?.email || 'N/A'})</span>
                  </div>
                  <div className="detail-field">
                    <span className="label">Dung lượng:</span>
                    <span className="val">{formatStorage(selectedDoc.fileSize)}</span>
                  </div>
                  <div className="detail-field">
                    <span className="label">Tổng số trang:</span>
                    <span className="val">{selectedDoc.pageCount || 'Đang cập nhật'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="label">Số Vector Chunks:</span>
                    <span className="val">{selectedDoc.chunkCount || 0} chunks</span>
                  </div>
                  <div className="detail-field">
                    <span className="label">Trạng thái nhúng:</span>
                    <span className={`val badge ${selectedDoc.status === 'ready' ? 'badge-success' : 'badge-danger'}`}>
                      {selectedDoc.status === 'ready' ? 'Hoàn tất' : 'Lỗi'}
                    </span>
                  </div>
                </div>

                {selectedDoc.errorMessage && (
                  <div className="doc-error-box" style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                    <strong>Lỗi xử lý:</strong> {selectedDoc.errorMessage}
                  </div>
                )}

                <div className="doc-summary-view" style={{ marginTop: '20px' }}>
                  <h3>Tóm tắt RAG tự động</h3>
                  <div className="summary-text-box" style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                    {selectedDoc.summary ? (
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selectedDoc.summary}</p>
                    ) : (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Tài liệu này chưa có tóm tắt tự động hoặc đang chờ tạo.</p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowDocModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                    Đóng
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => {
                      if (window.confirm('Bạn chắc chắn muốn xóa tài liệu này?')) {
                        handleDeleteDoc(selectedDoc._id);
                        setShowDocModal(false);
                      }
                    }} 
                    style={{ flex: 1, justifyContent: 'center', background: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Xóa tài liệu
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ textLine: 'center', margin: '40px 0' }}>Không thể tải dữ liệu.</p>
            )}
          </div>
        </div>
      )}

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
