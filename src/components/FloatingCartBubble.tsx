import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const FloatingCartBubble: React.FC = () => {
  const { cart, isCartOpen, openCart } = useCart();

  if (!cart || cart.itemCount === 0 || isCartOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg animate-bounce-in">
      <div className="bg-stone-900 text-white p-3.5 sm:px-5 rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="text-stone-500">|</span>
              <span className="text-sm font-extrabold text-rose-400 tabular-nums">
                ₹{cart.subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 truncate">
              From {cart.restaurantName || 'Selected Restaurant'}
            </p>
          </div>
        </div>

        <button
          onClick={openCart}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow-rose-600/30 active:scale-95"
        >
          <span>View Cart</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
