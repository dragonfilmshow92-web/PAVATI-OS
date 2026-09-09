import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
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
  Store,
  Check,
  Info,
  Barcode,
  ShoppingBag,
  Tag
} from 'lucide-react';

export default function PosPage() {
  const { 
    items, 
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
    settings
  } = useApp();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [activePromos, setActivePromos] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const barcodeInputRef = useRef(null);

  const [showAllItems, setShowAllItems] = useState(false);

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

  // Handle barcode scanner gun (presses Enter upon scan)
  const handleBarcodeSubmit = (e) => {
    e?.preventDefault();
    const raw = barcodeInput.trim();
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
      addToCart(matched, 1);
      setBarcodeInput('');
      setProductSearchInput('');
      setActiveRowIndex(cart.length); // highlight newly added
    } else {
      showToast(`No item found matching: ${raw}`, 'warning');
    }
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
      showToast(`Attached customer: ${matched.name}`, 'success');
    } else {
      setModalState({ type: 'quickCustomer', data: { prefill: customerSearchInput } });
    }
  };

  // Products filter for right panel
  const searchFilter = (productSearchInput || barcodeInput).toLowerCase().trim();
  const searchResults = searchFilter 
    ? (items || []).filter(item => 
        String(item.name || '').toLowerCase().includes(searchFilter) ||
        String(item.barcode || '').includes(searchFilter) ||
        String(item.sku || '').toLowerCase().includes(searchFilter) ||
        (item.category && String(item.category).toLowerCase().includes(searchFilter))
      ) 
    : (showAllItems ? (items || []) : []);

  return (
    <div className="posbranch-wrapper">
      {/* ─── TOP HEADER (Matching Screenshot 1) ─── */}
      <header className="posbranch-header">
        {/* Brand identity */}
        <div className="posbranch-brand" onClick={() => setCurrentPage('dashboard')} title="Click to open Dashboard">
          <div className="posbranch-brand-icon">
            <Store size={22} color="#ffffff" />
          </div>
          <div>
            <div className="posbranch-brand-title">{settings.store_name || "RETAIL SUITE"}</div>
            <div className="posbranch-brand-sub">POINT OF SALE</div>
          </div>
        </div>

        {/* Dual Search Area in Top Bar */}
        <div className="posbranch-search-group">
          {/* 1. Barcode / Product Search */}
          <form onSubmit={handleBarcodeSubmit} className="posbranch-search-box">
            <div className="search-input-prefix">
              <Barcode size={18} color="var(--accent-emerald)" />
            </div>
            <input 
              ref={barcodeInputRef}
              type="text" 
              className="posbranch-input" 
              placeholder="Scan or search" 
              value={barcodeInput} 
              onChange={e => {
                setBarcodeInput(e.target.value);
                setProductSearchInput(e.target.value);
              }} 
            />
            <button type="submit" className="posbranch-search-btn" title="Search Product">
              <Search size={16} />
            </button>
          </form>

          {/* 2. Customer Name or Mobile Search */}
          <form onSubmit={handleCustomerSearch} className="posbranch-search-box">
            <div className="search-input-prefix">
              <User size={18} color="#94a3b8" />
            </div>
            <input 
              type="text" 
              className="posbranch-input" 
              placeholder="Customer name or mobile" 
              value={customerSearchInput} 
              onChange={e => setCustomerSearchInput(e.target.value)} 
            />
            <button type="submit" className="posbranch-search-btn" title="Search Customer">
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
              title="Change customer"
            >
              <User size={14} />
              <span>{cartCustomer.name}</span>
              <span 
                className="customer-clear-x" 
                onClick={(e) => { e.stopPropagation(); setCartCustomer(null); }}
                title="Remove customer from bill"
              >
                ×
              </span>
            </button>
          ) : (
            <button 
              className="customer-status-pill customer-none"
              onClick={() => setModalState({ type: 'quickCustomer', data: null })}
              title="Click to select or register customer"
            >
              <UserX size={14} />
              <span>No customer</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN VIEWPORT (2 COLUMNS: CART TABLE & PRODUCTS) ─── */}
      <div className="posbranch-main-area">
        {/* Left: Cart / Current Bill Table */}
        <div className="posbranch-cart-pane">
          <div className="posbranch-table-container">
            <table className="posbranch-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>PRODUCT</th>
                  <th style={{ width: '90px' }}>GST%</th>
                  <th style={{ width: '90px' }}>PRICE</th>
                  <th style={{ width: '80px' }}>DISC%</th>
                  <th style={{ width: '110px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      QUANTITY <Info size={12} color="var(--text-muted)" />
                    </span>
                  </th>
                  <th style={{ width: '100px', textAlign: 'right' }}>TOTAL</th>
                  <th style={{ width: '50px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="posbranch-table-empty">
                      <div className="empty-cart-prompt">
                        <Scan size={38} color="#94a3b8" style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>Active bill is empty</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Scan a barcode with the scanner gun or search for an item above
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
                        className={isActive ? 'row-active' : ''}
                        onClick={() => setActiveRowIndex(idx)}
                      >
                        {/* Index */}
                        <td className="row-index">{idx + 1}</td>

                        {/* Product with orange badge */}
                        <td className="row-product">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="product-name">{item.name}</span>
                            <span className="product-badge-dot" title="Standard Retail Item"></span>
                          </div>
                        </td>

                        {/* GST % */}
                        <td className="row-gst">
                          {(item.gst_rate || 18).toFixed(2)}
                        </td>

                        {/* Price */}
                        <td className="row-price">
                          {(item.selling_price || 0).toFixed(2)}
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
                          />
                        </td>

                        {/* Quantity Stepper / Box */}
                        <td className="row-qty">
                          <div className="qty-control-box">
                            <button 
                              className="qty-btn"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, -1); }}
                            >
                              <Minus size={11} />
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
                              className="qty-btn"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, 1); }}
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </td>

                        {/* Total */}
                        <td className="row-total">
                          {Number(item.subtotal || 0).toFixed(2)}
                        </td>

                        {/* Action Trashcan */}
                        <td className="row-action">
                          <button 
                            className="row-delete-btn"
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Coupon & Promo Discount Bar */}
          <div className="posbranch-coupon-bar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-color)',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
              <Tag size={15} color="var(--accent-purple)" />
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Promo / Coupon:
              </span>
              {appliedCoupon ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: 'var(--accent-emerald)'
                }}>
                  <span>✓ {appliedCoupon.code}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>(-₹{cartTotals.couponDiscount})</span>
                  <button
                    onClick={removeCoupon}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-red)',
                      cursor: 'pointer',
                      padding: '0 2px',
                      fontSize: '14px',
                      fontWeight: '900',
                      lineHeight: 1
                    }}
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
                  style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                >
                  <input
                    type="text"
                    placeholder="Enter CODE"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    style={{
                      height: '28px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      width: '120px',
                      textTransform: 'uppercase'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={applyingCoupon || cart.length === 0}
                    style={{ height: '28px', padding: '0 10px', fontSize: '11px', fontWeight: '800' }}
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Promo Pills */}
            {!appliedCoupon && activePromos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '300px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Offers:</span>
                {activePromos.slice(0, 3).map(p => (
                  <button
                    key={p.id || p.code}
                    type="button"
                    onClick={() => applyCoupon(p.code)}
                    disabled={cart.length === 0}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px dashed var(--accent-purple)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--accent-purple)',
                      cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                    title={`Click to apply ${p.code} (${p.type === 'percent' ? p.value + '%' : '₹' + p.value} off)`}
                  >
                    {p.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Products Sidebar Panel */}
        <div className="posbranch-products-pane">
          <div className="products-pane-tab">
            <ShoppingBag size={16} color="#6366f1" />
            <span>Products</span>
          </div>

          <div className="products-pane-body">
            {searchFilter && searchResults.length > 0 ? (
              /* Live matching items list when user scans or searches */
              <div className="products-search-results">
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>
                  {searchResults.length} matched product{searchResults.length === 1 ? '' : 's'}:
                </div>
                {searchResults.map(prod => {
                  const isUnreceived = !prod.stock_qty || prod.stock_qty <= 0;

                  return (
                    <div 
                      key={prod.id} 
                      className="product-card-tile"
                      style={{
                        opacity: isUnreceived ? 0.65 : 1,
                        cursor: isUnreceived ? 'not-allowed' : 'pointer',
                        borderLeft: isUnreceived ? '3px solid var(--accent-amber)' : '3px solid transparent'
                      }}
                      onClick={() => addToCart(prod, 1)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '2px' }}>{prod.name}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {prod.barcode} · {isUnreceived ? (
                            <span style={{ color: 'var(--accent-amber)', fontWeight: '700' }}>⚠️ Unreceived (0 Stock)</span>
                          ) : (
                            <span>Stock: {prod.stock_qty} {prod.uom || 'Pcs'}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '900', fontSize: '14px', color: 'var(--text-primary)' }}>
                          ₹{prod.selling_price || 0}
                        </div>
                        {isUnreceived ? (
                          <div style={{ fontSize: '10px', color: 'var(--accent-amber)', fontWeight: '700' }}>
                            Need Receiving
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                            + Add to Bill
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Default Empty State matching Screenshot 1 */
              <div className="products-empty-state">
                <div className="barcode-mint-box">
                  <Barcode size={38} color="#0d9488" />
                </div>
                <h4 className="products-empty-title">No products yet</h4>
                <p className="products-empty-sub">
                  Scan a barcode or type in the search box to load products here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM DOCK (Matching Screenshot 1) ─── */}
      <footer className="posbranch-footer">
        {/* Left Action Buttons */}
        <div className="posbranch-nav-actions">
          <button 
            className="posbranch-nav-btn"
            onClick={() => setCurrentPage('dashboard')}
            title="Dashboard Overview"
          >
            <Home size={18} />
            <span>HOME</span>
          </button>

          <button 
            className="posbranch-nav-btn"
            onClick={() => setModalState({ type: 'calculator', data: null })}
            title="Quick Calculator"
          >
            <Calculator size={18} />
            <span>CALC</span>
          </button>

          <button 
            className="posbranch-nav-btn"
            onClick={() => setModalState({ type: 'quickCustomer', data: null })}
            title="Customer Selector"
          >
            <User size={18} />
            <span>CUST</span>
          </button>

          <button 
            className={`posbranch-nav-btn ${showAllItems ? 'btn-active' : ''}`}
            onClick={() => setShowAllItems(prev => !prev)}
            title="Toggle Product Catalog Panel"
          >
            <List size={18} />
            <span>ITEMS</span>
          </button>

          <button 
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

        {/* Center / Right: Submit Sale & Totals */}
        <div className="posbranch-checkout-summary">
          <button 
            className="submit-sale-btn"
            disabled={cart.length === 0}
            onClick={() => setModalState({ type: 'payment', data: null })}
          >
            <Check size={18} />
            <span>SUBMIT SALE</span>
          </button>

          <div className="posbranch-kpi-totals">
            <div className="kpi-group">
              <div className="kpi-label">ITEMS</div>
              <div className="kpi-value">{cart.length}</div>
            </div>
            <div className="kpi-group">
              <div className="kpi-label">QTY</div>
              <div className="kpi-value">{cartTotals.itemCount}</div>
            </div>
            {cartTotals.totalDiscountAmount > 0 && (
              <div className="kpi-group" style={{ color: 'var(--accent-emerald)' }}>
                <div className="kpi-label" style={{ color: 'var(--accent-emerald)' }}>SAVED</div>
                <div className="kpi-value" style={{ color: 'var(--accent-emerald)', fontWeight: '800' }}>
                  -₹{cartTotals.totalDiscountAmount.toFixed(2)}
                </div>
              </div>
            )}
            <div className="kpi-group kpi-total">
              <div className="kpi-label">TOTAL</div>
              <div className="kpi-value total-teal">
                ₹{cartTotals.grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
