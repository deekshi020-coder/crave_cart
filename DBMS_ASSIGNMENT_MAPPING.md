# CraveCart — DBMS Design Assignment 2 (DA2) Comprehensive Mapping

This document maps all ten required SQL queries and five PL/pgSQL procedural exercises to their database objects, backend API endpoints, and natural UI features within the CraveCart food delivery management system.

---

## 1. Ten Required SQL Queries

### Query 1: Customers With More Than Five Orders in September 2026
- **Assignment Objective:** Identify customers who placed more than five qualifying orders during September 2026 using the half-open date range `[2026-09-01, 2026-10-01)`.
- **Database Tables:** `users`, `orders`
- **SQL Implementation:**
  ```sql
  SELECT 
      u.id AS customer_id,
      u.name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      COUNT(o.id)::INT AS september_order_count,
      SUM(o.final_total)::NUMERIC(10, 2) AS september_spending,
      'September 2026' AS period_name
  FROM users u
  JOIN orders o ON u.id = o.customer_id
  WHERE o.status != 'Cancelled'
    AND o.created_at >= DATE '2026-09-01'
    AND o.created_at < DATE '2026-10-01'
  GROUP BY u.id, u.name, u.email, u.phone
  HAVING COUNT(o.id) > 5
  ORDER BY september_order_count DESC;
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/monthly-customers`
- **Application Screen:** Administrator Dashboard → DA2 SQL Queries Hub → Query 1 Tab. Returns Customer 1 (Aarav Sharma) with 6 qualifying orders in September 2026.

---

### Query 2: Restaurants With Average Review Rating Above 4.0
- **Assignment Objective:** Calculate the average rating for each restaurant and return those with an average strictly greater than 4.0. Restaurants with no reviews are safely excluded or handled without fabricated numbers.
- **Database Tables:** `restaurants`, `reviews`
- **SQL Implementation:**
  ```sql
  SELECT 
      r.id AS restaurant_id,
      r.name AS restaurant_name,
      r.cuisine_type,
      r.is_pure_veg,
      ROUND(AVG(rev.rating)::numeric, 2) AS avg_rating,
      COUNT(rev.id)::INT AS review_count
  FROM restaurants r
  JOIN reviews rev ON r.id = rev.restaurant_id
  GROUP BY r.id, r.name, r.cuisine_type, r.is_pure_veg
  HAVING AVG(rev.rating) > 4.0
  ORDER BY avg_rating DESC, review_count DESC;
  ```
- **Backend Endpoint:** `GET /api/restaurants?minRating=4.0` and `GET /api/admin/analytics/top-rated-restaurants`
- **Application Screen:** Customer Homepage "Rating 4.0+" Filter Chip and Administrator Restaurant Analytics table.

---

### Query 3: Top Three Customers by Total Eligible Paid Spending
- **Assignment Objective:** Find the top three customers by eligible paid spending using authoritative completed payment and non-cancelled order records.
- **Database Tables:** `users`, `orders`, `payments`
- **SQL Implementation:**
  ```sql
  SELECT 
      u.id AS customer_id,
      u.name AS customer_name,
      u.email AS customer_email,
      SUM(p.amount)::NUMERIC(10, 2) AS total_paid_spending,
      COUNT(DISTINCT o.id)::INT AS paid_order_count
  FROM users u
  JOIN orders o ON u.id = o.customer_id
  JOIN payments p ON o.id = p.order_id
  WHERE p.status = 'Completed' AND o.status != 'Cancelled'
  GROUP BY u.id, u.name, u.email
  ORDER BY total_paid_spending DESC
  LIMIT 3;
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/top-customers`
- **Application Screen:** Administrator Dashboard → DA2 SQL Queries Hub → Query 3 Tab (Top Customer Spenders Leaderboard).

---

### Query 4: Customers Spending Above the Benchmark Average
- **Assignment Objective:** Calculate each customer's total spending and compare it against the overall average customer spending benchmark.
- **Database Tables:** `users`, `orders`
- **SQL Implementation:**
  ```sql
  WITH customer_spend AS (
      SELECT 
          u.id AS customer_id,
          u.name AS customer_name,
          u.email AS customer_email,
          COALESCE(SUM(o.final_total), 0.00)::NUMERIC(10, 2) AS total_spending,
          COUNT(o.id)::INT AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.customer_id AND o.status != 'Cancelled'
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name, u.email
  ),
  spend_benchmark AS (
      SELECT AVG(total_spending) AS avg_customer_spending
      FROM customer_spend 
      WHERE total_spending > 0
  )
  SELECT 
      cs.customer_id,
      cs.customer_name,
      cs.customer_email,
      cs.total_spending,
      cs.order_count,
      ROUND((SELECT avg_customer_spending FROM spend_benchmark)::numeric, 2) AS benchmark_avg_spending,
      ROUND((cs.total_spending - (SELECT avg_customer_spending FROM spend_benchmark))::numeric, 2) AS spend_surplus
  FROM customer_spend cs
  WHERE cs.total_spending > (SELECT avg_customer_spending FROM spend_benchmark)
  ORDER BY cs.total_spending DESC;
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/above-average-spending`
- **Application Screen:** Administrator Dashboard → High Spender Segmentation Report.

---

### Query 5: Menu Items Priced Above Their Restaurant's Average
- **Assignment Objective:** For every restaurant, compute the average price of its dishes and return all dishes priced above that restaurant's own average.
- **Database Tables:** `menu_items`, `restaurants`
- **SQL Implementation:**
  ```sql
  WITH rest_averages AS (
      SELECT restaurant_id, AVG(price) AS avg_menu_price
      FROM menu_items
      GROUP BY restaurant_id
  )
  SELECT 
      r.name AS restaurant_name,
      m.id AS menu_item_id,
      m.name AS menu_item_name,
      m.price AS item_price,
      ROUND(ra.avg_menu_price::numeric, 2) AS restaurant_avg_price,
      ROUND((m.price - ra.avg_menu_price)::numeric, 2) AS price_delta
  FROM menu_items m
  JOIN restaurants r ON m.restaurant_id = r.id
  JOIN rest_averages ra ON m.restaurant_id = ra.restaurant_id
  WHERE m.price > ra.avg_menu_price
  ORDER BY r.name ASC, m.price DESC;
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/menu-price-analysis` and `GET /api/restaurants/:id/menu`
- **Application Screen:** Restaurant Menu Item Card "Premium (Above Avg)" badge and Administrator Menu Pricing Analytics.

---

### Query 6: Highest-Rated Restaurants (Including Ties)
- **Assignment Objective:** Find the restaurant(s) with the maximum average review rating. Returns all tied restaurants without arbitrary single-limit truncation.
- **Database Tables:** `restaurants`, `reviews`
- **SQL Implementation:**
  ```sql
  WITH rest_ratings AS (
      SELECT 
          r.id AS restaurant_id,
          r.name AS restaurant_name,
          r.cuisine_type,
          r.image_url,
          ROUND(AVG(rev.rating)::numeric, 2) AS avg_rating,
          COUNT(rev.id)::INT AS review_count
      FROM restaurants r
      JOIN reviews rev ON r.id = rev.restaurant_id
      GROUP BY r.id, r.name, r.cuisine_type, r.image_url
  )
  SELECT 
      restaurant_id,
      restaurant_name,
      cuisine_type,
      image_url,
      avg_rating,
      review_count
  FROM rest_ratings
  WHERE avg_rating = (SELECT MAX(avg_rating) FROM rest_ratings)
  ORDER BY restaurant_name ASC;
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/highest-rated-ties`
- **Application Screen:** Customer Homepage Top-Rated Spotlight (displays tied 4.8 rated restaurants) & Admin Analytics.

---

### Query 7: Food Categories With More Than Two Items Sold
- **Assignment Objective:** Sum the quantities sold for each category using actual order items and filter for categories where `SUM(quantity) > 2`.
- **Database Tables:** `categories`, `menu_items`, `order_items`, `orders`
- **SQL Implementation:**
  ```sql
  SELECT 
      c.id AS category_id,
      c.name AS category_name,
      SUM(oi.quantity)::INT AS total_units_sold,
      COUNT(DISTINCT o.id)::INT AS total_orders,
      SUM(oi.line_total)::NUMERIC(10, 2) AS category_revenue
  FROM categories c
  JOIN menu_items m ON c.id = m.category_id
  JOIN order_items oi ON m.id = oi.menu_item_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status != 'Cancelled'
  GROUP BY c.id, c.name
  HAVING SUM(oi.quantity) > 2
  ORDER BY total_units_sold DESC;
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/category-sales`
- **Application Screen:** Administrator Dashboard → Category Sales & Popularity Report.

---

### Query 8: Orders Above Average Order Value (AOV)
- **Assignment Objective:** Calculate order item totals from historical snapshot unit prices and quantities, determine the global AOV benchmark, and return orders above average.
- **Database Tables:** `orders`, `order_items`, `users`, `restaurants`
- **SQL Implementation:**
  ```sql
  WITH calculated_orders AS (
      SELECT 
          o.id AS order_id,
          o.created_at,
          u.name AS customer_name,
          r.name AS restaurant_name,
          SUM(oi.quantity * oi.unit_price)::NUMERIC(10, 2) AS order_item_value
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status != 'Cancelled'
      GROUP BY o.id, o.created_at, u.name, r.name
  ),
  aov_benchmark AS (
      SELECT AVG(order_item_value) AS avg_order_value FROM calculated_orders
  )
  SELECT 
      co.order_id,
      co.created_at,
      co.customer_name,
      co.restaurant_name,
      co.order_item_value,
      ROUND((SELECT avg_order_value FROM aov_benchmark)::numeric, 2) AS benchmark_aov,
      ROUND((co.order_item_value - (SELECT avg_order_value FROM aov_benchmark))::numeric, 2) AS surplus_value
  FROM calculated_orders co
  WHERE co.order_item_value > (SELECT avg_order_value FROM aov_benchmark)
  ORDER BY co.order_item_value DESC;
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/high-value-orders`
- **Application Screen:** Administrator Dashboard → High-Value Orders Report.

---

### Query 9: `loyalty_customers` PostgreSQL View
- **Assignment Objective:** A persistent PostgreSQL View that calculates customer loyalty tiers:
  * `> 5` eligible orders: **20%** discount
  * `3 to 5` eligible orders: **10%** discount
  * `< 3` eligible orders: **0%** discount
- **Database Object:** `VIEW loyalty_customers`
- **SQL Definition:**
  ```sql
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
  ```
- **Backend Endpoints:** `GET /api/profile/loyalty`, `POST /api/orders`, and `GET /api/admin/analytics/loyalty-customers`
- **Application Screen:** Live Customer Checkout (automatically deducts loyalty discount), Customer Profile, and Admin Loyalty Table.

---

### Query 10: `restaurant_performance` PostgreSQL View
- **Assignment Objective:** Independent subquery aggregation view summarizing restaurant menu item count, average review rating, review count, order count, and revenue without Cartesian product inflation.
- **Database Object:** `VIEW restaurant_performance`
- **SQL Definition:**
  ```sql
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
  ```
- **Backend Endpoint:** `GET /api/admin/analytics/restaurant-performance`
- **Application Screen:** Administrator Dashboard → Restaurant Performance Table.

---

## 2. Five PL/pgSQL Procedural Exercises

### Exercise 1: Stored Procedure `update_order_status`
- **Specification:** Stored procedure that validates order existence, validates transition status, updates `orders`, and inserts an entry into `order_status_history`.
- **PL/pgSQL Code:**
  ```sql
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
  ```
- **Executed via:** `CALL update_order_status(p_order_id, p_new_status, p_actor)`
- **Endpoints:** `PATCH /api/admin/orders/:id/status`, `PATCH /api/delivery/orders/:id/status`, and `POST /api/orders/:id/cancel`
- **UI Screen:** Admin Order Management table and Delivery Agent console actions.

---

### Exercise 2: Function `calculate_order_total`
- **Specification:** Computes order total strictly from historical snapshot prices and quantities in `order_items`.
- **PL/pgSQL Code:**
  ```sql
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
  ```
- **Endpoints:** `GET /api/orders/:id`
- **UI Screen:** Verified on Order Tracking receipt breakdown modal.

---

### Exercise 3: Cursor-Based Customer Report Function
- **Specification:** Cursor-based iteration in PL/pgSQL that opens a `CURSOR`, loops through rows with `FETCH`, and outputs customers with more than two qualifying orders.
- **PL/pgSQL Code:**
  ```sql
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
  ```
- **Endpoints:** `GET /api/admin/analytics/cursor-report`
- **UI Screen:** Admin Dashboard → Procedural Tools → Cursor-Based Active Customer Report.

---

### Exercise 4: Trigger `trg_initial_order_status`
- **Specification:** A `BEFORE INSERT FOR EACH ROW` trigger that defaults an order's status to `'Placed'` whenever no status is provided or when blank.
- **PL/pgSQL Code:**
  ```sql
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
  ```
- **Enforcement:** Applied automatically at database engine level on every `INSERT INTO orders`.

---

### Exercise 5: Anonymous Block for Customer ID 1
- **Specification:** A PL/pgSQL anonymous `DO` block evaluating Customer ID 1 (Aarav Sharma), retrieving eligible orders, assigning 0%/10%/20% discount, and printing results with `RAISE NOTICE`.
- **PL/pgSQL Code:**
  ```sql
  DO $$
  DECLARE
      v_customer_id INT := 1;
      v_customer_name VARCHAR(100);
      v_order_count INT;
      v_discount_pct INT;
  BEGIN
      SELECT name INTO v_customer_name FROM users WHERE id = v_customer_id;
      IF NOT FOUND THEN
          RAISE NOTICE 'Customer ID % not found in CraveCart database.', v_customer_id;
          RETURN;
      END IF;

      SELECT COUNT(id) INTO v_order_count
      FROM orders
      WHERE customer_id = v_customer_id AND status != 'Cancelled';

      IF v_order_count > 5 THEN
          v_discount_pct := 20;
      ELSIF v_order_count >= 3 THEN
          v_discount_pct := 10;
      ELSE
          v_discount_pct := 0;
      END IF;

      RAISE NOTICE 'Customer ID: % (%) has % eligible orders. Loyalty Discount: %% %', 
          v_customer_id, v_customer_name, v_order_count, v_discount_pct;
  END $$;
  ```
- **Interactive Execution:** Supported directly in Administrator Console (`POST /api/admin/execute-loyalty-block`) capturing and displaying live PostgreSQL `RAISE NOTICE` stream!
