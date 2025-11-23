
var cartCount = 0;
var cartTotal = 0;
var activeCoupon = null;
var couponWarningTimeout = null;


var phoenixStock = 3;

window.addEventListener("DOMContentLoaded", function () {
  var buttons = document.querySelectorAll(".add-to-cart");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", handleAddToCart);
  }

  var couponInput = document.getElementById("coupon-input");
  couponInput.addEventListener("input", handleCouponChange);

  updateCartDisplay();
});


function handleAddToCart(event) {
  var button = event.target;
  var price = parseFloat(button.getAttribute("data-price"));
  var key = button.getAttribute("data-key");

  
  if (key === "phoenix") {
    if (phoenixStock <= 0) {
      return; 
    }
    phoenixStock--;

    var stockText = document.getElementById("stock-phoenix");
    if (phoenixStock > 0) {
      stockText.textContent = "Only " + phoenixStock + " left!";
    } else {
      stockText.textContent = "Sold Out: Reborn Next Moon Cycle";
      button.disabled = true;

      var card = button.closest(".item-card");
      if (card) {
        card.classList.add("sold-out");
      }
    }
  }

  
  cartCount++;
  cartTotal += price;

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

  countEl.textContent = cartCount;
  subtotalEl.textContent = cartTotal.toFixed(2);

  var discountAmount = 0;
  if (activeCoupon === "FIRE10") {
    discountAmount = cartTotal * 0.1;
  } else if (activeCoupon === "ICE25") {
    discountAmount = cartTotal * 0.25;
  }
  discountEl.textContent = discountAmount.toFixed(2);

  var finalTotal = cartTotal - discountAmount;
  if (finalTotal < 0) finalTotal = 0;
  totalEl.textContent = finalTotal.toFixed(2);

 
  if (cartCount === 0) {
    msgEl.textContent = "Your satchel is empty. Add some magic!";
  } else if (cartCount < 3) {
    msgEl.textContent = "Your satchel glows softly with power.";
  } else {
    msgEl.textContent =
      "Careful! Your satchel is overflowing with enchantments.";
  }

  
  if (activeCoupon) {
    activeMsgEl.textContent =
      "Coupon '" + activeCoupon + "' is active. Discount applied!";
  } else {
    activeMsgEl.textContent = "No magic coupon active.";
  }
}

function showCouponWarning(text) {
  var warningEl = document.getElementById("coupon-warning");
  warningEl.textContent = text;
  warningEl.classList.add("show");

  if (couponWarningTimeout) {
    clearTimeout(couponWarningTimeout);
  }

  couponWarningTimeout = setTimeout(function () {
    clearCouponWarning();
  }, 3000);
}

function clearCouponWarning() {
  var warningEl = document.getElementById("coupon-warning");
  warningEl.textContent = "";
  warningEl.classList.remove("show");
}


var addToCartButtons = document.querySelectorAll(".add-to-cart");
addToCartButtons.forEach(function (button) {
  button.addEventListener("click", handleAddToCart);
});
