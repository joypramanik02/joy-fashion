// Joy Fashion — demo store. Edit PRODUCTS below to change products, prices or stock.
// Prices in BDT. No real payment is taken — checkout is a demo order saved in localStorage.
const PRODUCTS = [
  { id: 1, name: "Premium Cotton Panjabi — Navy", cat: "Men", emoji: "👔", price: 1450, old: 1890, rating: 4.8, reviews: 42, stock: 12, sizes: ["M", "L", "XL", "XXL"], desc: "Soft premium cotton panjabi, perfect for Eid and family events." },
  { id: 2, name: "Classic White Panjabi", cat: "Men", emoji: "🤍", price: 1250, old: 1550, rating: 4.7, reviews: 31, stock: 9, sizes: ["M", "L", "XL"], desc: "Clean white panjabi with subtle embroidery on the collar." },
  { id: 3, name: "Men's Casual Shirt — Sky Blue", cat: "Men", emoji: "👕", price: 950, old: 1250, rating: 4.6, reviews: 28, stock: 15, sizes: ["M", "L", "XL"], desc: "Breathable casual shirt for everyday wear in Dhaka weather." },
  { id: 4, name: "Slim Fit Jeans — Dark Blue", cat: "Men", emoji: "👖", price: 1350, old: 1750, rating: 4.7, reviews: 36, stock: 11, sizes: ["30", "32", "34", "36"], desc: "Stretchable slim-fit jeans, comfortable all day." },
  { id: 5, name: "Men's Hoodie — Black", cat: "Men", emoji: "🧥", price: 1150, old: 1500, rating: 4.8, reviews: 54, stock: 8, sizes: ["M", "L", "XL"], desc: "Warm fleece hoodie with kangaroo pocket." },
  { id: 6, name: "Handloom Saree — Red & Gold", cat: "Women", emoji: "🥻", price: 2450, old: 3200, rating: 4.9, reviews: 47, stock: 6, sizes: ["Free Size"], desc: "Beautiful handloom saree for weddings and festivals." },
  { id: 7, name: "Printed Kurti — Floral", cat: "Women", emoji: "👗", price: 1050, old: 1400, rating: 4.6, reviews: 39, stock: 14, sizes: ["S", "M", "L", "XL"], desc: "Light floral kurti, comfortable for daily wear." },
  { id: 8, name: "Salwar Kameez Set — Teal", cat: "Women", emoji: "👚", price: 1650, old: 2100, rating: 4.7, reviews: 33, stock: 10, stockNote: "", sizes: ["S", "M", "L"], desc: "Three-piece salwar kameez set with dupatta." },
  { id: 9, name: "Women's T-Shirt — Pink", cat: "Women", emoji: "🎀", price: 650, old: 850, rating: 4.5, reviews: 61, stock: 20, sizes: ["S", "M", "L"], desc: "Soft cotton t-shirt, regular fit." },
  { id: 10, name: "Kids T-Shirt Set (2 pcs)", cat: "Kids", emoji: "🧒", price: 750, old: 990, rating: 4.8, reviews: 22, stock: 16, sizes: ["4-5Y", "6-7Y", "8-9Y"], desc: "Colourful, soft cotton t-shirts for kids." },
  { id: 11, name: "Kids Frock — Yellow", cat: "Kids", emoji: "👧", price: 950, old: 1250, rating: 4.7, reviews: 18, stock: 7, sizes: ["4-5Y", "6-7Y"], desc: "Pretty yellow frock for little ones." },
  { id: 12, name: "Leather Wallet + Belt Combo", cat: "Accessories", emoji: "👜", price: 850, old: 1150, rating: 4.6, reviews: 29, stock: 13, sizes: ["Free Size"], desc: "Genuine-style leather wallet and belt combo gift set." },
];

const $ = (id) => document.getElementById(id);
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
      <div class="thumb" onclick="openQuick(${p.id})">${p.emoji}</div>
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
    : `<div class="empty">No products match your search. Try “panjabi”, “saree” or “hoodie”.</div>`;
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
    <div style="font-size:64px;text-align:center">${p.emoji}</div>
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
      <div class="thumb">${p.emoji}</div>
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

document.addEventListener("DOMContentLoaded", () => {
  $("year").textContent = new Date().getFullYear();
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
  $("checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = cartTotals();
    const id = "JF-" + Date.now().toString().slice(-6);
    const orders = load("jf_orders", []);
    orders.unshift({
      id, date: new Date().toLocaleDateString("en-GB"), name: $("co-name").value,
      payment: $("co-payment").value, total: t.total, status: "Confirmed — we will call you",
      items: cart.map(c => { const p = PRODUCTS.find(x => x.id === c.id); return { name: p.name, size: c.size, qty: c.qty }; })
    });
    save("jf_orders", orders);
    cart = []; save("jf_cart", cart); renderCart(); renderOrders();
    $("order-id").textContent = id;
    $("checkout-form").style.display = "none"; $("order-success").style.display = "block";
  });
});
