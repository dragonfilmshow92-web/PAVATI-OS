import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { Settings, Save, RefreshCw, Database, Cloud, Image as ImageIcon, Upload, Trash2, CheckCircle, Sparkles, Printer } from 'lucide-react';
import { printThermalReceipt } from '../utils/printReceipt';

export default function SettingsPage() {
  const { settings, setSettings, showToast } = useApp();
  const [formData, setFormData] = useState({
    store_name: 'TIORAS',
    store_tagline: 'Fashion Studio',
    store_address: 'Shop 14, High Street Arcade, Market Central, India',
    store_phone: '+91 98765 43210',
    store_gstin: '27AABCT1234F1Z5',
    upi_id: '7795208996-3@ybl',
    upi_merchant_name: 'PRASHANT HIREMATH',
    currency_symbol: '₹',
    logo_url: '/tioras-logo.png',
    receipt_paper_size: localStorage.getItem('pos_receipt_paper_size') || '80mm',
    auto_print_receipt: localStorage.getItem('pos_auto_print_receipt') === 'true',
    receipt_header: 'TAX INVOICE / CASH MEMO',
    receipt_footer: 'Thank you for shopping at Tioras Fashion Studio!\nExchange within 7 days with original bill & tag.',
    ...settings
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...settings,
        store_name: settings.store_name || prev.store_name || 'TIORAS',
        store_tagline: settings.store_tagline || settings.tagline || prev.store_tagline || 'Fashion Studio',
        store_address: settings.store_address || settings.address || prev.store_address,
        store_phone: settings.store_phone || settings.phone || prev.store_phone,
        store_gstin: settings.store_gstin || settings.gstin || prev.store_gstin,
        logo_url: settings.logo_url !== undefined && settings.logo_url !== null ? settings.logo_url : (prev.logo_url || '/tioras-logo.png'),
        upi_id: settings.upi_id || prev.upi_id,
        upi_merchant_name: settings.upi_merchant_name || prev.upi_merchant_name,
        receipt_header: settings.receipt_header || prev.receipt_header || 'TAX INVOICE / CASH MEMO',
        receipt_footer: settings.receipt_footer || prev.receipt_footer || 'Thank you for shopping at Tioras Fashion Studio!\nExchange within 7 days with original bill & tag.',
        receipt_paper_size: localStorage.getItem('pos_receipt_paper_size') || prev.receipt_paper_size || '80mm',
        auto_print_receipt: localStorage.getItem('pos_auto_print_receipt') === 'true'
      }));
    }
  }, [settings]);

  const handleTestPrint = () => {
    const sampleInvoice = {
      invoice_no: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
      created_at: new Date().toISOString(),
      items: [
        { name: 'Pure Cotton Formal Shirt', sku: 'SHIRT-M-01', rack_name: 'A-01', qty: 1, selling_price: 1299, subtotal: 1299 },
        { name: 'Slim Fit Stretch Denim', sku: 'JEANS-32', rack_name: 'B-04', qty: 1, selling_price: 1899, subtotal: 1899 }
      ],
      subtotal: 3198,
      discount_total: 200,
      total_tax: 150,
      grand_total: 2998,
      payment_method: 'Cash',
      cash_tendered: 3000,
      change_returned: 2,
      customer_name: 'Walk-in Retail Customer'
    };
    printThermalReceipt(sampleInvoice, formData, { paperSize: formData.receipt_paper_size || '80mm' });
    showToast(`Test bill sent to ${formData.receipt_paper_size || '80mm'} thermal printer!`, 'success');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo file too large! Please upload an image under 2MB.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setFormData(prev => ({ ...prev, logo_url: evt.target.result }));
      showToast("Logo loaded! Click 'Save Store Configuration' to save to MongoDB.", "info");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tagline: formData.store_tagline || formData.tagline,
        store_tagline: formData.store_tagline || formData.tagline,
        address: formData.store_address || formData.address,
        store_address: formData.store_address || formData.address,
        phone: formData.store_phone || formData.phone,
        store_phone: formData.store_phone || formData.phone,
        gstin: formData.store_gstin || formData.gstin,
        store_gstin: formData.store_gstin || formData.gstin,
        logo_url: formData.logo_url || '',
        receipt_header: formData.receipt_header || 'TAX INVOICE / CASH MEMO',
        receipt_footer: formData.receipt_footer || ''
      };
      
      // Persist local thermal printer preferences
      if (formData.receipt_paper_size) {
        localStorage.setItem('pos_receipt_paper_size', formData.receipt_paper_size);
      }
      localStorage.setItem('pos_auto_print_receipt', String(Boolean(formData.auto_print_receipt)));

      const res = await api.updateSettings(payload);
      if (res && res.success) {
        setSettings(res.data);
        showToast("Settings & Thermal Printer configured successfully in MongoDB!", "success");
      } else {
        showToast((res && res.message) || "Failed to update settings", "danger");
      }
    } catch (err) {
      showToast("Error updating settings: " + (err.message || "Failed to fetch"), "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={22} color="var(--accent-blue)" />
          Store Profile & Invoice Settings
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Configure retail store metadata, branding logo for printed receipts, and dynamic UPI QR settings
        </div>
      </div>

      <div className="pos-table-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSave}>
          
          {/* SECTION 1: STORE LOGO & RECEIPT BRANDING */}
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '800', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: 'var(--accent-purple, #a855f7)', 
            marginBottom: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <ImageIcon size={16} />
            Store Logo & Receipt Invoice Header
          </div>

          <div style={{
            background: 'var(--bg-card-hover, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Logo Preview Card */}
              <div style={{
                width: '180px',
                height: '120px',
                background: '#ffffff',
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                flexShrink: 0
              }}>
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Store Logo Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontWeight: '600' }}>
                    No Logo<br />
                    <span style={{ fontSize: '10px', fontWeight: '400' }}>(Text Only Bill)</span>
                  </div>
                )}
              </div>

              {/* Action Buttons & Info */}
              <div style={{ flex: '1', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                    Invoice & 80mm Thermal Receipt Logo
                  </span>
                  {formData.logo_url && (
                    <span style={{ 
                      fontSize: '11px', 
                      background: 'rgba(16, 185, 129, 0.15)', 
                      color: '#10b981', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontWeight: '700' 
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  This logo renders automatically at the top of all generated sales invoices, customer receipt popups, and printable 80mm thermal slips.
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setFormData(prev => ({ ...prev, logo_url: '/tioras-logo.png' }))}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                  >
                    👑 Use Tioras Logo
                  </button>

                  <label
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0, fontWeight: '600' }}
                  >
                    <Upload size={14} /> Upload Custom Logo
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      style={{ display: 'none' }}
                      onChange={handleLogoFileUpload}
                    />
                  </label>

                  {formData.logo_url && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      style={{ color: 'var(--accent-rose, #f43f5e)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Remove Logo
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Logo URL:</span>
                  <input
                    type="text"
                    name="logo_url"
                    className="form-control"
                    style={{ fontSize: '12px', padding: '6px 10px', height: '32px' }}
                    placeholder="/tioras-logo.png or data:image/..."
                    value={formData.logo_url || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: STORE IDENTITY */}
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '800', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: 'var(--accent-blue)', 
            marginBottom: '14px' 
          }}>
            Store Identity (Printed on Receipts & Barcode Stickers)
          </div>

          <div className="form-group">
            <label>Store Name *</label>
            <input 
              type="text" 
              name="store_name" 
              className="form-control" 
              value={formData.store_name || ''} 
              onChange={handleChange} 
              placeholder="TIORAS"
              required 
            />
          </div>

          <div className="form-group">
            <label>Tagline / Subheading</label>
            <input 
              type="text" 
              name="store_tagline" 
              className="form-control" 
              value={formData.store_tagline || ''} 
              onChange={handleChange} 
              placeholder="Fashion Studio"
            />
          </div>

          <div className="form-group">
            <label>Physical Address</label>
            <input 
              type="text" 
              name="store_address" 
              className="form-control" 
              value={formData.store_address || ''} 
              onChange={handleChange} 
              placeholder="Shop 14, High Street Arcade, Market Central, India"
            />
          </div>

          <div className="form-row">
            <div className="form-col form-group">
              <label>Store Phone / Tel</label>
              <input 
                type="text" 
                name="store_phone" 
                className="form-control" 
                value={formData.store_phone || ''} 
                onChange={handleChange} 
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="form-col form-group">
              <label>GSTIN Number</label>
              <input 
                type="text" 
                name="store_gstin" 
                className="form-control" 
                value={formData.store_gstin || ''} 
                onChange={handleChange} 
                placeholder="27AABCT1234F1Z5"
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '20px 0' }}></div>

          {/* SECTION 2.5: THERMAL BILLING PRINTER CONFIGURATION */}
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '800', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: 'var(--accent-cyan, #06b6d4)', 
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Printer size={16} />
            Thermal Billing Printer & POS Receipt Configuration
          </div>

          <div style={{
            background: 'var(--bg-card-hover, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '24px'
          }}>
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
              {/* Paper Roll Size */}
              <div className="form-col form-group">
                <label>Default Receipt Paper Roll Width *</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: formData.receipt_paper_size === '80mm' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)', 
                    border: `1px solid ${formData.receipt_paper_size === '80mm' ? 'var(--accent-cyan, #06b6d4)' : 'var(--border-color)'}`,
                    padding: '8px 14px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    flex: 1
                  }}>
                    <input 
                      type="radio" 
                      name="receipt_paper_size" 
                      value="80mm" 
                      checked={formData.receipt_paper_size === '80mm'} 
                      onChange={() => setFormData(prev => ({ ...prev, receipt_paper_size: '80mm' }))} 
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>80mm (3") Standard</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Epson, TVS, Citizen POS, POS-80</div>
                    </div>
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: formData.receipt_paper_size === '58mm' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)', 
                    border: `1px solid ${formData.receipt_paper_size === '58mm' ? 'var(--accent-cyan, #06b6d4)' : 'var(--border-color)'}`,
                    padding: '8px 14px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    flex: 1
                  }}>
                    <input 
                      type="radio" 
                      name="receipt_paper_size" 
                      value="58mm" 
                      checked={formData.receipt_paper_size === '58mm'} 
                      onChange={() => setFormData(prev => ({ ...prev, receipt_paper_size: '58mm' }))} 
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>58mm (2") Compact</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Mini Bluetooth & Mobile POS Roll</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Auto-print checkbox */}
              <div className="form-col form-group">
                <label>Automatic Billing Execution</label>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    <input 
                      type="checkbox" 
                      name="auto_print_receipt" 
                      checked={formData.auto_print_receipt} 
                      onChange={e => setFormData(prev => ({ ...prev, auto_print_receipt: e.target.checked }))} 
                    />
                    <span>Auto-Print Thermal Receipt Immediately on Checkout</span>
                  </label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    When enabled, submitting payment automatically sends the formatted bill to your thermal receipt printer.
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Receipt Header Headline</label>
                <input 
                  type="text" 
                  name="receipt_header" 
                  className="form-control" 
                  value={formData.receipt_header || ''} 
                  onChange={handleChange} 
                  placeholder="TAX INVOICE / CASH MEMO" 
                />
              </div>

              <div className="form-col form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleTestPrint}
                  style={{ width: '100%', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700', color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--accent-cyan, #06b6d4)' }}
                >
                  <Printer size={16} /> Print Sample Test Bill ({formData.receipt_paper_size || '80mm'})
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Receipt Return Policy & Footer Note</label>
              <textarea 
                name="receipt_footer" 
                className="form-control" 
                rows="2"
                value={formData.receipt_footer || ''} 
                onChange={handleChange} 
                placeholder="Thank you for shopping!\nExchange within 7 days with original bill."
                style={{ fontSize: '12px', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '20px 0' }}></div>

          {/* SECTION 3: UPI SETTINGS */}
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '800', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: 'var(--accent-emerald)', 
            marginBottom: '14px' 
          }}>
            Dynamic UPI QR Payment Settings
          </div>

          <div className="form-row">
            <div className="form-col form-group">
              <label>Merchant UPI VPA (e.g. yourstore@upi) *</label>
              <input 
                type="text" 
                name="upi_id" 
                className="form-control" 
                value={formData.upi_id || ''} 
                onChange={handleChange} 
                placeholder="7795208996-3@ybl" 
                required 
              />
            </div>
            <div className="form-col form-group">
              <label>UPI Merchant Name</label>
              <input 
                type="text" 
                name="upi_merchant_name" 
                className="form-control" 
                value={formData.upi_merchant_name || ''} 
                onChange={handleChange} 
                placeholder="PRASHANT HIREMATH" 
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '10px 20px', fontSize: '14px' }}>
              <Save size={16} />
              {saving ? "Saving to MongoDB..." : "Save Store Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

