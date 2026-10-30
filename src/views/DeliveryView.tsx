import React, { useState, useEffect } from 'react';
import { Bike, MapPin, Phone, CheckCircle2, Clock, Navigation, AlertCircle, ArrowRight, IndianRupee, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { DeliveryMap } from '../components/DeliveryMap';

export const DeliveryView: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'map' | 'history'>('dispatch');
  const [tasks, setTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDeliveryData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [tasksRes, historyRes] = await Promise.all([
        api.getDeliveryTasks(),
        api.getDeliveryHistory(),
      ]);
      setTasks(tasksRes.tasks);
      setAgentInfo(tasksRes.agentInfo);
      setHistory(historyRes.deliveries);
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
    const interval = setInterval(fetchDeliveryData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      setActionSuccess(null);
      const res = await api.updateDeliveryStatus(orderId, newStatus);
      setActionSuccess(res.message);
      await fetchDeliveryData();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleConfirmCash = async (orderId: number) => {
    try {
      setActionSuccess(null);
      const res = await api.confirmCashCollection(orderId);
      setActionSuccess(res.message);
      await fetchDeliveryData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm cash collection.');
    }
  };

  const currentTask = tasks[0];

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Agent Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black">{user?.name || 'Vikram Delivery'}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white uppercase">
                Active Fleet
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Vehicle: Electric Scooter (TN-09-EQ-4491)
            </p>
            <p className="text-[11px] text-blue-300">
              Assigned Zone: Anna Nagar, T. Nagar &amp; Mylapore, Chennai
            </p>
          </div>
        </div>

        <button
          onClick={fetchDeliveryData}
          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl self-start sm:self-auto transition-colors"
        >
          Refresh Fleet
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'dispatch'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Active Deliveries ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'map'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Live GPS Route</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Completed History ({history.length})
        </button>
      </div>

      {/* Dispatch List Tab */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          {isLoading && tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">Loading deliveries...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
              No pending deliveries right now. All orders delivered safely!
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const isCOD = task.payment_method === 'Cash on Delivery';
                const isCashPending = isCOD && task.payment_status !== 'Completed';

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-stone-900">Order #{task.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            task.status === 'Out for Delivery' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-stone-900 mt-1">{task.restaurant_name}</h3>
                        <p className="text-[11px] text-stone-500">{task.restaurant_address}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-base font-black text-stone-900 tabular-nums">
                          ₹{Number(task.final_total).toFixed(2)}
                        </span>
                        <p className="text-[10px] text-stone-500">
                          {task.payment_method} ·{' '}
                          <span className={task.payment_status === 'Completed' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                            {task.payment_status || 'Pending'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Customer & Route Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Delivery Destination</span>
                        <p className="font-bold text-stone-900">{task.customer_name}</p>
                        <p className="text-stone-600 leading-tight">{task.delivery_address_snapshot}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Customer Contact</span>
                        <p className="font-medium text-stone-800 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{task.customer_phone || '+91 98400 12345'}</span>
                        </p>
                        {isCOD && (
                          <p className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            <span>Cash to collect: ₹{Number(task.final_total).toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {isCashPending && (
                        <button
                          onClick={() => handleConfirmCash(task.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Confirm Cash Collection (₹{Number(task.final_total).toFixed(0)})</span>
                        </button>
                      )}

                      {task.status !== 'Out for Delivery' && task.status !== 'Delivered' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'Out for Delivery')}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                        >
                          Pick Up &amp; Start Route
                        </button>
                      )}

                      {task.status === 'Out for Delivery' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'Delivered')}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Live Map Tab */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Active Delivery GPS Route</h3>
                <p className="text-xs text-stone-500">Live navigation from restaurant kitchen to customer address</p>
              </div>
              {currentTask && (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Navigating Order #{currentTask.id}
                </span>
              )}
            </div>

            <DeliveryMap
              orderStatus={currentTask?.status || 'Out for Delivery'}
              restaurantCoords={{
                lat: 13.0850,
                lng: 80.2101,
                name: currentTask?.restaurant_name || 'Biryani Darbar, Anna Nagar',
              }}
              customerCoords={{
                lat: 13.0450,
                lng: 80.2380,
                address: currentTask?.delivery_address_snapshot || 'T. Nagar, Chennai',
              }}
              className="h-96 w-full rounded-2xl shadow-sm"
            />
          </div>
        </div>
      )}

      {/* Completed History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-900">Delivered Trip History</h3>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden text-xs shadow-2xs">
            <table className="w-full text-left">
              <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5">Restaurant</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2.5 font-mono font-bold text-stone-900">#{h.id}</td>
                    <td className="px-4 py-2.5 text-stone-800">{h.restaurant_name}</td>
                    <td className="px-4 py-2.5 text-stone-600">{h.customer_name}</td>
                    <td className="px-4 py-2.5 font-bold tabular-nums">₹{Number(h.final_total).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right text-stone-400 tabular-nums">
                      {new Date(h.updated_at || h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
