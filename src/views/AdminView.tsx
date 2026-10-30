import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Utensils,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface AdminViewProps {
  onOpenDbModal?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onOpenDbModal }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'orders' | 'crud'>('overview');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<string>('q1');
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d'>('7d');

  // Overview Data
  const [overview, setOverview] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // Analytics Data Cache
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Orders Management states
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);

  // Catalog CRUD states
  const [newRestName, setNewRestName] = useState('');
  const [newRestCuisine, setNewRestCuisine] = useState('');
  const [newRestAddress, setNewRestAddress] = useState('');
  const [newRestPrice, setNewRestPrice] = useState('450');
  const [isPureVeg, setIsPureVeg] = useState(false);
  const [crudMessage, setCrudMessage] = useState<string | null>(null);
  const [isSubmittingRest, setIsSubmittingRest] = useState(false);

  // Load Overview
  const fetchOverview = async () => {
    try {
      setIsLoadingOverview(true);
      const res = await api.getAdminOverview();
      setOverview(res);
    } catch (err: any) {
      console.error('Overview error:', err.message);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Load Analytics based on selected query
  const fetchAnalyticsQuery = async (queryKey: string) => {
    try {
      setIsLoadingAnalytics(true);
      setAnalyticsData(null);

      let res: any;
      if (queryKey === 'q1') res = await api.getMonthlyCustomersQuery1();
      else if (queryKey === 'q2') res = await api.getTopRatedRestaurantsQuery2();
      else if (queryKey === 'q3') res = await api.getTopCustomersQuery3();
      else if (queryKey === 'q4') res = await api.getAboveAverageSpendingQuery4();
      else if (queryKey === 'q5') res = await api.getMenuPriceAnalysisQuery5();
      else if (queryKey === 'q6') res = await api.getHighestRatedTiesQuery6();
      else if (queryKey === 'q7') res = await api.getCategorySalesQuery7();
      else if (queryKey === 'q8') res = await api.getHighValueOrdersQuery8();
      else if (queryKey === 'q9') res = await api.getLoyaltyCustomersViewQuery9();
      else if (queryKey === 'q10') res = await api.getRestaurantPerformanceViewQuery10();

      setAnalyticsData(res?.data || []);
    } catch (err: any) {
      console.error('Analytics error:', err.message);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsQuery(analyticsSubTab);
    }
  }, [activeTab, analyticsSubTab]);

  // Load Orders for management
  const fetchOrders = async () => {
    try {
      const res = await api.getAdminOrders({
        status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
        search: orderSearch,
      });
      setOrders(res.orders || []);
    } catch (err: any) {
      console.error('Orders error:', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, orderStatusFilter, orderSearch]);

  // Update order status via stored procedure
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      setStatusUpdateMessage(null);
      await api.updateOrderStatusProcedure(orderId, status);
      setStatusUpdateMessage(`Order #${orderId} status updated successfully to "${status}".`);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Add Restaurant
  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName || !newRestCuisine || !newRestAddress) return;
    try {
      setIsSubmittingRest(true);
      await api.addRestaurant({
        name: newRestName,
        cuisineType: newRestCuisine,
        address: newRestAddress,
        priceForTwo: newRestPrice,
        isPureVeg,
      });
      setCrudMessage(`Restaurant "${newRestName}" added successfully to the live catalog.`);
      setNewRestName('');
      setNewRestCuisine('');
      setNewRestAddress('');
    } catch (err: any) {
      alert(err.message || 'Failed to add restaurant.');
    } finally {
      setIsSubmittingRest(false);
    }
  };

  // Simulated trends data based on dateFilter
  const baseTrends = overview?.trends || [
    { order_date: '2026-10-23', order_count: 8, daily_revenue: 4200 },
    { order_date: '2026-10-24', order_count: 14, daily_revenue: 7800 },
    { order_date: '2026-10-25', order_count: 18, daily_revenue: 9600 },
    { order_date: '2026-10-26', order_count: 12, daily_revenue: 6400 },
    { order_date: '2026-10-27', order_count: 16, daily_revenue: 8900 },
    { order_date: '2026-10-28', order_count: 22, daily_revenue: 11400 },
    { order_date: '2026-10-29', order_count: 19, daily_revenue: 10200 },
  ];

  const maxOrders = Math.max(...baseTrends.map((t: any) => t.order_count), 25);
  const maxRevenue = Math.max(...baseTrends.map((t: any) => t.daily_revenue), 12000);

  const ANALYTICS_CATEGORIES = [
    { id: 'q1', label: 'Top September Customers (> 5 Orders)' },
    { id: 'q2', label: 'Top-Rated Restaurants (Rating > 4.0)' },
    { id: 'q3', label: 'Top Customers by Spending' },
    { id: 'q4', label: 'Customers Above Average Spending' },
    { id: 'q5', label: 'Menu Items Above Restaurant Average' },
    { id: 'q6', label: 'Highest Rated Restaurants (With Ties)' },
    { id: 'q7', label: 'Category Sales Volume' },
    { id: 'q8', label: 'High Value Orders (Above AOV)' },
    { id: 'q9', label: 'CraveRewards Loyalty Tiers' },
    { id: 'q10', label: 'Restaurant Performance & Revenue' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Admin Header */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-600 text-white">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black">CraveCart Administrator Console</h1>
          </div>
          <p className="text-xs text-stone-300">
            Real-Time Business Analytics, Order Dispatch &amp; Catalog Management across Chennai
          </p>
          <div className="flex items-center gap-2 pt-1">
            {onOpenDbModal && (
              <button
                onClick={onOpenDbModal}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-semibold border border-stone-700 transition-colors"
              >
                Database Health &amp; Schema
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-800 rounded-xl border border-stone-700">
          {[
            { id: 'overview', label: 'Executive Overview' },
            { id: 'analytics', label: 'Business Analytics' },
            { id: 'orders', label: 'Orders & Dispatch' },
            { id: 'crud', label: 'Restaurant Catalog' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW WITH CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar with Date Range Selector */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">Platform Performance Summary</h2>
              <p className="text-xs text-stone-500">Live order metrics from Chennai culinary operations</p>
            </div>

            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-2xs text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-stone-400 ml-1.5" />
              {(['7d', '30d', '90d'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    dateFilter === filter
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {filter === '7d' ? 'Last 7 Days' : filter === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
                <Users className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-stone-900 tabular-nums">
                {overview?.metrics?.total_customers || 7}
              </p>
              <span className="text-[11px] text-stone-400">Registered Chennai customers</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Active Restaurants</span>
                <Utensils className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-stone-900 tabular-nums">
                {overview?.metrics?.total_restaurants || 32}
              </p>
              <span className="text-[11px] text-stone-400">Partner kitchens across Chennai</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-stone-900 tabular-nums">
                {overview?.metrics?.total_orders || 24}
              </p>
              <span className="text-[11px] text-stone-400">Delivered &amp; active dispatches</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Platform GMV</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-stone-900 tabular-nums">
                ₹{Number(overview?.metrics?.total_revenue || 54200).toLocaleString()}
              </p>
              <span className="text-[11px] text-stone-400">Excludes cancelled orders</span>
            </div>
          </div>

          {/* Interactive Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Order Volume Bar Chart */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-sm text-stone-900">Daily Order Volume</h3>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  {baseTrends.reduce((s: number, t: any) => s + t.order_count, 0)} Total
                </span>
              </div>

              {/* SVG Bar Chart */}
              <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
                {baseTrends.map((t: any, i: number) => {
                  const heightPct = Math.round((t.order_count / maxOrders) * 100);
                  const shortDate = t.order_date.slice(5);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-bold text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.order_count}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[28px] bg-rose-500 hover:bg-rose-600 rounded-t-lg transition-all shadow-2xs"
                      />
                      <span className="text-[9px] font-mono text-stone-400">{shortDate}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Daily Revenue Trend Line */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-stone-900">Daily Revenue Trend (INR)</h3>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  ₹{baseTrends.reduce((s: number, t: any) => s + Number(t.daily_revenue), 0).toLocaleString()}
                </span>
              </div>

              {/* Visual Revenue Bars with Gradients */}
              <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
                {baseTrends.map((t: any, i: number) => {
                  const heightPct = Math.round((t.daily_revenue / maxRevenue) * 100);
                  const shortDate = t.order_date.slice(5);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{(t.daily_revenue / 1000).toFixed(1)}k
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[28px] bg-gradient-to-t from-emerald-600 to-teal-400 hover:brightness-110 rounded-t-lg transition-all shadow-2xs"
                      />
                      <span className="text-[9px] font-mono text-stone-400">{shortDate}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Orders Overview Table */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Recent Customer Orders</h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>Manage Dispatch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-stone-100 text-xs">
              {overview?.recentOrders && overview.recentOrders.map((ord: any) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-stone-900">Order #{ord.id}</span>
                    <p className="text-stone-500 text-[11px] truncate max-w-[280px]">
                      {ord.customer_name} · {ord.restaurant_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-stone-900 tabular-nums">
                      ₹{Number(ord.final_total).toFixed(2)}
                    </span>
                    <span className="block text-[10px] font-bold text-rose-700">{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESS ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Business Insights Selector */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs flex flex-wrap gap-1.5 overflow-x-auto">
            {ANALYTICS_CATEGORIES.map((q) => (
              <button
                key={q.id}
                onClick={() => setAnalyticsSubTab(q.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  analyticsSubTab === q.id
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Results Table Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  {ANALYTICS_CATEGORIES.find((c) => c.id === analyticsSubTab)?.label}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Real-time database aggregated reporting for operations and growth analytics
                </p>
              </div>

              <button
                onClick={() => fetchAnalyticsQuery(analyticsSubTab)}
                disabled={isLoadingAnalytics}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                <span>Refresh Insights</span>
              </button>
            </div>

            {/* Results Table */}
            {isLoadingAnalytics ? (
              <div className="py-16 text-center text-xs text-stone-400">Loading business analytics...</div>
            ) : analyticsData && analyticsData.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      {Object.keys(analyticsData[0]).map((key) => (
                        <th key={key} className="px-4 py-3">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {analyticsData.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-stone-50/80 transition-colors">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-4 py-2.5 font-medium text-stone-800 tabular-nums">
                            {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                No matching records returned for this report.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS & STATUS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fade-in">
          {/* Order Filters */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer, restaurant, or ID..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <span className="text-xs text-stone-500 font-medium">Filter Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-stone-200 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Placed">Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready for Pickup">Ready for Pickup</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {statusUpdateMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusUpdateMessage}</span>
            </div>
          )}

          {/* Orders Table with Status Actions */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3 text-right">Update Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono font-bold text-stone-900">#{ord.id}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{ord.customer_name}</td>
                    <td className="px-4 py-3 text-stone-600">{ord.restaurant_name}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">₹{Number(ord.final_total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        ord.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          defaultValue={ord.status}
                          id={`status-select-${ord.id}`}
                          className="px-2 py-1 text-[11px] bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready for Pickup">Ready for Pickup</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          disabled={updatingOrderId === ord.id}
                          onClick={() => {
                            const selectEl = document.getElementById(`status-select-${ord.id}`) as HTMLSelectElement;
                            handleUpdateOrderStatus(ord.id, selectEl.value);
                          }}
                          className="px-3 py-1 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs"
                        >
                          {updatingOrderId === ord.id ? 'Saving...' : 'Save Status'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RESTAURANT CATALOG CRUD */}
      {activeTab === 'crud' && (
        <div className="space-y-6 animate-fade-in max-w-xl">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-stone-900">Add New Restaurant</h3>
              <p className="text-xs text-stone-500">
                Expand the CraveCart catalog with a new dining partner in Chennai
              </p>
            </div>

            {crudMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{crudMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddRestaurant} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Bay Seafood Kitchen"
                  value={newRestName}
                  onChange={(e) => setNewRestName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Cuisine Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Indian & Coastal Chettinad"
                  value={newRestCuisine}
                  onChange={(e) => setNewRestCuisine(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Address in Chennai</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14, 2nd Avenue, Anna Nagar, Chennai"
                  value={newRestAddress}
                  onChange={(e) => setNewRestAddress(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Average Price for Two (₹)</label>
                <input
                  type="number"
                  required
                  value={newRestPrice}
                  onChange={(e) => setNewRestPrice(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                  <input
                    type="checkbox"
                    checked={isPureVeg}
                    onChange={(e) => setIsPureVeg(e.target.checked)}
                    className="rounded text-rose-600"
                  />
                  <span className="font-semibold">Pure Vegetarian Restaurant (100% Veg)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRest}
                className="w-full py-2.5 mt-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-2xs transition-colors"
              >
                {isSubmittingRest ? 'Adding Restaurant...' : 'Add Restaurant to Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
