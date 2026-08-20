import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { NotificationToast } from './components/common/NotificationToast';
import { CartDrawer } from './components/common/CartDrawer';
import { WishlistDrawer } from './components/common/WishlistDrawer';
import { AuthModal } from './components/common/AuthModal';
import { WhatsAppModal } from './components/common/WhatsAppModal';
import { HeroSection } from './components/storefront/HeroSection';
import { CategoryGrid } from './components/storefront/CategoryGrid';
import { TrendingSection } from './components/storefront/TrendingSection';
import { SmartProjectorShowcase } from './components/storefront/SmartProjectorShowcase';
import { FlashDealsSection } from './components/storefront/FlashDealsSection';
import { FAQSection } from './components/storefront/FAQSection';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CheckoutModal } from './components/storefront/CheckoutModal';
import { CustomerPortalModal } from './components/storefront/CustomerPortalModal';
import { ProjectorComparisonModal } from './components/storefront/ProjectorComparisonModal';
import { AdminLayout } from './components/admin/AdminLayout';

const AppContent: React.FC = () => {
  const { activeView } = useStore();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-200 selection:bg-red-600 selection:text-white font-sans antialiased">
      {/* Dynamic Global Toast Notifications */}
      <NotificationToast />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <WishlistDrawer />
      <AuthModal />
      <WhatsAppModal />
      <ProductDetailModal />
      <CheckoutModal />
      <CustomerPortalModal />
      <ProjectorComparisonModal />

      {activeView === 'admin' ? (
        /* ADMIN DASHBOARD VIEW */
        <AdminLayout />
      ) : (
        /* STOREFRONT VIEW */
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <HeroSection />
            <CategoryGrid />
            <TrendingSection />
            <SmartProjectorShowcase />
            <FlashDealsSection />
            <FAQSection />
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
