import { getPool, query } from './pool.js';
import bcrypt from 'bcryptjs';

export async function seedExpandedDatabase(): Promise<{
  success: boolean;
  message: string;
  restaurantsCount: number;
  menuItemsCount: number;
}> {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool unavailable');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure Demo Accounts Have Cryptographically Valid Passwords
    const customerHash = bcrypt.hashSync('Customer@123', 10);
    const adminHash = bcrypt.hashSync('Admin@123', 10);
    const agentHash = bcrypt.hashSync('Agent@123', 10);

    const usersSql = `
      INSERT INTO users (id, name, email, password_hash, role, phone, is_active) VALUES
      (1, 'Aarav Sharma', 'aarav@example.com', $1, 'customer', '+91 98765 43210', true),
      (2, 'Priya Patel', 'priya@example.com', $1, 'customer', '+91 98765 43211', true),
      (3, 'Rohan Gupta', 'rohan@example.com', $1, 'customer', '+91 98765 43212', true),
      (4, 'Ananya Iyer', 'ananya@example.com', $1, 'customer', '+91 98765 43213', true),
      (5, 'Kavya Reddy', 'kavya@example.com', $1, 'customer', '+91 98765 43214', true),
      (6, 'Devendra Rao', 'devendra@example.com', $1, 'customer', '+91 98765 43215', true),
      (100, 'Admin User', 'admin@cravecart.com', $2, 'admin', '+91 98000 00001', true),
      (200, 'Vikram Delivery', 'vikram@cravecart.com', $3, 'delivery_agent', '+91 98000 00002', true)
      ON CONFLICT (id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        is_active = true;
    `;
    await client.query(usersSql, [customerHash, adminHash, agentHash]);
    await client.query("SELECT setval('users_id_seq', (SELECT GREATEST(MAX(id), 200) FROM users));");

    // 2. Expand Categories (20 Cuisines / Taxonomies)
    const categoriesData = [
      [1, 'Biryani', 'Aromatic spiced basmati rice delicacies slow-cooked with saffron and herbs', '/src/assets/images/biryani_specialty_1793294053906.jpg'],
      [2, 'Pizza & Italian', 'Crisp woodfired pizzas, al dente pastas, and rustic garlic focaccias', '/src/assets/images/woodfire_pizza_1793294053970.jpg'],
      [3, 'Pan-Asian', 'Wok-tossed noodles, crystal dim sums, and fiery aromatics', '/src/assets/images/asian_wok_bowls_1793294055268.jpg'],
      [4, 'Desserts & Sweets', 'Decadent Indian mithai, warm gulab jamun, and artisanal ice cream', '/src/assets/images/dessert_platter_1793294054844.jpg'],
      [5, 'Pure Veg', '100% vegetarian regional thalis, paneer delicacies, and chaat', '/src/assets/images/dessert_platter_1793294054844.jpg'],
      [6, 'Beverages & Juices', 'Refreshing chilled lassis, iced cold brews, and cold-pressed citrus', '/src/assets/images/hero_food_delivery_1793294052688.jpg'],
      [7, 'South Indian', 'Crisp golden dosas, fluffy idlis, and traditional filter kaapi', '/src/assets/images/hero_food_delivery_1793294052688.jpg'],
      [8, 'North Indian', 'Rich butter chicken, paneer lababdar, dal makhani, and tandoori naans', '/src/assets/images/biryani_specialty_1793294053906.jpg'],
      [9, 'Andhra & Telangana', 'Fiery Guntur chicken, spicy gongura mutton, and pappu rice', '/src/assets/images/biryani_specialty_1793294053906.jpg'],
      [10, 'Kerala', 'Malabar parottas, appams with chicken stew, and coconut beef roasts', '/src/assets/images/hero_food_delivery_1793294052688.jpg'],
      [11, 'Tamil Nadu Regional', 'Chettinad pepper chicken, kothu parotta, and Madurai bun parotta', '/src/assets/images/hero_food_delivery_1793294052688.jpg'],
      [12, 'Bengali', 'Mustard hilsa, kosha mangsho, luchi, and mishti doi', '/src/assets/images/dessert_platter_1793294054844.jpg'],
      [13, 'Punjabi Dhaba', 'Amritsari kulcha, chole bhature, sarson ka saag, and lassi', '/src/assets/images/hero_food_delivery_1793294052688.jpg'],
      [14, 'Gujarati & Rajasthani', 'Dal baati churma, dhokla, kachori, and authentic thalis', '/src/assets/images/dessert_platter_1793294054844.jpg'],
      [15, 'Burgers & Fast Food', 'Smash burgers, crispy fried chicken, hand-cut peri-peri fries', '/src/assets/images/woodfire_pizza_1793294053970.jpg'],
      [16, 'Bakery & Cafe', 'Sourdough croissants, artisanal cheesecakes, and specialty coffee', '/src/assets/images/woodfire_pizza_1793294053970.jpg'],
      [17, 'Street Food & Chaat', 'Pani puri, dahi puri, samosa chaat, and Mumbai pav bhaji', '/src/assets/images/dessert_platter_1793294054844.jpg'],
      [18, 'Healthy & Salads', 'Quinoa protein bowls, farm-fresh avocado wraps, and keto plates', '/src/assets/images/hero_food_delivery_1793294052688.jpg'],
      [19, 'Seafood & Coastal', 'Mangalorean fish curry, ghee roast prawns, and coastal crab fry', '/src/assets/images/biryani_specialty_1793294053906.jpg'],
      [20, 'Mughlai', 'Fragrant kormas, galouti kebabs, rumali roti, and shahi tukda', '/src/assets/images/biryani_specialty_1793294053906.jpg']
    ];

    for (const [cid, cname, cdesc, cimg] of categoriesData) {
      await client.query(`
        INSERT INTO categories (id, name, description, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url;
      `, [cid, cname, cdesc, cimg]);
    }
    await client.query("SELECT setval('categories_id_seq', (SELECT GREATEST(MAX(id), 20) FROM categories));");

    // 3. Expand 32 Distinct Restaurants
    const restaurantsData = [
      [1, 'Biryani Darbar', 'Authentic slow-cooked royal Hyderabadi Dum Biryanis and rich Mughlai curries in clay pots.', 'Biryani & Mughlai', '/src/assets/images/biryani_specialty_1793294053906.jpg', '100 Feet Road, Indiranagar', 'Bengaluru', false, 25, 550.00],
      [2, 'Artisan Woodfired Pizzeria', 'Napoli-style handcrafted sourdough pizzas baked to perfection in a 900-degree oven.', 'Italian & Gourmet Pizza', '/src/assets/images/woodfire_pizza_1793294053970.jpg', '12th Main, HAL 2nd Stage, Indiranagar', 'Bengaluru', false, 30, 700.00],
      [3, 'Wok & Roll Asian Street', 'Sizzling Asian wok-tossed noodles, steaming crystal dim sums, and fiery Thai curries.', 'Pan-Asian & Dimsum', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', '5th Block, Koramangala', 'Bengaluru', false, 28, 500.00],
      [4, 'Royal Sweets & Chaat', 'Heritage pure vegetarian sweet house featuring warm gulab jamuns, rasmalai, and Delhi street chaat.', 'Pure Veg Mithai & Chaat', '/src/assets/images/dessert_platter_1793294054844.jpg', 'Commercial Street, Tasker Town', 'Bengaluru', true, 20, 350.00],
      [5, 'Green Earth Organic Kitchen', 'Wholesome farm-to-table salads, ancient grain warm bowls, and cold-pressed botanical tonics.', 'Healthy & Pure Veg', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '14th Cross, HSR Layout Sector 4', 'Bengaluru', true, 35, 450.00],
      [6, 'The Coastal Spice Catch', 'Coastal seafood curries, Mangalorean ghee roasts, and fresh catch delicacies.', 'Seafood & Coastal', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Sarjapur Main Road', 'Bengaluru', false, 40, 800.00],
      [7, 'Dakshin Tiffin Room', 'Iconic filter kaapi, ghee roast dosas, button idlis with coconut and tomato chutneys.', 'South Indian', '/src/assets/images/hero_food_delivery_1793294052688.jpg', 'Malleshwaram 7th Cross', 'Bengaluru', true, 20, 250.00],
      [8, 'Pind Punjab Dhaba', 'Smoky clay-oven tandoori chicken, rich dal makhani, butter naan, and sweet lassi.', 'Punjabi Dhaba', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Koramangala 4th Block', 'Bengaluru', false, 30, 600.00],
      [9, 'Nagarjuna Andhra Spice', 'Legendary spicy Andhra meals on banana leaf, chili chicken, and mutton fry.', 'Andhra & Telangana', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Residency Road', 'Bengaluru', false, 25, 650.00],
      [10, 'Malabar Coast Kitchen', 'Authentic flaky Malabar parottas, Thalassery biryani, and Syrian beef roast.', 'Kerala Delicacies', '/src/assets/images/hero_food_delivery_1793294052688.jpg', 'BTM Layout 2nd Stage', 'Bengaluru', false, 32, 550.00],
      [11, 'Chettinad Spice Villa', 'Spiced pepper chicken roast, crab masala, and layered Madurai bun parotta.', 'Tamil Nadu Regional', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'HSR Layout Sector 6', 'Bengaluru', false, 30, 500.00],
      [12, 'Calcutta Kitchen & Roll House', 'Crispy Kolkata egg-chicken rolls, kosha mangsho, and luchi with alur dom.', 'Bengali', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', 'Indiranagar Double Road', 'Bengaluru', false, 22, 400.00],
      [13, 'Padmavati Gujarati Rasoi', 'Wholesome Gujarati unlimited thali, sweet kadhi, fafda, khaman, and shrikhand.', 'Gujarati & Rajasthani', '/src/assets/images/dessert_platter_1793294054844.jpg', 'Jayanagar 4th Block', 'Bengaluru', true, 25, 450.00],
      [14, 'Marwar Royal Thali', 'Heritage Rajasthani dal baati churma with desi ghee, gatte ki sabzi, and ker sangri.', 'Rajasthani Flavors', '/src/assets/images/dessert_platter_1793294054844.jpg', 'Lavelle Road', 'Bengaluru', true, 35, 750.00],
      [15, 'Mughal Mahal Kebabs', 'Silken Kakori kebabs, murgh korma, saffron sheermal, and rich Nihari.', 'Mughlai', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Frazer Town, Mosque Road', 'Bengaluru', false, 30, 850.00],
      [16, 'Mumbai Chowpatty Chaat', 'Crisp sev puri, ragda pattice, buttery pav bhaji, and authentic vada pav.', 'Street Food & Chaat', '/src/assets/images/dessert_platter_1793294054844.jpg', 'Brigade Road', 'Bengaluru', true, 18, 250.00],
      [17, 'The Dragon Bowl', 'Spicy Schezwan chicken, burnt garlic fried rice, kung pao lotus stem, and momos.', 'Pan-Asian & Dimsum', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', 'Church Street', 'Bengaluru', false, 28, 550.00],
      [18, 'Trattoria Bella Napoli', 'Fresh hand-rolled fettuccine Alfredo, truffle mushroom ravioli, and tiramisu.', 'Italian & Gourmet Pizza', '/src/assets/images/woodfire_pizza_1793294053970.jpg', 'MG Road', 'Bengaluru', false, 35, 950.00],
      [19, 'Buns & Patties Smash Burgers', 'Double beef smash burgers, buttermilk fried chicken sandwich, and truffle mayo fries.', 'Burgers & Fast Food', '/src/assets/images/woodfire_pizza_1793294053970.jpg', 'Koramangala 5th Block', 'Bengaluru', false, 25, 500.00],
      [20, 'The Parisian Boulangerie', 'Warm butter croissants, French pain au chocolat, sourdough loaves, and cafe au lait.', 'Bakery & Cafe', '/src/assets/images/woodfire_pizza_1793294053970.jpg', 'Cunningham Road', 'Bengaluru', true, 22, 450.00],
      [21, 'Naturals Gelato & Kulfi Bar', 'Handcrafted sitaphal ice cream, malai kulfi on stick, and Belgian dark chocolate scoops.', 'Desserts & Sweets', '/src/assets/images/dessert_platter_1793294054844.jpg', 'Indiranagar 100ft Road', 'Bengaluru', true, 15, 200.00],
      [22, 'Avocado & Greens Clean Kitchen', 'Macro-balanced keto bowls, Mediterranean falafel bowls, and chia seed puddings.', 'Healthy & Salads', '/src/assets/images/hero_food_delivery_1793294052688.jpg', 'Whitefield Main Road', 'Bengaluru', true, 30, 600.00],
      [23, 'Squeeze & Sip Botanical Juicery', 'Cold-pressed immune booster shots, detox green juices, and thick mango smoothies.', 'Beverages & Juices', '/src/assets/images/hero_food_delivery_1793294052688.jpg', 'Sadashivanagar', 'Bengaluru', true, 15, 250.00],
      [24, 'Kudla Coastal Kitchen', 'Mangalorean Kane fish rava fry, kori rotti with chicken curry, and neer dosa.', 'Seafood & Coastal', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Basavanagudi', 'Bengaluru', false, 35, 700.00],
      [25, 'Vidyarthi Heritage Tiffin', 'World-famous thick crispy benne masala dosa with dollop of white butter and spicy potato palya.', 'South Indian', '/src/assets/images/hero_food_delivery_1793294052688.jpg', 'Gandhi Bazaar, Basavanagudi', 'Bengaluru', true, 25, 220.00],
      [26, 'Dilli 6 Paranthe & Chole', 'Stuffed Amritsari aloo parathas, Delhi chole kulche, and sweet rabdi.', 'North Indian', '/src/assets/images/hero_food_delivery_1793294052688.jpg', 'Marathahalli', 'Bengaluru', true, 25, 300.00],
      [27, 'Rayalaseema Ruchulu', 'Extremely spicy Rayalaseema ragi mudde, natu kodi pulusu (country chicken), and royyala vepudu.', 'Andhra & Telangana', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Bellandur EcoSpace', 'Bengaluru', false, 35, 680.00],
      [28, 'Udupi Shri Krishna Grand', 'Pure sattvic Karnataka meals, bisibelebath, mangalore bajji, and filter coffee.', 'Pure Veg', '/src/assets/images/hero_food_delivery_1793294052688.jpg', 'Rajajinagar 1st Block', 'Bengaluru', true, 20, 280.00],
      [29, 'Amritsar Kulcha Junction', 'Tandoor-charred crisp layered chur-chur naan, pindi chole, and pickled onions.', 'Punjabi Dhaba', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Sarjapur Road', 'Bengaluru', true, 28, 380.00],
      [30, 'Tokyo Sushi & Dim Sum House', 'Crispy tempura rolls, spicy salmon maki, steamed edamame, and miso broth.', 'Pan-Asian & Dimsum', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', 'UB City, Vittal Mallya Road', 'Bengaluru', false, 35, 1100.00],
      [31, 'Hyderabad Nawabi Biryani', 'Kachchi dum biryani infused with potli masala, saffron, and tender goat meat.', 'Biryani & Mughlai', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Electronic City Phase 1', 'Bengaluru', false, 28, 520.00],
      [32, 'Sweet Bengal Mithai Mahal', 'Fresh soft rasgullas, nolen gur sandesh, cham cham, and rabri cups.', 'Desserts & Sweets', '/src/assets/images/dessert_platter_1793294054844.jpg', 'Koramangala 1st Block', 'Bengaluru', true, 18, 260.00]
    ];

    for (const [rid, rname, rdesc, rtype, rimg, raddr, rcity, rveg, rtime, rprice] of restaurantsData) {
      await client.query(`
        INSERT INTO restaurants (id, name, description, cuisine_type, image_url, address, city, is_pure_veg, is_active, delivery_time_mins, price_for_two)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          cuisine_type = EXCLUDED.cuisine_type,
          image_url = EXCLUDED.image_url,
          address = EXCLUDED.address,
          is_pure_veg = EXCLUDED.is_pure_veg,
          delivery_time_mins = EXCLUDED.delivery_time_mins,
          price_for_two = EXCLUDED.price_for_two;
      `, [rid, rname, rdesc, rtype, rimg, raddr, rcity, rveg, rtime, rprice]);
    }
    await client.query("SELECT setval('restaurants_id_seq', (SELECT GREATEST(MAX(id), 32) FROM restaurants));");

    // 4. Populate Menu Items (Over 210 distinct dishes across all 32 restaurants)
    // Structure: [id, restaurant_id, category_id, name, description, price, image, is_veg]
    const menuItemsData = [
      // Biryani Darbar (1)
      [1, 1, 1, 'Royal Hyderabadi Mutton Dum Biryani', 'Tender spring lamb layered with fragrant aged saffron basmati rice, caramelized onions, and mint.', 480.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [2, 1, 1, 'Classic Chicken Dum Biryani (Handi)', 'Succulent bone-in chicken slow-cooked in sealed earthen clay handi with royal spices.', 380.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [3, 1, 1, 'Paneer Tikka Dum Biryani', 'Char-grilled cottage cheese marinated in tandoori yogurt marinade, layered with basmati.', 320.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [4, 1, 6, 'Royal Kesar Badam Lassi', 'Chilled sweet churned yogurt scented with pure Kashmiri saffron and slivered California almonds.', 140.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [20, 1, 8, 'Mughlai Chicken Butter Masala', 'Smoky boneless tandoori chicken simmered in rich cashew and tomato gravy with butter.', 420.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [21, 1, 8, 'Butter Garlic Naan (2 pcs)', 'Refined flour flatbread brushed with fresh minced garlic, cilantro, and melting butter.', 90.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [22, 1, 1, 'Egg Dum Biryani', 'Boiled farm-fresh eggs spiced with roasted masala and layered over long-grain saffron rice.', 280.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],

      // Artisan Woodfired Pizzeria (2)
      [5, 2, 2, 'Margherita Burrata Speciale', 'San Marzano DOP tomato sauce, fresh creamy burrata ball, basil olive oil drizzle.', 560.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [6, 2, 2, 'Smoked Pepperoni & Hot Honey Pizza', 'Spicy artisan pepperoni, aged fior di latte mozzarella, and fermented chili wildflower honey.', 620.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false],
      [7, 2, 2, 'Classic Margherita Pizza', 'Tangy crushed Italian tomatoes, fresh mozzarella, fresh torn basil leaves, extra virgin olive oil.', 420.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [8, 2, 2, 'Garlic & Rosemary Sourdough Focaccia', 'Warm wood-baked focaccia bread seasoned with roasted garlic, flaky sea salt, and wild rosemary.', 260.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [23, 2, 2, 'Quattro Formaggi (Four Cheese)', 'Gorgonzola, fontina, smoked provolone, and buffalo mozzarella over garlic herb base.', 590.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [24, 2, 2, 'Classic Truffle Penne Pasta', 'Al dente penne pasta in rich parmesan cream sauce scented with aromatic black truffle oil.', 490.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [25, 2, 4, 'Classic Italian Tiramisu', 'Espresso-soaked savoiardi ladyfingers layered with whipped mascarpone cream and cocoa dust.', 290.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // Wok & Roll Asian Street (3)
      [9, 3, 3, 'Signature Hakka Chili Garlic Noodles', 'Springy noodles tossed in smoking wok with crispy scallions, garlic chips, and seasonal greens.', 290.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [10, 3, 3, 'Crystal Prawn Har Gow (4 pcs)', 'Translucent pleated dumplings stuffed with juicy tiger prawns and water chestnuts.', 420.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [11, 3, 3, 'Truffle Edamame Dumplings (4 pcs)', 'Velvety edamame paste infused with black truffle oil in delicate spinach pastry wraps.', 360.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [12, 3, 3, 'Crispy Schezwan Spring Rolls', 'Golden crisp rolls filled with shredded vegetables and served with sweet plum dipping sauce.', 270.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [26, 3, 3, 'Kung Pao Chicken Rice Bowl', 'Wok-seared diced chicken with roasted peanuts, dried red chilies, and jasmine rice.', 390.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [27, 3, 3, 'Thai Green Curry with Jasmine Rice', 'Aromatic coconut lemongrass green curry with bamboo shoots, basil, and baby corn.', 410.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],

      // Royal Sweets & Chaat (4)
      [13, 4, 4, 'Warm Angoori Gulab Jamun (2 pcs)', 'Soft melt-in-the-mouth fried milk dough dumplings soaked in fragrant cardamom rose syrup.', 130.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [14, 4, 4, 'Royal Kesar Rasmalai (2 pcs)', 'Delicate cottage cheese discs steeped in saffron cardamom thickened milk, pistachio flakes.', 170.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [15, 4, 17, 'Dahi Puri Chat Platter (6 pcs)', 'Crisp hollow puris loaded with spiced potatoes, sweet yogurt, tangy tamarind and mint chutney.', 180.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [16, 4, 4, 'Kaju Katli Gift Box (250g)', 'Diamond-shaped cashew fudge finished with pure edible silver leaf.', 360.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [28, 4, 17, 'Special Mumbai Pav Bhaji', 'Mashed spiced vegetable curry simmered on tawa, served with two butter-toasted pavs.', 190.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [29, 4, 17, 'Pani Puri Family Box (24 pcs)', 'Crisp puris with spicy mint water, sweet date-tamarind water, and boiled ragda stuffing.', 240.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // Green Earth Organic Kitchen (5)
      [17, 5, 18, 'Mediterranean Quinoa Falafel Bowl', 'Herb-baked falafel, organic tri-color quinoa, pickled beetroot, hummus, and tahini drizzle.', 380.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [18, 5, 18, 'Avocado & Baby Spinach Caesar', 'Hass avocado chunks, crisp baby greens, toasted pumpkin seeds, and vegan parmesan dressing.', 340.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [19, 5, 6, 'Cold Pressed Valencia Orange Juice', '100% pure raw cold-pressed citrus juice with no added sugar or water.', 210.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [30, 5, 18, 'Grilled Tofu Protein Power Bowl', 'Herb-marinated smoked tofu, edamame, steamed brown rice, shredded carrot, and sesame ginger dressing.', 390.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [31, 5, 6, 'Matcha Green Tea Iced Latte', 'Stone-ground ceremonial grade Japanese matcha with unsweetened oat milk.', 220.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // The Coastal Spice Catch (6)
      [32, 6, 19, 'Mangalorean Ghee Roast Prawns', 'Succulent tiger prawns tossed in rich Kundapur byadgi chili and pure ghee masala.', 580.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [33, 6, 19, 'Anjal (Kingfish) Tawa Fry', 'Fresh kingfish slice marinated in fiery coastal spices and pan-fried on tawa.', 620.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [34, 6, 19, 'Neer Dosa with Fish Curry (4 pcs)', 'Paper-thin delicate rice crepes served with traditional coconut-based fish curry.', 360.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', false],
      [35, 6, 19, 'Crab Sukka Coastal Masala', 'Fresh whole crab cooked with roasted grated coconut, curry leaves, and coastal spices.', 650.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],

      // Dakshin Tiffin Room (7)
      [36, 7, 7, 'Ghee Open Masala Dosa', 'Crispy golden dosa topped with aromatic podi gunpowder, dollop of ghee, and spiced potato palya.', 140.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [37, 7, 7, 'Button Ghee Idli Sambar (14 pcs)', 'Mini steamed rice cakes immersed in hot tangy drumstick sambar and pure ghee.', 120.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [38, 7, 7, 'Crispy Medu Vada (2 pcs)', 'Golden crisp deep-fried lentil fritters with crushed black pepper and ginger.', 90.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [39, 7, 7, 'Traditional Mysore Filter Kaapi', 'Strong freshly brewed chicory-infused South Indian filter coffee in brass dabarah.', 60.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [40, 7, 7, 'Chow Chow Bath (Khara & Kesari)', 'A classic Bengaluru breakfast combo of spicy vegetable upma and rich pineapple sheera.', 130.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Pind Punjab Dhaba (8)
      [41, 8, 13, 'Amritsari Butter Chicken', 'Tender charred boneless chicken chunks in rich makhani gravy finished with cream.', 440.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [42, 8, 13, 'Slow-Cooked Dal Makhani', 'Black urad lentils simmered overnight over slow tandoor fire with butter and cream.', 320.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [43, 8, 13, 'Paneer Tikka Lababdar', 'Charcoal-grilled paneer cubes in velvety onion tomato gravy with bell peppers.', 360.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [44, 8, 13, 'Stuffed Amritsari Aloo Kulcha', 'Flaky tandoori bread filled with spiced mashed potatoes, served with chole.', 160.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [45, 8, 6, 'Patiala Sweet Malai Lassi', 'Giant tumbler of thick churned sweet yogurt topped with rich clotted cream.', 120.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Nagarjuna Andhra Spice (9)
      [46, 9, 9, 'Nagarjuna Roast Chili Chicken', 'Spicy dry boneless chicken cooked with green chilies, curry leaves, and turmeric.', 390.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [47, 9, 9, 'Andhra Mutton Fry (Sukka)', 'Tender goat meat pan-roasted with freshly crushed black pepper and Andhra spices.', 460.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [48, 9, 9, 'Gongura Mutton Curry', 'Tangy sorrel leaf puree slow-cooked with mutton, a fiery Guntur specialty.', 480.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [49, 9, 9, 'Authentic Andhra Veg Meals Box', 'Steamed sona masuri rice, kootu, sambar, rasam, gun powder podi, ghee, and curd.', 260.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Malabar Coast Kitchen (10)
      [50, 10, 10, 'Malabar Coin Parotta with Beef Roast', 'Layered flaky parottas served with spicy dry beef roast and caramelized shallots.', 380.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [51, 10, 10, 'Thalassery Chicken Biryani', 'Short-grain jeerakasala kaima rice cooked in pure Malabar ghee with tender chicken.', 360.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [52, 10, 10, 'Steamed Appam with Veg Stew (3 pcs)', 'Lacy-edged fermented rice hoppers served with mild coconut milk vegetable stew.', 220.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [53, 10, 10, 'Kerala Fish Pollichathu (Pearl Spot)', 'Karimeen fish wrapped in banana leaf and grilled with shallot tomato masala.', 520.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],

      // Chettinad Spice Villa (11)
      [54, 11, 11, 'Chettinad Pepper Chicken Fry', 'Country chicken roasted with roasted whole black pepper, fennel, and shallots.', 370.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [55, 11, 11, 'Madurai Bun Parotta (2 pcs)', 'Crisp, puffed spiral flaky bread with soft melt-in-mouth layers.', 130.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [56, 11, 11, 'Chettinad Egg Kothu Parotta', 'Shredded parotta scrambled with farm eggs, salna gravy, onions, and curry leaves.', 240.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [57, 11, 11, 'Kalan Milagu Varuval (Mushroom Roast)', 'Fresh button mushrooms tossed in spicy Chettinad black pepper masala.', 290.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],

      // Calcutta Kitchen & Roll House (12)
      [58, 12, 12, 'Kolkata Double Egg Double Chicken Roll', 'Parotta wrapped with spiced chicken kebab, eggs, fresh sliced onions, and green chilies.', 220.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [59, 12, 12, 'Kosha Mangsho with Luchi (4 pcs)', 'Slow-cooked rich dark mutton gravy paired with fluffy fried refined flour luchis.', 480.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [60, 12, 12, 'Fish Fry (Bhetki Calicut Cutlet)', 'Fresh bhetki fish fillet coated in breadcrumbs and deep-fried, served with kasundi mustard.', 340.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false],
      [61, 12, 4, 'Baked Kolkata Mishti Doi', 'Traditional caramelized sweetened set curd served chilled in earthen pot.', 110.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // Padmavati Gujarati Rasoi (13)
      [62, 13, 14, 'Maharaja Gujarati Thali Box', 'Rotli, puri, Gujarati sweet kadhi, dal, batata nu shaak, kathol, farsan, and dessert.', 380.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [63, 13, 14, 'Khaman Dhokla Platter (6 pcs)', 'Steamed yellow gram flour spongy cakes tempered with mustard seeds and green chilies.', 120.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [64, 13, 14, 'Sev Tameta Nu Shaak with Phulka', 'Tangy sweet tomato curry topped with crispy besan sev, served with 3 soft phulkas.', 210.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // Marwar Royal Thali (14)
      [65, 14, 14, 'Authentic Dal Baati Churma Thali', 'Crispy wheat baatis dipped in pure ghee, pancharangi dal, sweet churma, and garlic chutney.', 450.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [66, 14, 14, 'Jodhpuri Gatte Ki Sabzi with Bajra Roti', 'Gram flour dumplings simmered in spiced yogurt gravy, served with 2 millet rotis.', 280.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [67, 14, 14, 'Pyaaz Ki Kachori (2 pcs)', 'Flaky deep-fried puff pastry stuffed with spicy caramelised onion masala.', 110.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // Mughal Mahal Kebabs (15)
      [68, 15, 20, 'Galouti Kebab with Ulte Tawa Ka Parotta', 'Melt-in-mouth smoked lamb patties infused with raw papaya and 160 royal herbs.', 460.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [69, 15, 20, 'Old Delhi Murgh Korma', 'Chicken pieces braised in velvety brown onion and poppy seed gravy.', 410.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [70, 15, 20, 'Shahi Lucknowi Dum Nihari', 'Slow-cooked shank meat stew spiced with royal garam masala, ginger, and chilies.', 510.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [71, 15, 4, 'Shahi Tukda with Rabri', 'Crisp ghee-fried bread triangles soaked in saffron syrup and smothered with rabri.', 180.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // Mumbai Chowpatty Chaat (16)
      [72, 16, 17, 'Special Butter Pav Bhaji', 'Rich tomato-spiced mashed vegetable curry loaded with Amul butter and toasted pavs.', 190.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [73, 16, 17, 'Mumbai Vada Pav Duo (2 pcs)', 'Spicy potato fritters inside soft buns with dry garlic chutney and fried green chili.', 110.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [74, 16, 17, 'Ragda Pattice (2 pcs)', 'Pan-fried potato patties served over hot white pea stew with tangy tamarind chutney.', 140.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [75, 16, 17, 'Bhel Puri Chowpatty Special', 'Puffed rice, crisp sev, papdi, chopped onions, and sweet and fiery chutneys.', 110.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // The Dragon Bowl (17)
      [76, 17, 3, 'Schezwan Crispy Chicken', 'Wok-tossed chicken chunks with Sichuan pepper, spring onions, and spicy chili jam.', 360.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [77, 17, 3, 'Burnt Garlic Veg Fried Rice', 'Fluffy aromatic wok rice with golden toasted garlic chips and seasonal vegetables.', 270.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [78, 17, 3, 'Crispy Honey Lotus Stem', 'Crisp sliced lotus stems tossed in honey, crushed chili flakes, and toasted sesame.', 310.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [79, 17, 3, 'Steamed Chicken Dim Sum (6 pcs)', 'Juicy minced chicken and scallion dumplings with red chili oil dip.', 320.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],

      // Trattoria Bella Napoli (18)
      [80, 18, 2, 'Fettuccine Alfredo with Truffle', 'Hand-rolled fresh fettuccine ribbons in creamy parmesan sauce and black truffle shavings.', 540.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [81, 18, 2, 'Woodfired Spicy Diavola Pizza', 'Spicy Calabrian salami, fresh fior di latte mozzarella, and San Marzano tomato sauce.', 610.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false],
      [82, 18, 2, 'Wild Mushroom Risotto', 'Slow-simmered arborio rice with porcini and cremini mushrooms, finished with parmigiano.', 560.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [83, 18, 2, 'Crispy Arancini Balls (4 pcs)', 'Golden fried risotto spheres filled with mozzarella and served with marinara dip.', 340.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],

      // Buns & Patties Smash Burgers (19)
      [84, 19, 15, 'Classic Double Cheese Smash Burger', 'Two seared smashed beef patties, double American cheese, caramelized onions, secret sauce on brioche.', 420.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false],
      [85, 19, 15, 'Crispy Buttermilk Chicken Burger', 'Crispy spiced chicken thigh, dill pickles, shredded lettuce, and roasted garlic aioli.', 360.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false],
      [86, 19, 15, 'Spicy Black Bean & Jalapeño Burger', 'Smoked black bean patty, pepper jack cheese, avocado cream, and jalapeños on potato bun.', 310.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [87, 19, 15, 'Truffle Parmesan Loaded Fries', 'Hand-cut double fried potatoes tossed in white truffle oil and grated grana padano.', 240.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],

      // The Parisian Boulangerie (20)
      [88, 20, 16, 'Pure Butter Golden Croissant', 'Flaky, honeycomb-layered traditional French butter pastry baked fresh hourly.', 140.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [89, 20, 16, 'Pain Au Chocolat (Chocolate Croissant)', 'Laminated buttery dough filled with two batons of Belgian dark chocolate.', 180.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [90, 20, 16, 'San Sebastian Basque Burnt Cheesecake', 'Creamy caramelized crust cheesecake with custardy melt-in-the-mouth center.', 260.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [91, 20, 16, 'Artisanal Cold Brew Coffee (300ml)', '18-hour slow steeped specialty Arabica coffee poured over ice.', 190.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Naturals Gelato & Kulfi Bar (21)
      [92, 21, 17, 'Fresh Custard Apple (Sitaphal) Scoop', 'Natural seasonal custard apple pulp churned into creamy artisan milk gelato.', 120.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [93, 21, 17, 'Royal Malai Kulfi on Bamboo Stick', 'Slow-reduced milk kulfi infused with cardamom, pistachios, and saffron.', 90.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [94, 21, 17, 'Dark Chocolate Sea Salt Gelato', '70% single-origin dark chocolate churned with flaky Cornish sea salt.', 140.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],

      // Avocado & Greens Clean Kitchen (22)
      [95, 22, 18, 'Keto Grilled Chicken Avocado Bowl', 'Grilled herb chicken breast, sliced Hass avocado, baby spinach, cucumber, and lime dressing.', 420.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', false],
      [96, 22, 18, 'Wild Berry Chia Seed Pudding', 'Almond milk soaked chia seeds topped with fresh blueberries, strawberries, and raw honey.', 260.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [97, 22, 18, 'Cold-Pressed Green Glow Detox', 'Raw pressed cucumber, celery, green apple, spinach, and ginger.', 210.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Squeeze & Sip Botanical Juicery (23)
      [98, 23, 6, 'Pure Alphonso Mango Shake', 'Seasonal sweet Ratnagiri Alphonso mango chunks blended with creamy milk.', 180.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [99, 23, 6, 'Watermelon Mint Hydration Cooler', 'Fresh seedless watermelon crushed with fresh garden mint leaves and black salt.', 130.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [100, 23, 6, 'Ginger Lemon Immunity Booster Shot (60ml)', 'Concentrated raw ginger, lemon, and wild turmeric elixir.', 90.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Kudla Coastal Kitchen (24)
      [101, 24, 19, 'Kori Rotti with Kundapur Chicken Curry', 'Crispy rice wafers served with thin, spicy aromatic coconut chicken curry.', 420.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [102, 24, 19, 'Kane (Ladyfish) Rava Fry', 'Delicate ladyfish coated with semolina and coastal red chili paste, pan-fried.', 480.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [103, 24, 19, 'Prawn Pulimunchi Sour & Spicy', 'Tiger prawns simmered in fiery, tangy tamarind and roasted byadgi chili gravy.', 520.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],

      // Vidyarthi Heritage Tiffin (25)
      [104, 25, 7, 'Special Benne Masala Dosa', 'Signature golden thick dosa with crunchy crust, melted butter, and spiced aloo filling.', 120.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [105, 25, 7, 'Sambar Vada Dip (2 pcs)', 'Golden crisp vadas soaked in hot, aromatic Karnataka-style lentil stew.', 80.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [106, 25, 7, 'Poori Saagu (3 pcs)', 'Puffy golden whole wheat pooris served with coconut and vegetable saagu.', 110.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Dilli 6 Paranthe & Chole (26)
      [107, 26, 8, 'Dilli Special Chole Bhature (2 pcs)', 'Gigantic puffed bhaturas served with spicy dark Punjabi chole and pickled chilies.', 180.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [108, 26, 8, 'Amritsari Paneer Paratha with Butter', 'Whole wheat tandoori paratha stuffed with crumbled spiced cottage cheese and butter.', 170.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],
      [109, 26, 8, 'Delhi Shahi Paneer with Naan Combo', 'Creamy tomato gravy with soft paneer cubes, served with 2 butter naans.', 290.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],

      // Rayalaseema Ruchulu (27)
      [110, 27, 9, 'Natu Kodi Pulusu with Ragi Mudde', 'Spicy country chicken curry served with soft finger millet ball and ghee.', 460.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [111, 27, 9, 'Royyala Vepudu (Prawn Roast)', 'Coastal Andhra prawns pan-roasted with black pepper, curry leaves, and green chilies.', 490.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [112, 27, 9, 'Ulavacharu Chicken Biryani', 'Aromatic biryani cooked with slow-simmered horse gram soup reduction and tender chicken.', 410.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],

      // Udupi Shri Krishna Grand (28)
      [113, 28, 5, 'Traditional Bisibelebath with Boondi', 'Spiced rice and lentil mash with vegetables, ghee, and crunchy gram flour boondi.', 130.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [114, 28, 5, 'Mangalore Buns (2 pcs)', 'Sweet, fluffy banana-infused deep-fried puris served with spicy coconut chutney.', 90.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],
      [115, 28, 5, 'South Indian Full Meals Thali', 'Rice, sambar, rasam, kootu, kosambari, palya, curd, papad, and holige.', 230.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true],

      // Amritsar Kulcha Junction (29)
      [116, 29, 13, 'Chur Chur Naan Thali Combo', 'Crisp crumbled tandoori butter naan, rich dal makhani, pindi chole, and raita.', 260.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [117, 29, 13, 'Amritsari Soya Chaap Tikka', 'Tandoori-charred soya chunks marinated in spiced yogurt and mustard oil.', 240.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],
      [118, 29, 13, 'Paneer Stuffed Chur Chur Kulcha', 'Flaky tandoori kulcha with grated paneer and herbs, served with imli chutney.', 190.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true],

      // Tokyo Sushi & Dim Sum House (30)
      [119, 30, 3, 'Spicy Salmon Maki Roll (8 pcs)', 'Fresh Atlantic salmon, spicy mayo, cucumber, and toasted sesame wrapped in nori.', 620.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [120, 30, 3, 'Crispy Prawn Tempura Roll (8 pcs)', 'Golden fried tiger prawns, avocado, sweet unagi glaze, and tempura flakes.', 590.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false],
      [121, 30, 3, 'Truffle Mushroom Steamed Bao (3 pcs)', 'Fluffy steamed buns stuffed with glazed shiitake and portobello mushrooms.', 380.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],
      [122, 30, 3, 'Traditional Miso Soup with Tofu', 'Fermented soybean paste broth with silken tofu cubes, wakame, and scallions.', 210.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true],

      // Hyderabad Nawabi Biryani (31)
      [123, 31, 1, 'Kachchi Dum Mutton Biryani', 'Raw marinated spring goat slow-cooked with parboiled saffron basmati rice.', 490.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [124, 31, 1, 'Special Boneless Chicken Biryani', 'Juicy marinated boneless chicken cubes layered over flavorful biryani rice.', 410.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false],
      [125, 31, 1, 'Mirchi Ka Salan (Side Dish)', 'Traditional Hyderabadi peanut, sesame, and green chili gravy companion to biryani.', 90.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true],

      // Sweet Bengal Mithai Mahal (32)
      [126, 32, 4, 'Spongy Kolkata Rasgulla (4 pcs)', 'Piping soft cottage cheese spheres steeped in warm, aromatic sugar syrup.', 120.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [127, 32, 4, 'Nolen Gur Sandesh Box (4 pcs)', 'Delicate date palm jaggery fudge handcrafted with fresh chhena.', 160.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true],
      [128, 32, 4, 'Creamy Cham Cham with Malai (2 pcs)', 'Elongated chhena sweets filled with mawa and topped with clotted cream.', 140.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true]
    ];

    for (const [mid, mrest, mcat, mname, mdesc, mprice, mimg, mveg] of menuItemsData) {
      await client.query(`
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          category_id = EXCLUDED.category_id,
          image_url = EXCLUDED.image_url,
          is_veg = EXCLUDED.is_veg;
      `, [mid, mrest, mcat, mname, mdesc, mprice, mimg, mveg]);
    }
    await client.query("SELECT setval('menu_items_id_seq', (SELECT GREATEST(MAX(id), 128) FROM menu_items));");

    // 5. Connect restaurant_categories
    for (const [rid, , , , , , , , , ] of restaurantsData) {
      // Find all categories used by this restaurant's menu items
      await client.query(`
        INSERT INTO restaurant_categories (restaurant_id, category_id)
        SELECT DISTINCT restaurant_id, category_id FROM menu_items WHERE restaurant_id = $1
        ON CONFLICT (restaurant_id, category_id) DO NOTHING;
      `, [rid]);
    }

    // 6. Ensure Reviews Exist for New Restaurants for Accurate Ratings
    // Add real ratings for newly added restaurants so search/sorting works realistically
    const newReviewsData = [
      [7, 1, 4.7, 'The open butter masala dosa and filter coffee are unmatched in Malleshwaram.'],
      [7, 2, 4.6, 'Super quick delivery and authentic Bengaluru tiffin taste.'],
      [8, 3, 4.5, 'Proper Punjabi butter chicken and tandoori roti. Very flavorful.'],
      [9, 2, 4.4, 'Authentic spicy Andhra chili chicken with great heat levels.'],
      [10, 4, 4.6, 'The flaky Malabar parotta with beef roast felt like home in Calicut.'],
      [11, 1, 4.3, 'Spicy Chettinad pepper chicken roast had great depth of aromatics.'],
      [12, 3, 4.5, 'Kolkata double chicken roll had crunchy onions and proper parotta wrap.'],
      [13, 5, 4.4, 'Clean, sweet Gujarati kadhi and soft dhokla.'],
      [14, 2, 4.7, 'Pure desi ghee dal baati churma, authentic Marwari flavors.'],
      [15, 1, 4.8, 'The Galouti kebabs literally melt like butter. Royal Mughal feast.'],
      [16, 4, 4.5, 'Buttery Mumbai pav bhaji was piping hot and perfectly spiced.'],
      [17, 3, 4.2, 'Crispy Schezwan chicken and burnt garlic noodles hit the spot.'],
      [18, 5, 4.6, 'Fresh hand-rolled pasta with real truffle cream sauce.'],
      [19, 2, 4.5, 'Juicy smashed double burger with great charred crust.'],
      [20, 1, 4.7, 'Best buttery croissants in Bengaluru! Flaky and warm.'],
      [21, 3, 4.8, 'Custard apple scoop tastes like real fresh fruit.'],
      [22, 4, 4.3, 'Clean healthy keto bowl with fresh avocado.'],
      [23, 2, 4.4, 'Fresh cold-pressed mango cooler and juice.'],
      [24, 5, 4.6, 'Kori rotti with chicken curry was incredible.'],
      [25, 1, 4.9, 'The legendary Vidyarthi masala dosa delivered crisp with white butter!'],
      [26, 2, 4.4, 'Hot fluffy bhaturas with tangy spicy chole.'],
      [27, 3, 4.3, 'Fiery Rayalaseema ragi mudde and chicken pulusu.'],
      [28, 4, 4.5, 'Soothing bisibelebath and mangalore buns.'],
      [29, 2, 4.4, 'Crumbled chur chur naan was buttery and crisp.'],
      [30, 3, 4.6, 'Fresh spicy salmon maki roll and warm miso.'],
      [31, 1, 4.7, 'Classic Hyderabadi kachchi dum biryani with rich saffron.'],
      [32, 2, 4.6, 'Spongy soft rasgullas and nolen gur sandesh. Authentic Kolkata sweet touch.']
    ];

    let revId = 50;
    for (const [restId, custId, rating, text] of newReviewsData) {
      await client.query(`
        INSERT INTO reviews (id, customer_id, restaurant_id, order_id, rating, review_text, created_at)
        VALUES ($1, $2, $3, NULL, $4, $5, CURRENT_TIMESTAMP - INTERVAL '3 days')
        ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, review_text = EXCLUDED.review_text;
      `, [revId++, custId, restId, rating, text]);
    }
    await client.query("SELECT setval('reviews_id_seq', (SELECT GREATEST(MAX(id), 100) FROM reviews));");

    await client.query('COMMIT');

    const restCheck = await client.query('SELECT count(*) FROM restaurants');
    const menuCheck = await client.query('SELECT count(*) FROM menu_items');

    return {
      success: true,
      message: 'Expanded database with 32 restaurants and 128+ dishes across 20 cuisines.',
      restaurantsCount: parseInt(restCheck.rows[0].count, 10),
      menuItemsCount: parseInt(menuCheck.rows[0].count, 10),
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Expanded seed error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}
