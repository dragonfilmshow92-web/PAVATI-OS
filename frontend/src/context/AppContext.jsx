import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

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
      if (VALID_PAGES.includes(path)) return path;
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (VALID_PAGES.includes(hash)) return hash;
    }
    return 'dashboard';
  };

  const [theme, setTheme] = useState(localStorage.getItem('pos_theme') || 'dark');
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
    store_name: "TIORAS",
    store_tagline: "Fashion Studio",
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
    localStorage.setItem('pos_theme', next);
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

      if (itemsRes.status === 'fulfilled' && itemsRes.value.success) setItems(itemsRes.value.data);
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
    const res = await api.getItems();
    if (res.success) setItems(res.data);
  };

  const refreshSuppliers = async () => {
    const res = await api.getSuppliers();
    if (res.success) setSuppliers(res.data);
  };

  const refreshGRN = async () => {
    const res = await api.getGRNRecords();
    if (res.success) setGrnRecords(res.data);
  };

  const refreshShift = async () => {
    const res = await api.getActiveShift();
    if (res.success) setActiveShift(res.data);
  };

  // Cart operations
  const addToCart = (product, quantity = 1) => {
    if (!product) return;

    // Strict Retail Rule: Without receiving stock, billing cannot be done
    const currentStock = Number(product.stock_qty) || 0;
    if (currentStock <= 0) {
      showToast(`Cannot bill "${product.name}" — stock has not been received yet (0 on hand). Please receive stock in Stock Receiving before billing.`, 'warning');
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        const newQty = next[idx].qty + quantity;
        if (newQty > currentStock) {
          showToast(`Cannot bill ${newQty} units of "${product.name}". Only ${currentStock} units received in stock.`, 'warning');
          return prev;
        }
        const disc = Number(next[idx].discount_percent) || 0;
        const unitPrice = next[idx].selling_price * (1 - disc / 100);
        next[idx] = {
          ...next[idx],
          qty: newQty,
          subtotal: Math.round(newQty * unitPrice * 100) / 100
        };
        return next;
      } else {
        if (quantity > currentStock) {
          showToast(`Cannot bill ${quantity} units of "${product.name}". Only ${currentStock} units received in stock.`, 'warning');
          return prev;
        }
        return [...prev, {
          id: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          category: product.category,
          size: product.size,
          color: product.color,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          mrp: product.mrp || product.selling_price,
          rack_name: product.rack_name || product.rack_location || "Rack A-01",
          gst_rate: product.gst_rate || 12,
          qty: quantity,
          discount_percent: 0,
          subtotal: quantity * product.selling_price
        }];
      }
    });

    showToast(`Added ${product.name} to cart`, 'success');
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;

          // Stock limit check — prevent billing more than what's in stock
          if (delta > 0) {
            const liveItem = items.find(i => i.id === id);
            const availableStock = Number(liveItem?.stock_qty ?? 9999);
            if (newQty > availableStock) {
              showToast(`Only ${availableStock} units of "${item.name}" in stock.`, 'warning');
              return item; // don't change
            }
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
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
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
  const discountedSubtotal = Math.max(0, subtotal - totalDiscountAmount);
  
  // Tax breakdown
  const totalTax = cart.reduce((acc, item) => {
    const ratio = subtotal > 0 ? (discountedSubtotal / subtotal) : 1;
    const itemSub = item.subtotal * ratio;
    const tax = itemSub * (item.gst_rate / (100 + item.gst_rate));
    return acc + tax;
  }, 0);
  
  const grandTotal = Math.round(discountedSubtotal);

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
        subtotal,
        discountAmount: cartDiscountAmount,
        couponDiscount,
        totalDiscountAmount,
        appliedCoupon,
        totalTax,
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
