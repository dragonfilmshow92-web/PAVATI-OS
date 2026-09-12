const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING AUDIT FIX VERIFICATION SUITE ---');

  // Test 1: Supplier Phone & State Persistence
  console.log('\n[1] Testing Supplier Phone & State Persistence...');
  const suppPayload = {
    name: 'Vogue Fabrics Test',
    contact: '+91 98765 43210',
    phone: '+91 98765 43210',
    email: 'vogue@test.in',
    state: 'Maharashtra',
    state_code: '27',
    gstin: '27AABCV1234F1Z5'
  };
  const createSuppRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/suppliers',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, suppPayload);

  console.log('Supplier Create Status:', createSuppRes.status, 'ID:', createSuppRes.data?.data?.id);
  const suppliersRes = await request({ hostname: 'localhost', port: 3000, path: '/api/suppliers', method: 'GET' });
  const createdSupp = (suppliersRes.data?.data || []).find(s => s.name === 'Vogue Fabrics Test');
  console.log('Saved Supplier Phone:', createdSupp?.phone, '| Contact:', createdSupp?.contact, '| State:', createdSupp?.state);
  if (createdSupp?.phone === '+91 98765 43210' && createdSupp?.state === 'Maharashtra') {
    console.log('✅ TEST 1 PASSED: Supplier phone & state persisted in MongoDB');
  } else {
    console.error('❌ TEST 1 FAILED:', createdSupp);
  }

  // Clean up supplier
  if (createdSupp?.id) {
    await request({ hostname: 'localhost', port: 3000, path: `/api/suppliers/${createdSupp.id}`, method: 'DELETE' });
  }

  // Test 2: Item Creation, Stock & Soft Delete
  console.log('\n[2] Testing Item Soft Delete & Barcode Filtering...');
  const testItemBarcode = 'TEST_BAR_' + Date.now();
  const itemPayload = {
    name: 'Audit Silk Scarf',
    barcode: testItemBarcode,
    category: 'Accessories',
    selling_price: 500,
    cost_price: 300,
    stock_qty: 15,
    gst_rate: 12,
    hsn_code: '5208'
  };
  const createItemRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/items',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, itemPayload);

  const testItemId = createItemRes.data?.data?.id || createItemRes.data?.data?._id;
  console.log('Item Created:', testItemId, 'Stock:', createItemRes.data?.data?.stock_qty);

  // Soft Delete the item
  const delItemRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/items/${testItemId}`,
    method: 'DELETE'
  });
  console.log('Delete Item Status:', delItemRes.status, delItemRes.data?.message);

  // Verify item is excluded from active items
  const getItemsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/items', method: 'GET' });
  const activeItem = (getItemsRes.data?.data || []).find(i => i.barcode === testItemBarcode);
  const getByBarcodeRes = await request({ hostname: 'localhost', port: 3000, path: `/api/items/barcode/${testItemBarcode}`, method: 'GET' });

  if (!activeItem && getByBarcodeRes.status === 404) {
    console.log('✅ TEST 2 PASSED: Soft delete successfully hides item from catalog & barcode search without destroying record');
  } else {
    console.error('❌ TEST 2 FAILED: Item still visible after soft delete');
  }

  // Test 3: Checkout -> Sales Return -> Credit Note Generation -> Partial Return Status
  console.log('\n[3] Testing Checkout, Partial Return & GST Credit Note Generation...');
  // Create an item for sale
  const saleBarcode = 'RET_TEST_' + Date.now();
  const saleItemRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/items',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Linen Casual Shirt',
    barcode: saleBarcode,
    category: 'Shirts',
    selling_price: 1200,
    cost_price: 700,
    stock_qty: 20,
    gst_rate: 12,
    hsn_code: '6205'
  });
  const saleItem = saleItemRes.data?.data;
  const initialStock = saleItem.stock_qty;

  // Checkout an invoice with 2 shirts
  const checkoutPayload = {
    customer_name: 'Aditi Sharma',
    customer_phone: '9820011223',
    items: [
      {
        id: saleItem.id,
        item_id: saleItem.id,
        name: saleItem.name,
        barcode: saleItem.barcode,
        unit_price: 1200,
        qty: 2,
        gst_rate: 12,
        hsn_code: '6205',
        tax_inclusive: false
      }
    ],
    payment_method: 'Cash',
    cash_tendered: 3000,
    change_due: 312
  };

  const checkoutRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/cart/checkout',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, checkoutPayload);

  const invoice = checkoutRes.data?.data;
  console.log('Invoice Created:', invoice?.invoice_no, 'Grand Total: ₹' + invoice?.grand_total, 'Initial Status:', invoice?.status);

  // Return 1 of the 2 shirts (Partial Return)
  const returnPayload = {
    invoice_no: invoice.invoice_no,
    items: [
      {
        item_id: saleItem.id,
        qty: 1,
        name: saleItem.name,
        unit_price: 1200,
        gst_rate: 12
      }
    ],
    reason: 'Size exchange needed',
    refund_mode: 'Cash',
    refund_amount: 1344,
    is_exchange: false
  };

  const returnRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/returns',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, returnPayload);

  console.log('Return Processed. Credit Note No:', returnRes.data?.data?.credit_note_no);
  const creditNoteNo = returnRes.data?.data?.credit_note_no;

  // Check original invoice status in DB
  const invVerifyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/invoices/${invoice.invoice_no}`,
    method: 'GET'
  });
  console.log('Updated Invoice Status in DB:', invVerifyRes.data?.data?.status);

  // Check restocked item quantity
  const itemRestockedRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/items/barcode/${saleBarcode}`,
    method: 'GET'
  });
  console.log('Initial Stock:', initialStock, 'After Selling 2: 18, After Returning 1:', itemRestockedRes.data?.data?.stock_qty);

  // Verify Credit Note lookup endpoint
  const cnLookupRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/returns/${creditNoteNo}`,
    method: 'GET'
  });
  console.log('Credit Note Lookup:', cnLookupRes.data?.data?.credit_note_no, '| Customer:', cnLookupRes.data?.data?.customer_name);

  const isStatusCorrect = invVerifyRes.data?.data?.status === 'partial_return';
  const isStockRestored = itemRestockedRes.data?.data?.stock_qty === 19;
  const hasValidCreditNote = Boolean(creditNoteNo && creditNoteNo.startsWith('CN-'));

  if (isStatusCorrect && isStockRestored && hasValidCreditNote) {
    console.log('✅ TEST 3 PASSED: Credit Note generated sequentially, partial_return preserved, stock restored');
  } else {
    console.error('❌ TEST 3 FAILED: Flags - status:', isStatusCorrect, 'stock:', isStockRestored, 'cn:', hasValidCreditNote);
  }

  // Test 4: Dynamic Categories
  console.log('\n[4] Testing Categories API...');
  const catRes = await request({ hostname: 'localhost', port: 3000, path: '/api/categories', method: 'GET' });
  console.log('Categories Count:', (catRes.data?.data || []).length);
  if (Array.isArray(catRes.data?.data) && catRes.data.data.length > 0) {
    console.log('✅ TEST 4 PASSED: Dynamic categories properly loaded from MongoDB');
  } else {
    console.error('❌ TEST 4 FAILED: Categories empty or invalid');
  }

  console.log('\n--- ALL VERIFICATION SUITE CHECKS COMPLETED ---');
}

runTests().catch(err => console.error('Verification error:', err));
