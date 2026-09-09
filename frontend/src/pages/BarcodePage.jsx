import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import BarcodeSticker from '../components/BarcodeSticker';
import { 
  Barcode, 
  Printer, 
  Sliders, 
  CheckSquare, 
  Square, 
  Tag, 
  DollarSign, 
  Package, 
  MapPin, 
  Scan, 
  Edit3, 
  Save, 
  ExternalLink,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function BarcodePage() {
  const { items, setItems, settings, showToast, addToCart, setCurrentPage } = useApp();
  const [selectedItems, setSelectedItems] = useState(items.map(i => i.id));
  const [stickerCopies, setStickerCopies] = useState(2);
  const [stickerSize, setStickerSize] = useState(() => {
    return localStorage.getItem('pos_barcode_sticker_size') || 'citizen-2up';
  }); // 'citizen-2up' | 'citizen-1up' | 'standard' | 'compact' | 'shelf'
  const [printBorder, setPrintBorder] = useState(() => {
    return localStorage.getItem('pos_barcode_print_border') === 'true';
  });
  const [filterCategory, setFilterCategory] = useState('all');

  const handleSetStickerSize = (size) => {
    setStickerSize(size);
    localStorage.setItem('pos_barcode_sticker_size', size);
  };

  const handleTogglePrintBorder = (checked) => {
    setPrintBorder(checked);
    localStorage.setItem('pos_barcode_print_border', String(checked));
  };

  // Sticker Content Display Toggles
  const [showStoreName, setShowStoreName] = useState(true);
  const [showMRP, setShowMRP] = useState(true);
  const [showSalePrice, setShowSalePrice] = useState(true);
  const [showDiscount, setShowDiscount] = useState(true);
  const [showStock, setShowStock] = useState(true);
  const [showRack, setShowRack] = useState(true);
  const [showSku, setShowSku] = useState(true);

  // Quick Price & Inventory Editor State
  const [showQuickEditor, setShowQuickEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ mrp: 0, selling_price: 0, stock_qty: 0, rack_location: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Scanner Tester State
  const [testScanInput, setTestScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const testScanRef = useRef(null);

  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(items.map(i => i.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const filteredItems = items.filter(i => filterCategory === 'all' || i.category === filterCategory);

  const printStickers = () => {
    window.print();
  };

  // Sound effect synthesizer for scanner confirmation
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  };

  // Handle Scanner Gun Test Input
  const handleTestScan = async (e) => {
    e.preventDefault();
    const clean = String(testScanInput).trim();
    if (!clean) return;

    let matched = items.find(i => 
      String(i.barcode).trim() === clean || 
      String(i.barcode).trim().replace(/^0+/, '') === clean.replace(/^0+/, '') ||
      String(i.sku || '').trim().toLowerCase() === clean.toLowerCase()
    );

    if (!matched) {
      try {
        const res = await api.getItemByBarcode(clean);
        if (res.success && res.data) matched = res.data;
      } catch (err) {}
    }

    if (matched) {
      playBeep();
      setScanResult(matched);
      showToast(`⚡ Barcode Verified: ${matched.name} (₹${matched.selling_price})`, 'success');
      setTestScanInput('');
    } else {
      setScanResult(null);
      showToast(`⚠️ No product found for barcode: "${clean}"`, 'warning');
    }
  };

  // Open Quick Edit for an item
  const startEditing = (item) => {
    setEditingItem(item);
    setEditForm({
      mrp: item.mrp ?? item.selling_price ?? 0,
      selling_price: item.selling_price ?? 0,
      stock_qty: item.stock_qty ?? 0,
      rack_location: item.rack_location || item.rack_name || 'Rack A-01'
    });
    setShowQuickEditor(true);
  };

  // Save updated price/stock to MongoDB
  const saveQuickEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const updates = {
        mrp: Number(editForm.mrp),
        selling_price: Number(editForm.selling_price),
        stock_qty: Number(editForm.stock_qty),
        rack_location: editForm.rack_location,
        rack_name: editForm.rack_location
      };
      const res = await api.updateItem(editingItem.id, updates);
      if (res.success && res.data) {
        setItems(prev => prev.map(it => it.id === editingItem.id ? { ...it, ...res.data } : it));
        showToast(`Updated "${editingItem.name}" prices & stock in MongoDB!`, 'success');
        setEditingItem(null);
        setShowQuickEditor(false);
      }
    } catch (err) {
      showToast("Error updating product: " + err.message, "danger");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      {/* Top Controls (Hidden during print) */}
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Barcode size={22} color="var(--accent-blue)" />
              Barcode Sticker & Shelf Price Tag Studio
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Generate thermal stickers with Store Name, MRP, Sale Price, Stock Qty, Rack Location, and Code128 Barcodes. Fully verified for POS scanning.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentPage('pos')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Scan size={16} /> Open POS Counter
            </button>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={printStickers} 
              disabled={selectedItems.length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <Printer size={18} /> Print {selectedItems.length * stickerCopies} Stickers
            </button>
          </div>
        </div>

        {/* Configuration Box */}
        <div style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)', 
          padding: '16px', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Row 1: Copies, Sizes, Actions */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700' }}>Copies per item:</label>
              <input 
                type="number" 
                className="form-control" 
                style={{ width: '70px', padding: '6px 10px', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}
                value={stickerCopies} 
                onChange={e => setStickerCopies(Math.max(1, Number(e.target.value)))} 
                min="1" 
                max="100" 
              />
            </div>

            {/* Sticker Size Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)' }}>Sticker Template:</span>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${stickerSize === 'citizen-2up' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSetStickerSize('citizen-2up')}
                  style={{ padding: '3px 10px', fontSize: '12px', fontWeight: '700' }}
                >
                  🖨️ Citizen 2-Up (2 Parallel: 50×25.4mm)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${stickerSize === 'citizen-1up' || stickerSize === 'citizen' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSetStickerSize('citizen-1up')}
                  style={{ padding: '3px 10px', fontSize: '12px' }}
                >
                  🏷️ Citizen 1-Up (Single: 101.6×25.4mm)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${stickerSize === 'standard' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSetStickerSize('standard')}
                  style={{ padding: '3px 10px', fontSize: '12px' }}
                >
                  🏷️ Standard (50×30mm)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${stickerSize === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSetStickerSize('compact')}
                  style={{ padding: '3px 10px', fontSize: '12px' }}
                >
                  💎 Compact (38×25mm)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${stickerSize === 'shelf' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSetStickerSize('shelf')}
                  style={{ padding: '3px 10px', fontSize: '12px' }}
                >
                  🛒 Shelf Tag (65×40mm)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={selectAll}>Select All</button>
              <button className="btn btn-secondary btn-sm" onClick={clearSelection}>Clear</button>
            </div>
          </div>

          {/* Citizen CL-E321 2-Up Parallel Roll Guide */}
          {stickerSize === 'citizen-2up' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🖨️</span>
                <div>
                  <strong style={{ color: 'var(--accent-emerald)' }}>Citizen 2-Up Roll Active:</strong> 101.6 mm roll with <strong>2 Parallel Stickers side-by-side</strong> (~48-50 mm × 25.4 mm each).
                </div>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span>Roll Width: <strong style={{ color: 'var(--text-primary)' }}>101.6 mm (4")</strong></span>
                <span>Row Height: <strong style={{ color: 'var(--text-primary)' }}>25.4 mm (1")</strong></span>
                <span>Chrome Paper Size: <strong style={{ color: 'var(--text-primary)' }}>4×1 in (or 101.6×25.4mm)</strong></span>
                <span>Margins: <strong style={{ color: 'var(--accent-emerald)' }}>None</strong></span>
              </div>
            </div>
          )}

          {/* Citizen CL-E321 1-Up Single Wide Guide */}
          {(stickerSize === 'citizen-1up' || stickerSize === 'citizen') && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🖨️</span>
                <div>
                  <strong style={{ color: 'var(--accent-blue)' }}>Citizen 1-Up Wide Active:</strong> Single 101.6 mm × 25.4 mm (4" × 1") Continuous Thermal Label.
                </div>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span>Driver: <strong style={{ color: 'var(--text-primary)' }}>Citizen CL-E321</strong></span>
                <span>Paper Size: <strong style={{ color: 'var(--text-primary)' }}>101.6 × 25.4 mm (4×1 in)</strong></span>
                <span>Margins: <strong style={{ color: 'var(--accent-emerald)' }}>None</strong></span>
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)' }}></div>

          {/* Row 2: Content Field Toggles */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)' }}>
              Sticker Fields:
            </span>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <input type="checkbox" checked={showStoreName} onChange={e => setShowStoreName(e.target.checked)} />
              Store Name ({settings.store_name || "TIORAS"})
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--accent-purple, #a855f7)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showMRP} onChange={e => setShowMRP(e.target.checked)} />
              MRP Price
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--accent-emerald)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSalePrice} onChange={e => setShowSalePrice(e.target.checked)} />
              Sale / Offer Price
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <input type="checkbox" checked={showDiscount} onChange={e => setShowDiscount(e.target.checked)} />
              Discount (Save ₹ / %)
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showStock} onChange={e => setShowStock(e.target.checked)} />
              Inventory Stock Qty
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <input type="checkbox" checked={showRack} onChange={e => setShowRack(e.target.checked)} />
              Rack Location
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSku} onChange={e => setShowSku(e.target.checked)} />
              SKU Code
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={printBorder} onChange={e => handleTogglePrintBorder(e.target.checked)} />
              Print Label Border
            </label>
          </div>
        </div>

        {/* Barcode Scanner Gun Test Bar */}
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.05)', 
          border: '1px solid rgba(59, 130, 246, 0.25)', 
          borderRadius: 'var(--radius-md)', 
          padding: '12px 16px', 
          marginBottom: '16px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
            <Scan size={18} color="var(--accent-blue)" />
            <span style={{ fontSize: '13px', fontWeight: '800' }}>Hardware Scanner Gun Test:</span>
          </div>

          <form onSubmit={handleTestScan} style={{ flex: '1', minWidth: '240px', display: 'flex', gap: '8px' }}>
            <input 
              ref={testScanRef}
              type="text" 
              className="form-control" 
              style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}
              placeholder="Scan printed barcode or enter 8906014765985..." 
              value={testScanInput} 
              onChange={e => setTestScanInput(e.target.value)} 
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ fontWeight: '700' }}>
              Test Scan
            </button>
          </form>

          {scanResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--accent-emerald)' }}>
              <CheckCircle size={16} color="var(--accent-emerald)" />
              <span style={{ fontSize: '12px', fontWeight: '800' }}>{scanResult.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MRP: ₹{scanResult.mrp}</span>
              <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent-emerald)' }}>Sale: ₹{scanResult.selling_price}</span>
              <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#065f46', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                Stock: {scanResult.stock_qty}
              </span>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => {
                  addToCart(scanResult, 1);
                  setCurrentPage('pos');
                }}
              >
                + Add to POS
              </button>
            </div>
          )}
        </div>

        {/* Item Selection Pills & Quick Edit Trigger */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {filteredItems.map(item => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <div 
                key={item.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                  borderRadius: '20px',
                  padding: '4px 10px',
                  gap: '8px',
                  fontSize: '12px'
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                >
                  {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>({item.barcode})</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>MRP: ₹{item.mrp ?? item.selling_price}</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-emerald)' }}>Sale: ₹{item.selling_price}</span>
                <span style={{ fontSize: '10.5px', background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
                  Stock: {item.stock_qty}
                </span>

                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  title="Quick edit MRP, Sale Price or Stock"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--accent-blue)', padding: '2px' }}
                >
                  <Edit3 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Modal / Form to Edit MRP, Sale Price & Stock */}
        {showQuickEditor && editingItem && (
          <div className="modal-overlay" onClick={() => setShowQuickEditor(false)}>
            <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ fontSize: '15px' }}>
                  Edit MRP & Sale Price: {editingItem.name}
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowQuickEditor(false)}>✕</button>
              </div>
              <form onSubmit={saveQuickEdit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '700' }}>Maximum Retail Price (MRP ₹) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editForm.mrp} 
                      onChange={e => setEditForm(prev => ({ ...prev, mrp: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-emerald)' }}>Our Sale Price (₹) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editForm.selling_price} 
                      onChange={e => setEditForm(prev => ({ ...prev, selling_price: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-col form-group">
                      <label style={{ fontSize: '12px', fontWeight: '700' }}>Current Stock Qty</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={editForm.stock_qty} 
                        onChange={e => setEditForm(prev => ({ ...prev, stock_qty: e.target.value }))}
                      />
                    </div>
                    <div className="form-col form-group">
                      <label style={{ fontSize: '12px', fontWeight: '700' }}>Rack Location</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editForm.rack_location} 
                        onChange={e => setEditForm(prev => ({ ...prev, rack_location: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowQuickEditor(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                    <Save size={14} /> {savingEdit ? "Saving..." : "Save to MongoDB"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic @page media rules for Citizen CL-E321 and other label sizes */}
      <style>{`
        @media print {
          @page {
            size: ${
              stickerSize.startsWith('citizen') ? '101.6mm 25.4mm' :
              stickerSize === 'standard' ? '50mm 30mm' :
              stickerSize === 'compact' ? '38mm 25mm' :
              '65mm 40mm'
            };
            margin: 0mm;
          }
          .printable-area {
            width: ${
              stickerSize.startsWith('citizen') ? '101.6mm' :
              stickerSize === 'standard' ? '50mm' :
              stickerSize === 'compact' ? '38mm' :
              '65mm'
            } !important;
          }
        }
      `}</style>

      {/* Printable Stickers Canvas Grid */}
      <div 
        className="printable-area" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: stickerSize.startsWith('citizen')
            ? 'repeat(auto-fill, minmax(min(100%, 390px), 1fr))'
            : (stickerSize === 'compact' 
              ? 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))' 
              : (stickerSize === 'shelf' ? 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))' : 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))')), 
          gap: '12px', 
          background: 'var(--bg-card)', 
          padding: '16px', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)' 
        }}
      >
        {(() => {
          // Generate flat list of stickers based on selected items and copies
          const allStickers = [];
          selectedItems.forEach(id => {
            const item = items.find(i => i.id === id);
            if (!item) return;
            for (let copyIdx = 0; copyIdx < stickerCopies; copyIdx++) {
              allStickers.push({ item, copyIdx });
            }
          });

          // Citizen 2-Up Mode: Group into pairs of 2 parallel stickers per 101.6mm x 25.4mm row
          if (stickerSize === 'citizen-2up') {
            const rows2up = [];
            for (let i = 0; i < allStickers.length; i += 2) {
              rows2up.push([allStickers[i], allStickers[i + 1] || null]);
            }

            return rows2up.map((pair, rowIdx) => (
              <div key={rowIdx} className="barcode-row-2up">
                {/* Left Sticker */}
                <BarcodeSticker 
                  key={`left-${pair[0].item.id}-${pair[0].copyIdx}`}
                  item={pair[0].item}
                  storeName={settings.store_name || "TIORAS"}
                  showStoreName={showStoreName}
                  showMRP={showMRP}
                  showSalePrice={showSalePrice}
                  showDiscount={showDiscount}
                  showStock={showStock}
                  showRack={showRack}
                  showSku={showSku}
                  printBorder={printBorder}
                  stickerSize="citizen-2up"
                />
                {/* Right Sticker (Parallel) */}
                {pair[1] ? (
                  <BarcodeSticker 
                    key={`right-${pair[1].item.id}-${pair[1].copyIdx}`}
                    item={pair[1].item}
                    storeName={settings.store_name || "TIORAS"}
                    showStoreName={showStoreName}
                    showMRP={showMRP}
                    showSalePrice={showSalePrice}
                    showDiscount={showDiscount}
                    showStock={showStock}
                    showRack={showRack}
                    showSku={showSku}
                    printBorder={printBorder}
                    stickerSize="citizen-2up"
                  />
                ) : (
                  <div className="barcode-sticker size-2up blank-sticker" />
                )}
              </div>
            ));
          }

          // Single Sticker Modes (Citizen 1-Up, Standard, Compact, Shelf)
          return allStickers.map(({ item, copyIdx }) => (
            <BarcodeSticker 
              key={`${item.id}-${copyIdx}`}
              item={item}
              storeName={settings.store_name || "TIORAS"}
              showStoreName={showStoreName}
              showMRP={showMRP}
              showSalePrice={showSalePrice}
              showDiscount={showDiscount}
              showStock={showStock}
              showRack={showRack}
              showSku={showSku}
              printBorder={printBorder}
              stickerSize={stickerSize === 'citizen-1up' ? 'citizen' : stickerSize}
            />
          ));
        })()}
      </div>
    </div>
  );
}

