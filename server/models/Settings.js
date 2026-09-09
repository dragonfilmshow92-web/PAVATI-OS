const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'store_settings' },

  // Store Identity
  store_name:     { type: String, default: 'TIORAS' },
  store_tagline:  { type: String, default: 'Fashion Studio' },
  store_address:  { type: String, default: 'Shop 14, High Street Arcade, Market Central, India' },
  store_phone:    { type: String, default: '+91 98765 43210' },
  store_gstin:    { type: String, default: '27AABCT1234F1Z5' },
  email:          { type: String, default: 'support@tioras.com' },

  // Payment
  upi_id:              { type: String, default: '7795208996-3@ybl' },
  upi_merchant_name:   { type: String, default: 'PRASHANT HIREMATH' },
  currency_symbol:     { type: String, default: '₹' },

  // Receipt
  receipt_header:  { type: String, default: 'GST INVOICE / CASH MEMO' },
  receipt_footer:  { type: String, default: 'Thank you for shopping at Tioras Fashion Studio!\nExchange within 7 days with original bill.' },

  // Tax
  default_tax_rate: { type: Number, default: 12 },

  // Branding
  logo_url:    { type: String, default: '/tioras-logo.png' },

  // Internal
  initialized:     { type: Boolean, default: false },
  invoice_counter: { type: Number, default: 0 },  // atomic invoice number counter

  // ERPNext integration config
  erpnext: { type: Object, default: {} }

}, { collection: 'settings', _id: false, strict: false });

module.exports = mongoose.model('Settings', SettingsSchema);
