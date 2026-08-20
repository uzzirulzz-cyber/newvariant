import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DashboardOverview } from './DashboardOverview';
import { NavigationManager } from './NavigationManager';
import { ProductManagement } from './ProductManagement';
import { SmartProjectorsManager } from './SmartProjectorsManager';
import { LicenseVaultManager } from './LicenseVaultManager';
import { OrderManagement } from './OrderManagement';
import { FinancialPaymentManager } from './FinancialPaymentManager';
import { MarketingAutomationView } from './MarketingAutomationView';
import { G2GConnectorView } from './G2GConnectorView';
import { DuplicateVariationInspector } from './DuplicateVariationInspector';
import { SystemStatusView } from './SystemStatusView';
import { AdminRolesView } from './AdminRolesView';
import { ContentManager } from './ContentManager';
import {
  LayoutDashboard,
  Compass,
  Package,
  Projector,
  Key,
  ShoppingCart,
  CreditCard,
  Megaphone,
  Server,
  ShieldCheck,
  Activity,
  UserCheck,
  FileText,
  ArrowLeft,
  Sparkles,
  Zap,
  Lock,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminLayout: React.FC = () => {
  const { setActiveView, currentUser, setIsAuthModalOpen, adminTab, setAdminTab } = useStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigationSections = [
    {
      title: 'Command Center',
      items: [
        { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard, badge: 'Live' },
        { id: 'nav-manager', label: 'Navigation & Offers Bar', icon: Compass, badge: 'Customizer' },
        { id: 'system-status', label: 'System Health & Uptime', icon: Activity, badge: '99.9%' }
      ]
    },
    {
      title: 'Catalog & Hardware',
      items: [
        { id: 'products', label: 'All Products & Variants', icon: Package },
        { id: 'smart-projectors', label: '4K Smart Projectors', icon: Projector, badge: 'Hardware' },
        { id: 'license-vault', label: 'License & Key Vault', icon: Key, badge: 'Encrypted' },
        { id: 'dedup', label: 'Variant Deduplication', icon: ShieldCheck }
      ]
    },
    {
      title: 'Operations & Sourcing',
      items: [
        { id: 'orders', label: 'Orders & Tracking', icon: ShoppingCart },
        { id: 'payments', label: 'Payment Gateways & Ledger', icon: CreditCard, badge: 'Multi-GW' },
        { id: 'g2g', label: 'G2G Wholesale Bridge', icon: Server, badge: 'Auto-Sync' }
      ]
    },
    {
      title: 'Growth & Security',
      items: [
        { id: 'marketing', label: 'TikTok Leads & Coupons', icon: Megaphone, badge: 'Viral' },
        { id: 'roles', label: 'Admin Roles & RBAC 2FA', icon: UserCheck },
        { id: 'content', label: 'Banners & Copy Editor', icon: FileText }
      ]
    }
  ];

  const handleTabSelect = (id: string) => {
    setAdminTab(id);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#08152F] text-slate-200 flex flex-col">
      {/* 1. ADMIN TOPBAR */}
      <header className="sticky top-0 z-40 w-full bg-[#070B14]/95 backdrop-blur-xl border-b border-[#26334A] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('store')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl btn-secondary text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00D99A] animate-pulse" />
              <span className="text-white font-bold">PlayBeat Digital Admin Console</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">TLS 1.3 Ingress</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10182A] hover:bg-[#121C30] border border-[#26334A] text-xs font-mono text-slate-300 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#1769FF]" />
              <span>Role: <strong className="text-white">{currentUser.role.replace('_', ' ').toUpperCase()}</strong></span>
            </button>

            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden p-2 rounded-xl btn-secondary text-slate-300"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE WITH HORIZONTAL / SIDEBAR NAVIGATION */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Horizontal Navigation Categories Strip (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-[#26334A]/80">
          {navigationSections.flatMap(sec => sec.items).map((item) => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1769FF] text-white shadow-[0_0_15px_rgba(23,105,255,0.4)]'
                    : 'bg-[#10182A] hover:bg-[#121C30] text-slate-400 hover:text-white border border-[#26334A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-[#FFC928]/20 text-[#FFC928]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden rounded-2xl bg-[#10182A] border border-[#26334A] p-4 space-y-4 shadow-2xl"
            >
              {navigationSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono mb-1">
                    {sec.title}
                  </div>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = adminTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#1769FF] text-white'
                            : 'text-slate-300 hover:bg-[#121C30]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-white/20 text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab View Render */}
        <main className="pb-12">
          {adminTab === 'overview' && <DashboardOverview />}
          {adminTab === 'nav-manager' && <NavigationManager />}
          {adminTab === 'products' && <ProductManagement />}
          {adminTab === 'smart-projectors' && <SmartProjectorsManager />}
          {adminTab === 'license-vault' && <LicenseVaultManager />}
          {adminTab === 'orders' && <OrderManagement />}
          {adminTab === 'payments' && <FinancialPaymentManager />}
          {adminTab === 'marketing' && <MarketingAutomationView />}
          {adminTab === 'g2g' && <G2GConnectorView />}
          {adminTab === 'dedup' && <DuplicateVariationInspector />}
          {adminTab === 'system-status' && <SystemStatusView />}
          {adminTab === 'roles' && <AdminRolesView />}
          {adminTab === 'content' && <ContentManager />}
        </main>
      </div>
    </div>
  );
};
