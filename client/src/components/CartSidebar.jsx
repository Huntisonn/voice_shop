import { useEffect, useRef } from "react";

/**
 * CartSidebar — slide-in panel with cart items, total, and checkout
 * Props:
 *  open: boolean
 *  onClose: () => void
 *  items: Array<{ product, qty }>
 *  onRemoveLast: () => void
 *  onCheckout: () => void
 *  checkoutStatus: null | "loading" | "success" | "error"
 */
export default function CartSidebar({ open, onClose, items = [], onRemoveLast, onCheckout, checkoutStatus }) {
  const sidebarRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    if (open) sidebarRef.current?.focus();
  }, [open]);

  const total = items.reduce((sum, { product, qty }) => sum + product.price * qty, 0);
  const itemCount = items.reduce((sum, { qty }) => sum + qty, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 
          bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50
          flex flex-col shadow-2xl transition-transform duration-300 ease-out outline-none
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-lg font-bold text-white">Cart</h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
              <svg className="w-16 h-16 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-center">
                <p className="font-medium">Your cart is empty</p>
                <p className="text-sm mt-1">Say "add to cart" to add items!</p>
              </div>
            </div>
          ) : (
            items.map(({ product, qty }, idx) => (
              <div
                key={`${product._id}-${idx}`}
                className="flex gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40
                  hover:border-slate-600/60 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{product.title}</p>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">{product.category} · {product.color}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-white">
                      ₹{(product.price * qty).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                      Qty: {qty}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-700/50 space-y-4">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Shipping</span>
                <span className="text-emerald-400">Free</span>
              </div>
              <div className="h-px bg-slate-700" />
              <div className="flex justify-between font-bold text-white">
                <span>Total</span>
                <span className="text-xl">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Checkout status */}
            {checkoutStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Order placed successfully!
              </div>
            )}
            {checkoutStatus === "error" && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                Checkout failed. Please try again.
              </div>
            )}

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onRemoveLast}
                className="py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium
                  hover:border-red-500/60 hover:text-red-300 transition-colors"
              >
                Remove Last
              </button>
              <button
                onClick={onCheckout}
                disabled={checkoutStatus === "loading" || checkoutStatus === "success"}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                  ${checkoutStatus === "loading"
                    ? "bg-violet-700 text-violet-300 cursor-wait"
                    : checkoutStatus === "success"
                    ? "bg-emerald-600 text-white"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30"
                  }`}
              >
                {checkoutStatus === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Processing…
                  </span>
                ) : checkoutStatus === "success" ? (
                  "✓ Done"
                ) : (
                  "Checkout"
                )}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
