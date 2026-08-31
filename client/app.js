/**
 * Supermarket OS & Retail POS Suite
 * Production Client Application Logic
 */

(function() {
  'use strict';

  // --- APPLICATION STATE ---
  const state = {
    theme: localStorage.getItem('tioras_pos_theme') || 'dark',
    settings: {},
    categories: [],
    items: [],
    customers: [],
    suppliers: [],
    promotions: [],
    invoices: [],
    selectedCustomerId: 'CUST-00',
    cart: [],
    discountAmount: 0,
    heldCarts: [],
    activeShift: null,
    currentTab: 'tab-pos',
    activeCategory: 'all',
    selectedPaymentMode: 'UPI',
    currentInvoice: null,
    currentReportRange: 'today'
  };

  // --- DOM REFERENCES ---
  const dom = {
    // Theme & Sidebar
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeToggleText: document.getElementById('themeToggleText'),
    themeToggleIcon: document.getElementById('themeToggleIcon'),
    sideStoreName: document.getElementById('sideStoreName'),
    sideCashierName: document.getElementById('sideCashierName'),
    sideShiftBadge: document.getElementById('sideShiftBadge'),
    sideUserCard: document.getElementById('sideUserCard'),
    sidebarNavItems: document.querySelectorAll('.sidebar-nav-item'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    currentViewTitle: document.getElementById('currentViewTitle'),
    headerClock: document.getElementById('headerClock'),
    topQuickChips: document.getElementById('topQuickChips'),

    // Top Supermarket Quick Chips
    chipAddSmallBag: document.getElementById('chipAddSmallBag'),
    chipAddBigBag: document.getElementById('chipAddBigBag'),
    chipApply5Pct: document.getElementById('chipApply5Pct'),
    chipApply10Pct: document.getElementById('chipApply10Pct'),
    chipApply50Flat: document.getElementById('chipApply50Flat'),

    // POS Billing Tab
    barcodeInput: document.getElementById('barcodeInput'),
    btnScanEnter: document.getElementById('btnScanEnter'),
    categoryFilterBar: document.getElementById('categoryFilterBar'),
    productGrid: document.getElementById('productGrid'),
    customerSelect: document.getElementById('customerSelect'),
    customerLoyaltyChip: document.getElementById('customerLoyaltyChip'),
    btnOpenNewCustomer: document.getElementById('btnOpenNewCustomer'),
    cartItemsList: document.getElementById('cartItemsList'),
    emptyCartState: document.getElementById('emptyCartState'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartTax: document.getElementById('cartTax'),
    cartDiscountInput: document.getElementById('cartDiscountInput'),
    cartRoundOff: document.getElementById('cartRoundOff'),
    cartGrandTotal: document.getElementById('cartGrandTotal'),
    btnPayAmount: document.getElementById('btnPayAmount'),
    btnPayNow: document.getElementById('btnPayNow'),
    btnClearCart: document.getElementById('btnClearCart'),
    btnHoldCart: document.getElementById('btnHoldCart'),
    btnRecallHeld: document.getElementById('btnRecallHeld'),
    heldCountBadge: document.getElementById('heldCountBadge'),

    // Invoices History Tab
    invSearchQuery: document.getElementById('invSearchQuery'),
    invPayMethodFilter: document.getElementById('invPayMethodFilter'),
    btnRefreshInvoices: document.getElementById('btnRefreshInvoices'),
    invoicesHistoryTableBody: document.getElementById('invoicesHistoryTableBody'),

    // Inventory Tab
    invTotalSkus: document.getElementById('invTotalSkus'),
    invTotalUnits: document.getElementById('invTotalUnits'),
    invCostValuation: document.getElementById('invCostValuation'),
    invRetailValuation: document.getElementById('invRetailValuation'),
    invLowStockCount: document.getElementById('invLowStockCount'),
    invSearchInput: document.getElementById('invSearchInput'),
    invCategoryFilter: document.getElementById('invCategoryFilter'),
    invStockStatusFilter: document.getElementById('invStockStatusFilter'),
    inventoryTableBody: document.getElementById('inventoryTableBody'),
    btnOpenNewProduct: document.getElementById('btnOpenNewProduct'),
    btnOpenRestock: document.getElementById('btnOpenRestock'),

    // Shelf Tags Tab
    shelfTagSearch: document.getElementById('shelfTagSearch'),
    shelfTagCategory: document.getElementById('shelfTagCategory'),
    shelfTagsPreviewGrid: document.getElementById('shelfTagsPreviewGrid'),
    btnPrintShelfTags: document.getElementById('btnPrintShelfTags'),

    // Promotions Tab
    promotionsGrid: document.getElementById('promotionsGrid'),

    // Customers & CRM Tab
    customersTableBody: document.getElementById('customersTableBody'),
    btnCustOpenModal: document.getElementById('btnCustOpenModal'),

    // Suppliers Tab
    suppliersTableBody: document.getElementById('suppliersTableBody'),
    btnOpenNewSupplier: document.getElementById('btnOpenNewSupplier'),
    modalNewSupplier: document.getElementById('modalNewSupplier'),
    btnCloseNewSupplierModal: document.getElementById('btnCloseNewSupplierModal'),
    newSupplierForm: document.getElementById('newSupplierForm'),

    // Reports Tab
    repFilterPills: document.querySelectorAll('.reports-filter-group .filter-pill'),
    repGrossRevenue: document.getElementById('repGrossRevenue'),
    repNetSales: document.getElementById('repNetSales'),
    repGrossProfit: document.getElementById('repGrossProfit'),
    repProfitMargin: document.getElementById('repProfitMargin'),
    repTotalTax: document.getElementById('repTotalTax'),
    repGstBreakdown: document.getElementById('repGstBreakdown'),
    repInvoiceCount: document.getElementById('repInvoiceCount'),
    repItemsSold: document.getElementById('repItemsSold'),
    repUpiAmount: document.getElementById('repUpiAmount'),
    repUpiBar: document.getElementById('repUpiBar'),
    repCashAmount: document.getElementById('repCashAmount'),
    repCashBar: document.getElementById('repCashBar'),
    repCardAmount: document.getElementById('repCardAmount'),
    repCardBar: document.getElementById('repCardBar'),
    repCategoryList: document.getElementById('repCategoryList'),
    topProductsTableBody: document.getElementById('topProductsTableBody'),
    btnPrintReport: document.getElementById('btnPrintReport'),
    btnExportCSV: document.getElementById('btnExportCSV'),

    // Shifts Tab
    shiftActiveId: document.getElementById('shiftActiveId'),
    shiftOpenedAt: document.getElementById('shiftOpenedAt'),
    shiftCashierName: document.getElementById('shiftCashierName'),
    shiftOpeningCash: document.getElementById('shiftOpeningCash'),
    shiftCashSales: document.getElementById('shiftCashSales'),
    shiftUpiSales: document.getElementById('shiftUpiSales'),
    shiftExpectedCash: document.getElementById('shiftExpectedCash'),
    closeShiftForm: document.getElementById('closeShiftForm'),
    closeCashCount: document.getElementById('closeCashCount'),
    closeShiftNotes: document.getElementById('closeShiftNotes'),
    openShiftForm: document.getElementById('openShiftForm'),
    openCashierName: document.getElementById('openCashierName'),
    openOpeningFloat: document.getElementById('openOpeningFloat'),

    // Settings Tab
    storeSettingsForm: document.getElementById('storeSettingsForm'),
    setStoreName: document.getElementById('setStoreName'),
    setTagline: document.getElementById('setTagline'),
    setGstin: document.getElementById('setGstin'),
    setPhone: document.getElementById('setPhone'),
    setAddress: document.getElementById('setAddress'),
    setReceiptFooter: document.getElementById('setReceiptFooter'),
    upiSettingsForm: document.getElementById('upiSettingsForm'),
    setUpiId: document.getElementById('setUpiId'),
    setUpiName: document.getElementById('setUpiName'),
    settingsQrPreview: document.getElementById('settingsQrPreview'),
    settingsQrText: document.getElementById('settingsQrText'),

    // Payment Modal
    modalPayment: document.getElementById('modalPayment'),
    btnClosePaymentModal: document.getElementById('btnClosePaymentModal'),
    payModalGrandTotal: document.getElementById('payModalGrandTotal'),
    payTabBtns: document.querySelectorAll('.pay-tab-btn'),
    payModePanes: document.querySelectorAll('.pay-mode-pane'),
    checkoutQrCanvas: document.getElementById('checkoutQrCanvas'),
    upiInstructAmount: document.getElementById('upiInstructAmount'),
    upiRefInput: document.getElementById('upiRefInput'),
    btnConfirmUpiPayment: document.getElementById('btnConfirmUpiPayment'),
    cashTenderInput: document.getElementById('cashTenderInput'),
    cashChangeReturn: document.getElementById('cashChangeReturn'),
    btnConfirmCashPayment: document.getElementById('btnConfirmCashPayment'),
    cardRefInput: document.getElementById('cardRefInput'),
    btnConfirmCardPayment: document.getElementById('btnConfirmCardPayment'),
    splitCashAmount: document.getElementById('splitCashAmount'),
    splitUpiAmount: document.getElementById('splitUpiAmount'),
    splitCardAmount: document.getElementById('splitCardAmount'),
    splitAllocatedTotal: document.getElementById('splitAllocatedTotal'),
    splitRemainingTotal: document.getElementById('splitRemainingTotal'),
    btnConfirmSplitPayment: document.getElementById('btnConfirmSplitPayment'),

    // Receipt Modal
    modalReceipt: document.getElementById('modalReceipt'),
    btnCloseReceiptModal: document.getElementById('btnCloseReceiptModal'),
    btnReceiptDone: document.getElementById('btnReceiptDone'),
    btnPrintReceiptBtn: document.getElementById('btnPrintReceiptBtn'),
    slipStoreName: document.getElementById('slipStoreName'),
    slipTagline: document.getElementById('slipTagline'),
    slipAddress: document.getElementById('slipAddress'),
    slipPhone: document.getElementById('slipPhone'),
    slipGstin: document.getElementById('slipGstin'),
    slipInvoiceNo: document.getElementById('slipInvoiceNo'),
    slipDate: document.getElementById('slipDate'),
    slipCashier: document.getElementById('slipCashier'),
    slipCustomer: document.getElementById('slipCustomer'),
    slipItemsBody: document.getElementById('slipItemsBody'),
    slipSubtotal: document.getElementById('slipSubtotal'),
    slipCgst: document.getElementById('slipCgst'),
    slipSgst: document.getElementById('slipSgst'),
    slipDiscountRow: document.getElementById('slipDiscountRow'),
    slipDiscount: document.getElementById('slipDiscount'),
    slipRoundOff: document.getElementById('slipRoundOff'),
    slipGrandTotal: document.getElementById('slipGrandTotal'),
    slipPaymentMethod: document.getElementById('slipPaymentMethod'),
    slipPaymentDetailsRow: document.getElementById('slipPaymentDetailsRow'),
    slipPaymentRef: document.getElementById('slipPaymentRef'),
    slipDigitalQr: document.getElementById('slipDigitalQr'),
    slipFooterText: document.getElementById('slipFooterText'),

    // Modals
    modalNewProduct: document.getElementById('modalNewProduct'),
    btnCloseNewProductModal: document.getElementById('btnCloseNewProductModal'),
    newProductForm: document.getElementById('newProductForm'),
    prodCategory: document.getElementById('prodCategory'),
    modalRestock: document.getElementById('modalRestock'),
    btnCloseRestockModal: document.getElementById('btnCloseRestockModal'),
    restockForm: document.getElementById('restockForm'),
    restockItemSelect: document.getElementById('restockItemSelect'),
    modalNewCustomer: document.getElementById('modalNewCustomer'),
    btnCloseNewCustomerModal: document.getElementById('btnCloseNewCustomerModal'),
    newCustomerForm: document.getElementById('newCustomerForm'),
    modalHeldCarts: document.getElementById('modalHeldCarts'),
    btnCloseHeldModal: document.getElementById('btnCloseHeldModal'),
    heldCartsList: document.getElementById('heldCartsList'),

    // Mobile & App Mode
    btnMobileSidebarToggle: document.getElementById('btnMobileSidebarToggle'),
    mobileNavBackdrop: document.getElementById('mobileNavBackdrop'),
    appModeBadge: document.getElementById('appModeBadge'),
    appModeText: document.getElementById('appModeText'),

    // Edit Product Modal
    modalEditProduct: document.getElementById('modalEditProduct'),
    editProductForm: document.getElementById('editProductForm'),
    btnCloseEditProductModal: document.getElementById('btnCloseEditProductModal'),
    btnCancelEditProduct: document.getElementById('btnCancelEditProduct'),
    btnDeleteProduct: document.getElementById('btnDeleteProduct'),
    editProdId: document.getElementById('editProdId'),
    editProdName: document.getElementById('editProdName'),
    editProdCategory: document.getElementById('editProdCategory'),
    editProdSku: document.getElementById('editProdSku'),
    editProdBarcode: document.getElementById('editProdBarcode'),
    editProdSize: document.getElementById('editProdSize'),
    editProdColor: document.getElementById('editProdColor'),
    editProdCost: document.getElementById('editProdCost'),
    editProdPrice: document.getElementById('editProdPrice'),
    editProdGst: document.getElementById('editProdGst'),
    editProdStock: document.getElementById('editProdStock'),
    editProdReorder: document.getElementById('editProdReorder'),
    editProdUom: document.getElementById('editProdUom'),

    // Edit Customer Modal
    modalEditCustomer: document.getElementById('modalEditCustomer'),
    editCustomerForm: document.getElementById('editCustomerForm'),
    btnCloseEditCustomerModal: document.getElementById('btnCloseEditCustomerModal'),
    btnCancelEditCustomer: document.getElementById('btnCancelEditCustomer'),
    btnDeleteCustomer: document.getElementById('btnDeleteCustomer'),
    editCustId: document.getElementById('editCustId'),
    editCustName: document.getElementById('editCustName'),
    editCustPhone: document.getElementById('editCustPhone'),
    editCustEmail: document.getElementById('editCustEmail'),
    editCustPoints: document.getElementById('editCustPoints'),
    editCustCredit: document.getElementById('editCustCredit'),

    // Edit Supplier Modal
    modalEditSupplier: document.getElementById('modalEditSupplier'),
    editSupplierForm: document.getElementById('editSupplierForm'),
    btnCloseEditSupplierModal: document.getElementById('btnCloseEditSupplierModal'),
    btnCancelEditSupplier: document.getElementById('btnCancelEditSupplier'),
    btnDeleteSupplier: document.getElementById('btnDeleteSupplier'),
    editSupId: document.getElementById('editSupId'),
    editSupName: document.getElementById('editSupName'),
    editSupCategory: document.getElementById('editSupCategory'),
    editSupContact: document.getElementById('editSupContact'),
    editSupEmail: document.getElementById('editSupEmail'),
    editSupGstin: document.getElementById('editSupGstin'),

    // Wallet Recharge Modal
    modalWalletRecharge: document.getElementById('modalWalletRecharge'),
    walletRechargeForm: document.getElementById('walletRechargeForm'),
    btnCloseWalletModal: document.getElementById('btnCloseWalletModal'),
    walletCustId: document.getElementById('walletCustId'),
    walletCustNameDisplay: document.getElementById('walletCustNameDisplay'),
    walletRechargeAmount: document.getElementById('walletRechargeAmount'),
    walletPayMode: document.getElementById('walletPayMode'),

    // ERPNext Settings
    erpnextSettingsForm: document.getElementById('erpnextSettingsForm'),
    erpUrl: document.getElementById('erpUrl'),
    erpCompany: document.getElementById('erpCompany'),
    erpWarehouse: document.getElementById('erpWarehouse'),
    erpPosProfile: document.getElementById('erpPosProfile'),
    erpApiKey: document.getElementById('erpApiKey'),
    erpApiSecret: document.getElementById('erpApiSecret'),
    btnTestErpConnection: document.getElementById('btnTestErpConnection'),
    btnPullErpItems: document.getElementById('btnPullErpItems'),
    btnPushErpInvoices: document.getElementById('btnPushErpInvoices'),
    erpnextStatusBadge: document.getElementById('erpnextStatusBadge'),
    erpSyncStatusText: document.getElementById('erpSyncStatusText'),

    toastContainer: document.getElementById('toastContainer')
  };

  // --- API HELPER ---
  const api = {
    async get(endpoint) {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GET ${endpoint} failed`);
      }
      return res.json();
    },
    async post(endpoint, body) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `POST ${endpoint} failed`);
      }
      return res.json();
    },
    async put(endpoint, body) {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `PUT ${endpoint} failed`);
      }
      return res.json();
    },
    async del(endpoint) {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `DELETE ${endpoint} failed`);
      }
      return res.json();
    }
  };

  // --- FORMATTING UTILS ---
  const fmt = {
    currency(val) {
      const num = Number(val) || 0;
      return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    date(isoString) {
      if (!isoString) return '';
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================================================
  // THEME ENGINE
  // ==========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tioras_pos_theme', theme);

    if (theme === 'light') {
      dom.themeToggleText.textContent = '🌙 Switch to Dark Mode';
      dom.themeToggleIcon.textContent = '🌙';
    } else {
      dom.themeToggleText.textContent = '☀️ Switch to Light Mode';
      dom.themeToggleIcon.textContent = '☀️';
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme.toUpperCase()} theme`, 'success');
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  async function init() {
    applyTheme(state.theme);
    checkAppMode();
    startClock();
    setupEventListeners();
    loadHeldCartsFromStorage();

    try {
      await Promise.all([
        loadSettings(),
        loadCategories(),
        loadCustomers(),
        loadActiveShift(),
        loadItems(),
        loadInvoices(),
        loadPromotions(),
        loadSuppliers(),
        loadDashboardStats(),
        loadOrders()
      ]);
      await loadReports('today');
      renderShelfTags();
      renderPromotionsGrid();
      renderCustomersTable();
      renderSuppliersTable();
      switchTab('tab-dashboard');
    } catch (err) {
      console.error("Initialization error:", err);
      showToast("Error initializing POS: " + err.message, "error");
    }
  }

  function startClock() {
    function tick() {
      const now = new Date();
      dom.headerClock.textContent = now.toLocaleTimeString('en-IN', { hour12: true });
    }
    tick();
    setInterval(tick, 1000);
  }

  async function loadSettings() {
    const res = await api.get('/api/settings');
    state.settings = res.data;
    dom.sideStoreName.textContent = state.settings.store_name || "Tioras Supermarket";
    
    dom.setStoreName.value = state.settings.store_name || "";
    dom.setTagline.value = state.settings.tagline || "";
    dom.setGstin.value = state.settings.gstin || "";
    dom.setPhone.value = state.settings.phone || "";
    dom.setAddress.value = state.settings.address || "";
    dom.setReceiptFooter.value = state.settings.receipt_footer || "";
    dom.setUpiId.value = state.settings.upi_id || "";
    dom.setUpiName.value = state.settings.upi_merchant_name || "";

    if (state.settings.erpnext) {
      if (dom.erpUrl && state.settings.erpnext.url) dom.erpUrl.value = state.settings.erpnext.url;
      if (dom.erpCompany && state.settings.erpnext.company) dom.erpCompany.value = state.settings.erpnext.company;
      if (dom.erpWarehouse && state.settings.erpnext.warehouse) dom.erpWarehouse.value = state.settings.erpnext.warehouse;
      if (dom.erpPosProfile && state.settings.erpnext.pos_profile) dom.erpPosProfile.value = state.settings.erpnext.pos_profile;
      if (dom.erpApiKey && state.settings.erpnext.api_key) dom.erpApiKey.value = state.settings.erpnext.api_key;
      if (dom.erpApiSecret && state.settings.erpnext.api_secret) dom.erpApiSecret.value = state.settings.erpnext.api_secret;
    }

    renderSettingsQrPreview();
  }

  function renderSettingsQrPreview() {
    const upiId = state.settings.upi_id || "tioras@upi";
    const name = state.settings.upi_merchant_name || state.settings.store_name || "Tioras Supermarket";
    const sampleAmt = "100.00";
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${sampleAmt}&cu=INR&tn=${encodeURIComponent('Test Verification')}`;
    
    dom.settingsQrText.textContent = upiString;
    dom.settingsQrPreview.innerHTML = '';
    if (window.QRCode) {
      window.QRCode(dom.settingsQrPreview, {
        text: upiString,
        width: 140,
        height: 140
      });
    }
  }

  async function loadCategories() {
    const res = await api.get('/api/categories');
    state.categories = res.data;
    renderCategoryFilters();

    const optionsHtml = state.categories
      .filter(c => c.id !== 'all')
      .map(c => `<option value="${c.id}">${c.name}</option>`)
      .join('');

    dom.prodCategory.innerHTML = optionsHtml;
    dom.invCategoryFilter.innerHTML = `<option value="all">All Categories</option>` + optionsHtml;
    dom.shelfTagCategory.innerHTML = `<option value="all">All Categories</option>` + optionsHtml;
  }

  function renderCategoryFilters() {
    dom.categoryFilterBar.innerHTML = state.categories.map(c => `
      <button class="cat-pill ${state.activeCategory === c.id ? 'active' : ''}" data-category="${c.id}">
        <span>${c.icon}</span> <span>${c.name}</span>
      </button>
    `).join('');

    dom.categoryFilterBar.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.category;
        renderCategoryFilters();
        renderProductGrid();
      });
    });
  }

  async function loadCustomers() {
    const res = await api.get('/api/customers');
    state.customers = res.data;
    renderCustomerDropdown();
    renderCustomersTable();
  }

  function renderCustomerDropdown() {
    dom.customerSelect.innerHTML = state.customers.map(c => `
      <option value="${c.id}" ${c.id === state.selectedCustomerId ? 'selected' : ''}>
        ${c.name} (${c.phone || 'No phone'})
      </option>
    `).join('');
    updateCustomerLoyaltyDisplay();
  }

  function updateCustomerLoyaltyDisplay() {
    const cust = state.customers.find(c => c.id === state.selectedCustomerId);
    if (cust) {
      dom.customerLoyaltyChip.innerHTML = `<span>Points: <strong>${cust.loyalty_points || 0}</strong></span>`;
    }
  }

  function renderCustomersTable() {
    dom.customersTableBody.innerHTML = state.customers.map(c => {
      let tier = '🥉 Bronze';
      if (c.total_spent > 5000) tier = '🥇 Gold Member';
      else if (c.total_spent > 2000) tier = '🥈 Silver Member';

      return `
        <tr>
          <td><code>${c.id}</code></td>
          <td><strong>${c.name}</strong></td>
          <td>${c.phone || '-'}</td>
          <td>${c.email || '-'}</td>
          <td><span class="status-pill pill-blue">${tier}</span></td>
          <td><strong>${c.loyalty_points || 0}</strong> pts</td>
          <td><strong style="color: var(--accent-purple);">${fmt.currency(c.credit_balance || 0)}</strong></td>
          <td><strong>${fmt.currency(c.total_spent || 0)}</strong></td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-primary btn-sm btn-edit-customer" data-id="${c.id}" title="Edit Customer Details">✏️ Edit</button>
              <button class="btn-success btn-sm btn-recharge-customer" data-id="${c.id}" title="Top-up Wallet">💳 Top-up</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    dom.customersTableBody.querySelectorAll('.btn-edit-customer').forEach(b => {
      b.addEventListener('click', () => openEditCustomerModal(b.dataset.id));
    });

    dom.customersTableBody.querySelectorAll('.btn-recharge-customer').forEach(b => {
      b.addEventListener('click', () => openWalletRechargeModal(b.dataset.id));
    });
  }

  async function loadActiveShift() {
    const res = await api.get('/api/shifts/active');
    state.activeShift = res.data;
    dom.sideCashierName.textContent = state.activeShift.cashier || "Admin Cashier";
    dom.sideShiftBadge.textContent = state.activeShift.status === 'OPEN' ? 'Shift Open' : 'Shift Closed';
    
    dom.shiftActiveId.textContent = `Shift #${state.activeShift.id}`;
    dom.shiftOpenedAt.textContent = `Opened: ${fmt.date(state.activeShift.opened_at)}`;
    dom.shiftCashierName.textContent = state.activeShift.cashier;
    dom.shiftOpeningCash.textContent = fmt.currency(state.activeShift.opening_cash);
    dom.shiftCashSales.textContent = fmt.currency(state.activeShift.cash_sales);
    dom.shiftUpiSales.textContent = fmt.currency(state.activeShift.upi_sales);
    dom.shiftExpectedCash.textContent = fmt.currency(state.activeShift.expected_cash);
  }

  async function loadItems() {
    const res = await api.get('/api/items');
    state.items = res.data;
    renderProductGrid();
    renderInventoryTable();
    updateInventoryDeck();
    renderShelfTags();

    dom.restockItemSelect.innerHTML = state.items.map(i => `
      <option value="${i.id}">${i.name} (${i.size} / ${i.color}) - Stock: ${i.stock_qty}</option>
    `).join('');
  }

  async function loadInvoices(search = '', paymentMethod = 'all') {
    let url = '/api/invoices';
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (paymentMethod && paymentMethod !== 'all') params.push(`payment_method=${encodeURIComponent(paymentMethod)}`);
    if (params.length) url += '?' + params.join('&');

    const res = await api.get(url);
    state.invoices = res.data;
    renderInvoicesTable();
  }

  function renderInvoicesTable() {
    if (!state.invoices || !state.invoices.length) {
      dom.invoicesHistoryTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px;">No invoices found</td></tr>`;
      return;
    }

    dom.invoicesHistoryTableBody.innerHTML = state.invoices.map(inv => {
      const itemsCount = inv.items.reduce((s, i) => s + i.qty, 0);
      let payBadge = 'pill-blue';
      if (inv.payment_method === 'UPI') payBadge = 'pill-blue';
      if (inv.payment_method === 'Cash') payBadge = 'pill-green';

      return `
        <tr>
          <td><code style="color: var(--accent-blue); font-weight: 700;">${inv.invoice_no}</code></td>
          <td>${fmt.date(inv.created_at)}</td>
          <td><strong>${inv.customer ? inv.customer.name : 'Walk-in'}</strong><br><small style="color: var(--text-muted);">${inv.customer?.phone || ''}</small></td>
          <td>${itemsCount} items</td>
          <td>${fmt.currency(inv.total_tax)}</td>
          <td><strong style="color: var(--accent-emerald); font-size: 14px;">${fmt.currency(inv.grand_total)}</strong></td>
          <td><span class="status-pill ${payBadge}">${inv.payment_method}</span></td>
          <td>${inv.cashier || 'Admin'}</td>
          <td>
            <button class="btn-secondary btn-sm btn-reprint-slip" data-no="${inv.invoice_no}" title="Reprint Slip">🖨️ Reprint</button>
            <button class="btn-warning btn-sm btn-return-item" data-no="${inv.invoice_no}" title="Process Item Return">🔄 Return</button>
          </td>
        </tr>
      `;
    }).join('');

    dom.invoicesHistoryTableBody.querySelectorAll('.btn-reprint-slip').forEach(b => {
      b.addEventListener('click', () => {
        const invNo = b.dataset.no;
        const inv = state.invoices.find(i => i.invoice_no === invNo);
        if (inv) {
          renderReceipt(inv);
          openModal(dom.modalReceipt);
        }
      });
    });

    dom.invoicesHistoryTableBody.querySelectorAll('.btn-return-item').forEach(b => {
      b.addEventListener('click', async () => {
        const invNo = b.dataset.no;
        const inv = state.invoices.find(i => i.invoice_no === invNo);
        if (!inv || !inv.items.length) return;

        const firstItem = inv.items[0];
        const reason = prompt(`Enter return reason for ${firstItem.name}:`, "Customer return / size exchange");
        if (reason) {
          try {
            const res = await api.post(`/api/invoices/${encodeURIComponent(invNo)}/return`, {
              item_id: firstItem.id,
              qty: 1,
              reason: reason
            });
            showToast(`Item returned. ${fmt.currency(firstItem.unit_price)} refunded and stock restored.`, 'success');
            await Promise.all([loadItems(), loadInvoices()]);

            // Sync updated invoice & item to Firestore
            if (window.FirebaseSync) {
              const updatedInv = state.invoices.find(i => i.invoice_no === invNo);
              if (updatedInv) window.FirebaseSync.syncInvoice(updatedInv);
              const restoredItem = state.items.find(i => i.id === firstItem.id);
              if (restoredItem) window.FirebaseSync.syncItem(restoredItem);
            }
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  }

  async function loadPromotions() {
    const res = await api.get('/api/promotions');
    state.promotions = res.data;
  }

  function renderPromotionsGrid() {
    dom.promotionsGrid.innerHTML = state.promotions.map(promo => `
      <div class="promo-card">
        <div class="promo-card-top">
          <span class="promo-code-badge">${promo.code}</span>
          <span class="status-pill pill-green">ACTIVE</span>
        </div>
        <div>
          <h4 class="promo-title">${promo.name}</h4>
          <p class="promo-desc">${promo.description}</p>
        </div>
        <button class="btn-primary btn-sm btn-apply-promo" data-code="${promo.code}" data-val="${promo.value}" data-type="${promo.type}">
          ⚡ Apply Deal to Active Cart
        </button>
      </div>
    `).join('');

    dom.promotionsGrid.querySelectorAll('.btn-apply-promo').forEach(b => {
      b.addEventListener('click', () => {
        const val = Number(b.dataset.val);
        const type = b.dataset.type;

        if (type === 'percent') {
          const sub = calculateTotals().subtotal;
          state.discountAmount = Math.round((sub * val) / 100);
        } else if (type === 'flat') {
          state.discountAmount = val;
        }

        dom.cartDiscountInput.value = state.discountAmount;
        renderCart();
        document.getElementById('navPosBtn').click();
        showToast(`Promotion "${b.dataset.code}" applied!`, 'success');
      });
    });
  }

  async function loadSuppliers() {
    const res = await api.get('/api/suppliers');
    state.suppliers = res.data;
  }

  function renderSuppliersTable() {
    dom.suppliersTableBody.innerHTML = state.suppliers.map(s => `
      <tr>
        <td><code>${s.id}</code></td>
        <td><strong>${s.name}</strong></td>
        <td>${s.category || 'General'}</td>
        <td>${s.contact || '-'}</td>
        <td>${s.email || '-'}</td>
        <td><code>${s.gstin || '-'}</code></td>
        <td><span class="status-pill ${s.pending_po > 0 ? 'pill-amber' : 'pill-green'}">${s.pending_po} Pending</span></td>
        <td>
          <button class="btn-primary btn-sm btn-edit-supplier" data-id="${s.id}" title="Edit Vendor Details">✏️ Edit</button>
        </td>
      </tr>
    `).join('');

    dom.suppliersTableBody.querySelectorAll('.btn-edit-supplier').forEach(b => {
      b.addEventListener('click', () => openEditSupplierModal(b.dataset.id));
    });
  }

  // ==========================================================================
  // SHELF PRICE TAG GENERATOR
  // ==========================================================================
  function renderShelfTags() {
    let list = [...state.items];
    const q = dom.shelfTagSearch.value.trim().toLowerCase();
    const cat = dom.shelfTagCategory.value;

    if (cat !== 'all') list = list.filter(i => i.category === cat);
    if (q) list = list.filter(i => i.name.toLowerCase().includes(q) || i.barcode.includes(q));

    dom.shelfTagsPreviewGrid.innerHTML = list.map(item => `
      <div class="shelf-tag-card">
        <div>
          <div class="st-brand-line">TIORAS SUPERMARKET • RACK DISPLAY</div>
          <div class="st-prod-title">${item.name}</div>
          <div class="st-specs-line">${item.size || ''} ${item.color || ''} [GST ${item.gst_rate}%]</div>
        </div>
        <div class="st-price-barcode-row">
          <div class="st-mrp-block">
            <span class="st-mrp-label">SPECIAL MRP</span>
            <span class="st-mrp-val">${fmt.currency(item.selling_price)}</span>
          </div>
          <div>
            <div style="font-size: 16px; letter-spacing: 2px; font-family: monospace;">||||||||||||||</div>
            <div class="st-barcode-text">${item.barcode}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ==========================================================================
  // POS COUNTER & CART
  // ==========================================================================
  function renderProductGrid() {
    let list = [...state.items];
    if (state.activeCategory !== 'all') {
      list = list.filter(i => i.category === state.activeCategory);
    }

    const searchQuery = dom.barcodeInput.value.trim().toLowerCase();
    if (searchQuery) {
      list = list.filter(i => 
        i.name.toLowerCase().includes(searchQuery) ||
        i.barcode.includes(searchQuery) ||
        i.sku.toLowerCase().includes(searchQuery) ||
        (i.color && i.color.toLowerCase().includes(searchQuery))
      );
    }

    if (list.length === 0) {
      dom.productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
          <h4>No products found</h4>
        </div>
      `;
      return;
    }

    dom.productGrid.innerHTML = list.map(item => {
      let badgeClass = 'badge-in-stock';
      let badgeText = `${item.stock_qty} in stock`;
      if (item.stock_qty <= 0) {
        badgeClass = 'badge-out-of-stock';
        badgeText = 'Out of Stock';
      } else if (item.stock_qty <= item.reorder_level) {
        badgeClass = 'badge-low-stock';
        badgeText = `${item.stock_qty} Low Stock`;
      }

      return `
        <div class="product-card" data-id="${item.id}">
          <div class="card-top">
            <div class="item-avatar">${item.image || '🏷️'}</div>
            <span class="stock-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="item-info">
            <div class="item-name" title="${item.name}">${item.name}</div>
            <div class="item-meta-chips">
              ${item.size ? `<span class="meta-chip">Size: ${item.size}</span>` : ''}
              ${item.color ? `<span class="meta-chip">${item.color}</span>` : ''}
            </div>
            <div style="font-size: 10px; color: var(--text-muted);">Barcode: ${item.barcode}</div>
          </div>
          <div class="card-bottom">
            <span class="item-price">${fmt.currency(item.selling_price)}</span>
            <button class="btn-add-cart-mini" data-id="${item.id}" title="Add to Cart">＋</button>
          </div>
        </div>
      `;
    }).join('');

    dom.productGrid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => addItemToCart(card.dataset.id));
    });
  }

  function handleBarcodeSubmit() {
    const query = dom.barcodeInput.value.trim();
    if (!query) return;

    const exact = state.items.find(i => i.barcode === query || i.sku.toLowerCase() === query.toLowerCase());
    if (exact) {
      addItemToCart(exact.id);
      dom.barcodeInput.value = '';
      renderProductGrid();
      return;
    }
    renderProductGrid();
  }

  function addItemToCart(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    if (item.stock_qty <= 0) {
      showToast(`"${item.name}" is OUT OF STOCK!`, "error");
      return;
    }

    const existingIndex = state.cart.findIndex(ci => ci.id === item.id);
    if (existingIndex > -1) {
      const currentInCart = state.cart[existingIndex].qty;
      if (currentInCart + 1 > item.stock_qty) {
        showToast(`Cannot add more. Only ${item.stock_qty} in stock!`, "warning");
        return;
      }
      state.cart[existingIndex].qty += 1;
    } else {
      state.cart.push({
        id: item.id,
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        category: item.category,
        size: item.size,
        color: item.color,
        selling_price: item.selling_price,
        cost_price: item.cost_price,
        gst_rate: item.gst_rate,
        hsn_code: item.hsn_code,
        stock_qty: item.stock_qty,
        qty: 1
      });
    }

    renderCart();
  }

  function addQuickCarryBag(name, price) {
    const bagId = name.includes('Small') ? 'BAG-SM' : 'BAG-LG';
    const existing = state.cart.find(c => c.id === bagId);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({
        id: bagId,
        sku: bagId,
        barcode: '990000000001',
        name: name,
        category: 'daily',
        size: 'Standard',
        color: 'Eco-Kraft',
        selling_price: price,
        cost_price: price * 0.5,
        gst_rate: 0,
        hsn_code: '4819',
        stock_qty: 999,
        qty: 1
      });
    }
    renderCart();
    showToast(`Added ${name}`, 'success');
  }

  function updateCartItemQty(index, delta) {
    const cartItem = state.cart[index];
    if (!cartItem) return;

    const newQty = cartItem.qty + delta;
    if (newQty <= 0) {
      state.cart.splice(index, 1);
    } else if (newQty > cartItem.stock_qty) {
      showToast(`Cannot exceed stock of ${cartItem.stock_qty}!`, "warning");
      return;
    } else {
      cartItem.qty = newQty;
    }
    renderCart();
  }

  function removeCartItem(index) {
    state.cart.splice(index, 1);
    renderCart();
  }

  function clearCart() {
    if (state.cart.length === 0) return;
    if (confirm("Clear active cart?")) {
      state.cart = [];
      state.discountAmount = 0;
      dom.cartDiscountInput.value = 0;
      renderCart();
      showToast("Cart cleared", "warning");
    }
  }

  function calculateTotals() {
    let subtotal = 0;
    let totalTax = 0;

    for (const item of state.cart) {
      const lineGross = item.selling_price * item.qty;
      const gstRate = item.gst_rate || 0;
      const taxableBase = gstRate > 0 ? (lineGross / (1 + gstRate / 100)) : lineGross;
      const taxAmt = lineGross - taxableBase;

      subtotal += taxableBase;
      totalTax += taxAmt;
    }

    const discount = Number(state.discountAmount) || 0;
    const rawTotal = (subtotal + totalTax) - discount;
    const grandTotal = Math.max(0, Math.round(rawTotal));
    const roundOff = Number((grandTotal - rawTotal).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      discount: discount,
      roundOff: roundOff,
      grandTotal: grandTotal
    };
  }

  function renderCart() {
    if (state.cart.length === 0) {
      dom.emptyCartState.style.display = 'flex';
      dom.cartItemsList.innerHTML = '';
      dom.cartItemsList.appendChild(dom.emptyCartState);
      dom.cartSubtotal.textContent = '₹0.00';
      dom.cartTax.textContent = '₹0.00';
      dom.cartRoundOff.textContent = '₹0.00';
      dom.cartGrandTotal.textContent = '₹0.00';
      dom.btnPayAmount.textContent = '₹0.00';
      return;
    }

    dom.emptyCartState.style.display = 'none';
    const totals = calculateTotals();

    dom.cartItemsList.innerHTML = state.cart.map((item, idx) => {
      const lineTotal = item.selling_price * item.qty;
      return `
        <div class="cart-row">
          <div>
            <div class="c-item-title">${item.name}</div>
            <div class="c-item-sub">${item.size ? item.size : ''} ${item.color ? '• ' + item.color : ''} • GST ${item.gst_rate}%</div>
          </div>
          <div class="c-price">${fmt.currency(item.selling_price)}</div>
          <div class="qty-control">
            <button class="btn-qty btn-qty-minus" data-idx="${idx}">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="btn-qty btn-qty-plus" data-idx="${idx}">+</button>
          </div>
          <div class="c-total">${fmt.currency(lineTotal)}</div>
          <button class="btn-cart-del" data-idx="${idx}" title="Remove">&times;</button>
        </div>
      `;
    }).join('');

    dom.cartSubtotal.textContent = fmt.currency(totals.subtotal);
    dom.cartTax.textContent = fmt.currency(totals.totalTax);
    dom.cartRoundOff.textContent = fmt.currency(totals.roundOff);
    dom.cartGrandTotal.textContent = fmt.currency(totals.grandTotal);
    dom.btnPayAmount.textContent = fmt.currency(totals.grandTotal);

    dom.cartItemsList.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => updateCartItemQty(Number(btn.dataset.idx), -1));
    });
    dom.cartItemsList.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => updateCartItemQty(Number(btn.dataset.idx), 1));
    });
    dom.cartItemsList.querySelectorAll('.btn-cart-del').forEach(btn => {
      btn.addEventListener('click', () => removeCartItem(Number(btn.dataset.idx)));
    });
  }

  // Hold / Recall Bills
  function holdCart() {
    if (state.cart.length === 0) {
      showToast("Cannot park an empty cart!", "warning");
      return;
    }

    const heldItem = {
      id: "HOLD-" + Date.now().toString().slice(-5),
      timestamp: new Date().toISOString(),
      customer: state.customers.find(c => c.id === state.selectedCustomerId),
      cart: [...state.cart],
      discountAmount: state.discountAmount
    };

    state.heldCarts.push(heldItem);
    saveHeldCartsToStorage();
    state.cart = [];
    state.discountAmount = 0;
    dom.cartDiscountInput.value = 0;
    renderCart();
    updateHeldCount();
    showToast(`Bill parked as #${heldItem.id}`, "warning");
  }

  function saveHeldCartsToStorage() {
    localStorage.setItem('tioras_held_carts', JSON.stringify(state.heldCarts));
  }

  function loadHeldCartsFromStorage() {
    try {
      const raw = localStorage.getItem('tioras_held_carts');
      if (raw) state.heldCarts = JSON.parse(raw);
    } catch (e) {
      state.heldCarts = [];
    }
    updateHeldCount();
  }

  function updateHeldCount() {
    dom.heldCountBadge.textContent = state.heldCarts.length;
  }

  function openHeldCartsModal() {
    if (state.heldCarts.length === 0) {
      showToast("No parked bills found.", "warning");
      return;
    }

    dom.heldCartsList.innerHTML = state.heldCarts.map((h, idx) => {
      const itemCount = h.cart.reduce((sum, item) => sum + item.qty, 0);
      const totalAmt = h.cart.reduce((sum, item) => sum + (item.selling_price * item.qty), 0);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 8px;">
          <div>
            <strong>${h.id}</strong> — ${h.customer ? h.customer.name : 'Walk-in'}<br>
            <span style="font-size: 11px; color: var(--text-secondary);">${fmt.date(h.timestamp)} • ${itemCount} items</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <strong style="color: var(--accent-blue);">${fmt.currency(totalAmt)}</strong>
            <button class="btn-primary btn-sm btn-restore-held" data-idx="${idx}">Recall</button>
            <button class="btn-danger btn-sm btn-discard-held" data-idx="${idx}">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    dom.heldCartsList.querySelectorAll('.btn-restore-held').forEach(b => {
      b.addEventListener('click', () => {
        const idx = Number(b.dataset.idx);
        const recalled = state.heldCarts.splice(idx, 1)[0];
        state.cart = recalled.cart;
        state.discountAmount = recalled.discountAmount || 0;
        dom.cartDiscountInput.value = state.discountAmount;
        if (recalled.customer) state.selectedCustomerId = recalled.customer.id;
        saveHeldCartsToStorage();
        updateHeldCount();
        renderCart();
        renderCustomerDropdown();
        closeModal(dom.modalHeldCarts);
        showToast(`Recalled parked cart #${recalled.id}`, "success");
      });
    });

    dom.heldCartsList.querySelectorAll('.btn-discard-held').forEach(b => {
      b.addEventListener('click', () => {
        const idx = Number(b.dataset.idx);
        state.heldCarts.splice(idx, 1);
        saveHeldCartsToStorage();
        updateHeldCount();
        openHeldCartsModal();
      });
    });

    openModal(dom.modalHeldCarts);
  }

  // ==========================================================================
  // PAYMENT & DYNAMIC UPI MODAL
  // ==========================================================================
  function openPaymentModal() {
    if (state.cart.length === 0) {
      showToast("Please add items to cart before proceeding to pay!", "warning");
      return;
    }

    const totals = calculateTotals();
    dom.payModalGrandTotal.textContent = fmt.currency(totals.grandTotal);
    dom.upiInstructAmount.textContent = fmt.currency(totals.grandTotal);
    dom.cashTenderInput.value = totals.grandTotal;
    dom.cashChangeReturn.textContent = '₹0.00';
    dom.splitCashAmount.value = totals.grandTotal;
    dom.splitUpiAmount.value = 0;
    dom.splitCardAmount.value = 0;
    updateSplitAllocations();

    switchPaymentMode('UPI');
    generateCheckoutUpiQr(totals.grandTotal);

    openModal(dom.modalPayment);
  }

  function switchPaymentMode(mode) {
    state.selectedPaymentMode = mode;

    dom.payTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    dom.payModePanes.forEach(pane => pane.classList.remove('active'));

    if (mode === 'UPI') dom.modalPayment.querySelector('#payPaneUpi').classList.add('active');
    if (mode === 'Cash') dom.modalPayment.querySelector('#payPaneCash').classList.add('active');
    if (mode === 'Card') dom.modalPayment.querySelector('#payPaneCard').classList.add('active');
    if (mode === 'Split') dom.modalPayment.querySelector('#payPaneSplit').classList.add('active');
  }

  function generateCheckoutUpiQr(amount) {
    const upiId = state.settings.upi_id || "tioras@upi";
    const merchantName = state.settings.upi_merchant_name || state.settings.store_name || "Tioras Supermarket";
    const invRef = "POS-" + Date.now().toString().slice(-6);

    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + invRef)}`;

    dom.checkoutQrCanvas.innerHTML = '';
    if (window.QRCode) {
      window.QRCode(dom.checkoutQrCanvas, {
        text: upiString,
        width: 185,
        height: 185
      });
    }

    dom.upiRefInput.value = "UPI/" + Math.floor(100000000000 + Math.random() * 900000000000);
  }

  function handleCashInputChange() {
    const totals = calculateTotals();
    const tendered = Number(dom.cashTenderInput.value) || 0;
    const change = Math.max(0, tendered - totals.grandTotal);
    dom.cashChangeReturn.textContent = fmt.currency(change);
  }

  function updateSplitAllocations() {
    const totals = calculateTotals();
    const cash = Number(dom.splitCashAmount.value) || 0;
    const upi = Number(dom.splitUpiAmount.value) || 0;
    const card = Number(dom.splitCardAmount.value) || 0;
    const allocated = cash + upi + card;
    const remaining = totals.grandTotal - allocated;

    dom.splitAllocatedTotal.textContent = fmt.currency(allocated);
    dom.splitRemainingTotal.textContent = fmt.currency(remaining);
  }

  async function processSale(paymentMethod, details = {}) {
    const totals = calculateTotals();
    const cust = state.customers.find(c => c.id === state.selectedCustomerId);

    const payload = {
      items: state.cart,
      customer: cust ? { id: cust.id, name: cust.name, phone: cust.phone } : { id: 'CUST-00', name: 'Walk-in', phone: '9999999999' },
      discount_total: totals.discount,
      payment_method: paymentMethod,
      payment_details: details
    };

    try {
      const res = await api.post('/api/cart/checkout', payload);
      const invoice = res.data;
      state.currentInvoice = invoice;

      closeModal(dom.modalPayment);

      state.cart = [];
      state.discountAmount = 0;
      dom.cartDiscountInput.value = 0;
      renderCart();

      renderReceipt(invoice);
      openModal(dom.modalReceipt);

      await Promise.all([
        loadItems(),
        loadActiveShift(),
        loadCustomers(),
        loadInvoices(),
        loadReports(state.currentReportRange)
      ]);

      // Stream Sale to Firebase Cloud & Analytics
      if (window.FirebaseSync) {
        window.FirebaseSync.logSale(invoice);
        window.FirebaseSync.syncInvoice(invoice);
      }

      showToast(`Sale completed! Invoice: ${invoice.invoice_no}`, "success");
    } catch (err) {
      console.error("Sale checkout failed:", err);
      showToast("Checkout failed: " + err.message, "error");
    }
  }

  // ==========================================================================
  // THERMAL RECEIPT RENDERING
  // ==========================================================================
  function renderReceipt(inv) {
    dom.slipStoreName.textContent = state.settings.store_name || "TIORAS SUPERMARKET";
    dom.slipTagline.textContent = state.settings.tagline || "";
    dom.slipAddress.textContent = state.settings.address || "";
    dom.slipPhone.textContent = state.settings.phone || "";
    dom.slipGstin.textContent = state.settings.gstin || "NOT APPLICABLE";
    
    dom.slipInvoiceNo.textContent = inv.invoice_no;
    dom.slipDate.textContent = fmt.date(inv.created_at);
    dom.slipCashier.textContent = inv.cashier || "Admin";
    dom.slipCustomer.textContent = inv.customer ? inv.customer.name : "Walk-in";

    dom.slipItemsBody.innerHTML = inv.items.map(item => `
      <tr>
        <td style="text-align: left;">
          ${item.name}<br>
          <span style="font-size: 8px; color: #555;">${item.size || ''} ${item.color || ''} [HSN:${item.hsn_code || '6205'}]</span>
        </td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right;">${item.unit_price.toFixed(2)}</td>
        <td style="text-align: right;">${item.line_total.toFixed(2)}</td>
      </tr>
    `).join('');

    dom.slipSubtotal.textContent = fmt.currency(inv.subtotal);
    dom.slipCgst.textContent = fmt.currency(inv.cgst_total);
    dom.slipSgst.textContent = fmt.currency(inv.sgst_total);
    
    if (inv.discount_total > 0) {
      dom.slipDiscountRow.style.display = 'flex';
      dom.slipDiscount.textContent = '-' + fmt.currency(inv.discount_total);
    } else {
      dom.slipDiscountRow.style.display = 'none';
    }

    dom.slipRoundOff.textContent = fmt.currency(inv.round_off);
    dom.slipGrandTotal.textContent = fmt.currency(inv.grand_total);
    dom.slipPaymentMethod.textContent = inv.payment_method;

    if (inv.payment_method === 'UPI') {
      dom.slipPaymentDetailsRow.style.display = 'block';
      dom.slipPaymentRef.textContent = inv.payment_details?.upi_ref || 'VERIFIED';
    } else if (inv.payment_method === 'Cash') {
      dom.slipPaymentDetailsRow.style.display = 'block';
      dom.slipPaymentRef.textContent = `Tendered: ${fmt.currency(inv.payment_details?.cash_tendered)} | Change: ${fmt.currency(inv.payment_details?.change_due)}`;
    } else {
      dom.slipPaymentDetailsRow.style.display = 'none';
    }

    dom.slipDigitalQr.innerHTML = '';
    if (window.QRCode) {
      window.QRCode(dom.slipDigitalQr, {
        text: `https://bill.tioras.com/verify?inv=${inv.invoice_no}`,
        width: 80,
        height: 80
      });
    }

    dom.slipFooterText.innerHTML = (state.settings.receipt_footer || '').replace(/\n/g, '<br>');
  }

  // ==========================================================================
  // INVENTORY TAB LOGIC
  // ==========================================================================
  function updateInventoryDeck() {
    let totalUnits = 0;
    let costValuation = 0;
    let retailValuation = 0;
    let lowStock = 0;

    for (const item of state.items) {
      totalUnits += item.stock_qty;
      costValuation += item.stock_qty * item.cost_price;
      retailValuation += item.stock_qty * item.selling_price;
      if (item.stock_qty <= item.reorder_level) lowStock++;
    }

    dom.invTotalSkus.textContent = state.items.length;
    dom.invTotalUnits.textContent = totalUnits;
    dom.invCostValuation.textContent = fmt.currency(costValuation);
    dom.invRetailValuation.textContent = fmt.currency(retailValuation);
    dom.invLowStockCount.textContent = lowStock;
  }

  function renderInventoryTable() {
    let list = [...state.items];
    const cat = dom.invCategoryFilter.value;
    const status = dom.invStockStatusFilter.value;
    const search = dom.invSearchInput.value.trim().toLowerCase();

    if (cat !== 'all') list = list.filter(i => i.category === cat);
    if (status === 'low') list = list.filter(i => i.stock_qty > 0 && i.stock_qty <= i.reorder_level);
    else if (status === 'out') list = list.filter(i => i.stock_qty <= 0);
    else if (status === 'in') list = list.filter(i => i.stock_qty > i.reorder_level);

    if (search) {
      list = list.filter(i => 
        i.name.toLowerCase().includes(search) ||
        i.barcode.includes(search) ||
        i.sku.toLowerCase().includes(search) ||
        (i.color && i.color.toLowerCase().includes(search))
      );
    }

    dom.inventoryTableBody.innerHTML = list.map(item => {
      let statusBadge = `<span class="stock-badge badge-in-stock">Healthy</span>`;
      if (item.stock_qty <= 0) {
        statusBadge = `<span class="stock-badge badge-out-of-stock">Out of Stock</span>`;
      } else if (item.stock_qty <= item.reorder_level) {
        statusBadge = `<span class="stock-badge badge-low-stock">Low Stock (${item.stock_qty})</span>`;
      }

      return `
        <tr>
          <td><code style="color: var(--accent-blue);">${item.barcode}</code></td>
          <td>
            <strong>${item.name}</strong><br>
            <small style="color: var(--text-muted);">SKU: ${item.sku}</small>
          </td>
          <td style="text-transform: capitalize;">${item.category}</td>
          <td>${item.size || '-'} / ${item.color || '-'}</td>
          <td>${fmt.currency(item.cost_price)}</td>
          <td><strong>${fmt.currency(item.selling_price)}</strong></td>
          <td>${item.gst_rate}%</td>
          <td><strong>${item.stock_qty}</strong> ${item.uom || 'Pcs'}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-primary btn-sm btn-edit-product" data-id="${item.id}" title="Edit Product Details">✏️ Edit</button>
              <button class="btn-secondary btn-sm btn-quick-restock" data-id="${item.id}" title="Quick Restock">📥 Restock</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    dom.inventoryTableBody.querySelectorAll('.btn-edit-product').forEach(b => {
      b.addEventListener('click', () => openEditProductModal(b.dataset.id));
    });

    dom.inventoryTableBody.querySelectorAll('.btn-quick-restock').forEach(b => {
      b.addEventListener('click', () => {
        dom.restockItemSelect.value = b.dataset.id;
        openModal(dom.modalRestock);
      });
    });
  }

  // ==========================================================================
  // REPORTS TAB LOGIC
  // ==========================================================================
  async function loadReports(range = 'today') {
    state.currentReportRange = range;
    dom.repFilterPills.forEach(p => p.classList.toggle('active', p.dataset.range === range));

    try {
      const res = await api.get(`/api/reports?range=${range}`);
      const rep = res.data;

      dom.repGrossRevenue.textContent = fmt.currency(rep.kpis.total_revenue);
      dom.repNetSales.textContent = fmt.currency(rep.kpis.net_sales);
      dom.repGrossProfit.textContent = fmt.currency(rep.kpis.gross_profit);
      dom.repProfitMargin.textContent = `Margin: ${rep.kpis.gross_margin_percent}%`;
      dom.repTotalTax.textContent = fmt.currency(rep.kpis.total_tax);
      dom.repGstBreakdown.textContent = `CGST: ${fmt.currency(rep.kpis.total_cgst)} | SGST: ${fmt.currency(rep.kpis.total_sgst)}`;
      dom.repInvoiceCount.textContent = `${rep.invoice_count} Invoices`;
      dom.repItemsSold.textContent = `${rep.kpis.total_items_sold} Items Sold`;

      dom.repUpiAmount.textContent = `${fmt.currency(rep.payment_breakdown.upi)} (${rep.payment_breakdown.upi_percent}%)`;
      dom.repUpiBar.style.width = `${rep.payment_breakdown.upi_percent}%`;

      dom.repCashAmount.textContent = `${fmt.currency(rep.payment_breakdown.cash)} (${rep.payment_breakdown.cash_percent}%)`;
      dom.repCashBar.style.width = `${rep.payment_breakdown.cash_percent}%`;

      dom.repCardAmount.textContent = `${fmt.currency(rep.payment_breakdown.card)} (${rep.payment_breakdown.card_percent}%)`;
      dom.repCardBar.style.width = `${rep.payment_breakdown.card_percent}%`;

      dom.repCategoryList.innerHTML = Object.entries(rep.category_sales).map(([cat, amt]) => `
        <div style="display: flex; justify-content: space-between; padding: 6px 8px; background: var(--bg-card); border-radius: 4px; font-size: 12px;">
          <span style="text-transform: capitalize;">${cat}</span>
          <strong>${fmt.currency(amt)}</strong>
        </div>
      `).join('') || '<div style="color: var(--text-muted); font-size: 12px;">No sales recorded for this period.</div>';

      dom.topProductsTableBody.innerHTML = rep.top_products.map(p => `
        <tr>
          <td><code>${p.sku}</code></td>
          <td><strong>${p.name}</strong></td>
          <td style="text-transform: capitalize;">${p.category}</td>
          <td><strong>${p.qty_sold}</strong></td>
          <td><strong>${fmt.currency(p.revenue)}</strong></td>
          <td>${fmt.currency(p.gross_profit)}</td>
          <td><span style="color: var(--accent-emerald); font-weight: 700;">${p.margin_percent}%</span></td>
        </tr>
      `).join('') || `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No sales in this date range</td></tr>`;

    } catch (err) {
      console.error("Reports loading error:", err);
      showToast("Error loading reports: " + err.message, "error");
    }
  }

  function exportReportsCSV() {
    window.open(`/api/reports?range=${state.currentReportRange}`, '_blank');
    showToast("Opening export stream...", "success");
  }

  // ==========================================================================
  // MODAL UTILS
  // ==========================================================================
  function openModal(el) { el.classList.add('active'); }
  function closeModal(el) { el.classList.remove('active'); }

  // --- EDITING & OPERATION MODALS ---
  function openEditProductModal(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;

    const catOptions = state.categories
      .filter(c => c.id !== 'all')
      .map(c => `<option value="${c.id}" ${c.id === item.category ? 'selected' : ''}>${c.name}</option>`)
      .join('');
    dom.editProdCategory.innerHTML = catOptions;

    dom.editProdId.value = item.id;
    dom.editProdName.value = item.name;
    dom.editProdSku.value = item.sku;
    dom.editProdBarcode.value = item.barcode;
    dom.editProdSize.value = item.size || '';
    dom.editProdColor.value = item.color || '';
    dom.editProdCost.value = item.cost_price;
    dom.editProdPrice.value = item.selling_price;
    dom.editProdGst.value = item.gst_rate;
    dom.editProdStock.value = item.stock_qty;
    dom.editProdReorder.value = item.reorder_level;
    dom.editProdUom.value = item.uom || 'Pcs';

    openModal(dom.modalEditProduct);
  }

  function openEditCustomerModal(id) {
    const cust = state.customers.find(c => c.id === id);
    if (!cust) return;

    dom.editCustId.value = cust.id;
    dom.editCustName.value = cust.name;
    dom.editCustPhone.value = cust.phone || '';
    dom.editCustEmail.value = cust.email || '';
    dom.editCustPoints.value = cust.loyalty_points || 0;
    dom.editCustCredit.value = cust.credit_balance || 0;

    openModal(dom.modalEditCustomer);
  }

  function openEditSupplierModal(id) {
    const sup = state.suppliers.find(s => s.id === id);
    if (!sup) return;

    dom.editSupId.value = sup.id;
    dom.editSupName.value = sup.name;
    dom.editSupCategory.value = sup.category || '';
    dom.editSupContact.value = sup.contact || '';
    dom.editSupEmail.value = sup.email || '';
    dom.editSupGstin.value = sup.gstin || '';

    openModal(dom.modalEditSupplier);
  }

  function openWalletRechargeModal(id) {
    const cust = state.customers.find(c => c.id === id);
    if (!cust) return;

    dom.walletCustId.value = cust.id;
    dom.walletCustNameDisplay.textContent = `${cust.name} (${cust.phone || 'No phone'}) • Current Khata: ${fmt.currency(cust.credit_balance || 0)}`;
    dom.walletRechargeAmount.value = 500;

    openModal(dom.modalWalletRecharge);
  }

  function checkAppMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const urlParams = new URLSearchParams(window.location.search);
    const isDesktopFlag = urlParams.get('app') === 'desktop' || urlParams.get('mode') === 'desktop';
    
    if (dom.appModeText) {
      if (isStandalone || isDesktopFlag) {
        dom.appModeText.textContent = "🖥️ Desktop App Mode";
        dom.appModeBadge.style.borderColor = "var(--accent-emerald)";
      } else {
        dom.appModeText.textContent = "🌐 Web Terminal";
      }
    }
  }

  // ==========================================================================
  // EVENT LISTENERS & ROUTER
  // ==========================================================================
  // ==========================================================================
  // ENTERPRISE EXECUTIVE DASHBOARD & OPERATIONS
  // ==========================================================================
  async function loadDashboardStats() {
    try {
      const res = await api.get('/api/dashboard/stats');
      const d = res.data;

      // Update 4 Overview KPI Cards
      const elOrders = document.getElementById('dashKpiOrders');
      const elSales = document.getElementById('dashKpiSales');
      const elOffers = document.getElementById('dashKpiOffers');
      const elInvoices = document.getElementById('dashKpiInvoices');

      if (elOrders) elOrders.textContent = d.new_orders;
      if (elSales) elSales.textContent = fmt.currency(d.total_sales).replace('₹', '');
      if (elOffers) elOffers.textContent = d.active_offers;
      if (elInvoices) elInvoices.textContent = d.invoices_count;

      // Update Below-Cost Margin Warning Banner
      const lossBanner = document.getElementById('dashBelowCostBanner');
      const lossBadge = document.getElementById('dashLossCountBadge');
      const lossAmount = document.getElementById('dashLossAmount');
      const lossDesc = document.getElementById('dashLossItemDesc');
      const modalLossAmount = document.getElementById('modalTotalLossAmount');
      const belowCostTable = document.getElementById('belowCostTableBody');

      if (d.below_cost_detection && d.below_cost_detection.detected_today) {
        if (lossBanner) lossBanner.style.display = 'flex';
        if (lossBadge) lossBadge.textContent = `${d.below_cost_detection.count} Items`;
        if (lossAmount) lossAmount.textContent = fmt.currency(d.below_cost_detection.estimated_loss);
        if (lossDesc) lossDesc.textContent = `${d.below_cost_detection.count} products sold below purchase cost`;
        if (modalLossAmount) modalLossAmount.textContent = fmt.currency(d.below_cost_detection.estimated_loss);

        if (belowCostTable && d.below_cost_detection.items) {
          belowCostTable.innerHTML = d.below_cost_detection.items.map(item => `
            <tr>
              <td><code>${item.sku}</code></td>
              <td><strong>${item.name}</strong></td>
              <td>${fmt.currency(item.cost_price)}</td>
              <td><strong style="color: var(--accent-red);">${fmt.currency(item.selling_price)}</strong></td>
              <td><span style="color: var(--accent-red); font-weight: 700;">-${fmt.currency(item.loss_per_unit)}</span></td>
              <td>${item.qty_sold}</td>
              <td><strong style="color: var(--accent-red);">${fmt.currency(item.loss_per_unit * item.qty_sold)}</strong></td>
            </tr>
          `).join('');
        }
      } else {
        if (lossBanner) lossBanner.style.display = 'none';
        if (belowCostTable) belowCostTable.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-emerald);">No below-cost sales detected today. Healthy profit margins!</td></tr>`;
      }

      // Populate Live Invoices stream
      const recentInvoicesTable = document.getElementById('dashRecentInvoicesBody');
      if (recentInvoicesTable && state.invoices) {
        const latestInvoices = state.invoices.slice(0, 5);
        recentInvoicesTable.innerHTML = latestInvoices.map(inv => `
          <tr>
            <td><strong style="color: var(--accent-blue);">${inv.invoice_no}</strong></td>
            <td>${inv.customer ? inv.customer.name : 'Walk-in'}</td>
            <td><strong>${fmt.currency(inv.grand_total)}</strong></td>
            <td><span class="status-pill pill-green">${inv.payment_method}</span></td>
            <td>${fmt.date(inv.created_at)}</td>
          </tr>
        `).join('') || `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No sales recorded yet</td></tr>`;
      }

      // Populate Low Stock alerts
      const lowStockTable = document.getElementById('dashLowStockBody');
      if (lowStockTable && state.items) {
        const lowItems = state.items.filter(i => i.stock_qty <= i.reorder_level).slice(0, 5);
        lowStockTable.innerHTML = lowItems.map(item => `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td><code>${item.sku}</code></td>
            <td><strong style="color: var(--accent-red);">${item.stock_qty} ${item.uom || 'Pcs'}</strong></td>
            <td>${item.reorder_level}</td>
            <td>
              <button class="btn-primary btn-sm btn-dash-restock" data-id="${item.id}">Restock</button>
            </td>
          </tr>
        `).join('') || `<tr><td colspan="5" style="text-align: center; color: var(--accent-emerald);">All stock levels healthy!</td></tr>`;

        lowStockTable.querySelectorAll('.btn-dash-restock').forEach(b => {
          b.addEventListener('click', () => {
            dom.restockItemSelect.value = b.dataset.id;
            openModal(dom.modalRestock);
          });
        });
      }

    } catch (err) {
      console.warn("Dashboard stats load note:", err);
    }
  }

  // --- ONLINE & STORE ORDERS ---
  async function loadOrders() {
    try {
      const res = await api.get('/api/orders');
      const orders = res.data;
      const tbody = document.getElementById('ordersTableBody');
      if (!tbody) return;

      const badge = document.getElementById('sideOrdersBadge');
      if (badge) badge.textContent = orders.filter(o => o.status === 'PENDING').length;

      tbody.innerHTML = orders.map(ord => `
        <tr>
          <td><code style="color: var(--accent-blue);">${ord.id}</code></td>
          <td><strong>${ord.customer_name}</strong></td>
          <td>${ord.phone}</td>
          <td><span class="category-chip">${ord.channel}</span></td>
          <td>${ord.items_count} Pcs</td>
          <td><strong>${fmt.currency(ord.total_amount)}</strong></td>
          <td>
            <span class="status-pill ${ord.status === 'PENDING' ? 'pill-amber' : 'pill-green'}">
              ${ord.status}
            </span>
          </td>
          <td>
            ${ord.status === 'PENDING' 
              ? `<button class="btn-primary btn-sm btn-order-ready" data-id="${ord.id}">Mark Ready</button>` 
              : `<span style="color: var(--accent-emerald); font-size: 12px; font-weight: 700;">✓ Completed</span>`
            }
          </td>
        </tr>
      `).join('') || `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No online orders received</td></tr>`;

      tbody.querySelectorAll('.btn-order-ready').forEach(b => {
        b.addEventListener('click', async () => {
          try {
            await api.post(`/api/orders/${b.dataset.id}/status`, { status: 'READY' });
            showToast(`Order ${b.dataset.id} marked as Ready!`, 'success');
            loadOrders();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      console.warn("Error loading orders:", err);
    }
  }

  // --- STORE EXPENSES ---
  async function loadExpenses() {
    try {
      const res = await api.get('/api/expenses');
      const expenses = res.data;
      const tbody = document.getElementById('expensesTableBody');
      if (!tbody) return;

      tbody.innerHTML = expenses.map(exp => `
        <tr>
          <td><code style="color: var(--accent-blue);">${exp.id}</code></td>
          <td><span class="category-chip">${exp.category}</span></td>
          <td><strong>${exp.description}</strong></td>
          <td><strong style="color: var(--accent-red);">${fmt.currency(exp.amount)}</strong></td>
          <td><span class="status-pill pill-amber">${exp.payment_mode}</span></td>
          <td>${fmt.date(exp.date)}</td>
          <td>
            <button class="btn-danger btn-sm btn-delete-expense" data-id="${exp.id}" title="Delete Expense Record">🗑️</button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No expenses recorded yet</td></tr>`;

      tbody.querySelectorAll('.btn-delete-expense').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm(`Delete expense record #${b.dataset.id}?`)) return;
          try {
            await api.del(`/api/expenses/${b.dataset.id}`);
            showToast("Expense record removed", "info");
            loadExpenses();
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
    } catch (err) {
      console.warn("Error loading expenses:", err);
    }
  }

  // --- STAFF ATTENDANCE ---
  async function loadAttendance() {
    try {
      const res = await api.get('/api/attendance');
      const attendance = res.data;
      const tbody = document.getElementById('attendanceTableBody');
      if (!tbody) return;

      tbody.innerHTML = attendance.map(att => `
        <tr>
          <td><code>${att.id}</code></td>
          <td><strong>${att.staff_name}</strong></td>
          <td>${att.role}</td>
          <td><strong style="color: var(--accent-emerald);">${att.check_in}</strong></td>
          <td>${att.check_out}</td>
          <td><span class="status-pill pill-green">${att.status}</span></td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No attendance records</td></tr>`;
    } catch (err) {
      console.warn("Error loading attendance:", err);
    }
  }

  // --- STORE AUDIT & ACTIVITY LOG ---
  function renderActivityLog() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;

    const activities = [];

    // Sales events
    (state.invoices || []).forEach(inv => {
      activities.push({
        timestamp: inv.created_at,
        action: 'Sales Invoice',
        operator: inv.cashier || 'Admin Cashier',
        reference: inv.invoice_no,
        details: `Billed ${inv.items ? inv.items.length : 0} items for ${fmt.currency(inv.grand_total)} via ${inv.payment_method}`
      });
    });

    // Shift events
    if (state.activeShift) {
      activities.push({
        timestamp: state.activeShift.opened_at,
        action: 'Shift Opened',
        operator: state.activeShift.cashier,
        reference: state.activeShift.id,
        details: `Started shift with float ${fmt.currency(state.activeShift.opening_cash)}`
      });
    }

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    tbody.innerHTML = activities.map(act => `
      <tr>
        <td>${fmt.date(act.timestamp)}</td>
        <td><strong style="color: var(--accent-blue);">${act.action}</strong></td>
        <td>${act.operator}</td>
        <td><code>${act.reference}</code></td>
        <td>${act.details}</td>
      </tr>
    `).join('') || `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No activity recorded</td></tr>`;
  }

  // --- ENTERPRISE ROUTER ---
  function switchTab(tabId, filter = null) {
    document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.accordion-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    const targetPane = document.getElementById(tabId);
    if (!targetPane) return;
    targetPane.classList.add('active');

    // Highlight all matching buttons in sidebar
    document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(el => el.classList.add('active'));

    state.currentTab = tabId;

    // View Titles
    const titles = {
      'tab-dashboard': '📊 Executive Dashboard',
      'tab-pos': '🛒 POS Billing Counter',
      'tab-orders': '🛍️ Online & Store Pickup Orders',
      'tab-expenses': '💰 Store Expenses & Cash Payouts',
      'tab-attendance': '📅 Staff Daily Attendance & Register Clock',
      'tab-activity': '🕒 Store Activity Log & Security Audits',
      'tab-invoices': '🧾 Sales Invoices & Customer Returns',
      'tab-shifts': '💼 Cashier Shifts & Register Audit',
      'tab-inventory': '📦 Product Inventory & Stock Valuation',
      'tab-shelftags': '🏷️ Shelf Price Tags & Barcodes',
      'tab-promotions': '🎁 Store Offers & Discount Rules',
      'tab-customers': '👥 Member Club CRM & Khata Ledger',
      'tab-suppliers': '🚚 Suppliers & Goods Receiving (GRN)',
      'tab-reports': '📊 Analytics & GST Financial War Room',
      'tab-settings': '⚙️ Store Profile & Dynamic UPI Setup'
    };

    dom.currentViewTitle.textContent = titles[tabId] || 'Supermarket OS';
    dom.topQuickChips.style.display = tabId === 'tab-pos' ? 'flex' : 'none';

    // Refresh views
    if (tabId === 'tab-dashboard') loadDashboardStats();
    else if (tabId === 'tab-pos') dom.barcodeInput.focus();
    else if (tabId === 'tab-orders') loadOrders();
    else if (tabId === 'tab-expenses') loadExpenses();
    else if (tabId === 'tab-attendance') loadAttendance();
    else if (tabId === 'tab-activity') renderActivityLog();
    else if (tabId === 'tab-inventory') {
      if (filter) dom.invStockStatusFilter.value = filter;
      loadItems();
    }
    else if (tabId === 'tab-invoices') loadInvoices();
    else if (tabId === 'tab-reports') loadReports(state.currentReportRange);
    else if (tabId === 'tab-shifts') loadActiveShift();
    else if (tabId === 'tab-shelftags') renderShelfTags();
    else if (tabId === 'tab-promotions') renderPromotionsGrid();
    else if (tabId === 'tab-customers') renderCustomersTable();
    else if (tabId === 'tab-suppliers') renderSuppliersTable();

    // Auto-close mobile drawer if open
    const sidebar = document.querySelector('.app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (dom.mobileNavBackdrop) dom.mobileNavBackdrop.classList.remove('active');
  }

  // ==========================================================================
  // EVENT LISTENERS & ROUTER
  // ==========================================================================
  function setupEventListeners() {
    // Theme Toggle
    dom.btnThemeToggle.addEventListener('click', toggleTheme);

    // Accordion Collapse & Expand Handlers
    document.querySelectorAll('.accordion-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const menu = document.getElementById(targetId);
        if (menu) {
          const isOpen = menu.classList.contains('open');
          menu.classList.toggle('open', !isOpen);
          btn.classList.toggle('expanded', !isOpen);
        }
      });
    });

    // Accordion Sub-Item Navigation
    document.querySelectorAll('.accordion-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.tab) {
          switchTab(item.dataset.tab, item.dataset.filter || null);
        }
      });
    });

    // Sidebar Nav Items (Dashboard, POS, etc.)
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab) {
          switchTab(btn.dataset.tab);
        }
      });
    });

    // Top Enterprise Header Actions (Home, Profile, Settings, Refresh, Logout)
    const topNavHome = document.getElementById('topNavHome');
    if (topNavHome) topNavHome.addEventListener('click', () => switchTab('tab-dashboard'));

    const topNavProfile = document.getElementById('topNavProfile');
    if (topNavProfile) topNavProfile.addEventListener('click', () => switchTab('tab-shifts'));

    const topNavSettings = document.getElementById('topNavSettings');
    if (topNavSettings) topNavSettings.addEventListener('click', () => switchTab('tab-settings'));

    const topNavRefresh = document.getElementById('topNavRefresh');
    if (topNavRefresh) topNavRefresh.addEventListener('click', () => {
      switchTab(state.currentTab);
      showToast('Page refreshed with live database!', 'success');
    });

    const topNavLogout = document.getElementById('topNavLogout');
    if (topNavLogout) topNavLogout.addEventListener('click', () => {
      switchTab('tab-shifts');
      showToast('Ready to close register shift', 'warning');
    });

    // 7 Quick Access Tiles (Executive Dashboard)
    const qtPos = document.getElementById('qtPos');
    if (qtPos) qtPos.addEventListener('click', () => switchTab('tab-pos'));

    const qtOrders = document.getElementById('qtOrders');
    if (qtOrders) qtOrders.addEventListener('click', () => switchTab('tab-orders'));

    const qtListing = document.getElementById('qtListing');
    if (qtListing) qtListing.addEventListener('click', () => {
      switchTab('tab-inventory');
      openModal(dom.modalNewProduct);
    });

    const qtInvoices = document.getElementById('qtInvoices');
    if (qtInvoices) qtInvoices.addEventListener('click', () => switchTab('tab-invoices'));

    const qtStock = document.getElementById('qtStock');
    if (qtStock) qtStock.addEventListener('click', () => switchTab('tab-inventory'));

    const qtAttendance = document.getElementById('qtAttendance');
    if (qtAttendance) qtAttendance.addEventListener('click', () => switchTab('tab-attendance'));

    const qtActivity = document.getElementById('qtActivity');
    if (qtActivity) qtActivity.addEventListener('click', () => switchTab('tab-activity'));

    // Dashboard View All Invoices & Stock buttons
    const btnDashViewAllInvoices = document.getElementById('btnDashViewAllInvoices');
    if (btnDashViewAllInvoices) btnDashViewAllInvoices.addEventListener('click', () => switchTab('tab-invoices'));

    const btnDashViewInventory = document.getElementById('btnDashViewInventory');
    if (btnDashViewInventory) btnDashViewInventory.addEventListener('click', () => switchTab('tab-inventory'));

    // Below-Cost Modal Controls
    const modalBelowCost = document.getElementById('modalBelowCost');
    const btnViewBelowCost = document.getElementById('btnViewBelowCostDetails');
    if (btnViewBelowCost && modalBelowCost) {
      btnViewBelowCost.addEventListener('click', () => openModal(modalBelowCost));
    }
    const btnCloseBelowCost = document.getElementById('btnCloseBelowCostModal');
    if (btnCloseBelowCost && modalBelowCost) {
      btnCloseBelowCost.addEventListener('click', () => closeModal(modalBelowCost));
    }
    const btnAckBelowCost = document.getElementById('btnAcknowledgeBelowCost');
    if (btnAckBelowCost && modalBelowCost) {
      btnAckBelowCost.addEventListener('click', () => closeModal(modalBelowCost));
    }

    // Expense Modal & Form
    const modalAddExpense = document.getElementById('modalAddExpense');
    const btnOpenAddExpenseModal = document.getElementById('btnOpenAddExpenseModal');
    if (btnOpenAddExpenseModal && modalAddExpense) {
      btnOpenAddExpenseModal.addEventListener('click', () => openModal(modalAddExpense));
    }
    const btnCloseAddExpenseModal = document.getElementById('btnCloseAddExpenseModal');
    if (btnCloseAddExpenseModal && modalAddExpense) {
      btnCloseAddExpenseModal.addEventListener('click', () => closeModal(modalAddExpense));
    }
    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
      addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          category: document.getElementById('expCategory').value,
          description: document.getElementById('expDescription').value.trim(),
          amount: Number(document.getElementById('expAmount').value),
          payment_mode: document.getElementById('expPaymentMode').value
        };
        try {
          await api.post('/api/expenses', payload);
          showToast('Expense recorded successfully!', 'success');
          closeModal(modalAddExpense);
          addExpenseForm.reset();
          loadExpenses();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Staff Clock-In Modal & Form
    const modalStaffClockIn = document.getElementById('modalStaffClockIn');
    const btnStaffClockIn = document.getElementById('btnStaffClockIn');
    if (btnStaffClockIn && modalStaffClockIn) {
      btnStaffClockIn.addEventListener('click', () => openModal(modalStaffClockIn));
    }
    const btnCloseClockInModal = document.getElementById('btnCloseClockInModal');
    if (btnCloseClockInModal && modalStaffClockIn) {
      btnCloseClockInModal.addEventListener('click', () => closeModal(modalStaffClockIn));
    }
    const staffClockInForm = document.getElementById('staffClockInForm');
    if (staffClockInForm) {
      staffClockInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          staff_name: document.getElementById('clockStaffName').value.trim(),
          role: document.getElementById('clockStaffRole').value
        };
        try {
          await api.post('/api/attendance', payload);
          showToast(`Clock-in recorded for ${payload.staff_name}!`, 'success');
          closeModal(modalStaffClockIn);
          staffClockInForm.reset();
          loadAttendance();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Sidebar Shortcut buttons for Adding Listing and Adding Vendor
    const btnSideAddListing = document.getElementById('btnSideAddListing');
    if (btnSideAddListing) {
      btnSideAddListing.addEventListener('click', () => {
        switchTab('tab-inventory');
        openModal(dom.modalNewProduct);
      });
    }

    const btnSideAddVendor = document.getElementById('btnSideAddVendor');
    if (btnSideAddVendor) {
      btnSideAddVendor.addEventListener('click', () => {
        switchTab('tab-suppliers');
        openModal(dom.modalNewSupplier);
      });
    }

    // Orders Refresh
    const btnRefreshOrders = document.getElementById('btnRefreshOrders');
    if (btnRefreshOrders) {
      btnRefreshOrders.addEventListener('click', () => {
        loadOrders();
        showToast('Online orders refreshed!', 'success');
      });
    }

    // Top Supermarket Quick Chips
    dom.chipAddSmallBag.addEventListener('click', () => addQuickCarryBag('Eco Carry Bag (Small)', 5));
    dom.chipAddBigBag.addEventListener('click', () => addQuickCarryBag('Durable Carry Bag (Large)', 10));
    dom.chipApply5Pct.addEventListener('click', () => {
      const sub = calculateTotals().subtotal;
      state.discountAmount = Math.round(sub * 0.05);
      dom.cartDiscountInput.value = state.discountAmount;
      renderCart();
      showToast("Applied 5% Supermarket Discount!", "success");
    });
    dom.chipApply10Pct.addEventListener('click', () => {
      const sub = calculateTotals().subtotal;
      state.discountAmount = Math.round(sub * 0.10);
      dom.cartDiscountInput.value = state.discountAmount;
      renderCart();
      showToast("Applied 10% Festive Discount!", "success");
    });
    dom.chipApply50Flat.addEventListener('click', () => {
      state.discountAmount = 50;
      dom.cartDiscountInput.value = 50;
      renderCart();
      showToast("Applied ₹50 Instant Voucher!", "success");
    });

    // POS Barcode / Search
    dom.barcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBarcodeSubmit();
      }
    });
    dom.barcodeInput.addEventListener('input', () => renderProductGrid());
    dom.btnScanEnter.addEventListener('click', handleBarcodeSubmit);

    // Customer Selection
    dom.customerSelect.addEventListener('change', (e) => {
      state.selectedCustomerId = e.target.value;
      updateCustomerLoyaltyDisplay();
    });
    dom.btnOpenNewCustomer.addEventListener('click', () => openModal(dom.modalNewCustomer));
    dom.btnCustOpenModal.addEventListener('click', () => openModal(dom.modalNewCustomer));
    dom.btnCloseNewCustomerModal.addEventListener('click', () => closeModal(dom.modalNewCustomer));
    dom.newCustomerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: dom.modalNewCustomer.querySelector('#newCustName').value.trim(),
        phone: dom.modalNewCustomer.querySelector('#newCustPhone').value.trim(),
        email: dom.modalNewCustomer.querySelector('#newCustEmail').value.trim()
      };
      try {
        const res = await api.post('/api/customers', payload);
        showToast("Customer profile created!", "success");
        closeModal(dom.modalNewCustomer);
        dom.newCustomerForm.reset();
        await loadCustomers();
        state.selectedCustomerId = res.data.id;
        renderCustomerDropdown();

        // Real-time Firestore Cloud Sync
        if (window.FirebaseSync && res.data) {
          window.FirebaseSync.syncCustomer(res.data);
        }
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    // Invoices Tab Filters
    dom.invSearchQuery.addEventListener('input', () => {
      loadInvoices(dom.invSearchQuery.value.trim(), dom.invPayMethodFilter.value);
    });
    dom.invPayMethodFilter.addEventListener('change', () => {
      loadInvoices(dom.invSearchQuery.value.trim(), dom.invPayMethodFilter.value);
    });
    dom.btnRefreshInvoices.addEventListener('click', () => {
      loadInvoices(dom.invSearchQuery.value.trim(), dom.invPayMethodFilter.value);
    });

    // Shelf Tags Filters & Print
    dom.shelfTagSearch.addEventListener('input', renderShelfTags);
    dom.shelfTagCategory.addEventListener('change', renderShelfTags);
    dom.btnPrintShelfTags.addEventListener('click', () => window.print());

    // Discount
    dom.cartDiscountInput.addEventListener('input', (e) => {
      state.discountAmount = Math.max(0, Number(e.target.value) || 0);
      renderCart();
    });

    // Cart Actions
    dom.btnClearCart.addEventListener('click', clearCart);
    dom.btnHoldCart.addEventListener('click', holdCart);
    dom.btnRecallHeld.addEventListener('click', openHeldCartsModal);
    dom.btnCloseHeldModal.addEventListener('click', () => closeModal(dom.modalHeldCarts));

    // Checkout Proceed
    dom.btnPayNow.addEventListener('click', openPaymentModal);
    dom.btnClosePaymentModal.addEventListener('click', () => closeModal(dom.modalPayment));

    // Payment Modes
    dom.payTabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchPaymentMode(btn.dataset.mode));
    });

    dom.btnConfirmUpiPayment.addEventListener('click', () => {
      processSale('UPI', { upi_ref: dom.upiRefInput.value || 'UPI/VERIFIED' });
    });

    dom.cashTenderInput.addEventListener('input', handleCashInputChange);
    dom.modalPayment.querySelector('#chipExactCash').addEventListener('click', () => {
      dom.cashTenderInput.value = calculateTotals().grandTotal;
      handleCashInputChange();
    });
    dom.modalPayment.querySelector('#chipAdd100').addEventListener('click', () => {
      dom.cashTenderInput.value = (Number(dom.cashTenderInput.value) || 0) + 100;
      handleCashInputChange();
    });
    dom.modalPayment.querySelector('#chipAdd500').addEventListener('click', () => {
      dom.cashTenderInput.value = (Number(dom.cashTenderInput.value) || 0) + 500;
      handleCashInputChange();
    });
    dom.modalPayment.querySelector('#chipAdd1000').addEventListener('click', () => {
      dom.cashTenderInput.value = (Number(dom.cashTenderInput.value) || 0) + 1000;
      handleCashInputChange();
    });
    dom.modalPayment.querySelector('#chipAdd2000').addEventListener('click', () => {
      dom.cashTenderInput.value = (Number(dom.cashTenderInput.value) || 0) + 2000;
      handleCashInputChange();
    });

    dom.btnConfirmCashPayment.addEventListener('click', () => {
      const totals = calculateTotals();
      const tendered = Number(dom.cashTenderInput.value) || totals.grandTotal;
      if (tendered < totals.grandTotal) {
        showToast("Cash tendered is less than bill total!", "warning");
        return;
      }
      processSale('Cash', {
        cash_tendered: tendered,
        change_due: Math.max(0, tendered - totals.grandTotal)
      });
    });

    dom.btnConfirmCardPayment.addEventListener('click', () => {
      processSale('Card', { card_auth: dom.cardRefInput.value || 'CARD/AUTH' });
    });

    [dom.splitCashAmount, dom.splitUpiAmount, dom.splitCardAmount].forEach(inp => {
      inp.addEventListener('input', updateSplitAllocations);
    });
    dom.btnConfirmSplitPayment.addEventListener('click', () => {
      const totals = calculateTotals();
      const cash = Number(dom.splitCashAmount.value) || 0;
      const upi = Number(dom.splitUpiAmount.value) || 0;
      const card = Number(dom.splitCardAmount.value) || 0;
      if (cash + upi + card !== totals.grandTotal) {
        showToast("Split amounts must match exact grand total!", "warning");
        return;
      }
      processSale('Split', { cash_amount: cash, upi_amount: upi, card_amount: card });
    });

    // Receipts
    dom.btnCloseReceiptModal.addEventListener('click', () => closeModal(dom.modalReceipt));
    dom.btnReceiptDone.addEventListener('click', () => closeModal(dom.modalReceipt));
    dom.btnPrintReceiptBtn.addEventListener('click', () => window.print());

    // Inventory Controls
    dom.invSearchInput.addEventListener('input', renderInventoryTable);
    dom.invCategoryFilter.addEventListener('change', renderInventoryTable);
    dom.invStockStatusFilter.addEventListener('change', renderInventoryTable);

    dom.btnOpenNewProduct.addEventListener('click', () => openModal(dom.modalNewProduct));
    dom.btnCloseNewProductModal.addEventListener('click', () => closeModal(dom.modalNewProduct));
    dom.newProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: dom.newProductForm.querySelector('#prodName').value.trim(),
        category: dom.prodCategory.value,
        barcode: dom.newProductForm.querySelector('#prodBarcode').value.trim(),
        size: dom.newProductForm.querySelector('#prodSize').value.trim(),
        color: dom.newProductForm.querySelector('#prodColor').value.trim(),
        cost_price: Number(dom.newProductForm.querySelector('#prodCostPrice').value),
        selling_price: Number(dom.newProductForm.querySelector('#prodSellingPrice').value),
        gst_rate: Number(dom.newProductForm.querySelector('#prodGstRate').value),
        stock_qty: Number(dom.newProductForm.querySelector('#prodStockQty').value),
        reorder_level: Number(dom.newProductForm.querySelector('#prodReorderLevel').value)
      };
      try {
        const res = await api.post('/api/items', payload);
        showToast("Product added to supermarket catalog!", "success");
        closeModal(dom.modalNewProduct);
        dom.newProductForm.reset();
        await loadItems();

        // Real-time Firestore Cloud Sync
        if (window.FirebaseSync && res.data) {
          window.FirebaseSync.syncItem(res.data);
        }
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    dom.btnOpenRestock.addEventListener('click', () => openModal(dom.modalRestock));
    dom.btnCloseRestockModal.addEventListener('click', () => closeModal(dom.modalRestock));
    dom.restockForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        item_id: dom.restockItemSelect.value,
        delta_qty: Number(dom.modalRestock.querySelector('#restockQty').value),
        reason: dom.modalRestock.querySelector('#restockReason').value,
        notes: dom.modalRestock.querySelector('#restockNotes').value
      };
      try {
        const res = await api.post('/api/inventory/adjust', payload);
        showToast("Delivery received & stock updated!", "success");
        closeModal(dom.modalRestock);
        dom.restockForm.reset();
        await loadItems();

        // Real-time Firestore Cloud Sync
        if (window.FirebaseSync && res.data) {
          window.FirebaseSync.syncItem(res.data);
        }
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    // Supplier Modal
    dom.btnOpenNewSupplier.addEventListener('click', () => openModal(dom.modalNewSupplier));
    dom.btnCloseNewSupplierModal.addEventListener('click', () => closeModal(dom.modalNewSupplier));
    dom.newSupplierForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: dom.modalNewSupplier.querySelector('#newSupName').value.trim(),
        category: dom.modalNewSupplier.querySelector('#newSupCategory').value.trim(),
        contact: dom.modalNewSupplier.querySelector('#newSupContact').value.trim(),
        email: dom.modalNewSupplier.querySelector('#newSupEmail').value.trim(),
        gstin: dom.modalNewSupplier.querySelector('#newSupGstin').value.trim()
      };
      try {
        await api.post('/api/suppliers', payload);
        showToast("Vendor profile saved!", "success");
        closeModal(dom.modalNewSupplier);
        dom.newSupplierForm.reset();
        await loadSuppliers();
        renderSuppliersTable();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    // Reports Filters
    dom.repFilterPills.forEach(pill => {
      pill.addEventListener('click', () => loadReports(pill.dataset.range));
    });
    dom.btnPrintReport.addEventListener('click', () => window.print());
    dom.btnExportCSV.addEventListener('click', exportReportsCSV);

    // Shifts
    dom.sideUserCard.addEventListener('click', () => {
      document.getElementById('navShiftsBtn').click();
    });
    dom.closeShiftForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const actualCash = Number(dom.closeCashCount.value);
      const notes = dom.closeShiftNotes.value;
      if (confirm(`Confirm closing register with counted cash of ${fmt.currency(actualCash)}?`)) {
        try {
          const res = await api.post('/api/shifts/close', { closing_cash: actualCash, notes });
          const shift = res.data;
          const variance = shift.cash_variance;
          const msg = variance === 0 ? "Perfect drawer count!" : variance > 0 ? `Excess of ${fmt.currency(variance)}` : `Shortage of ${fmt.currency(Math.abs(variance))}`;
          alert(`Shift Closed Successfully!\nExpected: ${fmt.currency(shift.expected_cash)}\nActual: ${fmt.currency(actualCash)}\nResult: ${msg}`);
          dom.closeShiftForm.reset();
          await loadActiveShift();

          // Real-time Firestore Cloud Sync
          if (window.FirebaseSync && shift) {
            window.FirebaseSync.syncShift(shift);
          }
        } catch (err) {
          showToast(err.message, "error");
        }
      }
    });

    dom.openShiftForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        cashier: dom.openCashierName.value.trim(),
        opening_cash: Number(dom.openOpeningFloat.value)
      };
      try {
        await api.post('/api/shifts/open', payload);
        showToast("New shift float initialized!", "success");
        dom.openShiftForm.reset();
        await loadActiveShift();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    // Store & UPI Settings
    dom.storeSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        store_name: dom.setStoreName.value.trim(),
        tagline: dom.setTagline.value.trim(),
        gstin: dom.setGstin.value.trim(),
        phone: dom.setPhone.value.trim(),
        address: dom.setAddress.value.trim(),
        receipt_footer: dom.setReceiptFooter.value.trim()
      };
      try {
        await api.post('/api/settings', payload);
        showToast("Store profile saved!", "success");
        await loadSettings();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    dom.upiSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        upi_id: dom.setUpiId.value.trim(),
        upi_merchant_name: dom.setUpiName.value.trim()
      };
      try {
        await api.post('/api/settings', payload);
        showToast("UPI configuration updated!", "success");
        await loadSettings();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    // Hotkeys (F2: POS, F3: Inventory, F4: Reports, F6: Hold, F9: Pay, Esc: Close)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('navPosBtn').click();
      } else if (e.key === 'F3') {
        e.preventDefault();
        document.getElementById('navInvBtn').click();
      } else if (e.key === 'F4') {
        e.preventDefault();
        document.getElementById('navRepBtn').click();
      } else if (e.key === 'F6' && state.currentTab === 'tab-pos') {
        e.preventDefault();
        holdCart();
      } else if (e.key === 'F9' && state.currentTab === 'tab-pos' && !dom.modalPayment.classList.contains('active')) {
        e.preventDefault();
        openPaymentModal();
      } else if (e.key === 'Escape') {
        closeModal(dom.modalPayment);
        closeModal(dom.modalReceipt);
        closeModal(dom.modalNewProduct);
        closeModal(dom.modalRestock);
        closeModal(dom.modalNewCustomer);
        closeModal(dom.modalNewSupplier);
        closeModal(dom.modalHeldCarts);
      }
    });

    // PWA & Desktop App Installation
    let deferredPrompt = null;
    const btnInstallPwa = document.getElementById('btnInstallPwa');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btnInstallPwa) {
        btnInstallPwa.style.display = 'inline-flex';
      }
    });

    if (btnInstallPwa) {
      btnInstallPwa.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            showToast('Tioras POS installed to Desktop!', 'success');
            btnInstallPwa.style.display = 'none';
          }
          deferredPrompt = null;
        } else {
          showToast('App is ready! Launching desktop mode...', 'success');
        }
      });
    }

    // Register Service Worker for offline and desktop app support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.warn('ServiceWorker registration error:', err);
        });
      });
    }

    // Firebase Cloud Sync & Analytics UI Handlers
    const btnSyncAllToFirebase = document.getElementById('btnSyncAllToFirebase');
    if (btnSyncAllToFirebase) {
      btnSyncAllToFirebase.addEventListener('click', async () => {
        if (!window.FirebaseSync) {
          showToast('Firebase engine initializing...', 'warning');
          return;
        }
        btnSyncAllToFirebase.disabled = true;
        btnSyncAllToFirebase.textContent = '☁️ Syncing to Firebase Cloud...';
        try {
          const count = await window.FirebaseSync.syncAll({
            invoices: state.invoices,
            customers: state.customers,
            items: state.items
          });
          showToast(`Successfully backed up ${count} records to Firebase!`, 'success');
        } catch (err) {
          showToast(`Firebase sync note: ${err.message}`, 'warning');
        } finally {
          btnSyncAllToFirebase.disabled = false;
          btnSyncAllToFirebase.textContent = '☁️ Push All Local Data to Firebase Cloud';
        }
      });
    }

    const btnEnablePush = document.getElementById('btnEnablePushNotifications');
    if (btnEnablePush) {
      btnEnablePush.addEventListener('click', async () => {
        if (!window.FirebaseSync) {
          showToast('Firebase engine initializing...', 'warning');
          return;
        }
        btnEnablePush.disabled = true;
        btnEnablePush.textContent = 'Requesting Permission...';
        try {
          const token = await window.FirebaseSync.requestNotificationPermission();
          showToast('Push Notifications Active! Device registered.', 'success');
          btnEnablePush.textContent = '🔔 Push Alerts Active';
          btnEnablePush.classList.replace('btn-secondary', 'btn-success');
        } catch (err) {
          showToast(`Push Notice: ${err.message}`, 'warning');
          btnEnablePush.disabled = false;
          btnEnablePush.textContent = '🔔 Enable Cloud Push Notifications';
        }
      });
    }

    const btnTestFirebaseAnalytics = document.getElementById('btnTestFirebaseAnalytics');
    if (btnTestFirebaseAnalytics) {
      btnTestFirebaseAnalytics.addEventListener('click', () => {
        if (window.FirebaseSync) {
          window.FirebaseSync.logEvent('pos_terminal_test', {
            event_source: 'settings_panel',
            store: 'Tioras Fashion Studio',
            timestamp: new Date().toISOString()
          });
          showToast('Test event recorded in Google Analytics (G-8G1SKR5Q48)!', 'success');
        } else {
          showToast('Firebase Analytics is ready.', 'success');
        }
      });
    }

    window.addEventListener('firebase-connected', (e) => {
      const badge = document.getElementById('firebaseCloudBadge');
      if (badge) {
        badge.innerHTML = `<span class="cloud-dot"></span> <span>Firebase Active</span>`;
      }
    });

    // Mobile Off-canvas Navigation
    if (dom.btnMobileSidebarToggle) {
      dom.btnMobileSidebarToggle.addEventListener('click', () => {
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-open');
        if (dom.mobileNavBackdrop) dom.mobileNavBackdrop.classList.toggle('active');
      });
    }
    if (dom.mobileNavBackdrop) {
      dom.mobileNavBackdrop.addEventListener('click', () => {
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
        dom.mobileNavBackdrop.classList.remove('active');
      });
    }

    // Edit Product Modal Listeners
    if (dom.btnCloseEditProductModal) dom.btnCloseEditProductModal.addEventListener('click', () => closeModal(dom.modalEditProduct));
    if (dom.btnCancelEditProduct) dom.btnCancelEditProduct.addEventListener('click', () => closeModal(dom.modalEditProduct));
    if (dom.editProductForm) {
      dom.editProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = dom.editProdId.value;
        const payload = {
          name: dom.editProdName.value.trim(),
          category: dom.editProdCategory.value,
          sku: dom.editProdSku.value.trim(),
          barcode: dom.editProdBarcode.value.trim(),
          size: dom.editProdSize.value.trim(),
          color: dom.editProdColor.value.trim(),
          cost_price: Number(dom.editProdCost.value),
          selling_price: Number(dom.editProdPrice.value),
          gst_rate: Number(dom.editProdGst.value),
          stock_qty: Number(dom.editProdStock.value),
          reorder_level: Number(dom.editProdReorder.value),
          uom: dom.editProdUom.value
        };
        try {
          const res = await api.put(`/api/items/${encodeURIComponent(id)}`, payload);
          showToast(`Product "${payload.name}" updated successfully!`, 'success');
          closeModal(dom.modalEditProduct);
          await loadItems();
          loadDashboardStats();

          // Real-time Firestore Cloud Sync
          if (window.FirebaseSync && res.data) {
            window.FirebaseSync.syncItem(res.data);
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
    if (dom.btnDeleteProduct) {
      dom.btnDeleteProduct.addEventListener('click', async () => {
        const id = dom.editProdId.value;
        const name = dom.editProdName.value;
        if (!confirm(`Are you sure you want to remove "${name}" (${id}) from the catalog?`)) return;
        try {
          await api.del(`/api/items/${encodeURIComponent(id)}`);
          showToast(`Product "${name}" deleted from catalog`, 'info');
          closeModal(dom.modalEditProduct);
          await loadItems();
          loadDashboardStats();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Edit Customer Modal Listeners
    if (dom.btnCloseEditCustomerModal) dom.btnCloseEditCustomerModal.addEventListener('click', () => closeModal(dom.modalEditCustomer));
    if (dom.btnCancelEditCustomer) dom.btnCancelEditCustomer.addEventListener('click', () => closeModal(dom.modalEditCustomer));
    if (dom.editCustomerForm) {
      dom.editCustomerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = dom.editCustId.value;
        const payload = {
          name: dom.editCustName.value.trim(),
          phone: dom.editCustPhone.value.trim(),
          email: dom.editCustEmail.value.trim(),
          loyalty_points: Number(dom.editCustPoints.value) || 0,
          credit_balance: Number(dom.editCustCredit.value) || 0
        };
        try {
          const res = await api.put(`/api/customers/${encodeURIComponent(id)}`, payload);
          showToast(`Customer member profile updated!`, 'success');
          closeModal(dom.modalEditCustomer);
          await loadCustomers();

          // Real-time Firestore Cloud Sync
          if (window.FirebaseSync && res.data) {
            window.FirebaseSync.syncCustomer(res.data);
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
    if (dom.btnDeleteCustomer) {
      dom.btnDeleteCustomer.addEventListener('click', async () => {
        const id = dom.editCustId.value;
        const name = dom.editCustName.value;
        if (!confirm(`Delete customer member "${name}"?`)) return;
        try {
          await api.del(`/api/customers/${encodeURIComponent(id)}`);
          showToast(`Customer profile deleted`, 'info');
          closeModal(dom.modalEditCustomer);
          await loadCustomers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
    if (dom.btnCloseWalletModal) dom.btnCloseWalletModal.addEventListener('click', () => closeModal(dom.modalWalletRecharge));
    if (dom.walletRechargeForm) {
      dom.walletRechargeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = dom.walletCustId.value;
        const amount = Number(dom.walletRechargeAmount.value) || 0;
        try {
          const res = await api.post(`/api/customers/${encodeURIComponent(id)}/recharge`, { amount });
          showToast(`Top-up of ₹${amount} applied to customer wallet!`, 'success');
          closeModal(dom.modalWalletRecharge);
          await loadCustomers();

          // Real-time Firestore Cloud Sync
          if (window.FirebaseSync && res.data) {
            window.FirebaseSync.syncCustomer(res.data);
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Edit Supplier Modal Listeners
    if (dom.btnCloseEditSupplierModal) dom.btnCloseEditSupplierModal.addEventListener('click', () => closeModal(dom.modalEditSupplier));
    if (dom.btnCancelEditSupplier) dom.btnCancelEditSupplier.addEventListener('click', () => closeModal(dom.modalEditSupplier));
    if (dom.editSupplierForm) {
      dom.editSupplierForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = dom.editSupId.value;
        const payload = {
          name: dom.editSupName.value.trim(),
          category: dom.editSupCategory.value.trim(),
          contact: dom.editSupContact.value.trim(),
          email: dom.editSupEmail.value.trim(),
          gstin: dom.editSupGstin.value.trim()
        };
        try {
          await api.put(`/api/suppliers/${encodeURIComponent(id)}`, payload);
          showToast(`Vendor profile updated!`, 'success');
          closeModal(dom.modalEditSupplier);
          await loadSuppliers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
    if (dom.btnDeleteSupplier) {
      dom.btnDeleteSupplier.addEventListener('click', async () => {
        const id = dom.editSupId.value;
        const name = dom.editSupName.value;
        if (!confirm(`Remove vendor "${name}"?`)) return;
        try {
          await api.del(`/api/suppliers/${encodeURIComponent(id)}`);
          showToast(`Vendor deleted`, 'info');
          closeModal(dom.modalEditSupplier);
          await loadSuppliers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // ERPNext Backend Integration Handlers
    if (dom.btnTestErpConnection) {
      dom.btnTestErpConnection.addEventListener('click', async () => {
        dom.btnTestErpConnection.disabled = true;
        dom.btnTestErpConnection.textContent = 'Testing...';
        if (dom.erpSyncStatusText) dom.erpSyncStatusText.textContent = 'Attempting connection...';
        try {
          const res = await api.post('/api/erpnext/test', {
            url: dom.erpUrl.value.trim(),
            company: dom.erpCompany.value.trim(),
            api_key: dom.erpApiKey.value.trim(),
            api_secret: dom.erpApiSecret.value.trim()
          });
          if (res.connected) {
            dom.erpnextStatusBadge.textContent = 'CONNECTED (' + (res.user || 'Admin') + ')';
            dom.erpnextStatusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
            dom.erpnextStatusBadge.style.color = '#10b981';
            dom.erpnextStatusBadge.style.borderColor = '#10b981';
            if (dom.erpSyncStatusText) dom.erpSyncStatusText.textContent = `Connected to ERPNext at ${res.server}`;
            showToast(`ERPNext connected successfully (${res.user})!`, 'success');
          } else {
            dom.erpnextStatusBadge.textContent = 'HOST OFFLINE';
            dom.erpnextStatusBadge.style.background = 'rgba(239, 68, 68, 0.15)';
            dom.erpnextStatusBadge.style.color = '#ef4444';
            dom.erpnextStatusBadge.style.borderColor = '#ef4444';
            if (dom.erpSyncStatusText) dom.erpSyncStatusText.textContent = res.message || 'Unable to connect';
            showToast(res.message || 'Could not connect to ERPNext host', 'warning');
          }
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          dom.btnTestErpConnection.disabled = false;
          dom.btnTestErpConnection.textContent = '🔌 Test Connection';
        }
      });
    }

    if (dom.btnPullErpItems) {
      dom.btnPullErpItems.addEventListener('click', async () => {
        dom.btnPullErpItems.disabled = true;
        dom.btnPullErpItems.textContent = 'Pulling...';
        try {
          const res = await api.post('/api/erpnext/sync/items', {
            direction: 'pull',
            url: dom.erpUrl.value.trim(),
            company: dom.erpCompany.value.trim(),
            api_key: dom.erpApiKey.value.trim(),
            api_secret: dom.erpApiSecret.value.trim()
          });
          showToast(`Retrieved ${res.count || 0} catalog items from ERPNext!`, 'success');
          await loadItems();
        } catch (err) {
          showToast(err.message, 'warning');
        } finally {
          dom.btnPullErpItems.disabled = false;
          dom.btnPullErpItems.textContent = '📥 Pull Items from ERPNext';
        }
      });
    }

    if (dom.btnPushErpInvoices) {
      dom.btnPushErpInvoices.addEventListener('click', async () => {
        dom.btnPushErpInvoices.disabled = true;
        dom.btnPushErpInvoices.textContent = 'Pushing...';
        try {
          const res = await api.post('/api/erpnext/sync/invoices', {
            url: dom.erpUrl.value.trim(),
            company: dom.erpCompany.value.trim(),
            warehouse: dom.erpWarehouse.value.trim(),
            pos_profile: dom.erpPosProfile.value.trim(),
            api_key: dom.erpApiKey.value.trim(),
            api_secret: dom.erpApiSecret.value.trim()
          });
          showToast(`Pushed ${res.count || 0} sales invoices to ERPNext!`, 'success');
        } catch (err) {
          showToast(err.message, 'warning');
        } finally {
          dom.btnPushErpInvoices.disabled = false;
          dom.btnPushErpInvoices.textContent = '📤 Push Invoices to ERPNext';
        }
      });
    }

    if (dom.erpnextSettingsForm) {
      dom.erpnextSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          ...state.settings,
          erpnext: {
            enabled: true,
            url: dom.erpUrl.value.trim(),
            company: dom.erpCompany.value.trim(),
            warehouse: dom.erpWarehouse.value.trim(),
            pos_profile: dom.erpPosProfile.value.trim(),
            api_key: dom.erpApiKey.value.trim(),
            api_secret: dom.erpApiSecret.value.trim()
          }
        };
        try {
          await api.post('/api/settings', payload);
          showToast('ERPNext configuration saved!', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  }

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
