import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Database, 
  Maximize, 
  Menu, 
  X, 
  Home, 
  User, 
  Settings, 
  RotateCw, 
  LogOut,
  Volume2,
  VolumeX,
  Receipt,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import soundFx from '../utils/sounds';
import PWAInstallButton from './PWAInstallButton';

export default function Header() {
  const { currentPage, setCurrentPage, settings, activeShift, setModalState, toggleSidebar, sidebarOpen, showToast } = useApp();
  const [timeStr, setTimeStr] = useState('');
  const [soundActive, setSoundActive] = useState(() => soundFx.isEnabled());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageMeta = {
    dashboard: { title: "Dashboard Overview", icon: Home },
    pos: { title: "Point of Sale", icon: Receipt },
    inventory: { title: "Stock Inventory", icon: null },
    receiving: { title: "Stock Receiving", icon: null },
    listing: { title: "New Item Listing", icon: null },
    barcode: { title: "Barcode Label Generator", icon: null },
    suppliers: { title: "Suppliers & Vendors", icon: null },
    invoices: { title: "Sales Invoices Archive", icon: null },
    customers: { title: "Customers & Khata Ledger", icon: null },
    reports: { title: "Executive Reports & Operations Hub", icon: null },
    settings: { title: "Store Profile & Cloud Sync", icon: Settings },
    returns: { title: "Returns & Exchanges", icon: null },
    "purchase-orders": { title: "Purchase Orders", icon: null },
    coupons: { title: "Coupons & Discounts", icon: null },
    analytics: { title: "Sales Analytics & Charts", icon: null },
    expenses: { title: "Store Expenses", icon: null }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    showToast("Syncing with MongoDB Atlas...", "info");
    setTimeout(() => {
      window.location.reload();
    }, 350);
  };

  const currentMeta = pageMeta[currentPage] || { title: "Store Management" };

  return (
    <header className="top-action-bar">
      {/* Left: Mobile Toggle & Page Breadcrumb */}
      <div className="top-left">
        <button 
          className="mobile-menu-btn" 
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close Navigation" : "Open Navigation"}
          title={sidebarOpen ? "Collapse Menu" : "Expand Menu"}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="page-breadcrumb">
          <span className="breadcrumb-glow-dot"></span>
          <h1 className="page-title">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Center & Right: Live Telemetry & Command Pills */}
      <div className="top-right">
        {/* Quick Nav Pills */}
        <div className="header-nav-pills">
          <button 
            type="button" 
            className={`header-pill-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
            title="Dashboard Overview [F1]"
          >
            <Home size={14} />
            <span>Dashboard</span>
          </button>

          <button 
            type="button" 
            className={`header-pill-btn ${currentPage === 'pos' ? 'active' : ''}`}
            onClick={() => setCurrentPage('pos')}
            title="Point of Sale Counter [F2]"
          >
            <Receipt size={14} />
            <span>POS Counter</span>
            <kbd className="header-kbd">F2</kbd>
          </button>
        </div>

        {/* Live Digital Clock */}
        <div className="header-clock-badge" title="Live Local Store Time">
          <Clock size={13} color="var(--accent-indigo)" />
          <span>{timeStr || '12:00:00 PM'}</span>
        </div>

        {/* Active Cashier Shift status */}
        <button 
          type="button"
          className="header-shift-badge"
          onClick={() => setModalState({ type: 'shift', data: activeShift })}
          title="Click to view shift details or close register"
        >
          <span className="pulse-dot"></span>
          <span>Shift: {activeShift?.status === 'OPEN' ? `Active (₹${activeShift.opening_cash || 2000})` : 'Closed'}</span>
        </button>

        {/* Action Button Group */}
        <div className="header-action-group">
          {/* Universal PWA Install Button (Android, iOS, Windows, Mac) */}
          <PWAInstallButton />

          {/* Sound FX Toggle */}
          <button 
            type="button" 
            className={`header-icon-btn ${soundActive ? 'active-blue' : ''}`}
            onClick={() => {
              const next = soundFx.toggle();
              setSoundActive(next);
              if (next) {
                soundFx.barcodeScan();
                showToast("🔊 POS Sound Effects: Active", "success");
              } else {
                showToast("🔇 POS Sound Effects: Muted", "info");
              }
            }}
            title={soundActive ? "Mute POS Sound Effects" : "Enable POS Sound Effects"}
          >
            {soundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Refresh Data */}
          <button 
            type="button" 
            className={`header-icon-btn ${refreshing ? 'spin-anim' : ''}`}
            onClick={handleRefresh}
            title="Sync & Refresh Database Records"
          >
            <RotateCw size={15} />
          </button>

          {/* Fullscreen Toggle */}
          <button 
            type="button"
            onClick={toggleFullscreen}
            className="header-icon-btn"
            title="Toggle Kiosk Fullscreen"
          >
            <Maximize size={15} />
          </button>

          {/* Lock Register / Sign Out */}
          <button 
            type="button" 
            className="header-icon-btn btn-danger-tint"
            onClick={() => {
              if (confirm("Lock terminal and sign out?")) {
                showToast("Terminal locked.", "info");
                setCurrentPage('dashboard');
              }
            }}
            title="Lock Register / End Cashier Session"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
