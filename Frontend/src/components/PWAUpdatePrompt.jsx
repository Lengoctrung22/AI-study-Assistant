import React from 'react';
import { HiOutlineArrowPath } from 'react-icons/hi2';

export default function PWAUpdatePrompt({ needRefresh, updateServiceWorker }) {
  if (!needRefresh) return null;

  return (
    <div className="pwa-prompt pwa-update-prompt fade-in">
      <div className="pwa-prompt-icon">
        ✨
      </div>
      <div className="pwa-prompt-content">
        <h4>Cập nhật phiên bản mới</h4>
        <p>Đã có bản cập nhật mới của StudyAI. Bấm cập nhật để tải phiên bản mới nhất.</p>
      </div>
      <div className="pwa-prompt-actions">
        <button className="btn btn-sm btn-primary" onClick={() => updateServiceWorker(true)}>
          <HiOutlineArrowPath size={14} /> Cập nhật
        </button>
      </div>
    </div>
  );
}
