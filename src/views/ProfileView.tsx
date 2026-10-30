import React, { useState, useEffect } from 'react';
import { User as UserIcon, Sparkles, MapPin, Plus, Trash2, Edit2, CheckCircle2, Shield, Phone, Mail, Award, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Address } from '../types';

interface ProfileViewProps {
  onOpenAuthModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuthModal }) => {
  const { user, isAuthenticated } = useAuth();

  const [loyalty, setLoyalty] = useState<{
    customerId: number;
    eligibleOrders: number;
    discountPercentage: number;
    totalSpending: number;
    nextTierMessage: string;
    tierName: string;
  } | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  // Form fields
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrPostal, setAddrPostal] = useState('600040');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isSavingAddr, setIsSavingAddr] = useState(false);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      const [loyaltyRes, addrRes] = await Promise.all([
        api.getLoyalty(),
        api.getAddresses(),
      ]);
      setLoyalty(loyaltyRes.loyalty);
      setAddresses(addrRes.addresses);
    } catch (err: any) {
      console.error('Failed to load profile data:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user?.id]);

  const resetForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setAddrLabel('Home');
    setAddrStreet('');
    setAddrLandmark('');
    setAddrPostal('600040');
    setAddrIsDefault(false);
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label || 'Home');
    setAddrStreet(addr.street_address);
    setAddrLandmark(addr.landmark || '');
    setAddrPostal(addr.postal_code || '600040');
    setAddrIsDefault(addr.is_default || false);
    setIsAddingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet || !addrPostal) return;
    try {
      setIsSavingAddr(true);
      if (editingAddressId) {
        await api.updateAddress(editingAddressId, {
          label: addrLabel,
          street_address: addrStreet,
          landmark: addrLandmark,
          city: 'Chennai',
          postal_code: addrPostal,
          is_default: addrIsDefault,
        });
      } else {
        await api.addAddress({
          label: addrLabel,
          street_address: addrStreet,
          landmark: addrLandmark,
          city: 'Chennai',
          postal_code: addrPostal,
          is_default: addrIsDefault,
        });
      }
      resetForm();
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save address.');
    } finally {
      setIsSavingAddr(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Remove this delivery address?')) return;
    try {
      await api.deleteAddress(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-20 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-stone-900 text-lg">Sign in to view your profile & loyalty tier</h3>
        <p className="text-xs text-stone-500">
          Manage saved Chennai delivery addresses, track your orders, and claim loyalty discounts.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
        >
          Sign In
        </button>
      </div>
    );
  }

  const eligibleOrders = loyalty?.eligibleOrders || 0;
  const discountPct = loyalty?.discountPercentage || 0;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
            {user?.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-stone-900">{user?.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </span>
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{user.phone}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                Account Role: {user?.role === 'delivery_agent' ? 'Delivery Partner' : user?.role}
              </span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                Chennai Network
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CraveRewards Loyalty Membership Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/15 rounded-3xl border border-amber-300/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-stone-900">
                  CraveRewards Loyalty Membership ({loyalty?.tierName || 'Member'})
                </h3>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full uppercase">
                  Active Tier
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Earn automatic checkout discounts with every completed food delivery order.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-amber-900 tabular-nums">
              {discountPct}% OFF
            </span>
            <p className="text-[11px] text-amber-800 font-semibold">Applied on Every Checkout</p>
          </div>
        </div>

        {/* Progress & Rules Indicator */}
        <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-amber-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Qualifying Orders</span>
              <span className="text-lg font-extrabold text-stone-900 tabular-nums">{eligibleOrders}</span>
              <span className="text-[10px] text-stone-400 block">Excludes cancelled</span>
            </div>
            <div className="p-2.5 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Paid Spent</span>
              <span className="text-lg font-extrabold text-stone-900 tabular-nums">
                ₹{loyalty?.totalSpending?.toFixed(2) || '0.00'}
              </span>
              <span className="text-[10px] text-stone-400 block">Lifetime spend</span>
            </div>
            <div className="p-2.5 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Next Milestone</span>
              <span className="text-xs font-bold text-amber-800 block mt-1">
                {loyalty?.nextTierMessage}
              </span>
            </div>
          </div>

          {/* Bracket Tier Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-center text-xs">
            <div className={`p-2 rounded-xl border ${eligibleOrders < 3 ? 'bg-amber-50 border-amber-300 font-bold text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
              <span className="text-[10px] block">Tier 1 (&lt; 3 orders)</span>
              <span>0% Discount</span>
            </div>
            <div className={`p-2 rounded-xl border ${eligibleOrders >= 3 && eligibleOrders <= 5 ? 'bg-amber-100 border-amber-400 font-bold text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
              <span className="text-[10px] block">Tier 2 (3 - 5 orders)</span>
              <span>10% Gold Discount</span>
            </div>
            <div className={`p-2 rounded-xl border ${eligibleOrders > 5 ? 'bg-amber-200/90 border-amber-500 font-extrabold text-amber-950 shadow-2xs' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
              <span className="text-[10px] block">Tier 3 (&gt; 5 orders)</span>
              <span>20% Platinum Discount</span>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Delivery Addresses */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-base text-stone-900">Saved Delivery Addresses (Chennai)</h3>
          </div>
          <button
            onClick={() => {
              if (isAddingAddress) resetForm();
              else {
                resetForm();
                setIsAddingAddress(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
          </button>
        </div>

        {/* Add/Edit Address Form */}
        {isAddingAddress && (
          <form onSubmit={handleSaveAddress} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs animate-fade-in">
            <h4 className="font-bold text-stone-900 text-xs">
              {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Home / Work / Other"
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-stone-600 font-medium mb-1">Postal Code (PIN)</label>
                <input
                  type="text"
                  value={addrPostal}
                  onChange={(e) => setAddrPostal(e.target.value)}
                  placeholder="600040"
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Street Address</label>
              <textarea
                rows={2}
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="Flat / Building number, street, neighborhood (e.g. 2nd Avenue, Anna Nagar)"
                required
                className="w-full p-2 bg-white border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={addrLandmark}
                onChange={(e) => setAddrLandmark(e.target.value)}
                placeholder="Near Roundtana / Metro Station"
                className="w-full p-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <span>Set as default address</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddr}
                  className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-2xs"
                >
                  {isSavingAddr ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Addresses List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex items-start justify-between gap-3 hover:border-stone-300 transition-colors"
            >
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-stone-700 leading-relaxed">{addr.street_address}</p>
                {addr.landmark && <p className="text-stone-400 text-[11px]">Landmark: {addr.landmark}</p>}
                <p className="text-stone-500 text-[11px] font-medium">{addr.city || 'Chennai'} - {addr.postal_code}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEditAddress(addr)}
                  className="text-stone-400 hover:text-stone-800 p-1 transition-colors"
                  title="Edit address"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                  title="Delete address"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
