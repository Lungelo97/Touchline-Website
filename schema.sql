DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  stock_count INTEGER NOT NULL DEFAULT 0,
  image_url TEXT
);

CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed Initial Touchline Merch
INSERT INTO products (id, name, price_cents, stock_count, image_url) VALUES
('prod_1', 'Touchline Truth Hoodie (Black/Gold)', 65000, 100, 'https://placehold.co/400x400/111/D4AF37?text=Hoodie'),
('prod_2', 'S.O.O.N 2 Album Vinyl', 35000, 50, 'https://placehold.co/400x400/111/D4AF37?text=Vinyl'),
('prod_3', 'Touchline Signature Cap', 25000, 200, 'https://placehold.co/400x400/111/D4AF37?text=Cap');
