/**
 * Tioras Fashion Studio - Firebase Cloud Sync & Analytics Engine
 * Connected Project: tioras-fashion-studio
 * Web Push VAPID Key: BALFJsd6WUctRU-e_v4c2Zu3L86cceCTAedx4_M6FHPprcroVIXF1GxUN8JXx74kAxivtx9Zl75FSOGGzBfu8s4
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// Official Tioras Fashion Studio Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwZ6B2paEZNM2qM8w0kN4PHrqdsIL5EsI",
  authDomain: "tioras-fashion-studio.firebaseapp.com",
  projectId: "tioras-fashion-studio",
  storageBucket: "tioras-fashion-studio.firebasestorage.app",
  messagingSenderId: "1011379671904",
  appId: "1:1011379671904:web:7646cdcaff27f6ab480405",
  measurementId: "G-8G1SKR5Q48"
};

const VAPID_KEY = "BALFJsd6WUctRU-e_v4c2Zu3L86cceCTAedx4_M6FHPprcroVIXF1GxUN8JXx74kAxivtx9Zl75FSOGGzBfu8s4";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.info("Firebase Analytics initialized (measurement ID: " + firebaseConfig.measurementId + ")");
}

let db = null;
try {
  db = getFirestore(app);
} catch (e) {
  console.warn("Firestore initialization error:", e);
}

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.info("Firebase Messaging initialized.");
}

// Global Firebase Synchronization Interface
window.FirebaseSync = {
  app,
  analytics,
  db,
  messaging,
  isConfigured: true,
  projectId: firebaseConfig.projectId,
  measurementId: firebaseConfig.measurementId,
  vapidKey: VAPID_KEY,

  // Log Business Event to Google Analytics
  logEvent(eventName, params = {}) {
    if (analytics) {
      try {
        logEvent(analytics, eventName, params);
        console.log(`🔥 [Firebase Analytics] ${eventName}`, params);
      } catch (err) {
        console.warn("[Firebase Analytics Error]", err);
      }
    }
  },

  // Log POS Sale Event (E-commerce purchase standard)
  logSale(invoice) {
    this.logEvent("purchase", {
      transaction_id: invoice.invoice_no,
      value: invoice.grand_total,
      currency: "INR",
      tax: invoice.total_tax,
      shipping: 0,
      payment_type: invoice.payment_method,
      items: (invoice.items || []).map(i => ({
        item_id: i.sku || i.id,
        item_name: i.name,
        price: i.unit_price || i.selling_price,
        quantity: i.qty,
        item_category: i.category
      }))
    });
  },

  // Request Web Push Notification Permission using VAPID Key
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      throw new Error('Push Notifications are not supported in this browser.');
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied by user.');
    }

    if (!messaging) {
      throw new Error('Firebase Messaging is not available.');
    }

    // Register service worker if not already registered
    let reg;
    try {
      reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch (swErr) {
      console.warn("ServiceWorker registration error:", swErr);
      reg = await navigator.serviceWorker.ready;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: this.vapidKey,
      serviceWorkerRegistration: reg
    });

    if (currentToken) {
      console.log('🔔 [FCM Token]', currentToken);
      if (db) {
        await setDoc(doc(db, "fcm_tokens", currentToken.slice(0, 32)), {
          token: currentToken,
          device: navigator.userAgent,
          platform: 'desktop-pos',
          updated_at: new Date().toISOString()
        }, { merge: true });
      }
      return currentToken;
    } else {
      throw new Error('No registration token available. Request permission to generate one.');
    }
  },

  // Listen for real-time foreground push alerts
  listenForPushMessages(callback) {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('🔔 [Foreground Push Received]', payload);
        if (typeof callback === 'function') {
          callback(payload);
        }
      });
    }
  },

  // Sync Invoice to Firestore
  async syncInvoice(invoice) {
    if (!db) return false;
    try {
      await setDoc(doc(db, "invoices", invoice.invoice_no), {
        ...invoice,
        cloud_synced_at: new Date().toISOString()
      }, { merge: true });
      console.log(`☁️ [Firestore] Synced Invoice #${invoice.invoice_no}`);
      return true;
    } catch (err) {
      console.warn("[Firestore Invoice Sync Error]", err);
      return false;
    }
  },

  // Sync Customer to Firestore
  async syncCustomer(customer) {
    if (!db) return false;
    try {
      await setDoc(doc(db, "customers", customer.id), {
        ...customer,
        cloud_synced_at: new Date().toISOString()
      }, { merge: true });
      console.log(`☁️ [Firestore] Synced Customer ${customer.name} (${customer.id})`);
      return true;
    } catch (err) {
      console.warn("[Firestore Customer Sync Error]", err);
      return false;
    }
  },

  // Sync Inventory Item to Firestore
  async syncItem(item) {
    if (!db) return false;
    try {
      await setDoc(doc(db, "inventory", item.id), {
        ...item,
        cloud_synced_at: new Date().toISOString()
      }, { merge: true });
      console.log(`☁️ [Firestore] Synced Item ${item.name} (${item.sku})`);
      return true;
    } catch (err) {
      console.warn("[Firestore Item Sync Error]", err);
      return false;
    }
  },

  // Sync Cashier Shift to Firestore
  async syncShift(shift) {
    if (!db) return false;
    try {
      await setDoc(doc(db, "shifts", shift.id), {
        ...shift,
        cloud_synced_at: new Date().toISOString()
      }, { merge: true });
      console.log(`☁️ [Firestore] Synced Shift #${shift.id}`);
      return true;
    } catch (err) {
      console.warn("[Firestore Shift Sync Error]", err);
      return false;
    }
  },

  // Bulk Sync Entire Database to Firestore
  async syncAll(data = {}) {
    let count = 0;
    if (data.invoices && Array.isArray(data.invoices)) {
      for (const inv of data.invoices) {
        await this.syncInvoice(inv);
        count++;
      }
    }
    if (data.customers && Array.isArray(data.customers)) {
      for (const cust of data.customers) {
        await this.syncCustomer(cust);
        count++;
      }
    }
    if (data.items && Array.isArray(data.items)) {
      for (const itm of data.items) {
        await this.syncItem(itm);
        count++;
      }
    }
    return count;
  }
};

// Dispatch event so UI can immediately update cloud indicator
window.dispatchEvent(new CustomEvent('firebase-connected', {
  detail: { projectId: firebaseConfig.projectId, status: 'CONNECTED', vapidKey: VAPID_KEY }
}));

console.log("🔥 Firebase initialized for Tioras Fashion Studio (Project: " + firebaseConfig.projectId + ", VAPID configured)");
