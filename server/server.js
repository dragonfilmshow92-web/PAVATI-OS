require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./db-mongo');
const ERPNextClient = require('./erpnext');

// Prevent unexpected process exits on async/network errors
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception in POS server:', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection in POS server:', reason?.message || reason);
});

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const API_KEY = process.env.POS_API_KEY || '';

// Helper to parse JSON body
function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (req.body && typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (e) {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 20e6) { // 20MB limit for high-res images/logos
        reject(new Error("Payload too large"));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  });
  res.end(JSON.stringify(data));
}

// MIME types for static client files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const parsedUrl = {
    pathname,
    query: Object.fromEntries(reqUrl.searchParams.entries())
  };
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    return res.end();
  }

  // --- API ROUTER ---
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Settings
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          const settings = await db.getSettings();
          return sendJSON(res, 200, { success: true, data: settings });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const updated = await db.updateSettings(body);
          return sendJSON(res, 200, { success: true, data: updated, message: "Settings saved successfully" });
        }
      }

      // 2. Categories
      if (pathname === '/api/categories' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getCategories() });
      }
      if (pathname === '/api/categories' && method === 'POST') {
        const body = await parseBody(req);
        const cat = await db.createCategory(body);
        return sendJSON(res, 201, { success: true, data: cat, message: 'Category created' });
      }
      const catIdMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);
      if (catIdMatch && method === 'PUT') {
        const body = await parseBody(req);
        const cat = await db.updateCategory(catIdMatch[1], body);
        return sendJSON(res, 200, { success: true, data: cat, message: 'Category updated' });
      }
      if (catIdMatch && method === 'DELETE') {
        const cat = await db.deleteCategory(catIdMatch[1]);
        return sendJSON(res, 200, { success: true, data: cat, message: 'Category removed' });
      }

      // 3. Items & Inventory
      if (pathname === '/api/items') {
        if (method === 'GET') {
          const items = await db.getItems({
            category: parsedUrl.query.category,
            search: parsedUrl.query.search,
            stock_status: parsedUrl.query.stock_status
          });
          return sendJSON(res, 200, { success: true, data: items, count: items.length });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const newItem = await db.createItem(body);
          return sendJSON(res, 201, { success: true, data: newItem, message: "Product created successfully" });
        }
      }

      // Barcode lookup: /api/items/barcode/:code
      if (pathname.startsWith('/api/items/barcode/') && method === 'GET') {
        const barcode = decodeURIComponent(pathname.replace('/api/items/barcode/', ''));
        const item = await db.getItemByBarcode(barcode);
        if (!item) {
          return sendJSON(res, 404, { success: false, message: `No product found for barcode: ${barcode}` });
        }
        return sendJSON(res, 200, { success: true, data: item });
      }

      // Single item update: /api/items/:id
      if (pathname.startsWith('/api/items/') && method === 'PUT') {
        const id = decodeURIComponent(pathname.replace('/api/items/', ''));
        const body = await parseBody(req);
        const updated = await db.updateItem(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Product updated" });
      }

      if (pathname.startsWith('/api/items/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/items/', ''));
        const removed = await db.deleteItem(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Product deleted" });
      }

      // Stock adjustment: POST /api/inventory/adjust
      if (pathname === '/api/inventory/adjust' && method === 'POST') {
        const body = await parseBody(req);
        const { item_id, delta_qty, reason, notes } = body;
        const result = await db.adjustStock(item_id, delta_qty, reason, notes);
        return sendJSON(res, 200, { success: true, data: result, message: "Stock adjusted successfully" });
      }

      // 4. Customers
      if (pathname === '/api/customers') {
        if (method === 'GET') {
          const customers = await db.getCustomers();
          return sendJSON(res, 200, { success: true, data: customers });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const newCust = await db.createCustomer(body);
          return sendJSON(res, 201, { success: true, data: newCust, message: "Customer saved" });
        }
      }

      if (pathname.startsWith('/api/customers/') && method === 'PUT' && !pathname.endsWith('/recharge')) {
        const id = decodeURIComponent(pathname.replace('/api/customers/', ''));
        const body = await parseBody(req);
        const updated = await db.updateCustomer(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Customer updated" });
      }

      if (pathname.startsWith('/api/customers/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/customers/', ''));
        const removed = await db.deleteCustomer(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Customer deleted" });
      }

      // 5. Cashier Shift Management
      if (pathname === '/api/shifts/active' && method === 'GET') {
        const active = await db.getActiveShift();
        return sendJSON(res, 200, { success: true, data: active });
      }

      if (pathname === '/api/shifts/open' && method === 'POST') {
        const body = await parseBody(req);
        const shift = await db.openShift(body.cashier, body.opening_cash, body.notes);
        return sendJSON(res, 200, { success: true, data: shift, message: "New shift opened" });
      }

      if (pathname === '/api/shifts/close' && method === 'POST') {
        const body = await parseBody(req);
        const shift = await db.closeShift(body.closing_cash, body.notes);
        return sendJSON(res, 200, { success: true, data: shift, message: "Shift closed and reconciled" });
      }

      // 6. Checkout & Invoicing
      if (pathname === '/api/cart/checkout' && method === 'POST') {
        const body = await parseBody(req);
        const invoice = await db.createInvoice(body);
        return sendJSON(res, 201, { success: true, data: invoice, message: "Sale completed successfully!" });
      }

      // 6b. Central GST Calculation Engine
      if (pathname === '/api/gst/calculate' && method === 'POST') {
        const body = await parseBody(req);
        const settings = await db.getSettings();
        const result = db.calculateGST(body.items || [], {
          seller_state: body.seller_state || settings.store_state || 'Maharashtra',
          seller_state_code: body.seller_state_code || settings.store_state_code || '27',
          seller_gstin: body.seller_gstin || settings.store_gstin || '',
          buyer_state: body.buyer_state || '',
          buyer_state_code: body.buyer_state_code || '',
          customer_gstin: body.customer_gstin || '',
          discount_amount: Number(body.discount_amount || 0),
          default_tax_rate: settings.default_tax_rate ?? 12,
          default_tax_inclusive: settings.tax_inclusive_default ?? false
        });
        return sendJSON(res, 200, { success: true, data: result });
      }

      if (pathname === '/api/invoices' && method === 'GET') {
        const invoices = await db.getInvoices({
          search: parsedUrl.query.search,
          payment_method: parsedUrl.query.payment_method,
          limit: parsedUrl.query.limit ? Number(parsedUrl.query.limit) : 100
        });
        return sendJSON(res, 200, { success: true, data: invoices, count: invoices.length });
      }

      if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/return') && method === 'POST') {
        const invoiceNo = decodeURIComponent(pathname.replace('/api/invoices/', '').replace('/return', ''));
        const body = await parseBody(req);
        const result = await db.processReturn(invoiceNo, body.item_id, body.qty, body.reason);
        return sendJSON(res, 200, { success: true, data: result, message: "Item returned and stock restored" });
      }

      if (pathname.startsWith('/api/invoices/') && method === 'GET') {
        const invoiceNo = decodeURIComponent(pathname.replace('/api/invoices/', ''));
        const inv = await db.getInvoiceByNo(invoiceNo);
        if (!inv) return sendJSON(res, 404, { success: false, message: "Invoice not found" });
        return sendJSON(res, 200, { success: true, data: inv });
      }

      // Standalone Returns list & create
      if (pathname === '/api/returns' && method === 'GET') {
        const items = await db.getReturns();
        return sendJSON(res, 200, { success: true, data: items });
      }

      const returnMatch = pathname.match(/^\/api\/returns\/([^/]+)$/);
      if (returnMatch && method === 'GET') {
        const item = await db.getCreditNote(decodeURIComponent(returnMatch[1]));
        if (!item) return sendJSON(res, 404, { success: false, message: "Credit Note not found" });
        return sendJSON(res, 200, { success: true, data: item });
      }

      if (pathname === '/api/returns' && method === 'POST') {
        const body = await parseBody(req);
        const result = await db.processReturn(body);
        return sendJSON(res, 200, { success: true, data: result, message: "Return processed and stock restored" });
      }

      // Promotions Endpoint

      if (pathname === '/api/promotions' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getPromotions() });
      }

      // Suppliers Endpoint
      if (pathname === '/api/suppliers') {
        if (method === 'GET') {
          return sendJSON(res, 200, { success: true, data: await db.getSuppliers() });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const newSup = await db.createSupplier(body);
          return sendJSON(res, 201, { success: true, data: newSup, message: "Supplier created" });
        }
      }

      if (pathname.startsWith('/api/suppliers/') && method === 'PUT') {
        const id = decodeURIComponent(pathname.replace('/api/suppliers/', ''));
        const body = await parseBody(req);
        const updated = await db.updateSupplier(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Supplier updated" });
      }

      if (pathname.startsWith('/api/suppliers/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/suppliers/', ''));
        const removed = await db.deleteSupplier(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Supplier deleted" });
      }

      // Goods Receiving (GRN) Endpoints
      if (pathname === '/api/grn' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getGRNRecords() });
      }

      if (pathname === '/api/grn/receive' && method === 'POST') {
        const body = await parseBody(req);
        const grnRecord = await db.createGRN(body);
        return sendJSON(res, 201, { success: true, data: grnRecord, message: "Goods received and inventory updated successfully" });
      }

      // 7. Dynamic UPI QR Payload Generator
      if (pathname === '/api/upi/payload' && method === 'GET') {
        const settings = await db.getSettings();
        const amount = parsedUrl.query.amount ? Number(parsedUrl.query.amount).toFixed(2) : "0.00";
        const invoiceNo = parsedUrl.query.invoice_no || "POS-" + Date.now().toString().slice(-6);
        const upiId = settings.upi_id || "mctpos@upi";
        const merchantName = settings.upi_merchant_name || settings.store_name || "MCT POS";

        // Standard NPCI UPI URI Specification:
        // upi://pay?pa=<vpa>&pn=<merchant>&am=<amount>&cu=INR&tn=<note>
        const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Bill " + invoiceNo)}`;

        return sendJSON(res, 200, {
          success: true,
          data: {
            upi_string: upiString,
            upi_uri: upiString,
            vpa: upiId,
            merchant_name: merchantName,
            amount: amount,
            invoice_no: invoiceNo
          }
        });
      }

      // 8. Comprehensive Reports & Analytics
      if (pathname === '/api/reports' && method === 'GET') {
        const dateRange = parsedUrl.query.range || 'all';
        const startDate = parsedUrl.query.start || parsedUrl.query.startDate;
        const endDate = parsedUrl.query.end || parsedUrl.query.endDate;
        const reports = await db.getReports(dateRange, startDate, endDate);
        return sendJSON(res, 200, { success: true, data: reports });
      }

      // 8a. 12-Card Executive Hub & Sub-Report Endpoints
      if (pathname === '/api/reports/hub-stats' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getHubStats() });
      }
      if (pathname === '/api/reports/today' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getSalesTodaySummary() });
      }
      if (pathname === '/api/reports/vendor-gst' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getVendorGSTReport() });
      }
      if (pathname === '/api/reports/all-branches' && method === 'GET') {
        const dateRange = parsedUrl.query.range || 'month';
        const start = parsedUrl.query.start || parsedUrl.query.startDate;
        const end = parsedUrl.query.end || parsedUrl.query.endDate;
        return sendJSON(res, 200, { success: true, data: await db.getAllBranchSales(dateRange, start, end) });
      }
      if (pathname === '/api/reports/customer-analysis' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getCustomerAnalysis() });
      }
      if (pathname === '/api/reports/product-activity' && method === 'GET') {
        const dateRange = parsedUrl.query.range || 'month';
        const start = parsedUrl.query.start || parsedUrl.query.startDate;
        const end = parsedUrl.query.end || parsedUrl.query.endDate;
        return sendJSON(res, 200, { success: true, data: await db.getProductActivity(dateRange, start, end) });
      }
      if (pathname === '/api/reports/backup-invoices' && method === 'GET') {
        const q = parsedUrl.query.q || parsedUrl.query.query || '';
        return sendJSON(res, 200, { success: true, data: await db.getBackupInvoices(q) });
      }
      if (pathname === '/api/reports/service-reminders' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getServiceReminders() });
      }
      if (pathname === '/api/reports/service-reminders' && method === 'POST') {
        const body = await parseBody(req);
        const reminder = await db.createServiceReminder(body);
        return sendJSON(res, 201, { success: true, data: reminder, message: 'Service reminder scheduled' });
      }
      const srvMatch = pathname.match(/^\/api\/reports\/service-reminders\/([^/]+)$/);
      if (srvMatch && method === 'PUT') {
        const body = await parseBody(req);
        const updated = await db.updateServiceReminder(srvMatch[1], body);
        return sendJSON(res, 200, { success: true, data: updated, message: 'Reminder updated' });
      }
      if (srvMatch && method === 'DELETE') {
        const deleted = await db.deleteServiceReminder(srvMatch[1]);
        return sendJSON(res, 200, { success: true, data: deleted, message: 'Reminder removed' });
      }

      // 9. Executive Dashboard Stats (maxtoapp reference)
      if (pathname === '/api/dashboard/stats' && method === 'GET') {
        const stats = await db.getDashboardStats();
        return sendJSON(res, 200, { success: true, data: stats });
      }

      // 10. Expenses Management
      if (pathname === '/api/expenses' && method === 'GET') {
        const expenses = await db.getExpenses();
        return sendJSON(res, 200, { success: true, data: expenses });
      }
      if (pathname === '/api/expenses' && method === 'POST') {
        const body = await parseBody(req);
        const newExpense = await db.addExpense(body);
        return sendJSON(res, 201, { success: true, data: newExpense });
      }
      if (pathname.startsWith('/api/expenses/') && method === 'PUT') {
        const id = decodeURIComponent(pathname.replace('/api/expenses/', ''));
        if (!id) {
          return sendJSON(res, 400, { success: false, message: 'Expense ID is required' });
        }
        const body = await parseBody(req);
        const updated = await db.updateExpense(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Expense updated" });
      }
      if (pathname.startsWith('/api/expenses/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/expenses/', ''));
        const removed = await db.deleteExpense(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Expense deleted" });
      }

      // 10.1. ERPNext Backend Connector API
      if (pathname === '/api/erpnext/test' && method === 'POST') {
        const body = await parseBody(req);
        const settings = await db.getSettings();
        const client = new ERPNextClient({ ...settings.erpnext, ...body });
        const result = await client.testConnection();
        return sendJSON(res, 200, result);
      }

      if (pathname === '/api/erpnext/sync/items' && method === 'POST') {
        const body = await parseBody(req);
        const settings = await db.getSettings();
        const client = new ERPNextClient({ ...settings.erpnext, ...body });
        if (body.direction === 'pull') {
          try {
            const erpItems = await client.fetchItems();
            let importedCount = 0;
            if (Array.isArray(erpItems)) {
              const currentItems = await db.getItems();
              for (const erpItm of erpItems) {
                const existing = currentItems.find(i => i.sku === erpItm.name || i.name === erpItm.item_name);
                if (existing) {
                  await db.updateItem(existing.id, {
                    selling_price: erpItm.standard_rate || existing.selling_price,
                    cost_price: erpItm.valuation_rate || existing.cost_price,
                    uom: erpItm.stock_uom || existing.uom
                  });
                  importedCount++;
                } else {
                  await db.createItem({
                    name: erpItm.item_name || erpItm.name,
                    sku: erpItm.name,
                    category: (erpItm.item_group || 'general').toLowerCase(),
                    selling_price: erpItm.standard_rate || 0,
                    cost_price: erpItm.valuation_rate || 0,
                    uom: erpItm.stock_uom || 'Pcs',
                    stock_qty: 10
                  });
                  importedCount++;
                }
              }
            }
            return sendJSON(res, 200, { success: true, count: erpItems.length, imported: importedCount, message: `Successfully pulled & synced ${importedCount} items from ERPNext!` });
          } catch (pullErr) {
            return sendJSON(res, 400, { success: false, message: pullErr.message || "Failed to pull catalog items from ERPNext" });
          }
        } else {
          const items = await db.getItems();
          let pushedCount = 0;
          let failedCount = 0;
          for (const item of items) {
            try {
              await client.pushItem(item);
              pushedCount++;
            } catch (err) {
              failedCount++;
            }
          }
          return sendJSON(res, 200, { success: true, count: pushedCount, failed: failedCount, message: `Pushed ${pushedCount} items to ERPNext` });
        }
      }

      if (pathname === '/api/erpnext/sync/invoices' && method === 'POST') {
        const body = await parseBody(req);
        const settings = await db.getSettings();
        const client = new ERPNextClient({ ...settings.erpnext, ...body });
        const invoices = await db.getInvoices({ limit: 500 }) || [];
        let pushedCount = 0;
        let errors = [];
        for (const inv of invoices) {
          try {
            await client.pushSalesInvoice(inv);
            pushedCount++;
          } catch (invErr) {
            errors.push({ invoice_no: inv.invoice_no, error: invErr.message });
          }
        }
        return sendJSON(res, 200, { success: true, count: pushedCount, errors: errors.length > 0 ? errors : undefined, message: `Pushed ${pushedCount} sales invoices to ERPNext` });
      }

      // 11. Staff Attendance
      if (pathname === '/api/attendance' && method === 'GET') {
        const attendance = await db.getAttendance();
        return sendJSON(res, 200, { success: true, data: attendance });
      }
      if (pathname === '/api/attendance' && method === 'POST') {
        const body = await parseBody(req);
        const record = await db.recordAttendance(body);
        return sendJSON(res, 201, { success: true, data: record });
      }

      // 12. Online & Store Pickup Orders
      if (pathname === '/api/orders' && method === 'GET') {
        const orders = await db.getOrders();
        return sendJSON(res, 200, { success: true, data: orders });
      }
      const orderStatusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
      if (orderStatusMatch && method === 'POST') {
        const body = await parseBody(req);
        const updatedOrder = await db.updateOrderStatus(orderStatusMatch[1], body.status);
        return sendJSON(res, 200, { success: true, data: updatedOrder });
      }

      // 13. Member Wallet Recharge
      const walletMatch = pathname.match(/^\/api\/customers\/([^/]+)\/recharge$/);
      if (walletMatch && method === 'POST') {
        const body = await parseBody(req);
        const updatedCust = await db.rechargeWallet(walletMatch[1], body.amount);
        return sendJSON(res, 200, { success: true, data: updatedCust });
      }

      // 15. Purchase Orders (PO)
      if (pathname === '/api/purchase-orders' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getPurchaseOrders() });
      }
      if (pathname === '/api/purchase-orders' && method === 'POST') {
        const body = await parseBody(req);
        const po = await db.createPurchaseOrder(body);
        return sendJSON(res, 201, { success: true, data: po, message: 'Purchase Order created' });
      }
      const poStatusMatch = pathname.match(/^\/api\/purchase-orders\/([^/]+)\/status$/);
      if (poStatusMatch && method === 'PUT') {
        const body = await parseBody(req);
        const updated = await db.updatePurchaseOrderStatus(poStatusMatch[1], body.status);
        return sendJSON(res, 200, { success: true, data: updated });
      }

      // 16. Coupons & Promotions Engine
      if (pathname === '/api/coupons' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getCoupons() });
      }
      if (pathname === '/api/coupons' && method === 'POST') {
        const body = await parseBody(req);
        const coupon = await db.createCoupon(body);
        return sendJSON(res, 201, { success: true, data: coupon, message: 'Coupon created' });
      }
      if (pathname === '/api/coupons/validate' && method === 'POST') {
        const body = await parseBody(req);
        const result = await db.validateCoupon(body.code, Number(body.cart_total) || 0);
        return sendJSON(res, 200, { success: true, data: result, message: `Coupon applied! You save ₹${result.discount_amount}` });
      }
      const couponIdMatch = pathname.match(/^\/api\/coupons\/([^/]+)$/);
      if (couponIdMatch && method === 'PUT') {
        const body = await parseBody(req);
        const updated = await db.toggleCoupon(couponIdMatch[1], body.active);
        return sendJSON(res, 200, { success: true, data: updated });
      }
      if (couponIdMatch && method === 'DELETE') {
        const removed = await db.deleteCoupon(couponIdMatch[1]);
        return sendJSON(res, 200, { success: true, data: removed, message: 'Coupon deleted' });
      }

      // 17. Sales Chart Analytics
      if (pathname === '/api/analytics/charts' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: await db.getSalesChartData() });
      }

      // 18. Customer Purchase History
      const custHistMatch = pathname.match(/^\/api\/customers\/([^/]+)\/history$/);
      if (custHistMatch && method === 'GET') {
        const history = await db.getCustomerHistory(custHistMatch[1]);
        return sendJSON(res, 200, { success: true, data: history });
      }

      // 19. Data Backup
      if (pathname === '/api/backup/download' && method === 'GET') {
        const backupData = await db.getBackupData();
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="pavati-os-backup-${timestamp}.json"`,
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify(backupData, null, 2));
      }

      // Unknown API endpoint
      return sendJSON(res, 404, { success: false, message: "Endpoint not found" });


    } catch (apiErr) {
      console.error("API error:", apiErr);
      return sendJSON(res, 400, { success: false, message: apiErr.message || "An error occurred" });
    }
  }

  // --- STATIC FILE SERVER ---
  const isAssetRequest = pathname.startsWith('/assets/') || (path.extname(pathname) !== '' && pathname !== '/');
  let filePath = path.join(CLIENT_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Missing assets (.css, .js, .png, etc.) must return 404, never fallback to index.html
      if (isAssetRequest && pathname !== '/favicon.ico') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end("404 Not Found");
      }
      // Fallback to index.html ONLY for client SPA navigation routes (e.g. /barcode, /pos)
      filePath = path.join(CLIENT_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end("Error loading static asset");
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
      });
      res.end(content);
    });
  });
});

module.exports = server;

// Only listen directly when running as a standalone script (local dev / desktop app)
if (require.main === module) {
  // 1. Immediately start listening on PORT so UI static assets & health checks are available instantly
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 PAVATI OS & UPI Billing System running!`);
    console.log(`📍 Web Dashboard & Touch Counter: http://localhost:${PORT}`);
    console.log(`📦 Real-time Inventory & Reports active (MongoDB)`);
    console.log(`💳 Dynamic UPI Engine: enabled`);
    console.log(`=======================================================`);
  });

  // 2. Connect to MongoDB asynchronously in background with auto-retry
  db.connectDB().catch(err => {
    console.error('Initial MongoDB connection notice (retrying in background):', err.message);
  });
}

