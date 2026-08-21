import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import {
  X,
  User,
  Key,
  Truck,
  Copy,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Download,
  ExternalLink,
  MessageCircle,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CustomerPortalModal: React.FC = () => {
  const {
    isCustomerPortalOpen,
    setIsCustomerPortalOpen,
    currentUser,
    orders,
    formatPrice,
    addToast,
    setIsWhatsAppModalOpen
  } = useStore();

  const [activeTab, setActiveTab] = useState<'keys' | 'orders' | 'tracking' | 'profile'>('keys');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const customerOrders = orders.filter(o => o.userId === currentUser.id || o.customerEmail === currentUser.email);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    addToast('success', 'Key Copied', 'Digital license key copied to clipboard.');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Collect all digital license keys from customer's orders
  const allDigitalKeys = customerOrders.flatMap(o =>
    o.items.filter(item => item.licenseKeys && item.licenseKeys.length > 0).flatMap(item =>
      item.licenseKeys!.map(k => ({
        key: k,
        productTitle: item.productTitle,
        orderId: o.id,
        date: o.createdAt,
        variation: item.variation?.value
      }))
    )
  );

  // Collect all physical orders
  const allPhysicalShipments = customerOrders.flatMap(o =>
    o.items.filter(item => item.productType === 'physical_projector').map(item => ({
      productTitle: item.productTitle,
      orderId: o.id,
      date: o.createdAt,
      trackingNumber: item.trackingNumber || 'DHL-8492049182',
      status: o.orderStatus,
      address: o.shippingAddress
    }))
  );

  return (
    <AnimatePresence>
      {isCustomerPortalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCustomerPortalOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-5xl rounded-3xl bg-[#0F111A] border border-white/15 shadow-2xl p-6 sm:p-8 z-10 my-6 max-h-[92vh] overflow-y-auto"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                    <span>{currentUser.name}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] font-mono">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setIsCustomerPortalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 py-3 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('keys')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  activeTab === 'keys' ? 'bg-red-600 text-white shadow-md shadow-red-950/40' : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Digital Key Locker ({allDigitalKeys.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  activeTab === 'orders' ? 'bg-red-600 text-white shadow-md shadow-red-950/40' : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>All Orders ({customerOrders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('tracking')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  activeTab === 'tracking' ? 'bg-red-600 text-white shadow-md shadow-red-950/40' : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Hardware Shipments ({allPhysicalShipments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  activeTab === 'profile' ? 'bg-red-600 text-white shadow-md shadow-red-950/40' : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Security & Profile</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="mt-6">
              {/* 1. DIGITAL KEY LOCKER */}
              {activeTab === 'keys' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-mono uppercase font-bold text-neutral-300">Your Permanent Digital License Keys</span>
                    <span>All keys are permanently retained in your secure vault.</span>
                  </div>

                  {allDigitalKeys.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#141622] border border-white/5 space-y-2">
                      <Key className="w-8 h-8 text-neutral-400 mx-auto" />
                      <div className="text-sm font-bold text-white">No digital license keys yet</div>
                      <p className="text-xs text-neutral-400">When you purchase CD keys or SaaS tools, your keys will appear here instantly.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {allDigitalKeys.map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-[#12141F] border border-white/10 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-bold text-white font-display">{item.productTitle}</div>
                              {item.variation && (
                                <div className="text-[10px] text-neutral-400 font-mono">Edition: {item.variation}</div>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                              ACTIVE KEY
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-400">
                            <span className="font-bold truncate">{item.key}</span>
                            <button
                              onClick={() => copyKey(item.key)}
                              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedKey === item.key ? 'COPIED' : 'COPY'}</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1">
                            <span>Order #{item.orderId}</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. ALL ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {customerOrders.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#141622] border border-white/5 space-y-2">
                      <ShoppingBag className="w-8 h-8 text-neutral-400 mx-auto" />
                      <div className="text-sm font-bold text-white">No orders found</div>
                      <p className="text-xs text-neutral-400">Place an order to see its receipt and fulfillment status here.</p>
                    </div>
                  ) : (
                    customerOrders.map((ord) => (
                      <div key={ord.id} className="p-4 rounded-2xl bg-[#12141F] border border-white/10 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5 text-xs font-mono">
                          <div>
                            <span className="font-bold text-white">ORDER #{ord.id}</span>
                            <span className="text-neutral-400 ml-2">({new Date(ord.createdAt).toLocaleDateString()})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                              {ord.paymentStatus}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] font-bold uppercase">
                              {ord.orderStatus}
                            </span>
                            <span className="font-bold text-white text-sm">{formatPrice(ord.total)}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-neutral-300">
                              <span className="truncate pr-2">
                                {item.quantity}x {item.productTitle} {item.variation && `(${item.variation.value})`}
                              </span>
                              <span className="font-mono text-neutral-400 shrink-0">{formatPrice(item.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. HARDWARE SHIPMENTS */}
              {activeTab === 'tracking' && (
                <div className="space-y-4">
                  {allPhysicalShipments.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#141622] border border-white/5 space-y-2">
                      <Truck className="w-8 h-8 text-neutral-400 mx-auto" />
                      <div className="text-sm font-bold text-white">No physical projector shipments</div>
                      <p className="text-xs text-neutral-400">Smart Projector orders will show live DHL / FedEx tracking here.</p>
                    </div>
                  ) : (
                    allPhysicalShipments.map((ship, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-[#12141F] border border-white/10 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                          <div>
                            <div className="text-sm font-bold text-white font-display">{ship.productTitle}</div>
                            <div className="text-xs text-neutral-400 font-mono">Order #{ship.orderId}</div>
                          </div>

                          <div className="text-right">
                            <span className="px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                              DHL EXPRESS: {ship.trackingNumber}
                            </span>
                          </div>
                        </div>

                        {/* Shipment Progress Bar */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-2">
                          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            <div className="font-bold">1. Order Placed</div>
                            <div className="text-[10px] text-neutral-400">Verified</div>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            <div className="font-bold">2. Dispatched</div>
                            <div className="text-[10px] text-neutral-400">Global Hub</div>
                          </div>
                          <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse">
                            <div className="font-bold">3. In Transit</div>
                            <div className="text-[10px] text-neutral-400">Air Cargo</div>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 text-neutral-400">
                            <div className="font-bold">4. Delivery</div>
                            <div className="text-[10px] text-neutral-400">Est. 2 Days</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. PROFILE & VIP SUPPORT */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#12141F] border border-white/10 space-y-4">
                    <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">Account Credentials</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-neutral-400">Full Name:</span>
                        <div className="text-white font-bold mt-0.5">{currentUser.name}</div>
                      </div>
                      <div>
                        <span className="text-neutral-400">Registered Email:</span>
                        <div className="text-white font-bold mt-0.5 font-mono">{currentUser.email}</div>
                      </div>
                      <div>
                        <span className="text-neutral-400">Security Tier:</span>
                        <div className="text-emerald-400 font-bold mt-0.5">256-Bit SSL Protected Account</div>
                      </div>
                      <div>
                        <span className="text-neutral-400">Total Spent:</span>
                        <div className="text-red-400 font-bold mt-0.5 font-mono">{formatPrice(currentUser.totalSpent)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white font-display">Need assistance with an order or key?</div>
                      <div className="text-[11px] text-neutral-400">Direct VIP concierge support available via encrypted WhatsApp.</div>
                    </div>

                    <button
                      onClick={() => setIsWhatsAppModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-display shrink-0 flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contact Support</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
