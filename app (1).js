/* ============================================================
   Little Bot Creations — app.js
   SETUP NOTES
   - PayPal: index.html loads the SDK with client-id=test, PayPal's
     public sandbox demo key. Replace it with your own Client ID
     from developer.paypal.com/dashboard (Live for real payments,
     Sandbox for testing) before this goes live.
   - Images: every product now takes a LIST of images. The first
     one is the picture shown on the card; the rest show up as
     thumbnails in the product pop-up. To add more photos to a
     product, just add more file names to its `images: [...]` list:
         images: ["Macaron.JPG", "Macaron-back.JPG", "Macaron-pink.JPG"]
     Keep the files in the /images folder next to this file.
   - Color pricing: basic colors cost the normal price. Specialty
     and dual/triple colors add $1 (see COLOR_GROUPS below — change
     `surcharge` to change the amount).
   - Custom orders skip the cart entirely and go straight to the
     Google Form, since price and details vary per request.
   ============================================================ */

const ORDER_FORM_URL = "https://forms.gle/sfZcHqLcecstn6UR6";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "bestsellers", label: "⭐ Best Sellers" },
  { id: "fidgets", label: "🧸 Fidgets & Toys" },
  { id: "desk", label: "✏️ Desk & School" },
  { id: "jewelry", label: "💎 Jewelry & Accessories" },
  { id: "keychains", label: "🔑 Keychains" },
  { id: "gifts", label: "🎁 Gifts" },
  { id: "custom", label: "✨ Custom Creations" },
];

/* ============================================================
   Colors — grouped, with a price surcharge per group.
   `hexes` can hold 1, 2 or 3 colors. Two or three make a striped
   swatch so dual/triple colors look like what they are.
   ============================================================ */
const COLOR_GROUPS = [
  {
    id: "basic",
    label: "Basic colors",
    surcharge: 0,
    colors: [
      { name: "Red",        hexes: ["#E63946"] },
      { name: "Light Blue", hexes: ["#7EC8E3"] },
      { name: "Dark Blue",  hexes: ["#1F3A93"] },
      { name: "Green",      hexes: ["#3FA34D"] },
      { name: "Yellow",     hexes: ["#FFC145"] },
      { name: "Orange",     hexes: ["#FF8C42"] },
      { name: "Pink",       hexes: ["#FF6F91"] },
      { name: "Purple",     hexes: ["#9B5DE5"] },
      { name: "Magenta",    hexes: ["#E3008C"] },
      { name: "Black",      hexes: ["#232323"] },
      { name: "White",      hexes: ["#FFFFFF"] },
      { name: "Brown",      hexes: ["#7B4B26"] },
      { name: "Beige",      hexes: ["#E3D5B8"] },
      { name: "Gray",       hexes: ["#9AA0A6"] },
    ],
  },
  {
    id: "specialty",
    label: "Specialty colors",
    surcharge: 1,
    colors: [
      { name: "Gold",        hexes: ["#D4AF37"], shimmer: true },
      { name: "Silk Blue",   hexes: ["#5BA8D8"], shimmer: true },
      { name: "Silk Yellow", hexes: ["#F5DE7A"], shimmer: true },
    ],
  },
  {
    id: "multi",
    label: "Dual & triple colors",
    surcharge: 1,
    colors: [
      { name: "Red/Yellow/Green", hexes: ["#E63946", "#FFC145", "#3FA34D"] },
      { name: "Red/Gold/Purple",  hexes: ["#E63946", "#D4AF37", "#9B5DE5"] },
      { name: "Green/Yellow",     hexes: ["#3FA34D", "#FFC145"] },
      { name: "Teal/Coral",       hexes: ["#2EC4B6", "#FF6B6B"] },
      { name: "Gold/Copper/Blue", hexes: ["#D4AF37", "#B87333", "#3457D5"] },
    ],
  },
];

// Flat lookup list: every color with its group info attached.
const COLORS = COLOR_GROUPS.flatMap(g =>
  g.colors.map(c => ({ ...c, group: g.id, groupLabel: g.label, surcharge: g.surcharge }))
);
const DEFAULT_COLOR = "White";

function colorInfo(name){ return COLORS.find(c => c.name === name) || COLORS[0]; }
function colorSurcharge(name){ return colorInfo(name).surcharge || 0; }
function swatchStyle(c){
  if (c.hexes.length === 1) return `background:${c.hexes[0]}`;
  if (c.hexes.length === 2)
    return `background:linear-gradient(135deg, ${c.hexes[0]} 0 50%, ${c.hexes[1]} 50% 100%)`;
  return `background:linear-gradient(135deg, ${c.hexes[0]} 0 33%, ${c.hexes[1]} 33% 66%, ${c.hexes[2]} 66% 100%)`;
}

/* ============================================================
   Name clicker pricing: $2 for 1 clicker, +$1 for each extra,
   up to 8. The name has one letter per clicker, so a 5-letter
   name is 5 clickers and costs $6.
   ============================================================ */
const CLICKER_BASE = 2.00;   // price for a 1-clicker name clicker
const CLICKER_STEP = 1.00;   // added for each extra clicker
const CLICKER_MIN = 1;
const CLICKER_MAX = 8;
function clickerPrice(n){ return CLICKER_BASE + (n - CLICKER_MIN) * CLICKER_STEP; }

/* ============================================================
   Products
   images: [...]     first image shows on the card, rest are thumbnails
   personalize: true customer types a name (max nameMax letters)
   nameClicker: true name clicker — 1–8 clickers, one letter each
   ============================================================ */
const PRODUCTS = [
  { id: "crayon-lipbalm-holder", name: "Crayon Lip Balm Holder", price: 7.00, category: "gifts", images: ["02dd53f5-76bd-4a1d-82bc-26e3c6dc790e.JPG"] },
  { id: "macaron-clicker", name: "Macaron Clicker", price: 5.00, category: "fidgets", images: ["Macaron.JPG"], best: true },
  { id: "name-clicker", name: "Name Clicker", price: CLICKER_BASE, priceFrom: true, category: "fidgets", images: ["nameclicker.jpeg"], personalize: true, nameClicker: true, isNew: true, note: "One clicker per letter" },
  { id: "icecream-lipbalm-holder", name: "Ice Cream Lip Balm Holder", price: 6.00, category: "gifts", images: ["icecream.JPG"] },
  { id: "expandable-sword", name: "Expandable Sword", price: 15.00, category: "fidgets", images: ["Sword.JPG"], best: true },
  { id: "minecraft-clickers", name: "Minecraft Clickers", price: 6.00, category: "fidgets", images: ["1629894a-6a3f-4a4f-8609-26e7d115ca1b.JPG"] },
  { id: "dumpling-clickers", name: "Dumpling Clickers", price: 5.00, category: "fidgets", images: ["DUmpling.JPG"] },
  { id: "pancake-clickers", name: "Pancake Clickers", price: 5.00, category: "fidgets", images: ["Panckakeclicker.JPG"] },
  { id: "cookie-oreo-clickers", name: "Cookies & Oreo Clickers", price: 5.00, category: "fidgets", images: ["051bfb81-ea6b-4c7f-a8e5-2b9d0bf1d23f.JPG"], best: true },
  { id: "fake-iphone", name: "Fake iPhone", price: 7.00, category: "gifts", images: ["Iphone.jpeg"] },
  { id: "keychain-1", name: "$1 Keychains / Bag Charms", price: 1.00, category: "keychains", images: ["1dollar.jpeg"] },
  { id: "keychain-2", name: "$2 Keychains / Bag Charms", price: 2.00, category: "keychains", images: ["Keychains2.jpeg"], best: true },
  { id: "keychain-3-custom", name: "$3 Name Keychains", price: 3.00, category: "keychains", images: ["3doller.jpeg"], personalize: true, nameMax: 10 },
  { id: "vanity-organizer", name: "Vanity Organizer", price: 10.00, category: "jewelry", images: ["IMG_5659.jpeg"], size: "5.5\" wide" },
  { id: "spilling-drink", name: "Spilling Drink", price: 12.00, category: "gifts", images: ["Spilling.jpeg"], size: "8\" tall, 5\" plate" },
  { id: "long-dragon", name: "50\" Long Dragon", price: 17.00, category: "fidgets", images: ["dragon.jpeg"], best: true },
  { id: "nurse-pen-holder", name: "Nurse Pen Holder", price: 7.00, category: "desk", images: ["nurse1.jpeg"] },
  { id: "polo-pen-holder", name: "Polo T-Shirt Pen Holder", price: 7.00, category: "desk", images: ["Coller.jpeg"] },
  { id: "shoe-pencil-holder", name: "Shoe Pencil Holder", price: 7.00, category: "desk", images: ["IMG_5604.jpeg"], size: "6\" long, 3\" tall", personalize: true, nameMax: 10 },
  { id: "bookmark-holder", name: "Bookmark Holder", price: 5.00, category: "desk", images: ["BookmarkHolder.jpeg"], note: "Bookmark not included" },
  { id: "dna-pencil-holder", name: "DNA Pencil Holder", price: 8.50, category: "desk", images: ["DNA.jpeg"] },
  { id: "pi-pencil-holder", name: "Pi Pencil Holder", price: 7.00, category: "desk", images: ["Pi.jpeg"] },
  { id: "jewelry-stand", name: "Jewelry Stand", price: 7.00, category: "jewelry", images: ["Jelewry holdger.jpeg"] },
  { id: "world-map-pencil-holder", name: "World Map Pencil Holder", price: 6.50, category: "desk", images: ["World map.jpeg"] },
  { id: "zipper-bookmark", name: "Zipper Bookmark", price: 2.00, category: "desk", images: ["Bookmark.jpeg"] },
  { id: "dragon-fidget", name: "Dragon Fidget", price: 7.00, category: "fidgets", images: ["Dragon fidget toy.jpeg"], size: "15\" long" },
  { id: "puffer-jacket-holder", name: "Puffer Jacket Holder", price: 8.00, category: "desk", images: ["IMG_5344 2.JPG"], size: "3.25\" x 4.5\"" },
  { id: "dress-utility-holder", name: "Dress Utility Holder", price: 7.00, category: "desk", images: ["IMG_5364.jpeg"], size: "4\" x 4.5\"" },
  { id: "tissue-box", name: "Tissue Box Cover", price: 6.00, category: "desk", images: ["IMG_5347.jpg"] },
  { id: "vanity-tray", name: "Vanity Tray", price: 6.00, category: "jewelry", images: ["IMG_5343 2.JPG"] },
  { id: "heart-pencil-holder", name: "Heart Pencil Holder", price: 6.00, category: "desk", images: ["IMG_5144.JPG"] },
  { id: "jewelry-stand-no-tray", name: "Jewelry Stand (No Tray)", price: 8.00, category: "jewelry", images: ["jewellery-stand.jpeg"], size: "7\" tall" },
  { id: "jewelry-stand-with-tray", name: "Jewelry Stand (With Tray)", price: 10.00, category: "jewelry", images: ["IMG_5136.JPG"], size: "7\" tall, 5.5\" base", best: true },
  { id: "qtip-travel-case", name: "Q-tip Travel Case", price: 3.00, category: "desk", images: ["IMG_5345.JPG"] },
  { id: "airpod-case", name: "AirPod Case", price: 4.00, category: "jewelry", images: ["IMG_5150 2.JPG"] },
  { id: "toad-pencil-holder", name: "Toad Pencil Holder", price: 6.50, category: "desk", images: ["toad-pencil-holder.jpeg"], size: "3.5\" x 3\"", isNew: true },
  { id: "heel-makeup-holder", name: "Heel Makeup Holder", price: 7.00, category: "jewelry", images: ["shoe-makeup-holder.jpeg"], size: "5.5\" x 5.25\"", isNew: true },
  { id: "female-doctor-coat-holder", name: "Female Doctor Coat Pencil Holder", price: 7.00, category: "desk", images: ["doctor-coat-pencil-holder.jpeg"], size: "4\" x 4\"", isNew: true },
  { id: "male-doctor-coat-holder", name: "Male Doctor Coat Utility Holder", price: 9.00, category: "desk", images: ["Malecoat.jpeg"], size: "4\" x 6\"", isNew: true },
  { id: "phone-case", name: "Phone Case", price: 3.50, category: "jewelry", images: ["IMG_5341 2.JPG"], isNew: true },
  { id: "fidget-toy", name: "Fidget Toy", price: 4.00, category: "fidgets", images: ["IMG_5146.JPG"], isNew: true },
  { id: "cute-dog", name: "Cute Dog", price: 4.00, category: "fidgets", images: ["CFDBDA3A-682A-4A75-915D-78069C838251.jpg"], isNew: true },
  { id: "travel-toothbrush-holder", name: "Travel Toothbrush Holder", price: 5.00, category: "jewelry", images: ["Toothbrush holder.jpeg"], size: "8\" tall, 1.5\" diameter", isNew: true },
  { id: "gift-card-holder", name: "Cute Gift Card Holder", price: 3.00, category: "gifts", images: ["IMG_5361.jpeg"], isNew: true },
  { id: "custom-order", name: "Custom Order", price: null, category: "custom", images: ["Customorder.jpeg"], note: "Prices vary based on request" },
];

function imgSrc(file){ return "images/" + encodeURIComponent(file).replace(/%2F/g, "/"); }
function money(n){ return "$" + n.toFixed(2); }
function byId(id){ return PRODUCTS.find(p => p.id === id); }
function productImages(p){ return (p.images && p.images.length) ? p.images : []; }
function mainImage(p){ return productImages(p)[0] || ""; }
function nameLimit(p){ return p.nameClicker ? CLICKER_MAX : (p.nameMax || 10); }
function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, ch => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

/* ============================================================
   Cart state (persisted in localStorage)
   A cart line: { productId, color, qty, note, personalName, clickers }
   ============================================================ */
const CART_KEY = "lbc_cart_v2";
let cart = loadCart();

function loadCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){ return []; }
}
function saveCart(){
  try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }catch(e){ /* ignore quota/privacy errors */ }
}

// Two lines only merge if product, color, name, clicker count and note all match.
function sameLine(a, b){
  return a.productId === b.productId
    && a.color === b.color
    && (a.personalName || "") === (b.personalName || "")
    && (a.clickers || 0) === (b.clickers || 0)
    && (a.note || "").trim() === (b.note || "").trim();
}

function addToCart(line){
  const existing = cart.find(l => sameLine(l, line));
  if (existing){ existing.qty += line.qty; }
  else { cart.push(line); }
  saveCart();
  renderCart();
}
function updateLineQty(index, delta){
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
}
function removeLine(index){
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

// One unit of a cart line: base price (or clicker price) + color surcharge.
function unitPrice(line){
  const p = byId(line.productId);
  if (!p || p.price === null) return 0;
  const base = p.nameClicker ? clickerPrice(line.clickers || CLICKER_MIN) : p.price;
  return base + colorSurcharge(line.color);
}
function linePrice(line){ return unitPrice(line) * line.qty; }
function cartTotal(){ return cart.reduce((sum, line) => sum + linePrice(line), 0); }
function cartCount(){ return cart.reduce((sum, line) => sum + line.qty, 0); }

// Short description of a line, reused in the cart, checkout and PayPal.
function lineOptions(line){
  const p = byId(line.productId);
  const bits = [line.color];
  if (colorSurcharge(line.color) > 0) bits.push("+" + money(colorSurcharge(line.color)));
  if (p && p.nameClicker) bits.push(`${line.clickers} clicker${line.clickers === 1 ? "" : "s"}`);
  if (line.personalName) bits.push(`Name: “${line.personalName}”`);
  return bits.join(" · ");
}

/* ============================================================
   Rendering: product cards
   ============================================================ */
function productCardHTML(p){
  const badges = [];
  if (p.best) badges.push('<span class="badge badge-best">★ Best seller</span>');
  if (p.isNew) badges.push('<span class="badge badge-new">New</span>');

  const priceLabel = p.price === null
    ? "Prices vary"
    : (p.priceFrom ? "From " + money(p.price) : money(p.price));

  const metaBits = [];
  if (p.size) metaBits.push("📏 " + p.size);
  if (p.personalize) metaBits.push("✏️ Add a name");
  if (p.note) metaBits.push(p.note);
  if (p.id !== "custom-order") metaBits.unshift("🎨 Any color");

  const shots = productImages(p).length;

  return `
  <article class="product-card" data-id="${p.id}">
    <span class="card-tape"></span>
    <div class="card-media">
      <img src="${imgSrc(mainImage(p))}" alt="${esc(p.name)}" loading="lazy">
      ${shots > 1 ? `<span class="photo-count">📷 ${shots}</span>` : ""}
      ${badges.length ? `<div class="card-badges">${badges.join("")}</div>` : ""}
    </div>
    <div class="card-body">
      <h3>${esc(p.name)}</h3>
      ${metaBits.length ? `<p class="card-meta">${metaBits.map(esc).join(" &nbsp;·&nbsp; ")}</p>` : ""}
      <p class="card-price">${priceLabel}</p>
      <button class="card-cta" data-open="${p.id}">${p.id === "custom-order" ? "Request this →" : "Customize & order →"}</button>
    </div>
  </article>`;
}

function renderCategoryPills(){
  const wrap = document.getElementById("categoryPills");
  wrap.innerHTML = CATEGORIES.map((c, i) =>
    `<button class="pill${i === 0 ? " active" : ""}" data-cat="${c.id}" role="tab" aria-selected="${i === 0}">${c.label}</button>`
  ).join("");
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    wrap.querySelectorAll(".pill").forEach(p => { p.classList.remove("active"); p.setAttribute("aria-selected", "false"); });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    state.category = btn.dataset.cat;
    renderGrid();
  });
}

const state = { category: "all", query: "" };

function renderGrid(){
  const grid = document.getElementById("productGrid");
  const noResults = document.getElementById("noResults");
  const q = state.query.trim().toLowerCase();

  const filtered = PRODUCTS.filter(p => {
    const matchesCategory =
      state.category === "all" ||
      (state.category === "bestsellers" ? p.best : p.category === state.category);
    const matchesQuery = !q || p.name.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  grid.innerHTML = filtered.map(productCardHTML).join("");
  noResults.hidden = filtered.length !== 0;
}

function renderScrollRow(containerId, products){
  document.getElementById(containerId).innerHTML = products.map(productCardHTML).join("");
}

/* ============================================================
   Product modal — photos, color, name, clickers, note, quantity
   ============================================================ */
const productModal = document.getElementById("productModal");
let activeProduct = null;
let activeColor = DEFAULT_COLOR;
let activeQty = 1;
let activeImageIndex = 0;
let activeName = "";
let activeClickers = CLICKER_MIN;
let activeNote = "";

function openProductModal(id){
  const p = byId(id);
  if (!p) return;

  if (p.id === "custom-order"){
    window.open(ORDER_FORM_URL, "_blank", "noopener");
    return;
  }

  activeProduct = p;
  activeColor = DEFAULT_COLOR;
  activeQty = 1;
  activeImageIndex = 0;
  activeName = "";
  activeClickers = CLICKER_MIN;
  activeNote = "";

  document.getElementById("modalCategory").textContent =
    CATEGORIES.find(c => c.id === p.category)?.label.replace(/^\p{Emoji}\s*/u, "") || "";
  document.getElementById("modalName").textContent = p.name;

  const sizeEl = document.getElementById("modalSize");
  if (p.size){ sizeEl.hidden = false; sizeEl.textContent = "📏 " + p.size; }
  else { sizeEl.hidden = true; }

  renderGallery();
  renderColorSwatches();
  renderPersonalize();
  document.getElementById("itemNote").value = "";
  document.getElementById("qtyValue").textContent = activeQty;
  updateModalPrice();
  setPreviewTint();

  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
}

function closeProductModal(){
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  activeProduct = null;
}

/* ---------- photos ---------- */
function renderGallery(){
  const p = activeProduct;
  const shots = productImages(p);
  const main = document.getElementById("modalImage");
  main.src = imgSrc(shots[activeImageIndex] || "");
  main.alt = p.name;

  const thumbs = document.getElementById("modalThumbs");
  if (shots.length < 2){
    thumbs.innerHTML = "";
    thumbs.hidden = true;
    return;
  }
  thumbs.hidden = false;
  thumbs.innerHTML = shots.map((file, i) => `
    <button class="thumb${i === activeImageIndex ? " selected" : ""}" data-thumb="${i}" aria-label="Photo ${i + 1} of ${shots.length}">
      <img src="${imgSrc(file)}" alt="" loading="lazy">
    </button>`).join("");
}

/* ---------- colors ---------- */
function renderColorSwatches(){
  const wrap = document.getElementById("colorSwatches");
  wrap.innerHTML = COLOR_GROUPS.map(g => `
    <div class="color-group">
      <p class="color-group-label">${g.label}${g.surcharge ? ` <span class="surcharge-tag">+${money(g.surcharge)}</span>` : ""}</p>
      <div class="swatch-row">
        ${g.colors.map(c => `
          <button class="swatch${c.name === activeColor ? " selected" : ""}${c.shimmer ? " shimmer" : ""}"
                  style="${swatchStyle(c)}" data-color="${esc(c.name)}"
                  aria-label="${esc(c.name)}${g.surcharge ? ", plus one dollar" : ""}" title="${esc(c.name)}"></button>`).join("")}
      </div>
    </div>`).join("");

  const sur = colorSurcharge(activeColor);
  document.getElementById("selectedColorName").textContent =
    activeColor + (sur ? ` (+${money(sur)})` : "");
}

function setPreviewTint(){
  const c = colorInfo(activeColor);
  const preview = document.getElementById("modalPreview");
  preview.style.background = c ? c.hexes[0] + "26" : "";
}

/* ---------- name / clickers ---------- */
function renderPersonalize(){
  const p = activeProduct;
  const block = document.getElementById("personalizeBlock");
  const clickerBlock = document.getElementById("clickerBlock");
  const input = document.getElementById("nameInput");

  if (!p.personalize){
    block.hidden = true;
    clickerBlock.hidden = true;
    return;
  }

  block.hidden = false;
  input.value = "";
  input.maxLength = nameLimit(p);
  input.placeholder = p.nameClicker ? "e.g. AARUSH" : "e.g. Aarush";

  if (p.nameClicker){
    clickerBlock.hidden = false;
    activeClickers = CLICKER_MIN;
    document.getElementById("clickerValue").textContent = activeClickers;
  } else {
    clickerBlock.hidden = true;
  }
  updateNameHint();
}

function updateNameHint(){
  const p = activeProduct;
  if (!p || !p.personalize) return;
  const hint = document.getElementById("nameHint");
  const limit = nameLimit(p);

  if (p.nameClicker){
    const need = activeClickers;
    const have = activeName.length;
    if (have === 0){
      hint.textContent = `Type a name with up to ${CLICKER_MAX} letters — you get one clicker per letter.`;
      hint.className = "name-hint";
    } else if (have !== need){
      hint.textContent = `“${activeName}” has ${have} letter${have === 1 ? "" : "s"} but you picked ${need} clicker${need === 1 ? "" : "s"}. Make them match.`;
      hint.className = "name-hint warn";
    } else {
      hint.textContent = `${need} letter${need === 1 ? "" : "s"}, ${need} clicker${need === 1 ? "" : "s"} — that works.`;
      hint.className = "name-hint ok";
    }
  } else {
    hint.textContent = `${activeName.length} of ${limit} letters used`;
    hint.className = "name-hint";
  }
}

// Clicker count follows the name length, so the price always matches the letters.
function syncClickersToName(){
  if (!activeProduct || !activeProduct.nameClicker) return;
  if (activeName.length >= CLICKER_MIN && activeName.length <= CLICKER_MAX){
    activeClickers = activeName.length;
    document.getElementById("clickerValue").textContent = activeClickers;
  }
}

function updateModalPrice(){
  const p = activeProduct;
  if (!p) return;
  const unit = unitPrice({ productId: p.id, color: activeColor, qty: 1, clickers: activeClickers });
  const sur = colorSurcharge(activeColor);

  let breakdown = "";
  if (p.nameClicker) breakdown = `${activeClickers} clicker${activeClickers === 1 ? "" : "s"}`;
  if (sur) breakdown += (breakdown ? " · " : "") + `${colorInfo(activeColor).groupLabel.toLowerCase()} +${money(sur)}`;

  document.getElementById("modalPrice").innerHTML =
    money(unit) + (breakdown ? ` <span class="price-breakdown">${breakdown}</span>` : "");

  // Add to cart stays off until a personalized product has a valid name.
  const btn = document.getElementById("addToCartBtn");
  const check = validate();
  btn.disabled = !check.ok;
  btn.textContent = check.message;
}

function validate(){
  const p = activeProduct;
  if (!p) return { ok: false, message: "Add to cart" };
  if (p.personalize && activeName.trim().length === 0)
    return { ok: false, message: "Type a name first" };
  if (p.nameClicker && activeName.trim().length !== activeClickers)
    return { ok: false, message: "Letters must match clickers" };
  return { ok: true, message: "Add to cart" };
}

/* ---------- modal events ---------- */
document.addEventListener("click", (e) => {
  const openBtn = e.target.closest("[data-open]");
  if (openBtn){ openProductModal(openBtn.dataset.open); return; }

  if (!productModal.classList.contains("open")) return;

  const swatch = e.target.closest(".swatch");
  if (swatch){
    activeColor = swatch.dataset.color;
    renderColorSwatches();
    setPreviewTint();
    updateModalPrice();
    return;
  }

  const thumb = e.target.closest("[data-thumb]");
  if (thumb){
    activeImageIndex = Number(thumb.dataset.thumb);
    renderGallery();
    return;
  }
});

document.getElementById("nameInput").addEventListener("input", (e) => {
  activeName = e.target.value.replace(/\s+/g, " ").trimStart();
  e.target.value = activeName;
  syncClickersToName();
  updateNameHint();
  updateModalPrice();
});

document.getElementById("clickerPlus").addEventListener("click", () => {
  activeClickers = Math.min(CLICKER_MAX, activeClickers + 1);
  document.getElementById("clickerValue").textContent = activeClickers;
  updateNameHint();
  updateModalPrice();
});
document.getElementById("clickerMinus").addEventListener("click", () => {
  activeClickers = Math.max(CLICKER_MIN, activeClickers - 1);
  document.getElementById("clickerValue").textContent = activeClickers;
  updateNameHint();
  updateModalPrice();
});

document.getElementById("itemNote").addEventListener("input", (e) => {
  activeNote = e.target.value;
});

document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
document.getElementById("qtyPlus").addEventListener("click", () => {
  activeQty += 1;
  document.getElementById("qtyValue").textContent = activeQty;
});
document.getElementById("qtyMinus").addEventListener("click", () => {
  activeQty = Math.max(1, activeQty - 1);
  document.getElementById("qtyValue").textContent = activeQty;
});

document.getElementById("addToCartBtn").addEventListener("click", () => {
  if (!activeProduct || !validate().ok) return;
  addToCart({
    productId: activeProduct.id,
    color: activeColor,
    qty: activeQty,
    note: activeNote.trim(),
    personalName: activeProduct.personalize ? activeName.trim() : "",
    clickers: activeProduct.nameClicker ? activeClickers : 0,
  });
  closeProductModal();
  openCart();
});

/* ============================================================
   Cart drawer
   ============================================================ */
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

function openCart(){
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.classList.add("open");
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.classList.remove("open");
}

function renderCart(){
  const itemsWrap = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("emptyCartMsg");
  const footer = document.getElementById("cartFooter");
  const countBadge = document.getElementById("cartCount");
  const cartBtn = document.getElementById("cartToggle");

  const count = cartCount();
  countBadge.hidden = count === 0;
  countBadge.textContent = count;
  cartBtn.setAttribute("aria-label", `Open cart, ${count} item${count === 1 ? "" : "s"}`);

  if (cart.length === 0){
    itemsWrap.innerHTML = "";
    emptyMsg.hidden = false;
    footer.hidden = true;
    return;
  }
  emptyMsg.hidden = true;
  footer.hidden = false;

  itemsWrap.innerHTML = cart.map((line, i) => {
    const p = byId(line.productId);
    if (!p) return "";
    const hasNote = Boolean((line.note || "").trim());
    return `
    <div class="cart-item${hasNote ? " note-open" : ""}">
      <img src="${imgSrc(mainImage(p))}" alt="${esc(p.name)}">
      <div>
        <p class="cart-item-name">${esc(p.name)}</p>
        <p class="cart-item-meta">${esc(lineOptions(line))}</p>
        <div class="cart-item-controls">
          <button data-qty-minus="${i}" aria-label="Decrease quantity">−</button>
          <span>${line.qty}</span>
          <button data-qty-plus="${i}" aria-label="Increase quantity">+</button>
        </div>
        <button class="note-toggle" data-note-toggle="${i}">💬 ${hasNote ? "Edit note" : "Add a note"}</button>
        <textarea class="cart-note-input" data-note="${i}" rows="2"
          placeholder="Anything I should know about this one?"
          aria-label="Note for ${esc(p.name)}">${esc(line.note || "")}</textarea>
      </div>
      <div>
        <p class="cart-item-price">${money(linePrice(line))}</p>
        <button class="cart-item-remove" data-remove="${i}">Remove</button>
      </div>
    </div>`;
  }).join("");

  document.getElementById("cartSubtotal").textContent = money(cartTotal());
}

const cartItemsEl = document.getElementById("cartItems");
cartItemsEl.addEventListener("click", (e) => {
  const plus = e.target.closest("[data-qty-plus]");
  const minus = e.target.closest("[data-qty-minus]");
  const remove = e.target.closest("[data-remove]");
  const noteBtn = e.target.closest("[data-note-toggle]");
  if (plus) updateLineQty(Number(plus.dataset.qtyPlus), 1);
  if (minus) updateLineQty(Number(minus.dataset.qtyMinus), -1);
  if (remove) removeLine(Number(remove.dataset.remove));
  if (noteBtn){
    const item = noteBtn.closest(".cart-item");
    item.classList.toggle("note-open");
    if (item.classList.contains("note-open")) item.querySelector(".cart-note-input").focus();
  }
});
// Notes save as you type — no re-render, so the cursor stays where it is.
cartItemsEl.addEventListener("input", (e) => {
  const box = e.target.closest("[data-note]");
  if (!box) return;
  const i = Number(box.dataset.note);
  if (cart[i]){ cart[i].note = box.value; saveCart(); }
});

document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", () => { closeCart(); closeAllModals(); });

/* ============================================================
   Checkout + PayPal
   ============================================================ */
const checkoutModal = document.getElementById("checkoutModal");
const successModal = document.getElementById("successModal");
let paypalRendered = false;

function openCheckout(){
  if (cart.length === 0) return;
  const summary = document.getElementById("checkoutSummary");
  summary.innerHTML = cart.map(line => {
    const p = byId(line.productId);
    if (!p) return "";
    const note = (line.note || "").trim();
    return `<div class="checkout-line">
      <span>${esc(p.name)} × ${line.qty}<br><small>${esc(lineOptions(line))}</small>${note ? `<br><small class="checkout-note-line">💬 ${esc(note)}</small>` : ""}</span>
      <span>${money(linePrice(line))}</span>
    </div>`;
  }).join("");
  document.getElementById("checkoutTotal").textContent = money(cartTotal());

  closeCart();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  renderPaypalButtons();
}
function closeCheckout(){
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
}

function renderPaypalButtons(){
  const container = document.getElementById("paypal-button-container");
  if (typeof paypal === "undefined"){
    container.innerHTML = '<p style="font-size:.85rem;color:#4A4F72">Payment button unavailable right now — the order form link below still works.</p>';
    return;
  }
  if (paypalRendered) return; // buttons persist across opens; total is read live in createOrder
  paypalRendered = true;

  paypal.Buttons({
    style: { shape: "pill", color: "blue", label: "paypal", height: 45 },
    createOrder: function(data, actions){
      const items = cart.map(line => {
        const p = byId(line.productId);
        const note = (line.note || "").trim();
        const item = {
          name: `${p.name} (${lineOptions(line)})`.slice(0, 127),
          unit_amount: { currency_code: "USD", value: unitPrice(line).toFixed(2) },
          quantity: String(line.qty),
        };
        if (note) item.description = note.slice(0, 127);
        return item;
      });
      const total = cartTotal().toFixed(2);
      return actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: total,
            breakdown: { item_total: { currency_code: "USD", value: total } },
          },
          items: items,
          description: "Little Bot Creations order",
        }],
      });
    },
    onApprove: function(data, actions){
      return actions.order.capture().then(function(details){
        cart = [];
        saveCart();
        renderCart();
        closeCheckout();
        document.getElementById("successMessage").textContent =
          `Thanks${details.payer && details.payer.name ? ", " + details.payer.name.given_name : ""}! Your order is in — I'll get started on your print soon.`;
        successModal.classList.add("open");
        successModal.setAttribute("aria-hidden", "false");
      });
    },
    onError: function(err){
      console.error("PayPal checkout error:", err);
      alert("Something went wrong with payment. Please try again, or use the order form link in the footer.");
    },
  }).render("#paypal-button-container");
}

document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
document.getElementById("closeCheckoutModal").addEventListener("click", closeCheckout);
document.getElementById("closeSuccessModal").addEventListener("click", () => {
  successModal.classList.remove("open");
  successModal.setAttribute("aria-hidden", "true");
});

function closeAllModals(){
  [productModal, checkoutModal, successModal].forEach(m => {
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
  });
}
document.querySelectorAll(".modal").forEach(m => {
  m.addEventListener("click", (e) => { if (e.target === m) closeAllModals(); });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape"){ closeAllModals(); closeCart(); }
});

/* ============================================================
   Search
   ============================================================ */
const searchToggle = document.getElementById("searchToggle");
const searchBox = document.getElementById("searchBox");
const searchInput = document.getElementById("searchInput");

searchToggle.addEventListener("click", () => {
  const isOpen = searchBox.classList.toggle("open");
  searchToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) searchInput.focus();
});
searchInput.addEventListener("input", (e) => {
  state.query = e.target.value;
  renderGrid();
  document.getElementById("shop").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.addEventListener("click", (e) => {
  if (!searchBox.contains(e.target) && e.target !== searchToggle && !searchToggle.contains(e.target)){
    searchBox.classList.remove("open");
    searchToggle.setAttribute("aria-expanded", "false");
  }
});

/* ============================================================
   About photo fallback (shows a placeholder if the image is missing)
   ============================================================ */
const creatorPhoto = document.getElementById("creatorPhoto");
creatorPhoto.addEventListener("error", () => {
  creatorPhoto.closest(".about-photo").classList.add("photo-missing");
});

/* ============================================================
   Init
   ============================================================ */
document.getElementById("year").textContent = new Date().getFullYear();
renderCategoryPills();
renderGrid();
renderScrollRow("bestSellersRow", PRODUCTS.filter(p => p.best));
renderScrollRow("newPrintsRow", PRODUCTS.filter(p => p.isNew));
renderCart();
