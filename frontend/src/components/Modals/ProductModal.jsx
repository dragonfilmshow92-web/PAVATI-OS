import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { X, Save } from 'lucide-react';
import soundFx from '../../utils/sounds';

export default function ProductModal() {
  const { modalState, setModalState, refreshItems, showToast } = useApp();
  const editingItem = modalState.data;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'shirts',
    brand: '',
    hsn_code: '',
    size: 'Standard',
    color: 'Default',
    cost_price: '',
    selling_price: '',
    mrp: '',
    rack_location: 'Rack A-01 / Shelf 1',
    gst_rate: 12,
    tax_inclusive: false,
    stock_qty: 0,
    reorder_level: 5,
    uom: 'Pcs'
  });

  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(editingItem && editingItem.id && !editingItem.isNew);

  useEffect(() => {
    if (isEdit) {
      setFormData({
        name: editingItem.name || '',
        sku: editingItem.sku || '',
        barcode: editingItem.barcode || '',
        category: editingItem.category || 'shirts',
        brand: editingItem.brand || '',
        hsn_code: editingItem.hsn_code || '',
        size: editingItem.size || 'Standard',
        color: editingItem.color || 'Default',
        cost_price: editingItem.cost_price ?? '',
        selling_price: editingItem.selling_price ?? '',
        mrp: editingItem.mrp ?? editingItem.selling_price ?? '',
        rack_location: editingItem.rack_location || editingItem.rack_name || 'Rack A-01 / Shelf 1',
        gst_rate: editingItem.gst_rate ?? 12,
        tax_inclusive: Boolean(editingItem.tax_inclusive),
        stock_qty: editingItem.stock_qty ?? 0,
        reorder_level: editingItem.reorder_level ?? 5,
        uom: editingItem.uom || 'Pcs'
      });
    } else {
      // Auto-generate barcode & SKU or use prefilled barcode
      const randomBarcode = editingItem?.barcode || ("890" + Math.floor(100000000 + Math.random() * 900000000));
      const randomSKU = "TS-" + Date.now().toString().slice(-6);
      setFormData(prev => ({
        ...prev,
        barcode: randomBarcode,
        sku: randomSKU,
        tax_inclusive: false
      }));
    }
  }, [editingItem, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter product title", "warning");
      return;
    }
    if (!formData.barcode.trim()) {
      showToast("Please enter a valid barcode", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        cost_price: formData.cost_price === '' ? 0 : Number(formData.cost_price),
        selling_price: formData.selling_price === '' ? 0 : Number(formData.selling_price),
        mrp: formData.mrp === '' ? (formData.selling_price === '' ? 0 : Number(formData.selling_price)) : Number(formData.mrp),
        gst_rate: Number(formData.gst_rate) || 12,
        tax_inclusive: Boolean(formData.tax_inclusive),
        stock_qty: Number(formData.stock_qty) || 0,
        reorder_level: Number(formData.reorder_level) || 5
      };

      if (isEdit) {
        const res = await api.updateItem(editingItem.id || editingItem._id, payload);
        if (res && res.success === false) {
          soundFx.error();
          showToast(res.message || "Failed to update product", "danger");
          return;
        }
        soundFx.itemListed();
        showToast("Product updated successfully", "success");
      } else {
        const res = await api.createItem(payload);
        if (res && res.success === false) {
          soundFx.error();
          showToast(res.message || "Failed to create product", "danger");
          return;
        }
        soundFx.itemListed();
        showToast("New product added to inventory!", "success");
        if (editingItem?.onSuccess && (res.data || res.id)) {
          editingItem.onSuccess(res.data || { ...payload, id: res.id || payload.barcode });
        }
      }
      await refreshItems();
      setModalState({ type: null, data: null });
    } catch (err) {
      showToast("Error saving product: " + err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingItem ? "Edit Product Details" : "Add New Product to Store"}
          </h2>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setModalState({ type: null, data: null })}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Product Title / Name *</label>
              <input 
                type="text" 
                name="name" 
                className="form-control" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Slim Fit Cotton Formal Shirt" 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Barcode / EAN-13 *</label>
                <input 
                  type="text" 
                  name="barcode" 
                  className="form-control" 
                  value={formData.barcode} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-col form-group">
                <label>SKU Code</label>
                <input 
                  type="text" 
                  name="sku" 
                  className="form-control" 
                  value={formData.sku} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-col form-group">
                <label>HSN / SAC Code</label>
                <input 
                  type="text" 
                  name="hsn_code" 
                  className="form-control" 
                  value={formData.hsn_code} 
                  onChange={handleChange} 
                  placeholder="e.g. 6205, 5208"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Category</label>
                <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
                  <option value="shirts">Shirts</option>
                  <option value="trousers">Trousers & Chinos</option>
                  <option value="suits">Suits & Blazers</option>
                  <option value="ethnic">Ethnic Wear / Kurtas</option>
                  <option value="accessories">Accessories / Belts / Ties</option>
                  <option value="fabrics">Fabrics & Silk</option>
                </select>
              </div>
              <div className="form-col form-group">
                <label>Size</label>
                <input 
                  type="text" 
                  name="size" 
                  className="form-control" 
                  value={formData.size} 
                  onChange={handleChange} 
                  placeholder="e.g. 38, 40, L, XL" 
                />
              </div>
              <div className="form-col form-group">
                <label>Color</label>
                <input 
                  type="text" 
                  name="color" 
                  className="form-control" 
                  value={formData.color} 
                  onChange={handleChange} 
                  placeholder="e.g. Navy Blue" 
                />
              </div>
            </div>

            {/* Crucial Pricing Section: Cost, Selling Price, MRP */}
            <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '8px' }}>
                Pricing & Margins
              </div>
              <div className="form-row">
                <div className="form-col form-group" style={{ marginBottom: 0 }}>
                  <label>Cost Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="cost_price" 
                    className="form-control" 
                    value={formData.cost_price} 
                    onChange={handleChange} 
                    placeholder="650.00" 
                  />
                </div>
                <div className="form-col form-group" style={{ marginBottom: 0 }}>
                  <label>Offer / Selling Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="selling_price" 
                    className="form-control" 
                    value={formData.selling_price} 
                    onChange={handleChange} 
                    placeholder="1299.00" 
                  />
                </div>
                <div className="form-col form-group" style={{ marginBottom: 0 }}>
                  <label>MRP (Maximum Retail Price ₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="mrp" 
                    className="form-control" 
                    value={formData.mrp} 
                    onChange={handleChange} 
                    placeholder="1599.00" 
                  />
                </div>
              </div>
            </div>

            {/* Inventory Placement & Stock: RACK NAME */}
            <div className="form-row">
              <div className="form-col form-group" style={{ flex: 1.5 }}>
                <label style={{ color: 'var(--accent-emerald)', fontWeight: '800' }}>
                  📍 Inventory Rack / Shelf Location *
                </label>
                <input 
                  type="text" 
                  name="rack_location" 
                  className="form-control" 
                  value={formData.rack_location} 
                  onChange={handleChange} 
                  placeholder="e.g. Rack A-02 / Shelf 3" 
                  required 
                />
              </div>
              <div className="form-col form-group">
                <label>Opening Stock Qty</label>
                <input 
                  type="number" 
                  name="stock_qty" 
                  className="form-control" 
                  value={formData.stock_qty} 
                  onChange={handleChange} 
                  disabled={!!editingItem} 
                />
              </div>
              <div className="form-col form-group">
                <label>Reorder Alert Level</label>
                <input 
                  type="number" 
                  name="reorder_level" 
                  className="form-control" 
                  value={formData.reorder_level} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>GST Rate (%)</label>
                <select name="gst_rate" className="form-control" value={formData.gst_rate} onChange={handleChange}>
                  <option value="0">0% (Nil / Exempt)</option>
                  <option value="5">5% GST (Fabric / Apparel &lt; ₹1,000)</option>
                  <option value="12">12% GST (Apparel &gt; ₹1,000)</option>
                  <option value="18">18% GST (Accessories & Care)</option>
                  <option value="28">28% GST (Luxury)</option>
                </select>
              </div>
              <div className="form-col form-group">
                <label>Unit of Measure (UOM)</label>
                <input 
                  type="text" 
                  name="uom" 
                  className="form-control" 
                  value={formData.uom} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            {/* Tax Inclusive / Exclusive Setting */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '14px',
              cursor: 'pointer'
            }} onClick={() => setFormData(prev => ({ ...prev, tax_inclusive: !prev.tax_inclusive }))}>
              <input 
                type="checkbox"
                id="tax_inclusive"
                name="tax_inclusive"
                checked={Boolean(formData.tax_inclusive)}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
              />
              <div>
                <label htmlFor="tax_inclusive" style={{ margin: 0, cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                  Selling Price is Tax Inclusive
                </label>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  When enabled, GST is extracted from the selling price rather than charged in addition.
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setModalState({ type: null, data: null })}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              <Save size={15} />
              {saving ? "Saving..." : (editingItem ? "Update Product" : "Save Product")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
