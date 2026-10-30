import React, { useState, useEffect } from 'react';
import { Package, Clock, ArrowRight, CheckCircle2, RotateCcw, AlertCircle, ShoppingBag } from 'lucide-react';
import { Order } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { OrderTrackingModal } from '../components/OrderTrackingModal';

interface OrdersViewProps {
  onBrowseFood: () => void;
  onOpenAuthModal: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onBrowseFood, onOpenAuthModal }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getOrders();
      setOrders(res.orders);
    } catch (err: any) {
      setError(err.message || 'Failed to load order history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="py-20 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-stone-900 text-lg">Sign in to view your orders</h3>
        <p className="text-xs text-stone-500">
          Track active deliveries and review your previous orders from CraveCart.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
        >
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-stone-900">My Orders</h2>
          <p className="text-xs text-stone-500">Track current orders and view past receipts</p>
        </div>
        <button
          onClick={onBrowseFood}
          className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
        >
          Order Food
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-stone-200 animate-pulse space-y-3">
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-stone-200 p-8">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-stone-900 text-base">No orders placed yet</h4>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Explore our curated selection of top restaurants and place your first order today!
          </p>
          <button
            onClick={onBrowseFood}
            className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Find Food Near You
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs hover:border-stone-300 transition-all space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                    <img
                      src={ord.restaurant_image || '/src/assets/images/biryani_specialty_1793294053906.jpg'}
                      alt={ord.restaurant_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">{ord.restaurant_name}</h3>
                    <p className="text-[11px] text-stone-500">
                      Order #{ord.id} · {new Date(ord.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    ord.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ord.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {ord.status}
                  </span>
                </div>
              </div>

              {/* Items Snapshot */}
              <div className="text-xs text-stone-600 space-y-1">
                {ord.items && ord.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity} × {item.itemName}</span>
                    <span className="tabular-nums font-medium text-stone-800">₹{Number(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              {/* Order Footer & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <div className="text-xs">
                  <span className="text-stone-500">Paid: </span>
                  <span className="font-extrabold text-sm text-stone-900 tabular-nums">
                    ₹{Number(ord.final_total).toFixed(2)}
                  </span>
                  {ord.loyalty_percentage > 0 && (
                    <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {ord.loyalty_percentage}% Loyalty Applied
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrderId(ord.id)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracking Modal */}
      <OrderTrackingModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onOrderCancelled={fetchOrders}
      />
    </div>
  );
};
