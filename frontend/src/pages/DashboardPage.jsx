import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Truck, 
  Barcode, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Layers,
  FilePlus,
  Boxes,
  FileText,
  DollarSign,
  RotateCcw,
  ArrowUpRight,
  ArrowRight,
  CreditCard,
  Wallet,
  Store,
  Activity,
  Calendar,
  Zap,
  Sparkles
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { items, grnRecords, refreshGRN, refreshItems, setCurrentPage, setModalState } = useApp();

  const [dashboardStats, setDashboardStats] = useState(null);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'reorder'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);

  const loadStats = async () => {
    setIsRefreshing(true);
    try {
      if (refreshItems) await refreshItems();
      if (refreshGRN) await refreshGRN();
      const res = await api.getDashboardStats();
      if (res && res.success) {
        setDashboardStats(res.data);
      }
    } catch (err) {
      console.warn("Could not load executive dashboard stats:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Filter & Metric Calculations
  const pendingInward = items.filter(i => !i.stock_qty || i.stock_qty <= 0);
  const lowStock = items.filter(i => i.stock_qty > 0 && i.stock_qty <= i.reorder_level);
  const belowCost = items.filter(i => i.cost_price > 0 && i.selling_price < i.cost_price);
  const totalStockUnits = items.reduce((acc, i) => acc + (Number(i.stock_qty) || 0), 0);
  const totalInventoryValue = items.reduce((acc, i) => acc + ((Number(i.cost_price) || 0) * (Number(i.stock_qty) || 0)), 0);

  const todaySales = dashboardStats?.today_sales ?? 0;
  const todayInvoicesCount = dashboardStats?.today_invoice_count ?? 0;
  const todayAvgBasket = dashboardStats?.today_avg_basket ?? (todayInvoicesCount > 0 ? Math.round(todaySales / todayInvoicesCount) : 0);
  const recentInvoices = dashboardStats?.recent_invoices || [];
  const salesChart = dashboardStats?.sales_chart || [];
  const paymentBreakdown = dashboardStats?.payment_breakdown || {
    cash: { count: 0, total: 0 },
    upi: { count: 0, total: 0 },
    card: { count: 0, total: 0 },
    split: { count: 0, total: 0 }
  };

  // 7-day velocity chart calculations
  const maxChartSales = Math.max(...salesChart.map(d => d.sales || 0), 1000);
  const total7DaySales = salesChart.reduce((s, d) => s + (d.sales || 0), 0);

  // Stock health percentages
  const totalCatalogCount = Math.max(items.length, 1);
  const inStockCount = items.filter(i => i.stock_qty > i.reorder_level).length;
  const inStockPct = Math.round((inStockCount / totalCatalogCount) * 100);
  const pendingInwardPct = Math.round((pendingInward.length / totalCatalogCount) * 100);
  const lowStockPct = Math.max(0, 100 - inStockPct - pendingInwardPct);

  // Dynamic Time Greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Vendor monogram helper
  const getVendorInitials = (name) => {
    if (!name) return 'VN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Color generator for vendor avatars
  const getAvatarGradient = (str) => {
    const gradients = [
      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'linear-gradient(135deg, #10b981, #047857)',
      'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #be185d)'
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div style={{ paddingBottom: '36px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* ─── 1. Hero Executive Welcome & Store Pulse Bar ────────────────── */}
      <div className="dashboard-hero-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="hero-brand-pill">
              <Sparkles size={12} /> PAVATI OS Fashion & Retail • Flagship Store
            </span>
            <span className="hero-meta-pill">
              <span className="pulse-dot"></span> POS Active Online
            </span>
          </div>

          <div className="hero-greeting-title">
            <span>{greeting}, Admin Cashier</span>
            <span style={{ fontSize: '18px' }}>✨</span>
          </div>

          <div className="hero-meta-row">
            <span className="hero-meta-pill">
              <Store size={14} color="var(--accent-blue)" /> Register Station #01
            </span>
            <span className="hero-meta-pill">
              <Calendar size={14} color="var(--accent-purple)" /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="hero-meta-pill">
              <Activity size={14} color="var(--accent-emerald)" /> Shift Float: <strong>₹2,000</strong>
            </span>
          </div>
        </div>

        {/* Right Side: Quick Action & Refresh */}
        <div className="hero-actions-container">
          <button 
            className="hero-primary-btn"
            onClick={() => setCurrentPage('pos')}
            title="Press F2 to launch Point of Sale"
          >
            <ShoppingCart size={17} />
            <span>Open POS Counter</span>
            <span style={{ fontSize: '11px', opacity: 0.85, padding: '1px 5px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>F2</span>
          </button>

          <button 
            className="hero-icon-btn"
            onClick={loadStats}
            title="Refresh Live Dashboard Data"
          >
            <RotateCcw size={16} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* Margin Loss Alert Banner if any below-cost items */}
      {belowCost.length > 0 && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1.5px solid var(--accent-red)', 
          borderRadius: '12px', 
          padding: '14px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} color="var(--accent-red)" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--accent-red)' }}>
                Urgent Margin Alert: {belowCost.length} Product(s) Priced Below Cost!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Retail selling prices are currently set below purchase invoice cost. Update prices immediately in Product Master.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-danger btn-sm"
            style={{ fontWeight: '800', padding: '6px 14px', borderRadius: '8px' }}
            onClick={() => setModalState({ type: 'priceEdit', data: belowCost[0] })}
          >
            Correct Pricing Now
          </button>
        </div>
      )}

      {/* ─── 2. Executive 6 KPI Summary Cards Grid ────────────────────────── */}
      <div className="kpi-grid-container">
        
        {/* KPI 1: Today's POS Sales */}
        <div 
          className="kpi-glass-card"
          style={{ 
            '--glow-gradient': 'linear-gradient(90deg, #10b981, #059669)',
            '--badge-bg': 'rgba(16, 185, 129, 0.12)',
            '--badge-color': '#10b981',
            '--badge-shadow': '0 4px 14px rgba(16, 185, 129, 0.25)',
            '--card-border-hover': '#10b981'
          }}
        >
          <div className="kpi-top-glow" />
          <div className="kpi-header-row">
            <span className="kpi-label">Today's POS Sales</span>
            <div className="kpi-icon-badge">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            ₹{todaySales.toLocaleString('en-IN')}
          </div>
          <div className="kpi-footer-row">
            <span className="kpi-context-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
              ↑ {todayInvoicesCount} Bill{todayInvoicesCount === 1 ? '' : 's'} Done
            </span>
            <span>Avg ₹{todayAvgBasket.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* KPI 2: Total Catalog Master */}
        <div 
          className="kpi-glass-card"
          onClick={() => setCurrentPage('products')}
          style={{ 
            cursor: 'pointer',
            '--glow-gradient': 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            '--badge-bg': 'rgba(59, 130, 246, 0.12)',
            '--badge-color': '#3b82f6',
            '--badge-shadow': '0 4px 14px rgba(59, 130, 246, 0.25)',
            '--card-border-hover': '#3b82f6'
          }}
          title="Click to view Product Master Catalog"
        >
          <div className="kpi-top-glow" />
          <div className="kpi-header-row">
            <span className="kpi-label">Product Master</span>
            <div className="kpi-icon-badge">
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {items.length} <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)' }}>SKUs</span>
          </div>
          <div className="kpi-footer-row">
            <span className="kpi-context-pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
              Master Catalog &rarr;
            </span>
            <span>All Categories</span>
          </div>
        </div>

        {/* KPI 3: Pending Inward (Unreceived Products Alert) */}
        <div 
          className="kpi-glass-card"
          onClick={() => setCurrentPage('products')}
          style={{ 
            cursor: 'pointer',
            background: pendingInward.length > 0 ? 'rgba(245, 158, 11, 0.05)' : undefined,
            '--glow-gradient': 'linear-gradient(90deg, #f59e0b, #d97706)',
            '--badge-bg': 'rgba(245, 158, 11, 0.12)',
            '--badge-color': '#f59e0b',
            '--badge-shadow': '0 4px 14px rgba(245, 158, 11, 0.25)',
            '--card-border-hover': '#f59e0b'
          }}
          title="Click to view listed items awaiting receiving"
        >
          <div className="kpi-top-glow" />
          <div className="kpi-header-row">
            <span className="kpi-label" style={{ color: pendingInward.length > 0 ? 'var(--accent-amber)' : undefined }}>
              Pending Inward
            </span>
            <div className="kpi-icon-badge">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: pendingInward.length > 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
            {pendingInward.length} <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)' }}>Items</span>
          </div>
          <div className="kpi-footer-row">
            {pendingInward.length > 0 ? (
              <span className="kpi-context-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                <span className="pulse-amber-dot" /> Awaiting GRN
              </span>
            ) : (
              <span className="kpi-context-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
                ✓ 100% Inwarded
              </span>
            )}
            <span>0 Stock Guard</span>
          </div>
        </div>

        {/* KPI 4: Physical Stock Units */}
        <div 
          className="kpi-glass-card"
          onClick={() => setCurrentPage('inventory')}
          style={{ 
            cursor: 'pointer',
            '--glow-gradient': 'linear-gradient(90deg, #06b6d4, #0891b2)',
            '--badge-bg': 'rgba(6, 182, 212, 0.12)',
            '--badge-color': '#06b6d4',
            '--badge-shadow': '0 4px 14px rgba(6, 182, 212, 0.25)',
            '--card-border-hover': '#06b6d4'
          }}
          title="Click to view Inventory On-Hand"
        >
          <div className="kpi-top-glow" />
          <div className="kpi-header-row">
            <span className="kpi-label">Physical Stock</span>
            <div className="kpi-icon-badge">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {totalStockUnits.toLocaleString()} <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)' }}>Pcs</span>
          </div>
          <div className="kpi-footer-row">
            <span className="kpi-context-pill" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
              On-Hand Store
            </span>
            <span>All Racks Active</span>
          </div>
        </div>

        {/* KPI 5: Inventory Valuation */}
        <div 
          className="kpi-glass-card"
          style={{ 
            '--glow-gradient': 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
            '--badge-bg': 'rgba(139, 92, 246, 0.12)',
            '--badge-color': '#8b5cf6',
            '--badge-shadow': '0 4px 14px rgba(139, 92, 246, 0.25)',
            '--card-border-hover': '#8b5cf6'
          }}
        >
          <div className="kpi-top-glow" />
          <div className="kpi-header-row">
            <span className="kpi-label">Stock Valuation</span>
            <div className="kpi-icon-badge">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">
            ₹{Math.round(totalInventoryValue).toLocaleString('en-IN')}
          </div>
          <div className="kpi-footer-row">
            <span className="kpi-context-pill" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              Inward Cost
            </span>
            <span>Asset Valuation</span>
          </div>
        </div>

        {/* KPI 6: Reorder Threshold Alerts */}
        <div 
          className="kpi-glass-card"
          onClick={() => { setActiveTab('reorder'); }}
          style={{ 
            cursor: 'pointer',
            background: lowStock.length > 0 ? 'rgba(239, 68, 68, 0.05)' : undefined,
            '--glow-gradient': 'linear-gradient(90deg, #ef4444, #dc2626)',
            '--badge-bg': 'rgba(239, 68, 68, 0.12)',
            '--badge-color': '#ef4444',
            '--badge-shadow': '0 4px 14px rgba(239, 68, 68, 0.25)',
            '--card-border-hover': '#ef4444'
          }}
          title="Click to inspect reorder alerts"
        >
          <div className="kpi-top-glow" />
          <div className="kpi-header-row">
            <span className="kpi-label" style={{ color: lowStock.length > 0 ? 'var(--accent-red)' : undefined }}>
              Reorder Alerts
            </span>
            <div className="kpi-icon-badge">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: lowStock.length > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
            {lowStock.length} <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)' }}>Low</span>
          </div>
          <div className="kpi-footer-row">
            {lowStock.length > 0 ? (
              <span className="kpi-context-pill" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--accent-red)' }}>
                Action Needed
              </span>
            ) : (
              <span className="kpi-context-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
                ✓ Optimal Level
              </span>
            )}
            <span>PO Reorder</span>
          </div>
        </div>

      </div>

      {/* ─── 3. Smart Operations Command Dock (All 5 Core Workflows) ───────── */}
      <div>
        <div className="command-dock-header">
          <div className="command-dock-title">
            <Zap size={14} color="var(--accent-amber)" /> Smart Operations Command Dock
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            1-Click Workflow Execution
          </span>
        </div>

        <div className="command-dock-grid">
          
          {/* Dock 1: POS Billing Counter */}
          <div 
            className="dock-action-card"
            onClick={() => setCurrentPage('pos')}
            style={{
              '--dock-icon-bg': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              '--dock-icon-shadow': '0 4px 14px rgba(37, 99, 235, 0.4)',
              '--dock-hover-border': '#2563eb',
              '--dock-hover-shadow': 'rgba(37, 99, 235, 0.25)'
            }}
          >
            <div className="dock-icon-box">
              <ShoppingCart size={19} />
            </div>
            <div className="dock-info">
              <div className="dock-title-row">
                <span className="dock-title">POS Counter</span>
                <span className="dock-keycap">F2</span>
              </div>
              <div className="dock-subtitle">Scan & Quick Bill</div>
            </div>
          </div>

          {/* Dock 2: Stock Receiving (GRN) */}
          <div 
            className="dock-action-card"
            onClick={() => setCurrentPage('receiving')}
            style={{
              '--dock-icon-bg': 'linear-gradient(135deg, #10b981, #047857)',
              '--dock-icon-shadow': '0 4px 14px rgba(16, 185, 129, 0.4)',
              '--dock-hover-border': '#10b981',
              '--dock-hover-shadow': 'rgba(16, 185, 129, 0.25)'
            }}
          >
            <div className="dock-icon-box">
              <Truck size={19} />
            </div>
            <div className="dock-info">
              <div className="dock-title-row">
                <span className="dock-title">Receive Stock</span>
                <span className="dock-keycap">F4</span>
              </div>
              <div className="dock-subtitle">Vendor GRN & Pricing</div>
            </div>
          </div>

          {/* Dock 3: New Item Listing */}
          <div 
            className="dock-action-card"
            onClick={() => setCurrentPage('listing')}
            style={{
              '--dock-icon-bg': 'linear-gradient(135deg, #0284c7, #0369a1)',
              '--dock-icon-shadow': '0 4px 14px rgba(2, 132, 199, 0.4)',
              '--dock-hover-border': '#0284c7',
              '--dock-hover-shadow': 'rgba(2, 132, 199, 0.25)'
            }}
          >
            <div className="dock-icon-box">
              <FilePlus size={19} />
            </div>
            <div className="dock-info">
              <div className="dock-title-row">
                <span className="dock-title">New Listing</span>
                <span className="dock-keycap">+NEW</span>
              </div>
              <div className="dock-subtitle">List Item (No Cost)</div>
            </div>
          </div>

          {/* Dock 4: Product Master List */}
          <div 
            className="dock-action-card"
            onClick={() => setCurrentPage('products')}
            style={{
              '--dock-icon-bg': 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              '--dock-icon-shadow': '0 4px 14px rgba(139, 92, 246, 0.4)',
              '--dock-hover-border': '#8b5cf6',
              '--dock-hover-shadow': 'rgba(139, 92, 246, 0.25)'
            }}
          >
            <div className="dock-icon-box">
              <Boxes size={19} />
            </div>
            <div className="dock-info">
              <div className="dock-title-row">
                <span className="dock-title">Product Master</span>
                <span className="dock-keycap">SKUs</span>
              </div>
              <div className="dock-subtitle">Audit & Edit Catalog</div>
            </div>
          </div>

          {/* Dock 5: Barcode Thermal Stickers */}
          <div 
            className="dock-action-card"
            onClick={() => setCurrentPage('barcode')}
            style={{
              '--dock-icon-bg': 'linear-gradient(135deg, #f59e0b, #b45309)',
              '--dock-icon-shadow': '0 4px 14px rgba(245, 158, 11, 0.4)',
              '--dock-hover-border': '#f59e0b',
              '--dock-hover-shadow': 'rgba(245, 158, 11, 0.25)'
            }}
          >
            <div className="dock-icon-box">
              <Barcode size={19} />
            </div>
            <div className="dock-info">
              <div className="dock-title-row">
                <span className="dock-title">Barcode Labels</span>
                <span className="dock-keycap">F5</span>
              </div>
              <div className="dock-subtitle">Thermal Price & Rack</div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── 4. Visual Retail Intelligence & Analytics Row ───────────────── */}
      <div className="analytics-intelligence-grid">
        
        {/* Analytics Left: 7-Day Revenue Velocity Chart */}
        <div className="analytics-card">
          <div>
            <div className="analytics-header">
              <div>
                <div className="analytics-title">
                  <TrendingUp size={16} color="var(--accent-blue)" /> 7-Day Revenue Velocity
                </div>
                <div className="analytics-subtitle">
                  Daily bill volume & peak sales analysis
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  ₹{total7DaySales.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                  Weekly Volume
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="velocity-chart-wrapper">
              {salesChart.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No historical sales data available for this week.
                </div>
              ) : (
                salesChart.map((day, idx) => {
                  const isToday = idx === salesChart.length - 1;
                  const heightPct = Math.max(10, Math.round(((day.sales || 0) / maxChartSales) * 100));

                  return (
                    <div 
                      key={day.date || idx} 
                      className="velocity-bar-col"
                      onMouseEnter={() => setHoveredBar(day)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="velocity-bar-tooltip">
                        ₹{(day.sales || 0).toLocaleString('en-IN')} ({day.count || 0} bills)
                      </div>
                      <div 
                        className={`velocity-bar-pillar ${isToday ? 'today-bar' : ''}`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="velocity-bar-label" style={{ color: isToday ? 'var(--accent-emerald)' : undefined }}>
                        {day.label ? day.label.slice(0, 3) : `D${idx+1}`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span>● Green bar indicates today's ongoing tally</span>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '11px', padding: '3px 10px' }}
              onClick={() => setCurrentPage('reports')}
            >
              Full Revenue Reports &rarr;
            </button>
          </div>
        </div>

        {/* Analytics Right: Payment Breakdown & Stock Readiness */}
        <div className="analytics-card">
          <div>
            <div className="analytics-header">
              <div>
                <div className="analytics-title">
                  <Wallet size={16} color="var(--accent-emerald)" /> Operational Health Matrix
                </div>
                <div className="analytics-subtitle">
                  Payment tender mix & store stock readiness
                </div>
              </div>
            </div>

            {/* 1. Payment Mix Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700' }}>
                <span>Payment Channel Mix</span>
                <span style={{ color: 'var(--text-muted)' }}>All Invoices</span>
              </div>
              
              <div className="segmented-meter">
                <div 
                  className="segmented-slice" 
                  style={{ width: `${paymentBreakdown.upi.total > 0 ? 50 : 25}%`, background: 'var(--accent-blue)' }} 
                  title={`UPI: ₹${paymentBreakdown.upi.total.toLocaleString('en-IN')}`}
                />
                <div 
                  className="segmented-slice" 
                  style={{ width: `${paymentBreakdown.cash.total > 0 ? 40 : 50}%`, background: 'var(--accent-emerald)' }} 
                  title={`Cash: ₹${paymentBreakdown.cash.total.toLocaleString('en-IN')}`}
                />
                <div 
                  className="segmented-slice" 
                  style={{ width: '20%', background: 'var(--accent-purple)' }} 
                  title="Card / Split Payments"
                />
              </div>

              <div className="meter-legend-row" style={{ marginBottom: '16px' }}>
                <span className="meter-legend-item">
                  <span className="legend-dot" style={{ background: 'var(--accent-blue)' }} /> UPI / QR (₹{paymentBreakdown.upi.total.toLocaleString('en-IN')})
                </span>
                <span className="meter-legend-item">
                  <span className="legend-dot" style={{ background: 'var(--accent-emerald)' }} /> Cash (₹{paymentBreakdown.cash.total.toLocaleString('en-IN')})
                </span>
                <span className="meter-legend-item">
                  <span className="legend-dot" style={{ background: 'var(--accent-purple)' }} /> Card / Split
                </span>
              </div>
            </div>

            {/* 2. Stock Health Pipeline Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700' }}>
                <span>Catalog Readiness Pipeline</span>
                <span style={{ color: inStockPct > 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {inStockPct}% Sale Ready
                </span>
              </div>

              <div className="segmented-meter">
                <div 
                  className="segmented-slice" 
                  style={{ width: `${inStockPct}%`, background: 'var(--accent-emerald)' }} 
                  title={`Ready for Billing: ${inStockCount} SKUs`}
                />
                <div 
                  className="segmented-slice" 
                  style={{ width: `${pendingInwardPct}%`, background: 'var(--accent-amber)' }} 
                  title={`Pending Inward: ${pendingInward.length} SKUs`}
                />
                <div 
                  className="segmented-slice" 
                  style={{ width: `${lowStockPct}%`, background: 'var(--accent-red)' }} 
                  title={`Low Stock: ${lowStock.length} SKUs`}
                />
              </div>

              <div className="meter-legend-row">
                <span className="meter-legend-item">
                  <span className="legend-dot" style={{ background: 'var(--accent-emerald)' }} /> In Stock ({inStockCount})
                </span>
                <span className="meter-legend-item">
                  <span className="legend-dot" style={{ background: 'var(--accent-amber)' }} /> Pending GRN ({pendingInward.length})
                </span>
                <span className="meter-legend-item">
                  <span className="legend-dot" style={{ background: 'var(--accent-red)' }} /> Low Alerts ({lowStock.length})
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── 5. Dual Live Activity Streams: Goods Inward & Recent POS Bills ── */}
      <div className="activity-feeds-grid">
        
        {/* Left Feed: Recent Goods Inward (GRN) Deliveries */}
        <div className="feed-card">
          <div className="feed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={17} color="var(--accent-emerald)" />
              <span style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                Recent Goods Inward (GRN)
              </span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '800', 
                padding: '1px 6px', 
                borderRadius: '10px', 
                background: 'rgba(16, 185, 129, 0.12)', 
                color: 'var(--accent-emerald)' 
              }}>
                {grnRecords.length}
              </span>
            </div>

            <button 
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
              onClick={() => setCurrentPage('receiving')}
            >
              Receive Stock &rarr;
            </button>
          </div>

          <div className="table-responsive" style={{ maxHeight: '310px', overflowY: 'auto' }}>
            {grnRecords.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Truck size={36} style={{ opacity: 0.35, margin: '0 auto 8px', display: 'block' }} />
                No vendor deliveries recorded yet.
                <div style={{ marginTop: '10px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('receiving')}>
                    + Receive First Delivery
                  </button>
                </div>
              </div>
            ) : (
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>GRN / Invoice #</th>
                    <th>Vendor Supplier</th>
                    <th>Inward Units</th>
                    <th style={{ textAlign: 'right' }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {grnRecords.slice(0, 6).map((grn, idx) => {
                    const grnId = grn.grn_no || grn.id || `GRN-${idx + 1}`;
                    const invNo = grn.invoice_no ? `#${grn.invoice_no}` : (grn.supplier_invoice_no ? `#${grn.supplier_invoice_no}` : '');
                    const vendorName = grn.supplier_name || 'Standard Vendor';
                    const units = grn.total_units != null 
                      ? Number(grn.total_units)
                      : (Array.isArray(grn.items) ? grn.items.reduce((s, it) => s + (Number(it.qty_received ?? it.qty) || 0), 0) : 0);
                    const amount = Number(grn.total_amount ?? grn.total_cost ?? (Array.isArray(grn.items) ? grn.items.reduce((s, it) => s + ((Number(it.cost_price) || 0) * (Number(it.qty_received ?? it.qty) || 0)), 0) : 0)) || 0;
                    const dateStr = grn.received_date || grn.date || (grn.created_at ? new Date(grn.created_at).toLocaleDateString() : '');

                    return (
                      <tr key={grn.id || idx}>
                        <td>
                          <div style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                            {grnId}
                          </div>
                          {invNo && (
                            <div style={{ fontSize: '10.5px', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                              {invNo}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div 
                              className="feed-avatar-badge"
                              style={{ background: getAvatarGradient(vendorName) }}
                            >
                              {getVendorInitials(vendorName)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                                {vendorName}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                {dateStr}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            fontWeight: '800', 
                            color: 'var(--accent-emerald)', 
                            background: 'rgba(16, 185, 129, 0.1)', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '11px',
                            display: 'inline-block'
                          }}>
                            {units} Pcs
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          ₹{amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Feed: Dual Tabs (Recent POS Invoices vs Stock Reorder) */}
        <div className="feed-card">
          <div className="feed-card-header">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn btn-sm ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '11.5px', padding: '4px 11px', borderRadius: '8px' }}
                onClick={() => setActiveTab('invoices')}
              >
                <FileText size={13} /> Recent Invoices ({recentInvoices.length})
              </button>
              <button 
                className={`btn btn-sm ${activeTab === 'reorder' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '11.5px', padding: '4px 11px', borderRadius: '8px' }}
                onClick={() => setActiveTab('reorder')}
              >
                <AlertTriangle size={13} /> Reorder ({lowStock.length})
              </button>
            </div>

            <button 
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
              onClick={() => setCurrentPage(activeTab === 'invoices' ? 'invoices' : 'inventory')}
            >
              {activeTab === 'invoices' ? 'Archive →' : 'Inventory →'}
            </button>
          </div>

          <div className="table-responsive" style={{ maxHeight: '310px', overflowY: 'auto' }}>
            {activeTab === 'invoices' ? (
              recentInvoices.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <FileText size={36} style={{ opacity: 0.35, margin: '0 auto 8px', display: 'block' }} />
                  No bills completed yet today.
                  <div style={{ marginTop: '10px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('pos')}>
                      Open POS Counter
                    </button>
                  </div>
                </div>
              ) : (
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((inv, idx) => {
                      const pm = (inv.payment_method || 'CASH').toUpperCase();
                      const isUPI = pm.includes('UPI');

                      return (
                        <tr key={inv.id || inv.invoice_no || idx}>
                          <td>
                            <div style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                              {inv.invoice_no}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {inv.date ? new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                              {inv.customer_name || 'Walk-in Retail Customer'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {inv.items ? `${inv.items.length} item(s)` : '1 item'}
                            </div>
                          </td>
                          <td>
                            <span style={{ 
                              fontSize: '10.5px', 
                              fontWeight: '800', 
                              padding: '2px 7px', 
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: isUPI ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: isUPI ? 'var(--accent-blue)' : 'var(--accent-emerald)',
                              border: `1px solid ${isUPI ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                            }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isUPI ? 'var(--accent-blue)' : 'var(--accent-emerald)' }} />
                              {pm}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '13px', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                            ₹{Number(inv.grand_total || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : (
              lowStock.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--accent-emerald)', fontSize: '13px' }}>
                  <CheckCircle2 size={36} style={{ display: 'block', margin: '0 auto 8px' }} />
                  <strong>Stock is 100% Healthy!</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                    All products are stocked well above minimum reorder levels.
                  </div>
                </div>
              ) : (
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Rack Location</th>
                      <th>Units Left</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '700', fontSize: '12.5px' }}>{item.name}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          📍 {item.rack_location || item.rack_name || "Unassigned"}
                        </td>
                        <td style={{ fontWeight: '800', color: item.stock_qty === 0 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                          {item.stock_qty} {item.uom || 'Pcs'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ fontSize: '11px', padding: '3px 9px', color: 'var(--accent-emerald)', fontWeight: '700' }}
                            onClick={() => setCurrentPage('receiving')}
                          >
                            Receive &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

      </div>

      {/* ─── 6. Enterprise System Operational Status Bar ─────────────────── */}
      <div className="dashboard-system-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" /> <strong>MongoDB Atlas</strong> Replica Set Live
          </span>
          <span>•</span>
          <span>Receipt Thermal: <strong>ESC/POS 80mm Ready</strong></span>
          <span>•</span>
          <span>Store Station: <strong>#01 Flagship</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>Shortcuts:</span>
          <span className="shortcut-pill-badge">F1 Dash</span>
          <span className="shortcut-pill-badge">F2 POS</span>
          <span className="shortcut-pill-badge">F4 GRN</span>
          <span className="shortcut-pill-badge">F5 Barcode</span>
        </div>
      </div>

    </div>
  );
}
