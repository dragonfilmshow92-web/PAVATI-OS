const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  code: { type: String, unique: true, required: true, uppercase: true },
  description: { type: String, default: '' },
  discount_type: { 
    type: String, 
    default: 'percentage', 
    enum: ['percentage', 'percent', 'fixed', 'flat'] 
  },
  discount_value: { type: Number, required: true },
  min_cart_value: { type: Number, default: 0 },
  max_discount: { type: Number, default: null },
  usage_limit: { type: Number, default: null },
  usage_count: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  valid_from: { type: String, default: '' },
  valid_till: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, { collection: 'coupons' });

module.exports = mongoose.model('Coupon', CouponSchema);
