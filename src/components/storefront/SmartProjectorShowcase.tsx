import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Projector,
  Sparkles,
  Zap,
  Truck,
  Shield,
  Layers,
  CheckCircle2,
  Maximize2,
  Tv,
  Wifi,
  Volume2,
  Scale,
  ArrowRight
} from 'lucide-react';

export const SmartProjectorShowcase: React.FC = () => {
  const {
    products,
    setSelectedProduct,
    setIsCompareModalOpen,
    toggleCompare,
    compareList,
    formatPrice,
    addToCart,
    setIsCheckoutOpen
  } = useStore();

  const projectorProducts = products.filter(p => p.productType === 'physical_projector');
  const flagship = projectorProducts[0];

  if (!flagship) return null;

  return (
    <section id="projectors-section" className="w-full py-16 px-4 sm:px-6 bg-[#08152F] border-b border-[#26334A] relative overflow-hidden">
      {/* 3% Ambient Blue-Red Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#1769FF]/[0.06] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-[#FF304F]/[0.04] rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#26334A]">
          <div>
            <div className="text-xs font-bold text-[#1769FF] uppercase tracking-[0.2em] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#1769FF] rounded-sm inline-block shadow-[0_0_8px_rgba(23,105,255,0.6)]" />
              <span>Flagship Hardware Collection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
              Smart 4K Laser Cinema
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Ultra short throw laser projection. Verified ALPD 4.0 optics, Google TV certification, and Harman Kardon acoustics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="btn-glossy btn-glossy-purple btn-glossy-sm"
            >
              <Scale className="w-4 h-4 text-[#1769FF]" />
              <span>Compare Specs ({compareList.length})</span>
            </button>
          </div>
        </div>

        {/* Flagship Hero Card */}
        <div className="rounded-3xl bg-[#10182A] border border-[#26334A] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-[#1769FF]/20 text-[#287BFF] font-mono text-xs font-bold uppercase tracking-wider border border-[#1769FF]/30">
                RECOMMENDED FLAGSHIP
              </span>
              <span className="text-xs font-mono text-[#00D99A] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 3-Year Official Warranty
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {flagship.title}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              {flagship.description}
            </p>

            {/* Spec Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#08152F] border border-[#26334A] space-y-1">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Resolution</div>
                <div className="text-xs font-bold text-white font-mono">{flagship.projectorSpecs?.nativeResolution || 'True 4K UHD'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#08152F] border border-[#26334A] space-y-1">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Brightness</div>
                <div className="text-xs font-bold text-white font-mono">{flagship.projectorSpecs?.brightness || '2,800 Lumens'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#08152F] border border-[#26334A] space-y-1">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Max Screen</div>
                <div className="text-xs font-bold text-white font-mono">{flagship.projectorSpecs?.screenSize || '200 Inches'}</div>
              </div>
            </div>

            {/* Pricing & Actions */}
            <div className="pt-4 border-t border-[#26334A] flex flex-wrap items-center justify-between gap-4">
              <div>
                {flagship.compareAtPrice && (
                  <div className="text-xs text-slate-500 line-through font-mono">{formatPrice(flagship.compareAtPrice)}</div>
                )}
                <div className="text-3xl font-black text-white font-mono">{formatPrice(flagship.price)}</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleCompare(flagship)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all border ${
                    compareList.some(p => p.id === flagship.id)
                      ? 'bg-[#1769FF]/20 text-[#287BFF] border-[#1769FF]'
                      : 'bg-[#08152F] text-slate-400 border-[#26334A] hover:text-white'
                  }`}
                >
                  {compareList.some(p => p.id === flagship.id) ? '✓ In Compare' : '+ Compare'}
                </button>
                <button
                  onClick={() => setSelectedProduct(flagship)}
                  className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-slate-950 border border-[#26334A] group shadow-xl">
              <img
                src={flagship.images[0]}
                alt={flagship.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10182A] via-transparent to-black/20" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white font-mono text-xs border border-white/10">
                  Built-in Harman Kardon 30W
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#FF304F] text-white font-mono font-bold text-xs shadow-lg">
                  Free Express Shipping
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
