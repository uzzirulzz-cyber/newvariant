import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuthStore } from '../../store/useAuthStore';
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
  Eye,
  Upload,
  RotateCcw,
  LogOut,
  Loader2,
} from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { products, deleteProduct, formatPrice, setSelectedProduct, addToast, setCurrentUser, setActiveView } = useStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [isMigratingVars, setIsMigratingVars] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // CSV import — handles both simple CSV and WooCommerce export format
  // Supports quoted fields with embedded commas/newlines
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);

    try {
      const text = await file.text();
      // Remove BOM
      const cleanText = text.replace(/^\uFEFF/, '');

      // Parse CSV with proper quote handling
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (char === '"') {
          if (inQuotes && cleanText[i + 1] === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === '\n' && !inQuotes) {
          currentRow.push(currentField);
          if (currentRow.some(f => f.trim())) rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else if (char === '\r') {
          // skip
        } else {
          currentField += char;
        }
      }
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        if (currentRow.some(f => f.trim())) rows.push(currentRow);
      }

      if (rows.length < 2) {
        addToast('error', 'CSV Invalid', 'CSV must have a header row and at least one product row.');
        setCsvUploading(false);
        e.target.value = '';
        return;
      }

      // Parse header — strip quotes and lowercase
      const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

      // Map category string to our category IDs
      const mapCategory = (catStr: string): string => {
        const c = (catStr || '').toLowerCase();
        if (c.includes('gift card') || c.includes('crypto')) return 'gift-cards';
        if (c.includes('gaming') || c.includes('game')) return 'gaming';
        if (c.includes('software') || c.includes('windows') || c.includes('office')) return 'software';
        if (c.includes('saas') || c.includes('ai') || c.includes('tool')) return 'saas';
        if (c.includes('stream') || c.includes('netflix') || c.includes('spotify')) return 'streaming';
        if (c.includes('iptv') || c.includes('tv')) return 'iptv';
        if (c.includes('projector')) return 'smart-projectors';
        if (c.includes('coaching') || c.includes('session')) return 'game-coaching';
        if (c.includes('companion')) return 'gamepal-companion';
        return 'gaming';
      };

      // Parse each product row
      const items = rows.slice(1).map((cols, idx) => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });

        const name = row['name'] || row['title'] || 'Untitled Product';
        const sku = row['sku'] || `PB-${row['id'] || Date.now()}-${idx}`;
        const shortDesc = row['short description'] || row['shortdescription'] || '';
        const desc = (row['description'] || shortDesc).replace(/<[^>]+>/g, '').substring(0, 500);
        const price = parseFloat(row['regular price'] || row['sale price'] || row['price'] || row['costprice'] || '29.99') || 29.99;
        const category = mapCategory(row['categories'] || row['category'] || row['categoryid'] || '');
        const stock = row['in stock?'] === '1' || row['in stock'] === '1' ? 100 : 50;
        const images = row['images'] || row['imageurl'] || row['image'] || '';
        const imageUrl = images ? images.split(',')[0].trim().replace(/^"|"$/g, '') : 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1a2604e96f45.jpg';
        const attrValues = row['attribute 1 value(s)'] || '';

        // Parse variations from attribute values like "$10 | $25 | $50 | $100"
        let variations: { type: string; value: string; costPrice: number; stock: number }[] | undefined;
        if (attrValues) {
          const parts = attrValues.split('|').map(v => v.trim()).filter(Boolean);
          if (parts.length > 0) {
            variations = parts.map(val => ({
              type: row['attribute 1 name'] || 'Denomination',
              value: val,
              costPrice: price * 0.8,
              stock: 100,
            }));
          }
        }

        return {
          externalId: sku,
          title: name,
          description: desc,
          category: category,
          costPrice: price * 0.8,
          stock: stock,
          sku: sku,
          imageUrl: imageUrl,
          productType: 'digital' as const,
          variations: variations,
        };
      });

      addToast('info', 'CSV Parsed', `${items.length} products found. Importing in batches...`);

      // Import in batches of 20 to avoid payload size limits
      const batchSize = 20;
      let totalImported = 0;

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        try {
          const res = await fetch('/api/import/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: batch, markupType: 'percentage', markupValue: 25, autoApprove: true }),
          });
          const data = await res.json();
          if (data.success) {
            totalImported += data.importJob.importedCount;
          }
        } catch {
          // Continue with next batch
        }
      }

      if (totalImported > 0) {
        addToast('success', 'CSV Imported', `${totalImported} products imported successfully. Reloading...`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        addToast('error', 'Import Failed', 'No products were imported. Check the CSV format.');
      }
    } catch {
      addToast('error', 'CSV Error', 'Could not parse the CSV file.');
    }
    setCsvUploading(false);
    e.target.value = '';
  };

  // Reset database
  const handleResetDb = async () => {
    if (!window.confirm('This will DELETE all products, orders, users, and settings. The database will be re-seeded with default data. Continue?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-db', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Database Reset', 'All data wiped and re-seeded. Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast('error', 'Reset Failed', data.error || 'Could not reset database.');
      }
    } catch {
      addToast('error', 'Reset Failed', 'Network error.');
    }
    setIsResetting(false);
  };

  // Logout super admin everywhere
  const handleLogoutEverywhere = async () => {
    if (!window.confirm('This will log out the super admin from ALL sessions and devices. Continue?')) return;
    setIsLoggingOut(true);
    try {
      // Clear Zustand auth store
      useAuthStore.getState().logout();

      // Clear StoreContext
      setCurrentUser({
        id: 'guest', name: 'Guest', email: '', role: 'customer',
        twoFactorEnabled: false, addresses: [], totalSpent: 0, ordersCount: 0,
        wishlist: [], status: 'active', createdAt: new Date().toISOString(),
      });

      addToast('info', 'Logged Out Everywhere', 'Super admin session terminated on all devices.');
      setActiveView('store');
      window.history.pushState({ view: 'store' }, '', '/');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      addToast('error', 'Logout Failed', 'Could not complete global logout.');
    }
    setIsLoggingOut(false);
  };

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

  // Migrate product variations
  // Calls /api/admin/products/migrate-variations — a dry-run first, then
  // asks for confirmation, then applies.
  const handleMigrateVariations = async () => {
    if (isMigratingVars) return;
    setIsMigratingVars(true);

    try {
      // Step 1: dry-run preview
      const previewRes = await fetch('/api/admin/products/migrate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: false }),
      });
      const preview = await previewRes.json();

      if (!preview.success) {
        addToast('error', 'Migration Failed', preview.error || 'Could not preview variations.');
        setIsMigratingVars(false);
        return;
      }

      if (preview.targeted === 0) {
        addToast('info', 'Nothing to Migrate', 'All products already have rich variations.');
        setIsMigratingVars(false);
        return;
      }

      const sampleList = preview.sample.length > 0
        ? preview.sample.map((s: any) => `• ${s.title} (${s.categoryId}) → ${s.variationsCount} variants`).join('\n')
        : '';
      const ok = window.confirm(
        `Variation Migration Preview\n\n` +
        `Scanned: ${preview.scanned}\n` +
        `Will update: ${preview.targeted}\n` +
        `Skipped (projectors / already migrated): ${preview.skipped}\n\n` +
        `Sample:\n${sampleList}\n\n` +
        `Apply changes to the database now?`
      );
      if (!ok) {
        addToast('info', 'Migration Cancelled', 'No changes were applied.');
        setIsMigratingVars(false);
        return;
      }

      // Step 2: apply
      const applyRes = await fetch('/api/admin/products/migrate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: true }),
      });
      const applied = await applyRes.json();
      if (applied.success) {
        addToast(
          'success',
          'Variations Migrated',
          `Updated ${applied.targeted} products with rich variations. Reloading…`
        );
        setTimeout(() => window.location.reload(), 1800);
      } else {
        addToast('error', 'Migration Failed', applied.error || 'Could not apply migration.');
      }
    } catch (err: any) {
      addToast('error', 'Migration Failed', err?.message || 'Network error during migration.');
    }
    setIsMigratingVars(false);
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={csvUploading}
            className="btn-glossy btn-glossy-emerald btn-glossy-sm"
          >
            {csvUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>CSV Import</span>
          </button>

          {/* Add New Product */}
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsEditorOpen(true);
            }}
            className="btn-glossy btn-glossy-yellow btn-glossy-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>

          {/* Migrate Variations */}
          <button
            onClick={handleMigrateVariations}
            disabled={isMigratingVars}
            className="btn-glossy btn-glossy-blue btn-glossy-sm"
            title="Generate category-aware variations (durations, editions, sessions) for products that currently have only the CSV-import default variation."
          >
            {isMigratingVars ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            <span>Migrate Variations</span>
          </button>

          {/* Dashboard Reset */}
          <button
            onClick={handleResetDb}
            disabled={isResetting}
            className="btn-glossy btn-glossy-red btn-glossy-sm"
          >
            {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Reset DB</span>
          </button>

          {/* Logout Super Admin Everywhere */}
          <button
            onClick={handleLogoutEverywhere}
            disabled={isLoggingOut}
            className="btn-glossy btn-glossy-dark btn-glossy-sm"
          >
            {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>Logout All</span>
          </button>
        </div>
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
