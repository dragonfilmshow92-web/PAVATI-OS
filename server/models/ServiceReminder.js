const mongoose = require('mongoose');

const ServiceReminderSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  customer_name: { type: String, default: 'General Customer' },
  customer_phone: { type: String, default: '' },
  service_type: { type: String, default: 'Maintenance' }, // Warranty, Maintenance, Periodic Checkup, Delivery
  due_date: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'scheduled', 'completed', 'overdue'] },
  priority: { type: String, default: 'medium', enum: ['low', 'medium', 'high'] },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, { collection: 'service_reminders' });

module.exports = mongoose.model('ServiceReminder', ServiceReminderSchema);
