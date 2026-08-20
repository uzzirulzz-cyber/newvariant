import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  User,
  Order,
  OrderStatus,
  ContentSection,
  Coupon,
  G2GSupplierConnector,
  ImportJob,
  AdminLog,
  ProductVariation,
  ProductType,
  NavItem
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_CONTENT,
  INITIAL_G2G_CONNECTOR,
  INITIAL_COUPONS,
  INITIAL_ADMIN_LOGS,
  INITIAL_NAV_ITEMS
} from '../data/mockData';

export interface CartItem {
  productId: string;
  product: Product;
  variation?: ProductVariation;
  quantity: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface G2GSettingsState {
  status: 'connected' | 'disconnected' | 'testing';
  apiKey: string;
  marginMarkupPercent: number;
  environment: 'production' | 'sandbox';
  autoSync: boolean;
  currency: string;
  lastSyncedAt: string;
}

export interface StoreContextType {
  // Store state
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  productTypeFilter: 'all' | 'digital' | 'physical_projector';
  setProductTypeFilter: (t: 'all' | 'digital' | 'physical_projector') => void;
  
  // Navigation Customization (Storefront & Admin)
  navItems: NavItem[];
  setNavItems: React.Dispatch<React.SetStateAction<NavItem[]>>;
  addNavItem: (item: Omit<NavItem, 'id'>) => void;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  deleteNavItem: (id: string) => void;
  reorderNavItems: (items: NavItem[]) => void;
  toggleNavItemActive: (id: string) => void;
  activePromoFilter: string;
  setActivePromoFilter: (filter: string) => void;
  
  // Modals & Navigation
  activeView: 'store' | 'admin';
  setActiveView: (v: 'store' | 'admin') => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isCustomerPortalOpen: boolean;
  setIsCustomerPortalOpen: (open: boolean) => void;
  isWhatsAppModalOpen: boolean;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  
  // Cart & Wishlist
  cart: CartItem[];
  addToCart: (product: Product, variation?: ProductVariation, quantity?: number) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateCartQuantity: (productId: string, variationId: string | undefined, qty: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;
  isInCart: (productId: string, variationId?: string) => boolean;
  
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  
  // Projector Comparison
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  
  // Auth
  currentUser: User;
  switchUserRole: (role: User['role']) => void;
  setCurrentUser: (u: User) => void;
  
  // Orders
  orders: Order[];
  createOrder: (orderData: any) => Promise<Order>;
  updateOrderShipment: (orderId: string, trackingNumber: string, carrier: string, status: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  // Content & Coupons
  content: ContentSection;
  updateContent: (newContent: Partial<ContentSection>) => void;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  
  // Admin Data & Sourcing
  g2gConnector: G2GSupplierConnector;
  g2gSettings: G2GSettingsState;
  updateG2GConnector: (conn: Partial<G2GSupplierConnector>) => void;
  updateG2GSettings: (settings: Partial<G2GSettingsState>) => void;
  syncG2GCatalog: () => Promise<void>;
  importJobs: ImportJob[];
  adminLogs: AdminLog[];
  refreshProducts: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (productOrId: Product | string, maybeUpdates?: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  approveProduct: (id: string) => void;
  cleanAllProductVariations: () => void;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  
  // Currency
  currency: { code: string; symbol: string; rate: number };
  setCurrency: (c: { code: string; symbol: string; rate: number }) => void;
  formatPrice: (usdPrice: number) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'digital' | 'physical_projector'>('all');
  const [navItems, setNavItems] = useState<NavItem[]>(INITIAL_NAV_ITEMS);
  const [activePromoFilter, setActivePromoFilter] = useState<string>('all');
  
  const [activeView, setActiveView] = useState<'store' | 'admin'>('store');
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([
    {
      productId: INITIAL_PRODUCTS[0].id,
      product: INITIAL_PRODUCTS[0],
      variation: INITIAL_PRODUCTS[0].variations[0],
      quantity: 1
    }
  ]);
  
  const [wishlist, setWishlist] = useState<string[]>([INITIAL_PRODUCTS[1].id]);
  const [compareList, setCompareList] = useState<Product[]>([INITIAL_PRODUCTS[0], INITIAL_PRODUCTS[1]]);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Super Admin for easy testing
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [content, setContent] = useState<ContentSection>(INITIAL_CONTENT);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [g2gConnector, setG2GConnector] = useState<G2GSupplierConnector>(INITIAL_G2G_CONNECTOR);
  
  const [g2gSettings, setG2GSettings] = useState<G2GSettingsState>({
    status: 'connected',
    apiKey: 'g2g_live_sec_894208914891',
    marginMarkupPercent: 18,
    environment: 'production',
    autoSync: true,
    currency: 'USD',
    lastSyncedAt: new Date().toISOString()
  });

  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>(INITIAL_ADMIN_LOGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [currency, setCurrency] = useState({ code: 'PKR', symbol: 'Rs ', rate: 1 });

  // Initial fetch from backend if running
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(() => {});

    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      })
      .catch(() => {});
  }, []);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const formatPrice = (pkrPrice: number): string => {
    const safePrice = Number(pkrPrice) || 0;
    const converted = safePrice * currency.rate;
    if (currency.code === 'PKR') {
      return `${currency.symbol}${Math.round(converted).toLocaleString('en-US')}`;
    }
    return `${currency.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const addToCart = (product: Product, variation?: ProductVariation, quantity: number = 1) => {
    const activeVar = variation || (product.variations && product.variations.length > 0 ? product.variations[0] : undefined);

    // Check if this exact product + variation is already in the cart
    // so we can give the user clearer feedback (quantity updated vs. added).
    const alreadyInCart = cart.some(item =>
      item.productId === product.id &&
      (activeVar ? item.variation?.id === activeVar.id : !item.variation)
    );

    setCart(prev => {
      const existingIdx = prev.findIndex(item =>
        item.productId === product.id &&
        (activeVar ? item.variation?.id === activeVar.id : true)
      );

      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + quantity,
        };
        return copy;
      } else {
        return [...prev, { productId: product.id, product, variation: activeVar, quantity }];
      }
    });

    if (alreadyInCart) {
      addToast('info', 'Quantity Updated', `${product.title} (${activeVar ? activeVar.value : 'Default'}) quantity increased to ${cart.find(i => i.productId === product.id)?.quantity ? (cart.find(i => i.productId === product.id)!.quantity + quantity) : quantity}.`);
    } else {
      addToast('success', 'Added to Cart', `${product.title} (${activeVar ? activeVar.value : 'Default'}) added.`);
    }
  };

  // Helper for the UI to know if a product+variation is already in the cart
  const isInCart = (productId: string, variationId?: string): boolean => {
    return cart.some(item =>
      item.productId === productId &&
      (variationId ? item.variation?.id === variationId : !item.variation)
    );
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && (variationId ? item.variation?.id === variationId : true))));
    addToast('info', 'Item Removed', 'Product removed from your cart.');
  };

  const updateCartQuantity = (productId: string, variationId: string | undefined, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, variationId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.productId === productId && (variationId ? item.variation?.id === variationId : true)) {
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.variation ? item.variation.price : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        addToast('info', 'Wishlist Updated', 'Item removed from your wishlist.');
        return prev.filter(id => id !== productId);
      } else {
        addToast('success', 'Wishlist Updated', 'Item saved to your wishlist.');
        return [...prev, productId];
      }
    });
  };

  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        addToast('info', 'Comparison List', `Removed ${product.title} from comparison.`);
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          addToast('warning', 'Comparison Limit', 'You can compare up to 4 projectors at once.');
          return prev;
        }
        addToast('success', 'Added to Compare', `${product.title} added for side-by-side comparison.`);
        return [...prev, product];
      }
    });
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const switchUserRole = (role: User['role']) => {
    setCurrentUser(prev => ({
      ...prev,
      role,
      name: role === 'super_admin' ? 'PlayBeat Super Admin' : role === 'product_manager' ? 'Product Lead' : 'Valued Customer',
      email: role === 'super_admin' ? 'admin@playbeat.digital' : 'customer@playbeat.digital'
    }));
    addToast('info', 'Role Switched', `Active session switched to ${role.replace('_', ' ').toUpperCase()}`);
  };

  const applyCoupon = (code: string) => {
    const found = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && (c.isActive !== false && c.status !== 'expired'));
    if (!found) {
      addToast('error', 'Invalid Coupon', 'The promo code entered does not exist or has expired.');
      return { success: false, message: 'Invalid or expired promo code.' };
    }
    const minP = found.minPurchase || found.minOrderAmount || 0;
    if (cartSubtotal < minP) {
      const msg = `Minimum purchase of ${formatPrice(minP)} required for this coupon.`;
      addToast('warning', 'Coupon Requirement', msg);
      return { success: false, message: msg };
    }
    setAppliedCoupon(found);
    addToast('success', 'Promo Code Applied', `Coupon "${found.code}" applied successfully!`);
    return { success: true, message: 'Coupon applied.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('info', 'Coupon Removed', 'Promo discount cleared.');
  };

  const addCoupon = (newC: Coupon) => {
    setCoupons(prev => [newC, ...prev]);
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    addToast('info', 'Coupon Deleted', 'Promo code removed.');
  };

  const createOrder = async (orderData: any): Promise<Order> => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (data.order) {
        setOrders(prev => [data.order, ...prev]);
        clearCart();
        setAppliedCoupon(null);
        addToast('success', 'Order Confirmed!', `Order #${data.order.orderNumber || data.order.id} successfully processed.`);
        return data.order;
      }
    } catch (e) {
      console.error('Checkout error:', e);
    }

    // Fallback in-memory order creation
    const hasPhysical = cart.some(i => i.product.productType === 'physical_projector');
    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-6)}`,
      orderNumber: `PB-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      userId: currentUser.id,
      customerId: currentUser.id,
      customerName: orderData.customerName || currentUser.name,
      customerEmail: orderData.customerEmail || currentUser.email,
      customerPhone: orderData.customerPhone || '+1 (888) 752-9232',
      shippingAddress: orderData.shippingAddress,
      items: cart.map(item => ({
        productId: item.product.id,
        productTitle: item.product.title,
        productType: item.product.productType,
        productImage: item.product.images[0],
        variationId: item.variation?.id,
        variationTitle: item.variation?.value,
        variation: item.variation,
        quantity: item.quantity,
        unitPrice: item.variation ? item.variation.price : item.product.price,
        subtotal: (item.variation ? item.variation.price : item.product.price) * item.quantity,
        totalPrice: (item.variation ? item.variation.price : item.product.price) * item.quantity,
        licenseKeys: item.product.productType === 'digital' ? [
          `PB-ACT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        ] : undefined,
        trackingNumber: item.product.productType === 'physical_projector' ? `DHL-${Math.floor(Math.random() * 90000000 + 10000000)}` : undefined,
        digitalDelivery: item.product.productType === 'digital' ? {
          type: item.product.instantDeliveryFormat || 'license_key',
          content: `PB-ACT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          instructions: item.product.deliveryInstructions || 'Redeem on client application.',
          claimed: true
        } : undefined,
        shipment: item.product.productType === 'physical_projector' ? {
          trackingNumber: `DHL-PB-${Math.floor(Math.random() * 90000000 + 10000000)}`,
          carrier: 'DHL Express Global Insured',
          status: 'processing',
          estimatedDelivery: '2026-08-25'
        } : undefined
      })),
      subtotal: cartSubtotal,
      discount: appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? (cartSubtotal * appliedCoupon.discountValue) / 100 : appliedCoupon.discountValue) : 0,
      tax: Number((cartSubtotal * 0.05).toFixed(2)),
      shippingFee: hasPhysical ? 0 : 0,
      total: Number((cartSubtotal * 1.05).toFixed(2)),
      paymentMethod: orderData.paymentMethod || 'stripe',
      paymentGateway: orderData.paymentMethod || 'stripe',
      paymentStatus: 'paid',
      paymentTransactionId: `tx_${Math.random().toString(36).substring(2, 10)}`,
      fulfillmentStatus: hasPhysical ? 'partially_fulfilled' : 'delivered_digital',
      deliveryStatus: hasPhysical ? 'dispatched' : 'instant_ready',
      orderStatus: 'completed',
      couponCode: appliedCoupon?.code,
      customerNotes: orderData.customerNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    setAppliedCoupon(null);
    addToast('success', 'Order Confirmed!', `Order #${newOrder.orderNumber} successfully processed.`);
    return newOrder;
  };

  const updateOrderShipment = (orderId: string, trackingNumber: string, carrier: string, status: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          deliveryStatus: status === 'delivered' ? 'delivered' : 'in_transit',
          fulfillmentStatus: 'shipped_physical',
          items: o.items.map(item => {
            if (item.productType === 'physical_projector') {
              return {
                ...item,
                trackingNumber,
                shipment: {
                  trackingNumber,
                  carrier,
                  status,
                  estimatedDelivery: '2026-08-25'
                }
              };
            }
            return item;
          })
        };
      }
      return o;
    }));
    addToast('success', 'Shipment Dispatched', `Tracking ${trackingNumber} updated.`);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: status } : o));
    addToast('success', 'Order Status Updated', `Order #${orderId} set to ${status}.`);
  };

  const updateContent = (newContent: Partial<ContentSection>) => {
    setContent(prev => ({ ...prev, ...newContent }));
    fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContent)
    }).catch(() => {});
    addToast('success', 'Storefront Updated', 'Homepage banners and announcements updated.');
  };

  const updateG2GConnector = (conn: Partial<G2GSupplierConnector>) => {
    setG2GConnector(prev => ({ ...prev, ...conn }));
    fetch('/api/import/g2g-connector', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conn)
    }).catch(() => {});
    addToast('success', 'G2G Configuration Saved', 'Supplier markup & category sync settings updated.');
  };

  const updateG2GSettings = (settings: Partial<G2GSettingsState>) => {
    setG2GSettings(prev => ({ ...prev, ...settings }));
    addToast('success', 'Wholesale Settings Saved', 'G2G profit margin and sync frequency updated.');
  };

  const syncG2GCatalog = async () => {
    try {
      const res = await fetch('/api/import/g2g-sync', { method: 'POST' });
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.warn('API sync fallback to client simulation');
    }
    setG2GSettings(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
    addToast('success', 'Catalog Synchronized', 'Wholesale products & live stock updated from G2G supplier.');
  };

  const cleanAllProductVariations = () => {
    setProducts(prev => prev.map(p => {
      if (!p.variations || p.variations.length <= 1) return p;
      const seen = new Set<string>();
      const clean: ProductVariation[] = [];
      for (const v of p.variations) {
        const key = `${v.type.toLowerCase().trim()}_${v.value.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          clean.push(v);
        }
      }
      return { ...p, variations: clean };
    }));
    addToast('success', 'Deduplication Complete', 'All redundant SKU options cleaned across catalog.');
  };

  const refreshProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {});
  };

  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    }).catch(() => {});
    addToast('success', 'Product Added', `${newProduct.title} added to catalog.`);
  };

  const updateProduct = (productOrId: Product | string, maybeUpdates?: Partial<Product>) => {
    if (typeof productOrId === 'string') {
      const id = productOrId;
      const updates = maybeUpdates || {};
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
      fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(() => {});
    } else {
      const updatedProduct = productOrId;
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      }).catch(() => {});
    }
    addToast('success', 'Product Updated', 'Changes saved successfully.');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});
    addToast('info', 'Product Deleted', 'Item removed from database.');
  };

  const approveProduct = (id: string) => {
    updateProduct(id, { status: 'published' });
    addToast('success', 'Product Approved', 'Product is now live on the storefront.');
  };

  const addNavItem = (item: Omit<NavItem, 'id'>) => {
    const newItem: NavItem = {
      ...item,
      id: `nav-${Date.now()}`
    };
    setNavItems(prev => [...prev, newItem]);
    addToast('success', 'Navigation Item Added', `"${item.label}" added to menu.`);
  };

  const updateNavItem = (id: string, updates: Partial<NavItem>) => {
    setNavItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    addToast('success', 'Navigation Updated', 'Menu item saved successfully.');
  };

  const deleteNavItem = (id: string) => {
    setNavItems(prev => prev.filter(item => item.id !== id));
    addToast('info', 'Navigation Item Removed', 'Menu item deleted.');
  };

  const reorderNavItems = (newItems: NavItem[]) => {
    setNavItems(newItems.map((item, idx) => ({ ...item, order: idx + 1 })));
  };

  const toggleNavItemActive = (id: string) => {
    setNavItems(prev => prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        productTypeFilter,
        setProductTypeFilter,
        
        navItems,
        setNavItems,
        addNavItem,
        updateNavItem,
        deleteNavItem,
        reorderNavItems,
        toggleNavItemActive,
        activePromoFilter,
        setActivePromoFilter,
        
        activeView,
        setActiveView,
        adminTab,
        setAdminTab,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isCustomerPortalOpen,
        setIsCustomerPortalOpen,
        isWhatsAppModalOpen,
        setIsWhatsAppModalOpen,
        isCompareModalOpen,
        setIsCompareModalOpen,
        
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartCount,
        isInCart,
        
        wishlist,
        toggleWishlist,
        
        compareList,
        toggleCompare,
        clearCompare,
        
        currentUser,
        switchUserRole,
        setCurrentUser,
        
        orders,
        createOrder,
        updateOrderShipment,
        updateOrderStatus,
        
        content,
        updateContent,
        coupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        addCoupon,
        deleteCoupon,
        
        g2gConnector,
        g2gSettings,
        updateG2GConnector,
        updateG2GSettings,
        syncG2GCatalog,
        importJobs,
        adminLogs,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        approveProduct,
        cleanAllProductVariations,
        
        toasts,
        addToast,
        removeToast,
        
        currency,
        setCurrency,
        formatPrice
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
