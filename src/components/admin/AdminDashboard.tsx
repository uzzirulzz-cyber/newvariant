import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  CheckCircle2,
  Globe,
  Server,
  ShieldCheck,
  PackageCheck,
  BellRing,
  Activity,
  ArrowUpRight,
  ArrowRight,
  CircleCheck,
  Cpu,
  Network,
  CreditCard,
  Database,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

/**
 * New admin dashboard matching the screenshot.
 *
 * Layout (top-to-bottom):
 *   Row 1: Revenue Trend (wide) + Order Breakdown (donut) + Traffic Sources (bars)
 *   Row 2: System Status (list) + Pending Approvals (empty state) + Live Notifications
 *   Row 3: Recent Orders table + Top Products list
 *
 * Theme: deep black (#0a0b0d) sidebar + #151a23 cards, gold (#f59e0b) accents for prices,
 * blue (#3b82f6) for charts, purple (#8b5cf6) FAB. Uses the .admin-card / .admin-pill-* utilities
 * defined in src/index.css.
 */
export const AdminDashboard: React.FC = () => {
  const { orders, products, formatPrice } = useStore();

  // ---- Mock data for the dashboard cards (kept lightweight, no API churn) ----

  // 14-day revenue trend (deterministic, no Math.random on render)
  const revenueData = [
    { date: 'Aug 03', revenue: 620 },
    { date: 'Aug 04', revenue: 540 },
    { date: 'Aug 05', revenue: 780 },
    { date: 'Aug 06', revenue: 690 },
    { date: 'Aug 07', revenue: 920 },
    { date: 'Aug 08', revenue: 860 },
    { date: 'Aug 09', revenue: 1100 },
    { date: 'Aug 10', revenue: 1020 },
    { date: 'Aug 11', revenue: 1240 },
    { date: 'Aug 12', revenue: 1180 },
    { date: 'Aug 13', revenue: 1450 },
    { date: 'Aug 14', revenue: 1380 },
    { date: 'Aug 15', revenue: 1620 },
    { date: 'Aug 16', revenue: 1890 },
    { date: 'Aug 17', revenue: 1740 },
    { date: 'Aug 18', revenue: 1980 },
    { date: 'Aug 19', revenue: 2150 },
  ];

  // Order breakdown — most orders completed
  const completedOrders = orders.filter(o => o.orderStatus === 'completed').length;
  const processingOrders = orders.filter(o => o.orderStatus === 'processing').length;
  const totalOrdersCount = orders.length || 2;
  const completionRate = totalOrdersCount > 0 ? Math.round((completedOrders / totalOrdersCount) * 100) : 100;

  // Traffic sources (deterministic)
  const trafficSources = [
    { label: 'Direct / URL', percent: 52, count: 1492, color: '#3b82f6' },
    { label: 'TikTok Leads & Pixel', percent: 28, count: 882, color: '#8b5cf6' },
    { label: 'Organic Google Search', percent: 14, count: 481, color: '#10b981' },
    { label: 'Affiliate Network Referrals', percent: 6, count: 172, color: '#f59e0b' },
  ];

  // System status
  const systemStatus = [
    { icon: Server, label: 'Server', status: 'Operational', state: 'green' },
    { icon: Globe, label: 'CDN', status: 'Operational', state: 'green' },
    { icon: CreditCard, label: 'Payment Gateway', status: 'Operational', state: 'green' },
    { icon: Database, label: 'MongoDB Atlas Cloud', sublabel: 'playbeat.unopay.mongodb.net', status: 'Connected', state: 'green' },
  ];

  // Live notifications — pull from recent orders if available
  const liveNotifications = orders.slice(0, 2).map((o, i) => ({
    title: i === 0 ? 'Order Verified' : 'New Order',
    message: `${o.customerName} — ${o.items[0]?.productTitle || 'Order'} #${o.id}`,
    time: '1h ago',
  }));
  // Fallbacks if no orders in store
  const notifications = liveNotifications.length > 0 ? liveNotifications : [
    { title: 'Order Verified', message: 'Megacubic HY300 PRO parcel dispatched via TCS Express #TCS-892182', time: '1h ago' },
    { title: 'New Arrival', message: 'Megacubic HY300Pro Plus with motorized focus now in stock at ZeroByte store.', time: '1h ago' },
  ];

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Top products (highest totalSold)
  const topProducts = [...products]
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
    .slice(0, 5);

  // Donut chart values
  const donutSize = 120;
  const donutStroke = 12;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutOffset = donutCircumference * (1 - completionRate / 100);

  return (
    <div className="space-y-5">
      {/* ============================================
          ROW 1 — KEY METRICS
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue Trend — spans wider */}
        <div className="admin-card p-5 lg:col-span-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Revenue Trend</h3>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Live 14-Day Cycle</p>
            </div>
            <span className="admin-pill-green flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              +18.4%
            </span>
          </div>
          <div className="h-[180px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#1f2937' }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0a0b0d',
                    border: '1px solid #252b3b',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#f9fafb',
                  }}
                  labelStyle={{ color: '#9ca3af', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Breakdown — donut */}
        <div className="admin-card p-5 lg:col-span-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Order Breakdown</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">{completionRate}% Fulfilled</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3">
            <div className="relative" style={{ width: donutSize, height: donutSize }}>
              <svg width={donutSize} height={donutSize} className="-rotate-90">
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={donutRadius}
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth={donutStroke}
                />
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={donutRadius}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={donutStroke}
                  strokeLinecap="round"
                  strokeDasharray={donutCircumference}
                  strokeDashoffset={donutOffset}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))', transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white font-mono">{totalOrdersCount}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Total</span>
              </div>
            </div>
            <div className="mt-4 space-y-1 w-full">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-400">Completed</span>
                </div>
                <span className="text-white font-mono font-semibold">{completedOrders}</span>
              </div>
              {processingOrders > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-gray-400">Processing</span>
                  </div>
                  <span className="text-white font-mono font-semibold">{processingOrders}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Traffic Sources — horizontal bars */}
        <div className="admin-card p-5 lg:col-span-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Traffic Sources</h3>
            </div>
            <span className="admin-pill-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Influx
            </span>
          </div>
          <div className="space-y-2.5">
            {trafficSources.map((src) => (
              <div key={src.label}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-gray-300 truncate pr-2">{src.label}</span>
                  <span className="text-gray-500 font-mono">
                    <span className="text-white font-semibold">{src.percent}%</span> ({src.count})
                  </span>
                </div>
                <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${src.percent}%`, background: src.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            Real-time analytics captured from playbeat.digital
          </p>
        </div>
      </div>

      {/* ============================================
          ROW 2 — STATUS & APPROVALS
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* System Status */}
        <div className="admin-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">System Status</h3>
            </div>
            <span className="admin-pill-green">100% Healthy</span>
          </div>
          <div className="space-y-2">
            {systemStatus.map((sys) => {
              const Icon = sys.icon;
              return (
                <div key={sys.label} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f141c] border border-[#1f2937]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-[#1f2937] flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-white font-medium truncate">{sys.label}</div>
                      {sys.sublabel && (
                        <div className="text-[10px] text-gray-500 font-mono truncate">{sys.sublabel}</div>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 ${sys.state === 'green' ? 'admin-pill-green' : 'admin-pill-amber'}`}>
                    {sys.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="admin-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Pending Products Approvals</h3>
            </div>
            <span className="admin-pill-green">0 Queued</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3">
              <CircleCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400">All products published</div>
            <p className="text-[11px] text-gray-500 mt-1">No products awaiting approval</p>
            <p className="text-[10px] text-gray-600 mt-3 font-mono">
              Auto-verification enabled for verified merchants
            </p>
          </div>
        </div>

        {/* Live Notifications */}
        <div className="admin-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Live Notifications</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono uppercase">Real-time</span>
          </div>
          <div className="space-y-2.5">
            {notifications.map((n, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#0f141c] border border-[#1f2937] hover:border-[#3a4256] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{n.title}</span>
                  <span className="text-[10px] text-gray-600 font-mono">{n.time}</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-snug">{n.message}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            [PN] Webhook listeners active on /api/webhooks
          </p>
        </div>
      </div>

      {/* ============================================
          ROW 3 — DATA TABLES
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Orders */}
        <div className="admin-card p-5 lg:col-span-7">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Latest transactions dispatched across Pakistan</p>
            </div>
            <span className="admin-pill-blue">{recentOrders.length} Total</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No recent orders yet — orders will appear here once customers check out.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#1f2937] text-gray-500 uppercase text-[10px] tracking-wider font-mono">
                    <th className="px-2 py-2 font-medium">Order</th>
                    <th className="px-2 py-2 font-medium">Customer</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                    <th className="px-2 py-2 font-medium">Method</th>
                    <th className="px-2 py-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]/60">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-2 py-2.5 font-mono text-white">{order.id}</td>
                      <td className="px-2 py-2.5">
                        <div className="text-white font-medium truncate max-w-[140px]">{order.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]">{order.customerEmail}</div>
                      </td>
                      <td className="px-2 py-2.5 font-mono">
                        <span className="text-amber-400 font-semibold">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="text-gray-300 font-mono text-[11px] uppercase">
                          {order.paymentGateway || order.paymentMethod || 'Stripe'}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <span className="admin-pill-green">
                          {order.orderStatus || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="admin-card p-5 lg:col-span-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Products</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Best-selling subscriptions, projectors & passes</p>
            </div>
            <span className="admin-pill-purple">Verified</span>
          </div>
          <div className="space-y-2.5">
            {topProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-[#0f141c] border border-[#1f2937] hover:border-[#3a4256] transition-colors"
              >
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-10 h-10 rounded-md object-cover bg-black/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {product.productType === 'physical_projector' && (
                      <span className="admin-pill-blue !py-0 !px-1.5 !text-[9px]">4K</span>
                    )}
                    <span className="text-xs text-white font-medium truncate">{product.title}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {product.categoryName} · {(product.totalSold || 0)} sold
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-amber-400 font-mono">{formatPrice(product.price)}</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 justify-end">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {product.rating} ({product.reviewCount})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
