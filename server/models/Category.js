const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  name:       { type: String, required: true },
  icon:       { type: String, default: '📦' },
  sort_order: { type: Number, default: 0 },
  active:     { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
}, { collection: 'categories', strict: false });

module.exports = mongoose.model('Category', CategorySchema);

