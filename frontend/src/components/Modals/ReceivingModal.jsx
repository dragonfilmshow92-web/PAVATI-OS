import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { X, Plus, Trash2, CheckCircle2, Truck } from 'lucide-react';
import soundFx from '../../utils/sounds';

export default function ReceivingModal() {
  const { setModalState, suppliers, items, refreshItems, refreshGRN, showToast, setCurrentPage } = useApp();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNo, setInvoiceNo] = useState(() => `INV-${Date.now().toString().slice(-5)}`);
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Items to receive list
  const [inwardLines, setInwardLines] = useState([
    {
      id: items[0]?.id || '',
      name: items[0]?.name || '',
      barcode: items[0]?.barcode || '',
      sku: items[0]?.sku || '',
      qty: 10,
      cost_price: items[0]?.cost_price || 500,
      selling_price: items[0]?.selling_price || 999,
      mrp: items[0]?.mrp || (items[0]?.selling_price ? Math.round(items[0].selling_price * 1.25) : 1299),
      rack_name: items[0]?.rack_name || 'Rack A-01 / Shelf 1'
    }
  ]);

  const [submitting, setSubmitting] = useState(false);

  const handleItemSelect = (index, itemId) => {
    const selected = items.find(i => i.id === itemId);
    if (!selected) return;

    setInwardLines(prev => {
      const next = [...prev];
      next[index] = {
        id: selected.id,
        name: selected.name,
        barcode: selected.barcode,
        sku: selected.sku,
        qty: next[index].qty || 5,
        cost_price: selected.cost_price,
        selling_price: selected.selling_price,
        mrp: selected.mrp || Math.round(selected.selling_price * 1.25),
        rack_name: selected.rack_name || 'Rack A-01 / Shelf 1'
      };
      return next;
    });
  };

  const handleLineChange = (index, field, value) => {
    setInwardLines(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addLine = () => {
    setInwardLines(prev => [
      ...prev,
      {
        id: '',
        name: 'New Received Item',
        barcode: '890' + Math.floor(100000000 + Math.random() * 900000000),
        sku: 'TS-' + Date.now().toString().slice(-5),
        qty: 10,
        cost_price: 600,
        selling_price: 1199,
        mrp: 1499,
        rack_name: 'Rack A-02 / Shelf 2'
      }
    ]);
  };

  const removeLine = (index) => {
    if (inwardLines.length === 1) return;
    setInwardLines(prev => prev.filter((_, i) => i !== index));
  };

  const totalCost = inwardLines.reduce((acc, l) => acc + (Number(l.qty || 0) * Number(l.cost_price || 0)), 0);
  const totalUnits = inwardLines.reduce((acc, l) => acc + Number(l.qty || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inwardLines.length || totalUnits <= 0) {
      showToast("Please add at least one product with quantity > 0", "warning");
      return;
    }

    setSubmitting(true);
    try {
      await api.receiveGoods({
        supplier_id: supplierId,
        invoice_no: invoiceNo,
        received_date: receivedDate,
        items: inwardLines,
        notes: notes
      });

      soundFx.stockReceived(); // 📦 Stock received confirmation fanfare
      showToast(`Inward completed! Added ${totalUnits} items to inventory.`, "success");
      await refreshItems();
      await refreshGRN();
      setModalState({ type: null, data: null });
      setCurrentPage('receiving');
    } catch (err) {
      showToast("Error processing Goods Receiving: " + err.message, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div className="modal-dialog" style={{ maxWidth: '920px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} color="var(--accent-emerald)" />
            <div>
              <h2 className="modal-title">Goods Receiving Note (GRN) Inward</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Receive vendor shipments, update stock quantities, set Cost/Sale/MRP prices & rack location
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setModalState({ type: null, data: null })}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Vendor & Invoice Header */}
            <div className="form-row" style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div className="form-col form-group" style={{ marginBottom: 0 }}>
                <label>Select Vendor / Supplier *</label>
                <select 
                  className="form-control" 
                  value={supplierId} 
                  onChange={e => setSupplierId(e.target.value)}
                  required
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>
              <div className="form-col form-group" style={{ marginBottom: 0 }}>
                <label>Supplier Bill / Invoice # *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={invoiceNo} 
                  onChange={e => setInvoiceNo(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-col form-group" style={{ marginBottom: 0 }}>
                <label>Receiving Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={receivedDate} 
                  onChange={e => setReceivedDate(e.target.value)} 
                />
              </div>
            </div>

            {/* Inward Items Lines */}
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Products Arriving ({inwardLines.length} Lines, {totalUnits} Units)
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                <Plus size={14} /> Add Product Line
              </button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {inwardLines.map((line, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr 36px', 
                    gap: '8px', 
                    padding: '8px', 
                    background: 'var(--bg-input)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '8px',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Product Name / Select</label>
                    <select 
                      className="form-control" 
                      style={{ padding: '6px', fontSize: '12px' }}
                      value={line.id} 
                      onChange={e => handleItemSelect(idx, e.target.value)}
                    >
                      <option value="">-- Or enter new below --</option>
                      {items.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.barcode})</option>
                      ))}
                    </select>
                    {!line.id && (
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ marginTop: '4px', padding: '4px 6px', fontSize: '11.5px' }}
                        placeholder="New Item Name" 
                        value={line.name} 
                        onChange={e => handleLineChange(idx, 'name', e.target.value)} 
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Qty Inward</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      style={{ padding: '6px', fontSize: '12.5px', fontWeight: '700' }}
                      value={line.qty} 
                      onChange={e => handleLineChange(idx, 'qty', e.target.value)} 
                      min="1" 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Cost Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      style={{ padding: '6px', fontSize: '12px' }}
                      value={line.cost_price} 
                      onChange={e => handleLineChange(idx, 'cost_price', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Selling (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      style={{ padding: '6px', fontSize: '12px', color: 'var(--accent-blue)', fontWeight: '700' }}
                      value={line.selling_price} 
                      onChange={e => handleLineChange(idx, 'selling_price', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>MRP (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      style={{ padding: '6px', fontSize: '12px' }}
                      value={line.mrp} 
                      onChange={e => handleLineChange(idx, 'mrp', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-emerald)' }}>📍 Rack / Shelf</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ padding: '6px', fontSize: '11.5px' }}
                      value={line.rack_name} 
                      onChange={e => handleLineChange(idx, 'rack_name', e.target.value)} 
                      placeholder="Rack A-01" 
                    />
                  </div>

                  <div>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: 'var(--accent-red)', padding: '6px', marginTop: '16px' }}
                      onClick={() => removeLine(idx)}
                      disabled={inwardLines.length === 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Inward summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Inward Units: </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-emerald)' }}>{totalUnits} Pcs</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Invoice Cost: </span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>₹{totalCost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalState({ type: null, data: null })}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              <CheckCircle2 size={16} />
              {submitting ? "Receiving Goods..." : "Confirm Inward & Update Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
