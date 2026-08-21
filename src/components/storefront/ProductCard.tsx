import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductVariation } from '../../types';
import {
  Star,
  ShoppingCart,
  Heart,
  Zap,
  Truck,
  ArrowRight,
  ShieldCheck,
  Check,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  /**
   * Compact mode removes the variant chips row and shortens the description,
   * useful for recommendation rails or compact search results.
   */
  compact?: boolean;
}

/**
 * Premium product card.
 *
 * Design priorities (kept in sync with the user's brief):
 *  - High-quality image with consistent aspect ratio + smooth hover zoom.
 *  - Category badge, controlled title wrapping, one-line description.
 *  - Starting price + original price with discount indicator.
 *  - Variant selector when multiple variants exist (max 3 chips).
 *  - Stock / availability indicator.
 *  - Prominent Add-to-Cart + Quick View.
 *  - Wishlist / favorite icon (top-right).
 *  - Trust / instant-delivery indicator where applicable.
 *  - Consistent height, aligned pricing, consistent buttons, equal spacing.
 *  - Single source of truth: same card is used by the catalog grid, search
 *    results, and the related-products rail.
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const {
    addToCart,
    toggleWishlist,
    wishlist,
    setSelectedProduct,
    formatPrice,
    isInCart,
    currentUser,
    setIsAuthModalOpen,
    addToast,
  } = useStore();

  const isGuest = currentUser.id === 'guest';

  // Local variation selection — defaults to the first available variation.
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    product.variations && product.variations.length > 0 ? product.variations[0] : undefined
  );

  const currentPrice = selectedVariation ? selectedVariation.price : product.price;
  const hasDiscount = product.compareAtPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - currentPrice) / product.compareAtPrice) * 100)
    : 0;

  const isWishlisted = wishlist.includes(product.id);
  const isPhysical = product.productType === 'physical_projector';
  const inCart = isInCart(product.id, selectedVariation?.id);

  // Variants — only show when there are 2+ distinct variants.
  const visibleVariations = product.variations && product.variations.length > 1
    ? product.variations.slice(0, 3)
    : [];

  // Stock state — three modes: out / low / healthy.
  const effectiveStock = selectedVariation ? selectedVariation.stock : product.stock;
  const stockState: 'out' | 'low' | 'healthy' =
    effectiveStock <= 0 ? 'out' : effectiveStock <= product.lowStockThreshold ? 'low' : 'healthy';

  const handleCardClick = () => {
    if (isGuest) {
      setIsAuthModalOpen(true);
      addToast('info', 'Sign In Required', 'Please sign in or create an account to view product details.');
      return;
    }
    setSelectedProduct(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) {
      setIsAuthModalOpen(true);
      addToast('info', 'Sign In Required', 'Please sign in or create an account to view products.');
      return;
    }
    setSelectedProduct(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) {
      setIsAuthModalOpen(true);
      addToast('info', 'Sign In Required', 'Please sign in or create an account to add items to cart.');
      return;
    }
    addToCart(product, selectedVariation, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) {
      setIsAuthModalOpen(true);
      addToast('info', 'Sign In Required', 'Please sign in or create an account to use wishlist.');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleVariationSelect = (e: React.MouseEvent, v: ProductVariation) => {
    e.stopPropagation();
    setSelectedVariation(v);
  };

  return (
    <article
      onClick={handleCardClick}
      className="product-card-premium group flex flex-col h-full cursor-pointer relative"
      aria-label={`View ${product.title}`}
    >
      {/* ===========================================================
          IMAGE / BADGES / WISHLIST
          =========================================================== */}
      <div className="relative aspect-[4/3] bg-[#0A1020] overflow-hidden rounded-t-[15px] border-b border-[#26334A]/70">
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="product-card-image w-full h-full object-cover"
        />
        {/* Subtle gradient for legibility of badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent opacity-70 pointer-events-none" />

        {/* Top-left badges: category / type / discount */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[75%]">
          <span className="px-2 py-0.5 rounded-md bg-black/55 text-white backdrop-blur-md font-mono text-[9px] font-bold tracking-wider uppercase border border-white/10">
            {product.categoryName}
          </span>

          {product.offerBadgeText ? (
            <span
              className={`px-2 py-0.5 rounded-md backdrop-blur-md font-mono text-[9px] font-bold tracking-wider uppercase border ${
                product.offerBadgeColor === 'yellow'
                  ? 'bg-[#FFC928]/90 text-slate-950 border-[#FFC928]'
                  : product.offerBadgeColor === 'red'
                  ? 'bg-[#FF304F]/90 text-white border-[#FF304F]'
                  : product.offerBadgeColor === 'green'
                  ? 'bg-[#00D99A]/90 text-slate-950 border-[#00D99A]'
                  : 'bg-[#1769FF]/90 text-white border-[#1769FF]'
              }`}
            >
              {product.offerBadgeText}
            </span>
          ) : isPhysical ? (
            <span className="px-2 py-0.5 rounded-md bg-[#1769FF]/90 text-white backdrop-blur-md font-mono text-[9px] font-bold tracking-wider uppercase border border-[#1769FF]/80 flex items-center gap-1">
              <Truck className="w-2.5 h-2.5" /> Tracked 4K
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-[#00D99A]/90 text-slate-950 backdrop-blur-md font-mono text-[9px] font-bold tracking-wider uppercase border border-[#00D99A]/80 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Instant Key
            </span>
          )}

          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-md bg-[#FF304F]/90 text-white backdrop-blur-md font-mono text-[9px] font-bold tracking-wider uppercase border border-[#FF304F]/80">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist (top-right) */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md border transition-all ${
            isWishlisted
              ? 'bg-[#FF304F] text-white border-[#FF304F] shadow-md shadow-[#FF304F]/30'
              : 'bg-black/55 text-slate-200 hover:text-white hover:bg-black/75 border-white/10'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View button (revealed on hover, always visible on touch) */}
        <button
          onClick={handleQuickView}
          className="product-card-quickview absolute bottom-2.5 left-2.5 right-2.5 py-2 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider font-mono border border-white/10 hover:bg-black/85 flex items-center justify-center gap-1.5"
          aria-label="Quick view product"
        >
          <Eye className="w-3 h-3" />
          <span>Quick View</span>
        </button>

        {/* In-cart indicator (top-right, below wishlist) */}
        {inCart && (
          <div className="absolute top-12 right-2.5 px-1.5 py-0.5 rounded bg-emerald-500/90 text-slate-950 font-mono text-[9px] font-bold tracking-wider uppercase flex items-center gap-0.5 shadow">
            <Check className="w-2.5 h-2.5" /> In Cart
          </div>
        )}
      </div>

      {/* ===========================================================
          CONTENT
          =========================================================== */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        {/* Rating row */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400 uppercase tracking-wider truncate">{product.categoryName}</span>
          <div className="flex items-center gap-1 text-[#FFC928] shrink-0">
            <Star className="w-3 h-3 fill-current" />
            <span className="font-bold text-slate-100">{product.rating}</span>
            <span className="text-slate-500">({product.reviewCount})</span>
          </div>
        </div>

        {/* Title — controlled wrapping (max 2 lines) */}
        <h3 className="product-card-title font-semibold text-white text-[13px] leading-snug line-clamp-2 min-h-[2.4em]">
          {product.title}
        </h3>

        {/* One-line description (hidden in compact mode) */}
        {!compact && (
          <p className="text-[11px] text-slate-400 line-clamp-1 min-h-[1.1em]">
            {product.shortDescription}
          </p>
        )}

        {/* Variant chips (when 2+ variants exist) */}
        {visibleVariations.length > 0 && (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">
              {product.variations![0].type}:
            </div>
            <div className="flex flex-wrap gap-1">
              {visibleVariations.map((v) => {
                const selected = selectedVariation?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={(e) => handleVariationSelect(e, v)}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all border truncate max-w-[120px] ${
                      selected
                        ? 'bg-[#1769FF]/20 text-[#5a9eff] border-[#1769FF]/60 font-bold'
                        : 'bg-[#0E1626] text-slate-400 border-[#26334A]/80 hover:text-slate-200 hover:border-[#1769FF]/30'
                    }`}
                    title={`${v.value} — ${formatPrice(v.price)}`}
                  >
                    {v.value}
                  </button>
                );
              })}
              {product.variations!.length > 3 && (
                <span className="px-2 py-1 text-[10px] font-mono text-slate-500 self-center">
                  +{product.variations!.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer to push price/button block to the bottom — keeps pricing aligned across cards */}
        <div className="flex-1" />

        {/* Stock / availability indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {stockState === 'out' ? (
            <span className="inline-flex items-center gap-1 text-[#FF304F]">
              <AlertCircle className="w-3 h-3" /> Out of stock
            </span>
          ) : stockState === 'low' ? (
            <span className="inline-flex items-center gap-1 text-[#FFC928]">
              <AlertCircle className="w-3 h-3" /> Only {effectiveStock} left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#00D99A]">
              <CheckCircle2 className="w-3 h-3" /> In stock
            </span>
          )}

          <span className="text-slate-500">·</span>
          <span className="text-slate-400">{product.totalSold || 48}+ sold</span>
        </div>

        {/* Price row — perfectly aligned across cards */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-[17px] font-black text-white font-mono leading-none">
            {formatPrice(currentPrice)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-slate-500 line-through font-mono leading-none">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Trust indicator row */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          {isPhysical ? (
            <>
              <Truck className="w-3 h-3 text-[#1769FF]" />
              <span>Free insured shipping</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 text-[#00D99A]" />
              <span>Instant key delivery</span>
            </>
          )}
          <span className="text-slate-600">·</span>
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Verified</span>
        </div>

        {/* Buttons — consistent across all cards */}
        <div className="grid grid-cols-[1fr_auto] gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleAddToCart}
            disabled={stockState === 'out'}
            className="btn-glossy btn-glossy-emerald btn-glossy-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{inCart ? 'Add More' : 'Add to Cart'}</span>
          </button>
          <button
            onClick={handleQuickView}
            aria-label="Quick view"
            className="btn-glossy btn-glossy-cyan btn-glossy-sm flex items-center justify-center"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

/**
 * Skeleton placeholder used while products are loading.
 * Keeps the grid layout stable — no jumpy reflows.
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="skeleton-card flex flex-col h-full">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex justify-between">
          <div className="h-3 w-16 skeleton rounded" />
          <div className="h-3 w-12 skeleton rounded" />
        </div>
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-3 w-2/3 skeleton rounded" />
        <div className="flex-1" />
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-5 w-24 skeleton rounded" />
        <div className="h-8 w-full skeleton rounded-lg" />
      </div>
    </div>
  );
};
