import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, AlertTriangle, Trash2, CheckCircle2, Sparkles } from 'lucide-react';

export const DuplicateVariationInspector: React.FC = () => {
  const { products, cleanAllProductVariations, addToast } = useStore();

  // Find products that have duplicate variations
  const productsWithDuplicates = products.filter(p => {
    if (!p.variations || p.variations.length <= 1) return false;
    const seen = new Set<string>();
    for (const v of p.variations) {
      const key = `${v.type.toLowerCase().trim()}_${v.value.toLowerCase().trim()}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  });

  const handleCleanAll = () => {
    cleanAllProductVariations();
    addToast('success', 'Deduplication Complete', 'All duplicate product variations have been cleanly unified.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/20 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-display">
                Duplicate Variation Protection Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                ACTIVE MONITOR
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
              Prevents duplicate SKU entries, identical package tiers, and messy option dropdowns resulting from bulk G2G, CSV, or supplier API feeds.
            </p>
          </div>
        </div>

        <button
          onClick={handleCleanAll}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold font-display shadow-lg shadow-red-600/30 flex items-center gap-2 shrink-0 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Execute Auto-Deduplication</span>
        </button>
      </div>

      {/* Audit Results */}
      <div className="p-6 rounded-3xl bg-[#10121B] border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Variation Integrity Audit Log
          </span>
          <span className="text-xs font-mono text-neutral-400">
            {products.length} Products Scanned • {productsWithDuplicates.length} Issues Found
          </span>
        </div>

        {productsWithDuplicates.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white font-display">Zero Duplicate Variations Detected</div>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              All digital keys, subscriptions, and projector models are verified clean and deduplicated.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {productsWithDuplicates.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-[#141622] border border-amber-500/30 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white font-display">{p.title}</div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Contains redundant variations ({p.variations?.length} total)</span>
                  </div>
                </div>

                <button
                  onClick={handleCleanAll}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold font-mono transition-colors"
                >
                  Fix SKU
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
