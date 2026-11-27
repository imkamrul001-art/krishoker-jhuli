-- কৃষকের ঝুলি — ডাটাবেস (Cloudflare D1)

CREATE TABLE IF NOT EXISTS products (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  price      INTEGER NOT NULL,          -- প্রতি কেজি দাম (টাকা)
  old_price  INTEGER,                   -- কাটা দাম (না চাইলে NULL)
  available  INTEGER NOT NULL DEFAULT 1, -- ১ = স্টকে আছে, ০ = স্টক শেষ
  sort       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,          -- যেমন KJ1127-4821
  created_at  TEXT NOT NULL,             -- ISO সময় (UTC)
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  area        TEXT NOT NULL,
  address     TEXT NOT NULL,
  items       TEXT NOT NULL,             -- JSON: [{id,name,kg,price,amount}]
  kg          REAL NOT NULL,
  subtotal    INTEGER NOT NULL,
  delivery    INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new', -- new, confirmed, shipped, delivered, cancelled
  note        TEXT NOT NULL DEFAULT '',
  updated_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);

INSERT OR IGNORE INTO products (id, name, price, old_price, available, sort) VALUES
  ('gol',   'গোল পাটালি',  550, 650, 1, 1),
  ('beej',  'বীজ গুড়',     500, 580, 1, 2),
  ('foil',  'ফয়েল পাটালি', 520, 600, 1, 3),
  ('jhola', 'ঝোলা গুড়',    480, 550, 1, 4);
