import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductType, ProductVariation } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Save,
  Projector,
  Zap,
  Truck,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductEditorModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({ product, isOpen, onClose }) => {
  const { categories, products, addProduct, updateProduct, addToast } = useStore();

  const isEditing = Boolean(product);

  const [title, setTitle] = useState(product?.title || '');
  const [sku, setSku] = useState(product?.sku || `PB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [categoryId, setCategoryId] = useState(product?.categoryId || 'gaming');
  const [productType, setProductType] = useState<ProductType>(product?.productType || 'digital');
  const [price, setPrice] = useState(product?.price || 29.99);
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice || 39.99);
  const [stock, setStock] = useState(product?.stock || 50);
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [description, setDescription] = useState(product?.description || '');
  const [imageUrl, setImageUrl] = useState(product?.images[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');

  // Variations list
  const [variations, setVariations] = useState<ProductVariation[]>(product?.variations || [
    { id: 'v1', type: 'Edition', value: 'Standard Global', price: price, stock: 50 }
  ]);

  // Projector specs
  const [nativeResolution, setNativeResolution] = useState(product?.projectorSpecs?.nativeResolution || '4K UHD (3840x2160)');
  const [brightness, setBrightness] = useState(product?.projectorSpecs?.brightness || '2800 ANSI Lumens');
  const [throwRatio, setThrowRatio] = useState(product?.projectorSpecs?.throwRatio || '0.23:1 UST');
  const [operatingSystem, setOperatingSystem] = useState(product?.projectorSpecs?.operatingSystem || 'Google TV 11.0');
  const [ram, setRam] = useState(product?.projectorSpecs?.ram || '4GB');
  const [storage, setStorage] = useState(product?.projectorSpecs?.storage || '64GB');
  const [speakerSpecs, setSpeakerSpecs] = useState(product?.projectorSpecs?.speakerSpecs || '30W Harman Kardon Dolby Atmos');

  if (!isOpen) return null;

  const handleAddVariation = () => {
    const newV: ProductVariation = {
      id: `v-${Date.now()}`,
      type: variations.length > 0 ? variations[0].type : 'Tier',
      value: `Option ${variations.length + 1}`,
      price: price,
      stock: 50
    };
    setVariations([...variations, newV]);
  };

  const handleRemoveVariation = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
  };

  const handleVariationChange = (idx: number, field: keyof ProductVariation, val: any) => {
    const updated = [...variations];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariations(updated);
  };

  // Duplicate variant detection — flag variants that share the same (type, value)
  // pair so admins can resolve them before publishing.
  const duplicateVariantKeys = new Set<string>();
  const seenVariantKeys = new Set<string>();
  variations.forEach((v) => {
    const key = `${v.type?.trim().toLowerCase()}|${v.value?.trim().toLowerCase()}`;
    if (!key || key === '|') return;
    if (seenVariantKeys.has(key)) {
      duplicateVariantKeys.add(key);
    } else {
      seenVariantKeys.add(key);
    }
  });

  const hasDuplicateVariants = duplicateVariantKeys.size > 0;

  // Duplicate SKU detection across catalog (excluding the product being edited).
  const existingSkus = products
    .filter((p) => p.id !== product?.id)
    .map((p) => p.sku.toLowerCase());
  const isDuplicateSku = sku && existingSkus.includes(sku.toLowerCase());

  // Duplicate title detection across catalog (excluding the product being edited).
  const existingTitles = products
    .filter((p) => p.id !== product?.id)
    .map((p) => p.title.trim().toLowerCase());
  const isDuplicateTitle = title && existingTitles.includes(title.trim().toLowerCase());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sku) {
      addToast('error', 'Validation Error', 'Title and SKU are required.');
      return;
    }
    if (isDuplicateSku) {
      addToast('error', 'Duplicate SKU', `Another product already uses SKU "${sku}". Please choose a unique SKU.`);
      return;
    }
    if (isDuplicateTitle) {
      addToast('error', 'Duplicate Title', `Another product already uses the title "${title}". Please choose a unique title.`);
      return;
    }
    if (hasDuplicateVariants) {
      addToast('error', 'Duplicate Variants', 'Two or more variations share the same type and value. Please make each variation unique before saving.');
      return;
    }

    const catObj = categories.find(c => c.id === categoryId);

    const newProductData: Product = {
      id: product?.id || `prod-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku,
      categoryId,
      categoryName: catObj ? catObj.name : 'Digital',
      productType,
      price: Number(price),
      compareAtPrice: Number(compareAtPrice),
      discountPercent: compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0,
      shortDescription,
      description,
      images: [imageUrl],
      status: 'published',
      stock: Number(stock),
      lowStockThreshold: 5,
      rating: product?.rating || 4.9,
      reviewCount: product?.reviewCount || 18,
      isFeatured: true,
      isTrending: true,
      tags: ['digital', categoryId, productType],
      variations: variations,
      projectorSpecs: productType === 'physical_projector' ? {
        model: sku,
        nativeResolution,
        brightness,
        throwRatio,
        screenSize: '150 Inches',
        operatingSystem,
        ram,
        storage,
        speakerSpecs,
        keystoneCorrection: 'Omnidirectional ToF Laser',
        connectivity: ['HDMI 2.1 eARC', 'Wi-Fi 6', 'Bluetooth 5.2'],
        warranty: '3-Year Official Warranty',
        shippingInfo: 'Free DHL Tracked Express (2-4 Days)'
      } : undefined,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isEditing) {
      updateProduct(newProductData);
      addToast('success', 'Product Updated', `${title} updated successfully.`);
    } else {
      addProduct(newProductData);
      addToast('success', 'Product Created', `${title} added to catalog.`);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl rounded-3xl bg-[#0F111A] border border-white/15 shadow-2xl p-6 sm:p-8 z-10 my-6 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                {productType === 'physical_projector' ? <Projector className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-display">
                  {isEditing ? 'Edit Product & Variations' : 'Create New Product'}
                </h2>
                <p className="text-xs text-neutral-400">
                  {productType === 'physical_projector' ? 'Physical Smart Projector Hardware Specification' : 'Digital License Key & Subscription Item'}
                </p>
              </div>
            </div>

            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="mt-6 space-y-6 text-xs">
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CineBeam 4K UST Laser Projector"
                  className={`w-full bg-[#141622] rounded-xl border px-3.5 py-2.5 text-xs text-white focus:outline-none ${
                    isDuplicateTitle ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-red-500/50'
                  }`}
                />
                {isDuplicateTitle && (
                  <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    A product with this title already exists. Use a unique title.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`w-full bg-[#141622] rounded-xl border px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none ${
                    isDuplicateSku ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-red-500/50'
                  }`}
                />
                {isDuplicateSku && (
                  <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    SKU already in use by another product.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Product Type</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductType)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 font-medium"
                >
                  <option value="digital">Instant Digital Key</option>
                  <option value="physical_projector">Physical Smart Projector</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Stock Level</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* 2. Pricing */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Store Price (PKR / Rs)</label>
                <input
                  type="number"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Compare At / MSRP (Rs)</label>
                <input
                  type="number"
                  step="1"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(Number(e.target.value))}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-neutral-300 font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* 3. Descriptions */}
            <div className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Short Description</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 p-3 text-xs text-white resize-none"
                />
              </div>
            </div>

            {/* 4. Variations with Duplicate Protection */}
            <div className={`p-4 rounded-2xl bg-[#141622] border space-y-3 ${
              hasDuplicateVariants ? 'border-red-500/40 bg-red-500/[0.03]' : 'border-white/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-display flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-red-400" />
                  <span>Product Variations ({variations.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Option
                </button>
              </div>

              {hasDuplicateVariants && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Duplicate variations detected — two or more variations share the same Type + Value pair.
                    Each variation must be unique to avoid cart and checkout ambiguity.
                  </span>
                </div>
              )}

              {/* Column labels */}
              {variations.length > 0 && (
                <div className="grid grid-cols-[7rem_1fr_5rem_5rem_2rem] gap-2 px-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                  <span>Type</span>
                  <span>Value</span>
                  <span>Price</span>
                  <span>Stock</span>
                  <span></span>
                </div>
              )}

              <div className="space-y-2">
                {variations.map((v, idx) => {
                  const variantKey = `${v.type?.trim().toLowerCase()}|${v.value?.trim().toLowerCase()}`;
                  const isDup = duplicateVariantKeys.has(variantKey);
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[7rem_1fr_5rem_5rem_2rem] gap-2 items-center p-1 rounded-lg ${
                        isDup ? 'bg-red-500/10 ring-1 ring-red-500/30' : ''
                      }`}
                    >
                      <input
                        type="text"
                        placeholder="Type (e.g. Duration)"
                        value={v.type}
                        onChange={(e) => handleVariationChange(idx, 'type', e.target.value)}
                        className={`w-full bg-black/50 rounded-lg border px-2.5 py-1.5 text-xs text-white ${
                          isDup ? 'border-red-500/50' : 'border-white/10'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 1 Year)"
                        value={v.value}
                        onChange={(e) => handleVariationChange(idx, 'value', e.target.value)}
                        className={`w-full bg-black/50 rounded-lg border px-2.5 py-1.5 text-xs text-white ${
                          isDup ? 'border-red-500/50' : 'border-white/10'
                        }`}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={v.price}
                        onChange={(e) => handleVariationChange(idx, 'price', Number(e.target.value))}
                        className="w-full bg-black/50 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white font-mono"
                      />
                      <input
                        type="number"
                        step="1"
                        placeholder="Stock"
                        value={v.stock ?? 0}
                        onChange={(e) => handleVariationChange(idx, 'stock', Number(e.target.value))}
                        className="w-full bg-black/50 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(idx)}
                        className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                        aria-label={`Remove variation ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Physical Projector Hardware Specs (Only if physical_projector) */}
            {productType === 'physical_projector' && (
              <div className="p-4 rounded-2xl bg-[#141622] border border-red-500/30 space-y-3">
                <div className="font-bold text-red-400 font-display flex items-center gap-1.5">
                  <Projector className="w-4 h-4" />
                  <span>Hardware Projector Specifications</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Native Resolution</label>
                    <input
                      type="text"
                      value={nativeResolution}
                      onChange={(e) => setNativeResolution(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Brightness (ANSI)</label>
                    <input
                      type="text"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Throw Ratio</label>
                    <input
                      type="text"
                      value={throwRatio}
                      onChange={(e) => setThrowRatio(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Operating System</label>
                    <input
                      type="text"
                      value={operatingSystem}
                      onChange={(e) => setOperatingSystem(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">RAM / Storage</label>
                    <input
                      type="text"
                      value={`${ram} / ${storage}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('/');
                        setRam(parts[0]?.trim() || '4GB');
                        setStorage(parts[1]?.trim() || '64GB');
                      }}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Acoustic Specs</label>
                    <input
                      type="text"
                      value={speakerSpecs}
                      onChange={(e) => setSpeakerSpecs(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold font-display shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
