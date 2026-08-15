import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (already installed and opened)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Secondary local check
    if (localStorage.getItem('pwa-installed') === 'true') {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Clear the deferredPrompt and hide the button
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.setItem('pwa-installed', 'true');
      console.log('Sabha Management was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the browser install prompt
    deferredPrompt.prompt();
    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to PWA prompt: ${outcome}`);
    // Clear prompt reference
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Do not show the button if it's already installed, not installable, or dismissed by user
  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      <button
        onClick={handleInstallClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--color-primary, #4C0585)',
          color: '#FFFFFF',
          border: 'none',
          padding: '12px 20px',
          borderRadius: 'var(--radius-full, 9999px)',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: 'var(--elevation-3, 0 12px 32px -8px rgba(76, 5, 133, 0.25))',
          transition: 'var(--transition-bounce, all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275))',
          outline: 'none',
          fontFamily: 'inherit'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 16px 40px -6px rgba(76, 5, 133, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'var(--elevation-3, 0 12px 32px -8px rgba(76, 5, 133, 0.25))';
        }}
      >
        <Download size={18} />
        <span>Install App</span>
      </button>
      
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss installation prompt"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 253, 254, 0.95)',
          border: '1px solid var(--glass-border, rgba(76, 5, 133, 0.15))',
          color: 'var(--color-primary, #4C0585)',
          cursor: 'pointer',
          boxShadow: 'var(--elevation-1, 0 1px 2px rgba(76, 5, 133, 0.1))',
          transition: 'var(--transition-smooth, all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1))',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.backgroundColor = 'var(--color-primary-hover, #DBB5EE)';
          e.currentTarget.style.borderColor = 'var(--glass-border-strong, rgba(76, 5, 133, 0.3))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 253, 254, 0.95)';
          e.currentTarget.style.borderColor = 'var(--glass-border, rgba(76, 5, 133, 0.15))';
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
