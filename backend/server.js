// Joy Fashion — Backend API (Node.js + Express)
// Serves the store frontend AND the API, so one command runs the whole shop:
//   cd backend && npm install && npm start        -> http://localhost:3000
// Data lives in backend/data/db.json (created on first run, seeded with the 12 products).
// Admin login: username "admin", password "admin123" (change ADMIN_PASSWORD in .env,
// or edit backend/data/db.json after first run — the password is bcrypt-hashed).
// Real payments are NOT taken here: checkout creates an order with payment method
// Cash on Delivery / bKash / Nagad, and the admin confirms it by phone, like a real
// small Dhaka shop. To take live bKash payments, connect the bKash PGW API later.
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const path = require("path");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "joy-fashion-dev-secret-CHANGE-ME";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const DB_PATH = path.join(__dirname, "data", "db.json");
const FRONTEND_DIR = path.join(__dirname, "..");

const U = (id) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;
const SEED_PRODUCTS = [
  { id: 1, name: "Handloom Saree — Purple & Gold", cat: "Women", img: U("photo-1610030469983-98e550d6193c"), price: 2450, old: 3200, rating: 4.9, reviews: 47, stock: 6, sizes: ["Free Size"], desc: "Beautiful handloom saree with gold border, perfect for weddings and festivals." },
  { id: 2, name: "Handloom Saree — Black & Gold", cat: "Women", img: U("photo-1610030469668-8e9f641aaf27"), price: 2350, old: 3100, rating: 4.8, reviews: 33, stock: 5, sizes: ["Free Size"], desc: "Elegant black handloom saree with gold zari work." },
  { id: 3, name: "Men's Casual Shirt — Sky Blue", cat: "Men", img: U("photo-1596755094514-f87e34085b2c"), price: 950, old: 1250, rating: 4.6, reviews: 28, stock: 15, sizes: ["M", "L", "XL"], desc: "Breathable casual shirt for everyday wear in Dhaka weather." },
  { id: 4, name: "Slim Fit Jeans — Dark Blue", cat: "Men", img: U("photo-1542272604-787c3835535d"), price: 1350, old: 1750, rating: 4.7, reviews: 36, stock: 11, sizes: ["30", "32", "34", "36"], desc: "Stretchable slim-fit jeans, comfortable all day." },
  { id: 5, name: "Men's Hoodie — Grey", cat: "Men", img: U("photo-1556821840-3a63f95609a7"), price: 1150, old: 1500, rating: 4.8, reviews: 54, stock: 8, sizes: ["M", "L", "XL"], desc: "Warm fleece hoodie with kangaroo pocket." },
  { id: 6, name: "Women's Party Gown — Red", cat: "Women", img: U("photo-1595777457583-95e059d581b8"), price: 2850, old: 3600, rating: 4.9, reviews: 21, stock: 4, sizes: ["S", "M", "L"], desc: "Flowing red party gown for special occasions." },
  { id: 7, name: "Men's Formal Blazer — Black", cat: "Men", img: U("photo-1610652492500-ded49ceeb378"), price: 2950, old: 3900, rating: 4.8, reviews: 19, stock: 5, sizes: ["M", "L", "XL"], desc: "Sharp black formal blazer for office and events." },
  { id: 8, name: "Men's Classic T-Shirt — White", cat: "Men", img: U("photo-1521572163474-6864f9cf17ab"), price: 650, old: 850, rating: 4.6, reviews: 61, stock: 20, sizes: ["S", "M", "L", "XL"], desc: "Soft premium cotton t-shirt, regular fit." },
  { id: 9, name: "Men's T-Shirt — Black", cat: "Men", img: U("photo-1583743814966-8936f5b7be1a"), price: 750, old: 990, rating: 4.5, reviews: 44, stock: 18, sizes: ["S", "M", "L", "XL"], desc: "Classic black cotton t-shirt, comfortable everyday wear." },
  { id: 10, name: "Kids Raincoat — Yellow", cat: "Kids", img: U("photo-1503919545889-aef636e10ad4"), price: 950, old: 1250, rating: 4.7, reviews: 18, stock: 9, sizes: ["4-5Y", "6-7Y"], desc: "Bright yellow raincoat with hood — kids love it on rainy days." },
  { id: 11, name: "Kids Formal Set — Blue", cat: "Kids", img: U("photo-1519238263530-99bdd11df2ea"), price: 1250, old: 1650, rating: 4.8, reviews: 26, stock: 7, sizes: ["4-5Y", "6-7Y", "8-9Y"], desc: "Smart blue cardigan and shorts set with bow tie for little gentlemen." },
  { id: 12, name: "Leather Wallet — Brown", cat: "Accessories", img: U("photo-1627123424574-724758594e93"), price: 850, old: 1150, rating: 4.6, reviews: 29, stock: 13, sizes: ["Free Size"], desc: "Genuine-style brown leather wallet, slim and durable." },
];

let db = null;
async function loadDb() {
  try {
    db = JSON.parse(await fs.readFile(DB_PATH, "utf8"));
  } catch {
    db = {
      products: SEED_PRODUCTS,
      orders: [],
      admin: { username: ADMIN_USER, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) },
    };
    await saveDb();
  }
  return db;
}
async function saveDb() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ---- helpers ----
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required" });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid or expired login" }); }
}
function deliveryFee(subtotal, area) {
  if (subtotal <= 0) return 0;
  if (subtotal >= 2000) return 0;
  return area === "outside" ? 120 : 60;
}

// ---- public API ----
app.get("/api/health", (req, res) => res.json({ ok: true, store: "Joy Fashion" }));

app.get("/api/products", (req, res) => {
  const { cat, q } = req.query;
  let list = db.products;
  if (cat && cat !== "All") list = list.filter((p) => p.cat === cat);
  if (q) list = list.filter((p) => (p.name + " " + p.cat).toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/products/:id", (req, res) => {
  const p = db.products.find((x) => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json(p);
});

// Create an order. Prices and totals are calculated on the SERVER —
// the customer's browser cannot fake the total.
app.post("/api/orders", async (req, res) => {
  const { name, phone, address, city, payment, area, items } = req.body || {};
  if (!name || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Name, phone, address and at least one item are required" });
  }
  if (!["Cash on Delivery", "bKash", "Nagad"].includes(payment)) {
    return res.status(400).json({ error: "Payment must be Cash on Delivery, bKash or Nagad" });
  }
  const lines = [];
  let subtotal = 0;
  for (const it of items) {
    const p = db.products.find((x) => x.id === Number(it.id));
    if (!p) return res.status(400).json({ error: `Product ${it.id} not found` });
    const qty = Math.max(1, Math.min(Number(it.qty) || 1, p.stock));
    if (p.stock < qty) return res.status(400).json({ error: `${p.name} is out of stock` });
    lines.push({ id: p.id, name: p.name, size: it.size || p.sizes[0], qty, price: p.price });
    subtotal += p.price * qty;
  }
  const delivery = deliveryFee(subtotal, area);
  const order = {
    id: "JF-" + Date.now().toString().slice(-6),
    date: new Date().toLocaleDateString("en-GB"),
    name, phone, address, city: city || "Dhaka",
    payment, items: lines, subtotal, delivery, total: subtotal + delivery,
    status: "Confirmed — we will call you",
  };
  for (const l of lines) {
    const p = db.products.find((x) => x.id === l.id);
    p.stock -= l.qty;
  }
  db.orders.unshift(order);
  await saveDb();
  res.status(201).json(order);
});

// ---- admin API ----
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (username !== db.admin.username) return res.status(401).json({ error: "Wrong username or password" });
  const ok = await bcrypt.compare(password || "", db.admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "Wrong username or password" });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

app.get("/api/admin/stats", auth, (req, res) => {
  res.json({
    totalProducts: db.products.length,
    totalOrders: db.orders.length,
    totalRevenue: db.orders.reduce((s, o) => s + (o.total || 0), 0),
    lowStock: db.products.filter((p) => p.stock <= 5).length,
  });
});

app.get("/api/admin/orders", auth, (req, res) => res.json(db.orders));

app.patch("/api/admin/orders/:id/status", auth, async (req, res) => {
  const allowed = ["Confirmed — we will call you", "Packed", "Out for delivery", "Delivered", "Cancelled"];
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: "Order not found" });
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid status" });
  o.status = req.body.status;
  await saveDb();
  res.json(o);
});

app.post("/api/admin/products", auth, async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.price || !b.img) return res.status(400).json({ error: "Name, price and photo URL are required" });
  const p = {
    id: Math.max(0, ...db.products.map((x) => x.id)) + 1,
    name: b.name, cat: b.cat || "Men", img: b.img,
    price: Number(b.price), old: Number(b.old) || Number(b.price),
    rating: Number(b.rating) || 4.5, reviews: 0, stock: Number(b.stock) || 0,
    sizes: Array.isArray(b.sizes) ? b.sizes : String(b.sizes || "M, L, XL").split(",").map((s) => s.trim()).filter(Boolean),
    desc: b.desc || "New arrival at Joy Fashion.",
  };
  db.products.push(p);
  await saveDb();
  res.status(201).json(p);
});

app.put("/api/admin/products/:id", auth, async (req, res) => {
  const p = db.products.find((x) => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "Product not found" });
  const b = req.body || {};
  for (const f of ["name", "cat", "img", "desc"]) if (b[f] !== undefined) p[f] = b[f];
  for (const f of ["price", "old", "rating", "stock"]) if (b[f] !== undefined) p[f] = Number(b[f]);
  if (b.sizes !== undefined) p.sizes = Array.isArray(b.sizes) ? b.sizes : String(b.sizes).split(",").map((s) => s.trim()).filter(Boolean);
  await saveDb();
  res.json(p);
});

app.delete("/api/admin/products/:id", auth, async (req, res) => {
  const i = db.products.findIndex((x) => x.id === Number(req.params.id));
  if (i < 0) return res.status(404).json({ error: "Product not found" });
  db.products.splice(i, 1);
  await saveDb();
  res.json({ ok: true });
});

// ---- frontend (the store itself) ----
app.use(express.static(FRONTEND_DIR));
app.get("*", (req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));

loadDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Joy Fashion running at http://localhost:${PORT}`);
    console.log(`Store:   http://localhost:${PORT}/`);
    console.log(`Admin:   http://localhost:${PORT}/admin.html  (admin / admin123)`);
    console.log(`API:     http://localhost:${PORT}/api/health`);
  });
});
