import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminDashboard } from './AdminDashboard';
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
import { ComingSoonView } from './ComingSoonView';
import { IptvM3uManager } from './IptvM3uManager';
import { WooCommerceBridge } from './WooCommerceBridge';
import { SubscriptionsManager } from './SubscriptionsManager';
import {
  LayoutDashboard,
  Globe,
  BarChart3,
  Package,
  Key,
  ShoppingCart,
  CreditCard,
  Tag,
  Users,
  Ticket,
  Tv,
  Link2,
  Bot,
  Music2,
  Send,
  Wallet,
  Lock,
  Store,
  ShieldAlert,
  FileCheck2,
  Menu,
  X,
  Headphones,
  MessageCircle,
  Palette,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Admin layout matching the screenshot the user shared:
 *  - Fixed left sidebar (260px) with grouped navigation
 *  - Top header bar with hamburger + ALL CATEGORIES dropdown + breadcrumb + Storefront link + Admin Panel pill + Live Support link
 *  - Main content area with admin-card based dashboard
 *  - Purple gradient Live Support FAB on the bottom-left
 *
 * Theme matches the screenshot exactly:
 *  - Sidebar bg: #0a0b0d (deep black)
 *  - Card bg: #151a23 (slightly lighter)
 *  - Gold accents: #f59e0b (prices, active state border)
 *  - Blue charts: #3b82f6
 *  - Purple FAB: #8b5cf6 → #6366f1 gradient
 */

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'website-builder', label: 'Website Builder CMS', icon: Globe },
      { id: 'analytics', label: 'Analytics & Traffic', icon: BarChart3 },
    ],
  },
  {
    title: 'Commerce & Inventory',
    items: [
      { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingCart },
      { id: 'products', label: 'Catalog Products', icon: Package },
      { id: 'license-vault', label: 'Digital License Vault', icon: Key },
      { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
      { id: 'discounts', label: 'Discounts & Coupons', icon: Tag },
    ],
  },
  {
    title: 'Customers & Support',
    items: [
      { id: 'customers', label: 'Customer Accounts', icon: Users },
      { id: 'support-tickets', label: 'Support Tickets', icon: Ticket },
    ],
  },
  {
    title: 'IPTV & Services',
    items: [
      { id: 'iptv', label: 'IPTV M3U Servers', icon: Tv },
    ],
  },
  {
    title: 'Marketing & Integrations',
    items: [
      { id: 'woocommerce', label: 'WooCommerce Bridge', icon: Link2 },
      { id: 'social-automation', label: 'Social Automation', icon: Bot },
      { id: 'tiktok-leads', label: 'TikTok Leads Engine', icon: Music2 },
      { id: 'email-sms', label: 'Email & SMS Campaigns', icon: Send },
    ],
  },
  {
    title: 'Payments & Security',
    items: [
      { id: 'financial-balance', label: 'Financial Balance', icon: Wallet },
      { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
      { id: 'jazzcash', label: 'JazzCash & Merchant', icon: Store },
      { id: 'payment-proofs', label: 'Payment Proofs', icon: FileCheck2 },
      { id: 'security', label: 'Security & Audit Logs', icon: ShieldAlert },
    ],
  },
];

// Helper to find the active nav item's label (for the breadcrumb)
const findActiveLabel = (id: string): string => {
  for (const sec of NAVIGATION_SECTIONS) {
    const found = sec.items.find((i) => i.id === id);
    if (found) return found.label;
  }
  return 'Dashboard';
};

// Map of menu IDs that have functional implementations to their components
// Everything else falls back to ComingSoonView with a description.
const COMING_SOON_META: Record<string, { description: string; features: string[] }> = {
  'website-builder': {
    description:
      'A drag-and-drop builder for assembling storefront pages, landing pages, and promotional banners without touching code.',
    features: [
      'Block-based visual editor for hero, grid, FAQ and footer sections',
      'Live preview across desktop / tablet / mobile breakpoints',
      'Reusable content snippets synced across pages',
      'Per-page SEO meta, canonical URL and Open Graph fields',
      'Scheduled publish with rollback to previous version',
    ],
  },
  analytics: {
    description:
      'Consolidated analytics surface pulling sessions, conversion rate, traffic sources, and product-level performance into one view.',
    features: [
      'Real-time visitor map with source attribution',
      'Funnel breakdown from landing → cart → checkout → paid',
      'Product-level revenue and units-sold leaderboard',
      'Cohort retention by week and month',
      'Exportable CSV / JSON snapshots for BI tools',
    ],
  },
  discounts: {
    description:
      'Build and track promo codes, auto-apply coupons, BOGO offers, and tiered discounts with usage limits and expiry windows.',
    features: [
      'Code generator with prefix, suffix, and length controls',
      'Percentage / fixed / free-shipping discount types',
      'Customer-segment targeting (new, returning, VIP)',
      'Usage caps per code and per customer',
      'Real-time redemption analytics with revenue impact',
    ],
  },
  customers: {
    description:
      'Searchable directory of every customer account with order history, lifetime value, wishlist, and support tickets in one view.',
    features: [
      'Filterable customer table with LTV and last-active columns',
      'Per-customer timeline of orders, refunds, and tickets',
      'Account status controls (active, suspended, pending verification)',
      'Wishlist and recently-viewed product inspector',
      'Manual credit / debit ledger adjustments',
    ],
  },
  'support-tickets': {
    description:
      'Inbox-style ticket queue with priority, SLA timers, assignment, and canned responses for common customer requests.',
    features: [
      'Unified inbox across email, WhatsApp, and in-app chat',
      'SLA countdown timers with breach alerts',
      'Canned response library with merge variables',
      'Internal notes and @mentions between agents',
      'Customer-side satisfaction rating after resolution',
    ],
  },
  'social-automation': {
    description:
      'Schedule and automate posts across TikTok, Instagram, X, and Facebook from one calendar with reusable templates.',
    features: [
      'Cross-platform scheduler with timezone-aware delivery',
      'Template library with brand kits (logo, fonts, palettes)',
      'Auto-hashtag suggestions based on trending topics',
      'Engagement analytics rolled up per post',
      'Approval workflow for marketing manager sign-off',
    ],
  },
  'tiktok-leads': {
    description:
      'Capture leads from TikTok ads, attribute them to campaigns, and pipe them into the customer CRM automatically.',
    features: [
      'Lead-form webhook receiver with field mapping',
      'Campaign attribution with cost-per-lead tracking',
      'Auto-tagging by ad group, creative, and audience',
      'Instant WhatsApp / SMS follow-up to new leads',
      'Conversion funnel report exported to TikTok Ads Manager',
    ],
  },
  'email-sms': {
    description:
      'Build transactional and marketing messages, segment audiences, and trigger sends based on customer behavior.',
    features: [
      'Visual email builder with MJML export',
      'SMS composer with character counter and Unicode support',
      'Audience segments based on orders, wishlist, and tags',
      'Trigger library (abandoned cart, post-purchase, win-back)',
      'Deliverability dashboard with bounce and complaint rates',
    ],
  },
  'financial-balance': {
    description:
      'Real-time balance sheet across all payment gateways, settlement timelines, and reconciliation status against orders.',
    features: [
      'Unified balance across Stripe, PayPal, JazzCash, Easypaisa, crypto',
      'Settlement timeline with pending vs available breakdown',
      'Auto-reconciliation against order ledger',
      'Payout schedule with next-settlement countdown',
      'Refund and chargeback ledger with reason codes',
    ],
  },
  jazzcash: {
    description:
      'Dedicated console for JazzCash merchant configuration, settlement reports, and transaction-level audit.',
    features: [
      'Merchant ID / API key vault (never exposed to client)',
      'Settlement report importer with CSV upload',
      'Transaction search by reference, amount, or customer',
      'Refund initiator with reason capture',
      'Webhook signature verifier for inbound events',
    ],
  },
  'payment-proofs': {
    description:
      'Centralized archive of payment proof documents — screenshots, bank transfer slips, and JazzCash/Easypaisa confirmations.',
    features: [
      'Drag-and-drop upload with auto-link to order',
      'OCR-based amount and reference extraction',
      'Manual verification workflow with approve / reject',
      'Audit trail per proof with reviewer and timestamp',
      'Encrypted at-rest storage with role-based access',
    ],
  },
  security: {
    description:
      'Audit log explorer, role-based access control matrix, and security posture monitor for the entire admin surface.',
    features: [
      'Immutable audit log of every admin action',
      'Role-based access matrix per resource and action',
      'Failed-login monitor with IP and geo attribution',
      'Secrets vault status (rotation overdue, last rotated)',
      'Exportable compliance report for SOC 2 / PCI DSS',
    ],
  },
};

export const AdminLayout: React.FC = () => {
  const { setActiveView, currentUser, setIsAuthModalOpen, adminTab, setAdminTab, setIsWhatsAppModalOpen } = useStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const handleTabSelect = (id: string) => {
    setAdminTab(id);
    setIsMobileSidebarOpen(false);
    setIsCategoryMenuOpen(false);
  };

  const activeLabel = findActiveLabel(adminTab);

  // Render the active view. Functional pages render their real component;
  // everything else renders ComingSoonView with descriptive metadata.
  const renderActiveView = () => {
    switch (adminTab) {
      // Overview
      case 'dashboard':
        return <AdminDashboard />;
      case 'nav-manager':
        return <NavigationManager />;
      case 'system-status':
        return <SystemStatusView />;

      // Commerce & Inventory
      case 'products':
        return <ProductManagement />;
      case 'smart-projectors':
        return <SmartProjectorsManager />;
      case 'license-vault':
        return <LicenseVaultManager />;
      case 'orders':
        return <OrderManagement />;
      case 'payments':
        return <FinancialPaymentManager />;
      case 'dedup':
        return <DuplicateVariationInspector />;

      // Marketing & Integrations (existing)
      case 'marketing':
        return <MarketingAutomationView />;
      case 'g2g':
        return <G2GConnectorView />;

      // IPTV M3U Servers — NEW
      case 'iptv':
        return <IptvM3uManager />;

      // WooCommerce Bridge — NEW
      case 'woocommerce':
        return <WooCommerceBridge />;

      // Subscriptions — NEW
      case 'subscriptions':
        return <SubscriptionsManager />;

      // Growth & Security (existing)
      case 'roles':
        return <AdminRolesView />;
      case 'content':
        return <ContentManager />;

      // Coming-soon items (placeholder views)
      default: {
        const meta = COMING_SOON_META[adminTab];
        if (!meta) {
          return (
            <ComingSoonView
              title={activeLabel}
              description="This section is being prepared and will be available soon."
            />
          );
        }
        const navItem = NAVIGATION_SECTIONS.flatMap((s) => s.items).find((i) => i.id === adminTab);
        return (
          <ComingSoonView
            title={activeLabel}
            description={meta.description}
            icon={navItem?.icon}
            features={meta.features}
          />
        );
      }
    }
  };

  // Sidebar content — shared between desktop sidebar and mobile drawer
  const sidebarContent = (
    <>
      {/* Brand strip at top of sidebar */}
      <div className="px-5 py-4 border-b border-[#1f2937] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold text-sm shrink-0">
          P
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white font-display truncate">PlayBeat Digital</div>
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Admin Console</div>
        </div>
      </div>

      {/* Navigation groups — scrollable */}
      <nav className="flex-1 overflow-y-auto admin-sidebar-scroll py-3">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="admin-section-header">{section.title}</div>
            <div className="px-2.5 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`admin-nav-item ${isActive ? 'is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-gray-500'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar footer — Themes & Sections toggle */}
      <div className="border-t border-[#1f2937] p-3 space-y-1">
        <button
          onClick={() => handleTabSelect('content')}
          className={`admin-nav-item ${adminTab === 'content' ? 'is-active' : ''}`}
        >
          <Palette className={`w-4 h-4 shrink-0 ${adminTab === 'content' ? 'text-amber-400' : 'text-gray-500'}`} />
          <span className="flex-1 text-left truncate">Themes & Sections</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </button>
        <button
          onClick={() => handleTabSelect('nav-manager')}
          className={`admin-nav-item ${adminTab === 'nav-manager' ? 'is-active' : ''}`}
        >
          <LayoutDashboard className={`w-4 h-4 shrink-0 ${adminTab === 'nav-manager' ? 'text-amber-400' : 'text-gray-500'}`} />
          <span className="flex-1 text-left truncate">Navigation Customizer</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0b0d10] text-gray-200 flex">
      {/* ===========================================================
          DESKTOP SIDEBAR (260px, fixed)
          =========================================================== */}
      <aside className="hidden md:flex flex-col w-[260px] admin-sidebar fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* ===========================================================
          MOBILE SIDEBAR (drawer, slide-over)
          =========================================================== */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden flex flex-col w-[260px] admin-sidebar fixed inset-y-0 left-0 z-50"
            >
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white z-10"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===========================================================
          MAIN COLUMN (offset by sidebar width on desktop)
          =========================================================== */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-w-0">
        {/* ---- TOP HEADER BAR ---- */}
        <header className="sticky top-0 z-20 bg-[#0f1115]/95 backdrop-blur-md border-b border-[#1f2937] px-4 sm:px-6 h-[60px] flex items-center justify-between gap-3">
          {/* Left side: hamburger + ALL CATEGORIES dropdown + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* ALL CATEGORIES dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCategoryMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>All Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsCategoryMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 mt-2 w-64 admin-card !rounded-lg p-2 z-40 max-h-[400px] overflow-y-auto admin-sidebar-scroll"
                    >
                      {NAVIGATION_SECTIONS.map((sec) => (
                        <div key={sec.title} className="mb-2">
                          <div className="admin-section-header !px-2 !py-1">{sec.title}</div>
                          {sec.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = adminTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleTabSelect(item.id)}
                                className={`admin-nav-item !py-1.5 !text-[12px] ${isActive ? 'is-active' : ''}`}
                              >
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-gray-500'}`} />
                                <span className="flex-1 truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Breadcrumb / Title */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-600">/</span>
              <span className="text-white font-semibold truncate">{activeLabel}</span>
            </div>
          </div>

          {/* Right side: Storefront + Admin Panel pill + Live Support */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setActiveView('store')}
              className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:inline-flex"
            >
              Storefront
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="admin-gold-pill"
              aria-label={`Signed in as ${currentUser.role}`}
            >
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">Admin Panel</span>
            </button>

            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Live Support</span>
            </button>
          </div>
        </header>

        {/* ---- MAIN CONTENT ---- */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* ===========================================================
          LIVE SUPPORT FAB (purple gradient, bottom-left)
          =========================================================== */}
      <button
        onClick={() => setIsWhatsAppModalOpen(true)}
        className="admin-fab"
        aria-label="Open live support chat"
        title="Live Support"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  );
};
