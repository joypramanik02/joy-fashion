// Joy Fashion — demo store. Edit PRODUCTS below to change products, prices or stock.
// Prices in BDT. No real payment is taken — checkout is a demo order saved in localStorage.
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Handloom Saree — Purple & Gold", cat: "Women", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80&auto=format&fit=crop", price: 2450, old: 3200, rating: 4.9, reviews: 47, stock: 6, sizes: ["Free Size"], desc: "Beautiful handloom saree with gold border, perfect for weddings and festivals." },
  { id: 2, name: "Handloom Saree — Black & Gold", cat: "Women", img: "https://images.unsplash.com/photo-1610030469668-8e9f641aaf27?w=800&q=80&auto=format&fit=crop", price: 2350, old: 3100, rating: 4.8, reviews: 33, stock: 5, sizes: ["Free Size"], desc: "Elegant black handloom saree with gold zari work." },
  { id: 3, name: "Men's Casual Shirt — Sky Blue", cat: "Men", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80&auto=format&fit=crop", price: 950, old: 1250, rating: 4.6, reviews: 28, stock: 15, sizes: ["M", "L", "XL"], desc: "Breathable casual shirt for everyday wear in Dhaka weather." },
  { id: 4, name: "Slim Fit Jeans — Dark Blue", cat: "Men", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80&auto=format&fit=crop", price: 1350, old: 1750, rating: 4.7, reviews: 36, stock: 11, sizes: ["30", "32", "34", "36"], desc: "Stretchable slim-fit jeans, comfortable all day." },
  { id: 5, name: "Men's Hoodie — Grey", cat: "Men", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80&auto=format&fit=crop", price: 1150, old: 1500, rating: 4.8, reviews: 54, stock: 8, sizes: ["M", "L", "XL"], desc: "Warm fleece hoodie with kangaroo pocket." },
  { id: 6, name: "Women's Party Gown — Red", cat: "Women", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&auto=format&fit=crop", price: 2850, old: 3600, rating: 4.9, reviews: 21, stock: 4, sizes: ["S", "M", "L"], desc: "Flowing red party gown for special occasions." },
  { id: 7, name: "Men's Formal Blazer — Black", cat: "Men", img: "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=800&q=80&auto=format&fit=crop", price: 2950, old: 3900, rating: 4.8, reviews: 19, stock: 5, sizes: ["M", "L", "XL"], desc: "Sharp black formal blazer for office and events." },
  { id: 8, name: "Men's Classic T-Shirt — White", cat: "Men", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop", price: 650, old: 850, rating: 4.6, reviews: 61, stock: 20, sizes: ["S", "M", "L", "XL"], desc: "Soft premium cotton t-shirt, regular fit." },
  { id: 9, name: "Men's T-Shirt — Black", cat: "Men", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80&auto=format&fit=crop", price: 750, old: 990, rating: 4.5, reviews: 44, stock: 18, sizes: ["S", "M", "L", "XL"], desc: "Classic black cotton t-shirt, comfortable everyday wear." },
  { id: 10, name: "Kids Raincoat — Yellow", cat: "Kids", img: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&q=80&auto=format&fit=crop", price: 950, old: 1250, rating: 4.7, reviews: 18, stock: 9, sizes: ["4-5Y", "6-7Y"], desc: "Bright yellow raincoat with hood — kids love it on rainy days." },
  { id: 11, name: "Kids Formal Set — Blue", cat: "Kids", img: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80&auto=format&fit=crop", price: 1250, old: 1650, rating: 4.8, reviews: 26, stock: 7, sizes: ["4-5Y", "6-7Y", "8-9Y"], desc: "Smart blue cardigan and shorts set with bow tie for little gentlemen." },
  { id: 12, name: "Leather Wallet — Brown", cat: "Accessories", img: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80&auto=format&fit=crop", price: 850, old: 1150, rating: 4.6, reviews: 29, stock: 13, sizes: ["Free Size"], desc: "Genuine-style brown leather wallet, slim and durable." },
];

let PRODUCTS = (() => { try { return JSON.parse(localStorage.getItem("jf_admin_products")) || DEFAULT_PRODUCTS; } catch { return DEFAULT_PRODUCTS; } })();
const $ = (id) => document.getElementById(id);
// Backend API: when the store is served by the Node backend (localhost:3000 or
// your deployed server), /api/* answers. On GitHub Pages there is no backend,
// so every fetch fails fast and the store keeps working in demo mode (localStorage).
let BACKEND_ON = false;
async function apiFetch(path, opts) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(path, { ...(opts || {}), signal: ctrl.signal, headers: { "Content-Type": "application/json", ...((opts && opts.headers) || {}) } });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const tk = (n) => "৳" + n.toLocaleString("en-IN");

let cart = load("jf_cart", []); // {id, size, qty}
let wishlist = load("jf_wish", []);
let selectedSize = null, quickId = null;

function filtered() {
  const q = ($("search").value || "").toLowerCase();
  const cat = $("category").value, sort = $("sort").value;
  let list = PRODUCTS.filter(p =>
    (cat === "All" || p.cat === cat) &&
    (p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)));
  if (sort === "price-low") list.sort((a, b) => a.price - b.price);
  if (sort === "price-high") list.sort((a, b) => b.price - a.price);
  if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
  return list;
}

function renderProducts() {
  const list = filtered();
  $("result-count").textContent = `${list.length} product(s) found`;
  $("products").innerHTML = list.length ? list.map(p => `
    <article class="product">
      <div class="thumb" onclick="openQuick(${p.id})"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
      <div class="body">
        <span class="cat">${p.cat}</span>
        <h3 onclick="openQuick(${p.id})">${p.name}</h3>
        <p class="rating">★ ${p.rating} (${p.reviews} reviews)</p>
        <p class="muted">${p.stock > 0 ? `In stock: ${p.stock}` : "Out of stock"}</p>
        <p class="price">${tk(p.price)} <span class="old-price">${tk(p.old)}</span></p>
        <div class="actions">
          <button class="btn small" onclick="addToCart(${p.id})">Add to Cart</button>
          <button class="wish ${wishlist.includes(p.id) ? "active" : ""}" onclick="toggleWish(${p.id}, this)">${wishlist.includes(p.id) ? "♥" : "♡"}</button>
        </div>
      </div>
    </article>`).join("")
    : `<div class="empty">No products match your search. Try “saree”, “blazer” or “hoodie”.</div>`;
}

window.toggleWish = function (id, btn) {
  wishlist = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
  save("jf_wish", wishlist); renderProducts();
};
window.addToCart = function (id, size) {
  const p = PRODUCTS.find(x => x.id === id); if (!p) return;
  const s = size || p.sizes[0];
  const line = cart.find(c => c.id === id && c.size === s);
  if (line) line.qty = Math.min(line.qty + 1, p.stock);
  else cart.push({ id, size: s, qty: 1 });
  save("jf_cart", cart); renderCart(); openCart();
};
window.openQuick = function (id) {
  const p = PRODUCTS.find(x => x.id === id); if (!p) return;
  quickId = id; selectedSize = p.sizes[0];
  $("quick-body").innerHTML = `
    <img src="${p.img}" alt="${p.name}" style="width:100%;border-radius:12px;max-height:320px;object-fit:cover">
    <h3>${p.name}</h3>
    <p class="rating">★ ${p.rating} (${p.reviews} reviews) • ${p.cat}</p>
    <p>${p.desc}</p>
    <p class="price">${tk(p.price)} <span class="old-price">${tk(p.old)}</span></p>
    <p><strong>Size:</strong></p>
    <div class="size-btns">${p.sizes.map((s, i) => `<button class="${i === 0 ? "active" : ""}" onclick="pickSize(this,'${s}')">${s}</button>`).join("")}</div>
    <button class="btn" style="width:100%" onclick="addToCart(${p.id}, selectedSize); closeQuick();">Add to Cart — ${tk(p.price)}</button>`;
  $("quick-modal").classList.add("open");
};
window.pickSize = function (btn, s) {
  selectedSize = s;
  btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};
window.closeQuick = function () { $("quick-modal").classList.remove("open"); };

function cartTotals() {
  const sub = cart.reduce((sum, c) => sum + PRODUCTS.find(p => p.id === c.id).price * c.qty, 0);
  const area = parseInt($("delivery-area").value, 10);
  const del = sub === 0 ? 0 : (sub >= 2000 ? 0 : area);
  return { sub, del, total: sub + del };
}
function renderCart() {
  const count = cart.reduce((n, c) => n + c.qty, 0);
  $("cart-count").textContent = count;
  $("cart-items").innerHTML = cart.length ? cart.map((c, i) => {
    const p = PRODUCTS.find(x => x.id === c.id);
    return `<div class="cart-item">
      <img class="cart-thumb" src="${p.img}" alt="${p.name}">
      <div style="flex:1">
        <strong>${p.name}</strong><br><span class="muted">Size: ${c.size} • ${tk(p.price)} each</span>
        <div class="qty">
          <button onclick="changeQty(${i},-1)">−</button><span>${c.qty}</span><button onclick="changeQty(${i},1)">+</button>
          <button class="btn small outline" onclick="removeLine(${i})" style="margin-left:8px">Remove</button>
        </div>
      </div>
      <strong>${tk(p.price * c.qty)}</strong>
    </div>`;
  }).join("") : `<div class="empty">Your cart is empty. Add something you like!</div>`;
  const t = cartTotals();
  $("cart-subtotal").textContent = tk(t.sub);
  $("cart-total").textContent = tk(t.total);
  $("delivery-note").textContent = t.sub >= 2000 ? "🎉 Free delivery — order over ৳2,000!" : (t.sub ? `Add ${tk(2000 - t.sub)} more for free delivery.` : "");
  $("co-total").textContent = tk(t.total);
}
window.changeQty = function (i, d) {
  const p = PRODUCTS.find(x => x.id === cart[i].id);
  cart[i].qty = Math.max(1, Math.min(p.stock, cart[i].qty + d));
  save("jf_cart", cart); renderCart();
};
window.removeLine = function (i) { cart.splice(i, 1); save("jf_cart", cart); renderCart(); };

function openCart() { $("cart-drawer").classList.add("open"); $("drawer-backdrop").classList.add("show"); }
function closeCart() { $("cart-drawer").classList.remove("open"); $("drawer-backdrop").classList.remove("show"); }

function renderOrders() {
  const orders = load("jf_orders", []);
  $("order-list").innerHTML = orders.length ? orders.map(o => `<div class="card">
    <h3>Order ${o.id}</h3>
    <p>${o.date} • ${o.name} • ${o.payment}</p>
    <p>${o.items.map(i => `${i.name} (${i.size}) × ${i.qty}`).join(", ")}</p>
    <p><strong>Total: ${tk(o.total)}</strong> • Status: ${o.status}</p>
  </div>`).join("") : `<div class="empty">No orders yet — your placed orders will show here.</div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!$("products")) return; // admin page has no shop — skip store init
  $("year").textContent = new Date().getFullYear();
  const fromApi = await apiFetch("/api/products");
  if (Array.isArray(fromApi) && fromApi.length) { PRODUCTS = fromApi; BACKEND_ON = true; }
  renderProducts(); renderCart(); renderOrders();
  ["search", "category", "sort"].forEach(id => $(id).addEventListener("input", renderProducts));
  document.querySelectorAll("[data-cat]").forEach(a => a.addEventListener("click", () => { $("category").value = a.dataset.cat; renderProducts(); }));
  $("cart-open").addEventListener("click", openCart);
  $("cart-close").addEventListener("click", closeCart);
  $("drawer-backdrop").addEventListener("click", closeCart);
  $("delivery-area").addEventListener("change", renderCart);
  $("quick-close").addEventListener("click", closeQuick);
  $("quick-modal").addEventListener("click", (e) => { if (e.target.id === "quick-modal") closeQuick(); });
  $("checkout-btn").addEventListener("click", () => {
    if (!cart.length) { alert("Your cart is empty."); return; }
    closeCart(); renderCart();
    $("checkout-form").style.display = "block"; $("order-success").style.display = "none";
    $("checkout-modal").classList.add("open");
  });
  $("checkout-cancel").addEventListener("click", () => $("checkout-modal").classList.remove("open"));
  $("order-done").addEventListener("click", () => $("checkout-modal").classList.remove("open"));
  $("checkout-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = cartTotals();
    const payload = {
      name: $("co-name").value, phone: $("co-phone").value, address: $("co-address").value,
      city: $("co-city").value, payment: $("co-payment").value,
      area: $("delivery-area").value === "120" ? "outside" : "dhaka",
      items: cart.map(c => ({ id: c.id, size: c.size, qty: c.qty })),
    };
    let id = "JF-" + Date.now().toString().slice(-6);
    let savedOrder = null;
    if (BACKEND_ON) {
      savedOrder = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      if (savedOrder && savedOrder.id) id = savedOrder.id;
      else { alert("Order could not be placed — please try again."); return; }
    }
    const orders = load("jf_orders", []);
    orders.unshift(savedOrder || {
      id, date: new Date().toLocaleDateString("en-GB"), name: payload.name,
      payment: payload.payment, total: t.total, status: "Confirmed — we will call you",
      items: cart.map(c => { const p = PRODUCTS.find(x => x.id === c.id); return { name: p.name, size: c.size, qty: c.qty }; })
    });
    save("jf_orders", orders);
    cart = []; save("jf_cart", cart); renderCart(); renderOrders();
    $("order-id").textContent = id;
    $("checkout-form").style.display = "none"; $("order-success").style.display = "block";
  });
});
