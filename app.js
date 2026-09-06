// Hardcoded backup product to display if the database is initializing
const fallbackProducts = [
  {
    id: 'prod-hoodie-01',
    name: 'Mambisa Golden Boy Hoodie',
    price: 45000, // R450.00
    image_url: 'https://unsplash.com'
  }
];

// Shopping Cart Core Logic Arrays
let cart = JSON.parse(localStorage.getItem('touchline_cart')) || [];

function saveCart() {
  localStorage.setItem('touchline_cart', JSON.stringify(cart));
  updateCartUI();
}

// Attach addToCart to window global scope so index.html click events can hit it
window.addToCart = function(productId, name, priceCents) {
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, name: name, price: priceCents, quantity: 1 });
  }
  saveCart();
  
  // Auto open cart drawer layout when item is added to celebrate!
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.className = drawer.className.replace('drawer-closed', 'drawer-open');
};

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');

  if (cartCount) cartCount.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (cartItems) {
    if (cart.length === 0) {
      cartItems.innerHTML = '<p class="text-gray-500 text-center py-8">Your bag is empty.</p>';
    } else {
      cartItems.innerHTML = cart.map(item => `
        <div class="flex justify-between items-center bg-darker p-4 border border-gray-800 rounded-lg">
          <div>
            <h4 class="font-bold text-sm">${item.name}</h4>
            <p class="text-gold text-xs">R ${(item.price / 100).toFixed(2)} x ${item.quantity}</p>
          </div>
          <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-400 text-xs font-bold">Remove</button>
        </div>
      `).join('');
    }
  }

  if (cartTotal) {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotal.innerText = `R ${(total / 100).toFixed(2)}`;
  }
}

window.removeFromCart = function(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
};

// UI Toggles & Drawers
document.addEventListener('DOMContentLoaded', () => {
  const cartToggle = document.getElementById('cartToggle');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const checkoutForm = document.getElementById('checkoutForm');

  if (cartToggle && cartDrawer) {
    cartToggle.addEventListener('click', () => {
      cartDrawer.className = cartDrawer.className.replace('drawer-closed', 'drawer-open');
    });
  }

  if (closeCartBtn && cartDrawer) {
    closeCartBtn.addEventListener('click', () => {
      cartDrawer.className = cartDrawer.className.replace('drawer-open', 'drawer-closed');
    });
  }

  if (checkoutBtn && checkoutModal) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert("Your bag is empty!");
        return;
      }
      checkoutModal.classList.remove('hidden');
    });
  }

  if (closeModalBtn && checkoutModal) {
    closeModalBtn.addEventListener('click', () => {
      checkoutModal.classList.add('hidden');
    });
  }

  // Handle Checkout submission pipeline
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitCheckoutBtn');
      if (submitBtn) submitBtn.innerText = "Processing...";

      try {
        // Using Cloudflare Pages native route structure mapping
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: document.getElementById('custName').value,
            customerEmail: document.getElementById('custEmail').value,
            shippingAddress: document.getElementById('custAddress').value,
            cartItems: cart
          })
        });

        const data = await response.json();
        if (data.redirectUrl) {
          localStorage.removeItem('touchline_cart'); // Clear basket locally on success
          window.location.href = data.redirectUrl; // Force route shift straight over to secure Yoco portal
        } else {
          alert(`Checkout Failed: ${data.error || "Unknown Response Error Context Structure"}`);
          if (submitBtn) submitBtn.innerText = "Pay securely via Yoco";
        }
      } catch (err) {
        // Upgraded diagnostic catcher reveals hidden server error details directly on screen
        alert(`Server Error Details: ${err.message}`);
        if (submitBtn) submitBtn.innerText = "Pay securely via Yoco";
      }
    });
  }

  // AI Chat Bot Frontend Script
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatWindow = document.getElementById('chatWindow');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  if (chatToggleBtn && chatWindow) {
    chatToggleBtn.addEventListener('click', () => chatWindow.classList.toggle('hidden'));
  }
  if (closeChatBtn && chatWindow) {
    closeChatBtn.addEventListener('click', () => chatWindow.classList.add('hidden'));
  }

  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      // Render Fan text on canvas bubble
      chatMessages.innerHTML += `<div class="flex justify-end"><div class="bg-gold text-dark px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] font-medium">${userText}</div></div>`;
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Add a loading placeholder bubble for Touchline Bot
      const loadId = `load-${Date.now()}`;
      chatMessages.innerHTML += `<div id="${loadId}" class="flex items-start gap-2"><div class="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-tl-sm max-w-[85%] italic">Typing...</div></div>`;

      try {
        const res = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: userText })
        });
        const data = await res.json();
        
        document.getElementById(loadId).remove(); // Clear placeholder ticker
        chatMessages.innerHTML += `<div class="flex items-start gap-2"><div class="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-tl-sm max-w-[85%]">${data.response}</div></div>`;
      } catch {
        document.getElementById(loadId).remove();
        chatMessages.innerHTML += `<div class="flex items-start gap-2"><div class="bg-red-950 text-red-200 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[85%]">Bot connection offline. Verify GEMINI_API_KEY environment variable tokens in settings bindings context.</div></div>`;
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  // Load Merchandise Function Loop
  async function renderPageProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    try {
      const res = await fetch('/api/products');
      const products = await res.json();
      const itemsToRender = (products && products.length > 0) ? products : fallbackProducts;
      displayItems(itemsToRender);
    } catch {
      displayItems(fallbackProducts); // Force backup layout trigger automatically if DB or endpoint is unconfigured
    }
  }

  function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map(p => `
      <div class="bg-dark border border-gold/10 rounded-xl overflow-hidden p-6 hover:border-gold/30 transition shadow-lg">
        <img src="${p.image_url}" class="w-full h-64 object-cover rounded-lg mb-4" />
        <h3 class="font-display font-bold text-lg mb-2">${p.name}</h3>
        <p class="text-gold font-bold mb-4">R ${(p.price / 100).toFixed(2)}</p>
        <button onclick="addToCart('${p.id}', '${p.name}', ${p.price})" class="w-full py-3 bg-gold text-dark font-bold rounded hover:bg-yellow-500 transition">Add to Bag</button>
      </div>
    `).join('');
  }

  renderPageProducts();
  updateCartUI();
});
