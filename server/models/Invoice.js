const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  item_id: String,
  id: String,
  name: String,
  sku: String,
  barcode: String,
  category: String,
  qty: Number,
  unit_price: Number,
  selling_price: Number,
  cost_price: Number,
  gst_rate: { type: Number, default: 12 },
  hsn_code: String,
  discount_pct: { type: Number, default: 0 },
  line_total: Number,
  subtotal: Number,
  rack_name: { type: String, default: 'Rack A-01' }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  invoice_no: { type: String, unique: true, required: true },
  date: { type: String, default: () => new Date().toISOString() },
  customer_id: { type: String, default: null },
  customer_name: { type: String, default: 'Walk-in Retail Customer' },
  customer_phone: { type: String, default: '' },
  customer: { type: Object, default: {} },
  cashier: { type: String, default: 'Admin Cashier' },
  shift_id: { type: String, default: null },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  discount_total: { type: Number, default: 0 },
  coupon_code: { type: String, default: '' },
  tax_amount: { type: Number, default: 0 },
  total_tax: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },
  amount_paid: { type: Number, default: 0 },
  cash_tendered: { type: Number, default: 0 },
  change_amount: { type: Number, default: 0 },
  change_returned: { type: Number, default: 0 },
  payment_method: { 
    type: String, 
    default: 'cash', 
    set: v => (typeof v === 'string' ? v.toLowerCase() : v),
    enum: ['cash', 'upi', 'card', 'khata', 'wallet', 'split'] 
  },
  payment_details: { type: Object, default: {} },
  payment_split: { type: Object, default: {} },
  status: { type: String, default: 'completed', enum: ['completed', 'returned', 'partial_return', 'voided'] },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now, index: true }  // indexed for date-range reports
}, { collection: 'invoices' });

// Compound index for the most common report query: date range + status
InvoiceSchema.index({ created_at: -1, status: 1 });
// Customer history lookups
InvoiceSchema.index({ customer_id: 1 });
// Payment method breakdown queries
InvoiceSchema.index({ payment_method: 1 });


module.exports = mongoose.model('Invoice', InvoiceSchema);
