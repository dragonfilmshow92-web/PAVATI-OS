const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  sku: { type: String, default: '', index: true },
  barcode: { type: String, default: '', index: true },
  name: { type: String, required: true },
  category: { type: String, default: 'general' },
  spec: { type: String, default: '' },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  brand: { type: String, default: '' },
  rack_location: { type: String, default: '' },
  cost_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  offer_price: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  gst_rate: { type: Number, default: 12 },
  hsn_code: { type: String, default: '' },
  stock_qty: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 5 },
  uom: { type: String, default: 'Pcs' },
  image: { type: String, default: '📦' },
  subcategory: { type: String, default: '' },
  sale_category: { type: String, default: '' },
  min_stock: { type: Number, default: 0 },
  max_stock: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'items' });

ItemSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Item', ItemSchema);
