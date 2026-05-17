// =============================================
//  MAKE UP ONLINE — script.js
//  Gestion dynamique du panier + UI
// =============================================

// ---------- DATA : produits disponibles ----------
const PRODUCTS = [
  { id: 1,  name: "Eyeliner",          brand: "Revolution", price: 29.900, image: "images/eyeliner.jpg" },
  { id: 2,  name: "Mascara",           brand: "Revolution", price: 14.900, image: "images/mascara_ess.jpg" },
  { id: 3,  name: "Crayon",            brand: "Essence",    price: 8.900,  image: "images/cryon_ess.jpg" },
  { id: 4,  name: "Gloss",             brand: "Adert",      price: 31.900, image: "images/adert_gloss.jpg" },
  { id: 5,  name: "Palette",           brand: "Revolution", price: 48.900, image: "images/palette_rev.jpg" },
  { id: 6,  name: "Lip Tint",          brand: "Essence",    price: 14.900, image: "images/liptinit_ess.jpg" },
  { id: 7,  name: "Palette Bronzer",   brand: "Essence",    price: 18.900, image: "images/bronzer_ess.jpg" },
  { id: 8,  name: "Palette Eyeshadow", brand: "Essence",    price: 26.000, image: "images/eyeshadow_ess.jpg" },
];

// ---------- PANIER (LocalStorage) ----------
function getCart() {
  return JSON.parse(localStorage.getItem("makeup_cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("makeup_cart", JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, brand: product.brand, price: product.price, image: product.image, qty });
  }
  saveCart(cart);
  showToast(`✓ ${product.name} ajouté au panier !`);
}

function removeFromCart(productId) {
  let cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  renderCartPage();
}

function updateQty(productId, newQty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = Math.max(1, parseInt(newQty) || 1);
    saveCart(cart);
  }
  renderCartPage();
}

function clearCart() {
  saveCart([]);
  renderCartPage();
}

// ---------- BADGE PANIER (header) ----------
function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll(".cart-badge").forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? "inline-flex" : "none";
  });
}

// Injecte un badge sur l'icône panier dans le header
function injectCartBadge() {
  const cartLinks = document.querySelectorAll('#navbar a[href="cart.html"]');
  cartLinks.forEach(link => {
    if (!link.querySelector(".cart-badge")) {
      const badge = document.createElement("span");
      badge.className = "cart-badge";
      badge.style.cssText = `
        display:none; position:absolute; top:-8px; right:-10px;
        background:#e91e63; color:#fff; border-radius:50%;
        width:18px; height:18px; font-size:11px; font-weight:700;
        align-items:center; justify-content:center; line-height:1;
      `;
      link.style.position = "relative";
      link.appendChild(badge);
    }
  });
  updateCartBadge();
}

// ---------- TOAST NOTIFICATION ----------
function showToast(msg) {
  let toast = document.getElementById("toast-notif");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notif";
    toast.style.cssText = `
      position:fixed; bottom:30px; right:30px; background:#222;
      color:#fff; padding:14px 22px; border-radius:8px; font-size:14px;
      z-index:9999; opacity:0; transform:translateY(20px);
      transition:all .3s ease; pointer-events:none; max-width:300px;
      box-shadow: 0 4px 20px rgba(0,0,0,.3);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 2800);
}

// ---------- PAGE : ACCUEIL (html_page.html) ----------
function initHomePage() {
  // Boutons "Ajouter au panier" sur les cartes produits
  document.querySelectorAll(".pro").forEach((card, index) => {
    const product = PRODUCTS[index];
    if (!product) return;

    // Stocker l'id sur la carte
    card.dataset.productId = product.id;

    const cartIcon = card.querySelector(".fa-shopping-cart, .fas.fa-shopping-cart");
    if (cartIcon) {
      const btn = cartIcon.closest("a") || cartIcon;
      btn.style.cursor = "pointer";

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        addToCart(product.id, 1);

        // Animation du bouton
        cartIcon.classList.add("fa-spin");
        setTimeout(() => cartIcon.classList.remove("fa-spin"), 600);
      });
    }

    // Hover effect sur la carte
    card.style.transition = "transform .25s, box-shadow .25s";
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-6px)";
      card.style.boxShadow = "0 12px 30px rgba(0,0,0,.15)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.boxShadow = "";
    });
  });
}

// ---------- PAGE : SHOP (shop.html) ----------
function initShopPage() {
  // Même logique que l'accueil
  initHomePage();

  // Filtrage / recherche basique si un champ est présent
  const searchInput = document.getElementById("shop-search");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const q = this.value.toLowerCase();
      document.querySelectorAll(".pro").forEach((card, i) => {
        const p = PRODUCTS[i];
        if (!p) return;
        const match = p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
        card.style.display = match ? "" : "none";
      });
    });
  }
}

// ---------- PAGE : PRODUIT (sproduct.html) ----------
function initProductPage() {
  // Galerie d'images
  const mainImg = document.getElementById("mainimg");
  if (mainImg) {
    document.querySelectorAll(".small-img").forEach(img => {
      img.style.cursor = "pointer";
      img.style.opacity = ".7";
      img.style.transition = "opacity .2s";
      img.addEventListener("click", () => {
        mainImg.src = img.src;
        document.querySelectorAll(".small-img").forEach(s => s.style.opacity = ".7");
        img.style.opacity = "1";
      });
      img.addEventListener("mouseenter", () => img.style.opacity = "1");
      img.addEventListener("mouseleave", () => {
        if (mainImg.src !== img.src) img.style.opacity = ".7";
      });
    });
  }

  // Bouton "Add To Cart" sur la page produit
  const addBtn = document.querySelector("#prodetails .normal");
  if (addBtn) {
    // Détecter quel produit (ici bronzer = id 7 par défaut, mais peut être paramétré)
    const pageProductId = 7;
    addBtn.addEventListener("click", function () {
      const qtyInput = document.querySelector("#prodetails input[type='number']");
      const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
      addToCart(pageProductId, qty);
    });
  }
}

// ---------- PAGE : PANIER (cart.html) ----------
function renderCartPage() {
  const tbody = document.querySelector("#cart tbody");
  const subtotalSection = document.getElementById("cart-add");
  if (!tbody) return;

  const cart = getCart();
  tbody.innerHTML = "";

  if (cart.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:40px; color:#888; font-size:16px;">
          🛒 Votre panier est vide.<br>
          <a href="shop.html" style="color:#e91e63; text-decoration:none; font-weight:600;">
            Continuer vos achats →
          </a>
        </td>
      </tr>`;
    if (subtotalSection) subtotalSection.style.display = "none";
    return;
  }

  if (subtotalSection) subtotalSection.style.display = "";

  let subtotal = 0;

  cart.forEach(item => {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <i class="far fa-times-circle" 
           style="cursor:pointer; font-size:20px; color:#e91e63;"
           data-id="${item.id}">
        </i>
      </td>
      <td><img src="${item.image}" alt="${item.name}" style="width:70px; border-radius:6px;"></td>
      <td>${item.brand} – ${item.name}</td>
      <td>${item.price.toFixed(3)} dt</td>
      <td>
        <input type="number" value="${item.qty}" min="1"
               data-id="${item.id}"
               style="width:60px; padding:4px 6px; border:1px solid #ddd; border-radius:4px;">
      </td>
      <td style="font-weight:600;">${lineTotal.toFixed(3)} dt</td>
    `;
    tbody.appendChild(tr);
  });

  // Events : supprimer
  tbody.querySelectorAll(".fa-times-circle").forEach(icon => {
    icon.addEventListener("click", () => removeFromCart(parseInt(icon.dataset.id)));
  });

  // Events : changer quantité
  tbody.querySelectorAll("input[type='number']").forEach(input => {
    input.addEventListener("change", () => updateQty(parseInt(input.dataset.id), input.value));
    input.addEventListener("input",  () => updateQty(parseInt(input.dataset.id), input.value));
  });

  // Mise à jour du total
  updateCartTotal(subtotal);
}

function updateCartTotal(subtotal) {
  const rows = document.querySelectorAll("#subtotal table tr");
  if (!rows || rows.length < 3) return;

  rows[0].cells[1].textContent = subtotal.toFixed(3) + " dt";
  rows[1].cells[1].textContent = "Gratuite";
  rows[2].cells[1].innerHTML   = `<strong>${subtotal.toFixed(3)} dt</strong>`;

  // Bouton checkout
  const checkoutBtn = document.querySelector("#subtotal .normal");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (getCart().length === 0) {
        showToast("⚠️ Votre panier est vide !");
        return;
      }
      // Simulation checkout
      if (confirm(`Confirmer la commande de ${subtotal.toFixed(3)} dt ?`)) {
        clearCart();
        showToast("🎉 Commande confirmée ! Merci pour votre achat.");
      }
    });
  }
}

// ---------- PAGE : CONTACT ----------
function initContactPage() {
  const form = document.querySelector("#form-details form");
  if (!form) return;

  // Remplace le <form> submit natif par un handler JS
  const submitBtn = form.querySelector("button");
  if (submitBtn) {
    submitBtn.type = "button";
    submitBtn.addEventListener("click", function () {
      const name    = form.querySelector('input[type="text"]')?.value.trim();
      const email   = form.querySelector('input[type="email"]')?.value.trim();
      const subject = form.querySelectorAll('input[type="text"]')[1]?.value.trim();
      const message = form.querySelector("textarea")?.value.trim();

      if (!name || !email || !message) {
        showToast("⚠️ Veuillez remplir tous les champs obligatoires.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        showToast("⚠️ Adresse e-mail invalide.");
        return;
      }

      showToast("✉️ Message envoyé ! Merci, nous vous répondrons bientôt.");
      form.querySelectorAll("input, textarea").forEach(el => el.value = "");
    });
  }
}

// ---------- INITIALISATION GLOBALE ----------
document.addEventListener("DOMContentLoaded", function () {
  injectCartBadge();

  const path = window.location.pathname.toLowerCase();

  if (path.includes("html_page") || path === "/" || path.endsWith("index.html")) {
    initHomePage();
  } else if (path.includes("shop") && !path.includes("sproduct")) {
    initShopPage();
  } else if (path.includes("sproduct")) {
    initProductPage();
  } else if (path.includes("cart")) {
    renderCartPage();
  } else if (path.includes("contact")) {
    initContactPage();
  }

  // Animation d'entrée des sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".pro, .blog-box, .fe-box").forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity .5s ease, transform .5s ease";
    observer.observe(el);
  });
});
