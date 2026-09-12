import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import soundFx from '../utils/sounds';
import { 
  Scan, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  UserX,
  Calculator,
  Home,
  FolderOpen,
  List,
  LayoutGrid,
  Store,
  Check,
  Info,
  Barcode,
  ShoppingBag,
  Tag,
  Sparkles,
  Zap,
  RotateCcw,
  X,
  CreditCard,
  Percent,
  Camera,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  GripVertical
} from 'lucide-react';
import CameraBarcodeScannerModal from '../components/Modals/CameraBarcodeScannerModal';

export default function PosPage() {
  const { 
    items, 
    categories,
    cart, 
    addToCart, 
    updateCartQty, 
    updateCartLineDiscount,
    removeFromCart, 
    cartTotals, 
    appliedCoupon,
    applyCoupon,
    removeCoupon, 
    cartCustomer, 
    setCartCustomer, 
    customers, 
    heldCarts,
    holdCart, 
    setModalState, 
    showToast,
    setCurrentPage,
    settings,
    sidebarOpen,
    toggleSidebar
  } = useApp();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [activePromos, setActivePromos] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  const barcodeInputRef = useRef(null);
  const mainAreaRef = useRef(null);

  // Section split width state (% allocated to Cart pane, 65% optimal default)
  const [cartWidthPercent, setCartWidthPercent] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_cart_width_pct');
      return saved ? Math.min(Math.max(parseFloat(saved), 35), 100) : 65;
    } catch {
      return 65;
    }
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDownResizer = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!mainAreaRef.current) return;
      const rect = mainAreaRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      let newPct = (relativeX / rect.width) * 100;
      if (newPct < 35) newPct = 35;
      if (newPct > 92) newPct = 100;
      setCartWidthPercent(Math.round(newPct));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('pos_cart_width_pct', String(cartWidthPercent));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, cartWidthPercent]);

  const setSplitPreset = (pct) => {
    setCartWidthPercent(pct);
    try {
      localStorage.setItem('pos_cart_width_pct', String(pct));
    } catch {}
  };

  // Load active coupons for quick selection chips
  useEffect(() => {
    api.getCoupons().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setActivePromos(res.data.filter(c => c.active));
      }
    }).catch(() => {});
  }, []);

  // Auto-focus barcode scanner gun input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard shortcut listener for POS: F8 (Customer), F12 (Submit)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F8') {
        e.preventDefault();
        setModalState({ type: 'quickCustomer', data: null });
      } else if (e.key === 'F12' && cart.length > 0) {
        e.preventDefault();
        setModalState({ type: 'payment', data: null });
      } else if (e.key === 'Escape') {
        setBarcodeInput('');
        setProductSearchInput('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, setModalState]);

  // Universal barcode processing for both handheld laser guns and mobile camera scanner
  const processBarcode = (code) => {
    const raw = String(code || '').trim();
    if (!raw) return;
    const clean = raw.toLowerCase();
    const cleanNoZeros = clean.replace(/^0+/, '');

    const matched = (items || []).find(i => {
      const bc = String(i.barcode || '').trim().toLowerCase();
      const sku = String(i.sku || '').trim().toLowerCase();
      const name = String(i.name || '').trim().toLowerCase();
      return (
        bc === clean || 
        sku === clean ||
        name === clean ||
        (cleanNoZeros && bc.replace(/^0+/, '') === cleanNoZeros)
      );
    });

    if (matched) {
      soundFx.barcodeScan();
      addToCart(matched, 1, false);
      setBarcodeInput('');
      setProductSearchInput('');
      setActiveRowIndex(cart.length);
      showToast ? showToast(`Added to bill: ${matched.name}`, 'success') : null;
    } else {
      soundFx.error();
      showToast ? showToast(`No item found matching: ${raw}`, 'warning') : alert(`No item found matching: ${raw}`);
    }
  };

  // Handle barcode scanner gun (presses Enter upon scan)
  const handleBarcodeSubmit = (e) => {
    e?.preventDefault();
    processBarcode(barcodeInput);
  };

  // Handle customer search submit
  const handleCustomerSearch = (e) => {
    e?.preventDefault();
    const clean = customerSearchInput.trim().toLowerCase();
    if (!clean) {
      setModalState({ type: 'quickCustomer', data: null });
      return;
    }

    const matched = (customers || []).find(c => 
      (c.name && String(c.name).toLowerCase().includes(clean)) ||
      (c.phone && String(c.phone).includes(clean))
    );

    if (matched) {
      setCartCustomer(matched);
      setCustomerSearchInput('');
      showToast ? showToast(`Attached customer: ${matched.name}`, 'success') : null;
    } else {
      setModalState({ type: 'quickCustomer', data: { prefill: customerSearchInput } });
    }
  };

  // Dynamic Categories List from DB + Built-in Fallbacks
  const categoryList = useMemo(() => {
    const fromDb = (categories || []).map(c => typeof c === 'object' ? c.name : c).filter(Boolean);
    const fromItems = Array.from(new Set((items || []).map(i => i.category).filter(Boolean)));
    const merged = Array.from(new Set([...fromDb, ...fromItems]));
    return merged.length > 0 ? merged : ['Shirts', 'Kurtis', 'Dresses', 'Accessories', 'Fabrics'];
  }, [categories, items]);

  // Filtered Products for Showcase Panel
  const filteredProducts = useMemo(() => {
    let list = items || [];
    // 1. Category Filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(i => String(i.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }
    // 2. Search query filter
    const query = (productSearchInput || barcodeInput).trim().toLowerCase();
    if (query) {
      list = list.filter(i => 
        String(i.name || '').toLowerCase().includes(query) ||
        String(i.barcode || '').toLowerCase().includes(query) ||
        String(i.sku || '').toLowerCase().includes(query) ||
        String(i.category || '').toLowerCase().includes(query)
      );
    }
    return list;
  }, [items, selectedCategory, productSearchInput, barcodeInput]);

  return (
    <div className="posbranch-wrapper">
      {/* ─── TOP HEADER / COMMAND BAR ─── */}
      <header className="posbranch-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={toggleSidebar}
            className="posbranch-sidebar-toggle-btn"
            title={sidebarOpen ? "Collapse Navigation for Full-Screen POS (Ctrl+B)" : "Expand Navigation (Ctrl+B)"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            <span className="sidebar-toggle-text">{sidebarOpen ? "Full POS" : "Menu"}</span>
          </button>

          {/* Brand identity */}
          <div className="posbranch-brand" onClick={() => setCurrentPage('dashboard')} title="Click to open Dashboard">
            <div className="posbranch-brand-icon">
              <Store size={20} color="#ffffff" />
            </div>
            <div>
              <div className="posbranch-brand-title">{settings?.store_name || "PAVATI OS"}</div>
              <div className="posbranch-brand-sub">POINT OF SALE · TERMINAL #01</div>
            </div>
          </div>
        </div>

        {/* Dual Search Area in Top Bar */}
        <div className="posbranch-search-group">
          {/* 1. Barcode / Product Search Gun Input */}
          <form onSubmit={handleBarcodeSubmit} className="posbranch-search-box">
            <div className="search-input-prefix">
              <Barcode size={18} color="var(--accent-emerald)" />
            </div>
            <input 
              ref={barcodeInputRef}
              type="text" 
              className="posbranch-input" 
              placeholder="Scan Barcode (Gun) or search product..." 
              value={barcodeInput} 
              onChange={e => {
                setBarcodeInput(e.target.value);
                setProductSearchInput(e.target.value);
              }} 
            />
            {barcodeInput && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => { setBarcodeInput(''); setProductSearchInput(''); }}
              >
                <X size={14} />
              </button>
            )}
            <button 
              type="button" 
              className="posbranch-camera-btn" 
              onClick={() => setCameraScannerOpen(true)} 
              title="Scan with Device/Mobile Camera"
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              <Camera size={15} />
              <span className="camera-btn-text">Camera</span>
            </button>
            <button type="submit" className="posbranch-search-btn" title="Add Item (Enter)">
              <Plus size={16} />
            </button>
          </form>

          {/* 2. Customer Selector / Quick Search */}
          <form onSubmit={handleCustomerSearch} className="posbranch-search-box customer-search-box">
            <div className="search-input-prefix">
              <User size={18} color="#94a3b8" />
            </div>
            <input 
              type="text" 
              className="posbranch-input" 
              placeholder="Customer phone or name [F8]..." 
              value={customerSearchInput} 
              onChange={e => setCustomerSearchInput(e.target.value)} 
            />
            <button type="submit" className="posbranch-search-btn customer-btn" title="Search or Register Customer">
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Customer Badge / Status Button */}
        <div className="posbranch-customer-status">
          {cartCustomer ? (
            <button 
              className="customer-status-pill customer-active"
              onClick={() => setModalState({ type: 'quickCustomer', data: null })}
              title="Customer linked to sale. Click to edit."
            >
              <span className="customer-avatar-dot">
                {cartCustomer.name.slice(0, 1).toUpperCase()}
              </span>
              <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                <span className="customer-name-label">{cartCustomer.name}</span>
                {cartCustomer.phone && (
                  <span className="customer-phone-sub">{cartCustomer.phone}</span>
                )}
              </div>
              <span 
                className="customer-clear-x" 
                onClick={(e) => { e.stopPropagation(); setCartCustomer(null); }}
                title="Remove customer from sale"
              >
                ×
              </span>
            </button>
          ) : (
            <button 
              className="customer-status-pill customer-none"
              onClick={() => setModalState({ type: 'quickCustomer', data: null })}
              title="Click to attach or register customer [F8]"
            >
              <UserX size={14} />
              <span>Walk-in Customer</span>
              <span className="customer-kbd-hint">F8</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN VIEWPORT: 2 COLUMNS (CART BILLING & PRODUCT SHOWCASE) ─── */}
      <div className="posbranch-main-area" ref={mainAreaRef}>
        {/* Left Pane: Current Bill / Cart Table */}
        <div 
          className="posbranch-cart-pane"
          style={{
            flex: 'none',
            width: cartWidthPercent >= 100 ? '100%' : `calc(${cartWidthPercent}% - 6px)`
          }}
        >
          {/* Cart Header with Section Sizer Presets */}
          <div className="cart-pane-header">
            <div className="cart-pane-title-group">
              <Receipt size={16} color="var(--accent-indigo)" />
              <span className="cart-pane-heading">Current Sale Bill</span>
              <span className="cart-count-badge">{cart.length} line{cart.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="section-sizer-pills">
              <span className="sizer-label">Split:</span>
              <button 
                type="button" 
                className={`sizer-btn ${cartWidthPercent === 50 ? 'active' : ''}`}
                onClick={() => setSplitPreset(50)}
                title="Equal 50:50 Split"
              >
                50:50
              </button>
              <button 
                type="button" 
                className={`sizer-btn ${cartWidthPercent === 65 ? 'active' : ''}`}
                onClick={() => setSplitPreset(65)}
                title="Balanced 65:35 Split (Recommended)"
              >
                65:35
              </button>
              <button 
                type="button" 
                className={`sizer-btn ${cartWidthPercent === 75 ? 'active' : ''}`}
                onClick={() => setSplitPreset(75)}
                title="Wide 75:25 Split"
              >
                75:25
              </button>
              <button 
                type="button" 
                className={`sizer-btn ${cartWidthPercent >= 100 ? 'active' : ''}`}
                onClick={() => setSplitPreset(cartWidthPercent >= 100 ? 65 : 100)}
                title={cartWidthPercent >= 100 ? "Restore Catalog" : "Full-Width Cart (100%)"}
              >
                {cartWidthPercent >= 100 ? "Show Catalog" : "100% Cart"}
              </button>
            </div>
          </div>

          <div className="posbranch-table-container">
            <table className="posbranch-table">
              <thead>
                <tr>
                  <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: '140px' }}>ITEM / DESCRIPTION</th>
                  <th style={{ width: '58px', textAlign: 'center' }}>GST%</th>
                  <th style={{ width: '76px', textAlign: 'right' }}>RATE</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>DISC%</th>
                  <th style={{ width: '88px', textAlign: 'center' }}>QTY</th>
                  <th style={{ width: '84px', textAlign: 'right' }}>TOTAL</th>
                  <th style={{ width: '36px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="posbranch-table-empty">
                      <div className="empty-cart-prompt">
                        <div className="empty-cart-halo">
                          <Scan size={36} color="var(--accent-indigo)" />
                        </div>
                        <div className="empty-cart-title">Cart is ready for items</div>
                        <div className="empty-cart-sub">
                          Scan barcode with gun, or click any product tile on the right to add
                        </div>
                        <div className="empty-cart-shortcuts">
                          <span className="shortcut-chip"><kbd>Enter</kbd> Scan</span>
                          <span className="shortcut-chip"><kbd>F8</kbd> Customer</span>
                          <span className="shortcut-chip"><kbd>F12</kbd> Pay</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const isActive = activeRowIndex === idx;
                    return (
                      <tr 
                        key={item.id} 
                        className={`cart-table-row ${isActive ? 'row-active' : ''}`}
                        onClick={() => setActiveRowIndex(idx)}
                      >
                        {/* Index */}
                        <td className="row-index">{idx + 1}</td>

                        {/* Product info with HSN badge */}
                        <td className="row-product">
                          <div className="product-title-row">
                            <span className="product-name">{item.name}</span>
                            {item.hsn_code && (
                              <span className="hsn-mini-tag" title="HSN / SAC Code">HSN:{item.hsn_code}</span>
                            )}
                          </div>
                          {item.barcode && (
                            <div className="product-barcode-sub">
                              {item.barcode} {item.sku ? `· ${item.sku}` : ''}
                            </div>
                          )}
                        </td>

                        {/* GST % */}
                        <td className="row-gst">
                          <span className="gst-rate-pill">
                            {(item.gst_rate || 12)}%
                          </span>
                        </td>

                        {/* Price */}
                        <td className="row-price">
                          ₹{Number(item.selling_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Disc % */}
                        <td className="row-disc">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            className="table-disc-input"
                            value={item.discount_percent || 0}
                            onChange={e => updateCartLineDiscount(item.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            title="Line Discount %"
                          />
                        </td>

                        {/* Quantity Stepper */}
                        <td className="row-qty">
                          <div className="qty-control-box">
                            <button 
                              type="button"
                              className="qty-btn"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, -1); }}
                              title="Decrease Qty"
                            >
                              <Minus size={12} />
                            </button>
                            <input 
                              type="number" 
                              min="1" 
                              className="qty-direct-input" 
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                const delta = val - item.qty;
                                updateCartQty(item.id, delta);
                              }}
                              onClick={e => e.stopPropagation()}
                            />
                            <button 
                              type="button"
                              className="qty-btn"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, 1); }}
                              title="Increase Qty"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Line Total */}
                        <td className="row-total">
                          ₹{Number(item.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Action Trash */}
                        <td className="row-action">
                          <button 
                            type="button"
                            className="row-delete-btn"
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                            title="Remove line item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Coupon & Promotional Discount Strip */}
          <div className="posbranch-coupon-bar">
            <div className="coupon-bar-left">
              <Tag size={15} color="var(--accent-purple)" />
              <span className="coupon-bar-label">Store Coupon:</span>
              {appliedCoupon ? (
                <div className="applied-coupon-pill">
                  <span>✓ {appliedCoupon.code}</span>
                  <span className="coupon-saved-val">(-₹{cartTotals.couponDiscount})</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="coupon-remove-btn"
                    title="Remove coupon"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!couponInput) return;
                    setApplyingCoupon(true);
                    await applyCoupon(couponInput);
                    setApplyingCoupon(false);
                    setCouponInput('');
                  }}
                  className="coupon-apply-form"
                >
                  <input
                    type="text"
                    placeholder="PROMO CODE"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    className="coupon-code-input"
                  />
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary coupon-submit-btn"
                    disabled={applyingCoupon || cart.length === 0}
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Active Offers Chips */}
            {!appliedCoupon && activePromos.length > 0 && (
              <div className="promo-chips-container">
                <span className="promo-hint-label">Quick Offers:</span>
                {activePromos.slice(0, 3).map(p => (
                  <button
                    key={p.id || p.code}
                    type="button"
                    onClick={() => applyCoupon(p.code)}
                    disabled={cart.length === 0}
                    className="promo-chip-btn"
                    title={`Click to apply coupon ${p.code}`}
                  >
                    {p.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Resizer Splitter Handle */}
        {cartWidthPercent < 100 && (
          <div 
            className={`posbranch-resizer-handle ${isDragging ? 'is-dragging' : ''}`}
            onMouseDown={handleMouseDownResizer}
            title="Click & Drag to resize sections horizontally"
          >
            <div className="resizer-knob">
              <GripVertical size={14} />
            </div>
          </div>
        )}

        {/* Right Pane: Live Product Showcase & Category Ribbon */}
        {cartWidthPercent < 100 && (
          <div 
            className="posbranch-products-pane"
            style={{
              flex: 'none',
              width: `calc(${100 - cartWidthPercent}% - 6px)`
            }}
          >
            {/* Header with Title & View Mode Toggle */}
            <div className="products-pane-header">
            <div className="products-pane-title-group">
              <ShoppingBag size={17} color="var(--accent-indigo)" />
              <span className="products-pane-heading">Product Catalog</span>
              <span className="products-count-badge">{filteredProducts.length} items</span>
            </div>
            <div className="view-mode-toggle">
              <button 
                type="button"
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Card View"
              >
                <LayoutGrid size={15} />
              </button>
              <button 
                type="button"
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Compact List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>

          {/* Interactive Category Ribbon / Pills with Distinct Jewel Tones */}
          <div className="category-pills-ribbon">
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'ALL' ? 'cat-pill-active' : ''}`}
              style={selectedCategory === 'ALL' ? 
                { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)' } :
                { background: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.28)' }
              }
              onClick={() => setSelectedCategory('ALL')}
            >
              All Items ({items.length})
            </button>
            {categoryList.map(catName => {
              const count = (items || []).filter(i => String(i.category || '').toLowerCase() === catName.toLowerCase()).length;
              const isActive = selectedCategory.toLowerCase() === catName.toLowerCase();
              const c = catName.toLowerCase();
              
              let styleObj;
              if (isActive) {
                if (c.includes('shirt')) styleObj = { background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.45)' };
                else if (c.includes('trouser') || c.includes('pant') || c.includes('jean')) styleObj = { background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)' };
                else if (c.includes('kurti') || c.includes('dress') || c.includes('ethnic') || c.includes('saree')) styleObj = { background: 'linear-gradient(135deg, #db2777 0%, #f43f5e 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.45)' };
                else if (c.includes('suit') || c.includes('blazer')) styleObj = { background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.45)' };
                else styleObj = { background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)' };
              } else {
                if (c.includes('shirt')) styleObj = { background: 'rgba(6, 182, 212, 0.12)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.28)' };
                else if (c.includes('trouser') || c.includes('pant') || c.includes('jean')) styleObj = { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.28)' };
                else if (c.includes('kurti') || c.includes('dress') || c.includes('ethnic') || c.includes('saree')) styleObj = { background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.28)' };
                else if (c.includes('suit') || c.includes('blazer')) styleObj = { background: 'rgba(139, 92, 246, 0.12)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.28)' };
                else styleObj = { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.28)' };
              }

              return (
                <button
                  key={catName}
                  type="button"
                  className={`cat-pill ${isActive ? 'cat-pill-active' : ''}`}
                  style={styleObj}
                  onClick={() => setSelectedCategory(catName)}
                >
                  {catName} ({count})
                </button>
              );
            })}
          </div>

          {/* Products Container */}
          <div className="products-pane-body">
            {filteredProducts.length === 0 ? (
              <div className="products-empty-state">
                <div className="barcode-mint-box">
                  <Barcode size={36} color="var(--accent-indigo)" />
                </div>
                <h4 className="products-empty-title">No products found</h4>
                <p className="products-empty-sub">
                  No items match category "{selectedCategory}" or search query "{productSearchInput}".
                </p>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ marginTop: '12px' }}
                  onClick={() => { setSelectedCategory('ALL'); setProductSearchInput(''); setBarcodeInput(''); }}
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* High-End Tactile Product Card Grid */
              <div className="products-card-grid">
                {filteredProducts.map(prod => {
                  const isZeroStock = !prod.stock_qty || prod.stock_qty <= 0;
                  const isLowStock = prod.stock_qty > 0 && prod.stock_qty <= (prod.reorder_level || 5);

                  return (
                    <div 
                      key={prod.id || prod._id} 
                      className={`pos-product-card ${isZeroStock ? 'card-out-of-stock' : ''}`}
                      onClick={() => addToCart(prod, 1)}
                      style={{ cursor: 'pointer' }}
                      title={`Click to add ${prod.name} to bill`}
                    >
                      <div className="card-top-row">
                        <span className="card-category-tag">{prod.category || 'General'}</span>
                        {isZeroStock ? (
                          <span className="stock-pill stock-zero">0 Stock</span>
                        ) : isLowStock ? (
                          <span className="stock-pill stock-low">{prod.stock_qty} left</span>
                        ) : (
                          <span className="stock-pill stock-ok">{prod.stock_qty} in stock</span>
                        )}
                      </div>

                      <div className="card-product-title">{prod.name}</div>
                      
                      <div className="card-meta-row">
                        <span className="card-barcode">{prod.barcode}</span>
                        <span className="card-gst-tag">GST {prod.gst_rate || 12}%</span>
                      </div>

                      <div className="card-bottom-row">
                        <div className="card-price">
                          ₹{Number(prod.selling_price || 0).toLocaleString('en-IN')}
                        </div>
                        <button 
                          type="button" 
                          className="card-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1);
                          }}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Compact High-Density List View */
              <div className="products-dense-list">
                {filteredProducts.map(prod => {
                  const isZeroStock = !prod.stock_qty || prod.stock_qty <= 0;
                  return (
                    <div 
                      key={prod.id || prod._id} 
                      className="product-dense-item"
                      onClick={() => addToCart(prod, 1)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="dense-item-info">
                        <div className="dense-name">{prod.name}</div>
                        <div className="dense-sub">{prod.barcode} · {prod.category || 'General'}</div>
                      </div>
                      <div className="dense-item-right">
                        <span className={`stock-pill ${isZeroStock ? 'stock-zero' : 'stock-ok'}`}>
                          {prod.stock_qty || 0} left
                        </span>
                        <span className="dense-price">
                          ₹{Number(prod.selling_price || 0).toLocaleString('en-IN')}
                        </span>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-secondary dense-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1);
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* ─── BOTTOM DOCK / CHECKOUT ACTION BAR ─── */}
      <footer className="posbranch-footer">
        {/* Left Action Buttons */}
        <div className="posbranch-nav-actions">
          <button 
            type="button"
            className="posbranch-nav-btn"
            onClick={() => setCurrentPage('dashboard')}
            title="Dashboard Overview [F1]"
          >
            <Home size={18} />
            <span>HOME</span>
          </button>

          <button 
            type="button"
            className="posbranch-nav-btn"
            onClick={() => setModalState({ type: 'calculator', data: null })}
            title="Calculator"
          >
            <Calculator size={18} />
            <span>CALC</span>
          </button>

          <button 
            type="button"
            className="posbranch-nav-btn"
            onClick={() => setModalState({ type: 'quickCustomer', data: null })}
            title="Select Customer [F8]"
          >
            <User size={18} />
            <span>CUST</span>
          </button>

          <button 
            type="button"
            className="posbranch-nav-btn hold-btn"
            onClick={() => holdCart()}
            disabled={cart.length === 0}
            title="Park Current Bill on Hold"
          >
            <div className="hold-circle-icon">
              <span className="hold-dot"></span>
            </div>
            <span>HOLD</span>
          </button>

          <button 
            type="button"
            className="posbranch-nav-btn holds-btn"
            onClick={() => setModalState({ type: 'holds', data: null })}
            title="View Held Bills"
          >
            <FolderOpen size={18} color="#f59e0b" />
            <span>HOLDS</span>
            {heldCarts.length > 0 && (
              <span className="holds-counter-badge">{heldCarts.length}</span>
            )}
          </button>
        </div>

        {/* Center & Right: KPI Indicators & Primary Glowing Checkout Button */}
        <div className="posbranch-checkout-summary">
          <div className="posbranch-kpi-totals">
            <div className="kpi-group">
              <div className="kpi-label">ITEMS</div>
              <div className="kpi-value">{cart.length}</div>
            </div>
            <div className="kpi-group">
              <div className="kpi-label">TOTAL QTY</div>
              <div className="kpi-value">{cartTotals.itemCount}</div>
            </div>
            {cartTotals.totalDiscountAmount > 0 && (
              <div className="kpi-group kpi-saved">
                <div className="kpi-label">SAVED</div>
                <div className="kpi-value saved-val">
                  -₹{cartTotals.totalDiscountAmount.toFixed(2)}
                </div>
              </div>
            )}
            <div className="kpi-group kpi-total">
              <div className="kpi-label">NET PAYABLE</div>
              <div className="kpi-value total-luminous">
                ₹{cartTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="submit-sale-btn magnetic-checkout-btn"
            disabled={cart.length === 0}
            onClick={() => setModalState({ type: 'payment', data: null })}
            title="Proceed to Payment & Print Tax Invoice [F12]"
          >
            <CreditCard size={18} />
            <span>PAY &amp; PRINT BILL</span>
            <span className="checkout-kbd-badge">F12</span>
          </button>
        </div>
      </footer>

      {/* Camera Barcode Scanner Modal for Mobile / Tablet / Desktop Camera */}
      <CameraBarcodeScannerModal 
        isOpen={cameraScannerOpen} 
        onClose={() => setCameraScannerOpen(false)} 
        onDetected={processBarcode} 
      />
    </div>
  );
}
