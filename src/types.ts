export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'delivery_agent';
  phone?: string | null;
  eligible_order_count?: number;
  loyalty_discount_percentage?: number;
  total_spending?: number;
}

export interface Address {
  id: number;
  user_id?: number;
  label: string;
  street_address: string;
  landmark?: string | null;
  city: string;
  state?: string;
  postal_code: string;
  is_default: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisine_type: string;
  image_url: string;
  address: string;
  city: string;
  is_pure_veg: boolean;
  delivery_time_mins: number;
  price_for_two: number | string;
  avg_rating: number | string;
  review_count: number;
  order_count?: number;
  active_offers?: string[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string;
  price: number | string;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  sold_qty?: number;
  restaurant_avg_price?: number | string;
  is_above_restaurant_avg?: boolean;
}

export interface CartItem {
  cart_item_id: number;
  quantity: number;
  menu_item_id: number;
  name: string;
  price: string | number;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  restaurant_id: number;
  restaurant_name: string;
  item_total: string | number;
}

export interface CartState {
  cartId: number;
  restaurantId: number | null;
  restaurantName: string | null;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface OrderItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

export interface Order {
  id: number;
  customer_id: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_image?: string;
  cuisine_type?: string;
  delivery_address_snapshot: string;
  status: 'Placed' | 'Confirmed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  item_subtotal: number | string;
  coupon_discount: number | string;
  loyalty_discount: number | string;
  delivery_fee: number | string;
  tax_amount: number | string;
  final_total: number | string;
  applied_coupon_code?: string | null;
  loyalty_percentage: number;
  created_at: string;
  updated_at?: string;
  payment_method?: string;
  payment_status?: string;
  transaction_ref?: string;
  items?: OrderItem[];
}

export interface Review {
  id: number;
  rating: number;
  review_text: string;
  created_at: string;
  customer_name: string;
}

export interface DbStatus {
  connected: boolean;
  configured: boolean;
  version?: string;
  error?: string;
  tablesCount?: number;
  tablesReady?: boolean;
}
