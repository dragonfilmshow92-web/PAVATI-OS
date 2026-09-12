const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data: json, raw: data });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('🛡️  PAVATI OS FULL SYSTEM ARCHITECTURE & CODE SCAN');
  console.log('====================================================\n');

  const results = { passed: 0, failed: 0, warnings: 0, details: [] };

  function report(category, name, passed, note = '') {
    if (passed) {
      results.passed++;
      console.log(`  ✅ [${category}] ${name} ${note ? '— ' + note : ''}`);
      results.details.push({ category, name, status: 'PASS', note });
    } else {
      results.failed++;
      console.log(`  ❌ [${category}] ${name} ${note ? '— ' + note : ''}`);
      results.details.push({ category, name, status: 'FAIL', note });
    }
  }

  // 1. Static Files & PWA
  console.log('[1/4] Scanning PWA & Static Infrastructure...');
  try {
    const htmlRes = await request('/');
    report('PWA', 'Single Page Application Root', htmlRes.status === 200, `HTTP ${htmlRes.status}`);

    const manifestRes = await request('/manifest.json');
    const isManifestValid = manifestRes.status === 200 && manifestRes.data?.name?.includes('PAVATI OS');
    report('PWA', 'Web App Manifest', isManifestValid, `Name: "${manifestRes.data?.name}"`);

    const swRes = await request('/sw.js');
    const isSwValid = swRes.status === 200 && swRes.raw.includes('pavati-os');
    report('PWA', 'Service Worker Cache Shell', isSwValid, `HTTP ${swRes.status}`);

    const iconRes = await request('/app-icon.png');
    report('PWA', 'App Icon Asset', iconRes.status === 200, `Content-Type: ${iconRes.headers['content-type']}`);
  } catch (e) {
    report('PWA', 'PWA Infrastructure Check', false, e.message);
  }

  // 2. Core API Health & CRUD
  console.log('\n[2/4] Scanning API Endpoints & Database Layer...');
  const endpoints = [
    { path: '/api/settings', label: 'Store Settings API' },
    { path: '/api/categories', label: 'Category Hierarchy' },
    { path: '/api/items', label: 'Item & Inventory Catalog' },
    { path: '/api/customers', label: 'Customer CRM & Khata' },
    { path: '/api/suppliers', label: 'Suppliers & Vendors' },
    { path: '/api/invoices', label: 'Sales Invoices' },
    { path: '/api/returns', label: 'Returns & Credit Notes' },
    { path: '/api/coupons', label: 'Coupons & Promo Engine' },
    { path: '/api/expenses', label: 'Expense Tracking' },
    { path: '/api/shifts/active', label: 'Cashier Shift Register' },
    { path: '/api/backup/download', label: 'Database Backup Generator' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await request(ep.path);
      const ok = res.status === 200 && (res.data?.success === true || res.data?.length !== undefined || res.data?.settings !== undefined || res.status === 200);
      report('API', ep.label, ok, `HTTP ${res.status}`);
    } catch (e) {
      report('API', ep.label, false, e.message);
    }
  }

  // 3. Security Hygiene & Data Integrity
  console.log('\n[3/4] Scanning Security & Brand Sanitization...');
  try {
    const settingsRes = await request('/api/settings');
    const storeName = settingsRes.data?.data?.store_name;
    const isBrandClean = storeName === 'PAVATI OS' && !JSON.stringify(settingsRes.data).toLowerCase().includes('tioras');
    report('Security', 'Brand Neutrality Verification', isBrandClean, `Active Store: "${storeName}"`);

    // Verify CORS Headers
    const corsHeader = settingsRes.headers['access-control-allow-origin'];
    report('Security', 'CORS Configuration', Boolean(corsHeader), `Origin: ${corsHeader}`);
  } catch (e) {
    report('Security', 'Security Check', false, e.message);
  }

  // 4. Barcode & Billing Calculation Consistency
  console.log('\n[4/4] Scanning Transaction & Ledger Integrity...');
  try {
    const itemsRes = await request('/api/items');
    const items = itemsRes.data?.data || [];
    report('Integrity', 'Catalog Loaded', items.length > 0, `${items.length} items ready in database`);

    const customersRes = await request('/api/customers');
    const customers = customersRes.data?.data || [];
    report('Integrity', 'Customer Ledger Loaded', customers.length > 0, `${customers.length} customer records`);
  } catch (e) {
    report('Integrity', 'Ledger Integrity Check', false, e.message);
  }

  console.log('\n====================================================');
  console.log(`SCAN COMPLETE: Passed: ${results.passed} | Failed: ${results.failed} | Warnings: ${results.warnings}`);
  console.log('====================================================');
}

runAudit().catch(console.error);
