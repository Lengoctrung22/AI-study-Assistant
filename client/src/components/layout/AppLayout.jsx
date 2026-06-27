import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loader" style={{ height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}
