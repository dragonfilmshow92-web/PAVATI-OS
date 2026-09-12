import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import soundFx from '../utils/sounds';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const VALID_PAGES = [
    'dashboard', 'pos', 'inventory', 'products', 'receiving', 
    'listing', 'barcode', 'suppliers', 'invoices', 'customers', 
    'reports', 'settings', 'returns', 'purchase-orders', 
    'coupons', 'analytics', 'expenses'
  ];

  const getInitialPage = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/+/, '').trim().toLowerCase();
      if (path === 'new-listing') return 'listing';
      if (VALID_PAGES.includes(path)) return path;
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (hash === 'new-listing') return 'listing';
      if (VALID_PAGES.includes(hash)) return hash;
    }
    return 'dashboard';
  };

  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const qTheme = urlParams.get('theme');
        if (qTheme === 'light' || qTheme === 'dark') {
          localStorage.setItem('pos_theme', qTheme);
          return qTheme;
        }
        const saved = localStorage.getItem('pos_theme');
        if (saved === 'light' || saved === 'dark') return saved;
      }
      return 'light';
    } catch (e) {
      return 'light';
    }
  });
  const [currentPage, setCurrentPageRaw] = useState(getInitialPage);
  // Default sidebar open (true)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPageRaw(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const setCurrentPage = (pageId) => {
    setCurrentPageRaw(pageId);
    if (typeof window !== 'undefined') {
      const targetPath = pageId === 'dashboard' ? '/' : `/${pageId}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ pageId }, '', targetPath);
      }
    }
    // On mobile / small screens only: close sidebar after navigating
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
      localStorage.setItem('pos_sidebar_open', 'false');
    }
  };
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [grnRecords, setGrnRecords] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [settings, setSettings] = useState({
    store_name: "PAVATI OS",
    store_tagline: "Custom POS Solution",
    store_address: "",
    store_phone: "",
    store_gstin: "",
    upi_id: "",
    upi_merchant_name: "",
    currency_symbol: "₹"
  });


  // POS Billing Cart State
  const [cart, setCart] = useState([]);
  const [cartCustomer, setCartCustomer] = useState(null);
  const [cartDiscountPercent, setCartDiscountPercent] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_held_carts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pos_held_carts', JSON.stringify(heldCarts));
    } catch (e) {
      console.error(e);
    }
  }, [heldCarts]);

  // Global Toasts
  const [toasts, setToasts] = useState([]);

  // Active Modals state
  const [modalState, setModalState] = useState({
    type: null, // 'payment', 'receipt', 'product', 'priceEdit', 'supplier', 'receiving', 'shift'
    data: null
  });

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('pos_theme', next);
      document.documentElement.setAttribute('data-theme', next);
    } catch (e) {}
  };

  const getMergedItems = (remoteItems = []) => {
    try {
      const local = JSON.parse(localStorage.getItem('pos_local_items') || '[]');
      if (!Array.isArray(local) || local.length === 0) return remoteItems;
      const remoteIds = new Set(remoteItems.map(i => i.barcode || i.id));
      const nonSynced = local.filter(i => !remoteIds.has(i.barcode || i.id));
      return [...remoteItems, ...nonSynced];
    } catch {
      return remoteItems;
    }
  };

  const syncLocalItemsToServer = async (remoteItems = []) => {
    try {
      const local = JSON.parse(localStorage.getItem('pos_local_items') || '[]');
      const remoteBarcodes = new Set(remoteItems.map(i => i.barcode));
      const draftsToSync = local.filter(i => i.is_local_draft && !remoteBarcodes.has(i.barcode));
      if (draftsToSync.length === 0) return;
      for (const draft of draftsToSync) {
        try {
          const { is_local_draft, id, _id, ...cleanData } = draft;
          const syncRes = await api.createItem(cleanData);
          if (syncRes && (syncRes.success || syncRes.id)) {
            draft.is_local_draft = false;
            if (syncRes.data?.id) draft.id = syncRes.data.id;
          }
        } catch (e) {}
      }
      localStorage.setItem('pos_local_items', JSON.stringify(local));
    } catch (e) {}
  };

  const loadAllData = async () => {
    try {
      const [itemsRes, catRes, supRes, custRes, shiftRes, setRes, grnRes] = await Promise.allSettled([
        api.getItems(),
        api.getCategories(),
        api.getSuppliers(),
        api.getCustomers(),
        api.getActiveShift(),
        api.getSettings(),
        api.getGRNRecords()
      ]);

      if (itemsRes.status === 'fulfilled' && itemsRes.value.success && Array.isArray(itemsRes.value.data)) {
        setItems(getMergedItems(itemsRes.value.data));
        syncLocalItemsToServer(itemsRes.value.data);
      } else {
        const local = JSON.parse(localStorage.getItem('pos_local_items') || '[]');
        if (Array.isArray(local) && local.length > 0) setItems(local);
      }

      if (catRes.status === 'fulfilled' && catRes.value.success) setCategories(catRes.value.data);
      if (supRes.status === 'fulfilled' && supRes.value.success) setSuppliers(supRes.value.data);
      if (custRes.status === 'fulfilled' && custRes.value.success) setCustomers(custRes.value.data);
      if (shiftRes.status === 'fulfilled' && shiftRes.value.success) setActiveShift(shiftRes.value.data);
      if (setRes.status === 'fulfilled' && setRes.value.success) setSettings(setRes.value.data);
      if (grnRes.status === 'fulfilled' && grnRes.value.success) setGrnRecords(grnRes.value.data);
    } catch (err) {
      console.error("Initial data load error:", err);
    }
  };

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial data load
  useEffect(() => {
    loadAllData();
  }, []);

  const refreshItems = async () => {
    try {
      const res = await api.getItems();
      if (res && res.success && Array.isArray(res.data)) {
        setItems(getMergedItems(res.data));
        syncLocalItemsToServer(res.data);
      } else {
        const local = JSON.parse(localStorage.getItem('pos_local_items') || '[]');
        if (Array.isArray(local) && local.length > 0) setItems(local);
      }
    } catch (e) {
      console.warn('refreshItems failed:', e);
      const local = JSON.parse(localStorage.getItem('pos_local_items') || '[]');
      if (Array.isArray(local) && local.length > 0) setItems(local);
    }
  };

  const refreshSuppliers = async () => {
    try {
      const res = await api.getSuppliers();
      if (res && res.success && Array.isArray(res.data)) setSuppliers(res.data);
    } catch (e) {
      console.warn('refreshSuppliers failed:', e);
    }
  };

  const refreshGRN = async () => {
    try {
      const res = await api.getGRNRecords();
      if (res && res.success && Array.isArray(res.data)) setGrnRecords(res.data);
    } catch (e) {
      console.warn('refreshGRN failed:', e);
    }
  };

  const refreshShift = async () => {
    try {
      const res = await api.getActiveShift();
      if (res && res.success && res.data) setActiveShift(res.data);
    } catch (e) {
      console.warn('refreshShift failed:', e);
    }
  };

  // Cart operations
  const addToCart = (product, quantity = 1, playSound = true) => {
    if (!product) return;

    const currentStock = Number(product.stock_qty) || 0;
    const prodId = product.id || product._id;

    // Soft-warn if stock is 0, but still allow billing
    // (hard-block removed: cashiers can always override at counter)
    if (currentStock <= 0) {
      soundFx.error();
      showToast(`⚠ "${product.name}" has 0 stock on hand — added to bill anyway. Receive stock in Stock Receiving.`, 'warning');
    }

    setCart(prev => {
      const idx = prev.findIndex(item => 
        (item.id && prodId && String(item.id) === String(prodId)) || 
        (item.barcode && product.barcode && item.barcode === product.barcode)
      );
      if (idx > -1) {
        const next = [...prev];
        const newQty = next[idx].qty + quantity;
        // Only block if stock is KNOWN and exceeded (skip if 0 — already warned above)
        if (currentStock > 0 && newQty > currentStock) {
          soundFx.error();
          showToast(`Only ${currentStock} units of "${product.name}" in stock.`, 'warning');
          return prev;
        }
        const disc = Number(next[idx].discount_percent) || 0;
        const unitPrice = next[idx].selling_price * (1 - disc / 100);
        next[idx] = {
          ...next[idx],
          qty: newQty,
          subtotal: Math.round(newQty * unitPrice * 100) / 100
        };
        if (playSound) soundFx.addToCart();
        return next;
      } else {
        // Only block if stock is KNOWN and exceeded
        if (currentStock > 0 && quantity > currentStock) {
          soundFx.error();
          showToast(`Only ${currentStock} units of "${product.name}" in stock.`, 'warning');
          return prev;
        }
        if (playSound) soundFx.addToCart();
        return [...prev, {
          id: prodId,
          sku: product.sku || '',
          barcode: product.barcode || '',
          name: product.name,
          category: product.category || 'General',
          size: product.size || '',
          color: product.color || '',
          cost_price: Number(product.cost_price) || 0,
          selling_price: Number(product.selling_price) || 0,
          mrp: Number(product.mrp) || Number(product.selling_price) || 0,
          rack_name: product.rack_name || product.rack_location || "Rack A-01",
          gst_rate: product.gst_rate !== undefined ? Number(product.gst_rate) : 12,
          hsn_code: product.hsn_code || '',
          tax_inclusive: Boolean(product.tax_inclusive),
          qty: quantity,
          discount_percent: 0,
          subtotal: quantity * (Number(product.selling_price) || 0)
        }];
      }
    });

    if (currentStock > 0) {
      showToast(`Added ${product.name} to bill`, 'success');
    }
  };


  const updateCartQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (String(item.id) === String(id)) {
          const newQty = item.qty + delta;
          if (newQty <= 0) {
            soundFx.removeItem();
            return null;
          }

          // Stock limit check — prevent billing more than what's in stock
          if (delta > 0) {
            const liveItem = items.find(i => (i.id && String(i.id) === String(id)) || (i._id && String(i._id) === String(id)));
            const availableStock = Number(liveItem?.stock_qty ?? 9999);
            if (newQty > availableStock) {
              soundFx.error();
              showToast(`Only ${availableStock} units of "${item.name}" in stock.`, 'warning');
              return item; // don't change
            }
            soundFx.addToCart();
          } else {
            soundFx.removeItem();
          }

          const disc = Number(item.discount_percent) || 0;
          const unitPrice = item.selling_price * (1 - disc / 100);
          return {
            ...item,
            qty: newQty,
            subtotal: Math.round(newQty * unitPrice * 100) / 100
          };
        }
        return item;
      }).filter(Boolean);
    });
  };


  const updateCartLineDiscount = (id, discountPercent) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const disc = Math.max(0, Math.min(100, Number(discountPercent) || 0));
          const unitPrice = item.selling_price * (1 - disc / 100);
          return {
            ...item,
            discount_percent: disc,
            subtotal: Math.round(item.qty * unitPrice * 100) / 100
          };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id) => {
    soundFx.removeItem();
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    soundFx.removeItem();
    setCart([]);
    setCartCustomer(null);
    setCartDiscountPercent(0);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code) => {
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) {
      showToast('Please enter a coupon code', 'warning');
      return { success: false, message: 'Code required' };
    }
    const currentSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    if (currentSubtotal <= 0) {
      showToast('Cart is empty. Add products before applying coupon.', 'warning');
      return { success: false, message: 'Cart is empty' };
    }

    try {
      const res = await api.validateCoupon(cleanCode, currentSubtotal);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        showToast(`Coupon ${cleanCode} applied! Saved ₹${res.data.discount_amount}`, 'success');
        return { success: true, coupon: res.data };
      } else {
        showToast(res.message || res.error || 'Invalid or ineligible coupon', 'warning');
        return { success: false, message: res.message || res.error };
      }
    } catch (err) {
      showToast('Error validating coupon: ' + err.message, 'danger');
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  // Hold / Park Cart functions
  const holdCart = (notes = '') => {
    if (cart.length === 0) {
      showToast("Cannot hold an empty cart", "warning");
      return;
    }

    const holdId = `HOLD-${Date.now().toString().slice(-4)}`;

    // Calculate total inline so we don't depend on grandTotal which is declared later
    const holdSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const holdDiscountAmount = Math.round((holdSubtotal * cartDiscountPercent) / 100);
    const holdTotal = Math.round(holdSubtotal - holdDiscountAmount);

    const heldEntry = {
      id: holdId,
      holdNo: heldCarts.length + 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().slice(0, 10),
      customer: cartCustomer,
      items: [...cart],
      discountPercent: cartDiscountPercent,
      itemCount: cart.reduce((acc, i) => acc + i.qty, 0),
      total: holdTotal,
      notes: notes
    };

    setHeldCarts(prev => [heldEntry, ...prev]);
    clearCart();
    showToast(`Bill parked on hold (${holdId})`, "info");
  };

  const restoreHeldCart = (holdId) => {
    const found = heldCarts.find(h => h.id === holdId);
    if (!found) return;

    if (cart.length > 0) {
      // Park current before restoring if desired
      holdCart("Auto-held before restore");
    }

    setCart(found.items || []);
    setCartCustomer(found.customer || null);
    setCartDiscountPercent(found.discountPercent || 0);
    setHeldCarts(prev => prev.filter(h => h.id !== holdId));
    setModalState({ type: null, data: null });
    showToast(`Restored bill ${found.id}`, "success");
  };

  const deleteHeldCart = (holdId) => {
    setHeldCarts(prev => prev.filter(h => h.id !== holdId));
    showToast(`Discarded held bill ${holdId}`, "info");
  };

  // Cart Totals Calculation
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cartDiscountAmount = Math.round((subtotal * cartDiscountPercent) / 100);
  
  // Coupon Discount Calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    const afterCartDisc = Math.max(0, subtotal - cartDiscountAmount);
    const cType = String(appliedCoupon.discount_type || appliedCoupon.type || '').toLowerCase();
    const cVal = Number(appliedCoupon.discount_value !== undefined ? appliedCoupon.discount_value : appliedCoupon.value) || 0;
    if (cType === 'percent' || cType === 'percentage') {
      couponDiscount = Math.round((afterCartDisc * cVal) / 100);
    } else {
      couponDiscount = Math.min(afterCartDisc, cVal || Number(appliedCoupon.discount_amount) || 0);
    }
  }

  const totalDiscountAmount = cartDiscountAmount + couponDiscount;
  const discountRatio = subtotal > 0 ? (totalDiscountAmount / subtotal) : 0;

  // Seller and Buyer state comparison for IGST vs CGST/SGST
  const sellerState = settings?.store_state || 'Maharashtra';
  const sellerStateCode = String(settings?.store_state_code || '27').trim().padStart(2, '0');
  const buyerState = String(cartCustomer?.state || '').trim();
  const buyerGstin = String(cartCustomer?.gstin || '').trim();
  let buyerCode = null;
  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(buyerGstin)) {
    buyerCode = buyerGstin.slice(0, 2);
  }

  const isInterstate = Boolean(
    (buyerCode && sellerStateCode && buyerCode !== sellerStateCode) ||
    (buyerState && sellerState && buyerState.toLowerCase() !== sellerState.toLowerCase())
  );

  // Line-by-line GST calculation
  let computedTaxable = 0;
  let computedCgst = 0;
  let computedSgst = 0;
  let computedIgst = 0;
  let computedTotalTax = 0;
  let computedGrandTotalRaw = 0;

  cart.forEach(item => {
    const lineNet = Math.max(0, (item.subtotal || 0) * (1 - discountRatio));
    const rate = Number(item.gst_rate !== undefined ? item.gst_rate : (settings?.default_tax_rate ?? 12));
    const isInclusive = item.tax_inclusive !== undefined 
      ? Boolean(item.tax_inclusive) 
      : Boolean(settings?.tax_inclusive_default);

    let taxable = 0;
    let tax = 0;
    let lineTotal = 0;

    if (isInclusive) {
      taxable = lineNet / (1 + rate / 100);
      tax = lineNet - taxable;
      lineTotal = lineNet;
    } else {
      taxable = lineNet;
      tax = taxable * (rate / 100);
      lineTotal = taxable + tax;
    }

    computedTaxable += taxable;
    computedTotalTax += tax;
    computedGrandTotalRaw += lineTotal;

    if (isInterstate) {
      computedIgst += tax;
    } else {
      computedCgst += tax / 2;
      computedSgst += tax / 2;
    }
  });

  const grandTotal = Math.round(computedGrandTotalRaw);
  const roundOff = Math.round((grandTotal - computedGrandTotalRaw) * 100) / 100;
  const totalTax = Math.round(computedTotalTax * 100) / 100;

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      currentPage,
      setCurrentPage,
      items,
      setItems,
      refreshItems,
      categories,
      suppliers,
      setSuppliers,
      refreshSuppliers,
      customers,
      setCustomers,
      grnRecords,
      refreshGRN,
      activeShift,
      refreshShift,
      settings,
      setSettings,
      cart,
      addToCart,
      updateCartQty,
      updateCartLineDiscount,
      removeFromCart,
      clearCart,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      cartCustomer,
      setCartCustomer,
      cartDiscountPercent,
      setCartDiscountPercent,
      heldCarts,
      holdCart,
      restoreHeldCart,
      deleteHeldCart,
      cartTotals: {
        subtotal: Math.round(subtotal * 100) / 100,
        taxableAmount: Math.round(computedTaxable * 100) / 100,
        cgstAmount: Math.round(computedCgst * 100) / 100,
        sgstAmount: Math.round(computedSgst * 100) / 100,
        igstAmount: Math.round(computedIgst * 100) / 100,
        totalTax,
        isInterstate,
        discountAmount: cartDiscountAmount,
        couponDiscount,
        totalDiscountAmount,
        appliedCoupon,
        roundOff,
        grandTotal,
        itemCount: cart.reduce((acc, i) => acc + i.qty, 0)
      },
      toasts,
      showToast,
      modalState,
      setModalState,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      closeSidebar
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
