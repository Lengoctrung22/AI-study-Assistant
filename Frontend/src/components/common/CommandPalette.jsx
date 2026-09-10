import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../context/LayoutContext';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineDocumentText, 
  HiOutlineChatBubbleLeftRight, 
  HiOutlineRectangleStack, 
  HiOutlineClipboardDocumentCheck, 
  HiOutlineHome, 
  HiOutlineChartBarSquare, 
  HiOutlineCalendarDays, 
  HiOutlineSparkles, 
  HiOutlineBookOpen,
  HiOutlineCloudArrowUp,
  HiOutlineXMark
} from 'react-icons/hi2';

export default function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette } = useLayout();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const allItems = [
    // Quick Actions
    {
      id: 'action-upload',
      category: 'Thao tác nhanh',
      title: 'Tải lên tài liệu mới (PDF, Word .docx, .doc)',
      icon: <HiOutlineCloudArrowUp className="text-red-400" />,
      action: () => navigate('/documents'),
    },
    {
      id: 'action-quiz',
      category: 'Thao tác nhanh',
      title: 'Tạo bài trắc nghiệm ôn luyện với AI',
      icon: <HiOutlineClipboardDocumentCheck className="text-emerald-400" />,
      action: () => navigate('/quiz'),
    },
    {
      id: 'action-flashcard',
      category: 'Thao tác nhanh',
      title: 'Tạo bộ thẻ ghi nhớ Flashcard tự động',
      icon: <HiOutlineRectangleStack className="text-indigo-400" />,
      action: () => navigate('/flashcards'),
    },
    {
      id: 'action-notebook',
      category: 'Thao tác nhanh',
      title: 'Tạo Sổ tay ghi chép nghiên cứu mới',
      icon: <HiOutlineBookOpen className="text-purple-400" />,
      action: () => navigate('/notebooks'),
    },

    // Navigation
    {
      id: 'nav-home',
      category: 'Điều hướng',
      title: 'Tổng quan (Dashboard)',
      icon: <HiOutlineHome />,
      action: () => navigate('/'),
    },
    {
      id: 'nav-docs',
      category: 'Điều hướng',
      title: 'Tài liệu học tập',
      icon: <HiOutlineDocumentText />,
      action: () => navigate('/documents'),
    },
    {
      id: 'nav-notebooks',
      category: 'Điều hướng',
      title: 'Sổ tay nghiên cứu',
      icon: <HiOutlineBookOpen />,
      action: () => navigate('/notebooks'),
    },
    {
      id: 'nav-chat',
      category: 'Điều hướng',
      title: 'Chat với trợ lý AI',
      icon: <HiOutlineChatBubbleLeftRight />,
      action: () => navigate('/chat'),
    },
    {
      id: 'nav-flashcards',
      category: 'Điều hướng',
      title: 'Bộ thẻ Flashcards',
      icon: <HiOutlineRectangleStack />,
      action: () => navigate('/flashcards'),
    },
    {
      id: 'nav-quiz',
      category: 'Điều hướng',
      title: 'Bài tập trắc nghiệm',
      icon: <HiOutlineClipboardDocumentCheck />,
      action: () => navigate('/quiz'),
    },
    {
      id: 'nav-analytics',
      category: 'Điều hướng',
      title: 'Phân tích năng lực & Tiến độ',
      icon: <HiOutlineChartBarSquare />,
      action: () => navigate('/analytics'),
    },
    {
      id: 'nav-study-plan',
      category: 'Điều hướng',
      title: 'Kế hoạch học tập tối ưu AI',
      icon: <HiOutlineCalendarDays />,
      action: () => navigate('/study-plan'),
    },
    {
      id: 'nav-ai-tools',
      category: 'Điều hướng',
      title: 'AI Studio Tools',
      icon: <HiOutlineSparkles />,
      action: () => navigate('/ai-tools'),
    },
  ];

  const filteredItems = allItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item) => {
    closeCommandPalette();
    item.action();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div 
      className="cmd-palette-backdrop" 
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCommandPalette();
      }}
    >
      <div className="cmd-palette-box">
        {/* Search Input Bar */}
        <div className="cmd-palette-input-wrap">
          <HiOutlineMagnifyingGlass className="cmd-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder="Tìm kiếm tài liệu, sổ tay, quiz hoặc gõ hành động..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query ? (
            <button 
              className="cmd-palette-clear-btn" 
              onClick={() => setQuery('')}
              title="Xóa tìm kiếm"
            >
              <HiOutlineXMark />
            </button>
          ) : (
            <kbd className="cmd-palette-badge-kbd">ESC</kbd>
          )}
        </div>

        {/* Results List */}
        <div className="cmd-palette-results">
          {filteredItems.length === 0 ? (
            <div className="cmd-palette-empty">
              <p>Không tìm thấy kết quả phù hợp cho "{query}"</p>
              <span>Thử tìm kiếm với từ khóa khác như "tài liệu", "quiz", "chat"...</span>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-palette-item-icon">
                    {item.icon}
                  </div>
                  <div className="cmd-palette-item-text">
                    <div className="cmd-palette-item-title">{item.title}</div>
                    <div className="cmd-palette-item-category">{item.category}</div>
                  </div>
                  {item.shortcut && (
                    <kbd className="cmd-palette-shortcut-kbd">{item.shortcut}</kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="cmd-palette-footer">
          <div className="cmd-palette-footer-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> để chọn</span>
            <span><kbd>↵</kbd> để mở</span>
            <span><kbd>Esc</kbd> để thoát</span>
          </div>
          <div className="cmd-palette-footer-brand">
            StudyAI Command
          </div>
        </div>
      </div>
    </div>
  );
}
