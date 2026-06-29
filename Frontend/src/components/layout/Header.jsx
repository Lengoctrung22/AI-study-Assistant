import { useTheme } from '../../context/ThemeContext';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';

export default function Header({ title }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-left">
        {title && <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>}
      </div>
      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}>
          {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
      </div>
    </header>
  );
}
