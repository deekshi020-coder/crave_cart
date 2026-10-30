-- CRAVECART SAMPLE SEED DATA
-- Fully reproducible seed data designed for DBMS Assignment 2 requirements
-- Idempotent insertion using ON CONFLICT DO NOTHING

-- 1. USERS
-- Standard bcrypt hash for password: 'password123'
-- ($2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2)
INSERT INTO users (id, name, email, password_hash, role, phone, is_active) VALUES
(1, 'Aarav Sharma', 'aarav@example.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'customer', '+91 98765 43210', true),
(2, 'Priya Patel', 'priya@example.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'customer', '+91 98765 43211', true),
(3, 'Rohan Gupta', 'rohan@example.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'customer', '+91 98765 43212', true),
(4, 'Ananya Iyer', 'ananya@example.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'customer', '+91 98765 43213', true),
(5, 'Kavya Reddy', 'kavya@example.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'customer', '+91 98765 43214', true),
(6, 'Devendra Rao', 'devendra@example.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'customer', '+91 98765 43215', true),
(100, 'Admin User', 'admin@cravecart.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'admin', '+91 98000 00001', true),
(200, 'Vikram Delivery', 'vikram@cravecart.com', '$2a$10$j84X7Y9uL3hG6fK1t0bQCe4yP3r9wT5mN7xZ2vQ1eL4k8j9h0g1f2', 'delivery_agent', '+91 98000 00002', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. ADDRESSES
INSERT INTO addresses (id, user_id, label, street_address, landmark, city, postal_code, is_default) VALUES
(1, 1, 'Home', 'Flat 402, Prestige Palms, 12th Main Road, Indiranagar', 'Near Metro Station', 'Bengaluru', '560038', true),
(2, 1, 'Work', '4th Floor, Tech Hub Towers, Embassy Golf Links', 'Opposite Dell Campus', 'Bengaluru', '560071', false),
(3, 2, 'Home', 'B-12, Green Glen Layout, Bellandur', 'Behind Central Mall', 'Bengaluru', '560103', true),
(4, 3, 'Home', 'Villa 7, Palm Meadows, Whitefield', 'Near Varthur Lake', 'Bengaluru', '560066', true),
(5, 4, 'Home', '204, Shanti Niketan, 8th Block, Koramangala', 'Near Sony Signal', 'Bengaluru', '560095', true),
(6, 5, 'Home', 'A-301, Brigade Millennium, J.P. Nagar 7th Phase', 'Near Woodrose Club', 'Bengaluru', '560078', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('addresses_id_seq', (SELECT MAX(id) FROM addresses));

-- 3. RESTAURANTS
INSERT INTO restaurants (id, name, description, cuisine_type, image_url, address, city, is_pure_veg, is_active, delivery_time_mins, price_for_two) VALUES
(1, 'Biryani Darbar', 'Authentic slow-cooked royal Hyderabadi Dum Biryanis and rich Mughlai curries in clay pots.', 'Biryani & Mughlai', '/src/assets/images/biryani_specialty_1793294053906.jpg', '100 Feet Road, Indiranagar', 'Bengaluru', false, true, 25, 550.00),
(2, 'Artisan Woodfired Pizzeria', 'Napoli-style handcrafted sourdough pizzas baked to perfection in a 900-degree oven.', 'Italian & Gourmet Pizza', '/src/assets/images/woodfire_pizza_1793294053970.jpg', '12th Main, HAL 2nd Stage, Indiranagar', 'Bengaluru', false, true, 30, 700.00),
(3, 'Wok & Roll Asian Street', 'Sizzling Asian wok-tossed noodles, steaming crystal dim sums, and fiery Thai curries.', 'Pan-Asian & Dimsum', '/src/assets/images/asian_wok_bowls_1793294055268.jpg', '5th Block, Koramangala', 'Bengaluru', false, true, 28, 500.00),
(4, 'Royal Sweets & Chaat', 'Heritage pure vegetarian sweet house featuring warm gulab jamuns, rasmalai, and Delhi street chaat.', 'Pure Veg Mithai & Chaat', '/src/assets/images/dessert_platter_1793294054844.jpg', 'Commercial Street, Tasker Town', 'Bengaluru', true, true, 20, 350.00),
(5, 'Green Earth Organic Kitchen', 'Wholesome farm-to-table salads, ancient grain warm bowls, and cold-pressed botanical tonics.', 'Healthy & Pure Veg', '/src/assets/images/hero_food_delivery_1793294052688.jpg', '14th Cross, HSR Layout Sector 4', 'Bengaluru', true, true, 35, 450.00),
(6, 'The Coastal Spice Catch', 'Coastal seafood curries, Mangalorean ghee roasts, and fresh catch delicacies.', 'Seafood & South Indian', '/src/assets/images/biryani_specialty_1793294053906.jpg', 'Sarjapur Main Road', 'Bengaluru', false, true, 40, 800.00)
ON CONFLICT (id) DO NOTHING;

SELECT setval('restaurants_id_seq', (SELECT MAX(id) FROM restaurants));

-- 4. CATEGORIES
INSERT INTO categories (id, name, description, image_url) VALUES
(1, 'Biryani', 'Aromatic spiced basmati rice delicacies slow-cooked with saffron and fresh herbs', '/src/assets/images/biryani_specialty_1793294053906.jpg'),
(2, 'Pizza & Italian', 'Crisp woodfired pizzas, al dente pastas, and rustic garlic focaccias', '/src/assets/images/woodfire_pizza_1793294053970.jpg'),
(3, 'Pan-Asian', 'Wok-tossed noodles, crystal dim sums, and fiery aromatics', '/src/assets/images/asian_wok_bowls_1793294055268.jpg'),
(4, 'Desserts & Sweets', 'Decadent Indian mithai, warm gulab jamun, and artisanal sweet delights', '/src/assets/images/dessert_platter_1793294054844.jpg'),
(5, 'Pure Veg', '100% vegetarian regional thalis, paneer delicacies, and chaat', '/src/assets/images/dessert_platter_1793294054844.jpg'),
(6, 'Beverages', 'Refreshing chilled lassis, iced teas, and botanical tonics', '/src/assets/images/hero_food_delivery_1793294052688.jpg')
ON CONFLICT (id) DO NOTHING;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 5. RESTAURANT_CATEGORIES
INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES
(1, 1), -- Biryani Darbar -> Biryani
(2, 2), -- Artisan Woodfired Pizzeria -> Pizza
(3, 3), -- Wok & Roll -> Pan-Asian
(4, 4), -- Royal Sweets -> Desserts
(4, 5), -- Royal Sweets -> Pure Veg
(5, 5), -- Green Earth -> Pure Veg
(5, 6), -- Green Earth -> Beverages
(6, 1)  -- Coastal Catch -> Biryani/Meals
ON CONFLICT (restaurant_id, category_id) DO NOTHING;

-- 6. MENU_ITEMS
-- Biryani Darbar (Restaurant 1) - Average price ~ ₹370
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available) VALUES
(1, 1, 1, 'Royal Hyderabadi Mutton Dum Biryani', 'Tender spring lamb marinated in aged yogurt and spices, layered with saffron basmati rice.', 480.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false, true),
(2, 1, 1, 'Classic Chicken Dum Biryani (Handi)', 'Fragrant basmati rice slow-cooked with succulent bone-in chicken pieces and caramelized onions.', 380.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', false, true),
(3, 1, 1, 'Paneer Tikka Dum Biryani', 'Char-grilled cottage cheese cubes simmered in spiced gravy and layered with long-grain rice.', 320.00, '/src/assets/images/biryani_specialty_1793294053906.jpg', true, true),
(4, 1, 6, 'Royal Kesar Badam Lassi', 'Chilled sweet churned yogurt drink scented with Kashmiri saffron and slivered almonds.', 140.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true, true),

-- Artisan Woodfired Pizzeria (Restaurant 2) - Average price ~ ₹465
(5, 2, 2, 'Margherita Burrata Speciale', 'San Marzano DOP tomato sauce, fresh creamy burrata, basil olive oil drizzle on charred crust.', 560.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true, true),
(6, 2, 2, 'Smoked Pepperoni & Hot Honey Pizza', 'Spicy artisan pepperoni, aged fior di latte mozzarella, and fermented chili wildflower honey.', 620.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', false, true),
(7, 2, 2, 'Classic Margherita Pizza', 'Tangy crushed Italian tomatoes, fresh mozzarella, fresh torn basil leaves, extra virgin olive oil.', 420.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true, true),
(8, 2, 2, 'Garlic & Rosemary Sourdough Focaccia', 'Warm wood-baked focaccia bread seasoned with roasted garlic, flaky sea salt, and wild rosemary.', 260.00, '/src/assets/images/woodfire_pizza_1793294053970.jpg', true, true),

-- Wok & Roll Asian Street (Restaurant 3) - Average price ~ ₹335
(9, 3, 3, 'Signature Hakka Chili Garlic Noodles', 'Springy noodles tossed in smoking wok with crispy scallions, garlic chips, and seasonal greens.', 290.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true, true),
(10, 3, 3, 'Crystal Prawn Har Gow (4 pcs)', 'Translucent pleated dumplings stuffed with juicy tiger prawns and water chestnuts.', 420.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', false, true),
(11, 3, 3, 'Truffle Edamame Dumplings (4 pcs)', 'Velvety edamame paste infused with black truffle oil in delicate spinach pastry wraps.', 360.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true, true),
(12, 3, 3, 'Crispy Schezwan Spring Rolls', 'Golden crisp rolls filled with shredded vegetables and served with sweet plum dipping sauce.', 270.00, '/src/assets/images/asian_wok_bowls_1793294055268.jpg', true, true),

-- Royal Sweets & Chaat (Restaurant 4) - Average price ~ ₹210
(13, 4, 4, 'Warm Angoori Gulab Jamun (2 pcs)', 'Soft melt-in-the-mouth fried milk dough dumplings soaked in fragrant cardamom rose syrup.', 130.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true, true),
(14, 4, 4, 'Royal Kesar Rasmalai (2 pcs)', 'Delicate cottage cheese discs steeped in saffron cardamom thickened milk, pistachio flakes.', 170.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true, true),
(15, 4, 5, 'Dahi Puri Chat Platter (6 pcs)', 'Crisp hollow puris loaded with spiced potatoes, sweet yogurt, tangy tamarind and mint chutney.', 180.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true, true),
(16, 4, 4, 'Kaju Katli Gift Box (250g)', 'Diamond-shaped cashew fudge finished with pure edible silver leaf.', 360.00, '/src/assets/images/dessert_platter_1793294054844.jpg', true, true),

-- Green Earth Organic Kitchen (Restaurant 5) - Average price ~ ₹310
(17, 5, 5, 'Mediterranean Quinoa Falafel Bowl', 'Herb-baked falafel, organic tri-color quinoa, pickled beetroot, hummus, and tahini drizzle.', 380.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true, true),
(18, 5, 5, 'Avocado & Baby Spinach Caesar', 'Hass avocado chunks, crisp baby greens, toasted pumpkin seeds, and vegan parmesan dressing.', 340.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true, true),
(19, 5, 6, 'Cold Pressed Valencia Orange Juice', '100% pure raw cold-pressed citrus juice with no added sugar or water.', 210.00, '/src/assets/images/hero_food_delivery_1793294052688.jpg', true, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

-- 7. COUPONS
INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, max_discount, is_active) VALUES
(1, 'CRAVE50', 'percentage', 50.00, 299.00, 150.00, true),
(2, 'WELCOME100', 'fixed', 100.00, 399.00, 100.00, true),
(3, 'FEAST20', 'percentage', 20.00, 499.00, 200.00, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('coupons_id_seq', (SELECT MAX(id) FROM coupons));

-- 8. ORDERS
-- Customer 1 (Aarav Sharma) places 6 orders in September 2026 (DA2 Query 1 requirement: > 5 orders in September 2026)
-- Plus total orders > 5, giving 20% loyalty discount!
-- Customer 2 (Priya Patel): 4 orders (10% loyalty)
-- Customer 3 (Rohan Gupta): 3 very high value orders (Top Spender for Query 3!)
-- Customer 4 (Ananya Iyer): 2 orders (0% loyalty)
-- Customer 5 (Kavya Reddy): 1 order (0% loyalty)

INSERT INTO orders (id, customer_id, restaurant_id, delivery_address_id, delivery_address_snapshot, status, item_subtotal, coupon_discount, loyalty_discount, delivery_fee, tax_amount, final_total, applied_coupon_code, loyalty_percentage, created_at) VALUES
-- Aarav Sharma orders (September 2026)
(1, 1, 1, 1, 'Flat 402, Prestige Palms, Indiranagar, Bengaluru', 'Delivered', 860.00, 0.00, 0.00, 40.00, 0.00, 900.00, NULL, 0, '2026-09-02 12:30:00+05:30'),
(2, 1, 1, 1, 'Flat 402, Prestige Palms, Indiranagar, Bengaluru', 'Delivered', 380.00, 0.00, 0.00, 40.00, 0.00, 420.00, NULL, 0, '2026-09-06 20:15:00+05:30'),
(3, 1, 2, 1, 'Flat 402, Prestige Palms, Indiranagar, Bengaluru', 'Delivered', 560.00, 100.00, 0.00, 40.00, 0.00, 500.00, 'WELCOME100', 0, '2026-09-12 19:45:00+05:30'),
(4, 1, 3, 2, '4th Floor, Tech Hub Towers, Embassy Golf Links, Bengaluru', 'Delivered', 710.00, 142.00, 0.00, 40.00, 0.00, 608.00, 'FEAST20', 0, '2026-09-18 13:10:00+05:30'),
(5, 1, 4, 1, 'Flat 402, Prestige Palms, Indiranagar, Bengaluru', 'Delivered', 480.00, 0.00, 0.00, 40.00, 0.00, 520.00, NULL, 0, '2026-09-24 18:20:00+05:30'),
(6, 1, 1, 1, 'Flat 402, Prestige Palms, Indiranagar, Bengaluru', 'Delivered', 480.00, 0.00, 0.00, 40.00, 0.00, 520.00, NULL, 0, '2026-09-29 21:00:00+05:30'),

-- Priya Patel orders (3 in Sept, 1 in Oct - total 4 orders -> 10% loyalty)
(7, 2, 2, 3, 'B-12, Green Glen Layout, Bellandur, Bengaluru', 'Delivered', 980.00, 150.00, 0.00, 40.00, 0.00, 870.00, 'CRAVE50', 0, '2026-09-10 14:00:00+05:30'),
(8, 2, 3, 3, 'B-12, Green Glen Layout, Bellandur, Bengaluru', 'Delivered', 650.00, 0.00, 0.00, 40.00, 0.00, 690.00, NULL, 0, '2026-09-16 20:30:00+05:30'),
(9, 2, 1, 3, 'B-12, Green Glen Layout, Bellandur, Bengaluru', 'Delivered', 480.00, 0.00, 0.00, 40.00, 0.00, 520.00, NULL, 0, '2026-09-27 19:15:00+05:30'),
(10, 2, 4, 3, 'B-12, Green Glen Layout, Bellandur, Bengaluru', 'Delivered', 530.00, 0.00, 53.00, 40.00, 0.00, 517.00, NULL, 10, '2026-10-05 17:00:00+05:30'),

-- Rohan Gupta orders (Top spender! Total spent > ₹5,000)
(11, 3, 2, 4, 'Villa 7, Palm Meadows, Whitefield, Bengaluru', 'Delivered', 1840.00, 0.00, 0.00, 40.00, 0.00, 1880.00, NULL, 0, '2026-09-08 20:00:00+05:30'),
(12, 3, 1, 4, 'Villa 7, Palm Meadows, Whitefield, Bengaluru', 'Delivered', 1920.00, 200.00, 0.00, 40.00, 0.00, 1760.00, 'FEAST20', 0, '2026-09-20 20:45:00+05:30'),
(13, 3, 3, 4, 'Villa 7, Palm Meadows, Whitefield, Bengaluru', 'Delivered', 1470.00, 0.00, 147.00, 40.00, 0.00, 1363.00, NULL, 10, '2026-10-15 13:30:00+05:30'),

-- Ananya Iyer orders (2 qualifying orders -> 0% loyalty)
(14, 4, 1, 5, '204, Shanti Niketan, Koramangala, Bengaluru', 'Delivered', 380.00, 0.00, 0.00, 40.00, 0.00, 420.00, NULL, 0, '2026-09-14 12:45:00+05:30'),
(15, 4, 4, 5, '204, Shanti Niketan, Koramangala, Bengaluru', 'Delivered', 310.00, 0.00, 0.00, 40.00, 0.00, 350.00, NULL, 0, '2026-10-02 16:30:00+05:30'),

-- Kavya Reddy order (1 order -> 0% loyalty)
(16, 5, 5, 6, 'A-301, Brigade Millennium, J.P. Nagar, Bengaluru', 'Delivered', 590.00, 100.00, 0.00, 40.00, 0.00, 530.00, 'WELCOME100', 0, '2026-10-10 19:20:00+05:30'),

-- One Live active order currently Out for Delivery (to demonstrate live status workflow!)
(17, 1, 2, 1, 'Flat 402, Prestige Palms, Indiranagar, Bengaluru', 'Out for Delivery', 980.00, 0.00, 196.00, 40.00, 0.00, 824.00, NULL, 20, CURRENT_TIMESTAMP - INTERVAL '20 minutes')
ON CONFLICT (id) DO NOTHING;

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- 9. ORDER_ITEMS (Snapshots of Historical Unit Prices and Quantities)
-- Note: Check Category sold quantities:
-- Biryani (Category 1): Items 1, 2, 3 sold multiple times (> 2 units sold)
-- Pizza (Category 2): Items 5, 6, 7 sold multiple times (> 2 units sold)
-- Pan-Asian (Category 3): Items 9, 10 sold multiple times (> 2 units sold)
-- Desserts & Sweets (Category 4): Items 13, 14 sold multiple times (> 2 units sold)
INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total) VALUES
-- Order 1 (Biryani Darbar)
(1, 1, 1, 'Royal Hyderabadi Mutton Dum Biryani', 1, 480.00, 480.00),
(2, 1, 2, 'Classic Chicken Dum Biryani (Handi)', 1, 380.00, 380.00),

-- Order 2
(3, 2, 2, 'Classic Chicken Dum Biryani (Handi)', 1, 380.00, 380.00),

-- Order 3 (Pizzeria)
(4, 3, 5, 'Margherita Burrata Speciale', 1, 560.00, 560.00),

-- Order 4 (Wok & Roll)
(5, 4, 9, 'Signature Hakka Chili Garlic Noodles', 1, 290.00, 290.00),
(6, 4, 10, 'Crystal Prawn Har Gow (4 pcs)', 1, 420.00, 420.00),

-- Order 5 (Royal Sweets)
(7, 5, 15, 'Dahi Puri Chat Platter (6 pcs)', 2, 180.00, 360.00),
(8, 5, 13, 'Warm Angoori Gulab Jamun (2 pcs)', 1, 120.00, 120.00),

-- Order 6 (Biryani)
(9, 6, 1, 'Royal Hyderabadi Mutton Dum Biryani', 1, 480.00, 480.00),

-- Order 7 (Priya - Pizzeria)
(10, 7, 6, 'Smoked Pepperoni & Hot Honey Pizza', 1, 620.00, 620.00),
(11, 7, 8, 'Garlic & Rosemary Sourdough Focaccia', 1, 260.00, 260.00),

-- Order 8 (Priya - Wok)
(12, 8, 9, 'Signature Hakka Chili Garlic Noodles', 1, 290.00, 290.00),
(13, 8, 11, 'Truffle Edamame Dumplings (4 pcs)', 1, 360.00, 360.00),

-- Order 9 (Priya - Biryani)
(14, 9, 1, 'Royal Hyderabadi Mutton Dum Biryani', 1, 480.00, 480.00),

-- Order 10 (Priya - Sweets)
(15, 10, 14, 'Royal Kesar Rasmalai (2 pcs)', 2, 170.00, 340.00),
(16, 10, 15, 'Dahi Puri Chat Platter (6 pcs)', 1, 180.00, 180.00),

-- Order 11 (Rohan - Big Pizzeria feast)
(17, 11, 5, 'Margherita Burrata Speciale', 2, 560.00, 1120.00),
(18, 11, 6, 'Smoked Pepperoni & Hot Honey Pizza', 1, 620.00, 620.00),

-- Order 12 (Rohan - Big Biryani banquet)
(19, 12, 1, 'Royal Hyderabadi Mutton Dum Biryani', 4, 480.00, 1920.00),

-- Order 13 (Rohan - Wok Feast)
(20, 13, 10, 'Crystal Prawn Har Gow (4 pcs)', 2, 420.00, 840.00),
(21, 13, 11, 'Truffle Edamame Dumplings (4 pcs)', 1, 360.00, 360.00),
(22, 13, 12, 'Crispy Schezwan Spring Rolls', 1, 270.00, 270.00),

-- Order 14 (Ananya)
(23, 14, 2, 'Classic Chicken Dum Biryani (Handi)', 1, 380.00, 380.00),

-- Order 15 (Ananya)
(24, 15, 13, 'Warm Angoori Gulab Jamun (2 pcs)', 1, 130.00, 130.00),
(25, 15, 15, 'Dahi Puri Chat Platter (6 pcs)', 1, 180.00, 180.00),

-- Order 16 (Kavya - Green Earth)
(26, 16, 17, 'Mediterranean Quinoa Falafel Bowl', 1, 380.00, 380.00),
(27, 16, 19, 'Cold Pressed Valencia Orange Juice', 1, 210.00, 210.00),

-- Order 17 (Aarav - Live Out for Delivery)
(28, 17, 6, 'Smoked Pepperoni & Hot Honey Pizza', 1, 620.00, 620.00),
(29, 17, 11, 'Truffle Edamame Dumplings (4 pcs)', 1, 360.00, 360.00)
ON CONFLICT (id) DO NOTHING;

SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items));

-- 10. PAYMENTS
INSERT INTO payments (id, order_id, payment_method, amount, status, transaction_ref, paid_at) VALUES
(1, 1, 'UPI', 900.00, 'Completed', 'TXN_UPI_20260902_001', '2026-09-02 12:31:00+05:30'),
(2, 2, 'Credit Card', 420.00, 'Completed', 'TXN_CC_20260906_002', '2026-09-06 20:16:00+05:30'),
(3, 3, 'UPI', 500.00, 'Completed', 'TXN_UPI_20260912_003', '2026-09-12 19:46:00+05:30'),
(4, 4, 'Net Banking', 608.00, 'Completed', 'TXN_NB_20260918_004', '2026-09-18 13:11:00+05:30'),
(5, 5, 'UPI', 520.00, 'Completed', 'TXN_UPI_20260924_005', '2026-09-24 18:21:00+05:30'),
(6, 6, 'Credit Card', 520.00, 'Completed', 'TXN_CC_20260929_006', '2026-09-29 21:01:00+05:30'),
(7, 7, 'UPI', 870.00, 'Completed', 'TXN_UPI_20260910_007', '2026-09-10 14:01:00+05:30'),
(8, 8, 'UPI', 690.00, 'Completed', 'TXN_UPI_20260916_008', '2026-09-16 20:31:00+05:30'),
(9, 9, 'Credit Card', 520.00, 'Completed', 'TXN_CC_20260927_009', '2026-09-27 19:16:00+05:30'),
(10, 10, 'UPI', 517.00, 'Completed', 'TXN_UPI_20261005_010', '2026-10-05 17:01:00+05:30'),
(11, 11, 'Credit Card', 1880.00, 'Completed', 'TXN_CC_20260908_011', '2026-09-08 20:01:00+05:30'),
(12, 12, 'Net Banking', 1760.00, 'Completed', 'TXN_NB_20260920_012', '2026-09-20 20:46:00+05:30'),
(13, 13, 'UPI', 1363.00, 'Completed', 'TXN_UPI_20261015_013', '2026-10-15 13:31:00+05:30'),
(14, 14, 'UPI', 420.00, 'Completed', 'TXN_UPI_20260914_014', '2026-09-14 12:46:00+05:30'),
(15, 15, 'UPI', 350.00, 'Completed', 'TXN_UPI_20261002_015', '2026-10-02 16:31:00+05:30'),
(16, 16, 'Debit Card', 530.00, 'Completed', 'TXN_DC_20261010_016', '2026-10-10 19:21:00+05:30'),
(17, 17, 'UPI', 824.00, 'Completed', 'TXN_UPI_20261029_017', CURRENT_TIMESTAMP - INTERVAL '19 minutes')
ON CONFLICT (id) DO NOTHING;

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- 11. REVIEWS
-- Note: Biryani Darbar has 4 ratings: 5.0, 5.0, 4.5, 4.7 -> avg 4.80
-- Artisan Woodfired Pizzeria has 4 ratings: 5.0, 5.0, 4.5, 4.7 -> avg 4.80 (Tied with Biryani Darbar for Query 6!)
-- Wok & Roll has avg 4.33 (> 4.0 for Query 2)
-- Royal Sweets has avg 4.60 (> 4.0 for Query 2)
-- Green Earth has avg 3.80 (< 4.0, correctly excluded from Query 2!)
-- Coastal Spice Catch has 0 reviews (correctly handled with 0.0 avg and 0 reviews)
INSERT INTO reviews (id, customer_id, restaurant_id, order_id, rating, review_text, created_at) VALUES
(1, 1, 1, 1, 5.0, 'Incredible clay pot mutton biryani! The meat was fork-tender and fragrant with saffron.', '2026-09-02 14:00:00+05:30'),
(2, 2, 1, 9, 5.0, 'Best Hyderabadi biryani in Indiranagar. The salan and raita paired brilliantly.', '2026-09-27 20:30:00+05:30'),
(3, 3, 1, 12, 4.5, 'Huge portions and generous saffron rice. Everyone at the party loved it.', '2026-09-20 22:00:00+05:30'),
(4, 4, 1, 14, 4.7, 'Consistently great quality chicken dum biryani, piping hot delivery.', '2026-09-14 14:00:00+05:30'),

(5, 1, 2, 3, 5.0, 'The sourdough crust is perfection with authentic leopard-spotting.', '2026-09-12 21:00:00+05:30'),
(6, 2, 2, 7, 5.0, 'Smoked pepperoni with hot honey is an absolute masterclass in flavor balance!', '2026-09-10 15:30:00+05:30'),
(7, 3, 2, 11, 4.5, 'Creamy burrata margherita delivered fresh and warm.', '2026-09-08 21:30:00+05:30'),
(8, 5, 2, NULL, 4.7, 'The garlic focaccia and margherita are staples for our weekend dinners.', '2026-09-25 19:00:00+05:30'),

(9, 1, 3, 4, 4.5, 'Crisp spring rolls and springy wok chili garlic noodles with great smoke flavor.', '2026-09-18 14:30:00+05:30'),
(10, 2, 3, 8, 4.0, 'Truffle edamame dim sum was fragrant and delicate.', '2026-09-16 21:45:00+05:30'),
(11, 3, 3, 13, 4.5, 'Crystal prawn har gow was fresh and plump. Excellent Asian street food.', '2026-10-15 15:00:00+05:30'),

(12, 1, 4, 5, 5.0, 'The gulab jamuns melt like butter and the rasmalai is soaked in rich saffron milk.', '2026-09-24 19:30:00+05:30'),
(13, 2, 4, 10, 4.5, 'Crispy dahi puri chaat was packaged separately so it remained crunchy!', '2026-10-05 18:30:00+05:30'),
(14, 4, 4, 15, 4.3, 'Authentic Delhi-style chaat, hygienic packaging and fast delivery.', '2026-10-02 17:45:00+05:30'),

(15, 5, 5, 16, 3.8, 'Healthy quinoa bowl was fresh, though falafel could be slightly more crisp.', '2026-10-10 20:30:00+05:30')
ON CONFLICT (id) DO NOTHING;

SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- 12. DELIVERY_AGENTS & VEHICLES
INSERT INTO delivery_agents (id, user_id, phone, is_available, current_area) VALUES
(1, 200, '+91 98000 00002', true, 'Indiranagar & Koramangala')
ON CONFLICT (id) DO NOTHING;

SELECT setval('delivery_agents_id_seq', (SELECT MAX(id) FROM delivery_agents));

INSERT INTO vehicles (id, delivery_agent_id, vehicle_type, registration_number, is_active) VALUES
(1, 1, 'Electric Scooter', 'KA-01-EQ-4491', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));

-- 13. ORDER_STATUS_HISTORY (Realistic status trail for Order 17)
INSERT INTO order_status_history (id, order_id, previous_status, new_status, actor, notes, created_at) VALUES
(1, 17, NULL, 'Placed', 'Customer', 'Order successfully initiated and paid via UPI', CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
(2, 17, 'Placed', 'Confirmed', 'Restaurant', 'Kitchen accepted order #17', CURRENT_TIMESTAMP - INTERVAL '18 minutes'),
(3, 17, 'Confirmed', 'Preparing', 'Kitchen Chef', 'Woodfire oven pizza dough stretching and baking', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
(4, 17, 'Preparing', 'Ready for Pickup', 'Kitchen Chef', 'Packed in insulated thermal carrier', CURRENT_TIMESTAMP - INTERVAL '8 minutes'),
(5, 17, 'Ready for Pickup', 'Out for Delivery', 'Vikram Delivery', 'Agent Vikram picked up order and heading to Indiranagar', CURRENT_TIMESTAMP - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

SELECT setval('order_status_history_id_seq', (SELECT MAX(id) FROM order_status_history));
