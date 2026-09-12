import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AmbientBackdrop from './components/AmbientBackdrop';
import ErrorBoundary from './components/ErrorBoundary';

import ProductModal from './components/Modals/ProductModal';
import PriceEditModal from './components/Modals/PriceEditModal';
import SupplierModal from './components/Modals/SupplierModal';
import ReceivingModal from './components/Modals/ReceivingModal';
import PaymentModal from './components/Modals/PaymentModal';
import ReceiptModal from './components/Modals/ReceiptModal';
import ShiftModal from './components/Modals/ShiftModal';
import CalculatorModal from './components/Modals/CalculatorModal';
import HoldsModal from './components/Modals/HoldsModal';
import QuickCustomerModal from './components/Modals/QuickCustomerModal';
import ThermalPrintModal from './components/Modals/ThermalPrintModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import InventoryPage from './pages/InventoryPage';
import ReceivingPage from './pages/ReceivingPage';
import ListingPage from './pages/ListingPage';
import ProductListPage from './pages/ProductListPage';
import BarcodePage from './pages/BarcodePage';
import SuppliersPage from './pages/SuppliersPage';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ReturnsPage from './pages/ReturnsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import CouponsPage from './pages/CouponsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ExpensesPage from './pages/ExpensesPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

function AppLayout() {
  const { currentPage, setCurrentPage, modalState, toasts, sidebarOpen, closeSidebar, toggleSidebar } = useApp();

  const isPublicPage = currentPage === 'landing' || currentPage === 'login';

  // Keyboard shortcut listener (F1 to F10, Ctrl+B for Sidebar toggle)
  useEffect(() => {
    if (isPublicPage) return; // Don't trigger POS shortcuts while on landing/login pages

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      if (e.key === 'F1') { e.preventDefault(); setCurrentPage('dashboard'); }
      if (e.key === 'F2') { e.preventDefault(); setCurrentPage('pos'); }
      if (e.key === 'F3') { e.preventDefault(); setCurrentPage('inventory'); }
      if (e.key === 'F4') { e.preventDefault(); setCurrentPage('receiving'); }
      if (e.key === 'F5') { e.preventDefault(); setCurrentPage('barcode'); }
      if (e.key === 'F6') { e.preventDefault(); setCurrentPage('suppliers'); }
      if (e.key === 'F7') { e.preventDefault(); setCurrentPage('invoices'); }
      if (e.key === 'F8') { e.preventDefault(); setCurrentPage('customers'); }
      if (e.key === 'F9') { e.preventDefault(); setCurrentPage('reports'); }
      if (e.key === 'F10') { e.preventDefault(); setCurrentPage('settings'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentPage, toggleSidebar, isPublicPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'pos': return <PosPage />;
      case 'inventory': return <InventoryPage />;
      case 'products': return <ProductListPage />;
      case 'receiving': return <ReceivingPage />;
      case 'listing': return <ListingPage />;
      case 'barcode': return <BarcodePage />;
      case 'suppliers': return <SuppliersPage />;
      case 'invoices': return <InvoicesPage />;
      case 'customers': return <CustomersPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'returns': return <ReturnsPage />;
      case 'purchase-orders': return <PurchaseOrdersPage />;
      case 'coupons': return <CouponsPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'expenses': return <ExpensesPage />;
      case 'landing': return <LandingPage />;
      case 'login': return <LoginPage />;
      default: return <DashboardPage />;
    }
  };

  const toastContainer = (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map(toast => (
        <div 
          key={toast.id}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: '700',
            color: '#ffffff',
            boxShadow: 'var(--shadow-md)',
            background: toast.type === 'success' ? 'var(--accent-emerald)' : 
                        toast.type === 'danger' ? 'var(--accent-red)' : 
                        toast.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-blue)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );

  // If viewing public landing or login page, render full-screen without cashier app-shell
  if (isPublicPage) {
    return (
      <div className="public-viewport-container" style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <AmbientBackdrop />
        {currentPage === 'landing' ? <LandingPage /> : <LoginPage />}
        {toastContainer}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Hardware-Accelerated Ambient Aurora Backdrop */}
      <AmbientBackdrop />

      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar} 
        aria-hidden="true" 
      />

      {/* Strategic Sidebar Navigation */}
      <Sidebar />

      {/* Main App Content Viewport */}
      <div className="app-content-area">
        <Header />
        <main className="page-viewport">
          {renderPage()}
        </main>
      </div>

      {/* Dynamic Modals */}
      {modalState.type === 'product' && <ProductModal />}
      {modalState.type === 'priceEdit' && <PriceEditModal />}
      {modalState.type === 'supplier' && <SupplierModal />}
      {modalState.type === 'receiving' && <ReceivingModal />}
      {modalState.type === 'payment' && <PaymentModal />}
      {modalState.type === 'receipt' && <ReceiptModal />}
      {modalState.type === 'shift' && <ShiftModal />}
      {modalState.type === 'calculator' && <CalculatorModal />}
      {modalState.type === 'holds' && <HoldsModal />}
      {modalState.type === 'quickCustomer' && <QuickCustomerModal />}
      {modalState.type === 'thermalPrint' && <ThermalPrintModal />}

      {/* Toast Alerts System */}
      {toastContainer}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
