import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLayout } from '../../context/LayoutContext';
import { 
  HiOutlineSun, 
  HiOutlineMoon, 
  HiOutlineBars3, 
  HiOutlineMagnifyingGlass, 
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineRectangleStack,
  HiOutlineClipboardDocumentCheck,
  HiOutlineBookOpen,
  HiOutlineFire
} from 'react-icons/hi2';

export default function Header({ title }) {
  const { theme, toggleTheme } = useTheme();
  const { 
    sidebarMode, 
    toggleSidebarHidden, 
    openCommandPalette, 
    isQuickCreateOpen, 
    toggleQuickCreate, 
    setQuickCreateOpen 
  } = useLayout();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close Quick Create dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setQuickCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setQuickCreateOpen]);

  // Route map for breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Tổng quan', path: '/' }];
    if (path.startsWith('/documents')) return [
      { label: 'Tài liệu', path: '/documents' },
      ...(path.length > 10 ? [{ label: 'Chi tiết tài liệu', path }] : [])
    ];
    if (path.startsWith('/notebooks')) return [
      { label: 'Sổ tay nghiên cứu', path: '/notebooks' },
      ...(path.length > 10 ? [{ label: 'Ghi chép', path }] : [])
    ];
    if (path.startsWith('/chat')) return [{ label: 'Chat AI', path: '/chat' }];
    if (path.startsWith('/flashcards')) return [{ label: 'Flashcards', path: '/flashcards' }];
    if (path.startsWith('/quiz')) return [{ label: 'Trắc nghiệm', path: '/quiz' }];
    if (path.startsWith('/analytics')) return [{ label: 'Phân tích', path: '/analytics' }];
    if (path.startsWith('/study-plan')) return [{ label: 'Kế hoạch học', path: '/study-plan' }];
    if (path.startsWith('/ai-tools')) return [{ label: 'AI Tools', path: '/ai-tools' }];
    if (path.startsWith('/pricing')) return [{ label: 'Gói dịch vụ', path: '/pricing' }];
    if (path.startsWith('/admin')) return [{ label: 'Quản trị', path: '/admin' }];
    return [{ label: title || 'Trang', path }];
  };

  const breadcrumbs = getBreadcrumbs();

  const handleQuickAction = (route) => {
    setQuickCreateOpen(false);
    navigate(route);
  };

  return (
    <header className="header topbar-modern">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="header-left">
        <button
          className="header-sidebar-toggle"
          onClick={toggleSidebarHidden}
          title={sidebarMode === 'hidden' ? "Hiện thanh menu" : "Ẩn thanh menu"}
        >
          <HiOutlineBars3 size={20} />
        </button>

        <nav className="header-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-root">StudyAI</Link>
          {breadcrumbs.map((bc, idx) => (
            <span key={bc.path} className="breadcrumb-segment">
              <span className="breadcrumb-separator">/</span>
              {idx === breadcrumbs.length - 1 ? (
                <span className="breadcrumb-current">{title || bc.label}</span>
              ) : (
                <Link to={bc.path} className="breadcrumb-link">{bc.label}</Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Command Palette Trigger, Quick Create (+), Streak, Theme Toggle */}
      <div className="header-right">
        {/* Command Palette Trigger Button */}
        <button
          className="header-search-trigger"
          onClick={openCommandPalette}
          title="Mở tìm kiếm nhanh (Ctrl + K)"
        >
          <HiOutlineMagnifyingGlass size={16} className="search-trigger-icon" />
          <span className="search-trigger-label">Tìm kiếm hoặc thao tác...</span>
          <kbd className="search-trigger-kbd">Ctrl K</kbd>
        </button>

        {/* Quick Create Dropdown */}
        <div className="quick-create-wrapper" ref={dropdownRef}>
          <button
            className="btn-quick-create"
            onClick={toggleQuickCreate}
            title="Tạo tài nguyên mới"
          >
            <HiOutlinePlus size={16} />
            <span>Tạo mới</span>
          </button>

          {isQuickCreateOpen && (
            <div className="quick-create-dropdown shadow-xl">
              <div className="quick-create-dropdown-title">Tạo tài nguyên học tập</div>
              <button 
                className="quick-create-item" 
                onClick={() => handleQuickAction('/documents')}
              >
                <span className="quick-create-icon icon-doc"><HiOutlineDocumentText size={18} /></span>
                <div className="quick-create-info">
                  <span className="title">Tài liệu học tập</span>
                  <span className="desc">Tải lên file PDF, DOCX, TXT</span>
                </div>
              </button>

              <button 
                className="quick-create-item" 
                onClick={() => handleQuickAction('/flashcards')}
              >
                <span className="quick-create-icon icon-card"><HiOutlineRectangleStack size={18} /></span>
                <div className="quick-create-info">
                  <span className="title">Bộ thẻ Flashcards</span>
                  <span className="desc">Tạo tự động bằng AI</span>
                </div>
              </button>

              <button 
                className="quick-create-item" 
                onClick={() => handleQuickAction('/quiz')}
              >
                <span className="quick-create-icon icon-quiz"><HiOutlineClipboardDocumentCheck size={18} /></span>
                <div className="quick-create-info">
                  <span className="title">Bài trắc nghiệm Quiz</span>
                  <span className="desc">Kiểm tra kiến thức tức thì</span>
                </div>
              </button>

              <button 
                className="quick-create-item" 
                onClick={() => handleQuickAction('/notebooks')}
              >
                <span className="quick-create-icon icon-book"><HiOutlineBookOpen size={18} /></span>
                <div className="quick-create-info">
                  <span className="title">Sổ tay nghiên cứu</span>
                  <span className="desc">Ghi chép và tóm tắt AI</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Streak Pill */}
        <div className="header-streak-pill" title="Chuỗi ngày học liên tục">
          <HiOutlineFire className="streak-icon animate-pulse" />
          <span>Học mỗi ngày</span>
        </div>

        {/* Offline indicator if disconnected */}
        {!isOnline && (
          <span className="badge badge-danger fade-in" style={{ gap: 6, display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}>
            <span className="offline-pulse-dot" />
            Ngoại tuyến
          </span>
        )}

        {/* Theme Toggle Button */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
        </button>
      </div>
    </header>
  );
}
