const API_BASE = '/api';

const api = {

  // AUTH
  async register(name, email, password) {
    return _post(`${API_BASE}/auth.php?action=register`, { name, email, password });
  },
  async login(email, password) {
    return _post(`${API_BASE}/auth.php?action=login`, { email, password });
  },
  async logout() {
    return _post(`${API_BASE}/auth.php?action=logout`);
  },
  async me() {
    return _get(`${API_BASE}/auth.php?action=me`);
  },

  // PRODUCTS
  async getProducts(limit = 100) {
    return _get(`${API_BASE}/products.php?limit=${limit}`);
  },
  async getProduct(id) {
    return _get(`${API_BASE}/products.php?id=${id}`);
  },
  async searchProducts(query) {
    return _get(`${API_BASE}/products.php?search=${encodeURIComponent(query)}`);
  },

  // ORDERS
  async placeOrder(items) {
    return _post(`${API_BASE}/cart.php?action=place`, { items });
  },
  async myOrders() {
    return _get(`${API_BASE}/cart.php?action=my_orders`);
  },
  async getOrder(id) {
    return _get(`${API_BASE}/cart.php?action=order&id=${id}`);
  },

  // CONTACT
  async sendContact(name, email, message) {
    return _post(`${API_BASE}/contact.php`, { name, email, message });
  },

  // BLOG
  async getPosts(limit = 20) {
    return _get(`${API_BASE}/blog.php?limit=${limit}`);
  },
  async getPost(id) {
    return _get(`${API_BASE}/blog.php?id=${id}`);
  },
};

// CART (stored in localStorage)
const cart = {
  get() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  },
  add(productId, quantity = 1) {
    const items = this.get();
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ product_id: productId, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(items));
  },
  remove(productId) {
    const items = this.get().filter(i => i.product_id !== productId);
    localStorage.setItem('cart', JSON.stringify(items));
  },
  clear() {
    localStorage.removeItem('cart');
  },
  count() {
    return this.get().reduce((sum, i) => sum + i.quantity, 0);
  },
  async checkout() {
    const items = this.get();
    if (!items.length) return { error: 'Cart is empty.' };
    const result = await api.placeOrder(items);
    if (result.success) this.clear();
    return result;
  }
};

// HELPERS
async function _get(url) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    return await res.json();
  } catch (err) {
    console.error('API GET error:', err);
    return { error: 'Network error' };
  }
}

async function _post(url, body = {}) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error('API POST error:', err);
    return { error: 'Network error' };
  }
}