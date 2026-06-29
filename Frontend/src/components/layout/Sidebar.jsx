import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineDocumentText, HiOutlineChatBubbleLeftRight, HiOutlineRectangleStack, HiOutlineClipboardDocumentCheck, HiOutlineHome, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { PiGraduationCapBold } from 'react-icons/pi';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', icon: <HiOutlineHome />, label: 'Tổng quan' },
    { to: '/documents', icon: <HiOutlineDocumentText />, label: 'Tài liệu' },
    { to: '/chat', icon: <HiOutlineChatBubbleLeftRight />, label: 'Chat AI' },
    { to: '/flashcards', icon: <HiOutlineRectangleStack />, label: 'Flashcards' },
    { to: '/quiz', icon: <HiOutlineClipboardDocumentCheck />, label: 'Trắc nghiệm' },
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
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
        <div className="sidebar-user-info">
          <div className="name">{user?.name}</div>
          <div className="email">{user?.email}</div>
        </div>
        <button className="btn-ghost" onClick={handleLogout} title="Đăng xuất" style={{ padding: 8, borderRadius: 8 }}>
          <HiOutlineArrowRightOnRectangle size={18} />
        </button>
      </div>
    </aside>
  );
}
