-- CRAVECART POSTGRESQL SCHEMA DEFINITION
-- Normalized DBMS Assignment 2 Compliant Schema with Tables, Views, Functions, Procedures, Triggers

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'delivery_agent')),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    street_address TEXT NOT NULL,
    landmark VARCHAR(150),
    city VARCHAR(80) NOT NULL DEFAULT 'Bengaluru',
    state VARCHAR(80) NOT NULL DEFAULT 'Karnataka',
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100) NOT NULL,
    image_url TEXT,
    address TEXT NOT NULL,
    city VARCHAR(80) NOT NULL DEFAULT 'Bengaluru',
    is_pure_veg BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    delivery_time_mins INT NOT NULL DEFAULT 30,
    price_for_two NUMERIC(10, 2) NOT NULL DEFAULT 400.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. RESTAURANT_CATEGORIES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS restaurant_categories (
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (restaurant_id, category_id)
);

-- 6. MENU_ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_veg BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CARTS TABLE
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CART_ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    UNIQUE (cart_id, menu_item_id)
);

-- 9. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_discount NUMERIC(10, 2),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_limit INT DEFAULT 1000,
    times_used INT NOT NULL DEFAULT 0
);

-- 10. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
    delivery_address_id INT REFERENCES addresses(id) ON DELETE SET NULL,
    delivery_address_snapshot TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Placed' CHECK (status IN ('Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled')),
    item_subtotal NUMERIC(10, 2) NOT NULL CHECK (item_subtotal >= 0),
    coupon_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (coupon_discount >= 0),
    loyalty_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (loyalty_discount >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 40.00 CHECK (delivery_fee >= 0),
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    final_total NUMERIC(10, 2) NOT NULL CHECK (final_total >= 0),
    applied_coupon_code VARCHAR(50),
    loyalty_percentage INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ORDER_ITEMS TABLE (Historical Price Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

-- 12. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash on Delivery')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (customer_id, order_id)
);

-- 14. DELIVERY_AGENTS TABLE
CREATE TABLE IF NOT EXISTS delivery_agents (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    current_area VARCHAR(100) DEFAULT 'Indiranagar, Bengaluru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    delivery_agent_id INT UNIQUE NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('Electric Scooter', 'Motorcycle', 'Bicycle')),
    registration_number VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 16. ORDER_STATUS_HISTORY TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'System',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INT REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR FREQUENT JOINS & QUERIES
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ==========================================
-- DBMS ASSIGNMENT 2 VIEWS
-- ==========================================

-- Query 9: loyalty_customers VIEW
-- Rules: > 5 qualifying orders = 20%, 3-5 = 10%, < 3 = 0%
CREATE OR REPLACE VIEW loyalty_customers AS
SELECT 
    u.id AS customer_id,
    u.name,
    u.email,
    u.phone,
    COUNT(o.id) FILTER (WHERE o.status != 'Cancelled') AS eligible_order_count,
    CASE 
        WHEN COUNT(o.id) FILTER (WHERE o.status != 'Cancelled') > 5 THEN 20
        WHEN COUNT(o.id) FILTER (WHERE o.status != 'Cancelled') >= 3 THEN 10
        ELSE 0
    END AS discount_percentage,
    COALESCE(SUM(o.final_total) FILTER (WHERE o.status != 'Cancelled'), 0.00) AS total_spending
FROM users u
LEFT JOIN orders o ON u.id = o.customer_id
WHERE u.role = 'customer'
GROUP BY u.id, u.name, u.email, u.phone;

-- Query 10: restaurant_performance VIEW
-- Multi-aspect performance without cartesian product inflation
CREATE OR REPLACE VIEW restaurant_performance AS
SELECT 
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    r.cuisine_type,
    r.is_pure_veg,
    COALESCE(m.item_count, 0)::INT AS menu_items_count,
    COALESCE(rev.avg_rating, 0.0)::NUMERIC(3, 2) AS average_rating,
    COALESCE(rev.review_count, 0)::INT AS review_count,
    COALESCE(ord.order_count, 0)::INT AS total_orders,
    COALESCE(ord.total_revenue, 0.00)::NUMERIC(10, 2) AS total_revenue
FROM restaurants r
LEFT JOIN (
    SELECT restaurant_id, COUNT(*) AS item_count 
    FROM menu_items 
    GROUP BY restaurant_id
) m ON r.id = m.restaurant_id
LEFT JOIN (
    SELECT restaurant_id, 
           ROUND(AVG(rating)::numeric, 2) AS avg_rating,
           COUNT(*) AS review_count
    FROM reviews 
    GROUP BY restaurant_id
) rev ON r.id = rev.restaurant_id
LEFT JOIN (
    SELECT restaurant_id, 
           COUNT(*) AS order_count, 
           SUM(final_total) AS total_revenue
    FROM orders 
    WHERE status != 'Cancelled'
    GROUP BY restaurant_id
) ord ON r.id = ord.restaurant_id;

-- ==========================================
-- DBMS ASSIGNMENT 2 PL/pgSQL PROCEDURAL OBJECTS
-- ==========================================

-- Exercise 1: Stored Procedure to Update Order Status
CREATE OR REPLACE PROCEDURE update_order_status(
    p_order_id INT,
    p_new_status VARCHAR,
    p_actor VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status VARCHAR;
BEGIN
    SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order ID % not found', p_order_id;
    END IF;

    IF p_new_status NOT IN ('Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled') THEN
        RAISE EXCEPTION 'Invalid target order status: %', p_new_status;
    END IF;

    UPDATE orders 
    SET status = p_new_status, updated_at = CURRENT_TIMESTAMP 
    WHERE id = p_order_id;

    INSERT INTO order_status_history (order_id, previous_status, new_status, actor, created_at)
    VALUES (p_order_id, v_old_status, p_new_status, p_actor, CURRENT_TIMESTAMP);
END;
$$;

-- Exercise 2: Function to Calculate Order Total from Order Items
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id INT)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC(10, 2);
BEGIN
    SELECT COALESCE(SUM(quantity * unit_price), 0.00)
    INTO v_total
    FROM order_items
    WHERE order_id = p_order_id;

    RETURN v_total;
END;
$$;

-- Exercise 3: Cursor-based Processing Function returning active customers with > 2 qualifying orders
CREATE OR REPLACE FUNCTION get_active_customers_cursor()
RETURNS TABLE (
    customer_id INT,
    customer_name VARCHAR,
    customer_email VARCHAR,
    qualifying_orders BIGINT,
    total_spent NUMERIC(10, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    cur CURSOR FOR 
        SELECT 
            u.id, 
            u.name, 
            u.email, 
            COUNT(o.id) AS q_orders, 
            COALESCE(SUM(o.final_total), 0.00) AS spent
        FROM users u
        JOIN orders o ON u.id = o.customer_id
        WHERE o.status != 'Cancelled'
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(o.id) > 2
        ORDER BY q_orders DESC;
    v_rec RECORD;
BEGIN
    OPEN cur;
    LOOP
        FETCH cur INTO v_rec;
        EXIT WHEN NOT FOUND;
        customer_id := v_rec.id;
        customer_name := v_rec.name;
        customer_email := v_rec.email;
        qualifying_orders := v_rec.q_orders;
        total_spent := v_rec.spent;
        RETURN NEXT;
    END LOOP;
    CLOSE cur;
END;
$$;

-- Exercise 4: Trigger to set initial order status to 'Placed' if missing
CREATE OR REPLACE FUNCTION fn_set_initial_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status IS NULL OR TRIM(NEW.status) = '' THEN
        NEW.status := 'Placed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_initial_order_status ON orders;
CREATE TRIGGER trg_initial_order_status
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_set_initial_order_status();
