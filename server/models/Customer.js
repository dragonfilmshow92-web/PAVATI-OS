const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '', index: true },  // indexed for checkout customer search

  email: { type: String, default: '' },
  address: { type: String, default: '' },
  gstin: { type: String, default: '' },
  loyalty_points: { type: Number, default: 0 },
  wallet_balance: { type: Number, default: 0 },
  khata_balance: { type: Number, default: 0 },
  total_purchases: { type: Number, default: 0 },
  visit_count: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'customers' });

module.exports = mongoose.model('Customer', CustomerSchema);
