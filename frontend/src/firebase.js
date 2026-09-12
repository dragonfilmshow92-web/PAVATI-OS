// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged 
} from "firebase/auth";

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Friendly Auth Error Translator
export function getFriendlyAuthErrorMessage(errorCode, defaultMsg) {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your details.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Try again later or reset password.';
    default:
      return defaultMsg || 'Authentication failed. Please try again.';
  }
}

// Auth Actions
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: error.code, 
      message: getFriendlyAuthErrorMessage(error.code, error.message) 
    };
  }
}

export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: error.code, 
      message: getFriendlyAuthErrorMessage(error.code, error.message) 
    };
  }
}

export async function registerWithEmail(email, password, displayName = '') {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim()) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: error.code, 
      message: getFriendlyAuthErrorMessage(error.code, error.message) 
    };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: 'Password reset link sent to your email.' };
  } catch (error) {
    return { 
      success: false, 
      error: error.code, 
      message: getFriendlyAuthErrorMessage(error.code, error.message) 
    };
  }
}

// Initialize Analytics conditionally
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
