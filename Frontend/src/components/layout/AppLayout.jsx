import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from '../common/CommandPalette';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { sidebarMode, toggleSidebarHidden } = useLayout();

  if (loading) return (
    <div className="loader" style={{ height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={`app-layout layout-${sidebarMode}`}>
      <CommandPalette />
      {/* Mobile backdrop to close sidebar when open */}
      {sidebarMode !== 'hidden' && (
        <div 
          className="sidebar-mobile-backdrop md-hidden" 
          onClick={toggleSidebarHidden} 
          aria-hidden="true" 
        />
      )}
      <Sidebar />
      <div className={`main-content content-${sidebarMode}`}>
        <Header />
        <main className="content-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
