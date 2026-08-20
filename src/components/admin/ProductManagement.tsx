import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductType } from '../../types';
import { ProductEditorModal } from './ProductEditorModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Zap,
  Truck,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye
} from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { products, deleteProduct, formatPrice, setSelectedProduct, addToast } = useStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const filteredProducts = products.filter(p => {
    if (typeFilter !== 'all' && p.productType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete ${title}?`)) {
      deleteProduct(id);
      addToast('info', 'Product Deleted', `${title} has been removed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#121212] border border-white/10 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Product Catalog & SKUs</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage instant digital keys, subscriptions, and 4K physical projector inventories.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsEditorOpen(true);
          }}
          className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.2)] flex items-center gap-2 shrink-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#121212] border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] rounded border border-white/10 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded transition-colors ${typeFilter === 'all' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-zinc-400'}`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setTypeFilter('digital')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${typeFilter === 'digital' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-zinc-400'}`}
          >
            <Zap className="w-3 h-3 text-emerald-400" /> Digital
          </button>
          <button
            onClick={() => setTypeFilter('physical_projector')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${typeFilter === 'physical_projector' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-zinc-400'}`}
          >
            <Truck className="w-3 h-3 text-red-500" /> 4K Projectors
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl bg-[#121212] border border-white/5 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-white/5 bg-[#161616] font-mono text-zinc-400 uppercase text-[11px] tracking-wider">
                <th className="p-4">Product Details</th>
                <th className="p-4">SKU / Type</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Variations</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((p) => {
                const isPhysical = p.productType === 'physical_projector';
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded object-cover bg-zinc-900 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate max-w-xs">{p.title}</div>
                          <div className="text-[11px] text-zinc-500">{p.categoryName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono">
                      <div className="text-white font-bold">{p.sku}</div>
                      <div className="mt-0.5">
                        {isPhysical ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-500 bg-red-600/10 px-1.5 py-0.5 rounded border border-red-500/20">
                            <Truck className="w-2.5 h-2.5" /> 4K Projector
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Zap className="w-2.5 h-2.5" /> Digital Key
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-mono">
                      <div className="font-bold text-white">{formatPrice(p.price)}</div>
                      {p.compareAtPrice > p.price && (
                        <div className="text-[10px] text-zinc-500 line-through">{formatPrice(p.compareAtPrice)}</div>
                      )}
                    </td>

                    <td className="p-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.stock <= p.lowStockThreshold ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>

                    <td className="p-4 font-mono text-zinc-300">
                      {p.variations && p.variations.length > 0 ? (
                        <span className="text-xs font-semibold">{p.variations.length} Options</span>
                      ) : (
                        <span className="text-zinc-500">Single SKU</span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="p-2 rounded bg-white/5 hover:bg-blue-500/15 text-zinc-300 hover:text-blue-400 transition-colors"
                          title="Preview Product (as customers will see it)"
                          aria-label={`Preview ${p.title}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsEditorOpen(true);
                          }}
                          className="p-2 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                          title="Edit Product"
                          aria-label={`Edit ${p.title}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-2 rounded bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete Product"
                          aria-label={`Delete ${p.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <ProductEditorModal
        product={editingProduct}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
};
