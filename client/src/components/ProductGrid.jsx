import { useState } from "react";

/**
 * ProductGrid — displays filtered products with highlight on first match
 * Props:
 *  products: Product[]
 *  highlightFirst: boolean
 *  onAddToCart: (product) => void
 *  loading: boolean
 */
export default function ProductGrid({ products = [], highlightFirst = false, onAddToCart, loading = false }) {
  const [addedId, setAddedId] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const handleAdd = (product) => {
    setAddedId(product._id);
    onAddToCart?.(product);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleImgError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-slate-800/60 border border-slate-700/50 overflow-hidden animate-pulse">
            <div className="h-56 bg-slate-700/60" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
              <div className="h-8 bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-4">
        <svg className="w-16 h-16 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm">Try a different voice command or clear filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {products.map((product, idx) => {
        const isFirst = highlightFirst && idx === 0;
        const isAdded = addedId === product._id;
        const imgFailed = imgErrors[product._id];

        return (
          <div
            key={product._id}
            className={`group relative rounded-2xl border overflow-hidden 
              transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
              ${isFirst
                ? "border-violet-500/70 bg-gradient-to-b from-violet-900/30 to-slate-800/80 shadow-xl shadow-violet-500/20 ring-2 ring-violet-500/40"
                : "border-slate-700/50 bg-slate-800/60 hover:border-slate-600/70"
              }`}
          >
            {/* First match badge */}
            {isFirst && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 
                rounded-full bg-violet-500 text-white text-xs font-bold shadow-lg">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Best Match
              </div>
            )}

            {/* Stock badge */}
            {product.stock <= 5 && (
              <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full 
                bg-red-500/90 text-white text-xs font-semibold">
                Only {product.stock} left!
              </div>
            )}

            {/* Product Image */}
            <div className="relative h-56 overflow-hidden bg-slate-700/40">
              {!imgFailed ? (
                <img
                  src={product.images?.[0]}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => handleImgError(product._id)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              {/* Color dot */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 
                rounded-full bg-black/50 backdrop-blur-sm text-xs text-white">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/30 flex-shrink-0"
                  style={{ backgroundColor: product.color }}
                />
                {product.color}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">
                  {product.category}
                </p>
                <h3 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2" title={product.title}>
                  {product.title}
                </h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-white">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-500">
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAdd(product)}
                disabled={product.stock === 0}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
                  ${isAdded
                    ? "bg-emerald-500 text-white scale-95"
                    : product.stock === 0
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : isFirst
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
                    : "bg-slate-700 hover:bg-violet-600/80 text-slate-200 hover:text-white"
                  }`}
              >
                {isAdded ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Added!
                  </span>
                ) : product.stock === 0 ? (
                  "Out of Stock"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </span>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
