import bcrypt from 'bcryptjs';
import { getPool } from './pool.js';

export async function runChennaiAndFeaturesMigration(): Promise<{ success: boolean; message: string }> {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool unavailable');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add coordinates columns if not present
    await client.query(`
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
      ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
      ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
      ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
      ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
    `);

    // 2. Chennai Restaurants Locations & Coordinates
    const chennaiRestaurants = [
      { id: 1, name: 'Biryani Darbar', address: '12, 2nd Avenue, Anna Nagar East', city: 'Chennai', lat: 13.0850, lng: 80.2101 },
      { id: 2, name: 'Artisan Woodfired Pizzeria', address: '45, Khader Nawaz Khan Road, Nungambakkam', city: 'Chennai', lat: 13.0600, lng: 80.2400 },
      { id: 3, name: 'Wok & Roll Asian Street', address: '18, TTK Road, Alwarpet', city: 'Chennai', lat: 13.0330, lng: 80.2510 },
      { id: 4, name: 'Royal Sweets & Chaat', address: '94, Mint Street, Sowcarpet', city: 'Chennai', lat: 13.0950, lng: 80.2790 },
      { id: 5, name: 'Green Earth Organic Kitchen', address: '28, 4th Main Road, Besant Nagar', city: 'Chennai', lat: 12.9980, lng: 80.2680 },
      { id: 6, name: 'The Coastal Spice Catch', address: '14, Beach Road, Thiruvanmiyur', city: 'Chennai', lat: 12.9830, lng: 80.2610 },
      { id: 7, name: 'Dakshin Tiffin Room', address: '68, North Mada Street, Mylapore', city: 'Chennai', lat: 13.0368, lng: 80.2676 },
      { id: 8, name: 'Pind Punjab Dhaba', address: '33, Usman Road, T. Nagar', city: 'Chennai', lat: 13.0418, lng: 80.2341 },
      { id: 9, name: 'Nagarjuna Andhra Spice', address: '77, G.N. Chetty Road, T. Nagar', city: 'Chennai', lat: 13.0425, lng: 80.2410 },
      { id: 10, name: 'Malabar Coast Kitchen', address: '15, 1st Cross Street, Gandhi Nagar, Adyar', city: 'Chennai', lat: 13.0070, lng: 80.2540 },
      { id: 11, name: 'Chettinad Spice Villa', address: '52, Luz Church Road, Mylapore', city: 'Chennai', lat: 13.0380, lng: 80.2620 },
      { id: 12, name: 'Calcutta Kitchen & Roll House', address: '22, Sterling Road, Nungambakkam', city: 'Chennai', lat: 13.0640, lng: 80.2380 },
      { id: 13, name: 'Padmavati Gujarati Rasoi', address: '8, Narayana Mudali Street, Sowcarpet', city: 'Chennai', lat: 13.0940, lng: 80.2780 },
      { id: 14, name: 'Marwar Royal Thali', address: '102, Govindappa Naicken St, Sowcarpet', city: 'Chennai', lat: 13.0960, lng: 80.2800 },
      { id: 15, name: 'Mughal Mahal Kebabs', address: '41, Triplicane High Road, Triplicane', city: 'Chennai', lat: 13.0560, lng: 80.2720 },
      { id: 16, name: 'Mumbai Chowpatty Chaat', address: '19, Pondy Bazaar, T. Nagar', city: 'Chennai', lat: 13.0405, lng: 80.2335 },
      { id: 17, name: 'The Dragon Bowl', address: '63, Harrington Road, Chetpet', city: 'Chennai', lat: 13.0720, lng: 80.2370 },
      { id: 18, name: 'Trattoria Bella Napoli', address: '5, Chamiers Road, R.A. Puram', city: 'Chennai', lat: 13.0280, lng: 80.2500 },
      { id: 19, name: 'Buns & Patties Smash Burgers', address: '88, 100 Feet Bypass Road, Velachery', city: 'Chennai', lat: 12.9750, lng: 80.2207 },
      { id: 20, name: 'The Parisian Boulangerie', address: '31, Wallace Garden 3rd St, Nungambakkam', city: 'Chennai', lat: 13.0610, lng: 80.2450 },
      { id: 21, name: 'Naturals Gelato & Kulfi Bar', address: '12, 1st Avenue, Shastri Nagar, Adyar', city: 'Chennai', lat: 13.0012, lng: 80.2565 },
      { id: 22, name: 'Avocado & Greens Clean Kitchen', address: '27, Rajiv Gandhi Salai, OMR, Perungudi', city: 'Chennai', lat: 12.9620, lng: 80.2440 },
      { id: 23, name: 'Squeeze & Sip Botanical Juicery', address: '16, 3rd Avenue, Anna Nagar', city: 'Chennai', lat: 13.0870, lng: 80.2130 },
      { id: 24, name: 'Kudla Coastal Kitchen', address: '49, Lattice Bridge Road, Adyar', city: 'Chennai', lat: 12.9990, lng: 80.2550 },
      { id: 25, name: 'Vidyarthi Heritage Tiffin', address: '82, Eldams Road, Alwarpet', city: 'Chennai', lat: 13.0350, lng: 80.2470 },
      { id: 26, name: 'Dilli 6 Paranthe & Chole', address: '11, Taylors Road, Kilpauk', city: 'Chennai', lat: 13.0780, lng: 80.2420 },
      { id: 27, name: 'Rayalaseema Ruchulu', address: '73, Mount Road, Guindy', city: 'Chennai', lat: 13.0067, lng: 80.2025 },
      { id: 28, name: 'Udupi Shri Krishna Grand', address: '36, Venkatanarayana Road, T. Nagar', city: 'Chennai', lat: 13.0390, lng: 80.2310 },
      { id: 29, name: 'Amritsar Kulcha Junction', address: '90, Arcot Road, Vadapalani', city: 'Chennai', lat: 13.0500, lng: 80.2120 },
      { id: 30, name: 'Tokyo Sushi & Dim Sum House', address: '120, Radhakrishnan Salai, Mylapore', city: 'Chennai', lat: 13.0440, lng: 80.2600 },
      { id: 31, name: 'Hyderabad Nawabi Biryani', address: '142, Rajiv Gandhi Salai, OMR, Thoraipakkam', city: 'Chennai', lat: 12.9350, lng: 80.2312 },
      { id: 32, name: 'Sweet Bengal Mithai Mahal', address: '55, Ormes Road, Kilpauk', city: 'Chennai', lat: 13.0810, lng: 80.2450 }
    ];

    for (const r of chennaiRestaurants) {
      await client.query(`
        UPDATE restaurants 
        SET address = $1, city = $2, latitude = $3, longitude = $4
        WHERE id = $5;
      `, [r.address, r.city, r.lat, r.lng, r.id]);
    }

    // 3. Demo Accounts: Aarav, Divya, Admin, Vikram
    const customerHash = bcrypt.hashSync('Customer@123', 10);
    const divyaHash = bcrypt.hashSync('Divya@123', 10);
    const adminHash = bcrypt.hashSync('Admin@123', 10);
    const agentHash = bcrypt.hashSync('Agent@123', 10);

    // Seed/Update Divya: email = 'divya@cravecart.com'
    const divyaUserRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, phone, is_active)
      VALUES ('Divya Sundaram', 'divya@cravecart.com', $1, 'customer', '+91 98400 12345', true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = 'customer',
        is_active = true
      RETURNING id;
    `, [divyaHash]);
    const divyaId = divyaUserRes.rows[0].id;

    // Ensure Aarav has Chennai addresses
    await client.query(`
      UPDATE addresses 
      SET street_address = 'Flat 402, Ceebros Palms, 2nd Avenue, Anna Nagar',
          landmark = 'Near Roundtana',
          city = 'Chennai',
          state = 'Tamil Nadu',
          postal_code = '600040',
          latitude = 13.0850,
          longitude = 80.2101
      WHERE id = 1 AND user_id = 1;
    `);
    await client.query(`
      UPDATE addresses 
      SET street_address = '4th Floor, Tidel Park, Rajiv Gandhi Salai, Taramani',
          landmark = 'Opposite CSIR',
          city = 'Chennai',
          state = 'Tamil Nadu',
          postal_code = '600113',
          latitude = 12.9890,
          longitude = 80.2480
      WHERE id = 2 AND user_id = 1;
    `);

    // Add Chennai saved addresses for Divya
    await client.query('DELETE FROM addresses WHERE user_id = $1', [divyaId]);
    await client.query(`
      INSERT INTO addresses (user_id, label, street_address, landmark, city, state, postal_code, is_default, latitude, longitude)
      VALUES 
      ($1, 'Home', 'Door 24, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur', 'Near Beach Walk', 'Chennai', 'Tamil Nadu', '600041', true, 12.9810, 80.2640),
      ($1, 'Work', 'Level 6, Ramanujan IT City, Rajiv Gandhi Salai, Taramani', 'Block TRIL', 'Chennai', 'Tamil Nadu', '600113', false, 12.9880, 80.2460)
    `, [divyaId]);

    // Ensure Divya has EXACTLY 2 completed historical orders (so next order unlocks 10% Gold tier!)
    // First remove any existing test orders for Divya
    await client.query('DELETE FROM orders WHERE customer_id = $1', [divyaId]);

    // Order 1 for Divya
    const dOrder1 = await client.query(`
      INSERT INTO orders (customer_id, restaurant_id, delivery_address_snapshot, status, item_subtotal, coupon_discount, loyalty_discount, delivery_fee, tax_amount, final_total, loyalty_percentage, created_at)
      VALUES ($1, 1, 'Door 24, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai - 600041', 'Delivered', 480.00, 0.00, 0.00, 40.00, 0.00, 520.00, 0, '2026-09-15 13:00:00+05:30')
      RETURNING id
    `, [divyaId]);
    const dO1Id = dOrder1.rows[0].id;
    await client.query(`
      INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, line_total)
      VALUES ($1, 1, 'Royal Hyderabadi Mutton Dum Biryani', 1, 480.00, 480.00)
    `, [dO1Id]);
    await client.query(`
      INSERT INTO payments (order_id, payment_method, amount, status, transaction_ref, paid_at)
      VALUES ($1, 'UPI', 520.00, 'Completed', 'TXN_DIVYA_001', '2026-09-15 13:01:00+05:30')
    `, [dO1Id]);
    await client.query(`
      INSERT INTO order_status_history (order_id, previous_status, new_status, actor, notes, created_at)
      VALUES ($1, NULL, 'Placed', 'Customer', 'Order placed', '2026-09-15 13:00:00+05:30')
    `, [dO1Id]);
    await client.query(`
      INSERT INTO order_status_history (order_id, previous_status, new_status, actor, notes, created_at)
      VALUES ($1, 'Placed', 'Delivered', 'Vikram Delivery', 'Delivered at Thiruvanmiyur', '2026-09-15 13:35:00+05:30')
    `, [dO1Id]);

    // Order 2 for Divya
    const dOrder2 = await client.query(`
      INSERT INTO orders (customer_id, restaurant_id, delivery_address_snapshot, status, item_subtotal, coupon_discount, loyalty_discount, delivery_fee, tax_amount, final_total, loyalty_percentage, created_at)
      VALUES ($1, 7, 'Door 24, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai - 600041', 'Delivered', 260.00, 0.00, 0.00, 40.00, 0.00, 300.00, 0, '2026-10-10 09:00:00+05:30')
      RETURNING id
    `, [divyaId]);
    const dO2Id = dOrder2.rows[0].id;
    await client.query(`
      INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, line_total)
      VALUES ($1, 36, 'Ghee Open Masala Dosa', 1, 140.00, 140.00),
             ($1, 37, 'Button Ghee Idli Sambar (14 pcs)', 1, 120.00, 120.00)
    `, [dO2Id]);
    await client.query(`
      INSERT INTO payments (order_id, payment_method, amount, status, transaction_ref, paid_at)
      VALUES ($1, 'Credit Card', 300.00, 'Completed', 'TXN_DIVYA_002', '2026-10-10 09:02:00+05:30')
    `, [dO2Id]);
    await client.query(`
      INSERT INTO order_status_history (order_id, previous_status, new_status, actor, notes, created_at)
      VALUES ($1, NULL, 'Placed', 'Customer', 'Order placed', '2026-10-10 09:00:00+05:30')
    `, [dO2Id]);
    await client.query(`
      INSERT INTO order_status_history (order_id, previous_status, new_status, actor, notes, created_at)
      VALUES ($1, 'Placed', 'Delivered', 'Vikram Delivery', 'Delivered safely', '2026-10-10 09:30:00+05:30')
    `, [dO2Id]);

    // 4. Update Delivery Agent Vikram to Chennai
    await client.query(`
      UPDATE delivery_agents
      SET current_area = 'T. Nagar & Mylapore, Chennai',
          latitude = 13.0450,
          longitude = 80.2380
      WHERE id = 1;
      UPDATE vehicles
      SET registration_number = 'TN-01-EQ-4491'
      WHERE id = 1;
    `);

    // 5. Ensure Coupons exist: WELCOME100, BIRYANI100, SWEETTOOTH, CRAVE50, FEAST20
    const couponsList = [
      { code: 'WELCOME100', type: 'fixed', val: 100.00, min: 399.00, max: 100.00 },
      { code: 'BIRYANI100', type: 'fixed', val: 100.00, min: 350.00, max: 100.00 },
      { code: 'SWEETTOOTH', type: 'percentage', val: 25.00, min: 200.00, max: 150.00 },
      { code: 'CRAVE50', type: 'percentage', val: 50.00, min: 299.00, max: 150.00 },
      { code: 'FEAST20', type: 'percentage', val: 20.00, min: 499.00, max: 200.00 }
    ];

    for (const c of couponsList) {
      await client.query(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (code) DO UPDATE SET
          discount_type = EXCLUDED.discount_type,
          discount_value = EXCLUDED.discount_value,
          min_order_value = EXCLUDED.min_order_value,
          max_discount = EXCLUDED.max_discount,
          is_active = true;
      `, [c.code, c.type, c.val, c.min, c.max]);
    }

    // 6. Update Order 17 snapshot to Chennai
    await client.query(`
      UPDATE orders
      SET delivery_address_snapshot = 'Flat 402, Ceebros Palms, 2nd Avenue, Anna Nagar, Chennai - 600040'
      WHERE id = 17;
    `);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Chennai migration, Divya demo account, coupons, and coordinates seeded successfully.'
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Migration error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}
