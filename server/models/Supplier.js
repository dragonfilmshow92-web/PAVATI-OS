const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  contact_person: { type: String, default: '' },
  phone: { type: String, default: '' },
  contact: { type: String, default: '' }, // alias for phone to prevent UI payload stripping
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  state_code: { type: String, default: '' },
  pan: { type: String, default: '' },
  gstin: { type: String, default: '' },
  category: { type: String, default: 'general' },
  payment_terms: { type: String, default: 'Net 30' },
  notes: { type: String, default: '' },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
}, { collection: 'suppliers' });

module.exports = mongoose.model('Supplier', SupplierSchema);
