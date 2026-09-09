const mongoose = require('mongoose');

const POItemSchema = new mongoose.Schema({
  item_id: String,
  item_name: String,
  sku: String,
  qty_ordered: Number,
  cost_price: Number,
  line_total: Number
}, { _id: false });

const PurchaseOrderSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  po_no: { type: String, unique: true, required: true },
  supplier_id: { type: String, default: null },
  supplier_name: { type: String, default: '' },
  items: [POItemSchema],
  total_amount: { type: Number, default: 0 },
  status: { type: String, default: 'pending', enum: ['pending', 'ordered', 'partially_received', 'received', 'cancelled'] },
  expected_date: { type: String, default: '' },
  notes: { type: String, default: '' },
  created_by: { type: String, default: 'Admin' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'purchase_orders' });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
