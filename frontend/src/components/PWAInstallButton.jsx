import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Share, PlusSquare, X } from 'lucide-react';

export default function PWAInstallButton() {
  const [installable, setInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed)
    const checkStandalone = () => {
      const isWindowStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavStandalone = window.navigator.standalone === true; // iOS Safari
      return isWindowStandalone || isNavStandalone;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    // If iOS and not standalone, it is installable via Safari Share menu
    if (isAppleMobile && !checkStandalone()) {
      setInstallable(true);
    }

    // Listen for beforeinstallprompt event for Android, Windows, and Chrome
    const handleInstallReady = () => {
      setInstallable(true);
    };

    if (window.deferredInstallPrompt) {
      setInstallable(true);
    }

    window.addEventListener('pwa-install-ready', handleInstallReady);

    return () => {
      window.removeEventListener('pwa-install-ready', handleInstallReady);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt();
      const { outcome } = await window.deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallable(false);
      }
      window.deferredInstallPrompt = null;
    } else {
      alert('To install PAVATI OS:\n\n• On Chrome / Edge: Click the "Install" icon in your address bar.\n• On Android: Tap menu (⋮) → "Install app" or "Add to Home Screen".');
    }
  };

  // If already running as an installed standalone app, don't show the button
  if (isStandalone || !installable) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="pwa-install-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          color: '#93c5fd',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)'
        }}
        title="Install PAVATI OS as a native app on this device"
      >
        <Download size={14} />
        <span>Install App</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div 
          className="pos-modal-overlay" 
          style={{ 
            zIndex: 10001, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="glass-card" 
            style={{ 
              width: '100%', 
              maxWidth: '380px', 
              background: 'rgba(15, 23, 42, 0.96)', 
              borderRadius: '20px', 
              padding: '24px', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: '700', fontSize: '16px' }}>
                <Smartphone size={18} color="#60a5fa" /> Install on iPhone / iPad
              </div>
              <button 
                onClick={() => setShowIOSModal(false)} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
              Install PAVATI OS to your home screen for full-screen POS counter mode without Safari toolbars:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px' }}>
                <div style={{ background: '#3b82f6', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>1</div>
                <div style={{ fontSize: '13px', color: '#e2e8f0' }}>
                  Tap the <strong>Share</strong> button <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> in Safari
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px' }}>
                <div style={{ background: '#3b82f6', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>2</div>
                <div style={{ fontSize: '13px', color: '#e2e8f0' }}>
                  Scroll down & select <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '12px', fontSize: '14px' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
