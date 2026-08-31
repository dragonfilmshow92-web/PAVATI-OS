const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./db');
const ERPNextClient = require('./erpnext');

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, '..', 'client');

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5e6) { // 5MB limit
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // --- API ROUTER ---
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Settings
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          return sendJSON(res, 200, { success: true, data: db.getSettings() });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const updated = db.updateSettings(body);
          return sendJSON(res, 200, { success: true, data: updated, message: "Settings saved successfully" });
        }
      }

      // 2. Categories
      if (pathname === '/api/categories' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getCategories() });
      }

      // 3. Items & Inventory
      if (pathname === '/api/items') {
        if (method === 'GET') {
          const items = db.getItems({
            category: parsedUrl.query.category,
            search: parsedUrl.query.search,
            stock_status: parsedUrl.query.stock_status
          });
          return sendJSON(res, 200, { success: true, data: items, count: items.length });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const newItem = db.createItem(body);
          return sendJSON(res, 201, { success: true, data: newItem, message: "Product created successfully" });
        }
      }

      // Barcode lookup: /api/items/barcode/:code
      if (pathname.startsWith('/api/items/barcode/') && method === 'GET') {
        const barcode = decodeURIComponent(pathname.replace('/api/items/barcode/', ''));
        const item = db.getItemByBarcode(barcode);
        if (!item) {
          return sendJSON(res, 404, { success: false, message: `No product found for barcode: ${barcode}` });
        }
        return sendJSON(res, 200, { success: true, data: item });
      }

      // Single item update: /api/items/:id
      if (pathname.startsWith('/api/items/') && method === 'PUT') {
        const id = decodeURIComponent(pathname.replace('/api/items/', ''));
        const body = await parseBody(req);
        const updated = db.updateItem(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Product updated" });
      }

      if (pathname.startsWith('/api/items/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/items/', ''));
        const removed = db.deleteItem(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Product deleted" });
      }

      // Stock adjustment: POST /api/inventory/adjust
      if (pathname === '/api/inventory/adjust' && method === 'POST') {
        const body = await parseBody(req);
        const { item_id, delta_qty, reason, notes } = body;
        const result = db.adjustStock(item_id, delta_qty, reason, notes);
        return sendJSON(res, 200, { success: true, data: result, message: "Stock adjusted successfully" });
      }

      // 4. Customers
      if (pathname === '/api/customers') {
        if (method === 'GET') {
          const customers = db.getCustomers();
          return sendJSON(res, 200, { success: true, data: customers });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const newCust = db.createCustomer(body);
          return sendJSON(res, 201, { success: true, data: newCust, message: "Customer saved" });
        }
      }

      if (pathname.startsWith('/api/customers/') && method === 'PUT' && !pathname.endsWith('/recharge')) {
        const id = decodeURIComponent(pathname.replace('/api/customers/', ''));
        const body = await parseBody(req);
        const updated = db.updateCustomer(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Customer updated" });
      }

      if (pathname.startsWith('/api/customers/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/customers/', ''));
        const removed = db.deleteCustomer(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Customer deleted" });
      }

      // 5. Cashier Shift Management
      if (pathname === '/api/shifts/active' && method === 'GET') {
        const active = db.getActiveShift();
        return sendJSON(res, 200, { success: true, data: active });
      }

      if (pathname === '/api/shifts/open' && method === 'POST') {
        const body = await parseBody(req);
        const shift = db.openShift(body.cashier, body.opening_cash, body.notes);
        return sendJSON(res, 200, { success: true, data: shift, message: "New shift opened" });
      }

      if (pathname === '/api/shifts/close' && method === 'POST') {
        const body = await parseBody(req);
        const shift = db.closeShift(body.closing_cash, body.notes);
        return sendJSON(res, 200, { success: true, data: shift, message: "Shift closed and reconciled" });
      }

      // 6. Checkout & Invoicing
      if (pathname === '/api/cart/checkout' && method === 'POST') {
        const body = await parseBody(req);
        const invoice = db.createInvoice(body);
        return sendJSON(res, 201, { success: true, data: invoice, message: "Sale completed successfully!" });
      }

      if (pathname === '/api/invoices' && method === 'GET') {
        const invoices = db.getInvoices({
          search: parsedUrl.query.search,
          payment_method: parsedUrl.query.payment_method,
          limit: parsedUrl.query.limit ? Number(parsedUrl.query.limit) : 100
        });
        return sendJSON(res, 200, { success: true, data: invoices, count: invoices.length });
      }

      if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/return') && method === 'POST') {
        const invoiceNo = decodeURIComponent(pathname.replace('/api/invoices/', '').replace('/return', ''));
        const body = await parseBody(req);
        const result = db.processReturn(invoiceNo, body.item_id, body.qty, body.reason);
        return sendJSON(res, 200, { success: true, data: result, message: "Item returned and stock restored" });
      }

      if (pathname.startsWith('/api/invoices/') && method === 'GET') {
        const invoiceNo = decodeURIComponent(pathname.replace('/api/invoices/', ''));
        const inv = db.getInvoiceByNo(invoiceNo);
        if (!inv) return sendJSON(res, 404, { success: false, message: "Invoice not found" });
        return sendJSON(res, 200, { success: true, data: inv });
      }

      // Promotions Endpoint
      if (pathname === '/api/promotions' && method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getPromotions() });
      }

      // Suppliers Endpoint
      if (pathname === '/api/suppliers') {
        if (method === 'GET') {
          return sendJSON(res, 200, { success: true, data: db.getSuppliers() });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const newSup = db.createSupplier(body);
          return sendJSON(res, 201, { success: true, data: newSup, message: "Supplier created" });
        }
      }

      if (pathname.startsWith('/api/suppliers/') && method === 'PUT') {
        const id = decodeURIComponent(pathname.replace('/api/suppliers/', ''));
        const body = await parseBody(req);
        const updated = db.updateSupplier(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Supplier updated" });
      }

      if (pathname.startsWith('/api/suppliers/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/suppliers/', ''));
        const removed = db.deleteSupplier(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Supplier deleted" });
      }

      // 7. Dynamic UPI QR Payload Generator
      if (pathname === '/api/upi/payload' && method === 'GET') {
        const settings = db.getSettings();
        const amount = parsedUrl.query.amount ? Number(parsedUrl.query.amount).toFixed(2) : "0.00";
        const invoiceNo = parsedUrl.query.invoice_no || "POS-" + Date.now().toString().slice(-6);
        const upiId = settings.upi_id || "tioras@upi";
        const merchantName = settings.upi_merchant_name || settings.store_name || "Tioras Fashion Studio";

        // Standard NPCI UPI URI Specification:
        // upi://pay?pa=<vpa>&pn=<merchant>&am=<amount>&cu=INR&tn=<note>
        const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Bill " + invoiceNo)}`;

        return sendJSON(res, 200, {
          success: true,
          data: {
            upi_string: upiString,
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
        const reports = db.getReports(dateRange);
        return sendJSON(res, 200, { success: true, data: reports });
      }

      // 9. Executive Dashboard Stats (maxtoapp reference)
      if (pathname === '/api/dashboard/stats' && method === 'GET') {
        const stats = db.getDashboardStats();
        return sendJSON(res, 200, { success: true, data: stats });
      }

      // 10. Expenses Management
      if (pathname === '/api/expenses' && method === 'GET') {
        const expenses = db.getExpenses();
        return sendJSON(res, 200, { success: true, data: expenses });
      }
      if (pathname === '/api/expenses' && method === 'POST') {
        const body = await parseBody(req);
        const newExpense = db.addExpense(body);
        return sendJSON(res, 201, { success: true, data: newExpense });
      }
      if (pathname.startsWith('/api/expenses/') && method === 'PUT') {
        const id = decodeURIComponent(pathname.replace('/api/expenses/', ''));
        const body = await parseBody(req);
        const updated = db.updateExpense(id, body);
        return sendJSON(res, 200, { success: true, data: updated, message: "Expense updated" });
      }
      if (pathname.startsWith('/api/expenses/') && method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/expenses/', ''));
        const removed = db.deleteExpense(id);
        return sendJSON(res, 200, { success: true, data: removed, message: "Expense deleted" });
      }

      // 10.1. ERPNext Backend Connector API
      if (pathname === '/api/erpnext/test' && method === 'POST') {
        const body = await parseBody(req);
        const settings = db.getSettings();
        const client = new ERPNextClient({ ...settings.erpnext, ...body });
        const result = await client.testConnection();
        return sendJSON(res, 200, result);
      }

      if (pathname === '/api/erpnext/sync/items' && method === 'POST') {
        const body = await parseBody(req);
        const settings = db.getSettings();
        const client = new ERPNextClient({ ...settings.erpnext, ...body });
        if (body.direction === 'pull') {
          try {
            const erpItems = await client.fetchItems();
            return sendJSON(res, 200, { success: true, count: erpItems.length, data: erpItems });
          } catch (pullErr) {
            return sendJSON(res, 400, { success: false, message: pullErr.message });
          }
        } else {
          const items = db.getItems();
          let pushedCount = 0;
          for (const item of items) {
            await client.pushItem(item).catch(() => {});
            pushedCount++;
          }
          return sendJSON(res, 200, { success: true, count: pushedCount });
        }
      }

      if (pathname === '/api/erpnext/sync/invoices' && method === 'POST') {
        const body = await parseBody(req);
        const settings = db.getSettings();
        const client = new ERPNextClient({ ...settings.erpnext, ...body });
        const invoices = db.load().invoices || [];
        let pushedCount = 0;
        for (const inv of invoices) {
          await client.pushSalesInvoice(inv).catch(() => {});
          pushedCount++;
        }
        return sendJSON(res, 200, { success: true, count: pushedCount });
      }

      // 11. Staff Attendance
      if (pathname === '/api/attendance' && method === 'GET') {
        const attendance = db.getAttendance();
        return sendJSON(res, 200, { success: true, data: attendance });
      }
      if (pathname === '/api/attendance' && method === 'POST') {
        const body = await parseBody(req);
        const record = db.recordAttendance(body);
        return sendJSON(res, 201, { success: true, data: record });
      }

      // 12. Online & Store Pickup Orders
      if (pathname === '/api/orders' && method === 'GET') {
        const orders = db.getOrders();
        return sendJSON(res, 200, { success: true, data: orders });
      }
      const orderStatusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
      if (orderStatusMatch && method === 'POST') {
        const body = await parseBody(req);
        const updatedOrder = db.updateOrderStatus(orderStatusMatch[1], body.status);
        return sendJSON(res, 200, { success: true, data: updatedOrder });
      }

      // 13. Member Wallet Recharge
      const walletMatch = pathname.match(/^\/api\/customers\/([^/]+)\/recharge$/);
      if (walletMatch && method === 'POST') {
        const body = await parseBody(req);
        const updatedCust = db.rechargeWallet(walletMatch[1], body.amount);
        return sendJSON(res, 200, { success: true, data: updatedCust });
      }

      // Unknown API endpoint
      return sendJSON(res, 404, { success: false, message: "Endpoint not found" });

    } catch (apiErr) {
      console.error("API error:", apiErr);
      return sendJSON(res, 400, { success: false, message: apiErr.message || "An error occurred" });
    }
  }

  // --- STATIC FILE SERVER ---
  let filePath = path.join(CLIENT_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA behavior
      filePath = path.join(CLIENT_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end("Error loading static asset");
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

module.exports = server;

// Only listen directly when running as a standalone script (local dev / desktop app)
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Retail POS & UPI Billing System running!`);
    console.log(`📍 Web Dashboard & Touch Counter: http://localhost:${PORT}`);
    console.log(`📦 Real-time Inventory & Reports active`);
    console.log(`💳 Dynamic UPI Engine: enabled`);
    console.log(`=======================================================`);
  });
}

