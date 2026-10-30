import React, { useState } from 'react';
import { X, BookOpen, Search, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface Da2MappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabName: string) => void;
}

interface MappingItem {
  id: string;
  type: 'Query' | 'Procedural';
  title: string;
  requirement: string;
  sqlSnippet: string;
  tables: string;
  apiEndpoint: string;
  uiLocation: string;
}

const MAPPINGS: MappingItem[] = [
  {
    id: 'Q1',
    type: 'Query',
    title: 'Query 1: Customers with > 5 Orders in September 2026',
    requirement: 'Find customers who placed more than five qualifying orders during September 2026 using half-open date range [2026-09-01, 2026-10-01).',
    sqlSnippet: `SELECT 
    u.id, u.name, u.email,
    COUNT(o.id) AS september_orders,
    SUM(o.final_total) AS september_spending
FROM users u
JOIN orders o ON u.id = o.customer_id
WHERE o.status != 'Cancelled'
  AND o.created_at >= DATE '2026-09-01' 
  AND o.created_at < DATE '2026-10-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5;`,
    tables: 'users, orders',
    apiEndpoint: 'GET /api/admin/analytics/monthly-customers',
    uiLocation: 'Admin Dashboard → Monthly Customer Analytics Card',
  },
  {
    id: 'Q2',
    type: 'Query',
    title: 'Query 2: Restaurants with Average Rating Above 4.0',
    requirement: 'Calculate average review rating for each restaurant and return those with rating > 4.0 using real review records.',
    sqlSnippet: `SELECT 
    r.id, r.name, r.cuisine_type,
    ROUND(AVG(rev.rating)::numeric, 2) AS avg_rating,
    COUNT(rev.id) AS review_count
FROM restaurants r
JOIN reviews rev ON r.id = rev.restaurant_id
GROUP BY r.id, r.name, r.cuisine_type
HAVING AVG(rev.rating) > 4.0
ORDER BY avg_rating DESC;`,
    tables: 'restaurants, reviews',
    apiEndpoint: 'GET /api/restaurants?minRating=4.0 / GET /api/admin/analytics/top-rated-restaurants',
    uiLocation: 'Customer Homepage Filter Chip "Rating 4.0+" & Admin Restaurant Analytics',
  },
  {
    id: 'Q3',
    type: 'Query',
    title: 'Query 3: Top Three Customers by Total Spending',
    requirement: 'Find the top three customers by eligible paid spending using authoritative completed payment and non-cancelled order records.',
    sqlSnippet: `SELECT 
    u.id, u.name, u.email,
    SUM(p.amount) AS total_paid_spending,
    COUNT(DISTINCT o.id) AS paid_orders_count
FROM users u
JOIN orders o ON u.id = o.customer_id
JOIN payments p ON o.id = p.order_id
WHERE p.status = 'Completed' AND o.status != 'Cancelled'
GROUP BY u.id, u.name, u.email
ORDER BY total_paid_spending DESC
LIMIT 3;`,
    tables: 'users, orders, payments',
    apiEndpoint: 'GET /api/admin/analytics/top-customers',
    uiLocation: 'Admin Dashboard → Top Customers Leaderboard Card',
  },
  {
    id: 'Q4',
    type: 'Query',
    title: 'Query 4: Customers Spending Above Average',
    requirement: 'Calculate each customer total eligible spending and compare against average customer spending benchmark.',
    sqlSnippet: `WITH customer_spend AS (
    SELECT u.id, u.name, u.email,
           COALESCE(SUM(o.final_total), 0) AS total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.customer_id AND o.status != 'Cancelled'
    WHERE u.role = 'customer'
    GROUP BY u.id, u.name, u.email
)
SELECT id, name, email, total_spent
FROM customer_spend
WHERE total_spent > (SELECT AVG(total_spent) FROM customer_spend WHERE total_spent > 0)
ORDER BY total_spent DESC;`,
    tables: 'users, orders',
    apiEndpoint: 'GET /api/admin/analytics/above-average-spending',
    uiLocation: 'Admin Dashboard → High Spender Segmentation Report',
  },
  {
    id: 'Q5',
    type: 'Query',
    title: 'Query 5: Menu Items Priced Above Restaurant Average',
    requirement: 'Calculate average menu item price for every restaurant and return items priced above their own restaurant average.',
    sqlSnippet: `WITH restaurant_averages AS (
    SELECT restaurant_id, AVG(price) AS avg_menu_price
    FROM menu_items
    GROUP BY restaurant_id
)
SELECT 
    r.name AS restaurant_name,
    m.name AS menu_item_name,
    m.price AS item_price,
    ROUND(ra.avg_menu_price::numeric, 2) AS restaurant_avg_price
FROM menu_items m
JOIN restaurants r ON m.restaurant_id = r.id
JOIN restaurant_averages ra ON m.restaurant_id = ra.restaurant_id
WHERE m.price > ra.avg_menu_price;`,
    tables: 'menu_items, restaurants',
    apiEndpoint: 'GET /api/admin/analytics/menu-price-analysis & GET /api/restaurants/:id/menu',
    uiLocation: 'Restaurant Menu (Premium Badge) & Admin Menu Analytics',
  },
  {
    id: 'Q6',
    type: 'Query',
    title: 'Query 6: Highest-Rated Restaurants (Including Ties)',
    requirement: 'Find restaurant(s) with the highest average review rating. Returns all tied restaurants without arbitrary single-limit truncation.',
    sqlSnippet: `WITH rest_ratings AS (
    SELECT r.id, r.name, r.cuisine_type,
           ROUND(AVG(rev.rating)::numeric, 2) AS avg_rating
    FROM restaurants r
    JOIN reviews rev ON r.id = rev.restaurant_id
    GROUP BY r.id, r.name, r.cuisine_type
)
SELECT id, name, cuisine_type, avg_rating
FROM rest_ratings
WHERE avg_rating = (SELECT MAX(avg_rating) FROM rest_ratings);`,
    tables: 'restaurants, reviews',
    apiEndpoint: 'GET /api/admin/analytics/highest-rated-ties',
    uiLocation: 'Homepage Top-Rated Spotlight & Admin Analytics',
  },
  {
    id: 'Q7',
    type: 'Query',
    title: 'Query 7: Food Categories with > 2 Items Sold',
    requirement: 'Calculate total units sold for each food category using order_items. Returns categories where total units sold > 2.',
    sqlSnippet: `SELECT 
    c.id AS category_id,
    c.name AS category_name,
    SUM(oi.quantity) AS total_units_sold,
    SUM(oi.line_total) AS category_revenue
FROM categories c
JOIN menu_items m ON c.id = m.category_id
JOIN order_items oi ON m.id = oi.menu_item_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'Cancelled'
GROUP BY c.id, c.name
HAVING SUM(oi.quantity) > 2;`,
    tables: 'categories, menu_items, order_items, orders',
    apiEndpoint: 'GET /api/admin/analytics/category-sales',
    uiLocation: 'Admin Dashboard → Category Sales & Popularity Chart',
  },
  {
    id: 'Q8',
    type: 'Query',
    title: 'Query 8: Orders Above Average Order Value (AOV)',
    requirement: 'Calculate each order value using snapshot quantities and unit prices, and return orders exceeding the average order value.',
    sqlSnippet: `WITH order_values AS (
    SELECT o.id, o.customer_id, u.name AS customer_name,
           SUM(oi.quantity * oi.unit_price) AS order_val
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.status != 'Cancelled'
    GROUP BY o.id, o.customer_id, u.name
)
SELECT id, customer_name, order_val
FROM order_values
WHERE order_val > (SELECT AVG(order_val) FROM order_values);`,
    tables: 'orders, order_items, users',
    apiEndpoint: 'GET /api/admin/analytics/high-value-orders',
    uiLocation: 'Admin Dashboard → High-Value Orders Report Table',
  },
  {
    id: 'Q9',
    type: 'Query',
    title: 'Query 9: loyalty_customers PostgreSQL View',
    requirement: 'PostgreSQL view calculating loyalty discounts: >5 orders = 20%, 3-5 orders = 10%, <3 orders = 0%.',
    sqlSnippet: `CREATE OR REPLACE VIEW loyalty_customers AS
SELECT 
    u.id AS customer_id, u.name, u.email, u.phone,
    COUNT(o.id) FILTER (WHERE o.status != 'Cancelled') AS eligible_order_count,
    CASE 
        WHEN COUNT(o.id) FILTER (WHERE o.status != 'Cancelled') > 5 THEN 20
        WHEN COUNT(o.id) FILTER (WHERE o.status != 'Cancelled') >= 3 THEN 10
        ELSE 0
    END AS discount_percentage,
    COALESCE(SUM(o.final_total) FILTER (WHERE o.status != 'Cancelled'), 0) AS total_spending
FROM users u
LEFT JOIN orders o ON u.id = o.customer_id
WHERE u.role = 'customer'
GROUP BY u.id, u.name, u.email, u.phone;`,
    tables: 'users, orders (as PostgreSQL VIEW)',
    apiEndpoint: 'GET /api/profile/loyalty & GET /api/admin/analytics/loyalty-customers',
    uiLocation: 'Customer Checkout, Loyalty Profile, & Admin Table',
  },
  {
    id: 'Q10',
    type: 'Query',
    title: 'Query 10: restaurant_performance PostgreSQL View',
    requirement: 'Independent aggregation view reporting restaurant menu item counts, average ratings, order volume, and revenue without Cartesian multiplication.',
    sqlSnippet: `CREATE OR REPLACE VIEW restaurant_performance AS
SELECT 
    r.id AS restaurant_id, r.name AS restaurant_name,
    COALESCE(m.item_count, 0) AS menu_items_count,
    COALESCE(rev.avg_rating, 0.0) AS average_rating,
    COALESCE(ord.order_count, 0) AS total_orders,
    COALESCE(ord.total_revenue, 0.00) AS total_revenue
FROM restaurants r
LEFT JOIN (SELECT restaurant_id, COUNT(*) AS item_count FROM menu_items GROUP BY restaurant_id) m ON r.id = m.restaurant_id
LEFT JOIN (SELECT restaurant_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating FROM reviews GROUP BY restaurant_id) rev ON r.id = rev.restaurant_id
LEFT JOIN (SELECT restaurant_id, COUNT(*) AS order_count, SUM(final_total) AS total_revenue FROM orders WHERE status != 'Cancelled' GROUP BY restaurant_id) ord ON r.id = ord.restaurant_id;`,
    tables: 'restaurants, menu_items, reviews, orders (as PostgreSQL VIEW)',
    apiEndpoint: 'GET /api/admin/analytics/restaurant-performance',
    uiLocation: 'Admin Dashboard → Restaurant Performance Grid',
  },
  {
    id: 'P1',
    type: 'Procedural',
    title: 'Exercise 1: Stored Procedure update_order_status',
    requirement: 'PostgreSQL procedure with transaction safety, order validation, status transition verification, and audit logging into order_status_history.',
    sqlSnippet: `CREATE OR REPLACE PROCEDURE update_order_status(
    p_order_id INT,
    p_new_status VARCHAR,
    p_actor VARCHAR
)
LANGUAGE plpgsql AS $$
DECLARE v_old_status VARCHAR;
BEGIN
    SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order ID % not found', p_order_id; END IF;
    UPDATE orders SET status = p_new_status, updated_at = CURRENT_TIMESTAMP WHERE id = p_order_id;
    INSERT INTO order_status_history (order_id, previous_status, new_status, actor, created_at)
    VALUES (p_order_id, v_old_status, p_new_status, p_actor, CURRENT_TIMESTAMP);
END; $$;`,
    tables: 'orders, order_status_history (Procedure)',
    apiEndpoint: 'PATCH /api/admin/orders/:id/status & PATCH /api/delivery/orders/:id/status',
    uiLocation: 'Admin Order Management & Delivery Agent status actions',
  },
  {
    id: 'P2',
    type: 'Procedural',
    title: 'Exercise 2: Function calculate_order_total',
    requirement: 'PL/pgSQL function computing order total from historical snapshot prices and quantities in order_items.',
    sqlSnippet: `CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id INT)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql AS $$
DECLARE v_total NUMERIC(10, 2);
BEGIN
    SELECT COALESCE(SUM(quantity * unit_price), 0.00) INTO v_total
    FROM order_items WHERE order_id = p_order_id;
    RETURN v_total;
END; $$;`,
    tables: 'order_items (PL/pgSQL Function)',
    apiEndpoint: 'GET /api/orders/:id (calculates and returns verified subtotal)',
    uiLocation: 'Customer Order Receipt & Admin Order Details',
  },
  {
    id: 'P3',
    type: 'Procedural',
    title: 'Exercise 3: Cursor-Based Active Customer Report',
    requirement: 'PL/pgSQL function utilizing an explicit cursor loop to iterate and return customers with > 2 qualifying orders.',
    sqlSnippet: `CREATE OR REPLACE FUNCTION get_active_customers_cursor()
RETURNS TABLE (customer_id INT, customer_name VARCHAR, qualifying_orders BIGINT, total_spent NUMERIC)
LANGUAGE plpgsql AS $$
DECLARE
    cur CURSOR FOR 
        SELECT u.id, u.name, COUNT(o.id) AS q_orders, SUM(o.final_total) AS spent
        FROM users u JOIN orders o ON u.id = o.customer_id
        WHERE o.status != 'Cancelled' GROUP BY u.id, u.name
        HAVING COUNT(o.id) > 2 ORDER BY q_orders DESC;
    v_rec RECORD;
BEGIN
    OPEN cur;
    LOOP
        FETCH cur INTO v_rec;
        EXIT WHEN NOT FOUND;
        customer_id := v_rec.id; customer_name := v_rec.name;
        qualifying_orders := v_rec.q_orders; total_spent := v_rec.spent;
        RETURN NEXT;
    END LOOP;
    CLOSE cur;
END; $$;`,
    tables: 'users, orders (Cursor-based processing)',
    apiEndpoint: 'GET /api/admin/analytics/cursor-report',
    uiLocation: 'Admin Dashboard → Cursor-Based Active Customer Report Table',
  },
  {
    id: 'P4',
    type: 'Procedural',
    title: 'Exercise 4: Trigger fn_set_initial_order_status',
    requirement: 'BEFORE INSERT row trigger setting newly placed order status to Placed when omitted or empty.',
    sqlSnippet: `CREATE OR REPLACE FUNCTION fn_set_initial_order_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IS NULL OR TRIM(NEW.status) = '' THEN
        NEW.status := 'Placed';
    END IF;
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_initial_order_status
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION fn_set_initial_order_status();`,
    tables: 'orders (BEFORE INSERT Trigger)',
    apiEndpoint: 'POST /api/orders (enforced automatically at database engine level)',
    uiLocation: 'Automatic on Every Customer Order Creation',
  },
  {
    id: 'P5',
    type: 'Procedural',
    title: 'Exercise 5: Anonymous DO Block for Customer ID 1',
    requirement: 'PostgreSQL anonymous block calculating loyalty discount tier for customer ID 1 and emitting RAISE NOTICE logs.',
    sqlSnippet: `DO $$
DECLARE
    v_customer_id INT := 1;
    v_customer_name VARCHAR(100);
    v_order_count INT;
    v_discount_pct INT;
BEGIN
    SELECT name INTO v_customer_name FROM users WHERE id = v_customer_id;
    SELECT COUNT(id) INTO v_order_count FROM orders WHERE customer_id = v_customer_id AND status != 'Cancelled';
    IF v_order_count > 5 THEN v_discount_pct := 20;
    ELSIF v_order_count >= 3 THEN v_discount_pct := 10;
    ELSE v_discount_pct := 0; END IF;
    RAISE NOTICE 'Customer ID: % (%) has % eligible orders. Loyalty Discount: %% %', 
        v_customer_id, v_customer_name, v_order_count, v_discount_pct;
END $$;`,
    tables: 'users, orders (Anonymous PL/pgSQL DO Block)',
    apiEndpoint: 'POST /api/admin/execute-loyalty-block',
    uiLocation: 'Admin Dashboard → Procedural Tools → Interactive Anonymous Block Runner',
  },
];

export const Da2MappingModal: React.FC<Da2MappingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Query' | 'Procedural'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = MAPPINGS.filter((m) => {
    const matchesType = filterType === 'All' || m.type === filterType;
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.requirement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tables.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">DBMS Assignment 2 Mapping & SQL Hub</h3>
              <p className="text-xs text-stone-500">10 Relational Queries + 5 PL/pgSQL Procedural Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search DA2 queries or tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg self-stretch sm:self-auto justify-center">
            {(['All', 'Query', 'Procedural'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterType === t
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t === 'All' ? 'All (15)' : t === 'Query' ? '10 SQL Queries' : '5 Procedural Exercises'}
              </button>
            ))}
          </div>
        </div>

        {/* List of Mappings */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="border border-stone-200 rounded-xl p-4 sm:p-5 bg-white shadow-sm space-y-3 hover:border-stone-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase ${
                    item.type === 'Query' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {item.id} · {item.type}
                  </span>
                  <h4 className="font-bold text-sm text-stone-900">{item.title}</h4>
                </div>
                <button
                  onClick={() => handleCopy(item.id, item.sqlSnippet)}
                  className="self-end sm:self-auto flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded transition-colors"
                >
                  {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === item.id ? 'Copied SQL' : 'Copy SQL'}</span>
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">{item.requirement}</p>

              {/* SQL Snippet */}
              <div className="relative rounded-lg bg-stone-900 p-3.5 text-stone-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
                <pre>{item.sqlSnippet}</pre>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Underlying Tables</span>
                  <span className="font-mono text-stone-800 font-medium">{item.tables}</span>
                </div>
                <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Backend Endpoint</span>
                  <span className="font-mono text-stone-800 font-medium truncate block">{item.apiEndpoint}</span>
                </div>
                <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Frontend UI Integration</span>
                  <span className="text-stone-800 font-medium truncate block">{item.uiLocation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>DBMS Assignment 2 Full-Stack Integration · PostgreSQL & PL/pgSQL</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
