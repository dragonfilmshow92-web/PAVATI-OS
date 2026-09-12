import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import soundFx from '../utils/sounds';
import { 
  FilePlus, 
  Barcode, 
  Copy, 
  Check, 
  Truck,
  List
} from 'lucide-react';

export default function ListingPage() {
  const { categories, refreshItems, showToast, setCurrentPage } = useApp();

  const [lastItem, setLastItem] = useState(() => {
    try {
      const saved = localStorage.getItem('last_listed_item');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const generateBarcode = () => {
    return '90' + Math.floor(1000000000 + Math.random() * 9000000000);
  };

  const [formData, setFormData] = useState({
    barcode: generateBarcode(),
    name: '',
    category: 'shirts',
    hsn_code: '',
    subcategory: '',
    sale_category: 'Regular',
    brand: '',
    customBrand: false,
    gst_rate: 18,
    selling_price: 0,
    mrp: 0,
    min_stock: 0,
    max_stock: 0,
    cost_price: 0,
    stock_qty: 0,
    tax_inclusive: false,
    rack_location: 'Rack A-01 / Shelf 1'
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCopyLast = () => {
    if (!lastItem) {
      showToast("No previous item found to copy", "info");
      return;
    }

    setFormData(prev => ({
      ...prev,
      category: lastItem.category || prev.category,
      hsn_code: lastItem.hsn_code || prev.hsn_code,
      subcategory: lastItem.subcategory || prev.subcategory,
      sale_category: lastItem.sale_category || prev.sale_category,
      brand: lastItem.brand || prev.brand,
      gst_rate: lastItem.gst_rate ?? prev.gst_rate,
      tax_inclusive: lastItem.tax_inclusive ?? prev.tax_inclusive,
      selling_price: lastItem.selling_price ?? prev.selling_price,
      mrp: lastItem.mrp ?? prev.mrp,
      min_stock: lastItem.min_stock ?? prev.min_stock,
      max_stock: lastItem.max_stock ?? prev.max_stock,
      rack_location: lastItem.rack_location || prev.rack_location,
      barcode: generateBarcode()
    }));
    showToast("Copied attributes from last saved item", "success");
  };

  const handleSave = async (target = 'another') => {
    const cleanName = (formData.name || '').trim();
    const cleanBarcode = (formData.barcode || '').trim();

    if (!cleanName) {
      showToast("Item name is required", "warning");
      return;
    }
    if (!cleanBarcode) {
      showToast("Barcode cannot be empty", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        name: cleanName,
        barcode: cleanBarcode,
        sku: 'SKU-' + (cleanBarcode.length >= 6 ? cleanBarcode.slice(-6) : cleanBarcode),
        brand: formData.customBrand ? (formData.brand.trim() || 'Generic') : (formData.brand || 'Generic'),
        cost_price: 0, // Cost is explicitly entered during Vendor Inwarding on Stock Receiving page
        selling_price: Math.max(0, Number(formData.selling_price) || 0),
        mrp: Math.max(0, Number(formData.mrp) || Number(formData.selling_price) || 0),
        gst_rate: Number(formData.gst_rate) || 12,
        tax_inclusive: Boolean(formData.tax_inclusive),
        min_stock: Number(formData.min_stock) || 0,
        max_stock: Number(formData.max_stock) || 0,
        stock_qty: 0, // 0 until received via Vendor Inwarding
        reorder_level: Number(formData.min_stock) || 5
      };
      delete payload.customBrand;

      const res = await api.createItem(payload);
      if (res.success || res.id) {
        soundFx.itemListed(); // ✨ Sparkle celebration sound when item is listed
        const createdItem = res.data || { ...payload, id: res.id || payload.barcode };
        showToast(`Item "${formData.name}" listed successfully!`, "success");
        try {
          localStorage.setItem('last_listed_item', JSON.stringify(payload));
          // Cache in local items for instant offline availability
          const existingLocal = JSON.parse(localStorage.getItem('pos_local_items') || '[]');
          const filtered = existingLocal.filter(i => i.barcode !== payload.barcode && i.id !== createdItem.id);
          filtered.unshift(createdItem);
          localStorage.setItem('pos_local_items', JSON.stringify(filtered));
        } catch {}
        setLastItem(payload);
        await refreshItems();

        if (target === 'receiving') {
          try {
            sessionStorage.setItem('pending_receive_item', JSON.stringify(createdItem));
          } catch (e) {}
          setCurrentPage('receiving');
          return;
        }

        if (target === 'products') {
          setCurrentPage('products');
          return;
        }

        // Reset form for next item — keep contextual fields, clear per-item fields
        setFormData({
          barcode: generateBarcode(),
          name: '',
          category: formData.category,
          hsn_code: formData.hsn_code,
          subcategory: formData.subcategory,
          sale_category: formData.sale_category,
          brand: formData.brand,
          customBrand: formData.customBrand,
          gst_rate: formData.gst_rate,
          tax_inclusive: formData.tax_inclusive,
          selling_price: 0,
          mrp: 0,
          min_stock: formData.min_stock,
          max_stock: formData.max_stock,
          cost_price: 0,
          stock_qty: 0,
          rack_location: formData.rack_location
        });
      } else {
        // If server is offline, unreachable, or running on static hosting (HTTP 404/405/Network Error):
        // Automatically save locally so the user is never blocked!
        const isOfflineOrStatic = res.status === 404 || res.status === 405 || (res.error && (res.error.includes('Network error') || res.error.includes('Failed to fetch') || res.error.includes('Cannot connect')));
        if (isOfflineOrStatic) {
          const localId = 'ITEM-LOC-' + Math.random().toString(36).substring(2, 9).toUpperCase();
          const fallbackItem = { 
            ...payload, 
            id: localId, 
            _id: localId, 
            active: true,
            is_local_draft: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          try {
            const existingLocal = JSON.parse(localStorage.getItem('pos_local_items') || '[]');
            const filtered = existingLocal.filter(i => i.barcode !== payload.barcode);
            filtered.unshift(fallbackItem);
            localStorage.setItem('pos_local_items', JSON.stringify(filtered));
            localStorage.setItem('last_listed_item', JSON.stringify(payload));
          } catch (e) {}

          soundFx.itemListed();
          showToast(`Item "${formData.name}" listed successfully! (Saved in local storage)`, "success");
          setLastItem(payload);
          await refreshItems();

          if (target === 'receiving') {
            try { sessionStorage.setItem('pending_receive_item', JSON.stringify(fallbackItem)); } catch (e) {}
            setCurrentPage('receiving');
            return;
          }
          if (target === 'products') {
            setCurrentPage('products');
            return;
          }

          // Reset form for next item
          setFormData({
            barcode: generateBarcode(),
            name: '',
            category: formData.category,
            hsn_code: formData.hsn_code,
            subcategory: formData.subcategory,
            sale_category: formData.sale_category,
            brand: formData.brand,
            customBrand: formData.customBrand,
            gst_rate: formData.gst_rate,
            tax_inclusive: formData.tax_inclusive,
            selling_price: 0,
            mrp: 0,
            min_stock: formData.min_stock,
            max_stock: formData.max_stock,
            cost_price: 0,
            stock_qty: 0,
            rack_location: formData.rack_location
          });
          return;
        }

        // Show exact error message returned by server (e.g. "Barcode is already used by...")
        showToast(res.message || res.error || "Failed to create item", "danger");
      }
    } catch (err) {
      showToast("Error saving item: " + err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave('another');
  };

  const sampleBrands = ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Levi\'s', 'Nirma', 'Amul', 'Nestle', 'Parle', 'Generic'];
  const sampleSubcategories = ['Standard', 'Formal', 'Casual', 'Cotton', 'Denim', 'Linen', 'Daily Care', 'Packaged Goods'];
  const sampleSaleCategories = ['Regular', 'Clearance', 'Seasonal', 'Premium Offer', 'Everyday Essential'];

  // Static fallback categories shown only when dynamic list hasn't loaded yet
  const staticCategories = [
    { id: 'shirts',      name: 'Shirts & Tops' },
    { id: 'trousers',    name: 'Trousers & Jeans' },
    { id: 'dresses',     name: 'Dresses & Kurtis' },
    { id: 'suits',       name: 'Suits & Blazers' },
    { id: 'fabrics',     name: 'Fabrics & Materials' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'daily',       name: 'Daily Essentials' },
    { id: 'groceries',   name: 'Groceries & Packaged' },
  ];
  const categoryList = categories && categories.length > 0 ? categories : staticCategories;

  return (
    <div className="listing-page-container">
      {/* Main Card */}
      <div className="listing-card">
        {/* Navy Header Banner */}
        <div className="listing-header-banner">
          <div className="listing-header-left">
            <div className="listing-header-icon-box">
              <FilePlus size={20} color="#ffffff" />
            </div>
            <h2 className="listing-header-title">New Item Listing</h2>
          </div>
          <div className="listing-header-required">
            Fields marked <span className="req-star">*</span> are required
          </div>
        </div>

        <form onSubmit={handleSubmit} className="listing-form-body">
          {/* SECTION 01: IDENTITY */}
          <div className="listing-section-card identity-section">
            <div className="section-pill-tag pill-blue">
              <span>01</span> IDENTITY
            </div>

            <div className="listing-fields-grid grid-4-cols">
              {/* Barcode */}
              <div className="listing-form-group">
                <label className="listing-label">Barcode</label>
                <div className="barcode-input-container">
                  <button 
                    type="button" 
                    className="barcode-addon-btn"
                    title="Generate New Barcode"
                    onClick={() => setFormData(p => ({ ...p, barcode: generateBarcode() }))}
                  >
                    <Barcode size={18} />
                  </button>
                  <input 
                    type="text" 
                    name="barcode" 
                    className="form-control barcode-input" 
                    value={formData.barcode} 
                    onChange={handleChange}
                    placeholder="Barcode" 
                    required 
                  />
                </div>
              </div>

              {/* Item Name */}
              <div className="listing-form-group">
                <label className="listing-label">Item Name <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  placeholder="Enter item name" 
                  value={formData.name} 
                  onChange={handleChange}
                  required 
                />
              </div>

              {/* Category — dynamic list, no hardcoded duplicates */}
              <div className="listing-form-group">
                <label className="listing-label">Category <span className="req-star">*</span></label>
                <select 
                  name="category" 
                  className="form-control" 
                  value={formData.category} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose category</option>
                  {categoryList
                    .filter(c => c.id !== 'all')
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  }
                </select>
              </div>

              {/* HSN Code */}
              <div className="listing-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="listing-label">HSN Code</label>
                  <span className="tax-id-badge">Tax ID</span>
                </div>
                <input 
                  type="text" 
                  name="hsn_code" 
                  className="form-control" 
                  placeholder="e.g. 1001,8471" 
                  value={formData.hsn_code} 
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* SECTION 02: CLASSIFICATION */}
          <div className="listing-section-card classification-section">
            <div className="section-pill-tag pill-green">
              <span>02</span> CLASSIFICATION
            </div>

            <div className="listing-fields-grid grid-3-cols">
              {/* Subcategory */}
              <div className="listing-form-group">
                <label className="listing-label">Subcategory</label>
                <select 
                  name="subcategory" 
                  className="form-control" 
                  value={formData.subcategory} 
                  onChange={handleChange}
                >
                  <option value="">Select subcategory</option>
                  {sampleSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Sale Category */}
              <div className="listing-form-group">
                <label className="listing-label">Sale Category</label>
                <select 
                  name="sale_category" 
                  className="form-control" 
                  value={formData.sale_category} 
                  onChange={handleChange}
                >
                  <option value="">Select sale category</option>
                  {sampleSaleCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Brand with Custom toggle */}
              <div className="listing-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="listing-label">Brand</label>
                  <label className="custom-toggle-label">
                    <input 
                      type="checkbox" 
                      name="customBrand" 
                      checked={formData.customBrand} 
                      onChange={handleChange} 
                    />
                    <span className="toggle-slider"></span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Custom</span>
                  </label>
                </div>

                {formData.customBrand ? (
                  <input 
                    type="text" 
                    name="brand" 
                    className="form-control" 
                    placeholder="Enter custom brand" 
                    value={formData.brand} 
                    onChange={handleChange} 
                  />
                ) : (
                  <select 
                    name="brand" 
                    className="form-control" 
                    value={formData.brand} 
                    onChange={handleChange}
                  >
                    <option value="">Select brand</option>
                    {sampleBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 03: PRICING & COMPLIANCE */}
          <div className="listing-section-card pricing-section">
            <div className="section-pill-tag pill-orange">
              <span>03</span> TAX & REFERENCE PRICING
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>📦</span>
              <span><strong>Pure Catalog Listing:</strong> Cost Price and physical stock quantities are <em>not</em> entered here. They are officially recorded when verifying Vendor Invoices in <strong>Stock Receiving</strong>.</span>
            </div>

            <div className="listing-fields-grid grid-3-cols">
              {/* GST % */}
              <div className="listing-form-group">
                <label className="listing-label">GST RATE (%)</label>
                <select 
                  name="gst_rate" 
                  className="form-control" 
                  value={formData.gst_rate} 
                  onChange={handleChange}
                >
                  <option value={0}>0% (Tax Free / Exempt)</option>
                  <option value={5}>5% (Apparel / Fabric &lt; ₹1000)</option>
                  <option value={12}>12% (Apparel / Standard)</option>
                  <option value={18}>18% (Accessories / Care)</option>
                  <option value={28}>28% (Luxury Goods)</option>
                </select>
              </div>

              {/* TENTATIVE SALE PRICE */}
              <div className="listing-form-group">
                <label className="listing-label">REFERENCE SALE PRICE (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="selling_price" 
                  className="form-control" 
                  value={formData.selling_price} 
                  onChange={handleChange}
                  placeholder="Optional reference price"
                />
              </div>

              {/* TENTATIVE MRP */}
              <div className="listing-form-group">
                <label className="listing-label">PRINTED MRP (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="mrp" 
                  className="form-control" 
                  value={formData.mrp} 
                  onChange={handleChange} 
                  placeholder="Optional MRP"
                />
              </div>
            </div>

            {/* Tax Inclusive Setting */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginTop: '12px',
              cursor: 'pointer'
            }} onClick={() => setFormData(prev => ({ ...prev, tax_inclusive: !prev.tax_inclusive }))}>
              <input 
                type="checkbox"
                id="listing_tax_inclusive"
                name="tax_inclusive"
                checked={Boolean(formData.tax_inclusive)}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
              />
              <div>
                <label htmlFor="listing_tax_inclusive" style={{ margin: 0, cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                  Selling Price is Tax Inclusive
                </label>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  When checked, GST is included within the selling price.
                </div>
              </div>
            </div>

            {/* Second row: stock limits + rack location */}
            <div className="listing-fields-grid grid-3-cols" style={{ marginTop: '12px' }}>
              {/* MIN STOCK */}
              <div className="listing-form-group">
                <label className="listing-label">MIN STOCK (Reorder Alert)</label>
                <input 
                  type="number" 
                  name="min_stock" 
                  className="form-control" 
                  value={formData.min_stock} 
                  onChange={handleChange} 
                />
              </div>

              {/* MAX STOCK */}
              <div className="listing-form-group">
                <label className="listing-label">MAX STOCK</label>
                <input 
                  type="number" 
                  name="max_stock" 
                  className="form-control" 
                  value={formData.max_stock} 
                  onChange={handleChange} 
                />
              </div>

              {/* RACK LOCATION */}
              <div className="listing-form-group">
                <label className="listing-label">📍 RACK / SHELF LOCATION</label>
                <input 
                  type="text" 
                  name="rack_location" 
                  className="form-control" 
                  value={formData.rack_location} 
                  onChange={handleChange}
                  placeholder="e.g. Rack A-01 / Shelf 1"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="listing-footer-actions">
            <button 
              type="button" 
              className="btn btn-secondary listing-copy-btn" 
              onClick={handleCopyLast}
            >
              <Copy size={16} /> Copy Last
            </button>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 16px', 
                  fontWeight: '700',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
                disabled={saving}
                onClick={() => handleSave('products')}
              >
                <List size={16} color="var(--accent-blue)" />
                Save & View Product List
              </button>

              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 16px', 
                  fontWeight: '700',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-emerald)',
                  cursor: 'pointer'
                }}
                disabled={saving}
                onClick={() => handleSave('receiving')}
              >
                <Truck size={16} />
                Save & Receive Stock
              </button>

              <button 
                type="submit" 
                className="btn listing-save-btn" 
                disabled={saving}
              >
                <Check size={17} />
                {saving ? "Saving Item..." : "Save & List Another"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
