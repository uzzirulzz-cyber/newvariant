import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Flame, Clock, Zap, ArrowRight, Star } from 'lucide-react';

export const FlashDealsSection: React.FC = () => {
  const { products, setSelectedProduct, formatPrice, addToCart, setIsCheckoutOpen } = useStore();

  // 24-hour flash sale countdown timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 18,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = products.filter(p => (p.compareAtPrice && p.compareAtPrice > p.price) || p.isLimitedTime).slice(0, 4);

  return (
    <section id="deals" className="w-full py-12 px-4 sm:px-6 bg-[#070B14] border-b border-[#26334A]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Deal Header with Live Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#10182A] border border-[#26334A] shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF304F]/15 text-[#FF304F] border border-[#FF304F]/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,48,79,0.25)]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FF304F] uppercase tracking-[0.2em] font-mono">Flash Deals & Special Offers</span>
                <span className="px-2 py-0.5 rounded-md bg-[#FF304F] text-white text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse shadow-sm">
                  LIMITED TIME
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">Special Promotional Pricing Ending Soon</h3>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#FFC928]" />
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
              <div className="px-3 py-1.5 rounded-lg bg-[#08152F] border border-[#26334A] text-slate-100 shadow-inner">
                {String(timeLeft.hours).padStart(2, '0')}h
              </div>
              <span className="text-slate-500 font-bold">:</span>
              <div className="px-3 py-1.5 rounded-lg bg-[#08152F] border border-[#26334A] text-slate-100 shadow-inner">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </div>
              <span className="text-slate-500 font-bold">:</span>
              <div className="px-3 py-1.5 rounded-lg bg-[#08152F] border border-[#26334A] text-[#FF304F] shadow-inner">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </div>
            </div>
          </div>
        </div>

        {/* 4-Item Deal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dealProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="p-4 rounded-2xl bg-[#10182A] border border-[#26334A] hover:border-[#1769FF]/60 cursor-pointer group flex flex-col justify-between transition-all shadow-lg"
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-[#26334A]">
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FF304F] text-white font-mono text-[10px] font-bold shadow-md">
                    {product.compareAtPrice ? `${Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF` : 'SPECIAL DEAL'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">{product.categoryName}</div>
                  <h4 className="font-bold text-white text-xs truncate mt-0.5 group-hover:text-[#1769FF] transition-colors">{product.title}</h4>
                </div>
              </div>

              <div className="pt-3 border-t border-[#26334A]/80 mt-3 flex items-center justify-between">
                <div>
                  {product.compareAtPrice && (
                    <div className="text-[10px] text-slate-500 line-through font-mono">{formatPrice(product.compareAtPrice)}</div>
                  )}
                  <div className="text-sm font-black text-white font-mono">{formatPrice(product.price)}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, product.variations[0], 1);
                    setIsCheckoutOpen(true);
                  }}
                  className="btn-glossy btn-glossy-red btn-glossy-sm"
                  aria-label="Instant Buy Flash Deal"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
