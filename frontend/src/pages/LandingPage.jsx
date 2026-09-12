import React from 'react';
import { useApp } from '../context/AppContext';
import './LandingPage.css';
import { 
  Zap, 
  QrCode, 
  Receipt, 
  Boxes, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Layers, 
  MonitorCheck 
} from 'lucide-react';

export default function LandingPage() {
  const { setCurrentPage, theme, toggleTheme, currentUser, loginAsGuest, logoutUser } = useApp();

  return (
    <div className="landing-viewport">
      {/* Top Glass Navbar */}
      <nav className="landing-navbar">
        <div className="landing-brand" onClick={() => setCurrentPage('landing')}>
          <div className="landing-brand-logo">
            <Sparkles size={20} />
          </div>
          <div className="landing-brand-text">
            <span className="landing-brand-title">PAVATI OS</span>
            <span className="landing-brand-tag">Custom POS Solution</span>
          </div>
        </div>

        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#terminal" className="landing-nav-link">Terminal Preview</a>
          <a href="#compliance" className="landing-nav-link">GST Compliance</a>
          <a href="#upi" className="landing-nav-link">Dynamic UPI</a>
        </div>

        <div className="landing-nav-actions">
          {/* Theme Switcher */}
          <button 
            type="button"
            onClick={toggleTheme} 
            className="landing-theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#4f46e5" />}
          </button>

          {currentUser ? (
            <>
              <button 
                type="button" 
                className="landing-btn-signin"
                onClick={() => setCurrentPage('dashboard')}
              >
                Go to Dashboard
              </button>
              <button 
                type="button" 
                className="landing-btn-cta"
                onClick={() => setCurrentPage('pos')}
              >
                Open POS <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className="landing-btn-signin"
                onClick={() => setCurrentPage('login')}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className="landing-btn-cta"
                onClick={() => setCurrentPage('login')}
              >
                Get Started <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-pill-badge">
          <Sparkles size={14} /> The Intelligent Retail & Fashion OS • 2026 Edition
        </div>

        <h1 className="landing-hero-headline">
          The Operating System for <span className="landing-hero-gradient-text">Modern Retail & Fashion Boutiques</span>
        </h1>

        <p className="landing-hero-subtitle">
          Engineered for high-velocity checkout, split-second dynamic UPI QR generation, 
          real-time multi-counter inventory tracking, and automated Indian GST tax invoicing.
        </p>

        <div className="landing-hero-actions">
          <button 
            type="button"
            className="landing-btn-hero-primary"
            onClick={() => setCurrentPage(currentUser ? 'pos' : 'login')}
          >
            <Zap size={18} /> Launch POS Counter
          </button>

          {!currentUser && (
            <button 
              type="button"
              className="landing-btn-hero-secondary"
              onClick={() => setCurrentPage('login')}
            >
              Sign In with Google / Email
            </button>
          )}

          <button 
            type="button"
            className="landing-btn-hero-demo"
            onClick={loginAsGuest}
            title="Launch instant demo without password"
          >
            ⚡ Instant Cashier Demo
          </button>
        </div>

        {/* Live Terminal Preview Card */}
        <div className="landing-showcase-frame" id="terminal">
          <div className="landing-showcase-header">
            <div className="landing-dots">
              <span className="landing-dot landing-dot-red" />
              <span className="landing-dot landing-dot-yellow" />
              <span className="landing-dot landing-dot-green" />
            </div>
            <div className="landing-preview-title">
              <MonitorCheck size={16} color="var(--accent-emerald)" />
              PAVATI OS Live Cashier Terminal • Station #01 Online
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-indigo)' }}>
              v2.0 Neo-FinTech
            </div>
          </div>

          <div className="landing-kpi-row">
            <div className="landing-kpi-card">
              <div className="landing-kpi-label">Checkout Velocity</div>
              <div className="landing-kpi-val">0.04s</div>
              <div className="landing-kpi-sub">⚡ Instant Barcode Hit</div>
            </div>

            <div className="landing-kpi-card">
              <div className="landing-kpi-label">UPI QR Generation</div>
              <div className="landing-kpi-val">Real-Time</div>
              <div className="landing-kpi-sub">📱 Dynamic NPCI Specs</div>
            </div>

            <div className="landing-kpi-card">
              <div className="landing-kpi-label">Tax Compliance</div>
              <div className="landing-kpi-val">100% GST</div>
              <div className="landing-kpi-sub">🧾 CGST / SGST / IGST Split</div>
            </div>

            <div className="landing-kpi-card">
              <div className="landing-kpi-label">Stock Accuracy</div>
              <div className="landing-kpi-val">Live Sync</div>
              <div className="landing-kpi-sub">📦 GRN Inward Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features" id="features">
        <div className="landing-section-header">
          <div className="landing-section-tag">Enterprise Capabilities</div>
          <h2 className="landing-section-title">Everything your retail business needs to dominate</h2>
          <p className="landing-section-desc">
            Designed from the ground up for apparel, fashion, lifestyle stores, and multi-category retailers.
          </p>
        </div>

        <div className="landing-features-grid">
          {/* Card 1: Touch POS */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-box" style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5' }}>
              <Zap size={26} />
            </div>
            <h3 className="landing-feature-title">Touch-First POS Counter</h3>
            <p className="landing-feature-desc">
              Scan barcodes effortlessly with hardware scanners or built-in camera scanning. 
              Keyboard hotkeys (F1–F10), cart holds, and sound feedback streamline your sales floor.
            </p>
            <div className="landing-feature-tags">
              <span className="landing-feature-tag-chip">F1-F10 Hotkeys</span>
              <span className="landing-feature-tag-chip">Cart Holds</span>
              <span className="landing-feature-tag-chip">Camera Barcode</span>
            </div>
          </div>

          {/* Card 2: Dynamic UPI */}
          <div className="landing-feature-card" id="upi">
            <div className="landing-feature-icon-box" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
              <QrCode size={26} />
            </div>
            <h3 className="landing-feature-title">Dynamic UPI QR Engine</h3>
            <p className="landing-feature-desc">
              Zero manual typing or EDC mistakes. Each bill generates an instant dynamic UPI QR code 
              with the exact payable amount embedded. Customers scan and pay in seconds.
            </p>
            <div className="landing-feature-tags">
              <span className="landing-feature-tag-chip">NPCI Standard</span>
              <span className="landing-feature-tag-chip">Zero EDC Fees</span>
              <span className="landing-feature-tag-chip">Sound Feedback</span>
            </div>
          </div>

          {/* Card 3: GST Invoices */}
          <div className="landing-feature-card" id="compliance">
            <div className="landing-feature-icon-box" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <Receipt size={26} />
            </div>
            <h3 className="landing-feature-title">Indian GST Act Compliant</h3>
            <p className="landing-feature-desc">
              Automatic Intra-State (CGST + SGST) vs Inter-State (IGST) tax calculation based on GSTIN. 
              Print professional 80mm/58mm thermal receipts or full A4 GST Tax Invoices.
            </p>
            <div className="landing-feature-tags">
              <span className="landing-feature-tag-chip">HSN Itemization</span>
              <span className="landing-feature-tag-chip">A4 Tax Invoices</span>
              <span className="landing-feature-tag-chip">Credit Notes</span>
            </div>
          </div>

          {/* Card 4: Inventory & Receiving */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-box" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>
              <Boxes size={26} />
            </div>
            <h3 className="landing-feature-title">Stock Inwarding (GRN)</h3>
            <p className="landing-feature-desc">
              Record vendor inwarding with cost prices, batch numbers, and rack locations. 
              Automatic low-stock reorder alerts ensure you never run out of top sellers.
            </p>
            <div className="landing-feature-tags">
              <span className="landing-feature-tag-chip">Vendor GRN</span>
              <span className="landing-feature-tag-chip">Reorder Alerts</span>
              <span className="landing-feature-tag-chip">Barcode Printing</span>
            </div>
          </div>

          {/* Card 5: Khata & Customers */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-box" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' }}>
              <Users size={26} />
            </div>
            <h3 className="landing-feature-title">Customer CRM & Khata</h3>
            <p className="landing-feature-desc">
              Maintain customer purchase histories, store credit, loyalty points, and digital Khata ledgers. 
              Instant WhatsApp bill sharing and SMS receipts.
            </p>
            <div className="landing-feature-tags">
              <span className="landing-feature-tag-chip">Store Khata</span>
              <span className="landing-feature-tag-chip">Loyalty Points</span>
              <span className="landing-feature-tag-chip">WhatsApp Sharing</span>
            </div>
          </div>

          {/* Card 6: Executive Analytics */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-box" style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#e11d48' }}>
              <TrendingUp size={26} />
            </div>
            <h3 className="landing-feature-title">Executive Sales Velocity</h3>
            <p className="landing-feature-desc">
              Analyze daily revenue, peak sales hours, product category performance, and profit margins. 
              Export one-click GSTR-1, GSTR-3B, and accountant audit spreadsheets.
            </p>
            <div className="landing-feature-tags">
              <span className="landing-feature-tag-chip">Revenue Velocity</span>
              <span className="landing-feature-tag-chip">Profit Margins</span>
              <span className="landing-feature-tag-chip">GSTR Exports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-cta-banner">
        <h2>Ready to transform your retail counter?</h2>
        <p>
          Experience lightning-fast billing, seamless GST compliance, and total inventory control with PAVATI OS.
        </p>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="landing-btn-hero-primary" 
            style={{ background: '#ffffff', color: '#1e1b4b', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
            onClick={() => setCurrentPage(currentUser ? 'pos' : 'login')}
          >
            Start Using PAVATI OS <ArrowRight size={16} />
          </button>
          <button 
            type="button" 
            className="landing-btn-hero-secondary"
            style={{ background: 'transparent', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={loginAsGuest}
          >
            ⚡ Test As Guest Cashier
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-brand" onClick={() => setCurrentPage('landing')}>
            <div className="landing-brand-logo" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
              <Sparkles size={14} />
            </div>
            <span className="landing-brand-title" style={{ fontSize: '15px' }}>PAVATI OS</span>
          </div>

          <div className="landing-footer-copy">
            © {new Date().getFullYear()} PAVATI OS — Enterprise Retail Point of Sale Suite. All rights reserved.
          </div>

          <div className="landing-footer-links">
            <span className="landing-footer-link" onClick={() => setCurrentPage('pos')}>Terminal</span>
            <span className="landing-footer-link" onClick={() => setCurrentPage('inventory')}>Stock</span>
            <span className="landing-footer-link" onClick={() => setCurrentPage('login')}>Sign In</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
