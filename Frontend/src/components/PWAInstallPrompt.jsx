import React, { useState, useEffect } from 'react';
import { HiOutlineArrowDownTray, HiOutlineXMark } from 'react-icons/hi2';

export default function PWAInstallPrompt({ isInstallable, installApp }) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isInstallable) {
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
      const isExpired = Date.now() - dismissedTime > 24 * 60 * 60 * 1000;
      
      if (!dismissed || isExpired) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowPrompt(false);
    }
  }, [isInstallable]);

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const handleInstall = async () => {
    setShowPrompt(false);
    await installApp();
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-prompt pwa-install-prompt fade-in">
      <div className="pwa-prompt-icon">
        📥
      </div>
      <div className="pwa-prompt-content">
        <h4>Cài đặt ứng dụng</h4>
        <p>Cài đặt StudyAI trên thiết bị của bạn để truy cập nhanh chóng và học tập offline.</p>
      </div>
      <div className="pwa-prompt-actions">
        <button className="btn btn-sm btn-primary" onClick={handleInstall}>
          <HiOutlineArrowDownTray size={14} /> Cài đặt
        </button>
        <button className="pwa-prompt-close" onClick={handleDismiss} title="Bỏ qua">
          <HiOutlineXMark size={16} />
        </button>
      </div>
    </div>
  );
}
