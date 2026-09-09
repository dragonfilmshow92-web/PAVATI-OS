import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { 
  ShoppingBag, 
  Search, 
  Home, 
  Check, 
  Printer, 
  Copy, 
  Trash2,
  Plus
} from 'lucide-react';

export default function ReceivingPage() {
  const { 
    items, 
    suppliers, 
    refreshItems, 
    refreshSuppliers,
    refreshGRN, 
    setModalState, 
    setCurrentPage, 
    showToast,
    settings
  } = useApp();

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Inward details
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState(() => `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [defaultMarkup, setDefaultMarkup] = useState(false);
  const defaultMarkupPercent = 25; // 25% markup default

  // Receiving cart lines
  // Receiving cart lines
  const [receivingCart, setReceivingCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedVendor = suppliers.find(s => s.id === selectedVendorId) || null;

  const addProductToReceiving = (item) => {
    if (!item) return;
    const targetId = item.id || item._id;
    const targetBarcode = item.barcode ? String(item.barcode).trim() : '';

    const existingIndex = receivingCart.findIndex(line => 
      (targetId && line.id && line.id === targetId) ||
      (targetBarcode && line.barcode && line.barcode === targetBarcode)
    );

    if (existingIndex > -1) {
      setReceivingCart(prev => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          qty: (Number(next[existingIndex].qty) || 0) + 1
        };
        return next;
      });
    } else {
      const cost = Number(item.cost_price != null && item.cost_price !== '' ? item.cost_price : (Number(item.selling_price) * 0.7 || 0));
      const markup = defaultMarkup ? defaultMarkupPercent : 0;
      const selling = defaultMarkup ? parseFloat((cost * (1 + markup / 100)).toFixed(2)) : (Number(item.selling_price) || parseFloat((cost * 1.25).toFixed(2)));
      const mrp = Number(item.mrp) || parseFloat((selling * 1.25).toFixed(2));

      setReceivingCart(prev => [
        ...prev,
        {
          id: targetId,
          name: item.name,
          barcode: item.barcode || '',
          sku: item.sku || ('SKU-' + (item.barcode ? item.barcode.slice(-6) : Date.now().toString().slice(-6))),
          cost_price: parseFloat(cost.toFixed(2)),
          markup_percent: markup,
          selling_price: parseFloat(selling.toFixed(2)),
          mrp: parseFloat(mrp.toFixed(2)),
          gst_rate: Number(item.gst_rate) || 12,
          qty: 1,
          rack_name: item.rack_location || item.rack_name || "Rack A-01 / Shelf 1"
        }
      ]);
    }
    setSearchQuery('');
    setShowDropdown(false);
    showToast(`Added "${item.name}" to receiving cart`, 'info');
  };

  // Auto-select first vendor if none selected
  useEffect(() => {
    if (!selectedVendorId && suppliers && suppliers.length > 0) {
      setSelectedVendorId(suppliers[0].id);
    }
  }, [suppliers, selectedVendorId]);

  // On mount: refresh data and pick up pending item from ListingPage
  useEffect(() => {
    if (refreshItems) refreshItems();
    if (refreshSuppliers) refreshSuppliers();

    try {
      const pendingStr = sessionStorage.getItem('pending_receive_item');
      if (pendingStr) {
        sessionStorage.removeItem('pending_receive_item');
        const item = JSON.parse(pendingStr);
        if (item) {
          addProductToReceiving(item);
          showToast(`Staged newly listed item "${item.name}" into receiving cart!`, 'success');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDefaultMarkupToggle = (checked) => {
    setDefaultMarkup(checked);
    if (checked) {
      setReceivingCart(prev => prev.map(line => {
        const cost = Number(line.cost_price) || 0;
        const selling = parseFloat((cost * (1 + defaultMarkupPercent / 100)).toFixed(2));
        const mrp = parseFloat((selling * 1.25).toFixed(2));
        return {
          ...line,
          markup_percent: defaultMarkupPercent,
          selling_price: selling,
          mrp: mrp
        };
      }));
    }
  };

  // Search filter (derived during render)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return (items || []).filter(i => 
      String(i.name || '').toLowerCase().includes(q) ||
      String(i.barcode || '').toLowerCase().includes(q) ||
      String(i.sku || '').toLowerCase().includes(q)
    );
  }, [searchQuery, items]);

  const handleSearchSubmit = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    if (searchResults.length > 0) {
      addProductToReceiving(searchResults[0]);
      return;
    }

    // Direct barcode query as fallback
    try {
      const bcRes = await api.getItemByBarcode(q);
      if (bcRes && bcRes.success && bcRes.data) {
        addProductToReceiving(bcRes.data);
        return;
      }
      const itemRes = await api.getItems({ search: q });
      if (itemRes && itemRes.success && Array.isArray(itemRes.data) && itemRes.data.length > 0) {
        addProductToReceiving(itemRes.data[0]);
        return;
      }
      showToast(`No item found for "${q}". Use Quick List to add it!`, 'warning');
      setShowDropdown(true);
    } catch (e) {
      showToast(`Search error: ${e.message}`, 'danger');
    }
  };

  const updateLineField = (index, field, value) => {
    setReceivingCart(prev => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };

      if (field === 'cost_price' || field === 'markup_percent') {
        if (defaultMarkup || field === 'markup_percent') {
          const cost = Number(field === 'cost_price' ? value : updated.cost_price) || 0;
          const pct = Number(field === 'markup_percent' ? value : updated.markup_percent) || 0;
          const selling = parseFloat((cost * (1 + pct / 100)).toFixed(2));
          updated.selling_price = selling;
          if (!updated.mrp || Number(updated.mrp) < selling) {
            updated.mrp = parseFloat((selling * 1.25).toFixed(2));
          }
        }
      }

      next[index] = updated;
      return next;
    });
  };

  const removeLine = (index) => {
    setReceivingCart(prev => prev.filter((_, i) => i !== index));
  };

  // Summary calculations
  const totalItemsCount = receivingCart.length;
  const totalUnits = receivingCart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const subtotal = receivingCart.reduce((sum, item) => sum + ((Number(item.cost_price) || 0) * (Number(item.qty) || 0)), 0);
  const gstTotal = receivingCart.reduce((sum, item) => {
    const lineCost = (Number(item.cost_price) || 0) * (Number(item.qty) || 0);
    const gstRate = Number(item.gst_rate) || 0;
    return sum + (lineCost * (gstRate / 100));
  }, 0);
  const grandTotal = subtotal + gstTotal;

  // Handle Receive Stock submit
  const handleReceiveStock = async () => {
    if (!selectedVendor) {
      showToast("Please select a vendor before receiving stock", "warning");
      return;
    }
    if (receivingCart.length === 0 || totalUnits <= 0) {
      showToast("Cart is empty! Please search and add products to receive.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.receiveGoods({
        supplier_id: selectedVendor.id,
        supplier_name: selectedVendor.name,
        invoice_no: invoiceNo,
        received_date: invoiceDate,
        date: invoiceDate,
        items: receivingCart.map(line => ({
          id: line.id,
          item_id: line.id,
          name: line.name,
          item_name: line.name,
          barcode: line.barcode,
          sku: line.sku,
          qty: Number(line.qty) || 1,
          qty_received: Number(line.qty) || 1,
          cost_price: Number(line.cost_price) || 0,
          selling_price: Number(line.selling_price) || 0,
          mrp: Number(line.mrp) || 0,
          gst_rate: Number(line.gst_rate) || 12,
          rack_name: line.rack_name || "Rack A-01 / Shelf 1",
          line_total: parseFloat(((Number(line.cost_price) || 0) * (Number(line.qty) || 1)).toFixed(2))
        })),
        total_amount: parseFloat(grandTotal.toFixed(2)),
        notes: `Stock received under Invoice #${invoiceNo}`
      });

      if (res && (res.success || res.data)) {
        showToast(`Successfully received ${totalUnits} units of stock!`, "success");
        await refreshItems();
        await refreshGRN();
        setReceivingCart([]);
        setInvoiceNo(`INV-${String(Math.floor(Math.random() * 9000) + 1000)}`);
      } else {
        showToast(res?.message || "Failed to receive stock", "danger");
      }
    } catch (err) {
      showToast("Failed to receive stock: " + err.message, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyData = () => {
    if (receivingCart.length === 0) {
      showToast("No data to copy", "info");
      return;
    }
    const tsvHeader = "Barcode\tProduct\tQty\tCost Price\tSelling Price\tMRP\tGST%\tTotal Cost\n";
    const tsvRows = receivingCart.map(line => 
      `${line.barcode}\t${line.name}\t${line.qty}\t${line.cost_price}\t${line.selling_price}\t${line.mrp}\t${line.gst_rate}\t${(line.cost_price * line.qty).toFixed(2)}`
    ).join("\n");

    navigator.clipboard.writeText(tsvHeader + tsvRows)
      .then(() => showToast("Copied receiving stock data to clipboard (TSV format)", "success"))
      .catch(() => showToast("Could not access clipboard", "warning"));
  };

  const handlePrintThermal = () => {
    if (receivingCart.length === 0) {
      showToast("Add items to receiving cart first to print thermal labels", "info");
      return;
    }
    setModalState({
      type: 'thermalPrint',
      data: {
        vendor: selectedVendor,
        invoiceNo: invoiceNo,
        date: invoiceDate,
        items: receivingCart
      }
    });
  };

  return (
    <div className="stock-receiving-page">
      {/* Top Action Bar matching Screenshot 2 */}
      <div className="receiving-top-bar">
        <div className="receiving-title-block">
          <div className="receiving-icon-badge">
            <ShoppingBag size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <h2 className="receiving-title">Stock Receiving</h2>
            <div className="receiving-subtitle">{settings.store_name || "RETAIL STUDIO"}</div>
          </div>
        </div>

        {/* Stat Summary Pills */}
        <div className="receiving-summary-pills">
          <div className="stat-pill">
            <span className="pill-label">ITEMS</span>
            <span className="pill-value">{totalItemsCount}</span>
          </div>
          <div className="stat-pill">
            <span className="pill-label">QTY</span>
            <span className="pill-value">{totalUnits}</span>
          </div>
          <div className="stat-pill">
            <span className="pill-label">SUBTOTAL</span>
            <span className="pill-value">{subtotal.toFixed(2)}</span>
          </div>
          <div className="stat-pill">
            <span className="pill-label">GST</span>
            <span className="pill-value">{gstTotal.toFixed(2)}</span>
          </div>
          <div className="stat-pill grand-total-pill">
            <span className="pill-label">GRAND TOTAL</span>
            <span className="pill-value">{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Markup checkbox */}
        <label className="receiving-markup-checkbox">
          <input 
            type="checkbox" 
            checked={defaultMarkup} 
            onChange={e => handleDefaultMarkupToggle(e.target.checked)} 
          />
          <span>Default Markup</span>
        </label>

        {/* Search Box */}
        <div className="receiving-search-container">
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              className="form-control receiving-search-input" 
              placeholder="Scan barcode or product name..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => { if (searchResults.length > 0 || searchQuery.trim()) setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
            />
            {showDropdown && (
              <div className="receiving-search-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map(item => (
                    <div 
                      key={item.id || item._id || item.barcode} 
                      className="dropdown-result-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addProductToReceiving(item);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        addProductToReceiving(item);
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Barcode: {item.barcode} · Current Stock: {item.stock_qty ?? 0}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--accent-blue)' }}>
                          ₹{item.cost_price || item.selling_price}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                          + Add to Inward
                        </div>
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim() ? (
                  <div style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      No product matches <strong>"{searchQuery}"</strong>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px',
                        padding: '8px 12px',
                        fontWeight: '700'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setModalState({
                          type: 'product',
                          data: {
                            barcode: searchQuery.trim(),
                            isNew: true,
                            onSuccess: (newItem) => addProductToReceiving(newItem)
                          }
                        });
                        setShowDropdown(false);
                      }}
                    >
                      <Plus size={15} /> Quick List This Product
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <button 
            type="button" 
            className="btn btn-primary receiving-search-btn"
            onClick={handleSearchSubmit}
          >
            <Search size={15} /> Search
          </button>
        </div>

        {/* Home button */}
        <button 
          className="btn btn-secondary home-action-btn"
          onClick={() => setCurrentPage('dashboard')}
          title="Return to Dashboard"
        >
          <Home size={18} />
        </button>
      </div>

      {/* Main Two-Column Viewport */}
      <div className="receiving-layout-grid">
        {/* Left Sidebar */}
        <div className="receiving-sidebar-pane">
          {/* VENDOR Section */}
          <div className="receiving-card vendor-card">
            <div className="card-header-dot">
              <span className="dot dot-green"></span>
              <span className="card-header-text">VENDOR</span>
            </div>

            {selectedVendor ? (
              <div className="vendor-selected-badge">
                <div style={{ fontWeight: '800', fontSize: '13px' }}>{selectedVendor.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{selectedVendor.phone || 'No phone'}</div>
              </div>
            ) : (
              <div className="vendor-alert-empty">
                <div className="alert-minus-icon">-</div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '12px' }}>No vendor selected</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select below</div>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label className="sidebar-field-label" style={{ margin: 0 }}>Vendor name</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px', height: '22px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  onClick={() => setModalState({ type: 'supplier', data: null })}
                >
                  <Plus size={11} /> New Vendor
                </button>
              </div>
              <select 
                className="form-control"
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
              >
                <option value="">— Select vendor —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="sidebar-field-label">GST Number</label>
              <input 
                type="text" 
                className="form-control disabled-input" 
                value={selectedVendor?.gstin || "22AAAAA0000A1Z5"} 
                readOnly 
              />
            </div>
          </div>

          {/* INVOICE Section */}
          <div className="receiving-card invoice-card">
            <div className="card-header-dot">
              <span className="dot dot-blue"></span>
              <span className="card-header-text">INVOICE</span>
            </div>

            <div className="form-group">
              <label className="sidebar-field-label">Invoice No</label>
              <input 
                type="text" 
                className="form-control" 
                value={invoiceNo} 
                onChange={e => setInvoiceNo(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="sidebar-field-label">Invoice Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={invoiceDate} 
                onChange={e => setInvoiceDate(e.target.value)} 
              />
            </div>
          </div>

          {/* Bottom Sidebar Action Buttons */}
          <div className="sidebar-actions-container">
            <div className="sidebar-secondary-btns">
              <button 
                type="button" 
                className="btn btn-secondary sidebar-action-btn"
                onClick={handlePrintThermal}
              >
                <Printer size={15} /> Print Thermal
              </button>
              <button 
                type="button" 
                className="btn btn-secondary sidebar-action-btn"
                onClick={handleCopyData}
              >
                <Copy size={15} /> Copy Data
              </button>
            </div>

            <button 
              type="button" 
              className="btn btn-primary receive-stock-btn"
              disabled={receivingCart.length === 0 || !selectedVendorId || submitting}
              onClick={handleReceiveStock}
            >
              <Check size={18} />
              {submitting ? "Receiving Stock..." : "Receive Stock"}
            </button>
          </div>
        </div>

        {/* Right Main Panel: Receiving Cart */}
        <div className="receiving-cart-pane">
          <div className="cart-pane-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Receiving Cart</h3>
            </div>
            <span className="cart-count-pill">{receivingCart.length} items</span>
          </div>

          {receivingCart.length === 0 ? (
            /* Empty State matching Screenshot 2 */
            <div className="receiving-empty-cart">
              <div className="empty-bag-icon-box">
                <ShoppingBag size={36} color="var(--accent-blue)" />
              </div>
              <h4 className="empty-cart-title">Your cart is empty</h4>
              <p className="empty-cart-desc">Search for a product above to start receiving stock</p>
            </div>
          ) : (
            /* Table of received goods lines */
            <div className="receiving-cart-table-wrapper">
              <table className="pos-table receiving-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product & Barcode</th>
                    <th>Cost Price (₹)</th>
                    <th>Markup %</th>
                    <th>Selling (₹)</th>
                    <th>MRP (₹)</th>
                    <th>GST%</th>
                    <th>Quantity</th>
                    <th>Line Total</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receivingCart.map((line, idx) => {
                    const lineCost = (Number(line.cost_price) || 0) * (Number(line.qty) || 0);
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: '800', fontSize: '13px' }}>{line.name}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {line.barcode}
                          </div>
                        </td>
                        <td style={{ width: '110px' }}>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="form-control table-input" 
                            value={line.cost_price} 
                            onChange={e => updateLineField(idx, 'cost_price', e.target.value)} 
                          />
                        </td>
                        <td style={{ width: '85px' }}>
                          <input 
                            type="number" 
                            className="form-control table-input" 
                            value={line.markup_percent} 
                            onChange={e => updateLineField(idx, 'markup_percent', e.target.value)} 
                          />
                        </td>
                        <td style={{ width: '110px' }}>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="form-control table-input" 
                            style={{ color: 'var(--accent-blue)', fontWeight: '700' }}
                            value={line.selling_price} 
                            onChange={e => updateLineField(idx, 'selling_price', e.target.value)} 
                          />
                        </td>
                        <td style={{ width: '110px' }}>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="form-control table-input" 
                            value={line.mrp} 
                            onChange={e => updateLineField(idx, 'mrp', e.target.value)} 
                          />
                        </td>
                        <td style={{ width: '75px', textAlign: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '12px' }}>{line.gst_rate}%</span>
                        </td>
                        <td style={{ width: '90px' }}>
                          <input 
                            type="number" 
                            min="1" 
                            className="form-control table-input" 
                            style={{ fontWeight: '800', textAlign: 'center' }}
                            value={line.qty} 
                            onChange={e => updateLineField(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))} 
                          />
                        </td>
                        <td style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          ₹{lineCost.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm delete-row-btn"
                            onClick={() => removeLine(idx)}
                            title="Remove line"
                          >
                            <Trash2 size={14} color="var(--accent-red)" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
