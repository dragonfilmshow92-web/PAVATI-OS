importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Tioras Fashion Studio Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAwZ6B2paEZNM2qM8w0kN4PHrqdsIL5EsI",
  authDomain: "tioras-fashion-studio.firebaseapp.com",
  projectId: "tioras-fashion-studio",
  storageBucket: "tioras-fashion-studio.firebasestorage.app",
  messagingSenderId: "1011379671904",
  appId: "1:1011379671904:web:7646cdcaff27f6ab480405",
  measurementId: "G-8G1SKR5Q48"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle Background Cloud Messaging Notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Push Received:', payload);
  const notificationTitle = payload.notification?.title || 'Tioras Supermarket OS Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New store notification received.',
    icon: '/app-icon.png',
    badge: '/app-icon.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
