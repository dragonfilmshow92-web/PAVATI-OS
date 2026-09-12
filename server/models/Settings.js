const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'store_settings' },

  // ── Store Identity ──────────────────────────────────────────────────────────
  store_name:     { type: String, default: 'My Store' },
  store_tagline:  { type: String, default: '' },
  store_address:  { type: String, default: '' },
  store_phone:    { type: String, default: '' },
  email:          { type: String, default: '' },

  // ── Legal / GST Identity ────────────────────────────────────────────────────
  legal_name:         { type: String, default: '' },  // Registered legal entity name
  trade_name:         { type: String, default: '' },  // Trade / DBA name (can differ from store_name)
  pan:                { type: String, default: '' },  // PAN number
  store_gstin:        { type: String, default: '' },  // GSTIN (15-char)
  gst_registered:     { type: Boolean, default: false }, // Is GST registered?
  gst_registration_type: {
    type: String,
    default: 'regular',
    enum: ['regular', 'composition', 'unregistered']
  },

  // ── Store Location ──────────────────────────────────────────────────────────
  store_city:       { type: String, default: '' },
  store_state:      { type: String, default: '' },      // e.g. "Maharashtra"
  store_state_code: { type: String, default: '' },      // e.g. "27" (GST state code)
  store_pincode:    { type: String, default: '' },

  // ── Invoice & Credit Note Settings ──────────────────────────────────────────
  invoice_prefix:       { type: String, default: 'INV' },  // e.g. INV, BILL, TAX
  credit_note_prefix:   { type: String, default: 'CN' },   // e.g. CN, CRN
  financial_year_start: { type: String, default: 'April' }, // Month when financial year starts

  // ── Tax Defaults ────────────────────────────────────────────────────────────
  default_tax_rate:     { type: Number, default: 12 },     // GST % applied to items without a specific rate
  tax_inclusive_default: { type: Boolean, default: false }, // Are prices GST-inclusive by default?

  // ── Payment ─────────────────────────────────────────────────────────────────
  upi_id:            { type: String, default: '' },
  upi_merchant_name: { type: String, default: '' },
  currency_symbol:   { type: String, default: '₹' },

  // ── Receipt / Print ─────────────────────────────────────────────────────────
  receipt_header:    { type: String, default: 'TAX INVOICE / CASH MEMO' },
  receipt_footer:    { type: String, default: 'Thank you for shopping with us!\nExchange within 7 days with original bill.' },
  receipt_paper_size: { type: String, default: '80mm', enum: ['58mm', '80mm', 'A4'] },
  auto_print_receipt: { type: Boolean, default: false },
  show_hsn_on_receipt: { type: Boolean, default: true },
  show_gst_breakdown:  { type: Boolean, default: true },

  // ── Branding ─────────────────────────────────────────────────────────────────
  logo_url: { type: String, default: '' },

  // ── Internal Counters ────────────────────────────────────────────────────────
  initialized:          { type: Boolean, default: false },
  invoice_counter:      { type: Number, default: 0 },
  credit_note_counter:  { type: Number, default: 0 },

  // ── ERPNext Integration ──────────────────────────────────────────────────────
  erpnext: { type: Object, default: {} }

}, { collection: 'settings', _id: false, strict: false });

module.exports = mongoose.model('Settings', SettingsSchema);

