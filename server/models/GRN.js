const mongoose = require('mongoose');

const GRNItemSchema = new mongoose.Schema({
  item_id: String,
  item_name: String,
  barcode: String,
  sku: String,
  qty: Number,
  qty_received: Number,
  cost_price: Number,
  selling_price: Number,
  mrp: Number,
  gst_rate: Number,
  rack_name: String,
  line_total: Number
}, { _id: false });

const GRNSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  grn_no: { type: String, unique: true, required: true },
  supplier_id: { type: String, default: null },
  supplier_name: { type: String, default: '' },
  purchase_order_id: { type: String, default: null },
  invoice_no: { type: String, default: '' },
  items: [GRNItemSchema],
  total_amount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  received_by: { type: String, default: 'Admin' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  received_date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  created_at: { type: Date, default: Date.now }
}, { collection: 'grn_records' });

module.exports = mongoose.model('GRN', GRNSchema);

