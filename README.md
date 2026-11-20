# 👗 Joy Fashion — Fashion & Clothing E-commerce Store

A complete, professional fashion e-commerce website for Dhaka, Bangladesh — product search, categories, sorting, wishlist, cart, delivery charges, demo checkout and order history. No backend needed; everything runs in the browser.

Built by **Joy Pramanik**, final-year CSE student at Southeast University, Dhaka, using HTML, CSS and JavaScript.

## Live preview

Open `index.html` in a browser, or enable GitHub Pages from this repository (Settings → Pages → Deploy from branch → main).

> **GitHub Pages is the demo version only** — it cannot run a server, so the store
> falls back to localStorage demo mode there. The **real business version is the
> backend** in `backend/` — run it locally (`cd backend && npm install && npm start`)
> or deploy it free on Render (see `backend/README.md`). That version saves orders
> on the server, calculates totals server-side, reduces stock automatically, and
> secures the admin login with a hashed password + JWT.

## What's inside

- `admin.html` + `admin.js` — Admin panel: login (default password `admin123`, change it in `admin.js`), dashboard stats, edit/delete products, add new products, view and update orders, export products/orders as JSON and orders as CSV for Excel
- `index.html` — Hero, shop, My Orders, About, cart drawer, checkout & quick-view modals
- `style.css` — Responsive styling, no framework needed
- `script.js` — 12 products, search / filter / sort, wishlist, cart, delivery, demo checkout, orders in localStorage (admin edits in `jf_admin_products` override the default products)
- `README.md` — This file

## Features

- 12 fashion products with real photos: handloom sarees, casual shirt, jeans, hoodie, party gown, formal blazer, t-shirts, kids raincoat and formal set, leather wallet
- Photos are real Unsplash photos (each one checked before adding). To use your own product photos, replace the image URL in the `PRODUCTS` list in `script.js` with your photo link
- Search, category filter (Men / Women / Kids / Accessories), sort by price and rating
- Quick view with size selection, wishlist (♥), Add to Cart
- Cart with quantity control, subtotal, delivery charge (Dhaka ৳60, Outside Dhaka ৳120, free over ৳2,000)
- Demo checkout: name, phone, address, city, Cash on Delivery / bKash / Nagad — order ID generated, saved under My Orders
- No real payment is taken in this demo

## How to run your own shop with it

1. Change the shop name in `index.html` (search for “Joy Fashion”).
2. Edit products in `script.js` — change the `PRODUCTS` list: name, category, emoji, price, old price, rating, stock, sizes and description.
3. Change the contact email and delivery charges in `index.html` / `script.js` if needed.
4. Push to GitHub and enable GitHub Pages to get a live link to share with customers.

## Contact

- Email: joypk827@gmail.com
- LinkedIn: https://www.linkedin.com/in/joy-pramanik-13b6633a1
- GitHub: https://github.com/joypramanik02
- Portfolio: https://joypramanik02.github.io/portfolio-website-/
