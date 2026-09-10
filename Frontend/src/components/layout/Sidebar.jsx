import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import { 
  HiOutlineDocumentText, 
  HiOutlineChatBubbleLeftRight, 
  HiOutlineRectangleStack, 
  HiOutlineClipboardDocumentCheck, 
  HiOutlineHome, 
  HiOutlineArrowRightOnRectangle, 
  HiOutlineChartBarSquare, 
  HiOutlineCalendarDays, 
  HiOutlineSparkles, 
  HiOutlineShieldCheck, 
  HiOutlineLockClosed, 
  HiOutlineBookOpen,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi2';
import { PiGraduationCapBold, PiCrownBold } from 'react-icons/pi';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { sidebarMode, cycleSidebarMode } = useLayout();
  const navigate = useNavigate();
  const isPremium = user?.plan === 'premium';
  const isRail = sidebarMode === 'rail';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <HiOutlineHome />, label: 'Tổng quan' },
    { to: '/documents', icon: <HiOutlineDocumentText />, label: 'Tài liệu' },
    { to: '/notebooks', icon: <HiOutlineBookOpen />, label: 'Sổ tay nghiên cứu' },
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
    <aside className={`sidebar sidebar-${sidebarMode}`}>
      {/* Header Logo & Collapse Button */}
      <div className="sidebar-logo">
        <div 
          className="sidebar-brand-click" 
          onClick={() => navigate('/')} 
          title="StudyAI - Trang chủ"
        >
          <div className="sidebar-logo-icon">
            <PiGraduationCapBold />
          </div>
          {!isRail && (
            <div className="sidebar-logo-text">
              <h2>StudyAI</h2>
              <span>Trợ lý học tập</span>
            </div>
          )}
        </div>

        {/* Toggle Mode Button */}
        <button
          className="sidebar-collapse-btn"
          onClick={cycleSidebarMode}
          title={isRail ? "Mở rộng thanh bên" : "Thu gọn dạng mini-rail"}
        >
          {isRail ? <HiOutlineChevronRight size={16} /> : <HiOutlineChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {/* Core Learning Nav */}
        <div className="sidebar-section">
          {!isRail && <div className="sidebar-section-title">Học tập</div>}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${isRail ? 'nav-link-rail' : ''}`}
              title={isRail ? item.label : undefined}
            >
              <span className="nav-link-icon">{item.icon}</span>
              {!isRail && <span className="nav-link-text">{item.label}</span>}
              {isRail && <span className="rail-hover-tooltip">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Premium / Advanced Section */}
        <div className="sidebar-section">
          {!isRail && (
            <div className="sidebar-section-title">
              <PiCrownBold style={{ color: '#f59e0b' }} />
              <span>Nâng cao</span>
              {!isPremium && (
                <span 
                  className="badge badge-warning sidebar-pro-badge" 
                  onClick={() => navigate('/pricing')} 
                  title="Nâng cấp Premium"
                >
                  PRO
                </span>
              )}
            </div>
          )}
          {premiumItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''} ${!isPremium ? 'nav-link-locked' : ''} ${isRail ? 'nav-link-rail' : ''}`
              }
              title={isRail ? `${item.label} ${!isPremium ? '(Khóa)' : ''}` : undefined}
            >
              <span className="nav-link-icon">{item.icon}</span>
              {!isRail && (
                <>
                  <span className="nav-link-text">{item.label}</span>
                  {!isPremium && <span className="nav-lock-icon"><HiOutlineLockClosed size={13} /></span>}
                </>
              )}
              {isRail && (
                <span className="rail-hover-tooltip">
                  {item.label} {!isPremium && '🔒'}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Admin Section (Conditional) */}
        {user?.role === 'admin' && (
          <div className="sidebar-section">
            {!isRail && <div className="sidebar-section-title">Hệ thống</div>}
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link admin-nav-item ${isActive ? 'active' : ''} ${isRail ? 'nav-link-rail' : ''}`}
              title={isRail ? 'Bảng điều khiển Admin' : undefined}
            >
              <span className="nav-link-icon" style={{ color: '#10b981' }}>
                <HiOutlineShieldCheck />
              </span>
              {!isRail && <span className="nav-link-text">Bảng điều khiển</span>}
              {isRail && <span className="rail-hover-tooltip">Admin</span>}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer Profile */}
      <div className={`sidebar-footer ${isRail ? 'sidebar-footer-rail' : ''}`}>
        <div
          className="sidebar-avatar"
          onClick={() => navigate('/pricing')}
          title="Quản lý gói"
          style={{
            cursor: 'pointer',
            ...(isPremium
              ? { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 10px rgba(245,158,11,0.35)' }
              : {}),
          }}
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>

        {!isRail && (
          <div className="sidebar-user-info">
            <div className="name truncate">
              {user?.name || 'Học viên'}
              {isPremium && <PiCrownBold style={{ color: '#f59e0b', marginLeft: 4, fontSize: 12 }} />}
            </div>
            <div
              className="email truncate"
              onClick={() => navigate('/pricing')}
              style={{ cursor: 'pointer' }}
              title="Quản lý gói"
            >
              {isPremium ? 'Premium member' : 'Free plan - Nâng cấp'}
            </div>
          </div>
        )}

        {!isRail && (
          <button
            className="btn-ghost sidebar-logout-btn"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <HiOutlineArrowRightOnRectangle size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
