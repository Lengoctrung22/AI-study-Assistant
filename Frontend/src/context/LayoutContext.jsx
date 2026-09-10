import { createContext, useContext, useState, useEffect } from 'react';

const LayoutContext = createContext(null);

export const useLayout = () => useContext(LayoutContext);

export function LayoutProvider({ children }) {
  const [sidebarMode, setSidebarMode] = useState(() => {
    return localStorage.getItem('study_ai_sidebar_mode') || 'expanded';
  });
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('study_ai_sidebar_mode', sidebarMode);
  }, [sidebarMode]);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setQuickCreateOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cycleSidebarMode = () => {
    setSidebarMode((current) => {
      if (current === 'expanded') return 'rail';
      if (current === 'rail') return 'hidden';
      return 'expanded';
    });
  };

  const toggleSidebarHidden = () => {
    setSidebarMode((current) => (current === 'hidden' ? 'expanded' : 'hidden'));
  };

  const openCommandPalette = () => setCommandPaletteOpen(true);
  const closeCommandPalette = () => setCommandPaletteOpen(false);
  const toggleQuickCreate = () => setQuickCreateOpen((prev) => !prev);

  return (
    <LayoutContext.Provider
      value={{
        sidebarMode,
        setSidebarMode,
        cycleSidebarMode,
        toggleSidebarHidden,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        isQuickCreateOpen,
        setQuickCreateOpen,
        toggleQuickCreate,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
