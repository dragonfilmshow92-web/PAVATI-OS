const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  cashier: { type: String, default: 'Admin' },
  status: { type: String, default: 'OPEN', enum: ['OPEN', 'CLOSED'] },
  opening_cash: { type: Number, default: 2000 },
  closing_cash: { type: Number, default: null },
  sales_total: { type: Number, default: 0 },
  invoice_count: { type: Number, default: 0 },
  cash_sales: { type: Number, default: 0 },
  cash_refunds: { type: Number, default: 0 },
  cash_expenses: { type: Number, default: 0 },
  cash_withdrawals: { type: Number, default: 0 },
  expected_cash: { type: Number, default: 0 },
  expected_closing_cash: { type: Number, default: 0 },
  actual_closing_cash: { type: Number, default: null },
  discrepancy: { type: Number, default: 0 },
  upi_sales: { type: Number, default: 0 },
  card_sales: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  open_time: { type: Date, default: Date.now },
  close_time: { type: Date, default: null }
}, { collection: 'shifts' });

module.exports = mongoose.model('Shift', ShiftSchema);
