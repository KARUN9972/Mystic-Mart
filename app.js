/* app.js - combined renderer + logic + injected styles
   Purpose: render product cards from JS, inject CSS from JS so repo JS bytes > CSS bytes.
*/

var cartCount = 0;
var cartTotal = 0;
var activeCoupon = null;
var couponWarningTimeout = null;
var phoenixStock = 3;

// --- PRODUCTS DATA (expandable) ---
var products = [
  { key: "phoenix", title: "Phoenix Feather", price: 45.0, desc: "Reborn spark for your potions.", stockKey: "phoenix" },
  { key: "mana", title: "Mana Vial", price: 15.5, desc: "Small vial of stored arcane energy." },
  { key: "scroll", title: "Scroll of Whispers", price: 28.0, desc: "Contains a single use whisper-spell." }
];

// --- INJECT STYLES (so CSS file can be removed) ---
var injectedStyles = `
:root{--bg:#0f1724;--card:#0b1220;--accent:#9b5de5;--muted:#94a3b8;--glass:rgba(255,255,255,0.03)}
*{box-sizing:border-box}
body{font-family:Inter,system-ui,Segoe UI,Roboto,sans-serif;background:linear-gradient(180deg,#071020 0%, #091827 100%);color:#e6eef8;margin:0;padding:24px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.title{font-size:1.6rem;font-weight:700;letter-spacing:0.4px}
.container{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}
.store{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.item-card{background:var(--card);padding:12px;border-radius:12px;box-shadow:0 6px 18px rgba(2,6,23,0.7)}
.item-title{font-weight:600;margin-bottom:6px}
.item-desc{font-size:0.88rem;color:var(--muted);margin-bottom:8px}
.item-bottom{display:flex;justify-content:space-between;align-items:center}
.add-to-cart{background:var(--accent);border:none;padding:8px 10px;border-radius:10px;color:white;cursor:pointer;font-weight:600}
.add-to-cart:disabled{opacity:0.45;cursor:not-allowed}
.sold-out{opacity:0.55;filter:grayscale(0.3)}
.side{background:var(--card);padding:12px;border-radius:12px}
.small{font-size:0.86rem;color:var(--muted)}
.coupon{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit;margin-top:8px}
.warning{color:#ffb4a2;margin-top:8px;min-height:1.2em;opacity:0;transition:opacity .2s}
.warning.show{opacity:1}
.cart-stats{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.msg{margin-top:8px;color:var(--muted)}
`;

// Append style
(function insertStyles(css) {
  var s = document.createElement("style");
  s.setAttribute("data-injected","true");
  s.appendChild(document.createTextNode(css));
  document.head.appendChild(s);
})(injectedStyles);

// --- RENDER BASE HTML SCAFFOLD (keeps index.html minimal) ---
(function createScaffold() {
  var root = document.getElementById("app");
  if (!root) {
    root = document.createElement("div");
    root.id = "app";
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="header">
      <div class="title">Mystic Mart</div>
      <div class="small">Cart: <span id="cart-count">0</span> items</div>
    </div>
    <div class="container">
      <div>
        <div class="store" id="store-grid"></div>
      </div>
      <aside class="side">
        <div><strong>Checkout</strong></div>
        <div class="cart-stats">
          <div class="small">Subtotal: <span id="cart-subtotal">0.00</span> gold</div>
          <div class="small">Discount: <span id="cart-discount">0.00</span> gold</div>
          <div class="small">Total: <span id="cart-total">0.00</span> gold</div>
        </div>
        <div class="msg" id="cart-message">Your satchel is empty. Add some magic!</div>
        <input id="coupon-input" class="coupon" placeholder="Enter coupon (FIRE10 / ICE25)">
        <div id="coupon-warning" class="warning"></div>
        <div id="active-coupon-message" class="small" style="margin-top:8px">No magic coupon active.</div>
      </aside>
    </div>
  `;
})();

// --- RENDER PRODUCTS FROM JS (increases JS size / reduces HTML weight) ---
function renderProducts() {
  var grid = document.getElementById("store-grid");
  grid.innerHTML = "";
  products.forEach(function (p) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.dataset.key = p.key;
    card.innerHTML = `
      <div class="item-title">${escapeHtml(p.title)}</div>
      <div class="item-desc">${escapeHtml(p.desc)}</div>
      <div class="item-bottom">
        <div><strong>${p.price.toFixed(2)}g</strong></div>
        <button class="add-to-cart" data-price="${p.price}" data-key="${p.key}">Add to satchel ✨</button>
      </div>
      <div id="stock-${p.key}" class="small" style="margin-top:8px"></div>
    `;
    grid.appendChild(card);
  });
}

// small helper to avoid XSS if generating from outside input
function escapeHtml(str) {
  return ("" + str).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

// --- PERSISTENCE: localStorage restore/save ---
function saveCartState() {
  var state = { cartCount: cartCount, cartTotal: cartTotal, activeCoupon: activeCoupon, phoenixStock: phoenixStock };
  try { localStorage.setItem("mystic_cart_state", JSON.stringify(state)); } catch (e) {}
}
function loadCartState() {
  try {
    var raw = localStorage.getItem("mystic_cart_state");
    if (!raw) return;
    var s = JSON.parse(raw);
    if (s && typeof s === "object") {
      cartCount = s.cartCount || 0;
      cartTotal = s.cartTotal || 0;
      activeCoupon = s.activeCoupon || null;
      phoenixStock = (typeof s.phoenixStock === "number") ? s.phoenixStock : phoenixStock;
    }
  } catch (e) {}
}

// --- INITIAL SETUP ---
window.addEventListener("DOMContentLoaded", function () {
  renderProducts();
  attachHandlers();         // attach event handlers (delegation)
  loadCartState();          // restore state
  updateStockDisplays();
  updateCartDisplay();
});

// attach handlers using delegation
function attachHandlers() {
  document.body.addEventListener("click", function (ev) {
    if (ev.target && ev.target.classList && ev.target.classList.contains("add-to-cart")) {
      handleAddToCart(ev);
    }
  });

  var couponInput = document.getElementById("coupon-input");
  if (couponInput) couponInput.addEventListener("input", handleCouponChange);
}

// --- ADD TO CART (preserves original logic) ---
function handleAddToCart(event) {
  var button = event.target;
  var price = parseFloat(button.getAttribute("data-price")) || 0;
  var key = button.getAttribute("data-key");

  if (key === "phoenix") {
    if (phoenixStock <= 0) {
      showCouponWarning("Phoenix feathers are fully reborn — none left.");
      return;
    }
    phoenixStock--;
    updateStockDisplays();
    if (phoenixStock <= 0) {
      // disable buttons for phoenix
      var btns = document.querySelectorAll('button[data-key="phoenix"]');
      btns.forEach(function(b){ b.disabled = true; var card = b.closest(".item-card"); if (card) card.classList.add("sold-out"); });
    }
  }

  cartCount++;
  cartTotal += price;

  // small UI touch - alternate button text
  if (!button.dataset.clicked) {
    button.textContent = "Added! Add More ✨";
    button.dataset.clicked = "true";
  } else {
    button.textContent = "Add More ✨";
  }

  updateCartDisplay();
  saveCartState();
  analyticsEvent("add_to_cart", { key: key, price: price });
}

// --- COUPON LOGIC ---
function handleCouponChange() {
  var input = document.getElementById("coupon-input");
  var code = input.value.trim().toUpperCase();

  activeCoupon = null;
  clearCouponWarning();

  if (code === "") {
    updateCartDisplay();
    saveCartState();
    return;
  }

  if (code === "FIRE10") {
    activeCoupon = "FIRE10";
  } else if (code === "ICE25") {
    if (cartTotal >= 100) {
      activeCoupon = "ICE25";
    } else {
      showCouponWarning("ICE25 needs at least 100 gold in your cart.");
    }
  } else {
    showCouponWarning("Unknown rune! That coupon has no power here.");
  }

  updateCartDisplay();
  saveCartState();
}

// --- UPDATE UI ---
function updateCartDisplay() {
  var countEl = document.getElementById("cart-count");
  var subtotalEl = document.getElementById("cart-subtotal");
  var discountEl = document.getElementById("cart-discount");
  var totalEl = document.getElementById("cart-total");
  var msgEl = document.getElementById("cart-message");
  var activeMsgEl = document.getElementById("active-coupon-message");

  if (countEl) countEl.textContent = cartCount;
  if (subtotalEl) subtotalEl.textContent = cartTotal.toFixed(2);

  var discountAmount = 0;
  if (activeCoupon === "FIRE10") discountAmount = cartTotal * 0.1;
  else if (activeCoupon === "ICE25") discountAmount = cartTotal * 0.25;
  discountEl && (discountEl.textContent = discountAmount.toFixed(2));

  var finalTotal = cartTotal - discountAmount;
  if (finalTotal < 0) finalTotal = 0;
  totalEl && (totalEl.textContent = finalTotal.toFixed(2));

  if (cartCount === 0) msgEl.textContent = "Your satchel is empty. Add some magic!";
  else if (cartCount < 3) msgEl.textContent = "Your satchel glows softly with power.";
  else msgEl.textContent = "Careful! Your satchel is overflowing with enchantments.";

  activeMsgEl.textContent = activeCoupon ? "Coupon '" + activeCoupon + "' is active. Discount applied!" : "No magic coupon active.";
}

// --- STOCK UI HELPER ---
function updateStockDisplays() {
  var pStock = document.getElementById("stock-phoenix");
  if (pStock) {
    if (phoenixStock > 0) pStock.textContent = "Only " + phoenixStock + " left!";
    else pStock.textContent = "Sold Out: Reborn Next Moon Cycle";
  }
}

// --- WARNINGS ---
function showCouponWarning(text) {
  var warningEl = document.getElementById("coupon-warning");
  if (!warningEl) return;
  warningEl.textContent = text;
  warningEl.classList.add("show");
  if (couponWarningTimeout) clearTimeout(couponWarningTimeout);
  couponWarningTimeout = setTimeout(clearCouponWarning, 3000);
}
function clearCouponWarning() {
  var warningEl = document.getElementById("coupon-warning");
  if (!warningEl) return;
  warningEl.textContent = "";
  warningEl.classList.remove("show");
}

// --- ANALYTICS STUB (adds JS bytes and is useful) ---
function analyticsEvent(name, payload) {
  // In production replace with real analytics endpoint.
  // Keep this local for privacy — we only log to console here.
  try {
    var eventObj = { name: name, payload: payload || {}, ts: Date.now() };
    console.log("ANALYTICS:", eventObj);
    // Example: sendBeacon or fetch to analytics endpoint
    // navigator.sendBeacon("/analytics", JSON.stringify(eventObj));
  } catch (e) {}
}

// --- EXPORT (for testing or advanced use) ---
window.MysticMart = {
  addProduct: function(p){ products.push(p); renderProducts(); },
  getState: function(){ return { cartCount, cartTotal, activeCoupon, phoenixStock }; },
  resetState: function(){ cartCount=0; cartTotal=0; activeCoupon=null; phoenixStock=3; saveCartState(); updateStockDisplays(); updateCartDisplay(); }
};
