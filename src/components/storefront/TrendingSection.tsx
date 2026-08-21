import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Zap,
  Truck,
  Filter,
  X
} from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

export const TrendingSection: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    productTypeFilter,
    setProductTypeFilter,
    setActivePromoFilter,
    activePromoFilter,
  } = useStore();

  const [sortOption, setSortOption] = useState<'featured' | 'price-low' | 'price-high' | 'rating' | 'best-selling'>('featured');

  // Simulated catalog loading state — gives the skeleton loaders a chance to
  // paint so users see the polished loading state instead of a flash of empty grid.
  // Also re-runs briefly when the active filter changes.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(t);
  }, [selectedCategory, productTypeFilter, activePromoFilter, sortOption]);

  // Filter products based on selected category, product type & activePromoFilter
  let filtered = products.filter(p => {
    if (p.status !== 'published') return false;
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (productTypeFilter !== 'all' && p.productType !== productTypeFilter) return false;

    if (activePromoFilter === 'limited-time') {
      return p.isLimitedTime || (p.compareAtPrice && p.compareAtPrice > p.price);
    }
    if (activePromoFilter === 'flash-deals') {
      return p.compareAtPrice && p.compareAtPrice > p.price;
    }
    if (activePromoFilter === 'trending-week') {
      return p.isTrendingWeek || p.isTrending || p.rating >= 4.8;
    }
    if (activePromoFilter === 'best-sellers') {
      return (p.totalSold && p.totalSold > 30) || p.rating >= 4.9;
    }

    return true;
  });

  if (sortOption === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortOption === 'best-selling') {
    filtered.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
  } else {
    filtered.sort((a, b) => ((b.isTrendingWeek || b.isTrending) ? 1 : 0) - ((a.isTrendingWeek || a.isTrending) ? 1 : 0));
  }

  const getFilterTitle = () => {
    switch (activePromoFilter) {
      case 'limited-time': return 'Limited-Time Offers & Timed Drops';
      case 'flash-deals': return 'Flash Deals & Special Offers';
      case 'trending-week': return 'Trending This Week';
      case 'best-sellers': return 'Best Sellers & Top Rated Assets';
      default: return 'Trending Products & Digital Drops';
    }
  };

  // Skeleton placeholders match the responsive grid (2 / 3 / 4 cols).
  const skeletonCount = 8;

  return (
    <section id="catalog" className="w-full py-12 lg:py-16 px-4 sm:px-6 bg-[#08152F] border-b border-[#26334A] relative">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* SECTION HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#26334A]">
          <div>
            <div className="text-xs font-bold text-[#1769FF] uppercase tracking-[0.2em] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#1769FF] rounded-sm inline-block shadow-[0_0_8px_rgba(23,105,255,0.6)]" />
              <span>Verified Catalog</span>
              {activePromoFilter !== 'all' && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30 text-[10px] font-mono flex items-center gap-1">
                  <span>Filtered: {activePromoFilter.replace('-', ' ')}</span>
                  <button
                    onClick={() => setActivePromoFilter('all')}
                    className="hover:text-white"
                    aria-label="Clear promo filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
              {getFilterTitle()}
            </h2>
          </div>

          {/* Type Switcher & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Product Type Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-[#10182A] border border-[#26334A] text-xs font-mono shadow-inner">
              <button
                onClick={() => setProductTypeFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all ${
                  productTypeFilter === 'all'
                    ? 'btn-glossy btn-glossy-blue btn-glossy-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                All ({products.filter(p => p.status === 'published').length})
              </button>
              <button
                onClick={() => setProductTypeFilter('digital')}
                className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  productTypeFilter === 'digital'
                    ? 'btn-glossy btn-glossy-blue btn-glossy-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Zap className="w-3 h-3" />
                Digital ({products.filter(p => p.productType === 'digital' && p.status === 'published').length})
              </button>
              <button
                onClick={() => setProductTypeFilter('physical_projector')}
                className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  productTypeFilter === 'physical_projector'
                    ? 'btn-glossy btn-glossy-blue btn-glossy-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Truck className="w-3 h-3" />
                4K Projectors ({products.filter(p => p.productType === 'physical_projector' && p.status === 'published').length})
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-[#10182A] border border-[#26334A] text-slate-200 text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-[#1769FF] shadow-inner"
              aria-label="Sort products"
            >
              <option value="featured">Sort: Featured & Hot</option>
              <option value="best-selling">Sort: Best Sellers</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* PRODUCT GRID — responsive 2 (mobile) / 3 (tablet) / 4 (desktop) columns */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#10182A] border border-[#26334A] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1769FF]/10 text-[#1769FF] flex items-center justify-center mx-auto border border-[#1769FF]/20">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No products found for this filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your category, promotional filter, or search query to explore our complete verified inventory.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setProductTypeFilter('all');
                setActivePromoFilter('all');
              }}
              className="btn-glossy btn-glossy-cyan btn-glossy-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
