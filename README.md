# CraveCart — Full-Stack Food Delivery Management System

> **Tagline:** "Good food. Great mood."  
> **Academic Integration:** DBMS Design Assignment 2 (DA2) Complete Specification

CraveCart is a commercial-grade, full-stack food delivery application and PostgreSQL database management system inspired by Swiggy and Zomato. It functions simultaneously as a customer-facing delivery portal and an advanced DBMS demonstration featuring 17 normalized relational tables, parameterized SQL queries, views, stored procedures, functions, triggers, and cursor-based processing.

---

## 1. Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Plus Jakarta Sans typography.
- **Backend:** Node.js, Express, `pg` (node-postgres connection pooling with SSL), `bcryptjs` password hashing, `jsonwebtoken` session tokens.
- **Database:** PostgreSQL (hosted on [Neon](https://neon.tech) or any cloud PostgreSQL provider).
- **Architecture:** Full-stack unified server (`server.ts`) mounting Express APIs and Vite middleware.

---

## 2. Critical Secret & GitHub Security Checklist

To protect credentials and comply with secret scanning policies:

- [x] **Zero Hardcoded Secrets:** No database passwords, connection strings, or JWT secrets are stored in source code.
- [x] **Server-Side Only:** `DATABASE_URL` is accessed strictly in server-side Node.js code (`/server/db/pool.ts`). It is never exposed in client JS, API responses, or browser bundles.
- [x] **Strict `.gitignore`:** Excludes `.env`, `.env.*`, `.env.local`, `.env.production.local`, and build artifacts while tracking placeholder `.env.example`.
- [x] **Placeholder `.env.example`:** Contains only non-sensitive illustrative dummy URIs. Real passwords are never copied into it.
- [x] **Sanitized SQL Files:** `schema.sql` and `seeds.sql` contain standard demo hashes and zero production secrets.
- [x] **Credential Rotation Protocol:** If a secret is ever accidentally exposed, rotate/revoke it immediately in the cloud console, remove it from code, and update the secret store.

---

## 3. Database Schema Overview (17 Normalized Tables)

1. `users` — Customers, Admins, and Delivery Agents with hashed passwords.
2. `addresses` — Multi-address management per user.
3. `restaurants` — Bengaluru restaurants with delivery metadata and pure veg flags.
4. `categories` — Food taxonomy (Biryani, Pizza, Pan-Asian, Sweets, Pure Veg, Beverages).
5. `restaurant_categories` — Many-to-many junction table.
6. `menu_items` — Restaurant dishes with dietary flags, availability, and prices.
7. `carts` — User active cart containers.
8. `cart_items` — Unique cart line items with quantities.
9. `coupons` — Promotional codes (`CRAVE50`, `WELCOME100`, `FEAST20`).
10. `orders` — Orders with status workflow, address snapshots, and discount snapshots.
11. `order_items` — **Historical price snapshots** (`Quantity × Stored Unit Price`) preventing retroactive price tampering.
12. `payments` — Simulated payment records with unique transaction references.
13. `reviews` — Customer restaurant ratings (1.0 to 5.0) and review text.
14. `delivery_agents` — Dispatch personnel metadata and availability.
15. `vehicles` — Electric scooters, motorcycles, and vehicle registrations.
16. `order_status_history` — Comprehensive audit trail of status transitions.
17. `audit_logs` — Administrative entity modifications.

---

## 4. DBMS Assignment 2 Objects

### Two Persistent PostgreSQL Views
- **`loyalty_customers` (Query 9):** Calculates qualifying order counts (excluding cancelled) and applies the DA2 tiered discount rule:
  - `> 5` qualifying orders $\to$ **20%** discount
  - `3 to 5` qualifying orders $\to$ **10%** discount
  - `< 3` qualifying orders $\to$ **0%** discount
- **`restaurant_performance` (Query 10):** Independent subquery aggregations reporting menu counts, average ratings, total orders, and revenue without Cartesian product multiplication.

### Five PL/pgSQL Procedural Objects
1. **Stored Procedure `update_order_status`:** Enforces status transitions (`Placed` $\to$ `Confirmed` $\to$ `Preparing` $\to$ `Ready for Pickup` $\to$ `Out for Delivery` $\to$ `Delivered`) and records audit history.
2. **Function `calculate_order_total`:** Computes order total from `order_items` snapshot prices.
3. **Cursor Function `get_active_customers_cursor`:** Explicit PL/pgSQL cursor loop processing customers with $> 2$ qualifying orders.
4. **Trigger `trg_initial_order_status`:** `BEFORE INSERT` trigger setting initial order status to `'Placed'`.
5. **Anonymous `DO` Block for Customer ID 1:** Computes loyalty tier and emits output via `RAISE NOTICE`.

*Refer to `DBMS_ASSIGNMENT_MAPPING.md` for full query definitions and mappings.*

---

## 5. Setup & Neon PostgreSQL Connection

### Step 1: Create a Hosted PostgreSQL Database
1. Go to [neon.tech](https://neon.tech) and create a free PostgreSQL project.
2. Copy your connection URI (e.g. `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).

### Step 2: Configure Environment Secret
- In Google AI Studio: Open the **Secrets** panel and set `DATABASE_URL` to your Neon connection string.
- Or create a local `.env` file (not committed to Git):
  ```bash
  DATABASE_URL="postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
  JWT_SECRET="your-jwt-secret-key"
  PORT=3000
  ```

### Step 3: Initialize Database Schema & Seeds
- Click the **"PostgreSQL Active / Setup Database"** button in the header.
- Click **"Initialize Schema"** to run `/server/db/schema.sql` and `/server/db/seeds.sql`.

---

## 6. Pre-configured Role Credentials

For academic demonstration, the database includes test accounts:

| Role | Name | Email | Password | Special Attribute |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Aarav Sharma | `aarav@example.com` | `Customer@123` | **6 orders in Sept 2026 (DA2 Q1) & 20% Loyalty (DA2 Q9)** |
| **Customer** | Priya Patel | `priya@example.com` | `Customer@123` | 4 orders (10% Loyalty bracket) |
| **Customer** | Rohan Gupta | `rohan@example.com` | `Customer@123` | **Top spender (DA2 Q3) with &gt; ₹5,000 spend** |
| **Admin** | Admin User | `admin@cravecart.com` | `Admin@123` | Full access to Admin Console & DA2 Hub |
| **Delivery** | Vikram Delivery | `vikram@cravecart.com` | `Agent@123` | Delivery Fleet Console with status actions |

*Use the quick role switcher in the user profile menu to test different roles instantly.*

---

## 7. 14-Step Demonstration Workflow

1. **Open Customer Homepage:** Notice warm cream design, Indian food imagery, and category navigation.
2. **Apply Rating 4.0+ Filter:** Click `Rating 4.0+`. The backend executes **DA2 Query 2**, returning only restaurants rated $> 4.0$.
3. **Sort Restaurants:** Select `Rating: High to Low` or `Price: Low to High`. Observe parameterized PostgreSQL sorting.
4. **Search:** Type "biryani" or "pizza". The query filters across restaurant names, cuisines, and dish names.
5. **Open Restaurant Menu:** Click on **Biryani Darbar**. Notice dishes marked with `Premium (Above Avg)`, dynamically calculated via **DA2 Query 5**.
6. **Add Dishes to Cart:** Add Royal Mutton Dum Biryani and Kesar Lassi.
7. **View Cart & Loyalty Discount:** Open the cart drawer. Notice the **20% Loyalty Discount** automatically applied for customer Aarav Sharma via **DA2 Query 9 (`loyalty_customers`)**.
8. **Apply Coupon:** Enter coupon `CRAVE50` or `WELCOME100` to apply additional promotional savings.
9. **Simulate Payment & Place Order:** Select UPI and click **Place Order & Pay**.
10. **Track Live Order:** Open **My Orders** $\to$ **Track Order**. Notice the 6-stage delivery timeline with status timestamps.
11. **Switch to Administrator Console:** Select **Admin** from the user dropdown.
12. **Inspect DA2 Analytics:** Navigate through all 10 SQL query cards (September 2026 orders, Top Spenders, Category Sales, High-Value Orders, and Views).
13. **Execute PL/pgSQL Operations:** Run the **Anonymous DO Block** (Exercise 5) to see real-time `RAISE NOTICE` outputs. Run the **Cursor Report** (Exercise 3) to test cursor-based processing. Update an order status using the stored procedure (Exercise 1).
14. **Switch to Delivery Fleet:** Select **Delivery Agent** to view assigned deliveries and mark an order `Out for Delivery` or `Delivered`.
