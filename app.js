/**
 * STYLE 365 - Dynamic Interactions & State Management
 */

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------------------
  // Cart State Management
  // ---------------------------------------------------------------------------
  let cart = [
    {
      id: 'featured-hoodie',
      name: 'Graffiti Violet Hoodie',
      price: 79.99,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmIyL9ZnMa7biaXRu_Vv5hKo1MuYWLqWRuTl-quk5m4FQKFTdnfnPFDpQSWWqXv7V7LB64MLFp9a0yCi4mHXh9WQDBkOGH8mEaWBx6ts8stHXkeBQsNy2opfp410XbE8aADBKqluYUpLAUUjxcfwBEw7j0dGeoGULmtGMUpSaK8WXlrva7pTjfbEcBruvL3VXQhidAkklgsIpNtCEYfRODT7NW1scKguP_mWPOoWWFECzxZWGZODyP'
    }
  ];

  let wishlist = new Set();

  const cartDrawerBtn = document.getElementById('cartDrawerBtn');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const cartItemCountPill = document.getElementById('cartItemCountPill');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Mobile Menu Elements
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeMobileMenuBtn = document.getElementById('closeMobileMenuBtn');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // Search Elements
  const searchBtn = document.getElementById('searchBtn');
  const searchModal = document.getElementById('searchModal');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const searchInput = document.getElementById('searchInput');
  const quickTagBtns = document.querySelectorAll('.quick-tag-btn');

  // Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');

  // Wishlist Badge
  const wishlistCountBadge = document.getElementById('wishlistCountBadge');

  // Mobile Dock
  const dockCartBtn = document.getElementById('dockCartBtn');
  const dockCartBadge = document.getElementById('dockCartBadge');
  const dockSearchBtn = document.getElementById('dockSearchBtn');
  const dockItems = document.querySelectorAll('[data-dock]');
  const siteHeader = document.getElementById('siteHeader');

  // ---------------------------------------------------------------------------
  // Render Cart UI
  // ---------------------------------------------------------------------------
  function renderCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update Header Badges
    cartCountBadge.textContent = totalItems === 1 ? '1 item' : `${totalItems} items`;
    cartItemCountPill.textContent = totalItems;
    if (dockCartBadge) {
      dockCartBadge.textContent = totalItems;
      dockCartBadge.style.display = totalItems ? '' : 'none';
    }
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
          <svg class="w-12 h-12 mb-3 text-neutral-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="font-bold text-neutral-700 text-sm">Your bag is currently empty</p>
          <p class="text-xs text-neutral-400 mt-1">Discover the latest drops in our collections.</p>
        </div>
      `;
      return;
    }

    cartItemsList.innerHTML = cart.map(item => `
      <div class="flex items-center space-x-3.5 pb-3 border-b border-neutral-100 group">
        <div class="w-16 h-20 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-xs text-neutral-900 truncate">${item.name}</h4>
          <p class="text-xs font-bold text-brand-darkPurple mt-0.5">$${item.price.toFixed(2)}</p>
          <div class="flex items-center space-x-2 mt-2">
            <button class="qty-btn w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center justify-center transition-colors" data-id="${item.id}" data-action="decrease">-</button>
            <span class="text-xs font-semibold text-neutral-800">${item.quantity}</span>
            <button class="qty-btn w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center justify-center transition-colors" data-id="${item.id}" data-action="increase">+</button>
          </div>
        </div>
        <button class="remove-cart-item text-neutral-300 hover:text-red-500 text-xs p-1 transition-colors" data-id="${item.id}" aria-label="Remove item">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `).join('');

    // Attach quantity and removal listeners
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const action = e.currentTarget.getAttribute('data-action');
        const product = cart.find(i => i.id === id);
        if (!product) return;

        if (action === 'increase') {
          product.quantity += 1;
        } else if (action === 'decrease') {
          product.quantity -= 1;
          if (product.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
          }
        }
        renderCart();
      });
    });

    document.querySelectorAll('.remove-cart-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        cart = cart.filter(i => i.id !== id);
        renderCart();
        showToast('Item removed from bag');
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Cart Drawer Open / Close
  // ---------------------------------------------------------------------------
  function openCart() {
    renderCart();
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  cartDrawerBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  continueShoppingBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', (e) => {
    if (e.target === cartOverlay) closeCart();
  });

  // ---------------------------------------------------------------------------
  // Add to Cart Buttons
  // ---------------------------------------------------------------------------
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget;
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');
      const price = parseFloat(button.getAttribute('data-price'));
      const image = button.getAttribute('data-img');

      const existingItem = cart.find(item => item.id === id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ id, name, price, quantity: 1, image });
      }

      renderCart();
      showToast(`Added "${name}" to your bag!`);
      openCart();
    });
  });

  // ---------------------------------------------------------------------------
  // Wishlist Toggle
  // ---------------------------------------------------------------------------
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget;
      const product = button.getAttribute('data-product');

      if (wishlist.has(product)) {
        wishlist.delete(product);
        button.classList.remove('active');
        showToast(`Removed "${product}" from wishlist`);
      } else {
        wishlist.add(product);
        button.classList.add('active');
        showToast(`Saved "${product}" to wishlist ♡`);
      }

      wishlistCountBadge.textContent = wishlist.size;
    });
  });

  // ---------------------------------------------------------------------------
  // Mobile Navigation Drawer
  // ---------------------------------------------------------------------------
  function openMobileMenu() {
    mobileDrawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileDrawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
  if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
  if (mobileDrawerOverlay) {
    mobileDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === mobileDrawerOverlay) closeMobileMenu();
    });
  }
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // ---------------------------------------------------------------------------
  // Search Modal
  // ---------------------------------------------------------------------------
  function openSearch() {
    searchModal.classList.add('active');
    setTimeout(() => searchInput.focus(), 100);
  }

  function closeSearch() {
    searchModal.classList.remove('active');
  }

  searchBtn.addEventListener('click', openSearch);
  closeSearchBtn.addEventListener('click', closeSearch);
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearch();
  });

  quickTagBtns.forEach(tag => {
    tag.addEventListener('click', () => {
      searchInput.value = tag.textContent.trim();
      showToast(`Showing drops for "${searchInput.value}"`);
      setTimeout(closeSearch, 400);
    });
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchInput.value.trim()) {
        showToast(`Searching for "${searchInput.value.trim()}"...`);
        closeSearch();
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Newsletter Form
  // ---------------------------------------------------------------------------
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();
      if (email) {
        showToast(`✦ Welcome to the Club! 10% coupon sent to ${email}`);
        newsletterEmail.value = '';
      }
    });
  }

  // Checkout Button
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your bag is empty!');
        return;
      }
      showToast('Proceeding to Secure Checkout...');
      setTimeout(() => {
        alert('Thank you for exploring STYLE 365! Checkout simulation completed.');
        closeCart();
      }, 700);
    });
  }

  // ---------------------------------------------------------------------------
  // Toast Helper
  // ---------------------------------------------------------------------------
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `
      <span class="text-brand-purple">✦</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ---------------------------------------------------------------------------
  // Mobile Dock
  // ---------------------------------------------------------------------------
  if (dockCartBtn) dockCartBtn.addEventListener('click', openCart);
  if (dockSearchBtn) dockSearchBtn.addEventListener('click', openSearch);

  // Highlight the dock tab for the section currently in view
  const dockSections = ['new-in', 'collections']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function updateDock() {
    let current = 'home';
    dockSections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.3) current = sec.id;
    });
    if (current === 'home' && window.scrollY > window.innerHeight) current = '';
    dockItems.forEach(item => item.classList.toggle('active', item.dataset.dock === current));
  }

  // ---------------------------------------------------------------------------
  // Header Scroll State
  // ---------------------------------------------------------------------------
  function onScroll() {
    siteHeader.classList.toggle('scrolled', window.scrollY > 12);
    updateDock();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------------------
  // Scroll Reveal (staggered per grid)
  // ---------------------------------------------------------------------------
  const revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    if (siblings.length > 1) el.style.setProperty('--d', `${siblings.indexOf(el) * 90}ms`);
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---------------------------------------------------------------------------
  // Escape closes any open overlay
  // ---------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeCart();
    closeMobileMenu();
    closeSearch();
  });

  // Initialize Cart display
  renderCart();
});
