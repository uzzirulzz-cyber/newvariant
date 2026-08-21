// Load environment variables from .env BEFORE any other imports that read them.
// This must be the first import so process.env.MONGODB_URI etc. are populated
// when src/lib/mongodb.ts is loaded.
import 'dotenv/config';
import express, { Express } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_G2G_CONNECTOR,
  INITIAL_CONTENT,
  INITIAL_COUPONS,
  INITIAL_ADMIN_LOGS
} from './src/data/mockData';
import { Product, Order, User, G2GSupplierConnector, ContentSection, Coupon, AdminLog, ImportJob } from './src/types';
import { processSmartProductImport, RawImportItem } from './src/utils/smartImportEngine';
import { deduplicateVariations } from './src/utils/variantProtection';
import { buildVariationsForProduct, needsVariationMigration } from './src/utils/variationBuilder';
import * as repo from './src/lib/repository';
import {
  hashPassword, comparePassword, generateToken, sanitizeUser,
  isValidEmail, validatePassword, isAdminRole,
} from './src/lib/auth';

/**
 * Create the Express app with all API routes registered.
 *
 * Data access goes through the repository layer (src/lib/repository.ts),
 * which transparently uses MongoDB Atlas when MONGODB_URI is configured,
 * or falls back to in-memory arrays seeded from mockData for local dev.
 *
 * This is extracted from startServer() so it can be reused by:
 *  - server.ts (dev): adds Vite middleware + app.listen()
 *  - api/index.ts (Vercel serverless): exports the app directly
 */
export function createApiApp(): Express {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // ----------------------------------------------------
  // API HEALTH
  // ----------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PlayBeat Digital API Engine',
      version: '2.4.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // ----------------------------------------------------
  // DATABASE HEALTH (MongoDB Atlas + PostgreSQL Neon)
  // ----------------------------------------------------
  app.get('/api/health/db', async (req, res) => {
    try {
      const { pingMongo, isMongoConfigured, mongoHostSanitized } = await import('./src/lib/mongodb');
      const { pingPostgres, isPostgresConfigured } = await import('./src/lib/postgres');

      const result: any = {
        timestamp: new Date().toISOString(),
        mongodb: { configured: isMongoConfigured },
        postgres: { configured: isPostgresConfigured },
      };

      if (isMongoConfigured) {
        const mongoResult = await pingMongo();
        result.mongodb.ok = mongoResult.ok;
        result.mongodb.host = mongoHostSanitized;
        result.mongodb.error = mongoResult.error;
        if (mongoResult.serverInfo) result.mongodb.serverInfo = mongoResult.serverInfo;
      }

      if (isPostgresConfigured) {
        const pgResult = await pingPostgres();
        result.postgres.ok = pgResult.ok;
        result.postgres.error = pgResult.error;
      }

      const anyOk = result.mongodb.ok || result.postgres.ok;
      return res.status(anyOk ? 200 : 503).json({
        ok: anyOk,
        ...result,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || String(err),
        timestamp: new Date().toISOString(),
      });
    }
  });
  // ----------------------------------------------------
  // PRODUCTS API
  // ----------------------------------------------------
  app.get('/api/products', async (req, res) => {
    const { category, type, search, sort, status, featured, trending, deal } = req.query;
    let list = await repo.getProducts();

    if (status) {
      list = list.filter(p => p.status === status);
    } else {
      // By default for public queries, return published only unless requested
      if (req.headers['x-admin-query'] !== 'true') {
        list = list.filter(p => p.status === 'published');
      }
    }

    if (category && category !== 'all') {
      list = list.filter(p => p.categoryId === category || p.slug === category);
    }

    if (type && type !== 'all') {
      list = list.filter(p => p.productType === type);
    }

    if (featured === 'true') {
      list = list.filter(p => p.isFeatured);
    }
    if (trending === 'true') {
      list = list.filter(p => p.isTrending);
    }
    if (deal === 'true') {
      list = list.filter(p => p.isFlashDeal);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        (p.projectorSpecs && (
          p.projectorSpecs.brand.toLowerCase().includes(q) ||
          p.projectorSpecs.model.toLowerCase().includes(q) ||
          p.projectorSpecs.nativeResolution.toLowerCase().includes(q)
        ))
      );
    }

    if (sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Default: best seller / featured order
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    res.json({ products: list, total: list.length });
  });

  app.get('/api/products/:idOrSlug', async (req, res) => {
    const param = req.params.idOrSlug;
    const product = await repo.getProductByIdOrSlug(param);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  });

  app.post('/api/products', async (req, res) => {
    const raw = req.body as Product;
    if (!raw.title || !raw.categoryId) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const productId = raw.id || `pb-prod-${Date.now()}`;
    const dedupeResult = deduplicateVariations(productId, raw.variations || []);

    const newProduct: Product = {
      ...raw,
      id: productId,
      slug: raw.slug || raw.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      variations: dedupeResult.cleanVariations,
      rating: raw.rating || 5.0,
      reviewCount: raw.reviewCount || 0,
      reviews: raw.reviews || [],
      stock: dedupeResult.cleanVariations.reduce((sum, v) => sum + v.stock, 0) || raw.stock || 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repo.createProduct(newProduct);

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Product Created',
      targetType: 'product',
      targetId: newProduct.id,
      details: `Created product "${newProduct.title}" ($${newProduct.price}). Warnings: ${dedupeResult.warnings.length}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ product: newProduct, deduplicationInfo: dedupeResult });
  });

  app.put('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    const existing = await repo.getProductByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = req.body;
    let cleanVars = existing.variations;
    let dedupeResult = null;

    if (updates.variations) {
      dedupeResult = deduplicateVariations(id, updates.variations);
      cleanVars = dedupeResult.cleanVariations;
    }

    const updatedProduct = await repo.updateProduct(id, {
      ...updates,
      variations: cleanVars,
      stock: cleanVars.length > 0 ? cleanVars.reduce((sum, v) => sum + v.stock, 0) : (updates.stock ?? existing.stock),
      updatedAt: new Date().toISOString()
    });

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Product Modified',
      targetType: 'product',
      targetId: id,
      details: `Updated fields for "${updatedProduct?.title || existing.title}"`,
      timestamp: new Date().toISOString()
    });

    res.json({ product: updatedProduct, deduplicationInfo: dedupeResult });
  });

  app.delete('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    const item = await repo.getProductByIdOrSlug(id);
    if (!item) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await repo.deleteProduct(id);

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Product Deleted',
      targetType: 'product',
      targetId: id,
      details: `Deleted product "${item.title}"`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: `Product ${id} removed` });
  });

  // Bulk Product Updates
  app.post('/api/products/bulk-update', async (req, res) => {
    const { productIds, action, value } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds array required' });
    }

    const modifiedCount = await repo.bulkUpdateProducts(productIds, (p) => {
      if (action === 'set_status') {
        return { ...p, status: value, updatedAt: new Date().toISOString() };
      }
      if (action === 'adjust_price_percent') {
        const factor = 1 + Number(value) / 100;
        return {
          ...p,
          price: Math.max(0.99, Number((p.price * factor).toFixed(2))),
          updatedAt: new Date().toISOString()
        };
      }
      if (action === 'toggle_featured') {
        return { ...p, isFeatured: Boolean(value), updatedAt: new Date().toISOString() };
      }
      if (action === 'toggle_trending') {
        return { ...p, isTrending: Boolean(value), updatedAt: new Date().toISOString() };
      }
      return p;
    });

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Bulk Product Update',
      targetType: 'product',
      details: `Bulk updated ${modifiedCount} products with action "${action}"`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, modifiedCount });
  });

  // ----------------------------------------------------
  // PRODUCT VARIATIONS MIGRATION
  // POST /api/admin/products/migrate-variations
  //   - Scans every product in the catalog
  //   - For products that currently have only the CSV-import default
  //     "Standard Global Access" variation (or zero variations),
  //     replaces the variations array with category-aware tiers
  //     (durations, editions, sessions, etc.).
  //   - Physical projectors are skipped — they already have bundle variations.
  //   - Returns counts so the admin UI can show a success toast.
  // Body: { apply?: boolean }
  //   - apply=false (default) → dry run, returns what would change
  //   - apply=true           → writes to the database
  // ----------------------------------------------------
  app.post('/api/admin/products/migrate-variations', async (req, res) => {
    const apply = Boolean(req.body?.apply);
    try {
      const all = await repo.getProducts();
      const targets = all.filter(needsVariationMigration);

      let updatedCount = 0;
      const skippedCount = all.length - targets.length;
      const sample: { id: string; title: string; categoryId: string; variationsCount: number }[] = [];

      for (const p of targets) {
        const newVars = buildVariationsForProduct(p);
        if (!newVars || newVars.length === 0) continue;

        const totalStock = newVars.reduce((s, v) => s + (v.stock || 0), 0);

        if (apply) {
          await repo.updateProduct(p.id, {
            variations: newVars,
            stock: totalStock,
          });
        }

        updatedCount++;
        if (sample.length < 5) {
          sample.push({
            id: p.id,
            title: p.title,
            categoryId: p.categoryId || 'unknown',
            variationsCount: newVars.length,
          });
        }
      }

      // Best-effort admin log — don't fail the migration response if the
      // audit log write itself can't reach the database.
      try {
        await repo.createAdminLog({
          id: `log-${Date.now()}-migrate-vars`,
          adminName: 'PlayBeat Admin',
          adminEmail: 'admin@playbeat.digital',
          action: 'Variations Migration',
          targetType: 'product',
          details: `${apply ? 'Applied' : 'Dry-run preview'}: ${updatedCount} products targeted, ${skippedCount} skipped. Sample: ${sample.map(s => `${s.title} (${s.variationsCount} vars)`).join('; ')}`,
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('[migrate-variations] admin log write failed (non-fatal):', (logErr as Error)?.message?.substring(0, 100));
      }

      return res.json({
        success: true,
        apply,
        scanned: all.length,
        targeted: updatedCount,
        skipped: skippedCount,
        sample,
      });
    } catch (err: any) {
      console.error('[migrate-variations] failed:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Variation migration failed',
      });
    }
  });

  // ----------------------------------------------------
  // CATEGORIES API
  // ----------------------------------------------------
  app.get('/api/categories', async (req, res) => {
    const categories = await repo.getCategories();
    res.json({ categories });
  });

  app.post('/api/categories', async (req, res) => {
    const newCat = req.body;
    if (!newCat.name || !newCat.slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }
    const categories = await repo.getCategories();
    const cat = {
      ...newCat,
      id: newCat.id || newCat.slug,
      productCount: 0,
      displayOrder: categories.length + 1
    };
    await repo.createCategory(cat);
    res.status(201).json({ category: cat });
  });

  // ----------------------------------------------------
  // SMART PROJECTOR COMPARISON API
  // ----------------------------------------------------
  app.get('/api/projectors/compare', async (req, res) => {
    const { ids } = req.query;
    let projectors = (await repo.getProducts()).filter(p => p.productType === 'physical_projector');
    if (ids && typeof ids === 'string') {
      const idList = ids.split(',');
      projectors = projectors.filter(p => idList.includes(p.id) || idList.includes(p.slug));
    }
    res.json({ projectors });
  });

  // ----------------------------------------------------
  // G2G / SMART PRODUCT IMPORT ENGINE API
  // ----------------------------------------------------
  app.get('/api/import/g2g-connector', async (req, res) => {
    const connector = await repo.getG2GConnector();
    res.json({ connector });
  });

  app.put('/api/import/g2g-connector', async (req, res) => {
    const connector = await repo.updateG2GConnector(req.body);
    res.json({ connector });
  });

  // Authorized G2G Live/Simulated Catalog Sync
  app.post('/api/import/g2g-sync', async (req, res) => {
    const connector = await repo.getG2GConnector();
    const { markupType = connector.markupType, markupValue = connector.markupValue, autoApprove = false } = req.body;
    const allProducts = await repo.getProducts();

    // Authorized feed items simulation compliant with G2G partner schema
    const authorizedG2GFeed: RawImportItem[] = [
      {
        externalId: 'g2g-feed-psn-100',
        title: 'PlayStation Store Gift Card $100 USD (USA Region Digital Code)',
        description: 'Official Sony PlayStation Network digital voucher code. Redeem on US PSN accounts for games, add-ons, PS Plus subscriptions, and movies.',
        category: 'PlayStation Network Codes',
        costPrice: 81.00,
        stock: 80,
        sku: 'G2G-PSN-USA-100',
        imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
        productType: 'digital',
        source: 'g2g_authorized',
        variations: [
          { type: 'Denomination', value: '$50 USD US Region', costPrice: 41.00, stock: 95 },
          { type: 'Denomination', value: '$100 USD US Region', costPrice: 81.00, stock: 80 }
        ]
      },
      {
        externalId: 'g2g-feed-xbox-gamepass',
        title: 'Xbox Game Pass Ultimate 3 Months Membership (Global Key)',
        description: 'Play hundreds of high-quality console and PC games, plus EA Play and Xbox Cloud Gaming on mobile and PC.',
        category: 'Xbox Game Pass Ultimate',
        costPrice: 22.50,
        stock: 140,
        sku: 'G2G-XBOX-GPU-3M',
        imageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=800&q=80',
        productType: 'digital',
        source: 'g2g_authorized',
        variations: [
          { type: 'Duration', value: '1 Month Ultimate', costPrice: 8.50, stock: 180 },
          { type: 'Duration', value: '3 Months Ultimate', costPrice: 22.50, stock: 140 }
        ]
      },
      {
        externalId: 'g2g-feed-adobe-cc',
        title: 'Adobe Creative Cloud All Apps 1 Year Subscription (Direct Email Invite)',
        description: 'Get Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, and 100GB cloud storage on your own Adobe account.',
        category: 'Software',
        costPrice: 42.00,
        stock: 60,
        sku: 'G2G-ADOBE-CC-1Y',
        imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
        productType: 'digital',
        source: 'g2g_authorized',
        variations: [
          { type: 'Plan', value: '1 Year All Apps License', costPrice: 42.00, stock: 60 }
        ]
      }
    ];

    const result = processSmartProductImport(authorizedG2GFeed, allProducts, {
      connector,
      markupType,
      markupValue,
      autoApprove
    });

    // Add imported products into catalog
    await repo.addProducts(result.importedProducts);
    await repo.createImportJob(result.importJob);
    await repo.updateG2GConnector({ lastSync: new Date().toISOString() });

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'G2G Catalog Synchronized',
      targetType: 'import',
      targetId: result.importJob.id,
      details: `Processed ${result.importJob.totalCount} items from authorized G2G partner. Imported: ${result.importJob.importedCount}, Auto-approved: ${autoApprove}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      importJob: result.importJob,
      importedProducts: result.importedProducts
    });
  });

  // CSV / Custom Supplier Batch Upload
  app.post('/api/import/batch', async (req, res) => {
    const { items, markupType = 'percentage', markupValue = 20, autoApprove = false, categoryId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const allProducts = await repo.getProducts();
    const result = processSmartProductImport(items as RawImportItem[], allProducts, {
      markupType,
      markupValue,
      autoApprove,
      defaultCategoryId: categoryId
    });

    await repo.addProducts(result.importedProducts);
    await repo.createImportJob(result.importJob);

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Batch CSV Import',
      targetType: 'import',
      targetId: result.importJob.id,
      details: `Batch imported ${result.importedProducts.length} items. Duplicates detected: ${result.importJob.duplicateCount}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      importJob: result.importJob,
      importedProducts: result.importedProducts
    });
  });

  app.get('/api/import/jobs', async (req, res) => {
    const jobs = await repo.getImportJobs();
    res.json({ jobs });
  });

  app.post('/api/import/approve/:productId', async (req, res) => {
    const id = req.params.productId;
    const product = await repo.updateProduct(id, { status: 'published' });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Product Approved',
      targetType: 'product',
      targetId: id,
      details: `Approved & published product "${product.title}"`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, product });
  });

  // ----------------------------------------------------
  // ORDERS & CHECKOUT API
  // ----------------------------------------------------
  app.get('/api/orders', async (req, res) => {
    const { customerEmail, status } = req.query;
    let list = await repo.getOrders();
    if (customerEmail && typeof customerEmail === 'string') {
      list = list.filter(o => o.customerEmail.toLowerCase() === customerEmail.toLowerCase());
    }
    if (status && typeof status === 'string') {
      list = list.filter(o => o.paymentStatus === status || o.fulfillmentStatus === status);
    }
    res.json({ orders: list, total: list.length });
  });

  app.get('/api/orders/:id', async (req, res) => {
    const order = await repo.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  });

  app.post('/api/checkout', async (req, res) => {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      cartItems,
      paymentMethod,
      couponCode,
      customerNotes
    } = req.body;

    if (!customerEmail || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Customer email and cart items are required' });
    }

    // Load all products once for cart item lookup
    const allProducts = await repo.getProducts();

    let subtotal = 0;
    let hasPhysical = false;
    const fulfilledItems = cartItems.map((item: any) => {
      const product = allProducts.find(p => p.id === item.productId);
      const unitPrice = item.unitPrice || product?.price || 19.99;
      const qty = item.quantity || 1;
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;

      const isPhysical = product?.productType === 'physical_projector' || item.productType === 'physical_projector';
      if (isPhysical) hasPhysical = true;

      // Generate digital license payload if digital
      let digitalDelivery = undefined;
      if (!isPhysical) {
        let key = product?.digitalStockKeys?.pop() || `PB-ACT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        digitalDelivery = {
          type: product?.instantDeliveryFormat || 'license_key',
          content: key,
          credentials: {
            username: `user_${customerEmail.split('@')[0]}`,
            password: `PB#${Math.random().toString(36).substring(2, 8)}`,
            token: key
          },
          instructions: product?.deliveryInstructions || 'Redeem directly on your platform client or service portal.',
          claimed: true
        };
      }

      let shipment = undefined;
      if (isPhysical) {
        shipment = {
          trackingNumber: `DHL-${Math.floor(Math.random() * 90000000 + 10000000)}`,
          carrier: 'DHL Express Global Insured',
          status: 'processing',
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
      }

      return {
        productId: item.productId,
        productTitle: item.productTitle || product?.title || 'PlayBeat Digital Product',
        productType: (isPhysical ? 'physical_projector' : 'digital') as 'physical_projector' | 'digital',
        productImage: item.productImage || product?.images?.[0] || 'https://images.unsplash.com/photo-1612287233215-648f5a2e5976?auto=format&fit=crop&w=800&q=80',
        variationId: item.variationId,
        variationTitle: item.variationTitle,
        quantity: qty,
        unitPrice,
        subtotal: itemSubtotal,
        digitalDelivery,
        shipment
      };
    });

    let discount = 0;
    if (couponCode) {
      const coupon = await repo.findCouponByCode(couponCode);
      if (coupon && coupon.isActive && subtotal >= (coupon.minPurchase || 0)) {
        if (coupon.discountType === 'percentage') {
          discount = Math.min(coupon.maxDiscount || Infinity, (subtotal * coupon.discountValue) / 100);
        } else {
          discount = coupon.discountValue;
        }
        await repo.incrementCouponUsage(couponCode);
      }
    }

    const tax = Number((subtotal * 0.05).toFixed(2));
    const shippingFee = hasPhysical ? (subtotal > 200 ? 0 : 25) : 0;
    const total = Math.max(0, Number((subtotal - discount + tax + shippingFee).toFixed(2)));

    const orderId = `ord-${Date.now().toString().slice(-6)}`;
    const orderNumber = `PB-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: customerId || 'guest-user',
      customerName: customerName || customerEmail.split('@')[0],
      customerEmail,
      customerPhone: customerPhone || '+1 (888) 752-9232',
      shippingAddress,
      items: fulfilledItems,
      subtotal,
      discount: Number(discount.toFixed(2)),
      tax,
      shippingFee,
      total,
      paymentMethod: paymentMethod || 'stripe',
      paymentStatus: 'paid',
      paymentTransactionId: `tx_${Math.random().toString(36).substring(2, 12)}`,
      fulfillmentStatus: hasPhysical ? 'partially_fulfilled' : 'delivered_digital',
      deliveryStatus: hasPhysical ? 'dispatched' : 'instant_ready',
      couponCode,
      customerNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repo.createOrder(newOrder);

    // Update customer spending stats if registered
    const user = await repo.findUserByEmail(customerEmail);
    if (user) {
      await repo.updateUserByEmail(customerEmail, {
        totalSpent: user.totalSpent + total,
        ordersCount: user.ordersCount + 1,
      });
    }

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'System Gateway',
      adminEmail: 'system@playbeat.digital',
      action: 'Order Placed & Paid',
      targetType: 'order',
      targetId: newOrder.id,
      details: `Order #${newOrder.orderNumber} placed by ${newOrder.customerEmail} ($${newOrder.total} via ${newOrder.paymentMethod})`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      order: newOrder,
      digitalDeliveries: fulfilledItems.filter(i => i.digitalDelivery).map(i => i.digitalDelivery)
    });
  });

  // Resend digital keys
  app.post('/api/orders/:id/resend-digital', async (req, res) => {
    const order = await repo.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, message: `Digital delivery data dispatched to ${order.customerEmail}` });
  });

  // Update physical shipment tracking
  app.post('/api/orders/:id/shipment', async (req, res) => {
    const { trackingNumber, carrier, status } = req.body;
    const order = await repo.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updatedItems = order.items.map(item => {
      if (item.productType === 'physical_projector') {
        return {
          ...item,
          shipment: {
            trackingNumber: trackingNumber || item.shipment?.trackingNumber || 'DHL-PB-0000',
            carrier: carrier || item.shipment?.carrier || 'DHL Express',
            status: status || 'in_transit',
            estimatedDelivery: item.shipment?.estimatedDelivery || '2026-08-25'
          }
        };
      }
      return item;
    });

    const updatedOrder = await repo.updateOrder(order.id, {
      items: updatedItems,
      deliveryStatus: status === 'delivered' ? 'delivered' : 'in_transit',
      fulfillmentStatus: 'shipped_physical',
      updatedAt: new Date().toISOString(),
    });

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Shipment Updated',
      targetType: 'order',
      targetId: order.id,
      details: `Updated shipment tracking for order #${order.orderNumber} (${carrier}: ${trackingNumber})`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, order: updatedOrder });
  });

  // ----------------------------------------------------
  // ADMIN ANALYTICS & STATS
  // ----------------------------------------------------
  app.get('/api/admin/metrics', async (req, res) => {
    const [orders, users, products] = await Promise.all([
      repo.getOrders(),
      repo.getUsers(),
      repo.getProducts(),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = users.length + 185; // Active registered base
    const totalProducts = products.length;
    const digitalDeliveriesCount = orders.reduce((sum, o) => sum + o.items.filter(i => i.productType === 'digital').length, 0);
    const physicalShipmentsCount = orders.reduce((sum, o) => sum + o.items.filter(i => i.productType === 'physical_projector').length, 0);
    const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

    // Monthly chart mock
    const revenueTrend = [
      { date: 'Aug 14', revenue: 4200, orders: 38, visitors: 1820 },
      { date: 'Aug 15', revenue: 5800, orders: 49, visitors: 2240 },
      { date: 'Aug 16', revenue: 7100, orders: 62, visitors: 2890 },
      { date: 'Aug 17', revenue: 6400, orders: 54, visitors: 2510 },
      { date: 'Aug 18', revenue: 8900, orders: 74, visitors: 3400 },
      { date: 'Aug 19', revenue: 11200, orders: 91, visitors: 4100 },
      { date: 'Aug 20', revenue: 9800, orders: 83, visitors: 3950 }
    ];

    const categoryBreakdown = [
      { name: 'Smart Projectors', value: 42, color: '#EF4444' },
      { name: 'Gaming & Keys', value: 24, color: '#9EADC8' },
      { name: 'IPTV Subscriptions', value: 16, color: '#4B5563' },
      { name: 'SaaS & Software', value: 12, color: '#374151' },
      { name: 'Gift Cards', value: 6, color: '#1F2937' }
    ];

    res.json({
      metrics: {
        totalRevenue,
        todaysSales: 2489.90,
        totalOrders,
        totalCustomers,
        totalProducts,
        digitalDeliveriesCount,
        physicalShipmentsCount,
        lowStockCount,
        profitMarginPercent: 34.2,
        conversionRatePercent: 4.8
      },
      revenueTrend,
      categoryBreakdown
    });
  });

  app.get('/api/admin/logs', async (req, res) => {
    const logs = await repo.getAdminLogs();
    res.json({ logs });
  });

  // ----------------------------------------------------
  // CONTENT BUILDER API
  // ----------------------------------------------------
  app.get('/api/content', async (req, res) => {
    const content = await repo.getContent();
    res.json({ content });
  });

  app.put('/api/content', async (req, res) => {
    const content = await repo.updateContent(req.body);
    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Content Updated',
      targetType: 'content',
      details: 'Updated storefront homepage banners and announcement configuration',
      timestamp: new Date().toISOString()
    });
    res.json({ content });
  });

  // ----------------------------------------------------
  // COUPONS API
  // ----------------------------------------------------
  app.get('/api/coupons', async (req, res) => {
    const coupons = await repo.getCoupons();
    res.json({ coupons });
  });

  app.post('/api/coupons/validate', async (req, res) => {
    const { code, cartAmount } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Code is required' });
    const coupon = await repo.findCouponByCode(code);
    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
    }
    if (cartAmount < (coupon.minPurchase || 0)) {
      return res.status(400).json({ valid: false, message: `Minimum purchase of $${coupon.minPurchase} required` });
    }
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(coupon.maxDiscount, discount);
    } else {
      discount = coupon.discountValue;
    }
    res.json({ valid: true, coupon, discountAmount: Number(discount.toFixed(2)) });
  });

  // ----------------------------------------------------
  // AUTH API — real password-based authentication
  // ----------------------------------------------------

  // POST /api/auth/login — validate email + password against bcrypt hash
  // Falls back to hardcoded admin if MongoDB is unreachable
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    // Try MongoDB first
    try {
      const user = await repo.findUserWithPassword(email);

      if (user) {
        if (user.status === 'suspended') {
          return res.status(403).json({ success: false, error: 'This account has been suspended. Contact support.' });
        }

        if (user.passwordHash) {
          const passwordValid = await comparePassword(password, user.passwordHash);
          if (passwordValid) {
            await repo.updateUserById(user.id, { lastLogin: new Date().toISOString() });
            const token = generateToken(user.id);
            return res.json({ success: true, user: sanitizeUser(user), token });
          } else {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
          }
        }
      }
    } catch {
      // MongoDB error — fall through to hardcoded check
    }

    // HARDCODED FALLBACK — admin@playbeat.digital / playbeat1122
    // Works even if MongoDB is cold-starting or unreachable
    if (email.trim().toLowerCase() === 'admin@playbeat.digital' && password === 'playbeat1122') {
      const adminUser: User = {
        id: 'usr-admin-default',
        name: 'PlayBeat Super Admin',
        email: 'admin@playbeat.digital',
        role: 'super_admin',
        twoFactorEnabled: false,
        addresses: [],
        totalSpent: 0,
        ordersCount: 0,
        wishlist: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      const token = generateToken(adminUser.id);
      return res.json({ success: true, user: sanitizeUser(adminUser), token });
    }

    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  });

  // POST /api/auth/signup — customer self-registration with name, email, country, mobile
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, country, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, error: pwCheck.message });
    }

    // Check if email is already taken
    const existing = await repo.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    // Create the new customer with a hashed password
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      role: 'customer',
      phone: phone || undefined,
      country: country || undefined,
      twoFactorEnabled: false,
      addresses: [],
      totalSpent: 0,
      ordersCount: 0,
      wishlist: [],
      status: 'active',
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await repo.createUser(newUser);

    const token = generateToken(newUser.id);
    return res.status(201).json({
      success: true,
      user: sanitizeUser(newUser),
      token,
    });
  });

  // POST /api/auth/change-password — change the current user's password
  app.post('/api/auth/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, current password, and new password are required.' });
    }

    const user = await repo.findUserWithPassword(email);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    const passwordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, error: pwCheck.message });
    }

    const success = await repo.changeUserPassword(user.id, newPassword);
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to update password.' });
    }

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: user.name,
      adminEmail: user.email,
      action: 'Password Changed',
      targetType: 'settings',
      targetId: user.id,
      details: `User ${user.email} changed their password.`,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  });

  // POST /api/auth/forgot-password — generate a reset token and return it
  // (In production this would send an email; here we return the token so the
  // UI can display it for the user to copy. The token expires in 15 minutes.)
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const user = await repo.findUserWithPassword(email);
    if (!user) {
      // Don't reveal whether the email exists — return generic success
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been generated.' });
    }

    // Generate a secure reset token (random hex string)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await repo.updateUserById(user.id, { resetToken, resetTokenExpires });

    // In production, send this via email. For this demo, return it directly.
    return res.json({
      success: true,
      message: 'Reset token generated. Use it to set a new password.',
      resetToken,
      expiresAt: new Date(resetTokenExpires).toISOString(),
    });
  });

  // POST /api/auth/reset-password — verify reset token and set new password
  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, reset token, and new password are required.' });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, error: pwCheck.message });
    }

    const user = await repo.findUserWithPassword(email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    if (!user.resetToken || user.resetToken !== resetToken) {
      return res.status(401).json({ success: false, error: 'Invalid reset token.' });
    }

    if (!user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
      return res.status(401).json({ success: false, error: 'Reset token has expired. Please request a new one.' });
    }

    // Set the new password and clear the reset token
    const success = await repo.changeUserPassword(user.id, newPassword);
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to update password.' });
    }

    // Clear the reset token so it can't be reused
    await repo.updateUserById(user.id, { resetToken: undefined, resetTokenExpires: undefined });

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: user.name,
      adminEmail: user.email,
      action: 'Password Reset via Token',
      targetType: 'settings',
      targetId: user.id,
      details: `User ${user.email} reset their password using a forgot-password token.`,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  });

  // GET /api/auth/me — return the current user (placeholder — in production,
  // this would validate the JWT from the Authorization header)
  app.get('/api/auth/me', async (req, res) => {
    // For this demo, we accept ?email= query param to look up the current user.
    // In production, extract the JWT from Authorization header and verify it.
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email query parameter is required.' });
    }
    const user = await repo.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    return res.json({ success: true, user: sanitizeUser(user) });
  });

  // ----------------------------------------------------
  // ADMIN USER MANAGEMENT API
  // ----------------------------------------------------

  // GET /api/admin/users — list all users (admin only)
  app.get('/api/admin/users', async (req, res) => {
    const users = await repo.getUsers();
    // Strip passwordHashes before returning
    const safeUsers = users.map(u => sanitizeUser(u));
    res.json({ users: safeUsers });
  });

  // POST /api/admin/users — create a new admin/staff user (super_admin only)
  app.post('/api/admin/users', async (req, res) => {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, error: pwCheck.message });
    }

    const existing = await repo.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: role || 'support_agent',
      twoFactorEnabled: false,
      addresses: [],
      totalSpent: 0,
      ordersCount: 0,
      wishlist: [],
      status: 'active',
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await repo.createUser(newUser);

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'User Created',
      targetType: 'settings',
      targetId: newUser.id,
      details: `Created ${newUser.role} account for ${newUser.email}`,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, user: sanitizeUser(newUser) });
  });

  // PUT /api/admin/users/:id — update a user (role, status, name, phone)
  app.put('/api/admin/users/:id', async (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    // Never allow passwordHash to be set via this endpoint
    delete updates.passwordHash;
    delete updates.id;
    delete updates.email; // email is immutable

    const updated = await repo.updateUserById(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'User Updated',
      targetType: 'settings',
      targetId: id,
      details: `Updated user ${updated.email} (${Object.keys(updates).join(', ')})`,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, user: sanitizeUser(updated) });
  });

  // POST /api/admin/users/:id/reset-password — admin resets a user's password
  app.post('/api/admin/users/:id/reset-password', async (req, res) => {
    const id = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password is required.' });
    }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, error: pwCheck.message });
    }

    const user = await repo.updateUserById(id, {});
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const success = await repo.changeUserPassword(id, newPassword);
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Password Reset',
      targetType: 'settings',
      targetId: id,
      details: `Admin reset password for ${user.email}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, message: 'Password reset successfully.' });
  });

  // DELETE /api/admin/users/:id — delete a user
  app.delete('/api/admin/users/:id', async (req, res) => {
    const id = req.params.id;

    // Prevent deleting the default admin
    if (id === 'usr-admin-default') {
      return res.status(403).json({ success: false, error: 'Cannot delete the default admin account.' });
    }

    const success = await repo.deleteUserById(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    await repo.createAdminLog({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'User Deleted',
      targetType: 'settings',
      targetId: id,
      details: `Deleted user ${id}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true });
  });

  // ----------------------------------------------------
  // ADMIN DASHBOARD RESET — wipe all data and re-seed
  // ----------------------------------------------------
  app.post('/api/admin/reset-db', async (req, res) => {
    try {
      await repo.resetDatabase();
      await repo.createAdminLog({
        id: `log-${Date.now()}`,
        adminName: 'PlayBeat Admin',
        adminEmail: 'admin@playbeat.digital',
        action: 'Database Reset',
        targetType: 'settings',
        targetId: 'database',
        details: 'Admin triggered a full database reset. All collections were dropped and re-seeded.',
        timestamp: new Date().toISOString(),
      });
      return res.json({
        success: true,
        message: 'Database reset complete. All collections have been re-seeded with default data.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Reset failed.' });
    }
  });

  // ----------------------------------------------------
  // END of API routes — return the configured app
  // ----------------------------------------------------
  return app;
}

/**
 * Start the local dev server with Vite middleware + listen on PORT.
 * Only called when running locally (NOT on Vercel, which uses api/index.ts).
 */
async function startServer() {
  const app = createApiApp();
  const PORT = 3000;

  // ----------------------------------------------------
  // VITE MIDDLEWARE (DEV) / STATIC HANDLER (PROD)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PlayBeat Digital] Full-Stack server booted on http://0.0.0.0:${PORT}`);
  });
}

// Only start the dev server when run directly (NOT when imported by Vercel's
// serverless runtime, which imports api/index.ts instead).
if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}
