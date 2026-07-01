import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineDocumentText, HiOutlineChatBubbleLeftRight, HiOutlineRectangleStack, HiOutlineClipboardDocumentCheck, HiOutlineHome, HiOutlineArrowRightOnRectangle, HiOutlineChartBarSquare, HiOutlineCalendarDays, HiOutlineSparkles, HiOutlineShieldCheck } from 'react-icons/hi2';
import { PiGraduationCapBold, PiCrownBold } from 'react-icons/pi';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.plan === 'premium';

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', icon: <HiOutlineHome />, label: 'Tổng quan' },
    { to: '/documents', icon: <HiOutlineDocumentText />, label: 'Tài liệu' },
    { to: '/chat', icon: <HiOutlineChatBubbleLeftRight />, label: 'Chat AI' },
    { to: '/flashcards', icon: <HiOutlineRectangleStack />, label: 'Flashcards' },
    { to: '/quiz', icon: <HiOutlineClipboardDocumentCheck />, label: 'Trắc nghiệm' },
  ];

  const premiumItems = [
    { to: '/analytics', icon: <HiOutlineChartBarSquare />, label: 'Phân tích' },
    { to: '/study-plan', icon: <HiOutlineCalendarDays />, label: 'Kế hoạch học' },
    { to: '/ai-tools', icon: <HiOutlineSparkles />, label: 'AI Tools' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><PiGraduationCapBold /></div>
        <div>
          <h2>StudyAI</h2>
          <span>Trợ lý học tập</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Menu chính</div>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <PiCrownBold style={{ color: '#f59e0b', marginRight: 4 }} />
            Premium
            {!isPremium && <span className="badge badge-warning" style={{ fontSize: 10, marginLeft: 6, padding: '1px 6px', cursor: 'pointer' }} onClick={() => navigate('/pricing')} title="Nâng cấp">PRO</span>}
          </div>
          {premiumItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${!isPremium ? 'nav-link-locked' : ''}`}>
              <span className="nav-link-icon">{item.icon}</span>
              {item.label}
              {!isPremium && <span className="nav-lock-icon">🔒</span>}
            </NavLink>
          ))}
        </div>

        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Hệ thống</div>
            <NavLink to="/admin" className={({ isActive }) => `nav-link admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-link-icon" style={{ color: '#10b981' }}><HiOutlineShieldCheck /></span>
              Bảng điều khiển
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-avatar"
          onClick={() => navigate('/pricing')}
          title="Quản lý gói"
          style={{ cursor: 'pointer', ...(isPremium ? { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 8px rgba(245,158,11,0.4)' } : {}) }}
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="sidebar-user-info">
          <div className="name">
            {user?.name}
            {isPremium && <PiCrownBold style={{ color: '#f59e0b', marginLeft: 4, fontSize: 12 }} />}
          </div>
          <div
            className="email"
            onClick={() => navigate('/pricing')}
            style={{ cursor: 'pointer' }}
            title="Quản lý gói"
          >
            {isPremium ? 'Premium ✨' : 'Free plan — Nâng cấp'}
          </div>
        </div>
        <button className="btn-ghost" onClick={handleLogout} title="Đăng xuất" style={{ padding: 8, borderRadius: 8 }}>
          <HiOutlineArrowRightOnRectangle size={18} />
        </button>
      </div>
    </aside>
  );
}
