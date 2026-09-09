import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { 
  Package, 
  Search, 
  Edit3, 
  Barcode, 
  Trash2, 
  DollarSign, 
  MapPin, 
  AlertTriangle 
} from 'lucide-react';

export default function InventoryPage() {
  const { items, setModalState, refreshItems, showToast, setCurrentPage } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = items.filter(item => {
    const matchCat = catFilter === 'all' || item.category === catFilter;
    if (!matchCat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      String(item.name || '').toLowerCase().includes(q) || 
      String(item.barcode || '').toLowerCase().includes(q) || 
      String(item.sku || '').toLowerCase().includes(q) ||
      String(item.rack_location || item.rack_name || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove product "${name}"?`)) return;
    try {
      await api.deleteItem(id);
      showToast(`Removed product ${name}`, 'success');
      await refreshItems();
    } catch (err) {
      showToast("Failed to delete product: " + err.message, 'danger');
    }
  };

  return (
    <div>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 'min(100%, 280px)', maxWidth: '600px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '36px', fontSize: '13px' }}
              placeholder="Search by Product Name, Barcode, SKU, or Rack Location..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: '160px', fontSize: '13px' }}
            value={catFilter} 
            onChange={e => setCatFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="shirts">Shirts</option>
            <option value="trousers">Trousers</option>
            <option value="suits">Suits</option>
            <option value="ethnic">Ethnic</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentPage('barcode')}>
            <Barcode size={16} /> Print Shelf Tags
          </button>
        </div>
      </div>

      {/* Products Table with Rack Location and Price Editing */}
      <div className="pos-table-card">
        <div className="table-responsive">
          <table className="pos-table">
          <thead>
            <tr>
              <th>Barcode / SKU</th>
              <th>Product Title</th>
              <th>Category / Spec</th>
              <th>📍 Inventory Rack</th>
              <th>Cost (₹)</th>
              <th>Offer Price (₹)</th>
              <th>MRP (₹)</th>
              <th>Margin</th>
              <th>Stock Qty</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No products matched your search.
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const margin = item.selling_price && item.cost_price ? 
                  Math.round(((item.selling_price - item.cost_price) / item.selling_price) * 100) : 0;

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '12px' }}>{item.barcode}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{item.sku}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '800' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.uom || 'Pcs'} | GST: {item.gst_rate || 12}%
                      </div>
                    </td>

                    <td>
                      <div style={{ textTransform: 'capitalize' }}>{item.category}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.size || 'Std'} / {item.color || 'Def'}
                      </div>
                    </td>

                    <td>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: 'var(--accent-emerald)', 
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        📍 {item.rack_name || item.rack_location || "Rack A-01"}
                      </span>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{item.cost_price}</td>
                    
                    <td>
                      <span style={{ fontWeight: '900', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                        ₹{item.selling_price}
                      </span>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      ₹{item.mrp || item.selling_price}
                    </td>

                    <td>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        color: margin > 25 ? 'var(--accent-emerald)' : (margin > 0 ? 'var(--accent-amber)' : 'var(--accent-red)') 
                      }}>
                        {margin}%
                      </span>
                    </td>

                    <td>
                      <span style={{ 
                        fontWeight: '900', 
                        color: item.stock_qty <= item.reorder_level ? 'var(--accent-amber)' : 'inherit' 
                      }}>
                        {item.stock_qty} {item.uom || 'Pcs'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* Quick Price Edit Button */}
                        <button 
                          className="btn btn-secondary btn-sm" 
                          title="Quick Price & Rack Edit"
                          onClick={() => setModalState({ type: 'priceEdit', data: item })}
                          style={{ color: 'var(--accent-emerald)' }}
                        >
                          <DollarSign size={13} /> Edit Price
                        </button>

                        {/* Full Edit Button */}
                        <button 
                          className="btn btn-secondary btn-sm" 
                          title="Full Product Edit"
                          onClick={() => setModalState({ type: 'product', data: item })}
                        >
                          <Edit3 size={13} />
                        </button>

                        {/* Delete Button */}
                        <button 
                          className="btn btn-secondary btn-sm" 
                          title="Delete Product"
                          onClick={() => handleDelete(item.id, item.name)}
                          style={{ color: 'var(--accent-red)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
