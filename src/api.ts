import { DbStatus, Restaurant, MenuItem, CartState, Order, Review, Address, User } from './types';

const TOKEN_KEY = 'cravecart_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Health & DB Setup
  getDbStatus: () => request<DbStatus>('/api/health/db'),
  runMigrations: () => request<{ success: boolean; message: string; details?: any }>('/api/health/migrate', { method: 'POST' }),

  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (payload: { name: string; email: string; password: string; phone?: string; role?: string }) =>
    request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCurrentUser: () => request<{ user: User }>('/api/auth/me'),
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  // Restaurants & Menu
  getRestaurants: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return request<{
      restaurants: Restaurant[];
      total: number;
      cuisines: string[];
      categories: { id: number; name: string }[];
    }>(`/api/restaurants?${query.toString()}`);
  },
  getRestaurant: (id: number) => request<{ restaurant: Restaurant }>(`/api/restaurants/${id}`),
  getRestaurantMenu: (
    id: number,
    params: { categoryId?: string; vegOnly?: boolean; sortBy?: string; search?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.vegOnly) query.append('vegOnly', 'true');
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.search) query.append('search', params.search);
    return request<{ items: MenuItem[]; categories: { id: number; name: string }[] }>(
      `/api/restaurants/${id}/menu?${query.toString()}`
    );
  },
  getRestaurantReviews: (id: number) => request<{ reviews: Review[] }>(`/api/restaurants/${id}/reviews`),
  submitReview: (restaurantId: number, payload: { rating: number; reviewText: string; orderId?: number }) =>
    request<{ message: string; review: Review }>(`/api/restaurants/${restaurantId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Cart
  getCart: () => request<CartState>('/api/cart'),
  addToCart: (menuItemId: number, quantity = 1, forceReset = false) =>
    request<{ message: string }>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ menuItemId, quantity, forceReset }),
    }),
  updateCartItem: (cartItemId: number, quantity: number) =>
    request<{ message: string }>(`/api/cart/items/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (cartItemId: number) =>
    request<{ message: string }>(`/api/cart/items/${cartItemId}`, {
      method: 'DELETE',
    }),
  clearCart: () => request<{ message: string }>('/api/cart', { method: 'DELETE' }),
  syncCart: (items: Array<{ menuItemId: number; quantity: number }>) =>
    request<{ message: string }>('/api/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  // Orders
  placeOrder: (payload: { addressId?: number; addressText?: string; couponCode?: string; paymentMethod?: string }) =>
    request<{
      message: string;
      orderId: number;
      finalTotal: number;
      loyaltyDiscount: number;
      loyaltyPercentage: number;
      couponDiscount: number;
      status: string;
      transactionRef: string;
    }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrders: () => request<{ orders: Order[] }>('/api/orders'),
  getOrderDetails: (id: number) =>
    request<{
      order: Order;
      items: { id: number; item_name: string; quantity: number; unit_price: number; line_total: number }[];
      timeline: { id: number; previous_status: string; new_status: string; actor: string; notes: string; created_at: string }[];
      calculatedSubtotal: number;
    }>(`/api/orders/${id}`),
  cancelOrder: (id: number) =>
    request<{ message: string; status: string }>(`/api/orders/${id}/cancel`, {
      method: 'POST',
    }),

  // Profile & Loyalty
  getProfile: () => request<{ profile: User }>('/api/profile'),
  getLoyalty: () =>
    request<{
      loyalty: {
        customerId: number;
        eligibleOrders: number;
        discountPercentage: number;
        totalSpending: number;
        nextTierMessage: string;
        tierName: string;
      };
    }>('/api/profile/loyalty'),
  getAddresses: () => request<{ addresses: Address[] }>('/api/profile/addresses'),
  addAddress: (address: Partial<Address>) =>
    request<{ message: string; address: Address }>('/api/profile/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    }),
  deleteAddress: (id: number) => request<{ message: string }>(`/api/profile/addresses/${id}`, { method: 'DELETE' }),
  updateAddress: (id: number, address: Partial<Address>) =>
    request<{ message: string; address: Address }>(`/api/profile/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    }),

  // Admin & DA2 Analytics
  getAdminOverview: () => request<any>('/api/admin/overview'),
  getMonthlyCustomersQuery1: () => request<{ data: any[] }>('/api/admin/analytics/monthly-customers'),
  getTopRatedRestaurantsQuery2: () => request<{ data: any[] }>('/api/admin/analytics/top-rated-restaurants'),
  getTopCustomersQuery3: () => request<{ data: any[] }>('/api/admin/analytics/top-customers'),
  getAboveAverageSpendingQuery4: () => request<{ data: any[] }>('/api/admin/analytics/above-average-spending'),
  getMenuPriceAnalysisQuery5: () => request<{ data: any[] }>('/api/admin/analytics/menu-price-analysis'),
  getHighestRatedTiesQuery6: () => request<{ data: any[] }>('/api/admin/analytics/highest-rated-ties'),
  getCategorySalesQuery7: () => request<{ data: any[] }>('/api/admin/analytics/category-sales'),
  getHighValueOrdersQuery8: () => request<{ data: any[] }>('/api/admin/analytics/high-value-orders'),
  getLoyaltyCustomersViewQuery9: () => request<{ data: any[] }>('/api/admin/analytics/loyalty-customers'),
  getRestaurantPerformanceViewQuery10: () => request<{ data: any[] }>('/api/admin/analytics/restaurant-performance'),
  getCursorReportExercise3: () => request<{ data: any[] }>('/api/admin/analytics/cursor-report'),
  executeLoyaltyBlockExercise5: () => request<{ message: string; notices: string[]; customerDetails: any; blockCode: string }>('/api/admin/execute-loyalty-block', { method: 'POST' }),
  getAdminOrders: (params: { status?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    return request<{ orders: any[] }>(`/api/admin/orders?${query.toString()}`);
  },
  updateOrderStatusProcedure: (orderId: number, newStatus: string) =>
    request<{ message: string; newStatus: string }>(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus }),
    }),
  addRestaurant: (payload: any) =>
    request<{ message: string; restaurant: any }>('/api/admin/restaurants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addMenuItem: (payload: any) =>
    request<{ message: string; item: any }>('/api/admin/menu-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Delivery Agent
  getDeliveryTasks: () => request<{ tasks: any[]; agentInfo: any }>('/api/delivery/tasks'),
  getDeliveryHistory: () => request<{ deliveries: any[] }>('/api/delivery/history'),
  updateDeliveryStatus: (orderId: number, newStatus: string) =>
    request<{ message: string; status: string }>(`/api/delivery/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus }),
    }),
  confirmCashCollection: (orderId: number) =>
    request<{ message: string }>(`/api/delivery/orders/${orderId}/confirm-cash`, {
      method: 'POST',
    }),
};
