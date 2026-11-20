// Joy Fashion — Admin Panel
// Works in two modes:
//  1) BACKEND mode — when the store is served by the Node backend, login goes to
//     POST /api/admin/login (username "admin", password from backend .env, default
//     admin123). Products/orders live in the server database (backend/data/db.json)
//     and are visible from any device.
//  2) DEMO mode — on GitHub Pages there is no backend, so it falls back to the
//     old demo login (password admin123, change ADMIN_PASSWORD below) and data
//     saved in this browser's localStorage.
// (load, save and tk come from script.js, loaded just before this file)
const ADMIN_PASSWORD = "admin123"; // demo-mode password only
let API_MODE = false;
let token = sessionStorage.getItem("jf_token") || "";
let localProducts = null; // demo-mode product list

function authHeaders() { return token ? { Authorization: "Bearer " + token } : {}; }
async function api(path, opts) {
  try {
    const r = await fetch(path, { ...(opts || {}), headers: { "Content-Type": "application/json", ...authHeaders(), ...((opts && opts.headers) || {}) } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
async function apiRaw(path, opts) {
  const r = await fetch(path, { ...(opts || {}), headers: { "Content-Type": "application/json", ...authHeaders(), ...((opts && opts.headers) || {}) } });
  return r;
}

async function getProducts() {
  if (API_MODE) return (await api("/api/products")) || [];
  return localProducts || load("jf_admin_products", null) || PRODUCTS;
}
async function getOrders() {
  if (API_MODE) return (await api("/api/admin/orders")) || [];
  return load("jf_orders", []);
}
async function getStats() {
  if (API_MODE) return await api("/api/admin/stats");
  const ps = await getProducts(), os = await getOrders();
  return { totalProducts: ps.length, totalOrders: os.length, totalRevenue: os.reduce((s, o) => s + (o.total || 0), 0), lowStock: ps.filter(p => p.stock <= 5).length };
}

async function renderStats() {
  const st = await getStats(); if (!st) return;
  document.getElementById("stat-products").textContent = st.totalProducts;
  document.getElementById("stat-orders").textContent = st.totalOrders;
  document.getElementById("stat-revenue").textContent = tk(st.totalRevenue);
  document.getElementById("stat-low").textContent = st.lowStock;
}

async function renderProducts() {
  const ps = await getProducts();
  document.getElementById("product-rows").innerHTML = ps.map(p => `<tr data-id="${p.id}">
    <td><img src="${p.img}" alt="" onerror="this.style.display='none'"></td>
    <td><input data-f="name" value="${String(p.name).replace(/"/g, "&quot;")}"></td>
    <td><select data-f="cat">${["Men", "Women", "Kids", "Accessories"].map(c => `<option ${c === p.cat ? "selected" : ""}>${c}</option>`).join("")}</select></td>
    <td><input data-f="price" type="number" value="${p.price}"></td>
    <td><input data-f="old" type="number" value="${p.old}"></td>
    <td><input data-f="stock" type="number" value="${p.stock}"></td>
    <td><button class="btn small danger" onclick="deleteProduct(${p.id})">Delete</button></td>
  </tr>`).join("");
}

window.deleteProduct = async function (id) {
  if (!confirm("Delete this product from the store?")) return;
  if (API_MODE) { await apiRaw("/api/admin/products/" + id, { method: "DELETE" }); }
  else { const ps = await getProducts(); save("jf_admin_products", ps.filter(p => p.id !== id)); localProducts = null; }
  renderProducts(); renderStats();
};

async function renderOrders() {
  const os = await getOrders();
  document.getElementById("order-rows").innerHTML = os.length ? os.map((o, i) => `<tr>
    <td><strong>${o.id}</strong></td><td>${o.date}</td><td>${o.name}</td>
    <td>${(o.items || []).map(it => `${it.name} (${it.size}) × ${it.qty}`).join(", ")}</td>
    <td>${o.payment}</td><td><strong>${tk(o.total)}</strong></td>
    <td><select data-order="${i}">${["Confirmed — we will call you", "Packed", "Out for delivery", "Delivered", "Cancelled"].map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    <td><button class="btn small" onclick="saveOrderStatus('${o.id}', ${i}, this)">Save</button></td>
  </tr>`).join("") : `<tr><td colspan="8">No orders yet — when a customer checks out on the store, their order appears here.</td></tr>`;
}

window.saveOrderStatus = async function (orderId, i, btn) {
  const sel = btn.closest("tr").querySelector("select");
  if (API_MODE) { await apiRaw("/api/admin/orders/" + encodeURIComponent(orderId) + "/status", { method: "PATCH", body: JSON.stringify({ status: sel.value }) }); }
  else { const os = await getOrders(); os[i].status = sel.value; save("jf_orders", os); }
  btn.textContent = "Saved ✓"; setTimeout(() => btn.textContent = "Save", 1200);
};

function download(filename, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  // Is there a backend? (On GitHub Pages this 404s and we stay in demo mode.)
  const health = await api("/api/health");
  if (health && health.ok) {
    API_MODE = true;
    if (token) { const st = await api("/api/admin/stats"); if (st) showAdmin(); }
  } else if (sessionStorage.getItem("jf_admin") === "1") {
    showAdmin();
  }

  function showAdmin() {
    document.getElementById("login-view").style.display = "none";
    document.getElementById("admin-view").style.display = "block";
    document.getElementById("logout-btn").style.display = "inline-block";
    document.getElementById("login-hint").textContent = API_MODE
      ? "Connected to the backend server — changes are saved on the server and visible from any device."
      : "Demo mode (no backend on this host) — changes save in this browser only.";
    renderStats(); renderProducts(); renderOrders();
  }

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pass = document.getElementById("admin-pass").value;
    document.getElementById("login-error").style.display = "none";
    if (API_MODE) {
      const res = await apiRaw("/api/admin/login", { method: "POST", body: JSON.stringify({ username: "admin", password: pass }) });
      if (res.ok) {
        const data = await res.json();
        token = data.token; sessionStorage.setItem("jf_token", token);
        showAdmin(); return;
      }
      document.getElementById("login-error").style.display = "block"; return;
    }
    if (pass === ADMIN_PASSWORD) { sessionStorage.setItem("jf_admin", "1"); showAdmin(); }
    else document.getElementById("login-error").style.display = "block";
  });
  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem("jf_admin"); sessionStorage.removeItem("jf_token"); location.reload();
  });

  document.querySelectorAll(".tab-btns button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".tab-btns button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    ["products", "orders", "add", "data"].forEach(t => {
      document.getElementById("tab-" + t).style.display = t === b.dataset.tab ? "block" : "none";
    });
  }));

  document.getElementById("save-products").addEventListener("click", async () => {
    const rows = [...document.querySelectorAll("#product-rows tr")];
    if (API_MODE) {
      for (const row of rows) {
        const id = Number(row.dataset.id);
        await apiRaw("/api/admin/products/" + id, { method: "PUT", body: JSON.stringify({
          name: row.querySelector('[data-f="name"]').value.trim(),
          cat: row.querySelector('[data-f="cat"]').value,
          price: Number(row.querySelector('[data-f="price"]').value),
          old: Number(row.querySelector('[data-f="old"]').value),
          stock: Number(row.querySelector('[data-f="stock"]').value),
        }) });
      }
    } else {
      const ps = await getProducts();
      rows.forEach(row => {
        const p = ps.find(x => x.id === Number(row.dataset.id)); if (!p) return;
        p.name = row.querySelector('[data-f="name"]').value.trim() || p.name;
        p.cat = row.querySelector('[data-f="cat"]').value;
        p.price = Number(row.querySelector('[data-f="price"]').value) || p.price;
        p.old = Number(row.querySelector('[data-f="old"]').value) || p.old;
        p.stock = Number(row.querySelector('[data-f="stock"]').value) || 0;
      });
      save("jf_admin_products", ps); localProducts = null;
    }
    renderStats();
    alert("Saved! The store now shows the updated products.");
  });
  document.getElementById("reset-products").addEventListener("click", async () => {
    if (API_MODE) { alert("In backend mode there is no reset — delete products one by one, or restore backend/data/db.json from backup."); return; }
    if (!confirm("Reset all products to the original 12? Your edits will be lost.")) return;
    localStorage.removeItem("jf_admin_products"); localProducts = null;
    renderProducts(); renderStats();
  });

  document.getElementById("add-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      name: document.getElementById("np-name").value.trim(),
      cat: document.getElementById("np-cat").value,
      img: document.getElementById("np-img").value.trim(),
      price: Number(document.getElementById("np-price").value),
      old: Number(document.getElementById("np-old").value) || Number(document.getElementById("np-price").value),
      stock: Number(document.getElementById("np-stock").value),
      rating: Number(document.getElementById("np-rating").value) || 4.5,
      sizes: document.getElementById("np-sizes").value.split(",").map(s => s.trim()).filter(Boolean),
      desc: document.getElementById("np-desc").value.trim() || "New arrival at Joy Fashion.",
    };
    if (API_MODE) {
      const res = await apiRaw("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) { alert("Could not add the product — check the fields and try again."); return; }
    } else {
      const ps = await getProducts();
      ps.push({ ...body, id: Math.max(0, ...ps.map(p => p.id)) + 1, reviews: 0 });
      save("jf_admin_products", ps); localProducts = null;
    }
    e.target.reset();
    renderProducts(); renderStats();
    alert("Product added! It now shows on the store.");
  });

  document.getElementById("export-products").addEventListener("click", async () =>
    download("joy-fashion-products.json", JSON.stringify(await getProducts(), null, 2), "application/json"));
  document.getElementById("export-orders").addEventListener("click", async () =>
    download("joy-fashion-orders.json", JSON.stringify(await getOrders(), null, 2), "application/json"));
  document.getElementById("export-orders-csv").addEventListener("click", async () => {
    const os = await getOrders();
    const rows = [["Order ID", "Date", "Customer", "Phone", "Items", "Payment", "Total", "Status"]];
    os.forEach(o => rows.push([o.id, o.date, o.name, o.phone || "", (o.items || []).map(i => `${i.name} (${i.size}) x${i.qty}`).join("; "), o.payment, o.total, o.status]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    download("joy-fashion-orders.csv", csv, "text/csv");
  });
});
