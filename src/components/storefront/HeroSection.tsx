import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Search,
  Zap,
  ShieldCheck,
  Truck,
  Flame,
  ArrowRight,
  Sparkles,
  Projector,
  Gamepad2,
  Tv,
  Cpu,
  Clock,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

export const HeroSection: React.FC = () => {
  const {
    content,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    setProductTypeFilter,
    setSelectedProduct,
    products,
    setIsCompareModalOpen,
    formatPrice,
    setActivePromoFilter
  } = useStore();

  const featuredProjector = products.find(p => p.id === 'proj-cinebeam-4k') || products[0];

  return (
    <section className="relative w-full overflow-hidden bg-[#08152F] border-b border-[#26334A] pt-8 pb-16 lg:py-20 px-4 sm:px-6">
      {/* 3% Sophisticated Subtle Blue/Red Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#1769FF]/[0.08] via-[#6B4DFF]/[0.04] to-[#FF304F]/[0.05] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#1769FF]/[0.05] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        {/* LEFT COLUMN: HERO TEXT & SEARCH */}
        <div className="lg:col-span-7 space-y-6">
          {/* Highlight Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#10182A] border border-[#26334A] text-xs font-mono uppercase tracking-[0.2em] shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-[#1769FF] shadow-[0_0_10px_rgba(23,105,255,0.8)] animate-pulse" />
            <span className="text-[#287BFF] font-bold">{content.heroBanner.highlightBadge}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">Instant Key Dispatch & 4K Laser</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white font-display tracking-tight leading-[1.1]">
            Next-Gen <span className="text-white">Digital Assets</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1769FF] via-[#6B4DFF] to-[#FF304F]">4K Laser Cinema</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-normal">
            {content.heroBanner.subheadline}
          </p>

          {/* Instant Search Bar */}
          <div className="max-w-lg relative">
            <div className="relative flex items-center rounded-full bg-[#10182A] border border-[#26334A] p-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] focus-within:border-[#1769FF]/70 focus-within:shadow-[0_0_25px_rgba(23,105,255,0.2)] transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Search Steam $100, 4K Projectors, Canva Pro, Netflix, IPTV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => {
                  const el = document.getElementById('catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-glossy btn-glossy-blue btn-glossy-sm shrink-0"
              >
                Search
              </button>
            </div>

            {/* Quick Pill Filter Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Trending:</span>
              {[
                { label: 'Limited-Time Offers', action: () => { setActivePromoFilter('limited-time'); const el = document.getElementById('catalog'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
                { label: 'Flash Deals', action: () => { setActivePromoFilter('flash-deals'); const el = document.getElementById('deals'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
                { label: '4K Projectors', action: () => { setSelectedCategory('smart-projectors'); setProductTypeFilter('physical_projector'); const el = document.getElementById('projectors-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
                { label: 'Best Sellers', action: () => { setActivePromoFilter('best-sellers'); const el = document.getElementById('catalog'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={pill.action}
                  className="px-2.5 py-1 rounded-md bg-[#10182A] hover:bg-[#1769FF]/20 hover:text-[#287BFF] hover:border-[#1769FF]/40 border border-[#26334A] text-[11px] text-slate-300 font-medium transition-all"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Value Badges (3 Pillars) */}
          <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#26334A]/80 max-w-lg">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#00D99A]/15 text-[#00D99A] flex items-center justify-center shrink-0 border border-[#00D99A]/30">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] leading-tight font-mono text-slate-300">
                <strong className="block text-white font-sans text-xs">Instant</strong>
                Key Release
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1769FF]/15 text-[#1769FF] flex items-center justify-center shrink-0 border border-[#1769FF]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] leading-tight font-mono text-slate-300">
                <strong className="block text-white font-sans text-xs">100%</strong>
                Authentic
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFC928]/15 text-[#FFC928] flex items-center justify-center shrink-0 border border-[#FFC928]/30">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] leading-tight font-mono text-slate-300">
                <strong className="block text-white font-sans text-xs">Express</strong>
                Air Freight
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HERO 4K PROJECTOR HARDWARE SPOTLIGHT */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-[#1769FF]/40 via-[#26334A] to-transparent shadow-2xl">
            <div className="rounded-[22px] bg-[#10182A] p-6 space-y-6 overflow-hidden relative">
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-[#1769FF]/20 text-[#287BFF] font-mono text-[10px] font-bold tracking-wider uppercase border border-[#1769FF]/40">
                  FLAGSHIP HARDWARE SPOTLIGHT
                </span>
                <span className="text-[11px] font-mono text-[#00D99A] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D99A] animate-ping" />
                  In Stock (Express Delivery)
                </span>
              </div>

              {/* Product Visual */}
              <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-950 border border-[#26334A] group">
                <img
                  src={featuredProjector?.images[0]}
                  alt={featuredProjector?.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10182A] via-transparent to-black/20" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white font-mono text-[11px] border border-white/10">
                    4K Laser Cinema • 2,800 Lumens
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FF304F]/90 backdrop-blur-md text-white font-mono font-bold text-[11px]">
                    SAVE $200
                  </span>
                </div>
              </div>

              {/* Product Info & Specs */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white leading-tight hover:text-[#1769FF] transition-colors cursor-pointer"
                  onClick={() => setSelectedProduct(featuredProjector)}
                >
                  {featuredProjector?.title}
                </h2>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#08152F] border border-[#26334A]">
                    <Tv className="w-3.5 h-3.5 text-[#1769FF]" />
                    <span>Android TV 11.0</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#08152F] border border-[#26334A]">
                    <Cpu className="w-3.5 h-3.5 text-[#FFC928]" />
                    <span>HDR10+ Decoder</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#26334A]">
                  <div>
                    <span className="text-xs text-slate-400 line-through mr-2 font-mono">
                      {formatPrice(featuredProjector?.compareAtPrice || 699.99)}
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {formatPrice(featuredProjector?.price || 499.99)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCompareModalOpen(true)}
                      className="btn-glossy btn-glossy-purple btn-glossy-sm"
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => setSelectedProduct(featuredProjector)}
                      className="btn-glossy btn-glossy-yellow btn-glossy-sm flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
