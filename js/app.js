// c:\Users\rodon\Desktop\ilumros.cm\js\app.js

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOpenBtns = document.querySelectorAll('.cart-open-btn');
  const cartCloseBtn = document.getElementById('closeCart');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalAmount = document.getElementById('cartTotalAmount');
  const cartBadge = document.getElementById('cartBadge');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  
  // Views
  const mainView = document.getElementById('main-view');
  const catalogView = document.getElementById('catalog-view');
  const viewCatalogBtns = document.querySelectorAll('.view-catalog-btn');
  const goHomeBtns = document.querySelectorAll('.go-home-btn');
  
  // Product Containers
  const featuredGrid = document.getElementById('featuredGrid');
  const catalogGrid = document.getElementById('catalogGrid');
  
  // Filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchInput');

  // State
  let cart = JSON.parse(localStorage.getItem('ilumros_cart')) || [];
  
  // ============================================
  // Initialization
  // ============================================
  init();

  function init() {
    renderFeaturedProducts();
    renderCatalogProducts(products);
    updateCartUI();
    setupEventListeners();
  }

  // ============================================
  // Product Rendering
  // ============================================
  function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumSignificantDigits: 3 }).format(price);
  }

  function createProductCard(product) {
    return `
      <div class="product-card">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-desc">${product.description}</p>
          <div class="product-footer">
            <span class="product-price">${formatPrice(product.price)}</span>
            <button class="btn-add-cart" data-id="${product.id}" title="Agregar al carrito">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderFeaturedProducts() {
    if(!featuredGrid) return;
    // Show first 4 products in featured
    const featured = products.slice(0, 4);
    featuredGrid.innerHTML = featured.map(createProductCard).join('');
  }

  function renderCatalogProducts(items) {
    if(!catalogGrid) return;
    if(items.length === 0) {
      catalogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 3rem;">No se encontraron productos.</p>`;
      return;
    }
    catalogGrid.innerHTML = items.map(createProductCard).join('');
  }

  // ============================================
  // Event Listeners
  // ============================================
  function setupEventListeners() {
    // Add to cart delegation
    document.body.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-add-cart');
      if (addBtn) {
        const id = parseInt(addBtn.dataset.id);
        addToCart(id);
        openCart();
      }
    });

    // Cart Open/Close
    cartOpenBtns.forEach(btn => btn.addEventListener('click', openCart));
    cartCloseBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // View Switching
    viewCatalogBtns.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchToCatalog();
      if(navMenu.classList.contains('active')) navMenu.classList.remove('active');
    }));

    goHomeBtns.forEach(btn => btn.addEventListener('click', (e) => {
      // Allow default behavior for anchor links if on same page
      if(btn.getAttribute('href') && btn.getAttribute('href').startsWith('#')) {
        switchToHome();
        if(navMenu.classList.contains('active')) navMenu.classList.remove('active');
      }
    }));

    // Filtering
    if(filterBtns) {
      filterBtns.forEach(btn => btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const filter = e.target.dataset.filter;
        applyFilters(filter, searchInput.value);
      }));
    }

    if(searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        applyFilters(activeFilter, e.target.value);
      });
    }

    // Checkout
    if(checkoutBtn) {
      checkoutBtn.addEventListener('click', checkoutToWhatsApp);
    }
  }

  // ============================================
  // View Management
  // ============================================
  function switchToCatalog() {
    mainView.classList.add('d-none');
    catalogView.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchToHome() {
    catalogView.classList.add('d-none');
    mainView.classList.remove('d-none');
  }

  function applyFilters(category, query) {
    let filtered = products;
    
    if(category && category !== 'Todos') {
      filtered = filtered.filter(p => p.category === category);
    }
    
    if(query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    
    renderCatalogProducts(filtered);
  }

  // ============================================
  // Cart Logic
  // ============================================
  function openCart() {
    cartOverlay.classList.add('active');
    cartSidebar.classList.add('active');
  }

  function closeCart() {
    cartOverlay.classList.remove('active');
    cartSidebar.classList.remove('active');
  }

  function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existingEntry = cart.find(item => item.product.id === id);

    if (existingEntry) {
      existingEntry.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
  }

  function removeFromCart(id) {
    cart = cart.filter(item => item.product.id !== id);
    saveCart();
    updateCartUI();
  }

  function updateQuantity(id, change) {
    const item = cart.find(i => i.product.id === id);
    if(item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        removeFromCart(id);
      } else {
        saveCart();
        updateCartUI();
      }
    }
  }

  function saveCart() {
    localStorage.setItem('ilumros_cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
    if(totalItems === 0) {
      cartBadge.classList.add('d-none');
    } else {
      cartBadge.classList.remove('d-none');
    }

    // Update Sidebar
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `<div class="empty-cart-msg">Tu carrito está vacío</div>`;
      cartTotalAmount.textContent = formatPrice(0);
      return;
    }

    const cartHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.product.name}</h4>
          <span class="cart-item-price">${formatPrice(item.product.price)}</span>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="appUpdateQty(${item.product.id}, -1)">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="appUpdateQty(${item.product.id}, 1)">+</button>
            <button class="remove-item" onclick="appRemoveItem(${item.product.id})">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');

    cartItemsContainer.innerHTML = cartHTML;

    // Update Total
    const totalCost = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    cartTotalAmount.textContent = formatPrice(totalCost);
  }

  // Expose methods for inline onclick handlers inside generated HTML string
  window.appUpdateQty = updateQuantity;
  window.appRemoveItem = removeFromCart;

  // ============================================
  // Checkout (WhatsApp Integration)
  // ============================================
  function checkoutToWhatsApp() {
    if(cart.length === 0) return;

    const phoneNumber = "5491100000000"; // Replace with real number
    let message = "Hola *Ilumros*! 💡\nQuisiera realizar el siguiente pedido:\n\n";
    
    let total = 0;
    cart.forEach(item => {
      const pt = item.product.price * item.quantity;
      total += pt;
      message += `- ${item.quantity}x ${item.product.name} (${formatPrice(pt)})\n`;
    });

    message += `\n*Total estimado: ${formatPrice(total)}*\n\nPor favor, indíquenme cómo avanzar con el pago y envío. ¡Gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(waUrl, '_blank');
  }

});
