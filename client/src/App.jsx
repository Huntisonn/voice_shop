import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import useVoiceCommands from "./hooks/useVoiceCommands";
import parseIntent from "./utils/parseIntent";
import localProducts from "./data/products";
import VoiceFeedback from "./components/VoiceFeedback";
import ProductGrid from "./components/ProductGrid";
import CartSidebar from "./components/CartSidebar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Merge qty for duplicate products in cart
function mergeCartItems(items) {
  const map = new Map();
  for (const item of items) {
    const id = item.product._id;
    if (map.has(id)) {
      map.get(id).qty += item.qty;
    } else {
      map.set(id, { ...item });
    }
  }
  return Array.from(map.values());
}

export default function App() {
  // ── Products state ──────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState(localProducts);
  const [filteredProducts, setFilteredProducts] = useState(localProducts);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  // ── Filters state ───────────────────────────────────────────────
  const [filters, setFilters] = useState({
    category: null,
    color: null,
    priceMax: null,
    priceMin: null,
    search: "",
  });
  const [activeCategory, setActiveCategory] = useState("all");

  // ── Cart state ──────────────────────────────────────────────────
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("vs_token"));

  // ── Intent state ────────────────────────────────────────────────
  const [intent, setIntent] = useState(null);

  // ── Voice hook ──────────────────────────────────────────────────
  const { transcript, listening, startListening, stopListening, error: voiceError } =
    useVoiceCommands({
      onResult: handleVoiceResult,
    });

  // Space bar shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (listening) stopListening();
        else startListening();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [listening, startListening, stopListening]);

  // ── Bootstrap: try to reach API, auto-login guest ───────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products`, { timeout: 3000 });
        if (res.data?.products) {
          setAllProducts(res.data.products);
          setApiOnline(true);
        }
      } catch {
        // Server unreachable → use local data silently
        setApiOnline(false);
      }

      // Auto-login if no token
      if (!token) {
        try {
          const res = await axios.post(`${API_URL}/api/auth/login`, {
            email: "guest@voiceshop.in",
            password: "guest123",
          });
          const t = res.data?.token;
          if (t) {
            localStorage.setItem("vs_token", t);
            setToken(t);
          }
        } catch {
          // Ignore auth failure — cart will work locally
        }
      }
    };
    init();
  }, []);

  // ── Apply filters whenever filters or allProducts change ─────────
  useEffect(() => {
    let results = [...allProducts];

    if (filters.category) {
      results = results.filter((p) => p.category === filters.category);
    }
    if (filters.color) {
      results = results.filter((p) =>
        p.color?.toLowerCase().includes(filters.color.toLowerCase())
      );
    }
    if (filters.priceMax != null) {
      results = results.filter((p) => p.price <= filters.priceMax);
    }
    if (filters.priceMin != null) {
      results = results.filter((p) => p.price >= filters.priceMin);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.color?.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(results);
  }, [filters, allProducts]);

  // ── Voice result handler ─────────────────────────────────────────
  async function handleVoiceResult(text) {
    const parsed = await parseIntent(text);
    setIntent(parsed);

    switch (parsed.action) {
      case "search":
        handleSearch(parsed);
        break;
      case "addToCart":
        handleAddFirstToCart(parsed);
        break;
      case "removeFromCart":
        handleRemoveLast();
        break;
      case "checkout":
        handleCheckout();
        setCartOpen(true);
        break;
      case "nextPage":
        // Future: pagination
        break;
      default:
        if (parsed.category || parsed.color || parsed.priceMax || parsed.priceMin) {
          handleSearch(parsed);
        }
    }
  }

  function handleSearch(parsed) {
    setFilters((prev) => ({
      ...prev,
      category: parsed.category ?? prev.category,
      color: parsed.color ?? prev.color,
      priceMax: parsed.priceMax ?? prev.priceMax,
      priceMin: parsed.priceMin ?? prev.priceMin,
    }));
    if (parsed.category) setActiveCategory(parsed.category);

    // Fetch from API if online
    if (apiOnline) {
      const params = {};
      if (parsed.category) params.category = parsed.category;
      if (parsed.color) params.color = parsed.color;
      if (parsed.priceMax) params.price_max = parsed.priceMax;
      if (parsed.priceMin) params.price_min = parsed.priceMin;
      setLoading(true);
      axios
        .get(`${API_URL}/api/products`, { params })
        .then((r) => { if (r.data?.products) setAllProducts(r.data.products); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }

  function handleAddFirstToCart(parsed) {
    // If there are filtered products, add the first one
    let pool = filteredProducts;
    if (parsed.category) pool = pool.filter((p) => p.category === parsed.category);
    if (parsed.color) pool = pool.filter((p) => p.color?.toLowerCase().includes(parsed.color));
    const target = pool[0] || filteredProducts[0] || allProducts[0];
    if (!target) return;
    addToCart(target);
  }

  function addToCart(product) {
    setCartItems((prev) => mergeCartItems([...prev, { product, qty: 1 }]));
    setCartOpen(true);

    if (apiOnline && token) {
      axios
        .post(
          `${API_URL}/api/cart/add`,
          { productId: product._id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(() => {});
    }
  }

  function handleRemoveLast() {
    setCartItems((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last.qty > 1) {
        copy[copy.length - 1] = { ...last, qty: last.qty - 1 };
      } else {
        copy.pop();
      }
      return copy;
    });

    if (apiOnline && token) {
      axios
        .delete(`${API_URL}/api/cart/last`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) return;
    setCheckoutStatus("loading");

    try {
      if (apiOnline && token) {
        await axios.post(
          `${API_URL}/api/orders/checkout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await new Promise((r) => setTimeout(r, 800)); // UX delay
      setCheckoutStatus("success");
      setTimeout(() => {
        setCartItems([]);
        setCheckoutStatus(null);
      }, 2000);
    } catch {
      setCheckoutStatus("error");
      setTimeout(() => setCheckoutStatus(null), 3000);
    }
  }

  function clearFilters() {
    setFilters({ category: null, color: null, priceMax: null, priceMin: null, search: "" });
    setActiveCategory("all");
    setIntent(null);
    setAllProducts(localProducts);
    setFilteredProducts(localProducts);
  }

  const categories = ["all", "shirts", "jeans", "kurtas", "shoes", "phones"];
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const hasFilters = filters.category || filters.color || filters.priceMax || filters.priceMin;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Voice Feedback bar */}
      <VoiceFeedback
        listening={listening}
        transcript={transcript}
        intent={intent}
        error={voiceError}
        onStart={startListening}
        onStop={stopListening}
      />

      {/* Main content — offset for top bar */}
      <div className="pt-14">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="sticky top-14 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 mr-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2z"/>
                  <path d="M19 11a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V22h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.062A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 1-1z"/>
                </svg>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent hidden sm:block">
                VoiceShop
              </span>
            </div>

            {/* Category tabs */}
            <nav className="flex gap-1.5 overflow-x-auto flex-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    if (cat === "all") {
                      clearFilters();
                    } else {
                      setFilters((f) => ({ ...f, category: cat }));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all duration-200
                    ${activeCategory === cat
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </nav>

            {/* Right: search + cart */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Text search */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search products…"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-48 pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 
                    text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </div>

              {/* API status dot */}
              <div
                title={apiOnline ? "Connected to server" : "Using local data"}
                className={`w-2 h-2 rounded-full flex-shrink-0 ${apiOnline ? "bg-emerald-400" : "bg-slate-600"}`}
              />

              {/* Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label={`Open cart (${cartCount} items)`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-600 
                    text-white text-xs font-bold flex items-center justify-center leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Active filters:</span>
              {filters.category && (
                <FilterChip label={`Category: ${filters.category}`} onRemove={() => setFilters((f) => ({ ...f, category: null }))} />
              )}
              {filters.color && (
                <FilterChip label={`Color: ${filters.color}`} onRemove={() => setFilters((f) => ({ ...f, color: null }))} />
              )}
              {filters.priceMin != null && (
                <FilterChip label={`Min: ₹${filters.priceMin}`} onRemove={() => setFilters((f) => ({ ...f, priceMin: null }))} />
              )}
              {filters.priceMax != null && (
                <FilterChip label={`Max: ₹${filters.priceMax}`} onRemove={() => setFilters((f) => ({ ...f, priceMax: null }))} />
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-red-400 hover:text-red-300 transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </header>

        {/* ── Hero / Intro (only when no filters) ─────────── */}
        {!hasFilters && !filters.search && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Shop with Your Voice
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-6">
              Press <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-sm font-mono">Space</kbd> or tap the mic,
              then say things like <em className="text-violet-300">"show me red shirts under 1000"</em> or{" "}
              <em className="text-violet-300">"add to cart"</em>.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "show me blue jeans",
                "red shirts under 1000",
                "add to cart",
                "kurtas below 3000",
                "checkout",
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleVoiceResult(cmd)}
                  className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 
                    text-sm text-slate-300 hover:border-violet-500 hover:text-violet-300 transition-all duration-200"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Results count ────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-slate-500">
              {loading ? "Loading…" : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
        </div>

        {/* ── Product Grid ─────────────────────────────────── */}
        <main className="max-w-7xl mx-auto">
          <ProductGrid
            products={filteredProducts}
            highlightFirst={!!transcript && filteredProducts.length > 0}
            onAddToCart={addToCart}
            loading={loading}
          />
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-slate-600 text-sm border-t border-slate-800/50 mt-8">
          VoiceShop · Voice-powered e-commerce for India
        </footer>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemoveLast={handleRemoveLast}
        onCheckout={handleCheckout}
        checkoutStatus={checkoutStatus}
      />
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 
      border border-violet-500/30 text-violet-300 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-red-300 transition-colors" aria-label={`Remove ${label} filter`}>
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </button>
    </span>
  );
}
