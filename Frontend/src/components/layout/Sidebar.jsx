import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { HiOutlineDocumentText, HiOutlineChatBubbleLeftRight, HiOutlineRectangleStack, HiOutlineClipboardDocumentCheck, HiOutlineHome, HiOutlineArrowRightOnRectangle, HiOutlineChartBarSquare, HiOutlineCalendarDays, HiOutlineSparkles, HiOutlineShieldCheck } from 'react-icons/hi2';
import { PiGraduationCapBold, PiCrownBold } from 'react-icons/pi';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.plan === 'premium';

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleTogglePlan = async () => {
    try {
      const res = await api.post('/auth/toggle-plan');
      updateUser({ plan: res.data.user.plan });
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Không thể chuyển đổi gói tài khoản');
    }
  };

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
            <PiCrownBold style={{ color: '#f59e0b', marginRight: 4, cursor: 'pointer' }} onClick={handleTogglePlan} title="Chuyển đổi gói" />
            Premium
            {!isPremium && <span className="badge badge-warning" style={{ fontSize: 10, marginLeft: 6, padding: '1px 6px', cursor: 'pointer' }} onClick={handleTogglePlan} title="Click to Upgrade">PRO</span>}
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
        <div className="sidebar-avatar" onClick={handleTogglePlan} title="Click to toggle plan" style={{ cursor: 'pointer', ...(isPremium ? { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 8px rgba(245,158,11,0.4)' } : {}) }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="sidebar-user-info">
          <div className="name" onClick={handleTogglePlan} style={{ cursor: 'pointer' }} title="Click to toggle plan">
            {user?.name}
            {isPremium && <PiCrownBold style={{ color: '#f59e0b', marginLeft: 4, fontSize: 12 }} />}
          </div>
          <div className="email" onClick={handleTogglePlan} style={{ cursor: 'pointer' }} title="Click to toggle plan">{isPremium ? 'Premium (Hạ cấp)' : 'Free plan (Nâng cấp)'}</div>
        </div>
        <button className="btn-ghost" onClick={handleLogout} title="Đăng xuất" style={{ padding: 8, borderRadius: 8 }}>
          <HiOutlineArrowRightOnRectangle size={18} />
        </button>
      </div>
    </aside>
  );
}
