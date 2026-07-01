import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineDocumentText, HiOutlineChartBarSquare, HiOutlineArrowRightOnRectangle, HiOutlineUserGroup, HiOutlineCpuChip, HiOutlineCreditCard, HiOutlineClipboardDocumentList, HiOutlineAcademicCap, HiOutlineCurrencyDollar } from 'react-icons/hi2';

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return (
    <div className="loader" style={{ height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  // Guard: user must be authenticated AND have the admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: <HiOutlineChartBarSquare />, label: 'Tổng quan' },
    { to: '/admin/users', icon: <HiOutlineUserGroup />, label: 'Quản lý người dùng' },
    { to: '/admin/documents', icon: <HiOutlineDocumentText />, label: 'Tài liệu & Lưu trữ' },
    { to: '/admin/api-settings', icon: <HiOutlineCpuChip />, label: 'Cài đặt API & LLM' },
    { to: '/admin/packages', icon: <HiOutlineCurrencyDollar />, label: 'Quản lý gói dịch vụ' },
    { to: '/admin/billing', icon: <HiOutlineCreditCard />, label: 'Lịch sử giao dịch' },
    { to: '/admin/logs', icon: <HiOutlineClipboardDocumentList />, label: 'Nhật ký hệ thống' },
  ];

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="admin-sidebar-logo-icon"><HiOutlineAcademicCap /></span>
          <div>
            <h2>AI Study Assistant</h2>
            <span>Bảng điều khiển</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-section-title">Quản trị hệ thống</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-avatar">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="admin-sidebar-user-info">
            <div className="name">{user?.name}</div>
            <div className="email">Quản trị viên</div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Đăng xuất">
            <HiOutlineArrowRightOnRectangle size={18} />
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="admin-main-content">
        <Outlet />
      </div>
    </div>
  );
}
