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
  LogOut 
} from 'lucide-react';

export default function Header() {
  const { currentPage, setCurrentPage, settings, activeShift, setModalState, toggleSidebar, sidebarOpen, showToast } = useApp();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageNames = {
    dashboard: "Dashboard Overview",
    pos: "Point of Sale",
    inventory: "Stock Inventory",
    receiving: "Stock Receiving",
    listing: "New Item Listing",
    barcode: "Barcode Label Generator",
    suppliers: "Suppliers & Vendors",
    invoices: "Sales Invoices Archive",
    customers: "Customers & Khata Ledger",
    reports: "Executive Reports & Operations Hub",
    settings: "Store Profile & Cloud Sync",
    returns: "Returns & Exchanges",
    "purchase-orders": "Purchase Orders",
    coupons: "Coupons & Discounts",
    analytics: "Sales Analytics & Charts",
    expenses: "Store Expenses"
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="top-action-bar">
      <div className="top-left">
        <button 
          className="mobile-menu-btn btn btn-secondary btn-icon" 
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close Navigation" : "Open Navigation"}
          title={sidebarOpen ? "Collapse Menu" : "Expand Menu"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="page-title">
          {pageNames[currentPage] || "Store Management"}
        </h1>
      </div>

      <div className="top-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Mockup Action Nav: Home, Profile, Settings, Refresh, Log out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginRight: '6px' }}>
          <button 
            type="button" 
            onClick={() => setCurrentPage('dashboard')}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: 'var(--text-primary)', 
              fontSize: '12.5px', 
              fontWeight: '700' 
            }}
            title="Go to Home Dashboard"
          >
            <Home size={15} color="#10b981" />
            <span>Home</span>
          </button>

          <button 
            type="button" 
            onClick={() => setModalState({ type: 'profile', data: null })}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: 'var(--text-primary)', 
              fontSize: '12.5px', 
              fontWeight: '700' 
            }}
            title="Cashier Profile"
          >
            <User size={15} color="#8b5cf6" />
            <span>Profile</span>
          </button>

          <button 
            type="button" 
            onClick={() => setCurrentPage('settings')}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: 'var(--text-primary)', 
              fontSize: '12.5px', 
              fontWeight: '700' 
            }}
            title="Store Settings"
          >
            <Settings size={15} color="#f59e0b" />
            <span>Settings</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              showToast("Refreshing live store records...", "info");
              window.location.reload();
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: 'var(--text-primary)', 
              fontSize: '12.5px', 
              fontWeight: '700' 
            }}
            title="Refresh Store Data"
          >
            <RotateCw size={15} color="#0d9488" />
            <span>Refresh</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              if (confirm("Lock register / Log out of session?")) {
                showToast("Logged out successfully. Register locked.", "info");
                setCurrentPage('dashboard');
              }
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: '#ef4444', 
              fontSize: '12.5px', 
              fontWeight: '700' 
            }}
            title="Sign out & Lock Terminal"
          >
            <LogOut size={15} color="#ef4444" />
            <span>Log out</span>
          </button>
        </div>

        {/* Active Shift status */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setModalState({ type: 'shift', data: activeShift })}
          style={{ fontSize: '11px', padding: '3px 8px' }}
        >
          <span className="pulse-dot"></span>
          Shift: {activeShift?.status === 'OPEN' ? `Active (₹${activeShift.opening_cash || 2000})` : 'Closed'}
        </button>

        {/* Fullscreen Toggle */}
        <button 
          onClick={toggleFullscreen}
          className="btn btn-secondary btn-sm"
          title="Toggle Fullscreen"
          style={{ padding: '5px 7px' }}
        >
          <Maximize size={13} />
        </button>
      </div>
    </header>
  );
}
