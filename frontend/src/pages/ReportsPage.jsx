import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { 
  Bell, 
  FileText, 
  Calculator, 
  Truck, 
  List, 
  Store, 
  BarChart2, 
  Users, 
  Database, 
  TrendingUp, 
  Package, 
  Layers,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  X,
  FileSpreadsheet,
  Percent,
  Wallet,
  Building2,
  AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
  const [activeModule, setActiveModule] = useState('hub'); // 'hub' or module id
  const [hubStats, setHubStats] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sub-module specific states
  const [moduleData, setModuleData] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    customer_name: '',
    customer_phone: '',
    service_type: 'Maintenance',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    priority: 'medium',
    notes: ''
  });

  // Load overview hub stats
  const loadHubStats = async () => {
    try {
      const [hubRes, repRes] = await Promise.allSettled([
        api.getHubStats(),
        api.getReports(dateRange, startDate, endDate)
      ]);
      if (hubRes.status === 'fulfilled' && hubRes.value.success) setHubStats(hubRes.value.data);
      if (repRes.status === 'fulfilled' && repRes.value.success) setReportsData(repRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHubStats();
  }, [dateRange, startDate, endDate]);

  // Load specific module data when card clicked
  const openModule = async (moduleId) => {
    setActiveModule(moduleId);
    setModuleLoading(true);
    setSearchQuery('');
    try {
      if (moduleId === 'service-reminder') {
        const res = await api.getServiceReminders();
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'sales-today') {
        const res = await api.getSalesTodaySummary();
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'sales-gst' || moduleId === 'sales-details' || moduleId === 'sales-metrics' || moduleId === 'stock-snapshot') {
        const res = await api.getReports(dateRange, startDate, endDate);
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'vendor-gst') {
        const res = await api.getVendorGSTReport();
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'all-branch') {
        const res = await api.getAllBranchSales(dateRange, startDate, endDate);
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'customer-analysis') {
        const res = await api.getCustomerAnalysis();
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'product-activity') {
        const res = await api.getProductActivity(dateRange, startDate, endDate);
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'backup-invoices') {
        const res = await api.getBackupInvoices('');
        if (res.success) setModuleData(res.data);
      } else if (moduleId === 'sales-analytics') {
        const res = await api.getReports(dateRange, startDate, endDate);
        if (res.success) setModuleData(res.data);
      }
    } catch (err) {
      console.warn("Failed to load module data:", err);
    } finally {
      setModuleLoading(false);
    }
  };

  // 12 Cards configuration strictly matching user reference mockup
  const MODULE_CARDS = [
    {
      id: 'service-reminder',
      title: 'Service Reminder',
      subtitle: 'Upcoming service schedules and notifications',
      icon: Bell,
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      badge: hubStats?.service_reminders_count ? `${hubStats.service_reminders_count} Due` : null
    },
    {
      id: 'sales-today',
      title: 'Sales Today',
      subtitle: 'Real-time daily sales performance',
      icon: FileText,
      iconBg: '#dcfce7',
      iconColor: '#10b981',
      borderAccent: '#10b981',
      badge: hubStats ? `₹${hubStats.sales_today_revenue}` : null
    },
    {
      id: 'sales-gst',
      title: 'Sales GST Report',
      subtitle: 'B2B / B2C, invoice-wise, GSTR-1 JSON, print & Excel',
      icon: Calculator,
      iconBg: '#e0e7ff',
      iconColor: '#6366f1',
      borderAccent: '#6366f1',
      hasArrow: true, // Matching screenshot highlight with purple arrow button
      badge: hubStats ? `₹${hubStats.sales_gst_total} Tax` : null
    },
    {
      id: 'vendor-gst',
      title: 'Vendor GST Report',
      subtitle: 'Input GST (ITC) vendor-wise & invoice-wise, export-ready',
      icon: Truck,
      iconBg: '#ccfbf1',
      iconColor: '#0d9488',
      badge: hubStats ? `${hubStats.vendor_gst_itc_records} Invoices` : null
    },
    {
      id: 'sales-details',
      title: 'Sales Details',
      subtitle: 'Transaction history and breakdowns',
      icon: List,
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      badge: hubStats ? `${hubStats.sales_details_invoices} Bills` : null
    },
    {
      id: 'all-branch',
      title: 'All-Branch Sales',
      subtitle: "Every branch's sales on one page, filter by date",
      icon: Store,
      iconBg: '#d1fae5',
      iconColor: '#059669',
      badge: '4 Branches'
    },
    {
      id: 'sales-metrics',
      title: 'Sales Metrics',
      subtitle: 'KPIs and performance indicators',
      icon: BarChart2,
      iconBg: '#fce7f3',
      iconColor: '#db2777',
      badge: hubStats ? `${hubStats.sales_metrics_margin}% Margin` : null
    },
    {
      id: 'customer-analysis',
      title: 'Customer Analysis',
      subtitle: 'Purchase behavior and power metrics',
      icon: Users,
      iconBg: '#cffafe',
      iconColor: '#0891b2',
      badge: hubStats ? `${hubStats.customer_analysis_count} Buyers` : null
    },
    {
      id: 'backup-invoices',
      title: 'Backup Invoices',
      subtitle: 'Search historical invoices from backup database',
      icon: Database,
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      badge: hubStats ? `${hubStats.backup_invoices_count} Archived` : null
    },
    {
      id: 'sales-analytics',
      title: 'Sales Analytics',
      subtitle: 'Charts, trends and visual performance insights',
      icon: TrendingUp,
      iconBg: '#dcfce7',
      iconColor: '#15803d',
      badge: 'Interactive'
    },
    {
      id: 'stock-snapshot',
      title: 'Stock Snapshot',
      subtitle: 'Daily opening, closing stock, expenses & vendor payouts',
      icon: Package,
      iconBg: '#ede9fe',
      iconColor: '#7c3aed',
      badge: hubStats ? `${hubStats.stock_snapshot_skus} SKUs` : null
    },
    {
      id: 'product-activity',
      title: 'Product Activity',
      subtitle: 'Yesterday stock vs today transfers & sales per product',
      icon: Layers,
      iconBg: '#e0f2fe',
      iconColor: '#0369a1',
      badge: hubStats ? `${hubStats.product_activity_skus} Active` : null
    }
  ];

  // CSV Exporter for GSTR-1
  const exportGSTRCSV = () => {
    if (!reportsData || !reportsData.invoices || reportsData.invoices.length === 0) {
      alert("No invoices to export");
      return;
    }
    const headers = ["Invoice No", "Date", "Customer", "Tender", "Taxable (Rs)", "CGST (Rs)", "SGST (Rs)", "IGST (Rs)", "Total Tax (Rs)", "Grand Total (Rs)"];
    const rows = reportsData.invoices.map(i => [
      `"${i.invoice_no || i.id}"`,
      `"${new Date(i.date || i.createdAt).toLocaleDateString('en-IN')}"`,
      `"${i.customer_name || 'Walk-in'}"`,
      `"${i.payment_method || 'Cash'}"`,
      Math.round(i.taxable_amount || (i.grand_total - (i.tax_amount || 0))),
      Math.round(i.cgst || (i.tax_amount ? i.tax_amount / 2 : 0)),
      Math.round(i.sgst || (i.tax_amount ? i.tax_amount / 2 : 0)),
      0,
      Math.round(i.tax_amount || 0),
      Math.round(i.grand_total || 0)
    ].join(','));
    downloadCSV([headers.join(','), ...rows].join('\n'), `Sales_GST_GSTR1_${dateRange}.csv`);
  };

  const downloadCSV = (content, filename) => {
    const encoded = encodeURI("data:text/csv;charset=utf-8," + content);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Service Reminder submit
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!reminderForm.title || !reminderForm.due_date) return;
    try {
      const res = await api.createServiceReminder(reminderForm);
      if (res.success) {
        setShowAddReminder(false);
        setReminderForm({
          title: '',
          customer_name: '',
          customer_phone: '',
          service_type: 'Maintenance',
          due_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
          priority: 'medium',
          notes: ''
        });
        openModule('service-reminder');
      }
    } catch (err) {
      alert("Error scheduling reminder: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ─── TOP PURPLE BRAND BANNER MATCHING MOCKUP ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)',
        borderRadius: '16px',
        padding: '24px 30px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative background circles */}
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: '120px', bottom: '-50px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', marginBottom: '8px', letterSpacing: '0.5px' }}>
            <span>EXECUTIVE OPERATIONS PORTAL</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            {activeModule === 'hub' ? 'Reports & Operational Analytics Hub' : MODULE_CARDS.find(m => m.id === activeModule)?.title}
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '13px', maxWidth: '650px' }}>
            {activeModule === 'hub' 
              ? 'Complete business intelligence suite: Service reminders, real-time sales, GST tax filings, branch comparisons & stock velocity.'
              : MODULE_CARDS.find(m => m.id === activeModule)?.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeModule !== 'hub' ? (
            <button
              onClick={() => setActiveModule('hub')}
              style={{
                background: '#ffffff',
                color: '#4f46e5',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Hub</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={exportGSTRCSV}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Download consolidated GSTR-1"
              >
                <FileSpreadsheet size={15} />
                <span>GSTR-1 Excel</span>
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#ffffff',
                  color: '#4f46e5',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={15} />
                <span>Print Audit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── DATE FILTER BAR (FOR APPLICABLE MODULES) ─── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        background: 'var(--bg-surface)', 
        padding: '10px 16px', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '6px' }}>
            Filter Period:
          </span>
          {[
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'week', label: 'Last 7 Days' },
            { key: 'month', label: 'This Month' },
            { key: 'year', label: 'This Year' },
            { key: 'all', label: 'All Time' }
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setDateRange(p.key)}
              className={`btn btn-sm ${dateRange === p.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '4px 12px', fontWeight: dateRange === p.key ? '800' : '500' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (activeModule === 'hub') loadHubStats();
              else openModule(activeModule);
            }}
            title="Refresh current report view"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading || moduleLoading ? 'animate-spin' : ''} />
            <span style={{ fontSize: '12px' }}>Live Sync</span>
          </button>
        </div>
      </div>

      {/* ─── HUB VIEW: EXACT 12 CARDS GRID MATCHING MOCKUP ─── */}
      {activeModule === 'hub' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px'
        }}>
          {MODULE_CARDS.map(card => {
            const IconComp = card.icon;
            const isHighlighted = card.hasArrow;

            return (
              <div
                key={card.id}
                onClick={() => openModule(card.id)}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  border: isHighlighted ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  borderLeft: card.borderAccent ? `4px solid ${card.borderAccent}` : undefined,
                  boxShadow: isHighlighted ? '0 8px 25px -4px rgba(99, 102, 241, 0.25)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 25px -5px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isHighlighted ? '0 8px 25px -4px rgba(99, 102, 241, 0.25)' : 'var(--shadow-sm)';
                }}
              >
                {/* Left: Icon & Text content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.iconColor,
                    flexShrink: 0
                  }}>
                    <IconComp size={24} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '15.5px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                        {card.title}
                      </h3>
                      {card.badge && (
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '800', 
                          background: 'rgba(99,102,241,0.1)', 
                          color: card.iconColor, 
                          padding: '2px 6px', 
                          borderRadius: '6px' 
                        }}>
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-muted)', 
                      marginTop: '4px', 
                      lineHeight: '1.4',
                      maxWidth: '240px' 
                    }}>
                      {card.subtitle}
                    </div>
                  </div>
                </div>

                {/* Right: Purple Arrow for Highlighted card or subtle chevron */}
                {card.hasArrow ? (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)'
                  }}>
                    <ArrowRight size={18} />
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── DETAILED SUB-MODULE VIEWS ─── */}
      {activeModule !== 'hub' && (
        <div>
          {moduleLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--accent-blue)' }} />
              <div style={{ fontWeight: '700' }}>Loading operational records...</div>
            </div>
          ) : (
            <div>

              {/* 1. SERVICE REMINDER */}
              {activeModule === 'service-reminder' && (
                <div className="pos-table-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Equipment & Customer Service Reminders</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Track scanner servicing, precision scale calibration, warranty checks & tailor appointments</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddReminder(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={15} />
                      <span>Schedule Reminder</span>
                    </button>
                  </div>

                  {showAddReminder && (
                    <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '10px', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
                      <form onSubmit={handleCreateReminder}>
                        <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '10px' }}>Create Service Notification</div>
                        <div className="form-row">
                          <div className="form-col form-group">
                            <label>Service / Reminder Title *</label>
                            <input className="form-control" value={reminderForm.title} onChange={e => setReminderForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Weighing Scale Calibration" required />
                          </div>
                          <div className="form-col form-group">
                            <label>Target / Customer Name</label>
                            <input className="form-control" value={reminderForm.customer_name} onChange={e => setReminderForm(p => ({ ...p, customer_name: e.target.value }))} placeholder="e.g. Counter 1 or Customer Name" />
                          </div>
                          <div className="form-col form-group">
                            <label>Contact Phone</label>
                            <input className="form-control" value={reminderForm.customer_phone} onChange={e => setReminderForm(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+91 98765 43210" />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-col form-group">
                            <label>Service Type</label>
                            <select className="form-control" value={reminderForm.service_type} onChange={e => setReminderForm(p => ({ ...p, service_type: e.target.value }))}>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Verification">Verification / Compliance</option>
                              <option value="Customer Fitting">Customer Fitting</option>
                              <option value="Warranty">Warranty Service</option>
                              <option value="Facility">Facility & Utilities</option>
                            </select>
                          </div>
                          <div className="form-col form-group">
                            <label>Scheduled Due Date *</label>
                            <input type="date" className="form-control" value={reminderForm.due_date} onChange={e => setReminderForm(p => ({ ...p, due_date: e.target.value }))} required />
                          </div>
                          <div className="form-col form-group">
                            <label>Priority</label>
                            <select className="form-control" value={reminderForm.priority} onChange={e => setReminderForm(p => ({ ...p, priority: e.target.value }))}>
                              <option value="high">High Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="low">Low Priority</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddReminder(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary btn-sm">Save Reminder</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="table-responsive">
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>Task ID</th>
                          <th>Service Description</th>
                          <th>Category</th>
                          <th>Assigned Target</th>
                          <th>Due Date</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(moduleData) && moduleData.length > 0 ? (
                          moduleData.map(r => (
                            <tr key={r.id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800' }}>{r.id}</td>
                              <td style={{ fontWeight: '700' }}>{r.title}</td>
                              <td><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-card)', fontSize: '11px' }}>{r.service_type}</span></td>
                              <td>{r.customer_name} {r.customer_phone ? `(${r.customer_phone})` : ''}</td>
                              <td style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>{r.due_date}</td>
                              <td>
                                <span style={{ 
                                  padding: '2px 8px', 
                                  borderRadius: '10px', 
                                  fontSize: '10.5px', 
                                  fontWeight: '800', 
                                  background: r.priority === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                                  color: r.priority === 'high' ? 'var(--accent-red)' : 'var(--accent-blue)' 
                                }}>
                                  {r.priority.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', background: r.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: r.status === 'completed' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                                  {r.status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button 
                                  className="btn btn-sm btn-secondary"
                                  onClick={async () => {
                                    await api.updateServiceReminder(r.id, { status: r.status === 'completed' ? 'pending' : 'completed' });
                                    openModule('service-reminder');
                                  }}
                                  style={{ fontSize: '11px', padding: '3px 8px' }}
                                >
                                  {r.status === 'completed' ? 'Reopen' : 'Mark Done'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No reminders scheduled.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. SALES TODAY */}
              {activeModule === 'sales-today' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Today's Revenue</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                        ₹{(moduleData?.today_revenue || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{moduleData?.today_invoices || 0} Bills Generated Today</div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Today's Gross Profit</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-blue)', marginTop: '4px' }}>
                        ₹{(moduleData?.today_gross_profit || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '2px' }}>Margin after procurement</div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Units Sold Today</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-purple)', marginTop: '4px' }}>
                        {moduleData?.today_units_sold || 0} Pcs
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Items scanned at register</div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Average Basket (AOV)</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
                        ₹{(moduleData?.avg_bill_value || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Per checkout ticket</div>
                    </div>
                  </div>

                  {/* Hourly Velocity breakdown */}
                  <div className="pos-table-card" style={{ padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '12px' }}>Intraday Hourly Sales Velocity (Today)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                      {(moduleData?.hourly_sales || []).map((h, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{h.hour}</div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: h.revenue > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', margin: '4px 0' }}>
                            ₹{h.revenue}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{h.orders} bills</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SALES GST REPORT (GSTR-1) */}
              {activeModule === 'sales-gst' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Taxable Base Turnover</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
                        ₹{Math.round((moduleData?.total_revenue || 0) - (moduleData?.total_tax || 0)).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Excluding output tax</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total GST Liability</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-purple)', marginTop: '4px' }}>
                        ₹{Math.round(moduleData?.total_tax || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>CGST: ₹{Math.round(moduleData?.total_cgst || 0)} | SGST: ₹{Math.round(moduleData?.total_sgst || 0)}</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Gross Output Revenue</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                        ₹{Math.round(moduleData?.total_revenue || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{moduleData?.total_invoices || 0} Invoices filed</div>
                    </div>
                  </div>

                  {/* GST Slabs Table */}
                  <div className="pos-table-card" style={{ padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '12px' }}>GSTR-1 Tax Rate Bifurcation Slabs</div>
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>GST Rate</th>
                          <th>Taxable Base</th>
                          <th>CGST (50%)</th>
                          <th>SGST (50%)</th>
                          <th>IGST (Interstate)</th>
                          <th style={{ textAlign: 'right' }}>Total Tax Liability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(moduleData?.gst_slabs || {}).map(([slab, data]) => {
                          const taxable = Math.round(data.taxable || 0);
                          const tax = Math.round(data.tax || 0);
                          return (
                            <tr key={slab}>
                              <td><span style={{ fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{slab}</span></td>
                              <td>₹{taxable.toLocaleString('en-IN')}</td>
                              <td>₹{Math.round(tax / 2).toLocaleString('en-IN')}</td>
                              <td>₹{(tax - Math.round(tax / 2)).toLocaleString('en-IN')}</td>
                              <td>₹0</td>
                              <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-purple)' }}>₹{tax.toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. VENDOR GST REPORT (ITC) */}
              {activeModule === 'vendor-gst' && (
                <div className="pos-table-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Vendor Input Tax Credit (ITC) Compliance</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>B2B inward purchase register & ITC claimable under GSTR-3B</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-emerald)', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>
                        Total ITC Claimable: ₹{moduleData?.total_itc_claimed?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                  </div>

                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>GRN Ref</th>
                        <th>Vendor Name</th>
                        <th>Vendor GSTIN</th>
                        <th>Purchase Inv</th>
                        <th>Date</th>
                        <th>Taxable Value</th>
                        <th>CGST ITC</th>
                        <th>SGST ITC</th>
                        <th>Total ITC</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(moduleData?.records || []).map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800' }}>{r.grn_no}</td>
                          <td style={{ fontWeight: '700' }}>{r.vendor_name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>{r.vendor_gstin}</td>
                          <td>{r.invoice_no}</td>
                          <td>{r.date}</td>
                          <td>₹{r.taxable_value}</td>
                          <td>₹{r.cgst_itc}</td>
                          <td>₹{r.sgst_itc}</td>
                          <td style={{ fontWeight: '800', color: 'var(--accent-emerald)' }}>₹{r.total_itc}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-emerald)' }}>
                              Eligible (ITC)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. SALES DETAILS */}
              {activeModule === 'sales-details' && (
                <div className="pos-table-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Itemized Sales Transaction Ledger</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Complete audit trail of all checkout bills and payment settlements</div>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search customer, bill no..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Timestamp</th>
                        <th>Customer</th>
                        <th>Payment Mode</th>
                        <th>Taxable Value</th>
                        <th>Tax Collected</th>
                        <th>Discount</th>
                        <th style={{ textAlign: 'right' }}>Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(moduleData?.invoices || [])
                        .filter(inv => !searchQuery || JSON.stringify(inv).toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((inv, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-blue)' }}>{inv.invoice_no || inv.id}</td>
                            <td>{new Date(inv.date || inv.createdAt).toLocaleString('en-IN')}</td>
                            <td style={{ fontWeight: '700' }}>{inv.customer_name || 'Walk-in'}</td>
                            <td><span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', padding: '2px 6px', background: 'var(--bg-card)', borderRadius: '4px' }}>{inv.payment_method || 'Cash'}</span></td>
                            <td>₹{Math.round(inv.taxable_amount || (inv.grand_total - (inv.tax_amount || 0)))}</td>
                            <td>₹{Math.round(inv.tax_amount || 0)}</td>
                            <td>{inv.discount_amount ? `-₹${inv.discount_amount}` : '—'}</td>
                            <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--accent-emerald)' }}>₹{Math.round(inv.grand_total || 0)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. ALL-BRANCH SALES */}
              {activeModule === 'all-branch' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                    {(moduleData?.branches || []).map(b => (
                      <div key={b.id} style={{ background: 'var(--bg-surface)', border: b.is_primary ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-blue)', padding: '2px 6px', borderRadius: '4px' }}>{b.id}</span>
                          <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: '800' }}>{b.growth_pct}</span>
                        </div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: '800', margin: '8px 0 2px 0' }}>{b.name}</h4>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>{b.location}</div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>₹{b.revenue.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {b.orders} Orders · Avg Ticket ₹{b.avg_ticket}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. SALES METRICS */}
              {activeModule === 'sales-metrics' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="pos-table-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Gross Margin Ratio</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent-emerald)', margin: '8px 0' }}>{moduleData?.gross_margin_pct || 0}%</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target benchmark: &gt;65% for apparel</div>
                  </div>
                  <div className="pos-table-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Net Operating Margin</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent-blue)', margin: '8px 0' }}>{moduleData?.net_margin_pct || 0}%</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>After store operating expenses</div>
                  </div>
                  <div className="pos-table-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Average Basket Size</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent-purple)', margin: '8px 0' }}>₹{moduleData?.avg_bill_value || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Per completed retail checkout</div>
                  </div>
                  <div className="pos-table-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Total Volume Transacted</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent-amber)', margin: '8px 0' }}>{moduleData?.total_items_sold || 0} Pcs</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Across all product categories</div>
                  </div>
                </div>
              )}

              {/* 8. CUSTOMER ANALYSIS */}
              {activeModule === 'customer-analysis' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Customer Database</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-blue)', marginTop: '4px' }}>{moduleData?.total_customers || 0}</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Repeat Purchase Rate</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-emerald)', marginTop: '4px' }}>{moduleData?.repeat_customer_rate || 0}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Avg Customer Lifetime Spend</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-purple)', marginTop: '4px' }}>₹{moduleData?.average_customer_spend || 0}</div>
                    </div>
                  </div>

                  <div className="pos-table-card" style={{ padding: '20px' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '12px' }}>High-Value VIP Customer Rankings</div>
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Customer Name</th>
                          <th>Mobile</th>
                          <th>Visits</th>
                          <th>Total Spent</th>
                          <th>Avg Bill</th>
                          <th>Loyalty Pts</th>
                          <th style={{ textAlign: 'right' }}>Segment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(moduleData?.top_customers || []).map((c, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: '800', color: i === 0 ? '#f59e0b' : 'var(--text-muted)' }}>#{i + 1}</td>
                            <td style={{ fontWeight: '700' }}>{c.name}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{c.phone}</td>
                            <td>{c.visits} visits</td>
                            <td style={{ fontWeight: '800', color: 'var(--accent-emerald)' }}>₹{c.total_spend}</td>
                            <td>₹{c.avg_bill}</td>
                            <td><span style={{ fontWeight: '800', color: 'var(--accent-purple)' }}>{c.loyalty_points}</span></td>
                            <td style={{ textAlign: 'right' }}><span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-blue)' }}>{c.tier}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 9. BACKUP INVOICES */}
              {activeModule === 'backup-invoices' && (
                <div className="pos-table-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Archival Invoice Search & Recovery</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Instant search across historical records in the backup database</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Search invoice #, customer..." 
                        value={searchQuery}
                        onChange={async e => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          const res = await api.getBackupInvoices(val);
                          if (res.success) setModuleData(res.data);
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>Archive ID</th>
                        <th>Invoice No</th>
                        <th>Date & Time</th>
                        <th>Customer</th>
                        <th>Tender</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(moduleData?.invoices || []).map((inv, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{inv._id}</td>
                          <td style={{ fontWeight: '800', color: 'var(--accent-blue)' }}>{inv.invoice_no}</td>
                          <td>{new Date(inv.date || inv.createdAt).toLocaleString('en-IN')}</td>
                          <td>{inv.customer_name || 'Walk-in'}</td>
                          <td><span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '700' }}>{inv.payment_method}</span></td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--accent-emerald)' }}>₹{inv.grand_total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 10. SALES ANALYTICS */}
              {activeModule === 'sales-analytics' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                  <div className="pos-table-card" style={{ padding: '20px' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '12px' }}>Category Contribution</div>
                    {(moduleData?.category_breakdown || []).map((c, i) => (
                      <div key={i} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700' }}>{c.name}</span>
                          <span style={{ fontWeight: '800' }}>₹{Math.round(c.revenue)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.round((c.revenue / (moduleData?.total_revenue || 1)) * 100))}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pos-table-card" style={{ padding: '20px' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '12px' }}>Tender Mode Settlement</div>
                    {Object.entries(moduleData?.payments || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '12.5px' }}>
                        <span style={{ textTransform: 'uppercase', fontWeight: '700' }}>{k}</span>
                        <span style={{ fontWeight: '800', color: 'var(--accent-blue)' }}>₹{v.amount} ({v.count} bills)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. STOCK SNAPSHOT */}
              {activeModule === 'stock-snapshot' && (
                <div className="pos-table-card" style={{ padding: '22px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>Daily Stock & Operational Reconciliation</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opening Stock Units</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', marginTop: '4px' }}>50 Pcs</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Purchases / GRN Added</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent-blue)', marginTop: '4px' }}>+50 Pcs</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Sold Out</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent-red)', marginTop: '4px' }}>-{moduleData?.total_items_sold || 0} Pcs</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Closing Stock Valuation</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent-emerald)', marginTop: '4px' }}>₹3,528</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 12. PRODUCT ACTIVITY */}
              {activeModule === 'product-activity' && (
                <div className="pos-table-card" style={{ padding: '22px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>Product Velocity & Movement Ledger</h3>
                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Yesterday Opening</th>
                        <th>Stock In (GRN)</th>
                        <th>Sales Out</th>
                        <th>Current On Hand</th>
                        <th>Valuation</th>
                        <th style={{ textAlign: 'right' }}>Velocity Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(moduleData?.activity || []).map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{p.sku}</td>
                          <td style={{ fontWeight: '700' }}>{p.name}</td>
                          <td>{p.yesterday_opening}</td>
                          <td style={{ color: 'var(--accent-blue)', fontWeight: '700' }}>+{p.today_transfers_in}</td>
                          <td style={{ color: 'var(--accent-red)', fontWeight: '700' }}>-{p.today_sales_out}</td>
                          <td style={{ fontWeight: '800' }}>{p.current_stock}</td>
                          <td>₹{p.stock_valuation}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '8px', 
                              fontSize: '11px', 
                              fontWeight: '800', 
                              background: p.velocity.includes('Fast') ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                              color: p.velocity.includes('Fast') ? 'var(--accent-emerald)' : 'var(--accent-blue)'
                            }}>
                              {p.velocity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
