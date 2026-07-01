import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';

export default function Header({ title }) {
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return (
    <header className="header">
      <div className="header-left">
        {title && <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>}
      </div>
      <div className="header-right" style={{ gap: 16 }}>
        {!isOnline && (
          <span className="badge badge-danger fade-in" style={{ gap: 6, display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}>
            <span className="offline-pulse-dot" />
            Ngoại tuyến
          </span>
        )}
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}>
          {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
      </div>
    </header>
  );
}
