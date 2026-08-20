import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { ArrowUpRight } from 'lucide-react';

export const CategoryGrid: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, setProductTypeFilter } = useStore();

  const featuredCategories = categories.filter(c => c.isFeatured);

  return (
    <section className="w-full py-12 px-4 sm:px-6 bg-[#08152F] border-b border-[#26334A]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#26334A]">
          <div>
            <div className="text-xs font-bold text-[#1769FF] uppercase tracking-[0.2em] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#1769FF] rounded-sm inline-block shadow-[0_0_8px_rgba(23,105,255,0.6)]" />
              <span>Curated Collections</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display mt-1">Featured Categories</h2>
          </div>
          <div className="text-xs text-slate-400 max-w-md font-mono">
            Instant digital fulfillment on licenses & worldwide express delivery on 4K Laser Cinema.
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {featuredCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const isProjector = cat.id === 'smart-projectors';

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setProductTypeFilter(isProjector ? 'physical_projector' : 'all');
                  const el = document.getElementById(isProjector ? 'projectors-section' : 'catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`relative p-5 rounded-2xl text-left transition-all duration-300 group overflow-hidden border ${
                  isSelected
                    ? 'bg-[#121C30] border-[#1769FF] shadow-[0_10px_30px_-5px_rgba(23,105,255,0.25)]'
                    : 'bg-[#10182A] border-[#26334A] hover:border-[#1769FF]/50 hover:bg-[#121C30]'
                }`}
              >
                {/* 3% Blue/Red Subtle Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1769FF]/10 via-transparent to-[#FF304F]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isProjector
                      ? 'bg-[#1769FF]/20 text-[#287BFF] border border-[#1769FF]/40 shadow-[0_0_15px_rgba(23,105,255,0.3)]'
                      : 'bg-[#08152F] text-slate-300 border border-[#26334A] group-hover:bg-[#1769FF]/20 group-hover:text-[#287BFF] group-hover:border-[#1769FF]/30'
                  }`}>
                    <CategoryIcon name={cat.iconName} className="w-5 h-5" />
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#08152F] border border-[#26334A] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#1769FF] group-hover:border-transparent transition-all shadow-sm">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-4 space-y-1 relative z-10">
                  <h3 className="font-bold text-white text-sm group-hover:text-[#1769FF] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
