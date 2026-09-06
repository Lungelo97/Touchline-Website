// Pre-loaded Products (Matching our schema.sql inserts)
// Hardcoded backup products to display if the database is initializing
const fallbackProducts = [
  {
    id: 'prod-hoodie-01',
    name: 'Mambisa Golden Boy Hoodie',
    price: 45000, // R450.00
    image_url: 'https://unsplash.com'
  }
];

const products = [
  { id: 'prod_1', name: 'Touchline Truth Hoodie (Black/Gold)', price_cents: 65000, image_url: 'https://placehold.co/400x400/111/D4AF37?text=Hoodie' },
  { id: 'prod_2', name: 'S.O.O.N 2 Album Vinyl', price_cents: 35000, image_url: 'https://placehold.co/400x400/111/D4AF37?text=Vinyl' },
  { id: 'prod_3', name: 'Touchline Signature Cap', price_cents: 25000, image_url: 'https://placehold.co/400x400/111/D4AF37?text=Cap' }
];

let cart = JSON.parse(localStorage.getItem('touchline_cart')) || [];
let chatHistory = [];

// DOM Elements
const productGrid = document.getElementById('productGrid');
const cartToggle = document.getElementById('cartToggle');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const checkoutForm = document.getElementById('checkoutForm');
const submitCheckoutBtn = document.getElementById('submitCheckoutBtn');

// Chat Elements
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatWindow = document.getElementById('chatWindow');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

function init() {
  renderProducts();
  updateCartUI();
  setupEventListeners();
}

function formatZAR(cents) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(cents / 100);
}

function renderProducts() {
  productGrid.innerHTML = products.map(p => `
    <div class="bg-darker border border-gray-800 rounded-xl overflow-hidden group hover:border-gold/50 transition-colors">
      <div class="aspect-square bg-black overflow-hidden relative">
        <img src="${p.image_url}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
      </div>
      <div class="p-6">
        <h3 class="text-lg font-bold text-white mb-2 line-clamp-1">${p.name}</h3>
        <div class="flex justify-between items-center mt-4">
          <span class="text-gold font-bold text-xl">${formatZAR(p.price_cents)}</span>
          <button onclick="addToCart('${p.id}')" class="px-4 py-2 border border-gold text-gold rounded hover:bg-gold hover:text-dark transition font-medium text-sm">Add to Bag</button>
        </div>
      </div>
    </div>
  `).join('');
}
