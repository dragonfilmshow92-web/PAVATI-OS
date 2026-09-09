const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  category: { type: String, default: 'General' },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, default: 'cash' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, { collection: 'expenses' });

module.exports = mongoose.model('Expense', ExpenseSchema);
