import bcrypt from 'bcryptjs';

export interface MockRestaurant {
  id: number;
  name: string;
  description: string;
  cuisine_type: string;
  image_url: string;
  address: string;
  city: string;
  is_pure_veg: boolean;
  is_active: boolean;
  delivery_time_mins: number;
  price_for_two: number;
  latitude: number;
  longitude: number;
  avg_rating: number;
  review_count: number;
  order_count: number;
}

export interface MockCategory {
  id: number;
  name: string;
  description: string;
  image_url: string;
}

export interface MockMenuItem {
  id: number;
  restaurant_id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  sold_qty: number;
}

export interface MockUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'customer' | 'admin' | 'delivery_agent';
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface MockAddress {
  id: number;
  user_id: number;
  label: string;
  street_address: string;
  landmark: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  latitude: number;
  longitude: number;
}

export interface MockCartItem {
  id: number;
  cart_id: number;
  menu_item_id: number;
  quantity: number;
}

export interface MockOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  restaurant_id: number;
  restaurant_name?: string;
  restaurant_image?: string;
  delivery_address_snapshot: string;
  status: string;
  item_subtotal: number;
  coupon_discount: number;
  loyalty_discount: number;
  delivery_fee: number;
  tax_amount: number;
  final_total: number;
  loyalty_percentage: number;
  created_at: string;
  items?: any[];
  timeline?: any[];
  payment_method?: string;
  payment_status?: string;
  transaction_ref?: string;
}

export interface MockReview {
  id: number;
  customer_id: number;
  customer_name: string;
  restaurant_id: number;
  order_id?: number | null;
  rating: number;
  review_text: string;
  created_at: string;
}

class MockDataStore {
  users: MockUser[] = [];
  restaurants: MockRestaurant[] = [];
  categories: MockCategory[] = [];
  menuItems: MockMenuItem[] = [];
  addresses: MockAddress[] = [];
  carts: Map<number, number> = new Map(); // userId -> cartId
  cartItems: MockCartItem[] = [];
  orders: MockOrder[] = [];
  reviews: MockReview[] = [];
  coupons: Map<string, any> = new Map();

  private nextUserId = 300;
  private nextAddressId = 50;
  private nextCartId = 10;
  private nextCartItemId = 100;
  private nextOrderId = 500;
  private nextReviewId = 200;

  constructor() {
    this.initData();
  }

  private initData() {
    const customerHash = bcrypt.hashSync('Customer@123', 10);
    const divyaHash = bcrypt.hashSync('Divya@123', 10);
    const adminHash = bcrypt.hashSync('Admin@123', 10);
    const agentHash = bcrypt.hashSync('Agent@123', 10);

    // Initial users
    this.users = [
      { id: 1, name: 'Aarav Sharma', email: 'aarav@example.com', password_hash: customerHash, role: 'customer', phone: '+91 98765 43210', is_active: true, created_at: '2026-08-01T10:00:00Z' },
      { id: 2, name: 'Priya Patel', email: 'priya@example.com', password_hash: customerHash, role: 'customer', phone: '+91 98765 43211', is_active: true, created_at: '2026-08-05T11:00:00Z' },
      { id: 3, name: 'Rohan Gupta', email: 'rohan@example.com', password_hash: customerHash, role: 'customer', phone: '+91 98765 43212', is_active: true, created_at: '2026-08-10T12:00:00Z' },
      { id: 4, name: 'Ananya Iyer', email: 'ananya@example.com', password_hash: customerHash, role: 'customer', phone: '+91 98765 43213', is_active: true, created_at: '2026-08-15T14:00:00Z' },
      { id: 5, name: 'Divya Sundaram', email: 'divya@cravecart.com', password_hash: divyaHash, role: 'customer', phone: '+91 98400 12345', is_active: true, created_at: '2026-09-01T09:00:00Z' },
      { id: 100, name: 'Admin User', email: 'admin@cravecart.com', password_hash: adminHash, role: 'admin', phone: '+91 98000 00001', is_active: true, created_at: '2026-07-01T08:00:00Z' },
      { id: 200, name: 'Vikram Delivery', email: 'vikram@cravecart.com', password_hash: agentHash, role: 'delivery_agent', phone: '+91 98000 00002', is_active: true, created_at: '2026-07-01T08:00:00Z' },
    ];

    // Categories
    this.categories = [
      { id: 1, name: 'Biryani', description: 'Aromatic spiced basmati rice delicacies slow-cooked with saffron and herbs', image_url: '/src/assets/images/biryani_specialty_1793294053906.jpg' },
      { id: 2, name: 'Pizza & Italian', description: 'Crisp woodfired pizzas, al dente pastas, and rustic garlic focaccias', image_url: '/src/assets/images/woodfire_pizza_1793294053970.jpg' },
      { id: 3, name: 'Pan-Asian', description: 'Wok-tossed noodles, crystal dim sums, and fiery aromatics', image_url: '/src/assets/images/asian_wok_bowls_1793294055268.jpg' },
      { id: 4, name: 'Desserts & Sweets', description: 'Decadent Indian mithai, warm gulab jamun, and artisanal ice cream', image_url: '/src/assets/images/dessert_platter_1793294054844.jpg' },
      { id: 5, name: 'Pure Veg', description: '100% vegetarian regional thalis, paneer delicacies, and chaat', image_url: '/src/assets/images/dessert_platter_1793294054844.jpg' },
      { id: 6, name: 'Beverages & Juices', description: 'Refreshing chilled lassis, iced cold brews, and cold-pressed citrus', image_url: '/src/assets/images/hero_food_delivery_1793294052688.jpg' },
      { id: 7, name: 'South Indian', description: 'Crisp golden dosas, fluffy idlis, and traditional filter kaapi', image_url: '/src/assets/images/hero_food_delivery_1793294052688.jpg' },
      { id: 8, name: 'North Indian', description: 'Rich butter chicken, paneer lababdar, dal makhani, and tandoori naans', image_url: '/src/assets/images/biryani_specialty_1793294053906.jpg' },
      { id: 9, name: 'Andhra & Telangana', description: 'Fiery Guntur chicken, spicy gongura mutton, and pappu rice', image_url: '/src/assets/images/biryani_specialty_1793294053906.jpg' },
      { id: 10, name: 'Kerala', description: 'Malabar parottas, appams with chicken stew, and coconut beef roasts', image_url: '/src/assets/images/hero_food_delivery_1793294052688.jpg' },
      { id: 11, name: 'Tamil Nadu Regional', description: 'Chettinad pepper chicken, kothu parotta, and Madurai bun parotta', image_url: '/src/assets/images/hero_food_delivery_1793294052688.jpg' },
      { id: 12, name: 'Bengali', description: 'Mustard hilsa, kosha mangsho, luchi, and mishti doi', image_url: '/src/assets/images/dessert_platter_1793294054844.jpg' },
      { id: 13, name: 'Punjabi Dhaba', description: 'Amritsari kulcha, chole bhature, sarson ka saag, and lassi', image_url: '/src/assets/images/hero_food_delivery_1793294052688.jpg' },
      { id: 14, name: 'Gujarati & Rajasthani', description: 'Dal baati churma, dhokla, kachori, and authentic thalis', image_url: '/src/assets/images/dessert_platter_1793294054844.jpg' },
      { id: 15, name: 'Burgers & Fast Food', description: 'Smash burgers, crispy fried chicken, hand-cut peri-peri fries', image_url: '/src/assets/images/woodfire_pizza_1793294053970.jpg' },
      { id: 16, name: 'Bakery & Cafe', description: 'Sourdough croissants, artisanal cheesecakes, and specialty coffee', image_url: '/src/assets/images/woodfire_pizza_1793294053970.jpg' },
      { id: 17, name: 'Street Food & Chaat', description: 'Pani puri, dahi puri, samosa chaat, and Mumbai pav bhaji', image_url: '/src/assets/images/dessert_platter_1793294054844.jpg' },
      { id: 18, name: 'Healthy & Salads', description: 'Quinoa protein bowls, farm-fresh avocado wraps, and keto plates', image_url: '/src/assets/images/hero_food_delivery_1793294052688.jpg' },
      { id: 19, name: 'Seafood & Coastal', description: 'Mangalorean fish curry, ghee roast prawns, and coastal crab fry', image_url: '/src/assets/images/biryani_specialty_1793294053906.jpg' },
      { id: 20, name: 'Mughlai', description: 'Fragrant kormas, galouti kebabs, rumali roti, and shahi tukda', image_url: '/src/assets/images/biryani_specialty_1793294053906.jpg' },
    ];

    // 32 Restaurants
    const rawRestaurants: [number, string, string, string, string, string, string, boolean, number, number, number, number, number, number, number][] = [
      [1, 'Biryani Darbar', 'Authentic slow-cooked royal Hyderabadi Dum Biryanis and rich Mughlai curries in clay pots.', 'Biryani & Mughlai', '/src/assets/images/biryani_specialty_1793294053906.jpg', '12, 2nd Avenue, Anna Nagar East', 'Chennai', false, 25, 550, 13.0850, 80.2101, 4.8, 142, 38],
      [2, 'Artisan Woodfired Pizzeria', 'Napoli-style handcrafted sourdough pizzas baked to perfection in a 900-degree oven.', 'Italian & Gourmet Pizza', '/src/assets/images/woodfire_pizza_1793294053970.jpg', '45, Khader Nawaz Khan Road, Nungambakkam', 'Chennai', false, 30, 700, 13.0600, 80.2400, 4.7, 98, 29],
      [3, 'Wok & Roll Asian Street', 'Sizzling Asian wok-tossed noodles, steaming crystal dim sums, and fiery Thai curries.', 'Pan-Asian & Dimsum', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', '18, TTK Road, Alwarpet', 'Chennai', false, 28, 500, 13.0330, 80.2510, 4.6, 85, 24],
      [4, 'Royal Sweets & Chaat', 'Heritage pure vegetarian sweet house featuring warm gulab jamuns, rasmalai, and Delhi street chaat.', 'Pure Veg Mithai & Chaat', '/src/assets/images/dessert_platter_1793294054844.jpg', '94, Mint Street, Sowcarpet', 'Chennai', true, 20, 350, 13.0950, 80.2790, 4.7, 110, 42],
      [5, 'Green Earth Organic Kitchen', 'Wholesome farm-to-table salads, ancient grain warm bowls, and cold-pressed botanical tonics.', 'Healthy & Pure Veg', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '28, 4th Main Road, Besant Nagar', 'Chennai', true, 35, 450, 12.9980, 80.2680, 4.5, 64, 18],
      [6, 'The Coastal Spice Catch', 'Coastal seafood curries, Mangalorean ghee roasts, and fresh catch delicacies.', 'Seafood & Coastal', '/src/assets/images/biryani_specialty_1793294053906.jpg', '14, Beach Road, Thiruvanmiyur', 'Chennai', false, 40, 800, 12.9830, 80.2610, 4.6, 76, 21],
      [7, 'Dakshin Tiffin Room', 'Iconic filter kaapi, ghee roast dosas, button idlis with coconut and tomato chutneys.', 'South Indian', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '68, North Mada Street, Mylapore', 'Chennai', true, 20, 250, 13.0368, 80.2676, 4.9, 215, 65],
      [8, 'Pind Punjab Dhaba', 'Smoky clay-oven tandoori chicken, rich dal makhani, butter naan, and sweet lassi.', 'Punjabi Dhaba', '/src/assets/images/biryani_specialty_1793294053906.jpg', '33, Usman Road, T. Nagar', 'Chennai', false, 30, 600, 13.0418, 80.2341, 4.6, 89, 31],
      [9, 'Nagarjuna Andhra Spice', 'Legendary spicy Andhra meals on banana leaf, chili chicken, and mutton fry.', 'Andhra & Telangana', '/src/assets/images/biryani_specialty_1793294053906.jpg', '77, G.N. Chetty Road, T. Nagar', 'Chennai', false, 25, 650, 13.0425, 80.2410, 4.5, 94, 27],
      [10, 'Malabar Coast Kitchen', 'Authentic flaky Malabar parottas, Thalassery biryani, and Syrian beef roast.', 'Kerala Delicacies', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '15, 1st Cross Street, Gandhi Nagar, Adyar', 'Chennai', false, 32, 550, 13.0070, 80.2540, 4.7, 78, 22],
      [11, 'Chettinad Spice Villa', 'Spiced pepper chicken roast, crab masala, and layered Madurai bun parotta.', 'Tamil Nadu Regional', '/src/assets/images/biryani_specialty_1793294053906.jpg', '52, Luz Church Road, Mylapore', 'Chennai', false, 30, 500, 13.0380, 80.2620, 4.8, 120, 36],
      [12, 'Calcutta Kitchen & Roll House', 'Crispy Kolkata egg-chicken rolls, kosha mangsho, and luchi with alur dom.', 'Bengali', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', '22, Sterling Road, Nungambakkam', 'Chennai', false, 22, 400, 13.0640, 80.2380, 4.5, 62, 19],
      [13, 'Padmavati Gujarati Rasoi', 'Wholesome Gujarati unlimited thali, sweet kadhi, fafda, khaman, and shrikhand.', 'Gujarati & Rajasthani', '/src/assets/images/dessert_platter_1793294054844.jpg', '8, Narayana Mudali Street, Sowcarpet', 'Chennai', true, 25, 450, 13.0940, 80.2780, 4.6, 54, 15],
      [14, 'Marwar Royal Thali', 'Heritage Rajasthani dal baati churma with desi ghee, gatte ki sabzi, and ker sangri.', 'Rajasthani Flavors', '/src/assets/images/dessert_platter_1793294054844.jpg', '102, Govindappa Naicken St, Sowcarpet', 'Chennai', true, 35, 750, 13.0960, 80.2800, 4.7, 48, 14],
      [15, 'Mughal Mahal Kebabs', 'Silken Kakori kebabs, murgh korma, saffron sheermal, and rich Nihari.', 'Mughlai', '/src/assets/images/biryani_specialty_1793294053906.jpg', '41, Triplicane High Road, Triplicane', 'Chennai', false, 30, 850, 13.0560, 80.2720, 4.8, 105, 33],
      [16, 'Mumbai Chowpatty Chaat', 'Crisp sev puri, ragda pattice, buttery pav bhaji, and authentic vada pav.', 'Street Food & Chaat', '/src/assets/images/dessert_platter_1793294054844.jpg', '19, Pondy Bazaar, T. Nagar', 'Chennai', true, 18, 250, 13.0405, 80.2335, 4.6, 88, 29],
      [17, 'The Dragon Bowl', 'Spicy Schezwan chicken, burnt garlic fried rice, kung pao lotus stem, and momos.', 'Pan-Asian & Dimsum', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', '63, Harrington Road, Chetpet', 'Chennai', false, 28, 550, 13.0720, 80.2370, 4.4, 72, 20],
      [18, 'Trattoria Bella Napoli', 'Fresh hand-rolled fettuccine Alfredo, truffle mushroom ravioli, and tiramisu.', 'Italian & Gourmet Pizza', '/src/assets/images/woodfire_pizza_1793294053970.jpg', '5, Chamiers Road, R.A. Puram', 'Chennai', false, 35, 950, 13.0280, 80.2500, 4.7, 65, 17],
      [19, 'Buns & Patties Smash Burgers', 'Double beef smash burgers, buttermilk fried chicken sandwich, and truffle mayo fries.', 'Burgers & Fast Food', '/src/assets/images/woodfire_pizza_1793294053970.jpg', '88, 100 Feet Bypass Road, Velachery', 'Chennai', false, 25, 500, 12.9750, 80.2207, 4.5, 91, 26],
      [20, 'The Parisian Boulangerie', 'Warm butter croissants, French pain au chocolat, sourdough loaves, and cafe au lait.', 'Bakery & Cafe', '/src/assets/images/woodfire_pizza_1793294053970.jpg', '31, Wallace Garden 3rd St, Nungambakkam', 'Chennai', true, 22, 450, 13.0610, 80.2450, 4.7, 75, 23],
      [21, 'Naturals Gelato & Kulfi Bar', 'Handcrafted sitaphal ice cream, malai kulfi on stick, and Belgian dark chocolate scoops.', 'Desserts & Sweets', '/src/assets/images/dessert_platter_1793294054844.jpg', '12, 1st Avenue, Shastri Nagar, Adyar', 'Chennai', true, 15, 200, 13.0012, 80.2565, 4.8, 130, 45],
      [22, 'Avocado & Greens Clean Kitchen', 'Macro-balanced keto bowls, Mediterranean falafel bowls, and chia seed puddings.', 'Healthy & Salads', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '27, Rajiv Gandhi Salai, OMR, Perungudi', 'Chennai', true, 30, 600, 12.9620, 80.2440, 4.5, 52, 16],
      [23, 'Squeeze & Sip Botanical Juicery', 'Cold-pressed immune booster shots, detox green juices, and thick mango smoothies.', 'Beverages & Juices', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '16, 3rd Avenue, Anna Nagar', 'Chennai', true, 15, 250, 13.0870, 80.2130, 4.6, 60, 20],
      [24, 'Kudla Coastal Kitchen', 'Mangalorean Kane fish rava fry, kori rotti with chicken curry, and neer dosa.', 'Seafood & Coastal', '/src/assets/images/biryani_specialty_1793294053906.jpg', '49, Lattice Bridge Road, Adyar', 'Chennai', false, 35, 700, 12.9990, 80.2550, 4.7, 71, 22],
      [25, 'Vidyarthi Heritage Tiffin', 'World-famous thick crispy benne masala dosa with white butter and spicy potato palya.', 'South Indian', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '82, Eldams Road, Alwarpet', 'Chennai', true, 25, 220, 13.0350, 80.2470, 4.8, 140, 50],
      [26, 'Dilli 6 Paranthe & Chole', 'Stuffed Amritsari aloo parathas, Delhi chole kulche, and sweet rabdi.', 'North Indian', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '11, Taylors Road, Kilpauk', 'Chennai', true, 25, 300, 13.0780, 80.2420, 4.5, 68, 21],
      [27, 'Rayalaseema Ruchulu', 'Spicy Rayalaseema ragi mudde, natu kodi pulusu (country chicken), and royyala vepudu.', 'Andhra & Telangana', '/src/assets/images/biryani_specialty_1793294053906.jpg', '73, Mount Road, Guindy', 'Chennai', false, 35, 680, 13.0067, 80.2025, 4.6, 59, 18],
      [28, 'Udupi Shri Krishna Grand', 'Pure sattvic Karnataka meals, bisibelebath, mangalore bajji, and filter coffee.', 'Pure Veg', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '36, Venkatanarayana Road, T. Nagar', 'Chennai', true, 20, 280, 13.0390, 80.2310, 4.7, 95, 34],
      [29, 'Amritsar Kulcha Junction', 'Tandoor-charred crisp layered chur-chur naan, pindi chole, and pickled onions.', 'Punjabi Dhaba', '/src/assets/images/biryani_specialty_1793294053906.jpg', '90, Arcot Road, Vadapalani', 'Chennai', true, 28, 380, 13.0500, 80.2120, 4.6, 63, 19],
      [30, 'Tokyo Sushi & Dim Sum House', 'Crispy tempura rolls, spicy salmon maki, steamed edamame, and miso broth.', 'Pan-Asian & Dimsum', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', '120, Radhakrishnan Salai, Mylapore', 'Chennai', false, 35, 1100, 13.0440, 80.2600, 4.8, 88, 25],
      [31, 'Hyderabad Nawabi Biryani', 'Kachchi dum biryani infused with potli masala, saffron, and tender goat meat.', 'Biryani & Mughlai', '/src/assets/images/biryani_specialty_1793294053906.jpg', '142, Rajiv Gandhi Salai, OMR, Thoraipakkam', 'Chennai', false, 28, 520, 12.9350, 80.2312, 4.7, 112, 39],
      [32, 'Sweet Bengal Mithai Mahal', 'Fresh soft rasgullas, nolen gur sandesh, cham cham, and rabri cups.', 'Desserts & Sweets', '/src/assets/images/dessert_platter_1793294054844.jpg', '55, Ormes Road, Kilpauk', 'Chennai', true, 18, 260, 13.0810, 80.2450, 4.7, 74, 28],
    ];

    this.restaurants = rawRestaurants.map(([id, name, description, cuisine_type, image_url, address, city, is_pure_veg, delivery_time_mins, price_for_two, latitude, longitude, avg_rating, review_count, order_count]) => ({
      id, name, description, cuisine_type, image_url, address, city, is_pure_veg, is_active: true, delivery_time_mins, price_for_two, latitude, longitude, avg_rating, review_count, order_count
    }));

    // Menu Items
    const rawMenuItems: [number, number, number, string, string, number, string, boolean][] = [
      [1, 1, 1, 'Royal Hyderabadi Mutton Dum Biryani', 'Tender spring lamb layered with fragrant aged saffron basmati rice, caramelized onions, and mint.', 480, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [2, 1, 1, 'Classic Chicken Dum Biryani (Handi)', 'Succulent bone-in chicken slow-cooked in sealed earthen clay handi with royal spices.', 380, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [3, 1, 1, 'Paneer Tikka Dum Biryani', 'Char-grilled cottage cheese marinated in tandoori yogurt marinade, layered with basmati.', 320, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [4, 1, 6, 'Royal Kesar Badam Lassi', 'Chilled sweet churned yogurt scented with pure Kashmiri saffron and slivered California almonds.', 140, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [20, 1, 8, 'Mughlai Chicken Butter Masala', 'Smoky boneless tandoori chicken simmered in rich cashew and tomato gravy with butter.', 420, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [21, 1, 8, 'Butter Garlic Naan (2 pcs)', 'Refined flour flatbread brushed with fresh minced garlic, cilantro, and melting butter.', 90, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [22, 1, 1, 'Egg Dum Biryani', 'Boiled farm-fresh eggs spiced with roasted masala and layered over long-grain saffron rice.', 280, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [5, 2, 2, 'Margherita Burrata Speciale', 'San Marzano DOP tomato sauce, fresh creamy burrata ball, basil olive oil drizzle.', 560, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [6, 2, 2, 'Smoked Pepperoni & Hot Honey Pizza', 'Spicy artisan pepperoni, aged fior di latte mozzarella, and fermented chili wildflower honey.', 620, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false],
      [7, 2, 2, 'Classic Margherita Pizza', 'Tangy crushed Italian tomatoes, fresh mozzarella, fresh torn basil leaves, extra virgin olive oil.', 420, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [8, 2, 2, 'Garlic & Rosemary Sourdough Focaccia', 'Warm wood-baked focaccia bread seasoned with roasted garlic, flaky sea salt, and wild rosemary.', 260, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [23, 2, 2, 'Quattro Formaggi (Four Cheese)', 'Gorgonzola, fontina, smoked provolone, and buffalo mozzarella over garlic herb base.', 590, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [24, 2, 2, 'Classic Truffle Penne Pasta', 'Al dente penne pasta in rich parmesan cream sauce scented with aromatic black truffle oil.', 490, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [25, 2, 4, 'Classic Italian Tiramisu', 'Espresso-soaked savoiardi ladyfingers layered with whipped mascarpone cream and cocoa dust.', 290, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [9, 3, 3, 'Signature Hakka Chili Garlic Noodles', 'Springy noodles tossed in smoking wok with crispy scallions, garlic chips, and seasonal greens.', 290, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [10, 3, 3, 'Crystal Prawn Har Gow (4 pcs)', 'Translucent pleated dumplings stuffed with juicy tiger prawns and water chestnuts.', 420, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [11, 3, 3, 'Truffle Edamame Dumplings (4 pcs)', 'Velvety edamame paste infused with black truffle oil in delicate spinach pastry wraps.', 360, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [12, 3, 3, 'Crispy Schezwan Spring Rolls', 'Golden crisp rolls filled with shredded vegetables and served with sweet plum dipping sauce.', 270, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [26, 3, 3, 'Kung Pao Chicken Rice Bowl', 'Wok-seared diced chicken with roasted peanuts, dried red chilies, and jasmine rice.', 390, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [27, 3, 3, 'Thai Green Curry with Jasmine Rice', 'Aromatic coconut lemongrass green curry with bamboo shoots, basil, and baby corn.', 410, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [13, 4, 4, 'Warm Angoori Gulab Jamun (2 pcs)', 'Soft melt-in-the-mouth fried milk dough dumplings soaked in fragrant cardamom rose syrup.', 130, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [14, 4, 4, 'Royal Kesar Rasmalai (2 pcs)', 'Delicate cottage cheese discs steeped in saffron cardamom thickened milk, pistachio flakes.', 170, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [15, 4, 17, 'Dahi Puri Chat Platter (6 pcs)', 'Crisp hollow puris loaded with spiced potatoes, sweet yogurt, tangy tamarind and mint chutney.', 180, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [16, 4, 4, 'Kaju Katli Gift Box (250g)', 'Diamond-shaped cashew fudge finished with pure edible silver leaf.', 360, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [28, 4, 17, 'Special Mumbai Pav Bhaji', 'Mashed spiced vegetable curry simmered on tawa, served with two butter-toasted pavs.', 190, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [29, 4, 17, 'Pani Puri Family Box (24 pcs)', 'Crisp puris with spicy mint water, sweet date-tamarind water, and boiled ragda stuffing.', 240, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [17, 5, 18, 'Mediterranean Quinoa Falafel Bowl', 'Herb-baked falafel, organic tri-color quinoa, pickled beetroot, hummus, and tahini drizzle.', 380, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [18, 5, 18, 'Avocado & Baby Spinach Caesar', 'Hass avocado chunks, crisp baby greens, toasted pumpkin seeds, and vegan parmesan dressing.', 340, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [19, 5, 6, 'Cold Pressed Valencia Orange Juice', '100% pure raw cold-pressed citrus juice with no added sugar or water.', 210, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [30, 5, 18, 'Grilled Tofu Protein Power Bowl', 'Herb-marinated smoked tofu, edamame, steamed brown rice, shredded carrot, and sesame ginger dressing.', 390, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [31, 5, 6, 'Matcha Green Tea Iced Latte', 'Stone-ground ceremonial grade Japanese matcha with unsweetened oat milk.', 220, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [32, 6, 19, 'Mangalorean Ghee Roast Prawns', 'Succulent tiger prawns tossed in rich Kundapur byadgi chili and pure ghee masala.', 580, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [33, 6, 19, 'Anjal (Kingfish) Tawa Fry', 'Fresh kingfish slice marinated in fiery coastal spices and pan-fried on tawa.', 620, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [34, 6, 19, 'Neer Dosa with Fish Curry (4 pcs)', 'Paper-thin delicate rice crepes served with traditional coconut-based fish curry.', 360, '/src/assets/images/hero_food_delivery_1793294052688.jpg', false],
      [35, 6, 19, 'Crab Sukka Coastal Masala', 'Fresh whole crab cooked with roasted grated coconut, curry leaves, and coastal spices.', 650, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [36, 7, 7, 'Ghee Open Masala Dosa', 'Crispy golden dosa topped with aromatic podi gunpowder, dollop of ghee, and spiced potato palya.', 140, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [37, 7, 7, 'Button Ghee Idli Sambar (14 pcs)', 'Mini steamed rice cakes immersed in hot tangy drumstick sambar and pure ghee.', 120, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [38, 7, 7, 'Crispy Medu Vada (2 pcs)', 'Golden crisp deep-fried lentil fritters with crushed black pepper and ginger.', 90, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [39, 7, 7, 'Traditional Mysore Filter Kaapi', 'Strong freshly brewed chicory-infused South Indian filter coffee in brass dabarah.', 60, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [40, 7, 7, 'Chow Chow Bath (Khara & Kesari)', 'A classic breakfast combo of spicy vegetable upma and rich pineapple sheera.', 130, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [41, 8, 13, 'Amritsari Butter Chicken', 'Tender charred boneless chicken chunks in rich makhani gravy finished with cream.', 440, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [42, 8, 13, 'Slow-Cooked Dal Makhani', 'Black urad lentils simmered overnight over slow tandoor fire with butter and cream.', 320, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [43, 8, 13, 'Paneer Tikka Lababdar', 'Charcoal-grilled paneer cubes in velvety onion tomato gravy with bell peppers.', 360, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [44, 8, 13, 'Stuffed Amritsari Aloo Kulcha', 'Flaky tandoori bread filled with spiced mashed potatoes, served with chole.', 160, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [45, 8, 6, 'Patiala Sweet Malai Lassi', 'Giant tumbler of thick churned sweet yogurt topped with rich clotted cream.', 120, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [46, 9, 9, 'Nagarjuna Roast Chili Chicken', 'Spicy dry boneless chicken cooked with green chilies, curry leaves, and turmeric.', 390, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [47, 9, 9, 'Andhra Mutton Fry (Sukka)', 'Tender goat meat pan-roasted with freshly crushed black pepper and Andhra spices.', 460, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [48, 9, 9, 'Gongura Mutton Curry', 'Tangy sorrel leaf puree slow-cooked with mutton, a fiery Guntur specialty.', 480, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [49, 9, 9, 'Authentic Andhra Veg Meals Box', 'Steamed sona masuri rice, kootu, sambar, rasam, gun powder podi, ghee, and curd.', 260, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [54, 11, 11, 'Chettinad Pepper Chicken Fry', 'Country chicken roasted with roasted whole black pepper, fennel, and shallots.', 370, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [55, 11, 11, 'Madurai Bun Parotta (2 pcs)', 'Crisp, puffed spiral flaky bread with soft melt-in-mouth layers.', 130, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [84, 19, 15, 'Classic Double Cheese Smash Burger', 'Two seared smashed beef patties, double American cheese, caramelized onions, secret sauce on brioche.', 420, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false],
      [88, 20, 16, 'Pure Butter Golden Croissant', 'Flaky, honeycomb-layered traditional French butter pastry baked fresh hourly.', 140, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [90, 20, 16, 'San Sebastian Basque Burnt Cheesecake', 'Creamy caramelized crust cheesecake with custardy melt-in-the-mouth center.', 260, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [92, 21, 17, 'Fresh Custard Apple (Sitaphal) Scoop', 'Natural seasonal custard apple pulp churned into creamy artisan milk gelato.', 120, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [119, 30, 3, 'Spicy Salmon Maki Roll (8 pcs)', 'Fresh Atlantic salmon, spicy mayo, cucumber, and toasted sesame wrapped in nori.', 620, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [123, 31, 1, 'Kachchi Dum Mutton Biryani', 'Raw marinated spring goat slow-cooked with parboiled saffron basmati rice.', 490, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [126, 32, 4, 'Spongy Kolkata Rasgulla (4 pcs)', 'Piping soft cottage cheese spheres steeped in warm, aromatic sugar syrup.', 120, '/src/assets/images/dessert_platter_1793294054844.jpg', true]
    ];

    const catMap = new Map(this.categories.map(c => [c.id, c.name]));
    this.menuItems = rawMenuItems.map(([id, restaurant_id, category_id, name, description, price, image_url, is_veg]) => ({
      id,
      restaurant_id,
      category_id,
      category_name: catMap.get(category_id) || 'General',
      name,
      description,
      price,
      image_url,
      is_veg,
      is_available: true,
      sold_qty: Math.floor(Math.random() * 40) + 10,
    }));

    // Addresses
    this.addresses = [
      { id: 1, user_id: 1, label: 'Home', street_address: 'Flat 402, Ceebros Palms, 2nd Avenue, Anna Nagar', landmark: 'Near Roundtana', city: 'Chennai', state: 'Tamil Nadu', postal_code: '600040', is_default: true, latitude: 13.0850, longitude: 80.2101 },
      { id: 2, user_id: 1, label: 'Work', street_address: '4th Floor, Tidel Park, Rajiv Gandhi Salai, Taramani', landmark: 'Opposite CSIR', city: 'Chennai', state: 'Tamil Nadu', postal_code: '600113', is_default: false, latitude: 12.9890, longitude: 80.2480 },
      { id: 3, user_id: 5, label: 'Home', street_address: 'Door 24, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur', landmark: 'Near Beach Walk', city: 'Chennai', state: 'Tamil Nadu', postal_code: '600041', is_default: true, latitude: 12.9810, longitude: 80.2640 },
      { id: 4, user_id: 5, label: 'Work', street_address: 'Level 6, Ramanujan IT City, Rajiv Gandhi Salai, Taramani', landmark: 'Block TRIL', city: 'Chennai', state: 'Tamil Nadu', postal_code: '600113', is_default: false, latitude: 12.9880, longitude: 80.2460 },
    ];

    // Coupons
    this.coupons.set('WELCOME100', { code: 'WELCOME100', discount_type: 'fixed', discount_value: 100, min_order_value: 399, max_discount: 100, is_active: true });
    this.coupons.set('BIRYANI100', { code: 'BIRYANI100', discount_type: 'fixed', discount_value: 100, min_order_value: 350, max_discount: 100, is_active: true });
    this.coupons.set('SWEETTOOTH', { code: 'SWEETTOOTH', discount_type: 'percentage', discount_value: 25, min_order_value: 200, max_discount: 150, is_active: true });
    this.coupons.set('CRAVE50', { code: 'CRAVE50', discount_type: 'percentage', discount_value: 50, min_order_value: 299, max_discount: 150, is_active: true });
    this.coupons.set('FEAST20', { code: 'FEAST20', discount_type: 'percentage', discount_value: 20, min_order_value: 499, max_discount: 200, is_active: true });

    // Reviews
    this.reviews = [
      { id: 1, customer_id: 1, customer_name: 'Aarav Sharma', restaurant_id: 1, rating: 5, review_text: 'Best Hyderabadi biryani in Chennai! Rice was fragrant and lamb was so tender.', created_at: '2026-09-18T14:20:00Z' },
      { id: 2, customer_id: 2, customer_name: 'Priya Patel', restaurant_id: 2, rating: 5, review_text: 'Authentic woodfired sourdough crust. The burrata was heavenly!', created_at: '2026-09-20T20:15:00Z' },
      { id: 3, customer_id: 3, customer_name: 'Rohan Gupta', restaurant_id: 7, rating: 5, review_text: 'Crispy ghee roast dosa with piping hot drumstick sambar and strong filter kaapi.', created_at: '2026-09-22T08:45:00Z' },
      { id: 4, customer_id: 4, customer_name: 'Ananya Iyer', restaurant_id: 11, rating: 4.8, review_text: 'Chettinad pepper chicken roast was fiery and aromatic with great depth.', created_at: '2026-09-25T13:10:00Z' },
      { id: 5, customer_id: 5, customer_name: 'Divya Sundaram', restaurant_id: 1, rating: 4.9, review_text: 'Super quick delivery to Thiruvanmiyur and great packaging.', created_at: '2026-10-12T19:30:00Z' },
    ];

    // Seed Orders (Historical September 2026 orders for DA2 queries + recent active orders)
    this.orders = [
      {
        id: 101,
        order_number: 'ORD-20260915-0101',
        customer_id: 1,
        customer_name: 'Aarav Sharma',
        customer_email: 'aarav@example.com',
        customer_phone: '+91 98765 43210',
        restaurant_id: 1,
        restaurant_name: 'Biryani Darbar',
        restaurant_image: '/src/assets/images/biryani_specialty_1793294053906.jpg',
        delivery_address_snapshot: 'Flat 402, Ceebros Palms, 2nd Avenue, Anna Nagar, Chennai',
        status: 'Delivered',
        item_subtotal: 960,
        coupon_discount: 100,
        loyalty_discount: 0,
        delivery_fee: 40,
        tax_amount: 45,
        final_total: 945,
        loyalty_percentage: 0,
        created_at: '2026-09-02T13:10:00Z',
        payment_method: 'UPI',
        transaction_ref: 'TXN_AARAV_01',
        items: [
          { id: 1, item_name: 'Royal Hyderabadi Mutton Dum Biryani', quantity: 2, unit_price: 480, line_total: 960 }
        ],
        timeline: [
          { id: 1, previous_status: '', new_status: 'Placed', actor: 'Customer', notes: 'Order placed', created_at: '2026-09-02T13:10:00Z' },
          { id: 2, previous_status: 'Placed', new_status: 'Delivered', actor: 'Vikram Delivery', notes: 'Delivered successfully', created_at: '2026-09-02T13:45:00Z' }
        ]
      },
      {
        id: 102,
        order_number: 'ORD-20260918-0102',
        customer_id: 1,
        customer_name: 'Aarav Sharma',
        customer_email: 'aarav@example.com',
        customer_phone: '+91 98765 43210',
        restaurant_id: 7,
        restaurant_name: 'Dakshin Tiffin Room',
        restaurant_image: '/src/assets/images/hero_food_delivery_1793294052688.jpg',
        delivery_address_snapshot: 'Flat 402, Ceebros Palms, 2nd Avenue, Anna Nagar, Chennai',
        status: 'Delivered',
        item_subtotal: 350,
        coupon_discount: 0,
        loyalty_discount: 0,
        delivery_fee: 40,
        tax_amount: 17.5,
        final_total: 407.5,
        loyalty_percentage: 0,
        created_at: '2026-09-05T08:30:00Z',
        payment_method: 'UPI',
        transaction_ref: 'TXN_AARAV_02',
        items: [
          { id: 2, item_name: 'Ghee Open Masala Dosa', quantity: 2, unit_price: 140, line_total: 280 },
          { id: 3, item_name: 'Traditional Mysore Filter Kaapi', quantity: 1, unit_price: 70, line_total: 70 }
        ],
        timeline: [
          { id: 3, previous_status: '', new_status: 'Placed', actor: 'Customer', notes: 'Order placed', created_at: '2026-09-05T08:30:00Z' },
          { id: 4, previous_status: 'Placed', new_status: 'Delivered', actor: 'Vikram Delivery', notes: 'Delivered', created_at: '2026-09-05T09:05:00Z' }
        ]
      },
      {
        id: 103,
        order_number: 'ORD-20260920-0103',
        customer_id: 1,
        customer_name: 'Aarav Sharma',
        customer_email: 'aarav@example.com',
        customer_phone: '+91 98765 43210',
        restaurant_id: 2,
        restaurant_name: 'Artisan Woodfired Pizzeria',
        restaurant_image: '/src/assets/images/woodfire_pizza_1793294053970.jpg',
        delivery_address_snapshot: 'Flat 402, Ceebros Palms, 2nd Avenue, Anna Nagar, Chennai',
        status: 'Delivered',
        item_subtotal: 820,
        coupon_discount: 100,
        loyalty_discount: 41,
        delivery_fee: 40,
        tax_amount: 35,
        final_total: 754,
        loyalty_percentage: 5,
        created_at: '2026-09-12T19:40:00Z',
        payment_method: 'Credit Card',
        transaction_ref: 'TXN_AARAV_03',
        items: [
          { id: 4, item_name: 'Margherita Burrata Speciale', quantity: 1, unit_price: 560, line_total: 560 },
          { id: 5, item_name: 'Garlic & Rosemary Sourdough Focaccia', quantity: 1, unit_price: 260, line_total: 260 }
        ],
        timeline: [
          { id: 5, previous_status: '', new_status: 'Placed', actor: 'Customer', notes: 'Order placed', created_at: '2026-09-12T19:40:00Z' },
          { id: 6, previous_status: 'Placed', new_status: 'Delivered', actor: 'Vikram Delivery', notes: 'Delivered', created_at: '2026-09-12T20:20:00Z' }
        ]
      },
      // Divya's 2 historical orders (as specified in chennai_migration)
      {
        id: 104,
        order_number: 'ORD-20260915-0104',
        customer_id: 5,
        customer_name: 'Divya Sundaram',
        customer_email: 'divya@cravecart.com',
        customer_phone: '+91 98400 12345',
        restaurant_id: 1,
        restaurant_name: 'Biryani Darbar',
        restaurant_image: '/src/assets/images/biryani_specialty_1793294053906.jpg',
        delivery_address_snapshot: 'Door 24, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai - 600041',
        status: 'Delivered',
        item_subtotal: 480,
        coupon_discount: 0,
        loyalty_discount: 0,
        delivery_fee: 40,
        tax_amount: 0,
        final_total: 520,
        loyalty_percentage: 0,
        created_at: '2026-09-15T13:00:00Z',
        payment_method: 'UPI',
        transaction_ref: 'TXN_DIVYA_001',
        items: [
          { id: 6, item_name: 'Royal Hyderabadi Mutton Dum Biryani', quantity: 1, unit_price: 480, line_total: 480 }
        ],
        timeline: [
          { id: 7, previous_status: '', new_status: 'Placed', actor: 'Customer', notes: 'Order placed', created_at: '2026-09-15T13:00:00Z' },
          { id: 8, previous_status: 'Placed', new_status: 'Delivered', actor: 'Vikram Delivery', notes: 'Delivered at Thiruvanmiyur', created_at: '2026-09-15T13:35:00Z' }
        ]
      },
      {
        id: 105,
        order_number: 'ORD-20261010-0105',
        customer_id: 5,
        customer_name: 'Divya Sundaram',
        customer_email: 'divya@cravecart.com',
        customer_phone: '+91 98400 12345',
        restaurant_id: 7,
        restaurant_name: 'Dakshin Tiffin Room',
        restaurant_image: '/src/assets/images/hero_food_delivery_1793294052688.jpg',
        delivery_address_snapshot: 'Door 24, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai - 600041',
        status: 'Delivered',
        item_subtotal: 260,
        coupon_discount: 0,
        loyalty_discount: 0,
        delivery_fee: 40,
        tax_amount: 0,
        final_total: 300,
        loyalty_percentage: 0,
        created_at: '2026-10-10T09:00:00Z',
        payment_method: 'Credit Card',
        transaction_ref: 'TXN_DIVYA_002',
        items: [
          { id: 7, item_name: 'Ghee Open Masala Dosa', quantity: 1, unit_price: 140, line_total: 140 },
          { id: 8, item_name: 'Button Ghee Idli Sambar (14 pcs)', quantity: 1, unit_price: 120, line_total: 120 }
        ],
        timeline: [
          { id: 9, previous_status: '', new_status: 'Placed', actor: 'Customer', notes: 'Order placed', created_at: '2026-10-10T09:00:00Z' },
          { id: 10, previous_status: 'Placed', new_status: 'Delivered', actor: 'Vikram Delivery', notes: 'Delivered safely', created_at: '2026-10-10T09:30:00Z' }
        ]
      },
      // Active orders for delivery agent & tracking demonstration
      {
        id: 106,
        order_number: 'ORD-20261029-0106',
        customer_id: 1,
        customer_name: 'Aarav Sharma',
        customer_email: 'aarav@example.com',
        customer_phone: '+91 98765 43210',
        restaurant_id: 1,
        restaurant_name: 'Biryani Darbar',
        restaurant_image: '/src/assets/images/biryani_specialty_1793294053906.jpg',
        delivery_address_snapshot: 'Flat 402, Ceebros Palms, 2nd Avenue, Anna Nagar, Chennai',
        status: 'Out for Delivery',
        item_subtotal: 520,
        coupon_discount: 0,
        loyalty_discount: 52,
        delivery_fee: 40,
        tax_amount: 26,
        final_total: 534,
        loyalty_percentage: 10,
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        payment_method: 'UPI',
        transaction_ref: 'TXN_LIVE_01',
        items: [
          { id: 9, item_name: 'Classic Chicken Dum Biryani (Handi)', quantity: 1, unit_price: 380, line_total: 380 },
          { id: 10, item_name: 'Royal Kesar Badam Lassi', quantity: 1, unit_price: 140, line_total: 140 }
        ],
        timeline: [
          { id: 11, previous_status: '', new_status: 'Placed', actor: 'Customer', notes: 'Order placed', created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
          { id: 12, previous_status: 'Placed', new_status: 'Confirmed', actor: 'Biryani Darbar Kitchen', notes: 'Kitchen accepted', created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
          { id: 13, previous_status: 'Confirmed', new_status: 'Preparing', actor: 'Chef', notes: 'Sealing clay handi', created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
          { id: 14, previous_status: 'Preparing', new_status: 'Out for Delivery', actor: 'Vikram Delivery', notes: 'Rider picked up and en route', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
        ]
      }
    ];
  }

  // Helper methods
  getCartId(userId: number): number {
    let cartId = this.carts.get(userId);
    if (!cartId) {
      cartId = ++this.nextCartId;
      this.carts.set(userId, cartId);
    }
    return cartId;
  }

  addCartItem(cartId: number, menuItemId: number, quantity: number, forceReset = false): void {
    if (forceReset) {
      this.cartItems = this.cartItems.filter(ci => ci.cart_id !== cartId);
    }
    const existing = this.cartItems.find(ci => ci.cart_id === cartId && ci.menu_item_id === menuItemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cartItems.push({
        id: ++this.nextCartItemId,
        cart_id: cartId,
        menu_item_id: menuItemId,
        quantity,
      });
    }
  }

  createOrder(data: Partial<MockOrder>): MockOrder {
    const id = ++this.nextOrderId;
    const now = new Date().toISOString();
    const order: MockOrder = {
      id,
      order_number: `ORD-${Date.now().toString().slice(-8)}`,
      customer_id: data.customer_id || 1,
      customer_name: data.customer_name || 'Customer',
      customer_email: data.customer_email || 'customer@example.com',
      customer_phone: data.customer_phone || '+91 98765 43210',
      restaurant_id: data.restaurant_id || 1,
      restaurant_name: data.restaurant_name || 'Biryani Darbar',
      restaurant_image: data.restaurant_image || '/src/assets/images/biryani_specialty_1793294053906.jpg',
      delivery_address_snapshot: data.delivery_address_snapshot || 'Chennai, Tamil Nadu',
      status: 'Placed',
      item_subtotal: data.item_subtotal || 0,
      coupon_discount: data.coupon_discount || 0,
      loyalty_discount: data.loyalty_discount || 0,
      delivery_fee: data.delivery_fee || 40,
      tax_amount: data.tax_amount || 0,
      final_total: data.final_total || 0,
      loyalty_percentage: data.loyalty_percentage || 0,
      created_at: now,
      payment_method: data.payment_method || 'UPI',
      transaction_ref: `TXN_${Date.now().toString().slice(-6)}`,
      items: data.items || [],
      timeline: [
        { id: Date.now(), previous_status: '', new_status: 'Placed', actor: 'Customer', notes: 'Order placed successfully', created_at: now },
      ]
    };
    this.orders.unshift(order);
    return order;
  }
}

export const mockStore = new MockDataStore();
