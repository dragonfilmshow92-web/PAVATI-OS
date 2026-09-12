import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import {
  Settings, Save, Image as ImageIcon, Upload, Trash2, Printer,
  Building2, FileText, CreditCard, Receipt
} from 'lucide-react';
import { printThermalReceipt } from '../utils/printReceipt';

const GST_STATES = [
  { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' }, { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' }, { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' }, { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' }, { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' }, { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' }, { code: '38', name: 'Ladakh' },
];

const CARD = {
  background: 'var(--bg-card-hover, rgba(255,255,255,0.03))',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '22px'
};

const sectionLabel = (color) => ({
  fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
  letterSpacing: '0.08em', color, marginBottom: '16px',
  display: 'flex', alignItems: 'center', gap: '7px',
  paddingBottom: '10px', borderBottom: `2px solid ${color}33`
});

const DEFAULT = {
  store_name: '', store_tagline: '', store_address: '', store_phone: '', email: '',
  legal_name: '', trade_name: '', pan: '', store_gstin: '',
  gst_registered: false, gst_registration_type: 'regular',
  store_city: '', store_state: '', store_state_code: '', store_pincode: '',
  invoice_prefix: 'INV', financial_year_start: 'April',
  default_tax_rate: 12, tax_inclusive_default: false,
  upi_id: '', upi_merchant_name: '', currency_symbol: 'â‚¹',
  receipt_header: 'TAX INVOICE / CASH MEMO',
  receipt_footer: 'Thank you for shopping with us!\nExchange within 7 days with original bill.',
  receipt_paper_size: '80mm', auto_print_receipt: false,
  show_hsn_on_receipt: true, show_gst_breakdown: true, logo_url: ''
};

export default function SettingsPage() {
  const { settings, setSettings, showToast } = useApp();
  const [form, setForm] = useState({ ...DEFAULT });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('store');

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setForm(prev => ({
        ...DEFAULT, ...settings,
        receipt_paper_size: localStorage.getItem('pos_receipt_paper_size') || settings.receipt_paper_size || '80mm',
        auto_print_receipt: localStorage.getItem('pos_auto_print_receipt') === 'true'
      }));
    }
  }, [settings]);

  const set = (name, value) => setForm(p => ({ ...p, [name]: value }));
  const onChange = e => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };
  const onStateChange = e => {
    const name = e.target.value;
    const found = GST_STATES.find(s => s.name === name);
    setForm(p => ({ ...p, store_state: name, store_state_code: found ? found.code : p.store_state_code }));
  };

  const onLogoUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2097152) { showToast('Logo too large (max 2 MB)', 'warning'); return; }
    const r = new FileReader();
    r.onload = ev => { set('logo_url', ev.target.result); showToast("Logo ready â€” save to persist", 'info'); };
    r.readAsDataURL(file);
  };

  const onTestPrint = () => {
    const sample = {
      invoice_no: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
      created_at: new Date().toISOString(),
      items: [
        { name: 'Cotton Shirt', qty: 1, selling_price: 1299, subtotal: 1299 },
        { name: 'Slim Denim', qty: 1, selling_price: 1899, subtotal: 1899 }
      ],
      subtotal: 3198, discount_total: 200, total_tax: 150, grand_total: 2998,
      payment_method: 'Cash', cash_tendered: 3000, change_returned: 2, customer_name: 'Walk-in Customer'
    };
    printThermalReceipt(sample, form, { paperSize: form.receipt_paper_size || '80mm' });
    showToast(`Test bill printed (${form.receipt_paper_size || '80mm'})`, 'success');
  };

  const onSave = async e => {
    e.preventDefault();
    if (form.gst_registered && form.store_gstin) {
      const ok = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.store_gstin.toUpperCase());
      if (!ok) { showToast('Invalid GSTIN â€” must be 15 chars like 27AABCT1234F1Z5', 'warning'); return; }
    }
    setSaving(true);
    try {
      localStorage.setItem('pos_receipt_paper_size', form.receipt_paper_size || '80mm');
      localStorage.setItem('pos_auto_print_receipt', String(!!form.auto_print_receipt));
      const payload = {
        ...form,
        store_gstin: (form.store_gstin || '').toUpperCase(),
        pan: (form.pan || '').toUpperCase(),
        tagline: form.store_tagline, address: form.store_address,
        phone: form.store_phone, gstin: form.store_gstin
      };
      const res = await api.updateSettings(payload);
      if (res?.success) { setSettings(res.data); showToast('Settings saved!', 'success'); }
      else showToast(res?.message || 'Failed to save', 'danger');
    } catch (err) {
      showToast('Error: ' + (err.message || 'Unknown'), 'danger');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'store', label: 'Store', icon: <Building2 size={13} /> },
    { id: 'gst', label: 'GST & Legal', icon: <FileText size={13} /> },
    { id: 'invoice', label: 'Invoice', icon: <Receipt size={13} /> },
    { id: 'print', label: 'Print', icon: <Printer size={13} /> },
    { id: 'payment', label: 'Payments', icon: <CreditCard size={13} /> },
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={22} color="var(--accent-blue)" /> Business Settings
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          GST registration, store identity, invoice configuration & print preferences
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '3px', marginBottom: '20px',
        background: 'var(--bg-card)', borderRadius: '10px', padding: '4px',
        border: '1px solid var(--border-color)', overflowX: 'auto'
      }}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            flex: '1 1 auto', minWidth: '100px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '8px 12px', borderRadius: '7px',
            background: tab === t.id ? 'var(--accent-blue)' : 'transparent',
            color: tab === t.id ? '#fff' : 'var(--text-muted)',
            fontWeight: '700', fontSize: '12px', transition: 'all 0.15s'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="pos-table-card" style={{ padding: '24px' }}>
        <form onSubmit={onSave}>

          {/* â•â• STORE IDENTITY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {tab === 'store' && <>
            <div style={sectionLabel('var(--accent-blue)')}><Building2 size={14} /> Store Identity</div>

            <div style={CARD}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  width: '150px', height: '100px', background: '#fff',
                  border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {form.logo_url
                    ? <img src={form.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>No Logo<br /><span style={{ fontSize: '9px' }}>Text-Only Bill</span></div>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontWeight: '700' }}>Store Logo</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PNG / JPG / SVG, max 2 MB. Printed on all bills.</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Upload size={13} /> Upload
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoUpload} />
                    </label>
                    {form.logo_url && (
                      <button type="button" className="btn btn-secondary btn-sm"
                        onClick={() => set('logo_url', '')}
                        style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>URL:</span>
                    <input type="text" name="logo_url" className="form-control"
                      style={{ fontSize: '11px', height: '28px' }}
                      value={form.logo_url || ''} onChange={onChange} placeholder="/logo.png" />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Store / Trade Name *</label>
              <input type="text" name="store_name" className="form-control" required
                value={form.store_name || ''} onChange={onChange} placeholder="Your Store Name" />
            </div>
            <div className="form-group">
              <label>Tagline</label>
              <input type="text" name="store_tagline" className="form-control"
                value={form.store_tagline || ''} onChange={onChange} placeholder="Style for Every Occasion" />
            </div>
            <div className="form-row">
              <div className="form-col form-group">
                <label>City</label>
                <input type="text" name="store_city" className="form-control"
                  value={form.store_city || ''} onChange={onChange} placeholder="Mumbai" />
              </div>
              <div className="form-col form-group">
                <label>PIN Code</label>
                <input type="text" name="store_pincode" className="form-control"
                  value={form.store_pincode || ''} onChange={onChange} placeholder="400001" maxLength={6} />
              </div>
            </div>
            <div className="form-group">
              <label>Full Address (on bills)</label>
              <input type="text" name="store_address" className="form-control"
                value={form.store_address || ''} onChange={onChange}
                placeholder="Shop 14, High Street Arcade, Mumbai - 400001, Maharashtra" />
            </div>
            <div className="form-row">
              <div className="form-col form-group">
                <label>Phone</label>
                <input type="text" name="store_phone" className="form-control"
                  value={form.store_phone || ''} onChange={onChange} placeholder="+91 98765 43210" />
              </div>
              <div className="form-col form-group">
                <label>Email</label>
                <input type="email" name="email" className="form-control"
                  value={form.email || ''} onChange={onChange} placeholder="store@example.com" />
              </div>
            </div>
          </>}

          {/* â•â• GST & LEGAL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {tab === 'gst' && <>
            <div style={sectionLabel('#f59e0b')}><FileText size={14} /> GST Registration & Legal Details</div>

            <div style={CARD}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', marginBottom: '8px' }}>
                <input type="checkbox" name="gst_registered" checked={!!form.gst_registered} onChange={onChange} />
                This business is GST Registered
              </label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '24px' }}>
                Enables CGST / SGST / IGST calculation on invoices and GRNs
              </div>

              {form.gst_registered && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Registration Type</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { val: 'regular', label: 'Regular', sub: 'Files GSTR-1 & 3B' },
                      { val: 'composition', label: 'Composition', sub: 'Flat % on turnover' },
                      { val: 'unregistered', label: 'Unregistered', sub: 'Below â‚¹40L' },
                    ].map(opt => (
                      <label key={opt.val} style={{
                        flex: '1 1 150px', display: 'flex', gap: '8px', cursor: 'pointer',
                        padding: '10px 12px', borderRadius: '8px',
                        background: form.gst_registration_type === opt.val ? 'rgba(245,158,11,0.12)' : 'var(--bg-input)',
                        border: `1px solid ${form.gst_registration_type === opt.val ? '#f59e0b' : 'var(--border-color)'}`
                      }}>
                        <input type="radio" name="gst_registration_type" value={opt.val}
                          checked={form.gst_registration_type === opt.val} onChange={onChange} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '12px' }}>{opt.label}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{opt.sub}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>GSTIN {form.gst_registered && <span style={{ color: '#f59e0b' }}>*</span>}</label>
                <input type="text" name="store_gstin" className="form-control"
                  value={form.store_gstin || ''} onChange={onChange}
                  placeholder="27AABCT1234F1Z5" maxLength={15}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>15-char format: 99AAAAA9999A9Z9</div>
              </div>
              <div className="form-col form-group">
                <label>PAN</label>
                <input type="text" name="pan" className="form-control"
                  value={form.pan || ''} onChange={onChange}
                  placeholder="AABCT1234F" maxLength={10}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Chars 3â€“7 of GSTIN</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>State (for GST)</label>
                <select name="store_state" className="form-control" value={form.store_state || ''} onChange={onStateChange}>
                  <option value="">â€” Select State â€”</option>
                  {GST_STATES.map(s => <option key={s.code} value={s.name}>{s.code} â€” {s.name}</option>)}
                </select>
              </div>
              <div className="form-col form-group">
                <label>GST State Code</label>
                <input type="text" name="store_state_code" className="form-control" readOnly
                  value={form.store_state_code || ''} style={{ opacity: 0.7 }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Auto-filled from state</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Legal / Registered Entity Name</label>
                <input type="text" name="legal_name" className="form-control"
                  value={form.legal_name || ''} onChange={onChange} placeholder="Your Business Name PVT LTD" />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>As per GST certificate / ROC</div>
              </div>
              <div className="form-col form-group">
                <label>Trade Name (if different)</label>
                <input type="text" name="trade_name" className="form-control"
                  value={form.trade_name || ''} onChange={onChange} placeholder="Your Store Name" />
              </div>
            </div>
          </>}

          {/* â•â• INVOICE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {tab === 'invoice' && <>
            <div style={sectionLabel('var(--accent-purple, #a855f7)')}><Receipt size={14} /> Invoice & Tax Configuration</div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Invoice Number Prefix</label>
                <input type="text" name="invoice_prefix" className="form-control"
                  value={form.invoice_prefix || 'INV'} onChange={onChange}
                  placeholder="INV" maxLength={8} style={{ textTransform: 'uppercase' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Preview: <strong>{(form.invoice_prefix || 'INV').toUpperCase()}-20260911-0042</strong>
                </div>
              </div>
              <div className="form-col form-group">
                <label>Financial Year Start</label>
                <select name="financial_year_start" className="form-control" value={form.financial_year_start || 'April'} onChange={onChange}>
                  <option value="April">April (Indian FY â€” Apr to Mar)</option>
                  <option value="January">January (Calendar Year)</option>
                  <option value="July">July</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Default GST Rate (%)</label>
                <select name="default_tax_rate" className="form-control" value={form.default_tax_rate ?? 12} onChange={onChange}>
                  {[0, 3, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%{r === 0 ? ' (Exempt)' : ''}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>For items without a specific GST rate</div>
              </div>
              <div className="form-col form-group">
                <label>Price Mode</label>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                    <input type="checkbox" name="tax_inclusive_default" checked={!!form.tax_inclusive_default} onChange={onChange} />
                    Selling prices are GST-inclusive (MRP)
                  </label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    When enabled, GST is back-calculated from the price entered.
                  </div>
                </div>
              </div>
            </div>

            <div style={CARD}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Invoice Number Format</div>
              <code style={{ fontSize: '13px', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '6px' }}>
                {(form.invoice_prefix || 'INV').toUpperCase()}-YYYYMMDD-NNNN
              </code>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Counter is atomic in MongoDB. Reset requires direct DB access.
              </div>
            </div>
          </>}

          {/* â•â• PRINT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {tab === 'print' && <>
            <div style={sectionLabel('var(--accent-cyan, #06b6d4)')}><Printer size={14} /> Receipt & Thermal Print</div>

            <div style={CARD}>
              <div className="form-row" style={{ alignItems: 'flex-start' }}>
                <div className="form-col form-group">
                  <label>Paper Roll Width</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {[
                      { val: '80mm', label: '80mm (3")', sub: 'Epson, TVS, Citizen' },
                      { val: '58mm', label: '58mm (2")', sub: 'Mini Bluetooth POS' },
                      { val: 'A4', label: 'A4 Full Page', sub: 'Laser / Inkjet' },
                    ].map(opt => (
                      <label key={opt.val} style={{
                        flex: '1 1 130px', display: 'flex', gap: '8px', cursor: 'pointer',
                        padding: '10px 12px', borderRadius: '8px',
                        background: form.receipt_paper_size === opt.val ? 'rgba(6,182,212,0.12)' : 'var(--bg-input)',
                        border: `1px solid ${form.receipt_paper_size === opt.val ? '#06b6d4' : 'var(--border-color)'}`
                      }}>
                        <input type="radio" name="receipt_paper_size" value={opt.val}
                          checked={form.receipt_paper_size === opt.val} onChange={onChange} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '12px' }}>{opt.label}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{opt.sub}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-col form-group">
                  <label>Auto-Print</label>
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', alignItems: 'center' }}>
                      <input type="checkbox" name="auto_print_receipt" checked={!!form.auto_print_receipt} onChange={onChange} />
                      Auto-print on checkout
                    </label>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Sends bill to printer automatically after payment
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Receipt Header Line</label>
                <input type="text" name="receipt_header" className="form-control"
                  value={form.receipt_header || ''} onChange={onChange} placeholder="TAX INVOICE / CASH MEMO" />
              </div>
              <div className="form-col form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" className="btn btn-secondary"
                  onClick={onTestPrint}
                  style={{ width: '100%', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontWeight: '700', color: '#06b6d4', borderColor: '#06b6d4' }}>
                  <Printer size={14} /> Print Test ({form.receipt_paper_size || '80mm'})
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Receipt Footer / Return Policy</label>
              <textarea name="receipt_footer" className="form-control" rows="3"
                value={form.receipt_footer || ''} onChange={onChange}
                style={{ fontSize: '12px', resize: 'vertical' }} />
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  <input type="checkbox" name="show_hsn_on_receipt" checked={!!form.show_hsn_on_receipt} onChange={onChange} />
                  Show HSN Code on Receipt
                </label>
              </div>
              <div className="form-col form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  <input type="checkbox" name="show_gst_breakdown" checked={!!form.show_gst_breakdown} onChange={onChange} />
                  Show CGST / SGST / IGST Breakdown
                </label>
              </div>
            </div>
          </>}

          {/* â•â• PAYMENTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {tab === 'payment' && <>
            <div style={sectionLabel('var(--accent-emerald)')}><CreditCard size={14} /> Payment & UPI Settings</div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>UPI VPA (Merchant ID) *</label>
                <input type="text" name="upi_id" className="form-control" required
                  value={form.upi_id || ''} onChange={onChange} placeholder="yourstore@upi or 9876543210@ybl" />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>QR on billing screen and printed on invoices</div>
              </div>
              <div className="form-col form-group">
                <label>UPI Merchant Display Name</label>
                <input type="text" name="upi_merchant_name" className="form-control"
                  value={form.upi_merchant_name || ''} onChange={onChange} placeholder="Your Store Name" />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Shown in customer's UPI app when scanning</div>
              </div>
            </div>

            <div style={CARD}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Currency Symbol</label>
                <input type="text" name="currency_symbol" className="form-control"
                  value={form.currency_symbol || 'â‚¹'} onChange={onChange}
                  placeholder="â‚¹" maxLength={4} style={{ maxWidth: '100px' }} />
              </div>
            </div>

            {form.upi_id && (
              <div style={{ ...CARD, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '6px' }}>âœ… UPI Configured</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  QR codes generated dynamically per invoice using: <br />
                  <code style={{ fontWeight: '700' }}>{form.upi_id}</code>
                  {form.upi_merchant_name && <> â€” {form.upi_merchant_name}</>}
                </div>
              </div>
            )}
          </>}

          {/* Save */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saved to MongoDB Atlas</span>
            <button type="submit" className="btn btn-primary" disabled={saving}
              style={{ padding: '10px 24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

