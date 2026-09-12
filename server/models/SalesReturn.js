const mongoose = require('mongoose');

const ReturnItemSchema = new mongoose.Schema({
  item_id: String,
  id: String,
  name: String,
  sku: String,
  barcode: String,
  hsn_code: { type: String, default: '' },
  qty: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  gst_rate: { type: Number, default: 12 },
  tax_inclusive: { type: Boolean, default: false },
  taxable_amount: { type: Number, default: 0 },
  cgst_rate: { type: Number, default: 0 },
  sgst_rate: { type: Number, default: 0 },
  igst_rate: { type: Number, default: 0 },
  cgst_amount: { type: Number, default: 0 },
  sgst_amount: { type: Number, default: 0 },
  igst_amount: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  line_total: { type: Number, default: 0 }
}, { _id: false });

const SalesReturnSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  credit_note_no: { type: String, unique: true, required: true, index: true },
  original_invoice_no: { type: String, required: true, index: true },
  customer_id: { type: String, default: null },
  customer_name: { type: String, default: 'Walk-in Retail Customer' },
  customer_phone: { type: String, default: '' },
  customer_gstin: { type: String, default: '' },
  customer: { type: Object, default: {} },
  seller_state: { type: String, default: '' },
  seller_state_code: { type: String, default: '' },
  buyer_state: { type: String, default: '' },
  buyer_state_code: { type: String, default: '' },
  is_interstate: { type: Boolean, default: false },
  items: [ReturnItemSchema],
  subtotal_reversed: { type: Number, default: 0 },
  taxable_amount_reversed: { type: Number, default: 0 },
  cgst_amount_reversed: { type: Number, default: 0 },
  sgst_amount_reversed: { type: Number, default: 0 },
  igst_amount_reversed: { type: Number, default: 0 },
  tax_reversed: { type: Number, default: 0 },
  round_off_reversed: { type: Number, default: 0 },
  refund_amount: { type: Number, required: true, default: 0 },
  refund_mode: { 
    type: String, 
    default: 'Cash',
    enum: ['Cash', 'UPI', 'Store Credit', 'Card', 'Exchange Only', 'Bank Transfer']
  },
  is_exchange: { type: Boolean, default: false },
  exchange_notes: { type: String, default: '' },
  reason: { type: String, default: 'Customer Return' },
  cashier: { type: String, default: 'Admin Cashier' },
  date: { type: String, default: () => new Date().toISOString() },
  created_at: { type: Date, default: Date.now, index: true }
}, { collection: 'sales_returns' });

module.exports = mongoose.model('SalesReturn', SalesReturnSchema);
