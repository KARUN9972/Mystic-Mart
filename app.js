
var cartCount = 0;
var cartTotal = 0;
var activeCoupon = null;
var couponWarningTimeout = null;
var phoenixStock = 3;


(function injectSimpleStyles() {
  var css = "\
  body { font-family: Arial, sans-serif; background: #071022; color: #e6eef8; padding: 20px; }\
  .item-card { background:#0b1220; padding:10px; border-radius:8px; margin-bottom:10px; }\
  .add-to-cart { background:#9b5de5; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; }\
  .add-to-cart:disabled { opacity:0.6; cursor:not-allowed; }\
  .side { background:#0b1220; padding:10px; border-radius:8px; }\
  .warning { color:#ffb4a2; min-height:18px; }";
  var s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);
})();

-
window.addEventListener("DOMContentLoaded", function () {
  // Attach click listeners to all add-to-cart buttons
  var buttons = document.querySelectorAll(".add-to-cart");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", handleAddToCart);
  }


  var couponInput = document.getElementById("coupon-input");
  if (couponInput) {
    couponInput.addEventListener("input", handleCouponChange);
  }

  updateCartDisplay();
  updatePhoenixStockDisplay();
});


function handleAddToCart(event) {
  var button = event.target;
  var price = parseFloat(button.getAttribute("data-price")) || 0;
  var key = button.getAttribute("data-key");


  if (key === "phoenix") {
    if (phoenixStock <= 0) {
     
      return;
    }
    phoenixStock = phoenixStock - 1;
    updatePhoenixStockDisplay();

    if (phoenixStock <= 0) {
   
      var phoenixButtons = document.querySelectorAll('button[data-key="phoenix"]');
      for (var j = 0; j < phoenixButtons.length; j++) {
        phoenixButtons[j].disabled = true;
      }
    }
  }

 
  cartCount = cartCount + 1;
  cartTotal = cartTotal + price;

  if (!button.dataset.clicked) {
    button.textContent = "Added! Add More ✨";
    button.dataset.clicked = "true";
  } else {
    button.textContent = "Add More ✨";
  }

  updateCartDisplay();
}


function handleCouponChange() {
  var input = document.getElementById("coupon-input");
  if (!input) return;
  var code = input.value.trim().toUpperCase();

  
  activeCoupon = null;
  clearCouponWarning();

  if (code === "") {
    updateCartDisplay();
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
}


function updateCartDisplay() {
  var countEl = document.getElementById("cart-count");
  var subtotalEl = document.getElementById("cart-subtotal");
  var discountEl = document.getElementById("cart-discount");
  var totalEl = document.getElementById("cart-total");
  var msgEl = document.getElementById("cart-message");
  var activeMsgEl = document.getElementById("active-coupon-message");

  if (countEl) countEl.textContent = cartCount;
  if (subtotalEl) subtotalEl.textContent = cartTotal.toFixed(2);

  var discount = 0;
  if (activeCoupon === "FIRE10") discount = cartTotal * 0.10;
  if (activeCoupon === "ICE25") discount = cartTotal * 0.25;
  if (discountEl) discountEl.textContent = discount.toFixed(2);

  var finalTotal = cartTotal - discount;
  if (finalTotal < 0) finalTotal = 0;
  if (totalEl) totalEl.textContent = finalTotal.toFixed(2);

  if (msgEl) {
    if (cartCount === 0) msgEl.textContent = "Your satchel is empty. Add some magic!";
    else if (cartCount < 3) msgEl.textContent = "Your satchel glows softly with power.";
    else msgEl.textContent = "Careful! Your satchel is overflowing with enchantments.";
  }

  if (activeMsgEl) {
    activeMsgEl.textContent = activeCoupon ? ("Coupon '" + activeCoupon + "' is active.") : "No magic coupon active.";
  }
}


function updatePhoenixStockDisplay() {
  var stockEl = document.getElementById("stock-phoenix");
  if (!stockEl) return;
  if (phoenixStock > 0) stockEl.textContent = "Only " + phoenixStock + " left!";
  else stockEl.textContent = "Sold Out: Reborn Next Moon Cycle";
}


function showCouponWarning(text) {
  var el = document.getElementById("coupon-warning");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");

  if (couponWarningTimeout) {
    clearTimeout(couponWarningTimeout);
  }
  couponWarningTimeout = setTimeout(clearCouponWarning, 3000);
}

function clearCouponWarning() {
  var el = document.getElementById("coupon-warning");
  if (!el) return;
  el.textContent = "";
  el.classList.remove("show");
}
