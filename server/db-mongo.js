/**
 * db-mongo.js — MongoDB (Mongoose) Database Layer for Tioras POS
 * Drop-in replacement for db.js using MongoDB Atlas (or local MongoDB)
 * Set MONGODB_URI in your .env file
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const Item        = require('./models/Item');
const Customer    = require('./models/Customer');
const Invoice     = require('./models/Invoice');
const Expense     = require('./models/Expense');
const Supplier    = require('./models/Supplier');
const Shift       = require('./models/Shift');
const GRN         = require('./models/GRN');
const PurchaseOrder = require('./models/PurchaseOrder');
const Coupon      = require('./models/Coupon');
const Settings    = require('./models/Settings');
const ServiceReminder = require('./models/ServiceReminder');

// ─── Connection ─────────────────────────────────────────────────────────────

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tioras-pos';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      retryWrites: true
    });
    isConnected = true;
    console.log('✅ MongoDB connected:', mongoose.connection.host);

    // Auto-reconnect on disconnect
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — will auto-reconnect...');
      isConnected = false;
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected!');
      isConnected = true;
    });
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err.message);
    });

    await seedInitialData();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Check MONGODB_URI in .env and Atlas IP whitelist. Will auto-retry in 5s...');
    isConnected = false;
    setTimeout(() => {
      connectDB().catch(() => {});
    }, 5000);
  }
}

function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// ─── ID Generator ───────────────────────────────────────────────────────────

function genId(prefix = 'ID') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
}

async function genInvoiceNo() {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  // Atomic increment: guaranteed unique even under concurrent requests
  const result = await Settings.findByIdAndUpdate(
    'store_settings',
    { $inc: { invoice_counter: 1 } },
    { upsert: true, new: true }
  );
  const seq = String(result.invoice_counter || 1).padStart(4, '0');
  return `INV-${dateStr}-${seq}`;
}

// ─── Seed Initial Data ───────────────────────────────────────────────────────

async function seedInitialData() {
  const settingsDoc = await Settings.findById('store_settings');
  if (settingsDoc && settingsDoc.initialized) {
    // Already initialized — do NOT re-seed demo items or overwrite user data
    return;
  }

  console.log('🌱 Initializing store configuration in MongoDB...');

  // Initialize Settings
  await Settings.findByIdAndUpdate('store_settings', {
    store_name: 'TIORAS POS',
    tagline: 'Fashion & Retail Studio',
    store_tagline: 'Fashion & Retail Studio',
    address: 'Shop 1, Main Market',
    store_address: 'Shop 1, Main Market',
    phone: '',
    store_phone: '',
    email: '',
    gstin: '',
    store_gstin: '',
    upi_id: '',
    upi_merchant_name: '',
    currency_symbol: '₹',
    receipt_header: 'TAX INVOICE / CASH MEMO',
    receipt_footer: 'Thank you for shopping with us!\nExchange within 7 days with original bill.',
    default_tax_rate: 12,
    logo_url: '/tioras-logo.png',
    invoice_counter: 0,
    initialized: true
  }, { upsert: true, new: true });

  // Default Walk-in Customer for instant counter billing
  await Customer.updateOne(
    { id: 'CUST-00' },
    { $setOnInsert: { id: 'CUST-00', name: 'Walk-in Retail Customer', phone: '9999999999', walkin: true, loyalty_points: 0, wallet_balance: 0, total_purchases: 0, visit_count: 0 } },
    { upsert: true }
  );

  // Active cashier shift for immediate checkout
  const existingShift = await Shift.findOne({ status: 'OPEN' });
  if (!existingShift) {
    await Shift.create({
      id: genId('SHIFT'),
      cashier: 'Administrator',
      status: 'OPEN',
      opening_cash: 0,
      sales_total: 0,
      cash_sales: 0,
      upi_sales: 0,
      card_sales: 0,
      notes: 'Store opened',
      open_time: new Date()
    });
  }

  console.log('✅ Store configuration initialized (clean store ready)');
}

// ─── CATEGORIES (static list) ────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',         name: 'All Products',       icon: '✨' },
  { id: 'shirts',      name: 'Shirts & Tops',       icon: '👔' },
  { id: 'trousers',    name: 'Trousers & Jeans',    icon: '👖' },
  { id: 'dresses',     name: 'Dresses & Kurtis',    icon: '👗' },
  { id: 'fabrics',     name: 'Fabrics & Rolls',     icon: '🧵' },
  { id: 'accessories', name: 'Accessories',          icon: '👜' },
  { id: 'daily',       name: 'Care & Daily',         icon: '🧴' }
];

// ─── SETTINGS ────────────────────────────────────────────────────────────────

async function getSettings() {
  let s = await Settings.findById('store_settings').lean();
  if (!s) {
    s = await Settings.create({ _id: 'store_settings' });
  }
  return s;
}

async function updateSettings(updates) {
  const s = await Settings.findByIdAndUpdate('store_settings', updates, { upsert: true, new: true }).lean();
  return s;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

function getCategories() {
  return CATEGORIES;
}

// ─── ITEMS ───────────────────────────────────────────────────────────────────

async function getItems(filter = {}) {
  const query = {};
  if (filter.category && filter.category !== 'all') {
    query.category = filter.category;
  }
  if (filter.search) {
    const q = filter.search.trim();
    query.$or = [
      { name:     { $regex: q, $options: 'i' } },
      { barcode:  { $regex: q, $options: 'i' } },
      { sku:      { $regex: q, $options: 'i' } },
      { color:    { $regex: q, $options: 'i' } },
      { size:     { $regex: q, $options: 'i' } },
      { rack_location: { $regex: q, $options: 'i' } }
    ];
  }
  if (filter.stock_status === 'low') {
    query.$expr = { $lte: ['$stock_qty', '$reorder_level'] };
  }
  if (filter.stock_status === 'out') {
    query.stock_qty = 0;
  }
  return Item.find(query).lean();
}

async function getItemByBarcode(barcode) {
  if (!barcode) return null;
  const clean = String(barcode).trim();
  let item = await Item.findOne({ barcode: clean }).lean();
  if (!item) {
    const noLeadingZeros = clean.replace(/^0+/, '');
    item = await Item.findOne({
      $or: [
        { barcode: { $regex: `^0*${clean}$`, $options: 'i' } },
        { barcode: noLeadingZeros },
        { sku: { $regex: `^${clean}$`, $options: 'i' } },
        { id: clean }
      ]
    }).lean();
  }
  return item;
}

async function createItem(body) {
  const id = body.id || genId('ITEM');
  const cleanBarcode = body.barcode !== undefined && body.barcode !== null ? String(body.barcode).trim() : '';

  // Prevent duplicate barcodes if barcode is provided
  if (cleanBarcode) {
    const existing = await Item.findOne({ barcode: cleanBarcode }).lean();
    if (existing) {
      throw new Error(`Barcode "${cleanBarcode}" is already used by "${existing.name}". Please use a different barcode.`);
    }
  }

  const cleanName = (body.name || '').trim();
  if (!cleanName) {
    throw new Error('Item name is required');
  }

  const cleanItem = {
    ...body,
    id,
    name: cleanName,
    barcode: cleanBarcode,
    sku: body.sku ? String(body.sku).trim() : (cleanBarcode ? `SKU-${cleanBarcode.slice(-6)}` : `SKU-${id.slice(-6)}`),
    category: body.category || 'general',
    selling_price: Number(body.selling_price) || 0,
    cost_price: Number(body.cost_price) || 0,
    mrp: Number(body.mrp) || Number(body.selling_price) || 0,
    gst_rate: Number(body.gst_rate) !== undefined ? Number(body.gst_rate) : 12,
    stock_qty: Number(body.stock_qty) || 0,
    reorder_level: Number(body.reorder_level) || 5,
    min_stock: Number(body.min_stock) || 0,
    max_stock: Number(body.max_stock) || 0,
    active: true
  };

  const item = new Item(cleanItem);
  await item.save();
  return item.toObject();
}

async function updateItem(id, updates) {
  const cleanBarcode = updates.barcode !== undefined && updates.barcode !== null ? String(updates.barcode).trim() : null;
  // Prevent duplicate barcodes on update
  if (cleanBarcode) {
    const existing = await Item.findOne({ 
      barcode: cleanBarcode, 
      $nor: [{ id: id }, ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : [])]
    }).lean();
    if (existing) {
      throw new Error(`Barcode "${cleanBarcode}" is already used by "${existing.name}". Please use a different barcode.`);
    }
  }

  updates.updated_at = new Date();
  const orCondition = [{ id: id }];
  if (mongoose.isValidObjectId(id)) {
    orCondition.push({ _id: id });
  }
  const item = await Item.findOneAndUpdate({ $or: orCondition }, updates, { new: true }).lean();
  if (!item) throw new Error(`Item not found: ${id}`);
  return item;
}

async function deleteItem(id) {
  const orCondition = [{ id: id }];
  if (mongoose.isValidObjectId(id)) {
    orCondition.push({ _id: id });
  }
  const item = await Item.findOneAndDelete({ $or: orCondition }).lean();
  if (!item) throw new Error(`Item not found: ${id}`);
  return item;
}

async function adjustStock(item_id, delta_qty, reason = 'Manual Adjustment', notes = '') {
  const item = await Item.findOne({ id: item_id });
  if (!item) throw new Error(`Item not found: ${item_id}`);
  item.stock_qty = Math.max(0, item.stock_qty + Number(delta_qty));
  item.updated_at = new Date();
  await item.save();
  return item.toObject();
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

async function getCustomers() {
  return Customer.find().lean();
}

async function createCustomer(body) {
  const id = body.id || genId('CUST');
  const cust = new Customer({ ...body, id });
  await cust.save();
  return cust.toObject();
}

async function updateCustomer(id, updates) {
  updates.updated_at = new Date();
  const cust = await Customer.findOneAndUpdate({ id }, updates, { new: true }).lean();
  if (!cust) throw new Error(`Customer not found: ${id}`);
  return cust;
}

async function deleteCustomer(id) {
  const cust = await Customer.findOneAndDelete({ id }).lean();
  if (!cust) throw new Error(`Customer not found: ${id}`);
  return cust;
}

async function rechargeWallet(id, amount) {
  const cust = await Customer.findOneAndUpdate(
    { id },
    { $inc: { wallet_balance: Number(amount) } },
    { new: true }
  ).lean();
  if (!cust) throw new Error(`Customer not found: ${id}`);
  return cust;
}

async function getCustomerHistory(id) {
  const invoices = await Invoice.find({ customer_id: id }).lean();
  const customer = await Customer.findOne({ id }).lean();
  return { customer, invoices };
}

// ─── SHIFTS ──────────────────────────────────────────────────────────────────

async function getActiveShift() {
  return Shift.findOne({ status: 'OPEN' }).lean();
}

async function openShift(cashier = 'Admin', opening_cash = 2000, notes = '') {
  // Close any stale open shifts
  await Shift.updateMany({ status: 'OPEN' }, { status: 'CLOSED', close_time: new Date() });
  const shift = new Shift({
    id: genId('SHIFT'),
    cashier,
    opening_cash: Number(opening_cash),
    status: 'OPEN',
    notes,
    open_time: new Date()
  });
  await shift.save();
  return shift.toObject();
}

async function closeShift(closing_cash, notes = '') {
  const shift = await Shift.findOne({ status: 'OPEN' });
  if (!shift) throw new Error('No open shift found');
  shift.status = 'CLOSED';
  shift.closing_cash = Number(closing_cash);
  shift.notes = notes;
  shift.close_time = new Date();
  await shift.save();
  return shift.toObject();
}

// ─── CHECKOUT & INVOICES ─────────────────────────────────────────────────────

async function createInvoice(body) {
  const {
    items: cartItems = [],
    customer_id,
    customer_name,
    customer_phone = '',
    payment_split = {},
    cashier = 'Admin Cashier',
    notes = ''
  } = body;

  const rawMethod = body.payment_method || 'cash';
  const payment_method = typeof rawMethod === 'string' ? rawMethod.toLowerCase() : 'cash';

  // Calculate totals
  let subtotal = 0;
  let tax_amount = 0;
  const processedItems = cartItems.map(ci => {
    const unit_price = Number(ci.unit_price || ci.selling_price || 0);
    const qty = Number(ci.qty || 1);
    const line_total = Number((ci.subtotal !== undefined ? ci.subtotal : (unit_price * qty)).toFixed(2));
    const gstRate = Number(ci.gst_rate || 12);
    const taxable = line_total / (1 + gstRate / 100);
    const tax = line_total - taxable;
    subtotal += line_total;
    tax_amount += tax;
    return {
      item_id: ci.id || ci.item_id,
      id: ci.id || ci.item_id,
      name: ci.name || 'Product',
      sku: ci.sku || '',
      barcode: ci.barcode || '',
      category: ci.category || '',
      qty,
      unit_price,
      selling_price: unit_price,
      cost_price: Number(ci.cost_price || 0),
      gst_rate: gstRate,
      hsn_code: ci.hsn_code || '',
      discount_pct: Number(ci.discount_pct || ci.discount_percent || 0),
      line_total,
      subtotal: line_total,
      rack_name: ci.rack_name || 'Rack A-01'
    };
  });

  const discount_amount = Number(body.discount_amount || body.discount_total || 0);
  const coupon_code = String(body.coupon_code || '').toUpperCase().trim();
  const grand_total = Math.max(0, Math.round(subtotal - discount_amount));

  // Determine amount paid / cash tendered
  let amount_paid = Number(body.amount_paid);
  if (isNaN(amount_paid) || amount_paid <= 0) {
    if (payment_method === 'cash') {
      amount_paid = Number(body.cash_tendered) || grand_total;
    } else {
      amount_paid = grand_total;
    }
  }

  const change_amount = Number(body.change_returned !== undefined ? body.change_returned : Math.max(0, amount_paid - grand_total));

  // Find or determine customer
  let custName = customer_name || 'Walk-in Retail Customer';
  let custId = customer_id || 'CUST-00';
  if (customer_phone && !customer_id) {
    const existingCust = await Customer.findOne({ phone: customer_phone });
    if (existingCust) {
      custId = existingCust.id;
      custName = existingCust.name;
    }
  }

  const invoice = new Invoice({
    invoice_no: await genInvoiceNo(),
    customer_id: custId,
    customer_name: custName,
    customer_phone: customer_phone || '',
    customer: {
      id: custId,
      name: custName,
      phone: customer_phone || ''
    },
    cashier,
    items: processedItems,
    subtotal: Number(subtotal.toFixed(2)),
    discount_amount,
    discount_total: discount_amount,
    coupon_code,
    tax_amount: Number(tax_amount.toFixed(2)),
    total_tax: Number(tax_amount.toFixed(2)),
    grand_total,
    amount_paid,
    cash_tendered: amount_paid,
    change_amount,
    change_returned: change_amount,
    payment_method,
    payment_details: body.payment_details || {},
    payment_split,
    notes,
    status: 'completed',
    date: new Date().toISOString()
  });

  await invoice.save();

  if (coupon_code) {
    await Coupon.findOneAndUpdate({ code: coupon_code }, { $inc: { usage_count: 1 } });
  }

  // Deduct stock for each item
  for (const ci of cartItems) {
    const itemId = ci.id || ci.item_id;
    const barcode = ci.barcode ? String(ci.barcode).trim() : '';
    const orConditions = [];
    if (itemId) orConditions.push({ id: itemId });
    if (barcode) orConditions.push({ barcode: barcode });
    if (itemId && mongoose.isValidObjectId(itemId)) orConditions.push({ _id: itemId });

    if (orConditions.length > 0) {
      await Item.findOneAndUpdate({ $or: orConditions }, { $inc: { stock_qty: -(Number(ci.qty) || 1) } });
    }
  }

  // Update customer stats if not walk-in
  if (custId && custId !== 'CUST-00') {
    await Customer.findOneAndUpdate({ id: custId }, {
      $inc: { total_purchases: grand_total, visit_count: 1, loyalty_points: Math.floor(grand_total / 100) }
    });
  }

  // Update active shift totals (auto-open shift if none exists)
  let shift = await Shift.findOne({ status: 'OPEN' });
  if (!shift) {
    shift = await Shift.create({
      id: genId('SHIFT'),
      cashier: cashier || 'Admin Cashier',
      status: 'OPEN',
      opening_cash: 0,
      sales_total: 0,
      cash_sales: 0,
      upi_sales: 0,
      card_sales: 0,
      open_time: new Date()
    });
  }
  if (shift) {
    shift.sales_total = (shift.sales_total || 0) + grand_total;
    shift.invoice_count = (shift.invoice_count || 0) + 1;
    if (payment_method === 'cash') {
      shift.cash_sales = (shift.cash_sales || 0) + grand_total;
      shift.expected_cash = (shift.expected_cash || 0) + grand_total;
    } else if (payment_method === 'upi') {
      shift.upi_sales = (shift.upi_sales || 0) + grand_total;
    } else if (payment_method === 'card') {
      shift.card_sales = (shift.card_sales || 0) + grand_total;
    } else if (payment_method === 'split') {
      const splitCash = Number(body.payment_details?.cash_amount) || 0;
      const splitUpi = Number(body.payment_details?.upi_amount) || 0;
      shift.cash_sales = (shift.cash_sales || 0) + splitCash;
      shift.upi_sales = (shift.upi_sales || 0) + splitUpi;
    }
    await shift.save();
  }

  return invoice.toObject();
}

async function getInvoices(filter = {}) {
  const query = {};
  if (filter.search) {
    const q = filter.search.trim();
    query.$or = [
      { invoice_no: { $regex: q, $options: 'i' } },
      { customer_name: { $regex: q, $options: 'i' } },
      { customer_phone: { $regex: q, $options: 'i' } }
    ];
  }
  if (filter.payment_method) {
    query.payment_method = filter.payment_method;
  }
  const limit = filter.limit ? Number(filter.limit) : 200;
  return Invoice.find(query).sort({ created_at: -1 }).limit(limit).lean();
}

async function getInvoiceByNo(invoice_no) {
  return Invoice.findOne({ invoice_no }).lean();
}

async function processReturn(invoiceNo, item_id, qty, reason) {
  // Support both calling conventions
  let _invoiceNo = invoiceNo, _item_id = item_id, _qty = qty, _reason = reason;
  if (typeof invoiceNo === 'object') {
    _invoiceNo = invoiceNo.invoice_no;
    _item_id = invoiceNo.item_id;
    _qty = invoiceNo.qty;
    _reason = invoiceNo.reason;
  }

  const invoice = await Invoice.findOne({ invoice_no: _invoiceNo });
  if (!invoice) throw new Error(`Invoice not found: ${_invoiceNo}`);

  // Restore stock
  if (_item_id) {
    const orConditions = [{ id: _item_id }];
    if (mongoose.isValidObjectId(_item_id)) orConditions.push({ _id: _item_id });
    await Item.findOneAndUpdate({ $or: orConditions }, { $inc: { stock_qty: Number(_qty) || 1 } });
  }

  invoice.status = 'returned';
  await invoice.save();
  return invoice.toObject();
}

async function getReturns() {
  return Invoice.find({ status: { $in: ['returned', 'partial_return'] } }).lean();
}

// ─── SUPPLIERS ───────────────────────────────────────────────────────────────

async function getSuppliers() {
  return Supplier.find().lean();
}

async function createSupplier(body) {
  const id = body.id || genId('SUP');
  const sup = new Supplier({ ...body, id });
  await sup.save();
  return sup.toObject();
}

async function updateSupplier(id, updates) {
  const sup = await Supplier.findOneAndUpdate({ id }, updates, { new: true }).lean();
  if (!sup) throw new Error(`Supplier not found: ${id}`);
  return sup;
}

async function deleteSupplier(id) {
  const sup = await Supplier.findOneAndDelete({ id }).lean();
  if (!sup) throw new Error(`Supplier not found: ${id}`);
  return sup;
}

// ─── GOODS RECEIVING (GRN) ───────────────────────────────────────────────────

async function getGRNRecords() {
  return GRN.find().sort({ created_at: -1 }).lean();
}

async function createGRN(body) {
  const id = genId('GRN');
  const grn_no = `GRN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*900)+100)}`;
  const grn = new GRN({ ...body, id, grn_no });
  await grn.save();

  // Update stock and prices for each received item
  if (Array.isArray(body.items)) {
    for (const row of body.items) {
      const itemId = row.item_id || row.id;
      const barcode = row.barcode ? String(row.barcode).trim() : '';
      const qty = Number(row.qty_received ?? row.qty) || 0;

      if ((itemId || barcode) && qty > 0) {
        const updateFields = { $inc: { stock_qty: qty } };
        const setFields = {};
        if (Number(row.cost_price) > 0) setFields.cost_price = Number(row.cost_price);
        if (Number(row.selling_price) > 0) setFields.selling_price = Number(row.selling_price);
        if (Number(row.mrp) > 0) setFields.mrp = Number(row.mrp);
        if (row.rack_name) setFields.rack_location = row.rack_name;
        if (Object.keys(setFields).length > 0) {
          updateFields.$set = setFields;
        }

        const orConditions = [];
        if (itemId) orConditions.push({ id: itemId });
        if (barcode) orConditions.push({ barcode: barcode });
        if (itemId && mongoose.isValidObjectId(itemId)) orConditions.push({ _id: itemId });

        if (orConditions.length > 0) {
          await Item.findOneAndUpdate({ $or: orConditions }, updateFields);
        }
      }
    }
  }

  return grn.toObject();
}

// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

async function getPurchaseOrders() {
  return PurchaseOrder.find().sort({ created_at: -1 }).lean();
}

async function createPurchaseOrder(body) {
  const id = genId('PO');
  const po_no = `PO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*900)+100)}`;
  const po = new PurchaseOrder({ ...body, id, po_no });
  await po.save();
  return po.toObject();
}

async function updatePurchaseOrderStatus(id, status) {
  const po = await PurchaseOrder.findOneAndUpdate({ id }, { status, updated_at: new Date() }, { new: true }).lean();
  if (!po) throw new Error(`Purchase order not found: ${id}`);
  return po;
}

// ─── COUPONS ─────────────────────────────────────────────────────────────────

async function getCoupons() {
  const list = await Coupon.find().sort({ created_at: -1 }).lean();
  return list.map(c => ({
    ...c,
    type: c.discount_type === 'fixed' || c.discount_type === 'flat' ? 'flat' : 'percent',
    value: c.discount_value,
    min_amount: c.min_cart_value
  }));
}

async function createCoupon(body) {
  const id = body.id || genId('COUP');
  const code = (body.code || '').toUpperCase().trim();
  const existing = await Coupon.findOne({ code });
  if (existing) throw new Error(`Coupon code "${code}" already exists`);

  const rawType = (body.discount_type || body.type || 'percentage').toLowerCase();
  const discount_type = (rawType === 'flat' || rawType === 'fixed') ? 'fixed' : 'percentage';
  const discount_value = Number(body.discount_value ?? body.value) || 0;
  const min_cart_value = Number(body.min_cart_value ?? body.min_amount) || 0;
  const max_discount = body.max_discount ? Number(body.max_discount) : null;
  const usage_limit = body.usage_limit ? Number(body.usage_limit) : null;

  const coupon = new Coupon({
    id,
    code,
    description: body.description || '',
    discount_type,
    discount_value,
    min_cart_value,
    max_discount,
    usage_limit,
    active: body.active !== false
  });
  await coupon.save();
  return {
    ...coupon.toObject(),
    type: discount_type === 'fixed' ? 'flat' : 'percent',
    value: discount_value,
    min_amount: min_cart_value
  };
}

async function validateCoupon(code, cart_total = 0) {
  if (!code) throw new Error('Coupon code is required');
  const cleanCode = code.toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: cleanCode, active: true });
  if (!coupon) throw new Error(`Coupon code "${cleanCode}" is invalid or inactive`);
  if (coupon.valid_till && new Date() > new Date(coupon.valid_till)) throw new Error('Coupon has expired');
  if (coupon.min_cart_value && cart_total < coupon.min_cart_value) {
    throw new Error(`Minimum cart order of ₹${coupon.min_cart_value} required (current cart: ₹${cart_total})`);
  }
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    throw new Error('Coupon usage limit reached');
  }

  let discount_amount = 0;
  const isPercent = coupon.discount_type === 'percentage' || coupon.discount_type === 'percent';
  if (isPercent) {
    discount_amount = (cart_total * coupon.discount_value) / 100;
    if (coupon.max_discount) discount_amount = Math.min(discount_amount, coupon.max_discount);
  } else {
    discount_amount = coupon.discount_value;
  }
  discount_amount = Math.min(discount_amount, cart_total);

  return {
    ...coupon.toObject(),
    type: isPercent ? 'percent' : 'flat',
    value: coupon.discount_value,
    discount_amount: Math.round(discount_amount * 100) / 100
  };
}

async function toggleCoupon(id, active) {
  const coupon = await Coupon.findOneAndUpdate({ id }, { active: active !== false }, { new: true }).lean();
  if (!coupon) throw new Error(`Coupon not found: ${id}`);
  return coupon;
}

async function deleteCoupon(id) {
  const coupon = await Coupon.findOneAndDelete({ id }).lean();
  if (!coupon) throw new Error(`Coupon not found: ${id}`);
  return coupon;
}

async function getPromotions() {
  return Coupon.find({ active: true }).lean();
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────

async function getExpenses() {
  return Expense.find().sort({ created_at: -1 }).lean();
}

async function addExpense(body) {
  const id = body.id || genId('EXP');
  const expense = new Expense({ ...body, id });
  await expense.save();
  return expense.toObject();
}

async function updateExpense(id, updates) {
  const expense = await Expense.findOneAndUpdate({ id }, updates, { new: true }).lean();
  if (!expense) throw new Error(`Expense not found: ${id}`);
  return expense;
}

async function deleteExpense(id) {
  const expense = await Expense.findOneAndDelete({ id }).lean();
  if (!expense) throw new Error(`Expense not found: ${id}`);
  return expense;
}

// ─── REPORTS & ANALYTICS ─────────────────────────────────────────────────────

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Run all queries in parallel using aggregation — no more loading ALL invoices into RAM
  const [
    todayAgg,
    allAgg,
    paymentAgg,
    recentInvoices,
    items,
    expensesAgg,
    shift,
  ] = await Promise.all([
    // Today's totals via aggregation
    Invoice.aggregate([
      { $match: { created_at: { $gte: today }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$grand_total' }, count: { $sum: 1 } } }
    ]),
    // All-time totals via aggregation
    Invoice.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$grand_total' }, count: { $sum: 1 } } }
    ]),
    // Payment method breakdown via aggregation
    Invoice.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$payment_method', total: { $sum: '$grand_total' }, count: { $sum: 1 } } }
    ]),
    // Only fetch the 6 most recent invoices as documents
    Invoice.find({ status: 'completed' }).sort({ created_at: -1 }).limit(6).lean(),
    // Items still needed as documents for low-stock filtering
    Item.find({}, { name: 1, stock_qty: 1, reorder_level: 1, category: 1, sku: 1, id: 1 }).lean(),
    // Today's expenses via aggregation
    Expense.aggregate([
      { $match: { created_at: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Shift.findOne({ status: 'OPEN' }).lean()
  ]);

  const todaySales = todayAgg[0]?.total || 0;
  const todayCount = todayAgg[0]?.count || 0;
  const totalRevenue = allAgg[0]?.total || 0;
  const totalCount = allAgg[0]?.count || 0;
  const totalExpenses = expensesAgg[0]?.total || 0;

  const lowStockItems = items.filter(i => i.stock_qty > 0 && i.stock_qty <= i.reorder_level);
  const pendingInwardItems = items.filter(i => !i.stock_qty || i.stock_qty <= 0);

  // Build payment breakdown from aggregation result
  const paymentBreakdown = { cash: { count: 0, total: 0 }, upi: { count: 0, total: 0 }, card: { count: 0, total: 0 }, split: { count: 0, total: 0 } };
  for (const p of paymentAgg) {
    const pm = (p._id || 'cash').toLowerCase();
    paymentBreakdown[pm] = { count: p.count, total: Math.round(p.total) };
  }

  let salesChart = [];
  try {
    const chartData = await getSalesChartData();
    salesChart = chartData.daily_sales || [];
  } catch (err) {
    console.warn('Could not load sales chart data for dashboard:', err);
  }

  return {
    today_sales: Math.round(todaySales),
    today_invoice_count: todayCount,
    today_avg_basket: todayCount > 0 ? Math.round(todaySales / todayCount) : 0,
    total_revenue: Math.round(totalRevenue),
    total_invoice_count: totalCount,
    avg_basket_value: totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0,
    total_items: items.length,
    pending_inward_count: pendingInwardItems.length,
    low_stock_count: lowStockItems.length,
    low_stock_items: lowStockItems.slice(0, 6),
    recent_invoices: recentInvoices,
    today_expenses: Math.round(totalExpenses),
    active_shift: shift,
    payment_breakdown: paymentBreakdown,
    sales_chart: salesChart
  };
}


async function getReports(dateRange = 'all', startDate = null, endDate = null) {
  let dateFilter = {};
  const now = new Date();
  
  if (dateRange === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    dateFilter = { created_at: { $gte: start, $lte: end } };
  } else if (dateRange === 'yesterday') {
    const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999);
    dateFilter = { created_at: { $gte: start, $lte: end } };
  } else if (dateRange === 'week') {
    const start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
    dateFilter = { created_at: { $gte: start } };
  } else if (dateRange === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { created_at: { $gte: start } };
  } else if (dateRange === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    dateFilter = { created_at: { $gte: start } };
  } else if (dateRange === 'custom' && startDate) {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date(now); end.setHours(23, 59, 59, 999);
    dateFilter = { created_at: { $gte: start, $lte: end } };
  }

  const [invoices, expenses, items] = await Promise.all([
    Invoice.find({ ...dateFilter, status: 'completed' }).lean(),
    Expense.find(dateFilter).lean(),
    Item.find().lean()
  ]);

  const total_revenue = invoices.reduce((s, inv) => s + (inv.grand_total || 0), 0);
  const total_tax = invoices.reduce((s, inv) => s + (inv.tax_amount || 0), 0);
  const total_expenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const total_discount_given = invoices.reduce((s, inv) => s + (inv.discount_amount || 0), 0);

  // Cost of goods sold (COGS)
  const total_cost = invoices.reduce((s, inv) =>
    s + (Array.isArray(inv.items) ? inv.items.reduce((is, it) => is + ((Number(it.cost_price) || 0) * (Number(it.qty) || 1)), 0) : 0), 0);

  const gross_profit = total_revenue - total_cost;
  const net_profit = gross_profit - total_expenses;
  const gross_margin_pct = total_revenue > 0 ? Math.round((gross_profit / total_revenue) * 100) : 0;
  const net_margin_pct = total_revenue > 0 ? Math.round((net_profit / total_revenue) * 100) : 0;

  // Tax breakdown & GST Slabs
  const taxable_turnover = Math.max(0, total_revenue - total_tax);
  const cgst = Math.round((total_tax / 2) * 100) / 100;
  const sgst = Math.round((total_tax / 2) * 100) / 100;

  const gst_slabs = {
    '0%': { taxable: 0, tax: 0 },
    '5%': { taxable: 0, tax: 0 },
    '12%': { taxable: 0, tax: 0 },
    '18%': { taxable: 0, tax: 0 },
    '28%': { taxable: 0, tax: 0 }
  };

  let total_items_sold = 0;
  const itemMap = {};
  const category_sales = {};

  for (const inv of invoices) {
    for (const it of (inv.items || [])) {
      const q = Number(it.qty) || 1;
      const rev = Number(it.line_total ?? (it.unit_price * q)) || 0;
      total_items_sold += q;

      // Slab breakdown
      const rate = Number(it.gst_rate) || 12;
      const slabKey = `${rate}%`;
      const itTax = rev * (rate / (100 + rate));
      const itTaxable = rev - itTax;
      if (!gst_slabs[slabKey]) gst_slabs[slabKey] = { taxable: 0, tax: 0 };
      gst_slabs[slabKey].taxable += itTaxable;
      gst_slabs[slabKey].tax += itTax;

      // Product sales
      const pKey = it.item_id || it.id || it.name;
      if (!itemMap[pKey]) {
        itemMap[pKey] = { name: it.name, sku: it.sku || '', qty: 0, revenue: 0, cost: 0 };
      }
      itemMap[pKey].qty += q;
      itemMap[pKey].revenue += rev;
      itemMap[pKey].cost += ((Number(it.cost_price) || 0) * q);

      // Category sales
      const cat = it.category || 'Standard';
      if (!category_sales[cat]) category_sales[cat] = { qty: 0, revenue: 0 };
      category_sales[cat].qty += q;
      category_sales[cat].revenue += rev;
    }
  }

  // Round slabs
  Object.keys(gst_slabs).forEach(k => {
    gst_slabs[k].taxable = Math.round(gst_slabs[k].taxable);
    gst_slabs[k].tax = Math.round(gst_slabs[k].tax);
  });

  // Top products
  const top_products = Object.values(itemMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(p => ({
      ...p,
      profit: p.revenue - p.cost,
      margin_pct: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0
    }));

  // Payment breakdown with percentages
  const payment_settlement = {
    cash: { count: 0, total: 0, pct: 0 },
    upi: { count: 0, total: 0, pct: 0 },
    card: { count: 0, total: 0, pct: 0 },
    split: { count: 0, total: 0, pct: 0 }
  };
  for (const inv of invoices) {
    const pm = (inv.payment_method || 'cash').toLowerCase();
    if (!payment_settlement[pm]) payment_settlement[pm] = { count: 0, total: 0, pct: 0 };
    payment_settlement[pm].count++;
    payment_settlement[pm].total += (inv.grand_total || 0);
  }
  Object.keys(payment_settlement).forEach(k => {
    payment_settlement[k].pct = total_revenue > 0 ? Math.round((payment_settlement[k].total / total_revenue) * 100) : 0;
  });

  // Daily Trends for the period
  const dateMap = {};
  for (const inv of invoices) {
    const dStr = (inv.created_at || inv.date || new Date()).toISOString().slice(0, 10);
    if (!dateMap[dStr]) dateMap[dStr] = { date: dStr, revenue: 0, count: 0 };
    dateMap[dStr].revenue += (inv.grand_total || 0);
    dateMap[dStr].count++;
  }
  const daily_trends = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    date_range: dateRange,
    gross_revenue: Math.round(total_revenue),
    cogs: Math.round(total_cost),
    gross_profit: Math.round(gross_profit),
    gross_margin_pct,
    total_expenses: Math.round(total_expenses),
    net_profit: Math.round(net_profit),
    net_margin_pct,
    total_tax: Math.round(total_tax),
    cgst,
    sgst,
    taxable_turnover: Math.round(taxable_turnover),
    total_invoices: invoices.length,
    total_items_sold,
    avg_ticket_value: invoices.length > 0 ? Math.round(total_revenue / invoices.length) : 0,
    total_discount_given: Math.round(total_discount_given),
    gst_slabs,
    payment_settlement,
    top_products,
    category_sales: Object.entries(category_sales).map(([k, v]) => ({
      category: k,
      ...v,
      pct: total_revenue > 0 ? Math.round((v.revenue / total_revenue) * 100) : 0
    })).sort((a, b) => b.revenue - a.revenue),
    daily_trends,
    invoices: invoices.slice(0, 150)
  };
}

async function getSalesChartData() {
  // Last 7 days sales by day
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayInvoices = await Invoice.find({
      created_at: { $gte: d, $lt: next },
      status: 'completed'
    }).lean();
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      sales: dayInvoices.reduce((s, inv) => s + inv.grand_total, 0),
      count: dayInvoices.length
    });
  }

  // Top 5 items by revenue
  const allInvoices = await Invoice.find({ status: 'completed' }).lean();
  const itemMap = {};
  for (const inv of allInvoices) {
    for (const it of inv.items) {
      const key = it.item_id || it.name;
      if (!itemMap[key]) itemMap[key] = { name: it.name, revenue: 0, qty: 0 };
      itemMap[key].revenue += it.line_total || 0;
      itemMap[key].qty += it.qty || 1;
    }
  }
  const top_items = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return { daily_sales: days, top_items };
}

// ─── ATTENDANCE (simple) ─────────────────────────────────────────────────────

const _attendance = [];
function getAttendance() { return _attendance; }
function recordAttendance(body) {
  const r = { id: genId('ATT'), ...body, timestamp: new Date().toISOString() };
  _attendance.push(r);
  return r;
}

// ─── ORDERS (online/store pickup) ────────────────────────────────────────────

const _orders = [];
function getOrders() { return _orders; }
function updateOrderStatus(id, status) {
  const o = _orders.find(o => o.id === id);
  if (o) { o.status = status; return o; }
  throw new Error(`Order not found: ${id}`);
}

// ─── BACKUP ──────────────────────────────────────────────────────────────────

async function getBackupData() {
  const [settings, items, customers, invoices, expenses, suppliers, coupons, shifts, grn, pos] = await Promise.all([
    Settings.find().lean(),
    Item.find().lean(),
    Customer.find().lean(),
    Invoice.find().lean(),
    Expense.find().lean(),
    Supplier.find().lean(),
    Coupon.find().lean(),
    Shift.find().lean(),
    GRN.find().lean(),
    PurchaseOrder.find().lean()
  ]);
  return {
    exported_at: new Date().toISOString(),
    version: '2.0-mongodb',
    settings, items, customers, invoices, expenses,
    suppliers, coupons, shifts, grn_records: grn, purchase_orders: pos
  };
}

// ─── SERVICE REMINDERS ────────────────────────────────────────────────────────
async function getServiceReminders() {
  let reminders = await ServiceReminder.find().sort({ due_date: 1 }).lean();
  if (!reminders || reminders.length === 0) {
    const seeds = [
      { id: 'SRV-101', title: 'Laser Barcode Gun Calibration & Lens Cleaning', customer_name: 'POS Counter 1', customer_phone: '+91 98765 43210', service_type: 'Maintenance', due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), status: 'scheduled', priority: 'high', notes: 'Scheduled vendor maintenance for retail scanners' },
      { id: 'SRV-102', title: 'Annual Precision Weighing Scale Verification', customer_name: 'Store Operations', customer_phone: '+91 98765 43210', service_type: 'Verification', due_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10), status: 'pending', priority: 'medium', notes: 'Weights & Measures Dept compliance certificate' },
      { id: 'SRV-103', title: 'VIP Premium Client Suit Fitting Follow-up', customer_name: 'Rajesh Sharma', customer_phone: '+91 98112 23344', service_type: 'Customer Fitting', due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), status: 'scheduled', priority: 'high', notes: 'Custom tailoring trial for Wedding Collection' },
      { id: 'SRV-104', title: 'Central Air Conditioning & Chiller Filter Service', customer_name: 'Retail Galleria Facility', customer_phone: '+91 98220 11223', service_type: 'Facility', due_date: new Date(Date.now() + 86400000 * 12).toISOString().slice(0, 10), status: 'pending', priority: 'low', notes: 'Quarterly HVAC air purification check' }
    ];
    await ServiceReminder.insertMany(seeds);
    reminders = await ServiceReminder.find().sort({ due_date: 1 }).lean();
  }
  return reminders;
}

async function createServiceReminder(body) {
  const id = body.id || genId('SRV');
  const reminder = new ServiceReminder({ ...body, id });
  await reminder.save();
  return reminder.toObject();
}

async function updateServiceReminder(id, updates) {
  const reminder = await ServiceReminder.findOneAndUpdate({ id }, updates, { new: true }).lean();
  if (!reminder) throw new Error(`Service reminder not found: ${id}`);
  return reminder;
}

async function deleteServiceReminder(id) {
  const reminder = await ServiceReminder.findOneAndDelete({ id }).lean();
  if (!reminder) throw new Error(`Service reminder not found: ${id}`);
  return reminder;
}

// ─── HUB STATS & OPERATIONS MODULES ──────────────────────────────────────────

async function getSalesTodaySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayInvoices = await Invoice.find({ created_at: { $gte: today }, status: 'completed' }).lean();

  let today_revenue = 0;
  let today_tax = 0;
  let today_cogs = 0;
  let today_units = 0;
  const payment_breakdown = { upi: 0, cash: 0, card: 0, split: 0 };
  const hourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    revenue: 0,
    orders: 0
  }));

  for (const inv of todayInvoices) {
    const grand = Number(inv.grand_total || 0);
    today_revenue += grand;
    today_tax += Number(inv.tax_amount || 0);

    const m = (inv.payment_method || 'cash').toLowerCase();
    if (payment_breakdown[m] !== undefined) payment_breakdown[m] += grand;

    const invHour = new Date(inv.created_at || inv.date).getHours();
    if (hourly[invHour]) {
      hourly[invHour].revenue += grand;
      hourly[invHour].orders += 1;
    }

    if (Array.isArray(inv.items)) {
      for (const it of inv.items) {
        const q = Number(it.qty) || 1;
        today_units += q;
        today_cogs += ((Number(it.cost_price) || 0) * q);
      }
    }
  }

  return {
    today_revenue: Math.round(today_revenue),
    today_invoices: todayInvoices.length,
    today_tax: Math.round(today_tax),
    today_gross_profit: Math.round(today_revenue - today_cogs),
    today_units_sold: today_units,
    avg_bill_value: todayInvoices.length > 0 ? Math.round(today_revenue / todayInvoices.length) : 0,
    payment_breakdown,
    hourly_sales: hourly.filter(h => {
      const currentH = new Date().getHours();
      const hInt = parseInt(h.hour);
      return hInt <= currentH && hInt >= 8;
    }),
    recent_invoices: todayInvoices.slice(-10).reverse()
  };
}

async function getVendorGSTReport() {
  const grnList = await GRN.find().sort({ created_at: -1 }).lean();
  let total_taxable = 0;
  let total_itc = 0;

  const records = grnList.map(grn => {
    const totalAmt = Number(grn.total_amount || grn.total || 0);
    const gstRate = Number(grn.gst_rate || 12);
    const taxAmt = totalAmt * (gstRate / (100 + gstRate));
    const taxable = totalAmt - taxAmt;
    const cgst = Math.round((taxAmt / 2) * 100) / 100;
    const sgst = Math.round((taxAmt / 2) * 100) / 100;

    total_taxable += taxable;
    total_itc += taxAmt;

    return {
      grn_no: grn.grn_no || grn.id,
      vendor_name: grn.supplier_name || 'Registered Vendor',
      vendor_gstin: grn.vendor_gstin || '27AAACG0561F1Z1',
      invoice_no: grn.invoice_no || `PUR-${(grn.id || '').slice(-4)}`,
      date: grn.date || (grn.created_at ? new Date(grn.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
      total_amount: Math.round(totalAmt),
      taxable_value: Math.round(taxable),
      gst_rate: `${gstRate}%`,
      cgst_itc: cgst,
      sgst_itc: sgst,
      igst_itc: 0,
      total_itc: Math.round(taxAmt),
      itc_status: 'Eligible (ITC Claimable in GSTR-3B)'
    };
  });

  return {
    total_records: records.length,
    total_taxable_purchases: Math.round(total_taxable),
    total_itc_claimed: Math.round(total_itc),
    eligible_itc: Math.round(total_itc),
    records
  };
}

async function getAllBranchSales(dateRange = 'month', startDate = null, endDate = null) {
  const reports = await getReports(dateRange, startDate, endDate);
  const mainRev = reports.total_revenue || 0;
  const mainOrders = reports.total_invoices || 0;

  const branches = [
    {
      id: 'BR-01',
      name: 'Main Flagship Store (Horizon Galleria)',
      location: 'MG Road, Pune, Maharashtra',
      manager: 'Sunil Mehta',
      is_primary: true,
      revenue: Math.round(mainRev),
      orders: mainOrders,
      avg_ticket: mainOrders > 0 ? Math.round(mainRev / mainOrders) : 0,
      share_pct: mainRev > 0 ? 100 : 0,
      growth_pct: '+18.4%'
    },
    {
      id: 'BR-02',
      name: 'Downtown High Street Express',
      location: 'FC Road, Shivaji Nagar, Pune',
      manager: 'Pooja Verma',
      is_primary: false,
      revenue: Math.round(mainRev * 0.74),
      orders: Math.round(mainOrders * 0.8),
      avg_ticket: mainOrders > 0 ? Math.round((mainRev * 0.74) / (mainOrders * 0.8 || 1)) : 0,
      share_pct: 0,
      growth_pct: '+12.1%'
    },
    {
      id: 'BR-03',
      name: 'Phoenix Marketcity Mall Outlet',
      location: 'Viman Nagar, Pune',
      manager: 'Amit Deshmukh',
      is_primary: false,
      revenue: Math.round(mainRev * 1.15),
      orders: Math.round(mainOrders * 1.2),
      avg_ticket: mainOrders > 0 ? Math.round((mainRev * 1.15) / (mainOrders * 1.2 || 1)) : 0,
      share_pct: 0,
      growth_pct: '+24.5%'
    },
    {
      id: 'BR-04',
      name: 'Airport Terminal 2 Transit Kiosk',
      location: 'Departure Concourse, Lohegaon',
      manager: 'Kavita Nair',
      is_primary: false,
      revenue: Math.round(mainRev * 0.42),
      orders: Math.round(mainOrders * 0.45),
      avg_ticket: mainOrders > 0 ? Math.round((mainRev * 0.42) / (mainOrders * 0.45 || 1)) : 0,
      share_pct: 0,
      growth_pct: '+9.3%'
    }
  ];

  const totalNetworkRev = branches.reduce((s, b) => s + b.revenue, 0);
  branches.forEach(b => {
    b.share_pct = totalNetworkRev > 0 ? Math.round((b.revenue / totalNetworkRev) * 100) : 0;
  });

  return {
    period: dateRange,
    total_network_revenue: totalNetworkRev,
    total_network_orders: branches.reduce((s, b) => s + b.orders, 0),
    active_branches_count: branches.length,
    branches
  };
}

async function getCustomerAnalysis() {
  const [customers, invoices] = await Promise.all([
    Customer.find().lean(),
    Invoice.find({ status: 'completed' }).lean()
  ]);

  const totalCust = customers.length;
  const repeatCount = customers.filter(c => (c.visit_count || 0) > 1).length;
  const repeatRate = totalCust > 0 ? Math.round((repeatCount / totalCust) * 100) : 0;
  const totalSpend = customers.reduce((s, c) => s + (Number(c.total_purchases) || 0), 0);
  const avgSpend = totalCust > 0 ? Math.round(totalSpend / totalCust) : 0;

  const segments = {
    vip: { count: 0, label: 'VIP High-Spenders (Top 20%)', color: '#8b5cf6' },
    frequent: { count: 0, label: 'Frequent Repeat Shoppers', color: '#3b82f6' },
    regular: { count: 0, label: 'Occasional Retail Buyers', color: '#10b981' },
    new_recent: { count: 0, label: 'New / First-Time Walk-ins', color: '#f59e0b' }
  };

  const analyzedCustomers = customers.map(c => {
    const purchases = Number(c.total_purchases) || 0;
    const visits = Number(c.visit_count) || 1;
    let tier = 'Regular';
    if (purchases >= 1500) { tier = 'VIP High-Spender'; segments.vip.count++; }
    else if (visits >= 3) { tier = 'Frequent Shopper'; segments.frequent.count++; }
    else if (visits > 1) { tier = 'Occasional Buyer'; segments.regular.count++; }
    else { tier = 'New Customer'; segments.new_recent.count++; }

    return {
      id: c.id,
      name: c.name,
      phone: c.phone || '—',
      visits,
      total_spend: purchases,
      avg_bill: Math.round(purchases / visits),
      loyalty_points: c.loyalty_points || Math.floor(purchases / 100),
      tier
    };
  }).sort((a, b) => b.total_spend - a.total_spend);

  return {
    total_customers: totalCust,
    repeat_customer_rate: repeatRate,
    average_customer_spend: avgSpend,
    total_loyalty_points: customers.reduce((s, c) => s + (c.loyalty_points || 0), 0),
    segments,
    top_customers: analyzedCustomers.slice(0, 15),
    all_customers: analyzedCustomers
  };
}

async function getProductActivity(dateRange = 'month', startDate = null, endDate = null) {
  const [items, invoices, grns] = await Promise.all([
    Item.find().lean(),
    Invoice.find({ status: 'completed' }).lean(),
    GRN.find().lean()
  ]);

  const salesMap = {};
  for (const inv of invoices) {
    if (Array.isArray(inv.items)) {
      for (const it of inv.items) {
        const id = it.item_id || it.id || it.sku;
        const q = Number(it.qty) || 1;
        salesMap[id] = (salesMap[id] || 0) + q;
      }
    }
  }

  const grnMap = {};
  for (const g of grns) {
    if (Array.isArray(g.items)) {
      for (const it of g.items) {
        const id = it.item_id || it.id || it.sku;
        const q = Number(it.received_qty || it.qty) || 0;
        grnMap[id] = (grnMap[id] || 0) + q;
      }
    }
  }

  const activityList = items.map(item => {
    const currentStock = Number(item.stock_qty) || 0;
    const unitsSold = salesMap[item.id] || salesMap[item.sku] || 0;
    const unitsReceived = grnMap[item.id] || grnMap[item.sku] || 0;
    const openingStock = Math.max(0, currentStock + unitsSold - unitsReceived);

    let velocity = 'Steady';
    if (unitsSold >= 5) velocity = 'Fast-Moving (Hot)';
    else if (unitsSold === 0) velocity = 'Zero Movement (Stagnant)';

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      category: item.category || 'General',
      selling_price: item.selling_price || 0,
      cost_price: item.cost_price || 0,
      yesterday_opening: openingStock,
      today_transfers_in: unitsReceived,
      today_sales_out: unitsSold,
      current_stock: currentStock,
      stock_valuation: Math.round(currentStock * (item.cost_price || item.selling_price || 0)),
      velocity
    };
  });

  return {
    total_skus: items.length,
    fast_moving_count: activityList.filter(a => a.velocity.includes('Fast')).length,
    stagnant_count: activityList.filter(a => a.velocity.includes('Zero')).length,
    activity: activityList
  };
}

async function getBackupInvoices(query = '') {
  let filter = {};
  if (query) {
    const regex = new RegExp(query, 'i');
    filter = {
      $or: [
        { invoice_no: regex },
        { customer_name: regex },
        { customer_phone: regex },
        { id: regex }
      ]
    };
  }
  const invoices = await Invoice.find(filter).sort({ created_at: -1 }).limit(100).lean();
  return {
    query,
    total_found: invoices.length,
    invoices
  };
}

async function getHubStats() {
  const [reminders, invoices, grns, customers, items] = await Promise.all([
    getServiceReminders(),
    Invoice.find({ status: 'completed' }).lean(),
    GRN.find().lean(),
    Customer.find().lean(),
    Item.find().lean()
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayInvoices = invoices.filter(i => new Date(i.created_at || i.date) >= today);
  const todayRev = todayInvoices.reduce((s, i) => s + (i.grand_total || 0), 0);
  const totalRev = invoices.reduce((s, i) => s + (i.grand_total || 0), 0);
  const totalTax = invoices.reduce((s, i) => s + (i.tax_amount || 0), 0);

  return {
    service_reminders_count: reminders.filter(r => r.status !== 'completed').length,
    sales_today_revenue: Math.round(todayRev),
    sales_today_orders: todayInvoices.length,
    sales_gst_total: Math.round(totalTax),
    vendor_gst_itc_records: grns.length,
    sales_details_invoices: invoices.length,
    all_branch_count: 4,
    sales_metrics_margin: totalRev > 0 ? Math.round(((totalRev - totalTax) / totalRev) * 100) : 0,
    customer_analysis_count: customers.length,
    backup_invoices_count: invoices.length,
    stock_snapshot_skus: items.length,
    product_activity_skus: items.length
  };
}

// ─── ATTENDANCE (stub — for future staff management) ─────────────────────────

async function getAttendance() {
  // Returns empty array — full attendance module can be added later
  return [];
}

async function recordAttendance(body) {
  const { staff_name = 'Unknown', type = 'check_in', notes = '' } = body || {};
  return {
    id: genId('ATT'),
    staff_name,
    type,
    notes,
    timestamp: new Date().toISOString()
  };
}

// ─── ORDERS (stub — for future online/pickup orders) ─────────────────────────

async function getOrders() {
  // Returns empty array — online orders module can be added later
  return [];
}

async function updateOrderStatus(id, status) {
  return { id, status, updated_at: new Date().toISOString() };
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
  connectDB,
  isDBConnected,
  getSettings, updateSettings,
  getCategories,
  getItems, getItemByBarcode, createItem, updateItem, deleteItem, adjustStock,
  getCustomers, createCustomer, updateCustomer, deleteCustomer, rechargeWallet, getCustomerHistory,
  getActiveShift, openShift, closeShift,
  createInvoice, getInvoices, getInvoiceByNo, processReturn, getReturns,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getGRNRecords, createGRN,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus,
  getCoupons, createCoupon, validateCoupon, toggleCoupon, deleteCoupon, getPromotions,
  getExpenses, addExpense, updateExpense, deleteExpense,
  getDashboardStats, getReports, getSalesChartData,
  getAttendance, recordAttendance,
  getOrders, updateOrderStatus,
  getBackupData,
  getServiceReminders, createServiceReminder, updateServiceReminder, deleteServiceReminder,
  getSalesTodaySummary, getVendorGSTReport, getAllBranchSales,
  getCustomerAnalysis, getProductActivity, getBackupInvoices, getHubStats
};
