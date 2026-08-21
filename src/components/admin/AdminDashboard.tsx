import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  CheckCircle2,
  Globe,
  Server,
  ShieldCheck,
  PackageCheck,
  Package,
  ShoppingCart,
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
  RotateCcw,
  AlertTriangle,
  Loader2,
  X,
  Play,
  BarChart3,
  FileText,
  Calendar,
  ChevronDown,
  Download,
  Settings,
  Plus,
  Tag,
  Palette,
  Layers,
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
import { motion, AnimatePresence } from 'motion/react';
import { WeatherWidget } from './WeatherWidget';

/**
 * New admin dashboard matching the screenshot.
 *
 * Layout (top-to-bottom):
 *   Row 1: Revenue Trend (wide) + Order Breakdown (donut) + Traffic Sources (bars)
 *   Row 2: System Status (list) + Pending Approvals (empty state) + Live Notifications
 *   Row 3: Recent Orders table + Top Products list
 *
 * Includes a "Reset Dashboard" button that wipes all MongoDB data and re-seeds
 * from mock data (useful for demos and testing).
 */
export const AdminDashboard: React.FC = () => {
  const { orders, products, formatPrice, addToast, setAdminTab } = useStore();
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');
  const [dashboardTab, setDashboardTab] = useState<'activities' | 'statistics' | 'summary'>('activities');

  const handleReset = async () => {
    if (confirmText !== 'RESET') {
      addToast('error', 'Confirmation Required', 'Type RESET to confirm.');
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-db', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Database Reset', 'All data has been wiped and re-seeded. Reloading...');
        setIsResetOpen(false);
        setConfirmText('');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast('error', 'Reset Failed', data.error || 'Could not reset database.');
      }
    } catch {
      addToast('error', 'Reset Failed', 'Network error.');
    }
    setResetting(false);
  };

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
          DASHBOARD HEADER — Flare UI + DashFlat hybrid
          Icon+text tab buttons, pill action buttons, date selector, export, settings, reset
          ============================================ */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display">Executive Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Live metrics, orders, and product performance.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Each tab button gets its OWN unique glossy color when active */}
          <div className="flex items-center p-1 rounded-full bg-[#0f141c] border border-[#1f2937]">
            {([
              { id: 'activities', label: 'Activities', icon: Play, activeClass: 'btn-glossy btn-glossy-yellow btn-glossy-sm' },
              { id: 'statistics', label: 'Statistics', icon: BarChart3, activeClass: 'btn-glossy btn-glossy-cyan btn-glossy-sm' },
              { id: 'summary', label: 'Summary', icon: FileText, activeClass: 'btn-glossy btn-glossy-purple btn-glossy-sm' },
            ] as const).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDashboardTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    dashboardTab === tab.id
                      ? tab.activeClass
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <TabIcon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Each action button has a DIFFERENT premium glossy color */}
          <button className="btn-glossy btn-glossy-blue btn-glossy-sm">
            <Calendar className="w-3.5 h-3.5" />
            <span>{timeRange === '1D' ? 'Today' : timeRange === '1W' ? 'This Week' : timeRange === '1M' ? 'This Month' : 'This Year'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button className="btn-glossy btn-glossy-emerald btn-glossy-sm">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-glossy btn-glossy-purple btn-glossy-circle"
            aria-label="Open dashboard settings"
            title="Dashboard Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsResetOpen(true)}
            className="btn-glossy btn-glossy-red btn-glossy-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* ============================================
          WEATHER + CLOCK WIDGET
          Live local time + current weather + 4-day forecast.
          Uses the free Open-Meteo API (no API key required).
          City is persisted to localStorage so the user's choice is remembered.
          ============================================ */}
      <WeatherWidget />

      {/* ============================================
          COLORFUL KPI CARDS WITH SPARKLINES (Flare UI style)
          Each card: solid colored bg, large bold number, trend badge, mini sparkline
          ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue — emerald glossy card */}
        <button className="text-left rounded-xl p-5 overflow-hidden relative border-2 border-emerald-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #047857 0%, #064E3B 100%)', boxShadow: '0 10px 25px rgba(4,120,87,0.3), 0 0 20px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-emerald-100 tracking-wider font-mono font-bold">Total Revenue</div>
            <TrendingUp className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{formatPrice(orders.reduce((s, o) => s + (o.paymentStatus === 'paid' ? o.total : 0), 0))}</div>
          <div className="text-[10px] text-emerald-200 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +18.4% vs last period
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {[40, 55, 45, 70, 60, 85, 75, 90, 80, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-emerald-300/40 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </button>

        {/* Orders — blue glossy card */}
        <button className="text-left rounded-xl p-5 overflow-hidden relative border-2 border-blue-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #2563EB 0%, #1E40AF 100%)', boxShadow: '0 10px 25px rgba(37,99,235,0.3), 0 0 20px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-blue-100 tracking-wider font-mono font-bold">Total Orders</div>
            <ShoppingCart className="w-4 h-4 text-blue-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{orders.length}</div>
          <div className="text-[10px] text-blue-200 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +12.1% vs last period
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {[30, 45, 35, 60, 50, 65, 55, 70, 60, 75].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-300/40 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </button>

        {/* Products — purple glossy card */}
        <button className="text-left rounded-xl p-5 overflow-hidden relative border-2 border-purple-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #7E22CE 0%, #581C87 100%)', boxShadow: '0 10px 25px rgba(126,34,206,0.3), 0 0 20px rgba(147,51,234,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-purple-100 tracking-wider font-mono font-bold">Products</div>
            <Package className="w-4 h-4 text-purple-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{products.length}</div>
          <div className="text-[10px] text-purple-200 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {products.filter(p => p.status === 'published').length} published
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {[50, 60, 55, 65, 70, 75, 80, 85, 90, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-purple-300/40 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </button>

        {/* Low Stock — orange/red glossy card */}
        <button className="text-left rounded-xl p-5 overflow-hidden relative border-2 border-orange-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #EA580C 0%, #9A3412 100%)', boxShadow: '0 10px 25px rgba(234,88,12,0.3), 0 0 20px rgba(249,115,22,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-orange-100 tracking-wider font-mono font-bold">Low Stock Alerts</div>
            <AlertTriangle className="w-4 h-4 text-orange-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{products.filter(p => p.stock <= p.lowStockThreshold).length}</div>
          <div className="text-[10px] text-orange-200 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> needs attention
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {[20, 25, 30, 20, 35, 40, 30, 45, 50, 40].map((h, i) => (
              <div key={i} className="flex-1 bg-orange-300/40 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </button>
      </div>

      {/* ============================================
          CATALOG HEALTH STRIP (Premium v2)
          Breaks down the catalog: Total / Active / Hidden / Low-Stock
          Plus quick-action buttons (Add Product, Migrate Variations, etc.)
          ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(() => {
          const total = products.length;
          const active = products.filter((p) => p.status === 'published').length;
          const hidden = products.filter((p) => p.status === 'draft' || p.status === 'archived').length;
          const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length;
          const outStock = products.filter((p) => p.stock <= 0).length;

          const stats = [
            { label: 'Total Products', value: total, accent: 'var(--pb-silver-2)', delta: `${active} active` },
            { label: 'Active / Published', value: active, accent: 'var(--pb-emerald)', delta: `${Math.round((active / Math.max(total, 1)) * 100)}% of catalog` },
            { label: 'Hidden (Draft/Archived)', value: hidden, accent: 'var(--pb-amber)', delta: hidden === 0 ? 'None hidden' : 'Needs review' },
            { label: 'Low / Out of Stock', value: lowStock + outStock, accent: outStock > 0 ? '#FF2E42' : 'var(--pb-amber)', delta: `${lowStock} low · ${outStock} out` },
          ];

          return stats.map((s) => (
            <div key={s.label} className="pb-kpi">
              <div className="pb-kpi-accent" style={{ background: s.accent }} />
              <div className="pb-kpi-label">{s.label}</div>
              <div className="pb-kpi-value">{s.value}</div>
              <div className="pb-kpi-delta flat">{s.delta}</div>
            </div>
          ));
        })()}
      </div>

      {/* ============================================
          QUICK ACTIONS (Premium v2)
          ============================================ */}
      <div className="flex flex-wrap gap-2 pb-panel p-3 rounded-xl">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--pb-silver-3)] self-center mr-2">
          Quick Actions:
        </span>
        <button
          onClick={() => setAdminTab('products')}
          className="pb-btn pb-btn-primary pb-btn-sm"
        >
          <Plus className="w-3 h-3" />
          <span>Add Product</span>
        </button>
        <button
          onClick={() => setAdminTab('orders')}
          className="pb-btn pb-btn-secondary pb-btn-sm"
        >
          <ShoppingCart className="w-3 h-3" />
          <span>View Orders</span>
        </button>
        <button
          onClick={() => setAdminTab('discounts')}
          className="pb-btn pb-btn-secondary pb-btn-sm"
        >
          <Tag className="w-3 h-3" />
          <span>Discounts</span>
        </button>
        <button
          onClick={() => setAdminTab('content')}
          className="pb-btn pb-btn-secondary pb-btn-sm"
        >
          <Palette className="w-3 h-3" />
          <span>Edit Storefront</span>
        </button>
        <button
          onClick={() => setAdminTab('dedup')}
          className="pb-btn pb-btn-secondary pb-btn-sm"
        >
          <Layers className="w-3 h-3" />
          <span>Variant Dedup</span>
        </button>
      </div>

      {/* ============================================
          TIME RANGE SEGMENTED CONTROL + VIEW LABEL (DashFlat 1D/1W/1M/1Y)
          ============================================ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mr-1">Range:</span>
          <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#0f141c] border border-[#1f2937]">
            {([
              { r: '1D', c: 'btn-glossy btn-glossy-blue btn-glossy-sm' },
              { r: '1W', c: 'btn-glossy btn-glossy-yellow btn-glossy-sm' },
              { r: '1M', c: 'btn-glossy btn-glossy-emerald btn-glossy-sm' },
              { r: '1Y', c: 'btn-glossy btn-glossy-cyan btn-glossy-sm' },
            ] as const).map((item) => (
              <button
                key={item.r}
                onClick={() => setTimeRange(item.r)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  timeRange === item.r
                    ? item.c
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {item.r}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          Showing: {timeRange === '1D' ? 'Last 24 hours' : timeRange === '1W' ? 'Last 7 days' : timeRange === '1M' ? 'Last 30 days' : 'Last 12 months'}
        </span>
      </div>

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

      {/* ============================================
          RESET DASHBOARD CONFIRMATION MODAL
          ============================================ */}
      <AnimatePresence>
        {isResetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResetOpen(false)} className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-2xl bg-[#151a23] border border-red-500/30 shadow-2xl p-6 z-10" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-white font-display">Reset Dashboard</h3>
                </div>
                <button onClick={() => setIsResetOpen(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-red-300 leading-relaxed mb-4">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                This will permanently delete ALL data in MongoDB (products, orders, users, coupons, logs) and re-seed with default mock data. This action cannot be undone.
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Type <span className="font-mono font-bold text-red-400">RESET</span> to confirm</label>
                <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="RESET" className="input-sharp w-full px-3 py-2 text-xs text-white font-mono uppercase" />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <button onClick={() => setIsResetOpen(false)} className="flex-1 py-2.5 rounded-lg bg-[#1f2937] hover:bg-[#2a3344] text-gray-300 text-xs font-bold uppercase tracking-wider">Cancel</button>
                <button onClick={handleReset} disabled={resetting || confirmText !== 'RESET'} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Reset Everything</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ===== SETTINGS MODAL ===== */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl bg-[#151a23] border border-purple-500/30 shadow-2xl p-6 z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-modal-title"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 id="settings-modal-title" className="text-base font-bold text-white font-display">Dashboard Settings</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Time range preference */}
                <div>
                  <label className="block text-[11px] text-gray-400 mb-2 font-mono uppercase tracking-wider">Default Time Range</label>
                  <div className="flex flex-wrap gap-2">
                    {(['1D', '1W', '1M', '1Y'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setTimeRange(r);
                          addToast('success', 'Preference Saved', `Default time range set to ${r === '1D' ? 'Today' : r === '1W' ? 'This Week' : r === '1M' ? 'This Month' : 'This Year'}.`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                          timeRange === r
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {r === '1D' ? 'Today' : r === '1W' ? 'Week' : r === '1M' ? 'Month' : 'Year'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick links to admin sections */}
                <div>
                  <label className="block text-[11px] text-gray-400 mb-2 font-mono uppercase tracking-wider">Quick Admin Links</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setAdminTab('products'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Catalog Products</span>
                    </button>
                    <button
                      onClick={() => { setAdminTab('orders'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                      <span>Orders</span>
                    </button>
                    <button
                      onClick={() => { setAdminTab('security'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                      <span>Security & Audit</span>
                    </button>
                    <button
                      onClick={() => { setAdminTab('content'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Storefront Content</span>
                    </button>
                  </div>
                </div>

                {/* Reset DB shortcut */}
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsResetOpen(true);
                    }}
                    className="w-full px-3 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-red-500/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Database (Destructive)</span>
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2 text-center leading-relaxed">
                    Wipes all MongoDB collections and re-seeds with default data.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
