import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Lazy load pages
const Login = lazy(() => import('./pages/Auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const ProductList = lazy(() => import('./pages/Products/ProductList'));
const CustomerList = lazy(() => import('./pages/Customers/CustomerList'));
const CustomerDetail = lazy(() => import('./pages/Customers/CustomerDetail'));
const SalesList = lazy(() => import('./pages/Sales/SalesList'));
const CreateBill = lazy(() => import('./pages/Sales/CreateBill'));
const InventoryList = lazy(() => import('./pages/Inventory/InventoryList'));
const PurchaseOrders = lazy(() => import('./pages/Inventory/PurchaseOrders'));
const Shop = lazy(() => import('./pages/Shop/Shop'));
const Checkout = lazy(() => import('./pages/Shop/Checkout'));
const OnlineOrdersList = lazy(() => import('./pages/Sales/OnlineOrdersList'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Communication = lazy(() => import('./pages/Communication/Communication'));
const InvoiceView = lazy(() => import('./pages/Sales/InvoiceView'));
const PublicInvoice = lazy(() => import('./pages/Sales/PublicInvoice'));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
  },
});

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  );
}

// Public Layout for E-Commerce (no sidebar, no auth)
function PublicLayout() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('publicCart') || '[]');
      setCartCount(cart.reduce((a, b) => a + b.quantity, 0));
    };
    updateCount();
    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/shop" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-surface-900 to-surface-700 tracking-tight">
              OpticalStore
            </span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">Admin Login</a>
            <a href="/shop/checkout" className="relative p-2 bg-surface-100 rounded-full hover:bg-surface-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-700"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </a>
          </div>
        </div>
      </header>
      <main>
        <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
      </main>
    </div>
  );
}

// Protected admin layout with sidebar
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: `${sidebarWidth}px`,
          right: 0,
          bottom: 0,
          transition: 'left 0.3s',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface-50)',
        }}
      >
        <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 p-6 pr-10 lg:p-8 lg:pr-10 overflow-y-auto overflow-x-hidden">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </>
  );
}

// Auth guards
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Storefront */}
          <Route element={<PublicLayout />}>
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/checkout" element={<Checkout />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<GuestRoute><Suspense fallback={<PageLoader />}><Login /></Suspense></GuestRoute>} />

          {/* Public Invoice (no layout, no auth) */}
          <Route path="/bill/:id" element={<Suspense fallback={<PageLoader />}><PublicInvoice /></Suspense>} />

          {/* Protected Admin */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/sales" element={<SalesList />} />
            <Route path="/invoice/:id" element={<InvoiceView />} />
            <Route path="/create-bill" element={<CreateBill />} />
            <Route path="/online-orders" element={<OnlineOrdersList />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
