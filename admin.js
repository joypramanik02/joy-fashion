// Joy Fashion — Admin Panel (demo, static site)
// Default password: admin123 — change it here, then push the file again.
const ADMIN_PASSWORD = "admin123";
// (load, save and tk come from script.js, loaded just before this file)

function products() { return load("jf_admin_products", null) || PRODUCTS; }
function orders() { return load("jf_orders", []); }

function renderStats() {
  const ps = products(), os = orders();
  document.getElementById("stat-products").textContent = ps.length;
  document.getElementById("stat-orders").textContent = os.length;
  document.getElementById("stat-revenue").textContent = tk(os.reduce((s, o) => s + (o.total || 0), 0));
  document.getElementById("stat-low").textContent = ps.filter(p => p.stock <= 5).length;
}

function renderProducts() {
  const tbody = document.getElementById("product-rows");
  tbody.innerHTML = products().map(p => `<tr data-id="${p.id}">
    <td><img src="${p.img}" alt="" onerror="this.style.display='none'"></td>
    <td><input data-f="name" value="${p.name.replace(/"/g, "&quot;")}"></td>
    <td><select data-f="cat">${["Men", "Women", "Kids", "Accessories"].map(c => `<option ${c === p.cat ? "selected" : ""}>${c}</option>`).join("")}</select></td>
    <td><input data-f="price" type="number" value="${p.price}"></td>
    <td><input data-f="old" type="number" value="${p.old}"></td>
    <td><input data-f="stock" type="number" value="${p.stock}"></td>
    <td><button class="btn small danger" onclick="deleteProduct(${p.id})">Delete</button></td>
  </tr>`).join("");
}

window.deleteProduct = function (id) {
  if (!confirm("Delete this product from the store?")) return;
  save("jf_admin_products", products().filter(p => p.id !== id));
  renderProducts(); renderStats();
};

function renderOrders() {
  const tbody = document.getElementById("order-rows");
  const os = orders();
  tbody.innerHTML = os.length ? os.map((o, i) => `<tr>
    <td><strong>${o.id}</strong></td><td>${o.date}</td><td>${o.name}</td>
    <td>${(o.items || []).map(it => `${it.name} (${it.size}) × ${it.qty}`).join(", ")}</td>
    <td>${o.payment}</td><td><strong>${tk(o.total)}</strong></td>
    <td><select data-order="${i}">${["Confirmed — we will call you", "Packed", "Out for delivery", "Delivered", "Cancelled"].map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    <td><button class="btn small" onclick="saveOrderStatus(${i}, this)">Save</button></td>
  </tr>`).join("") : `<tr><td colspan="8">No orders yet — when a customer checks out on the store, their order appears here.</td></tr>`;
}

window.saveOrderStatus = function (i, btn) {
  const os = orders();
  const sel = btn.closest("tr").querySelector("select");
  os[i].status = sel.value; save("jf_orders", os);
  btn.textContent = "Saved ✓"; setTimeout(() => btn.textContent = "Save", 1200);
};

function download(filename, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  const loggedIn = sessionStorage.getItem("jf_admin") === "1";
  const showAdmin = () => {
    document.getElementById("login-view").style.display = "none";
    document.getElementById("admin-view").style.display = "block";
    document.getElementById("logout-btn").style.display = "inline-block";
    renderStats(); renderProducts(); renderOrders();
  };
  if (loggedIn) showAdmin();

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (document.getElementById("admin-pass").value === ADMIN_PASSWORD) {
      sessionStorage.setItem("jf_admin", "1"); showAdmin();
    } else {
      document.getElementById("login-error").style.display = "block";
    }
  });
  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem("jf_admin"); location.reload();
  });

  // Tabs
  document.querySelectorAll(".tab-btns button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".tab-btns button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    ["products", "orders", "add", "data"].forEach(t => {
      document.getElementById("tab-" + t).style.display = t === b.dataset.tab ? "block" : "none";
    });
  }));

  // Save products
  document.getElementById("save-products").addEventListener("click", () => {
    const ps = products();
    document.querySelectorAll("#product-rows tr").forEach(row => {
      const p = ps.find(x => x.id === Number(row.dataset.id)); if (!p) return;
      p.name = row.querySelector('[data-f="name"]').value.trim() || p.name;
      p.cat = row.querySelector('[data-f="cat"]').value;
      p.price = Number(row.querySelector('[data-f="price"]').value) || p.price;
      p.old = Number(row.querySelector('[data-f="old"]').value) || p.old;
      p.stock = Number(row.querySelector('[data-f="stock"]').value) || 0;
    });
    save("jf_admin_products", ps);
    renderStats();
    alert("Saved! Open the store — the changes are live there now.");
  });
  document.getElementById("reset-products").addEventListener("click", () => {
    if (!confirm("Reset all products to the original 12? Your edits will be lost.")) return;
    localStorage.removeItem("jf_admin_products");
    renderProducts(); renderStats();
  });

  // Add product
  document.getElementById("add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const ps = products();
    const id = Math.max(0, ...ps.map(p => p.id)) + 1;
    ps.push({
      id,
      name: document.getElementById("np-name").value.trim(),
      cat: document.getElementById("np-cat").value,
      img: document.getElementById("np-img").value.trim(),
      price: Number(document.getElementById("np-price").value),
      old: Number(document.getElementById("np-old").value) || Number(document.getElementById("np-price").value),
      rating: Number(document.getElementById("np-rating").value) || 4.5,
      reviews: 0, stock: Number(document.getElementById("np-stock").value),
      sizes: document.getElementById("np-sizes").value.split(",").map(s => s.trim()).filter(Boolean),
      desc: document.getElementById("np-desc").value.trim() || "New arrival at Joy Fashion."
    });
    save("jf_admin_products", ps);
    e.target.reset();
    renderProducts(); renderStats();
    alert("Product added! It now shows on the store.");
  });

  // Export
  document.getElementById("export-products").addEventListener("click", () =>
    download("joy-fashion-products.json", JSON.stringify(products(), null, 2), "application/json"));
  document.getElementById("export-orders").addEventListener("click", () =>
    download("joy-fashion-orders.json", JSON.stringify(orders(), null, 2), "application/json"));
  document.getElementById("export-orders-csv").addEventListener("click", () => {
    const os = orders();
    const rows = [["Order ID", "Date", "Customer", "Items", "Payment", "Total", "Status"]];
    os.forEach(o => rows.push([o.id, o.date, o.name, (o.items || []).map(i => `${i.name} (${i.size}) x${i.qty}`).join("; "), o.payment, o.total, o.status]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    download("joy-fashion-orders.csv", csv, "text/csv");
  });
});
