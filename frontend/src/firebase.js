// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCbpmmtpVJR6YyFfBHeUdkLVi7X4T5dXdc",
  authDomain: "pavati-os.firebaseapp.com",
  projectId: "pavati-os",
  storageBucket: "pavati-os.firebasestorage.app",
  messagingSenderId: "169365245352",
  appId: "1:169365245352:web:6841a616a7d3af1eb6e19d",
  measurementId: "G-937R6ZJEC5"
};

// Initialize Firebase App (singleton safeguard)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics conditionally (safeguards against SSR, iframe or unsupported environments)
let analyticsInstance = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized for PAVATI OS');
    }
  }).catch((err) => {
    console.warn('Firebase Analytics not supported in this environment:', err);
  });
}

export const analytics = analyticsInstance;
export default app;
