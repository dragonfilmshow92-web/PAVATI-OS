import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Globe, 
  Receipt,
  Package, 
  PackageCheck,
  Boxes,
  PlusCircle,
  QrCode,
  UserCheck, 
  ClipboardList,
  FileText,
  RotateCcw,
  Tag,
  DollarSign, 
  Users, 
  BarChart3, 
  TrendingUp,
  Settings, 
  Sun, 
  Moon, 
  Menu,
  X 
} from 'lucide-react';

export default function Sidebar() {
  const { currentPage, setCurrentPage, theme, toggleTheme, sidebarOpen, toggleSidebar, closeSidebar, settings } = useApp();
  const storeName = settings?.store_name || 'TIORAS';

  const menuSections = [
    {
      category: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Globe, kbd: 'F1' },
        { id: 'pos', label: 'Point of Sale', icon: Receipt, kbd: 'F2' }
      ]
    },
    {
      category: 'INVENTORY & PRODUCTS',
      items: [
        { id: 'inventory', label: 'Stock Inventory', icon: Package, kbd: 'F3' },
        { id: 'receiving', label: 'Stock Receiving', icon: PackageCheck, kbd: 'F4' },
        { id: 'products', label: 'Product Catalog', icon: Boxes },
        { id: 'listing', label: 'New Item Listing', icon: PlusCircle },
        { id: 'barcode', label: 'Barcode Generator', icon: QrCode, kbd: 'F5' }
      ]
    },
    {
      category: 'PURCHASING & VENDORS',
      items: [
        { id: 'suppliers', label: 'Suppliers & Vendors', icon: UserCheck, kbd: 'F6' },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList }
      ]
    },
    {
      category: 'SALES & ORDERS',
      items: [
        { id: 'invoices', label: 'Sales Invoices', icon: FileText, kbd: 'F7' },
        { id: 'returns', label: 'Returns & Exchanges', icon: RotateCcw },
        { id: 'coupons', label: 'Coupons & Discounts', icon: Tag }
      ]
    },
    {
      category: 'FINANCE & CUSTOMERS',
      items: [
        { id: 'expenses', label: 'Store Expenses', icon: DollarSign },
        { id: 'customers', label: 'Customers & Khata', icon: Users, kbd: 'F8' },
        { id: 'reports', label: 'Executive Reports', icon: BarChart3, kbd: 'F9' },
        { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp }
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Store Settings', icon: Settings, kbd: 'F10' }
      ]
    }
  ];

  return (
    <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      {/* Brand Header / Left-side Menu Toggle Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-content">
          {/* Logo & Brand Name (visible when open) */}
          <div 
            className="brand-title" 
            onClick={() => setCurrentPage('dashboard')}
            title={`${storeName} POS`}
          >
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={storeName}
                className="brand-logo-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="brand-logo-badge">
                {storeName.slice(0, 3).toUpperCase()}
              </span>
            )}
            <div className="brand-text-col">
              <span className="brand-name">{storeName}</span>
              <span className="brand-tag">POS System</span>
            </div>
          </div>

          {/* Left-side Menu Button Icon (toggles sidebar open / closed) */}
          <button 
            type="button"
            className="sidebar-toggle-btn" 
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse Navigation" : "Expand Navigation"}
            title={sidebarOpen ? "Collapse Sidebar Menu (Ctrl+B)" : "Expand Sidebar Menu (Ctrl+B)"}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Menu — Main Menu Buttons Only (No collapsible submenus) */}
      <div className="sidebar-nav-container">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-menu-section">
            <div className="sidebar-category-header">{section.category}</div>
            {section.items.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentPage(item.id)}
                  title={`${item.label} ${item.kbd ? `(${item.kbd})` : ''}`}
                >
                  <div className="nav-left">
                    <IconComponent size={18} />
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {item.kbd && <span className="nav-kbd">{item.kbd}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer User & Theme Switcher */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-profile-left">
            <div className="user-avatar" title="Admin Cashier (Register #1)">
              {storeName.slice(0, 2).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">Admin Cashier</div>
              <div className="user-status">
                <span className="pulse-dot"></span>
                Register #1 Live
              </div>
            </div>
          </div>
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn btn btn-secondary btn-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
