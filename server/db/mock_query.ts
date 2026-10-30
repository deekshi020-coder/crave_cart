import { mockStore, MockRestaurant, MockMenuItem, MockOrder } from './mock_store.js';

export async function executeMockQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  const normalized = text.replace(/\s+/g, ' ').trim();

  // 1. Connection & Server Checks
  if (normalized.includes("SELECT current_setting('server_version')")) {
    return { rows: [{ server_version: '16.2 (PostgreSQL Emulated In-Memory)' }], rowCount: 1 };
  }

  if (normalized.includes("information_schema.tables")) {
    return { rows: [{ count: '17' }], rowCount: 1 };
  }

  if (normalized.includes("information_schema.views")) {
    return { rows: [{ count: '2' }], rowCount: 1 };
  }

  if (normalized.includes("SELECT count(*) FROM restaurants")) {
    return { rows: [{ count: String(mockStore.restaurants.length) }], rowCount: 1 };
  }

  // Transaction control
  if (/^(BEGIN|COMMIT|ROLLBACK)$/i.test(normalized)) {
    return { rows: [], rowCount: 0 };
  }

  // Sequence updates & DDL
  if (normalized.startsWith('SELECT setval') || normalized.startsWith('ALTER TABLE')) {
    return { rows: [{ setval: 1 }], rowCount: 1 };
  }

  // 2. RESTAURANTS LISTING & FILTERS
  if (normalized.includes('FROM restaurants r') && normalized.includes('ORDER BY')) {
    let list = [...mockStore.restaurants];

    // Check if query is searching
    if (params.length > 0) {
      for (const p of params) {
        if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
          const raw = p.slice(1, -1).toLowerCase();
          list = list.filter(r => 
            r.name.toLowerCase().includes(raw) || 
            r.cuisine_type.toLowerCase().includes(raw) ||
            mockStore.menuItems.some(m => m.restaurant_id === r.id && m.name.toLowerCase().includes(raw))
          );
        } else if (typeof p === 'number') {
          // rating threshold
          list = list.filter(r => r.avg_rating >= p);
        }
      }
    }

    if (normalized.includes('r.is_pure_veg = true')) {
      list = list.filter(r => r.is_pure_veg);
    }
    if (normalized.includes('r.price_for_two < 400')) {
      list = list.filter(r => r.price_for_two < 400);
    } else if (normalized.includes('r.price_for_two >= 400 AND r.price_for_two <= 600')) {
      list = list.filter(r => r.price_for_two >= 400 && r.price_for_two <= 600);
    } else if (normalized.includes('r.price_for_two > 600')) {
      list = list.filter(r => r.price_for_two > 600);
    }

    // Sort order
    if (normalized.includes('rev.avg_rating, 0.0) DESC, rev.review_count DESC')) {
      list.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count);
    } else if (normalized.includes('r.price_for_two ASC')) {
      list.sort((a, b) => a.price_for_two - b.price_for_two);
    } else if (normalized.includes('r.price_for_two DESC')) {
      list.sort((a, b) => b.price_for_two - a.price_for_two);
    } else if (normalized.includes('COALESCE(ord.order_count, 0) DESC')) {
      list.sort((a, b) => b.order_count - a.order_count);
    } else {
      list.sort((a, b) => b.avg_rating - a.avg_rating || a.delivery_time_mins - b.delivery_time_mins);
    }

    const rows = list.map(r => ({
      ...r,
      active_offers: ['50% OFF up to ₹150', 'Flat ₹100 OFF']
    }));

    return { rows, rowCount: rows.length };
  }

  // Distinct cuisines
  if (normalized.includes('SELECT DISTINCT cuisine_type FROM restaurants')) {
    const cuisines = Array.from(new Set(mockStore.restaurants.map(r => r.cuisine_type))).sort();
    return { rows: cuisines.map(c => ({ cuisine_type: c })), rowCount: cuisines.length };
  }

  // Categories list
  if (normalized.includes('FROM categories ORDER BY id')) {
    return { rows: mockStore.categories, rowCount: mockStore.categories.length };
  }

  // Single Restaurant by ID
  if (normalized.includes('FROM restaurants r') && normalized.includes('WHERE r.id = $1')) {
    const id = params[0];
    const r = mockStore.restaurants.find(item => item.id === Number(id));
    return { rows: r ? [r] : [], rowCount: r ? 1 : 0 };
  }

  // Single Menu Item by ID
  if (normalized.includes('FROM menu_items') && (normalized.includes('WHERE id = $1') || normalized.includes('WHERE m.id = $1'))) {
    const id = Number(params[0]);
    const m = mockStore.menuItems.find(item => item.id === id);
    return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
  }

  // Check distinct restaurant in cart
  if (normalized.includes('FROM cart_items ci') && normalized.includes('DISTINCT m.restaurant_id')) {
    const cartId = Number(params[0]);
    const cItems = mockStore.cartItems.filter(ci => ci.cart_id === cartId);
    if (cItems.length === 0) return { rows: [], rowCount: 0 };
    const m = mockStore.menuItems.find(item => item.id === cItems[0].menu_item_id);
    const r = m ? mockStore.restaurants.find(rest => rest.id === m.restaurant_id) : null;
    return {
      rows: r ? [{ restaurant_id: r.id, restaurant_name: r.name }] : [],
      rowCount: r ? 1 : 0
    };
  }

  // Restaurant Menu
  if (normalized.includes('FROM menu_items m') && (normalized.includes('WHERE m.restaurant_id = $1') || normalized.includes('WITH rest_avg AS'))) {
    const restaurantId = Number(params[0]);
    let items = mockStore.menuItems.filter(m => m.restaurant_id === restaurantId && m.is_available);

    const avgPrice = items.length > 0 ? items.reduce((s, i) => s + i.price, 0) / items.length : 300;

    // Filters
    if (normalized.includes('m.is_veg = true')) {
      items = items.filter(m => m.is_veg);
    }
    if (params.length > 1 && typeof params[1] === 'number') {
      items = items.filter(m => m.category_id === params[1]);
    }

    const rows = items.map(m => ({
      ...m,
      restaurant_avg_price: Math.round(avgPrice * 100) / 100,
      is_above_restaurant_avg: m.price > avgPrice,
      sold_qty: m.sold_qty,
    }));

    return { rows, rowCount: rows.length };
  }

  // Distinct Categories for a Restaurant
  if (normalized.includes('SELECT DISTINCT c.id, c.name FROM menu_items m JOIN categories c')) {
    const restaurantId = Number(params[0]);
    const items = mockStore.menuItems.filter(m => m.restaurant_id === restaurantId);
    const catIds = Array.from(new Set(items.map(m => m.category_id)));
    const cats = mockStore.categories.filter(c => catIds.includes(c.id));
    return { rows: cats, rowCount: cats.length };
  }

  // Restaurant Reviews
  if (normalized.includes('FROM reviews r JOIN users u') && normalized.includes('WHERE r.restaurant_id = $1')) {
    const restaurantId = Number(params[0]);
    const revs = mockStore.reviews.filter(r => r.restaurant_id === restaurantId);
    return { rows: revs, rowCount: revs.length };
  }

  // Insert Review
  if (normalized.includes('INSERT INTO reviews')) {
    const [customerId, restaurantId, orderId, rating, reviewText] = params;
    const user = mockStore.users.find(u => u.id === Number(customerId));
    const newRev = {
      id: Date.now(),
      customer_id: Number(customerId),
      customer_name: user ? user.name : 'Customer',
      restaurant_id: Number(restaurantId),
      order_id: orderId ? Number(orderId) : null,
      rating: parseFloat(rating),
      review_text: reviewText || '',
      created_at: new Date().toISOString()
    };
    mockStore.reviews.unshift(newRev);
    return { rows: [newRev], rowCount: 1 };
  }

  // 3. AUTHENTICATION & USERS
  if (normalized.includes('SELECT * FROM users WHERE email = $1') || normalized.includes('SELECT id FROM users WHERE email = $1')) {
    const email = String(params[0]).toLowerCase();
    const u = mockStore.users.find(user => user.email.toLowerCase() === email);
    return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
  }

  if (normalized.includes('INSERT INTO users (name, email, password_hash, role, phone, is_active)')) {
    const [name, email, passwordHash, role, phone] = params;
    const newUser = {
      id: Date.now(),
      name: String(name),
      email: String(email).toLowerCase(),
      password_hash: String(passwordHash),
      role: role || 'customer',
      phone: phone || '',
      is_active: true,
      created_at: new Date().toISOString()
    };
    mockStore.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  // Current User /me & Loyalty View
  if (normalized.includes('FROM users u') && normalized.includes('WHERE u.id = $1')) {
    const userId = Number(params[0]);
    const u = mockStore.users.find(user => user.id === userId);
    if (!u) return { rows: [], rowCount: 0 };

    const userOrders = mockStore.orders.filter(o => o.customer_id === userId && o.status !== 'Cancelled');
    const eligibleCount = userOrders.length;
    let loyaltyDiscount = 0;
    if (eligibleCount > 5) loyaltyDiscount = 20;
    else if (eligibleCount >= 3) loyaltyDiscount = 10;
    else loyaltyDiscount = 0;

    const totalSpending = userOrders.reduce((s, o) => s + (o.final_total || 0), 0);

    return {
      rows: [{
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        created_at: u.created_at,
        eligible_order_count: eligibleCount,
        loyalty_discount_percentage: loyaltyDiscount,
        total_spending: totalSpending,
      }],
      rowCount: 1,
    };
  }

  // PostgreSQL loyalty_customers View query (used by orders.ts, profile.ts, admin)
  if (normalized.includes('FROM loyalty_customers WHERE customer_id = $1') || normalized.includes('loyalty_customers WHERE customer_id = $1')) {
    const customerId = Number(params[0]);
    const user = mockStore.users.find(u => u.id === customerId);
    const userOrders = mockStore.orders.filter(o => o.customer_id === customerId && o.status !== 'Cancelled');
    const count = userOrders.length;
    const discount_percentage = count > 5 ? 20.00 : count >= 3 ? 10.00 : 0.00;
    const tier_name = count > 5 ? 'Platinum (20% Off)' : count >= 3 ? 'Gold (10% Off)' : 'Member (0% Off)';
    const total_spending = userOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
    return {
      rows: [{
        customer_id: customerId,
        customer_name: user?.name || 'Customer',
        email: user?.email || '',
        eligible_order_count: String(count),
        discount_percentage,
        total_spending: total_spending.toFixed(2),
        tier_name,
      }],
      rowCount: 1,
    };
  }

  if (normalized.includes('FROM loyalty_customers') && !normalized.includes('WHERE')) {
    const rows = mockStore.users.filter(u => u.role === 'customer').map(c => {
      const uOrders = mockStore.orders.filter(o => o.customer_id === c.id && o.status !== 'Cancelled');
      const count = uOrders.length;
      const discount_percentage = count > 5 ? 20.00 : count >= 3 ? 10.00 : 0.00;
      const tier_name = count > 5 ? 'Platinum (20% Off)' : count >= 3 ? 'Gold (10% Off)' : 'Member (0% Off)';
      const total_spending = uOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
      return {
        customer_id: c.id,
        customer_name: c.name,
        email: c.email,
        eligible_order_count: count,
        total_spending: total_spending.toFixed(2),
        discount_percentage,
        tier_name
      };
    });
    return { rows, rowCount: rows.length };
  }

  // 4. CART OPERATIONS
  if (normalized.includes('SELECT id FROM carts WHERE user_id = $1')) {
    const userId = Number(params[0]);
    const cartId = mockStore.getCartId(userId);
    return { rows: [{ id: cartId }], rowCount: 1 };
  }

  if (normalized.includes('INSERT INTO carts (user_id) VALUES ($1)')) {
    const userId = Number(params[0]);
    const cartId = mockStore.getCartId(userId);
    return { rows: [{ id: cartId }], rowCount: 1 };
  }

  if (normalized.includes('FROM cart_items ci JOIN menu_items m') && normalized.includes('WHERE ci.cart_id = $1')) {
    const cartId = Number(params[0]);
    const items = mockStore.cartItems.filter(ci => ci.cart_id === cartId);
    const rows = items.map(ci => {
      const m = mockStore.menuItems.find(item => item.id === ci.menu_item_id);
      const r = m ? mockStore.restaurants.find(rest => rest.id === m.restaurant_id) : null;
      return {
        cart_item_id: ci.id,
        quantity: ci.quantity,
        menu_item_id: ci.menu_item_id,
        name: m ? m.name : 'Food Item',
        price: m ? String(m.price) : '200',
        image_url: m ? m.image_url : '',
        is_veg: m ? m.is_veg : false,
        is_available: m ? m.is_available : true,
        restaurant_id: m ? m.restaurant_id : 1,
        restaurant_name: r ? r.name : 'Crave Kitchen',
        item_total: m ? (ci.quantity * m.price).toFixed(2) : '200.00'
      };
    });
    return { rows, rowCount: rows.length };
  }

  if (normalized.includes('INSERT INTO cart_items (cart_id, menu_item_id, quantity)')) {
    const [cartId, menuItemId, quantity] = params;
    mockStore.addCartItem(Number(cartId), Number(menuItemId), Number(quantity));
    return { rows: [{ id: Date.now() }], rowCount: 1 };
  }

  if (normalized.includes('UPDATE cart_items SET quantity = $1 WHERE id = $2')) {
    const [quantity, id] = params;
    const item = mockStore.cartItems.find(ci => ci.id === Number(id));
    if (item) item.quantity = Number(quantity);
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('DELETE FROM cart_items WHERE id = $1')) {
    const id = Number(params[0]);
    mockStore.cartItems = mockStore.cartItems.filter(ci => ci.id !== id);
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('DELETE FROM cart_items WHERE cart_id = $1')) {
    const cartId = Number(params[0]);
    mockStore.cartItems = mockStore.cartItems.filter(ci => ci.cart_id !== cartId);
    return { rows: [], rowCount: 1 };
  }

  // 5. COUPONS & ORDER VALIDATION
  if (normalized.includes('SELECT count(*) FROM orders WHERE customer_id = $1') || normalized.includes('COUNT(*) FROM orders WHERE customer_id = $1')) {
    const customerId = Number(params[0]);
    const prior = mockStore.orders.filter(o => o.customer_id === customerId);
    return { rows: [{ count: String(prior.length) }], rowCount: 1 };
  }

  // Biryani coupon item check
  if (normalized.includes('JOIN categories c ON m.category_id = c.id') && normalized.includes('biryani')) {
    const cartId = Number(params[0]);
    const cItems = mockStore.cartItems.filter(ci => ci.cart_id === cartId);
    const hasBiryani = cItems.some(ci => {
      const m = mockStore.menuItems.find(item => item.id === ci.menu_item_id);
      return m && (m.name.toLowerCase().includes('biryani') || m.category_name?.toLowerCase().includes('biryani'));
    });
    return { rows: hasBiryani ? [{ 1: 1 }] : [], rowCount: hasBiryani ? 1 : 0 };
  }

  // Sweet / Dessert coupon item check
  if (normalized.includes('JOIN categories c ON m.category_id = c.id') && (normalized.includes('dessert') || normalized.includes('sweet'))) {
    const cartId = Number(params[0]);
    const cItems = mockStore.cartItems.filter(ci => ci.cart_id === cartId);
    const hasSweets = cItems.some(ci => {
      const m = mockStore.menuItems.find(item => item.id === ci.menu_item_id);
      return m && (m.name.toLowerCase().includes('jamun') || m.name.toLowerCase().includes('sweet') || m.name.toLowerCase().includes('halwa') || m.name.toLowerCase().includes('dessert') || m.name.toLowerCase().includes('ice cream') || m.name.toLowerCase().includes('lassi'));
    });
    return { rows: hasSweets ? [{ 1: 1 }] : [], rowCount: hasSweets ? 1 : 0 };
  }

  if (normalized.includes('FROM coupons WHERE code = $1')) {
    const code = String(params[0]).toUpperCase();
    const coupon = mockStore.coupons.get(code);
    return { rows: coupon ? [coupon] : [], rowCount: coupon ? 1 : 0 };
  }

  // 6. ORDER PLACEMENT & ORDER DETAILS
  if (normalized.startsWith('INSERT INTO orders')) {
    const customerId = params[0];
    const restaurantId = params[1];
    const addressId = params[2];
    const addressSnapshot = params[3];
    const itemSubtotal = params[4];
    const couponDiscount = params[5];
    const loyaltyDiscount = params[6];
    const deliveryFee = params[7];
    const taxAmount = params[8];
    const finalTotal = params[9];
    const appliedCoupon = params[10];
    const loyaltyPercentage = params[11];

    const user = mockStore.users.find(u => u.id === Number(customerId));
    const rest = mockStore.restaurants.find(r => r.id === Number(restaurantId));
    
    // Find current cart items
    const cartId = mockStore.getCartId(Number(customerId));
    const cItems = mockStore.cartItems.filter(ci => ci.cart_id === cartId);
    const orderItems = cItems.map((ci, idx) => {
      const m = mockStore.menuItems.find(item => item.id === ci.menu_item_id);
      return {
        id: idx + 1,
        item_name: m ? m.name : 'Delicious Dish',
        quantity: ci.quantity,
        unit_price: m ? m.price : 250,
        line_total: m ? m.price * ci.quantity : 250
      };
    });

    const newOrder = mockStore.createOrder({
      customer_id: Number(customerId),
      customer_name: user?.name,
      customer_email: user?.email,
      customer_phone: user?.phone,
      restaurant_id: Number(restaurantId),
      restaurant_name: rest?.name,
      restaurant_image: rest?.image_url,
      delivery_address_snapshot: String(addressSnapshot),
      item_subtotal: parseFloat(itemSubtotal),
      coupon_discount: parseFloat(couponDiscount || 0),
      loyalty_discount: parseFloat(loyaltyDiscount || 0),
      delivery_fee: parseFloat(deliveryFee || 40),
      tax_amount: parseFloat(taxAmount || 0),
      final_total: parseFloat(finalTotal),
      loyalty_percentage: parseInt(loyaltyPercentage || 0, 10),
      items: orderItems,
    });

    // Clear cart
    mockStore.cartItems = mockStore.cartItems.filter(ci => ci.cart_id !== cartId);

    return {
      rows: [{
        id: newOrder.id,
        order_number: newOrder.order_number,
        final_total: newOrder.final_total,
        created_at: newOrder.created_at,
        status: newOrder.status
      }],
      rowCount: 1,
    };
  }


  if (normalized.includes('INSERT INTO order_items')) {
    return { rows: [{ id: Date.now() }], rowCount: 1 };
  }

  if (normalized.includes('INSERT INTO payments')) {
    return { rows: [{ id: Date.now() }], rowCount: 1 };
  }

  if (normalized.includes('INSERT INTO order_status_history')) {
    return { rows: [{ id: Date.now() }], rowCount: 1 };
  }

  // User's order list
  if (normalized.includes('FROM orders o JOIN restaurants r') && normalized.includes('WHERE o.customer_id = $1')) {
    const customerId = Number(params[0]);
    const userOrders = mockStore.orders.filter(o => o.customer_id === customerId);
    return { rows: userOrders, rowCount: userOrders.length };
  }

  // Single order details
  if (normalized.includes('FROM orders o') && (normalized.includes('WHERE o.id = $1') || normalized.includes('WHERE id = $1'))) {
    const orderId = Number(params[0]);
    const order = mockStore.orders.find(o => o.id === orderId);
    return { rows: order ? [order] : [], rowCount: order ? 1 : 0 };
  }

  // Order items for single order
  if (normalized.includes('FROM order_items oi') && normalized.includes('WHERE oi.order_id = $1')) {
    const orderId = Number(params[0]);
    const order = mockStore.orders.find(o => o.id === orderId);
    return { rows: order?.items || [], rowCount: (order?.items || []).length };
  }

  // Order timeline for single order
  if (normalized.includes('FROM order_status_history') && normalized.includes('WHERE order_id = $1')) {
    const orderId = Number(params[0]);
    const order = mockStore.orders.find(o => o.id === orderId);
    return { rows: order?.timeline || [], rowCount: (order?.timeline || []).length };
  }

  // Cancel order
  if (normalized.includes("UPDATE orders SET status = 'Cancelled'") || normalized.includes("status = 'Cancelled'")) {
    const orderId = Number(params[0]);
    const order = mockStore.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'Cancelled';
      order.timeline?.push({
        id: Date.now(),
        previous_status: 'Placed',
        new_status: 'Cancelled',
        actor: 'Customer',
        notes: 'Order cancelled by customer',
        created_at: new Date().toISOString()
      });
    }
    return { rows: order ? [order] : [], rowCount: 1 };
  }

  // 7. USER ADDRESSES
  if (normalized.includes('FROM addresses WHERE user_id = $1')) {
    const userId = Number(params[0]);
    const addrs = mockStore.addresses.filter(a => a.user_id === userId);
    return { rows: addrs, rowCount: addrs.length };
  }

  if (normalized.includes('INSERT INTO addresses (user_id, label, street_address, landmark, city, postal_code, is_default)')) {
    const [userId, label, streetAddress, landmark, city, postalCode, isDefault] = params;
    const newAddr = {
      id: Date.now(),
      user_id: Number(userId),
      label: label || 'Home',
      street_address: streetAddress,
      landmark: landmark || '',
      city: city || 'Chennai',
      state: 'Tamil Nadu',
      postal_code: postalCode || '600001',
      is_default: Boolean(isDefault),
      latitude: 13.0827,
      longitude: 80.2707,
    };
    mockStore.addresses.push(newAddr);
    return { rows: [newAddr], rowCount: 1 };
  }

  if (normalized.includes('UPDATE addresses SET is_default = false')) {
    const userId = Number(params[0]);
    mockStore.addresses.forEach(a => {
      if (a.user_id === userId) a.is_default = false;
    });
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('UPDATE addresses') && normalized.includes('SET label = $1')) {
    const [label, street, landmark, city, postal, def, addressId, userId] = params;
    const addr = mockStore.addresses.find(a => a.id === Number(addressId) && a.user_id === Number(userId));
    if (addr) {
      addr.label = String(label);
      addr.street_address = String(street);
      addr.landmark = landmark ? String(landmark) : '';
      addr.city = String(city);
      addr.postal_code = String(postal);
      addr.is_default = Boolean(def);
      return { rows: [addr], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (normalized.includes('DELETE FROM addresses WHERE id = $1')) {
    const id = Number(params[0]);
    mockStore.addresses = mockStore.addresses.filter(a => a.id !== id);
    return { rows: [], rowCount: 1 };
  }

  // Confirm COD Cash Collection
  if (normalized.includes('UPDATE payments SET status = \'Completed\'')) {
    const orderId = Number(params[0]);
    const order = mockStore.orders.find(o => o.id === orderId);
    if (order) {
      order.payment_status = 'Completed';
    }
    return { rows: [], rowCount: 1 };
  }

  // Insert New Restaurant by Admin
  if (normalized.includes('INSERT INTO restaurants')) {
    const [name, cuisineType, address, priceForTwo, isPureVeg] = params;
    const newRest = {
      id: Date.now(),
      name: String(name),
      cuisine_type: String(cuisineType),
      address: String(address),
      city: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600040',
      latitude: 13.0850,
      longitude: 80.2101,
      avg_rating: 4.8,
      review_count: 1,
      image_url: '/src/assets/images/biryani_specialty_1793294053906.jpg',
      delivery_time_mins: 30,
      delivery_fee: 40,
      price_for_two: Number(priceForTwo) || 450,
      is_pure_veg: Boolean(isPureVeg),
      description: 'Authentic culinary experience in Chennai.',
      order_count: 0,
      is_active: true,
      created_at: new Date().toISOString()
    };
    mockStore.restaurants.unshift(newRest);
    return { rows: [newRest], rowCount: 1 };
  }

  // 8. ADMIN OVERVIEW & ANALYTICS
  if (normalized.includes('total_customers') && normalized.includes('total_restaurants')) {
    const customersCount = mockStore.users.filter(u => u.role === 'customer').length;
    const restaurantsCount = mockStore.restaurants.length;
    const ordersCount = mockStore.orders.length;
    const revenue = mockStore.orders.reduce((s, o) => s + (o.status !== 'Cancelled' ? o.final_total : 0), 0);
    const activeDeliveries = mockStore.orders.filter(o => o.status === 'Out for Delivery' || o.status === 'Preparing').length;
    return {
      rows: [{
        total_customers: customersCount,
        total_restaurants: restaurantsCount,
        total_orders: ordersCount,
        total_revenue: revenue,
        active_deliveries: activeDeliveries,
      }],
      rowCount: 1,
    };
  }

  if (normalized.includes('FROM orders o JOIN users u ON o.customer_id = u.id') && normalized.includes('LIMIT 6')) {
    const recent = mockStore.orders.slice(0, 6).map(o => ({
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      final_total: o.final_total,
      customer_name: o.customer_name || 'Customer',
      restaurant_name: o.restaurant_name || 'Restaurant'
    }));
    return { rows: recent, rowCount: recent.length };
  }

  if (normalized.includes('TO_CHAR(created_at, \'YYYY-MM-DD\') as order_date')) {
    const trends = [
      { order_date: '2026-10-23', order_count: 8, daily_revenue: 4200 },
      { order_date: '2026-10-24', order_count: 14, daily_revenue: 7800 },
      { order_date: '2026-10-25', order_count: 18, daily_revenue: 9600 },
      { order_date: '2026-10-26', order_count: 12, daily_revenue: 6400 },
      { order_date: '2026-10-27', order_count: 16, daily_revenue: 8900 },
      { order_date: '2026-10-28', order_count: 22, daily_revenue: 11400 },
      { order_date: '2026-10-29', order_count: 19, daily_revenue: 10200 },
    ];
    return { rows: trends, rowCount: trends.length };
  }

  // DA2 Query 1: Monthly customers > 5 orders
  if (normalized.includes('september_order_count')) {
    return {
      rows: [
        { customer_id: 1, customer_name: 'Aarav Sharma', customer_email: 'aarav@example.com', customer_phone: '+91 98765 43210', september_order_count: 6, september_spending: '3450.00', period_name: 'September 2026' },
        { customer_id: 2, customer_name: 'Priya Patel', customer_email: 'priya@example.com', customer_phone: '+91 98765 43211', september_order_count: 7, september_spending: '4120.00', period_name: 'September 2026' }
      ],
      rowCount: 2
    };
  }

  // DA2 Query 2: Top rated restaurants rating >= 4.0
  if (normalized.includes('avg_rating >= 4.0') || (normalized.includes('rev.avg_rating') && normalized.includes('4.0'))) {
    const top = mockStore.restaurants.filter(r => r.avg_rating >= 4.5).map(r => ({
      restaurant_id: r.id,
      restaurant_name: r.name,
      cuisine_type: r.cuisine_type,
      city: r.city,
      avg_rating: r.avg_rating,
      total_reviews: r.review_count,
      rating_badge: 'Highly Recommended'
    }));
    return { rows: top, rowCount: top.length };
  }

  // DA2 Query 6: Highest rated ties
  if (normalized.includes('DENSE_RANK() OVER (ORDER BY rev.avg_rating DESC)') || normalized.includes('highest-rated')) {
    const ties = mockStore.restaurants.slice(0, 4).map(r => ({
      restaurant_id: r.id,
      restaurant_name: r.name,
      cuisine_type: r.cuisine_type,
      image_url: r.image_url,
      avg_rating: r.avg_rating,
      review_count: r.review_count,
    }));
    return { rows: ties, rowCount: ties.length };
  }

  // Admin all orders
  if (normalized.includes('FROM orders o JOIN users u') && normalized.includes('JOIN restaurants r')) {
    return { rows: mockStore.orders, rowCount: mockStore.orders.length };
  }

  // Update order status by admin / procedure
  if (normalized.includes('CALL update_order_status') || normalized.includes('UPDATE orders SET status = $1 WHERE id = $2')) {
    const [newStatus, orderId] = params;
    const order = mockStore.orders.find(o => o.id === Number(orderId));
    if (order) {
      order.status = String(newStatus);
      order.timeline?.push({
        id: Date.now(),
        previous_status: 'In Progress',
        new_status: String(newStatus),
        actor: 'Admin / System',
        notes: `Status updated to ${newStatus}`,
        created_at: new Date().toISOString()
      });
    }
    return { rows: [], rowCount: 1 };
  }

  // 9. DELIVERY AGENT VIEW
  if (normalized.includes('FROM orders o') && (normalized.includes('Out for Delivery') || normalized.includes('Preparing') || normalized.includes('Confirmed'))) {
    const active = mockStore.orders.filter(o => o.status === 'Out for Delivery' || o.status === 'Preparing' || o.status === 'Confirmed');
    return { rows: active, rowCount: active.length };
  }

  // AI Catalog summary limit 60
  if (normalized.includes('LIMIT 60')) {
    const rows = mockStore.menuItems.slice(0, 60).map(m => {
      const r = mockStore.restaurants.find(rest => rest.id === m.restaurant_id);
      return {
        id: m.id,
        name: m.name,
        price: m.price,
        is_veg: m.is_veg,
        description: m.description,
        restaurant_id: m.restaurant_id,
        restaurant_name: r ? r.name : 'Crave Kitchen',
        cuisine_type: r ? r.cuisine_type : 'Gourmet',
        restaurant_address: r ? r.address : 'Chennai',
        category_name: m.category_name || 'Specialty'
      };
    });
    return { rows, rowCount: rows.length };
  }

  // Fallback default: empty rows
  return { rows: [], rowCount: 0 };
}
