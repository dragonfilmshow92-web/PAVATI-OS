import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { X, Check, DollarSign } from 'lucide-react';

export default function PriceEditModal() {
  const { modalState, setModalState, refreshItems, showToast } = useApp();
  const item = modalState.data;

  const [costPrice, setCostPrice] = useState(item?.cost_price ?? '');
  const [sellingPrice, setSellingPrice] = useState(item?.selling_price ?? '');
  const [mrp, setMrp] = useState(item?.mrp ?? item?.selling_price ?? '');
  const [rackName, setRackName] = useState(item?.rack_name || item?.rack_location || 'Rack A-01');
  const [updating, setUpdating] = useState(false);

  if (!item) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      showToast("Please enter a valid selling price", "warning");
      return;
    }

    setUpdating(true);
    try {
      await api.updateItem(item.id, {
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        mrp: Number(mrp),
        rack_name: rackName
      });
      showToast(`Updated pricing for ${item.name}`, "success");
      await refreshItems();
      setModalState({ type: null, data: null });
    } catch (err) {
      showToast("Failed to update pricing: " + err.message, "danger");
    } finally {
      setUpdating(false);
    }
  };

  const currentMargin = sellingPrice && costPrice ? 
    Math.round(((sellingPrice - costPrice) / sellingPrice) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div className="modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="var(--accent-blue)" />
            <div>
              <h2 className="modal-title">Quick Price & Rack Edit</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.name} ({item.barcode})</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setModalState({ type: null, data: null })}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Cost Price (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={costPrice} 
                onChange={e => setCostPrice(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Selling / Offer Price (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={sellingPrice} 
                onChange={e => setSellingPrice(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>MRP (Maximum Retail Price ₹)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={mrp} 
                onChange={e => setMrp(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--accent-emerald)', fontWeight: '800' }}>
                📍 Inventory Rack / Shelf Location
              </label>
              <input 
                type="text" 
                className="form-control" 
                value={rackName} 
                onChange={e => setRackName(e.target.value)} 
                placeholder="e.g. Rack A-02 / Shelf 3" 
                required 
              />
            </div>

            <div style={{ 
              padding: '10px 14px', 
              background: 'var(--bg-card)', 
              borderRadius: 'var(--radius-sm)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calculated Profit Margin:</span>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '800', 
                color: currentMargin > 20 ? 'var(--accent-emerald)' : (currentMargin > 0 ? 'var(--accent-amber)' : 'var(--accent-red)') 
              }}>
                {currentMargin}% {currentMargin <= 0 ? '(Below Cost Alert!)' : ''}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalState({ type: null, data: null })}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updating}>
              <Check size={16} />
              {updating ? "Updating..." : "Save Prices & Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
