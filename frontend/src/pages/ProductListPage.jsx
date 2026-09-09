import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { 
  Boxes, 
  Search, 
  Plus, 
  Edit3, 
  Barcode, 
  Trash2, 
  Truck, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FilePlus, 
  Filter, 
  MapPin, 
  Tag
} from 'lucide-react';

export default function ProductListPage() {
  const { 
    items, 
    categories, 
    setModalState, 
    refreshItems, 
    showToast, 
    setCurrentPage 
  } = useApp();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'in_stock'

  // Summary counts
  const totalCount = items.length;
  const pendingInwardCount = items.filter(i => !i.stock_qty || i.stock_qty <= 0).length;
  const inStockCount = items.filter(i => i.stock_qty && i.stock_qty > 0).length;

  // Filtered products
  const filteredProducts = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (catFilter !== 'all' && item.category !== catFilter) return false;

      // Status filter
      const isPending = !item.stock_qty || item.stock_qty <= 0;
      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'in_stock' && isPending) return false;

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.barcode || '').toLowerCase().includes(q) ||
        String(item.sku || '').toLowerCase().includes(q) ||
        String(item.brand || '').toLowerCase().includes(q) ||
        String(item.rack_location || item.rack_name || '').toLowerCase().includes(q)
      );
    });
  }, [items, catFilter, statusFilter, search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await api.deleteItem(id);
      showToast(`Deleted product "${name}"`, 'success');
      await refreshItems();
    } catch (err) {
      showToast("Failed to delete product: " + err.message, 'danger');
    }
  };

  const handleReceiveItem = (item) => {
    try {
      sessionStorage.setItem('pending_receive_item', JSON.stringify(item));
    } catch (e) {
      console.error(e);
    }
    setCurrentPage('receiving');
  };

  return (
    <div className="product-list-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner & Quick Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-surface)',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(124, 58, 237, 0.15))',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Boxes size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '-0.2px' }}>
              Product Master List
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Master catalog of all registered products. Review, edit mistakes, or send to stock receiving.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}
            onClick={() => setCurrentPage('receiving')}
          >
            <Truck size={15} color="var(--accent-emerald)" />
            Go to Stock Receiving
          </button>

          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}
            onClick={() => setCurrentPage('listing')}
          >
            <FilePlus size={15} />
            + List New Product
          </button>
        </div>
      </div>

      {/* Stats Summary Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div 
          onClick={() => setStatusFilter('all')}
          style={{
            flex: '1',
            minWidth: '150px',
            background: statusFilter === 'all' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
            border: `1px solid ${statusFilter === 'all' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>TOTAL CATALOG</div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>{totalCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('pending')}
          style={{
            flex: '1',
            minWidth: '150px',
            background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface)',
            border: `1px solid ${statusFilter === 'pending' ? 'var(--accent-amber)' : 'var(--border-color)'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> PENDING INWARD (0 STOCK)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-amber)' }}>{pendingInwardCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('in_stock')}
          style={{
            flex: '1',
            minWidth: '150px',
            background: statusFilter === 'in_stock' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
            border: `1px solid ${statusFilter === 'in_stock' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} /> IN STOCK (READY)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-emerald)' }}>{inStockCount}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '640px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '36px', fontSize: '13px' }}
              placeholder="Search by product name, barcode, SKU, brand, or rack..." 
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
            {categories && categories.length > 0 ? (
              categories.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            ) : (
              <>
                <option value="shirts">Shirts & Tops</option>
                <option value="trousers">Trousers & Jeans</option>
                <option value="suits">Suits & Blazers</option>
                <option value="fabrics">Fabrics & Materials</option>
                <option value="accessories">Accessories</option>
                <option value="daily">Daily Essentials</option>
              </>
            )}
          </select>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
          Showing <strong>{filteredProducts.length}</strong> of {items.length} products
        </div>
      </div>

      {/* Main Table */}
      <div className="pos-table-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="pos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Barcode / SKU</th>
                <th>Product Title</th>
                <th>Category & Brand</th>
                <th>📍 Rack Location</th>
                <th>GST%</th>
                <th>Ref Sale / MRP</th>
                <th>Inward Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Boxes size={32} style={{ opacity: 0.5 }} />
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>No products match your criteria</div>
                      <div style={{ fontSize: '12px' }}>Try clearing your search or list a new product</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item, idx) => {
                  const isPending = !item.stock_qty || item.stock_qty <= 0;

                  return (
                    <tr key={item.id || idx}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '11.5px' }}>
                        {idx + 1}
                      </td>

                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                          {item.barcode}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {item.sku || 'No SKU'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.uom || 'Pcs'} {item.hsn_code ? `· HSN: ${item.hsn_code}` : ''}
                        </div>
                      </td>

                      <td>
                        <div style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '12px' }}>
                          {item.category}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.brand || 'Generic'}
                        </div>
                      </td>

                      <td>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          background: 'rgba(59, 130, 246, 0.08)', 
                          color: 'var(--accent-blue)', 
                          padding: '3px 8px', 
                          borderRadius: '4px',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          📍 {item.rack_location || item.rack_name || "Unassigned"}
                        </span>
                      </td>

                      <td style={{ fontWeight: '700', fontSize: '12px' }}>
                        {item.gst_rate ?? 12}%
                      </td>

                      <td>
                        <div style={{ fontWeight: '800', fontSize: '12.5px', color: 'var(--accent-blue)' }}>
                          ₹{item.selling_price || 0}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          MRP: ₹{item.mrp || item.selling_price || 0}
                        </div>
                      </td>

                      <td>
                        {isPending ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: 'var(--accent-amber)',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            <Clock size={11} />
                            Pending Inward (0 Pcs)
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-emerald)',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            <CheckCircle2 size={11} />
                            In Stock: {item.stock_qty} {item.uom || 'Pcs'}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* 1-Click Receive Stock button */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="Inward / Receive Stock for this Product"
                            style={{ 
                              color: 'var(--accent-emerald)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              fontWeight: '700',
                              fontSize: '11.5px',
                              padding: '5px 9px'
                            }}
                            onClick={() => handleReceiveItem(item)}
                          >
                            <Truck size={13} />
                            Receive
                          </button>

                          {/* Edit Product (Fix Mistakes) */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="Edit Product Details (Correct Title, Barcode, Rack, etc.)"
                            style={{ padding: '5px 8px' }}
                            onClick={() => setModalState({ type: 'product', data: item })}
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Delete Product */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="Delete Product"
                            style={{ color: 'var(--accent-red)', padding: '5px 8px' }}
                            onClick={() => handleDelete(item.id, item.name)}
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
