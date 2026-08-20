import express from 'express';
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

// In-Memory Database Storage
let dbCategories = [...INITIAL_CATEGORIES];
let dbProducts: Product[] = [...INITIAL_PRODUCTS];
let dbUsers: User[] = [...INITIAL_USERS];
let dbOrders: Order[] = [...INITIAL_ORDERS];
let dbG2GConnector: G2GSupplierConnector = { ...INITIAL_G2G_CONNECTOR };
let dbContent: ContentSection = { ...INITIAL_CONTENT };
let dbCoupons: Coupon[] = [...INITIAL_COUPONS];
let dbAdminLogs: AdminLog[] = [...INITIAL_ADMIN_LOGS];
let dbImportJobs: ImportJob[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

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
  // PRODUCTS API
  // ----------------------------------------------------
  app.get('/api/products', (req, res) => {
    const { category, type, search, sort, status, featured, trending, deal } = req.query;
    let list = [...dbProducts];

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

  app.get('/api/products/:idOrSlug', (req, res) => {
    const param = req.params.idOrSlug;
    const product = dbProducts.find(p => p.id === param || p.slug === param);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  });

  app.post('/api/products', (req, res) => {
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

    dbProducts.unshift(newProduct);

    dbAdminLogs.unshift({
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

  app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const index = dbProducts.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = req.body;
    let cleanVars = dbProducts[index].variations;
    let dedupeResult = null;

    if (updates.variations) {
      dedupeResult = deduplicateVariations(id, updates.variations);
      cleanVars = dedupeResult.cleanVariations;
    }

    dbProducts[index] = {
      ...dbProducts[index],
      ...updates,
      variations: cleanVars,
      stock: cleanVars.length > 0 ? cleanVars.reduce((sum, v) => sum + v.stock, 0) : (updates.stock ?? dbProducts[index].stock),
      updatedAt: new Date().toISOString()
    };

    dbAdminLogs.unshift({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Product Modified',
      targetType: 'product',
      targetId: id,
      details: `Updated fields for "${dbProducts[index].title}"`,
      timestamp: new Date().toISOString()
    });

    res.json({ product: dbProducts[index], deduplicationInfo: dedupeResult });
  });

  app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const item = dbProducts.find(p => p.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Product not found' });
    }

    dbProducts = dbProducts.filter(p => p.id !== id);

    dbAdminLogs.unshift({
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
  app.post('/api/products/bulk-update', (req, res) => {
    const { productIds, action, value } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds array required' });
    }

    let modifiedCount = 0;
    dbProducts = dbProducts.map(p => {
      if (!productIds.includes(p.id)) return p;
      modifiedCount++;
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

    dbAdminLogs.unshift({
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
  // CATEGORIES API
  // ----------------------------------------------------
  app.get('/api/categories', (req, res) => {
    res.json({ categories: dbCategories });
  });

  app.post('/api/categories', (req, res) => {
    const newCat = req.body;
    if (!newCat.name || !newCat.slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }
    const cat = {
      ...newCat,
      id: newCat.id || newCat.slug,
      productCount: 0,
      displayOrder: dbCategories.length + 1
    };
    dbCategories.push(cat);
    res.status(201).json({ category: cat });
  });

  // ----------------------------------------------------
  // SMART PROJECTOR COMPARISON API
  // ----------------------------------------------------
  app.get('/api/projectors/compare', (req, res) => {
    const { ids } = req.query;
    let projectors = dbProducts.filter(p => p.productType === 'physical_projector');
    if (ids && typeof ids === 'string') {
      const idList = ids.split(',');
      projectors = projectors.filter(p => idList.includes(p.id) || idList.includes(p.slug));
    }
    res.json({ projectors });
  });

  // ----------------------------------------------------
  // G2G / SMART PRODUCT IMPORT ENGINE API
  // ----------------------------------------------------
  app.get('/api/import/g2g-connector', (req, res) => {
    res.json({ connector: dbG2GConnector });
  });

  app.put('/api/import/g2g-connector', (req, res) => {
    dbG2GConnector = {
      ...dbG2GConnector,
      ...req.body,
      lastSync: new Date().toISOString()
    };
    res.json({ connector: dbG2GConnector });
  });

  // Authorized G2G Live/Simulated Catalog Sync
  app.post('/api/import/g2g-sync', (req, res) => {
    const { markupType = dbG2GConnector.markupType, markupValue = dbG2GConnector.markupValue, autoApprove = false } = req.body;

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

    const result = processSmartProductImport(authorizedG2GFeed, dbProducts, {
      connector: dbG2GConnector,
      markupType,
      markupValue,
      autoApprove
    });

    // Add imported products into catalog
    dbProducts = [...result.importedProducts, ...dbProducts];
    dbImportJobs.unshift(result.importJob);
    dbG2GConnector.lastSync = new Date().toISOString();

    dbAdminLogs.unshift({
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
  app.post('/api/import/batch', (req, res) => {
    const { items, markupType = 'percentage', markupValue = 20, autoApprove = false, categoryId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const result = processSmartProductImport(items as RawImportItem[], dbProducts, {
      markupType,
      markupValue,
      autoApprove,
      defaultCategoryId: categoryId
    });

    dbProducts = [...result.importedProducts, ...dbProducts];
    dbImportJobs.unshift(result.importJob);

    dbAdminLogs.unshift({
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

  app.get('/api/import/jobs', (req, res) => {
    res.json({ jobs: dbImportJobs });
  });

  app.post('/api/import/approve/:productId', (req, res) => {
    const id = req.params.productId;
    const index = dbProducts.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    dbProducts[index].status = 'published';
    dbProducts[index].updatedAt = new Date().toISOString();

    dbAdminLogs.unshift({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Product Approved',
      targetType: 'product',
      targetId: id,
      details: `Approved & published product "${dbProducts[index].title}"`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, product: dbProducts[index] });
  });

  // ----------------------------------------------------
  // ORDERS & CHECKOUT API
  // ----------------------------------------------------
  app.get('/api/orders', (req, res) => {
    const { customerEmail, status } = req.query;
    let list = [...dbOrders];
    if (customerEmail && typeof customerEmail === 'string') {
      list = list.filter(o => o.customerEmail.toLowerCase() === customerEmail.toLowerCase());
    }
    if (status && typeof status === 'string') {
      list = list.filter(o => o.paymentStatus === status || o.fulfillmentStatus === status);
    }
    res.json({ orders: list, total: list.length });
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = dbOrders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  });

  app.post('/api/checkout', (req, res) => {
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

    let subtotal = 0;
    let hasPhysical = false;
    const fulfilledItems = cartItems.map((item: any) => {
      const product = dbProducts.find(p => p.id === item.productId);
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
      const coupon = dbCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (coupon && subtotal >= coupon.minPurchase) {
        if (coupon.discountType === 'percentage') {
          discount = Math.min(coupon.maxDiscount || Infinity, (subtotal * coupon.discountValue) / 100);
        } else {
          discount = coupon.discountValue;
        }
        coupon.usageCount++;
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

    dbOrders.unshift(newOrder);

    // Update customer spending stats if registered
    const userIndex = dbUsers.findIndex(u => u.email.toLowerCase() === customerEmail.toLowerCase());
    if (userIndex !== -1) {
      dbUsers[userIndex].totalSpent += total;
      dbUsers[userIndex].ordersCount += 1;
    }

    dbAdminLogs.unshift({
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
  app.post('/api/orders/:id/resend-digital', (req, res) => {
    const order = dbOrders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, message: `Digital delivery data dispatched to ${order.customerEmail}` });
  });

  // Update physical shipment tracking
  app.post('/api/orders/:id/shipment', (req, res) => {
    const { trackingNumber, carrier, status } = req.body;
    const order = dbOrders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.items = order.items.map(item => {
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

    order.deliveryStatus = status === 'delivered' ? 'delivered' : 'in_transit';
    order.fulfillmentStatus = 'shipped_physical';
    order.updatedAt = new Date().toISOString();

    dbAdminLogs.unshift({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Shipment Updated',
      targetType: 'order',
      targetId: order.id,
      details: `Updated shipment tracking for order #${order.orderNumber} (${carrier}: ${trackingNumber})`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, order });
  });

  // ----------------------------------------------------
  // ADMIN ANALYTICS & STATS
  // ----------------------------------------------------
  app.get('/api/admin/metrics', (req, res) => {
    const totalRevenue = dbOrders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
    const totalOrders = dbOrders.length;
    const totalCustomers = dbUsers.length + 185; // Active registered base
    const totalProducts = dbProducts.length;
    const digitalDeliveriesCount = dbOrders.reduce((sum, o) => sum + o.items.filter(i => i.productType === 'digital').length, 0);
    const physicalShipmentsCount = dbOrders.reduce((sum, o) => sum + o.items.filter(i => i.productType === 'physical_projector').length, 0);
    const lowStockCount = dbProducts.filter(p => p.stock <= p.lowStockThreshold).length;

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

  app.get('/api/admin/logs', (req, res) => {
    res.json({ logs: dbAdminLogs });
  });

  // ----------------------------------------------------
  // CONTENT BUILDER API
  // ----------------------------------------------------
  app.get('/api/content', (req, res) => {
    res.json({ content: dbContent });
  });

  app.put('/api/content', (req, res) => {
    dbContent = { ...dbContent, ...req.body };
    dbAdminLogs.unshift({
      id: `log-${Date.now()}`,
      adminName: 'PlayBeat Admin',
      adminEmail: 'admin@playbeat.digital',
      action: 'Content Updated',
      targetType: 'content',
      details: 'Updated storefront homepage banners and announcement configuration',
      timestamp: new Date().toISOString()
    });
    res.json({ content: dbContent });
  });

  // ----------------------------------------------------
  // COUPONS API
  // ----------------------------------------------------
  app.get('/api/coupons', (req, res) => {
    res.json({ coupons: dbCoupons });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const { code, cartAmount } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Code is required' });
    const coupon = dbCoupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
    }
    if (cartAmount < coupon.minPurchase) {
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
  // AUTH API
  // ----------------------------------------------------
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = dbUsers.find(u => u.email.toLowerCase() === email?.toLowerCase());
    if (user) {
      return res.json({
        success: true,
        user,
        token: `pb_jwt_${user.id}_${Date.now()}`
      });
    }
    // Auto register as customer if not found for testing demo
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: email.includes('admin') ? 'super_admin' : 'customer',
      twoFactorEnabled: false,
      addresses: [],
      totalSpent: 0,
      ordersCount: 0,
      wishlist: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };
    dbUsers.push(newUser);
    res.json({
      success: true,
      user: newUser,
      token: `pb_jwt_${newUser.id}_${Date.now()}`
    });
  });

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

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
