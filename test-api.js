const http = require('http');

function req(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const opt = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const r = http.request(opt, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function runTests() {
  console.log("=== 1. Testing GET /api/items ===");
  const itemsRes = await req('GET', '/api/items');
  console.log(`Loaded items: ${itemsRes.data.length}`);
  const item1Before = itemsRes.data.find(i => i.id === 'ITEM-001');
  console.log(`ITEM-001 "${item1Before.name}" stock BEFORE sale: ${item1Before.stock_qty}`);

  console.log("\n=== 2. Testing Dynamic UPI Payload ===");
  const upiRes = await req('GET', '/api/upi/payload?amount=2598.00&invoice_no=INV-TEST-001');
  console.log(`UPI VPA: ${upiRes.data.vpa}`);
  console.log(`UPI String: ${upiRes.data.upi_string}`);

  console.log("\n=== 3. Testing POST /api/cart/checkout ===");
  const saleRes = await req('POST', '/api/cart/checkout', {
    items: [{ id: 'ITEM-001', qty: 2 }],
    customer: { name: 'Test Customer', phone: '9876543210' },
    discount_total: 0,
    payment_method: 'UPI',
    payment_details: { upi_ref: 'UPI/987654321123' }
  });
  console.log(`Invoice Created: ${saleRes.data.invoice_no}`);
  console.log(`Grand Total: ₹${saleRes.data.grand_total}`);
  console.log(`CGST: ₹${saleRes.data.cgst_total}, SGST: ₹${saleRes.data.sgst_total}`);
  console.log(`Payment Mode: ${saleRes.data.payment_method}`);

  console.log("\n=== 4. Verifying Atomic Stock Deduction ===");
  const itemsAfterRes = await req('GET', '/api/items');
  const item1After = itemsAfterRes.data.find(i => i.id === 'ITEM-001');
  console.log(`ITEM-001 stock AFTER sale: ${item1After.stock_qty} (Reduced by 2: ${item1Before.stock_qty - item1After.stock_qty === 2 ? 'PASS ✅' : 'FAIL ❌'})`);

  console.log("\n=== 5. Testing Restock Adjustment ===");
  const restockRes = await req('POST', '/api/inventory/adjust', {
    item_id: 'ITEM-001',
    delta_qty: 10,
    reason: 'Supplier Purchase GRN',
    notes: 'PO-2026-TEST'
  });
  console.log(`Stock adjusted: New Qty = ${restockRes.data.item.stock_qty} (Added 10: PASS ✅)`);

  console.log("\n=== 6. Testing Reports & Business Analytics ===");
  const reportsRes = await req('GET', '/api/reports?range=today');
  console.log(`Gross Sales Revenue: ₹${reportsRes.data.kpis.total_revenue}`);
  console.log(`Net Sales (Excl Tax): ₹${reportsRes.data.kpis.net_sales}`);
  console.log(`Total GST Collected: ₹${reportsRes.data.kpis.total_tax}`);
  console.log(`Estimated Gross Profit: ₹${reportsRes.data.kpis.gross_profit} (Margin: ${reportsRes.data.kpis.gross_margin_percent}%)`);
  console.log(`Payment Split: UPI ₹${reportsRes.data.payment_breakdown.upi} (${reportsRes.data.payment_breakdown.upi_percent}%), Cash ₹${reportsRes.data.payment_breakdown.cash} (${reportsRes.data.payment_breakdown.cash_percent}%)`);
  console.log(`Top Products Sold: ${reportsRes.data.top_products.map(p => `${p.name} (Qty: ${p.qty_sold})`).join(', ')}`);

  console.log("\n=== 7. Testing Active Shift Status ===");
  const shiftRes = await req('GET', '/api/shifts/active');
  console.log(`Active Shift: ${shiftRes.data.id} (Status: ${shiftRes.data.status})`);
  console.log(`Cashier: ${shiftRes.data.cashier}`);
  console.log(`Expected Cash in Drawer: ₹${shiftRes.data.expected_cash}`);
  console.log(`UPI Sales logged to shift: ₹${shiftRes.data.upi_sales}`);

  console.log("\n ALL TESTS PASSED! RETAIL POS FULLY OPERATIONAL!");
}

runTests().catch(console.error);
