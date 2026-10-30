import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, ShieldCheck, MapPin, Receipt, ArrowRight, Ban, Navigation } from 'lucide-react';
import { api } from '../api';
import { Order } from '../types';
import { DeliveryMap } from './DeliveryMap';

interface OrderTrackingModalProps {
  orderId: number | null;
  onClose: () => void;
  onOrderCancelled?: () => void;
}

const STATUS_STEPS = [
  'Placed',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  orderId,
  onClose,
  onOrderCancelled,
}) => {
  const [details, setDetails] = useState<{
    order: Order;
    items: any[];
    timeline: any[];
    calculatedSubtotal: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchDetails = async (showLoading = false) => {
    if (!orderId) return;
    try {
      if (showLoading) setIsLoading(true);
      const res = await api.getOrderDetails(orderId);
      setDetails(res);
    } catch (err: any) {
      if (showLoading) setError(err.message || 'Failed to load order details.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(true);
    // Real-time synchronization polling every 3.5 seconds
    const interval = setInterval(() => {
      fetchDetails(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!orderId) return null;

  const handleCancelOrder = async () => {
    if (!orderId) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      setIsCancelling(true);
      await api.cancelOrder(orderId);
      await fetchDetails();
      if (onOrderCancelled) onOrderCancelled();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStatus = details?.order.status || 'Placed';
  const isCancelled = currentStatus === 'Cancelled';
  const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">Order #{orderId}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isCancelled
                  ? 'bg-red-100 text-red-800'
                  : currentStatus === 'Delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {currentStatus}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {details?.order.restaurant_name} · Placed {details?.order.created_at ? new Date(details.order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-stone-400 text-xs">Loading order status...</div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          ) : details && (
            <>
              {/* Order Status Stepper */}
              {!isCancelled ? (
                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                        Live Delivery Tracking
                      </span>
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Live GPS Route
                      </span>
                    </div>
                    <div className="relative flex items-center justify-between">
                      {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = currentStepIndex >= idx;
                        const isCurrent = currentStepIndex === idx;

                        return (
                          <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isCompleted
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-stone-200 text-stone-500'
                              } ${isCurrent ? 'ring-4 ring-rose-100 scale-110' : ''}`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 text-center leading-tight font-medium max-w-[65px] ${
                                isCurrent
                                  ? 'text-rose-600 font-bold'
                                  : isCompleted
                                  ? 'text-stone-800'
                                  : 'text-stone-400'
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leaflet Live Map Integration */}
                  <DeliveryMap
                    orderStatus={currentStatus}
                    customerCoords={{
                      lat: 13.0450,
                      lng: 80.2380,
                      address: details.order.delivery_address_snapshot || 'Chennai, Tamil Nadu',
                    }}
                    restaurantCoords={{
                      lat: 13.0850,
                      lng: 80.2101,
                      name: details.order.restaurant_name || 'Restaurant Kitchen',
                    }}
                    className="h-64 sm:h-72 w-full rounded-2xl shadow-sm"
                  />
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-3">
                  <Ban className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs">Order Cancelled</h5>
                    <p className="text-[11px] opacity-90">This order has been cancelled and your payment was refunded.</p>
                  </div>
                </div>
              )}

              {/* Status Updates */}
              {details.timeline && details.timeline.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Order Status Updates
                  </h4>
                  <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-2">
                    {details.timeline.map((event: any, i: number) => (
                      <div key={i} className="flex items-start justify-between text-xs gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1" />
                          <div>
                            <span className="font-bold text-stone-800">{event.new_status}</span>
                            <span className="text-stone-400 text-[11px]"> · {event.actor}</span>
                            {event.notes && (
                              <p className="text-[11px] text-stone-500 mt-0.5">{event.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-400 tabular-nums shrink-0">
                          {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Order Items ({details.items.length})
                </h4>
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                  {details.items.map((item: any, i: number) => (
                    <div key={i} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-stone-900">{item.item_name}</span>
                        <p className="text-stone-500 text-[11px]">
                          Qty: {item.quantity} × ₹{Number(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold text-stone-900 tabular-nums">
                        ₹{Number(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-1.5 text-stone-500 font-medium mb-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delivery Location</span>
                  </div>
                  <p className="text-stone-800 font-medium">{details.order.delivery_address_snapshot}</p>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-1.5 text-stone-500 font-medium mb-1">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment Information</span>
                  </div>
                  <p className="text-stone-800 font-medium">
                    {details.order.payment_method || 'UPI'} · {details.order.payment_status || 'Completed'}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                    Ref: {details.order.transaction_ref}
                  </p>
                </div>
              </div>

              {/* Total Summary */}
              <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Item Subtotal</span>
                  <span className="font-semibold tabular-nums">₹{details.calculatedSubtotal.toFixed(2)}</span>
                </div>
                {Number(details.order.loyalty_discount) > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Loyalty Discount ({details.order.loyalty_percentage}%)</span>
                    <span className="tabular-nums">- ₹{Number(details.order.loyalty_discount).toFixed(2)}</span>
                  </div>
                )}
                {Number(details.order.coupon_discount) > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Coupon ({details.order.applied_coupon_code})</span>
                    <span className="tabular-nums">- ₹{Number(details.order.coupon_discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">₹{Number(details.order.delivery_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-100">
                  <span>Grand Total</span>
                  <span className="tabular-nums text-rose-600">₹{Number(details.order.final_total).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          {(currentStatus === 'Placed' || currentStatus === 'Confirmed') && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
