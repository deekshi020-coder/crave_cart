import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartBubble } from './components/FloatingCartBubble';
import { DbStatusModal } from './components/DbStatusModal';
import { OffersModal } from './components/OffersModal';
import { AuthModal } from './components/AuthModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { HomeView } from './views/HomeView';
import { RestaurantView } from './views/RestaurantView';
import { OrdersView } from './views/OrdersView';
import { ProfileView } from './views/ProfileView';
import { AdminView } from './views/AdminView';
import { DeliveryView } from './views/DeliveryView';
import { DbStatus } from './types';
import { api } from './api';

function MainApp() {
  const { user } = useAuth();

  const [currentView, setCurrentView] = useState<'home' | 'restaurant' | 'orders' | 'profile' | 'admin' | 'delivery'>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  // Modals state
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<number | null>(null);

  // Database status
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  const fetchDbStatus = async () => {
    try {
      const status = await api.getDbStatus();
      setDbStatus(status);
    } catch {
      setDbStatus({
        connected: false,
        configured: false,
        error: 'Unable to reach backend database service.',
      });
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleSelectRestaurant = (id: number) => {
    setSelectedRestaurantId(id);
    setCurrentView('restaurant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (orderId: number) => {
    setTrackedOrderId(orderId);
    setCurrentView('orders');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans flex flex-col selection:bg-rose-100 selection:text-rose-900">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        dbStatus={dbStatus}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenOffersModal={() => setIsOffersModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <HomeView
            onSelectRestaurant={handleSelectRestaurant}
            onOpenOffersModal={() => setIsOffersModalOpen(true)}
          />
        )}

        {currentView === 'restaurant' && selectedRestaurantId && (
          <RestaurantView
            restaurantId={selectedRestaurantId}
            onBack={() => setCurrentView('home')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            onBrowseFood={() => setCurrentView('home')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}

        {currentView === 'admin' && (
          <AdminView
            onOpenDbModal={() => setIsDbModalOpen(true)}
          />
        )}

        {currentView === 'delivery' && <DeliveryView />}
      </main>

      {/* Floating Bottom Cart Bubble */}
      <FloatingCartBubble />

      {/* Cart Drawer */}
      <CartDrawer
        onOrderSuccess={handleOrderSuccess}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Modals */}
      <DbStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        dbStatus={dbStatus}
        onRefreshStatus={fetchDbStatus}
      />

      <OffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <OrderTrackingModal
        orderId={trackedOrderId}
        onClose={() => setTrackedOrderId(null)}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/80 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-900 tracking-tight">CraveCart</span>
            <span>·</span>
            <span>&ldquo;Good food. Great mood.&rdquo;</span>
            <span>·</span>
            <span>Chennai Gourmet Network</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOffersModalOpen(true)}
              className="text-stone-700 font-semibold hover:text-rose-600 transition-colors"
            >
              Special Offers &amp; Rewards
            </button>
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-stone-700 font-semibold hover:text-rose-600 transition-colors"
            >
              Discover Restaurants
            </button>
            <button
              onClick={() => {
                setCurrentView('orders');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-stone-700 font-semibold hover:text-rose-600 transition-colors"
            >
              My Orders
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className="text-rose-600 font-semibold hover:underline"
              >
                Admin Console
              </button>
            )}
            {user?.role === 'delivery_agent' && (
              <button
                onClick={() => setCurrentView('delivery')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Delivery Fleet
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
