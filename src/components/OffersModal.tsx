import React, { useState } from 'react';
import { X, Tag, Sparkles, Copy, Check, Percent, Gift, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon?: (code: string) => void;
}

interface Coupon {
  code: string;
  discount: string;
  description: string;
  minOrder: number;
  badge?: string;
}

const COUPONS: Coupon[] = [
  {
    code: 'CRAVE50',
    discount: '50% OFF up to ₹150',
    description: 'Valid on your favorite restaurants across Bengaluru on orders above ₹299.',
    minOrder: 299,
    badge: 'Popular',
  },
  {
    code: 'WELCOME100',
    discount: 'FLAT ₹100 OFF',
    description: 'Instant ₹100 savings on orders above ₹399 for all delicious meals.',
    minOrder: 399,
    badge: 'Hot Deal',
  },
  {
    code: 'FEAST20',
    discount: '20% OFF up to ₹200',
    description: 'Family feast discount applicable on group platters and orders above ₹499.',
    minOrder: 499,
  },
  {
    code: 'BIRYANI100',
    discount: 'FLAT ₹100 OFF on Biryanis',
    description: 'Celebrate authentic Hyderabadi and Lucknowi dum biryanis on orders above ₹350.',
    minOrder: 350,
    badge: 'Specialty',
  },
  {
    code: 'SWEETTOOTH',
    discount: 'FREE Dessert / 15% OFF',
    description: 'Sweeten your feast with 15% off artisanal desserts and regional Indian sweets.',
    minOrder: 249,
  },
];

export const OffersModal: React.FC<OffersModalProps> = ({ isOpen, onClose, onApplyCoupon }) => {
  const { user, isAuthenticated } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    if (onApplyCoupon) {
      onApplyCoupon(code);
    }
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 text-white shadow-sm shadow-rose-200">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-stone-900">Offers &amp; Rewards</h3>
            <p className="text-xs text-stone-500">
              Apply coupon promo codes and explore CraveRewards tier privileges.
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-6 pr-1">
          {/* CraveRewards Tier Showcase Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/15 border border-amber-300/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="font-extrabold text-sm text-stone-900">CraveRewards Loyalty Program</h4>
              </div>
              <span className="text-[10px] font-bold bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Automatic Discounts
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Every completed order moves you closer to automatic, stackable checkout discounts on your account.
            </p>

            {/* 3 Tiers Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Bronze</span>
                <span className="font-extrabold text-stone-900 text-sm mt-0.5 block">0%</span>
                <span className="text-[10px] text-stone-500 block">&lt; 3 orders</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Gold</span>
                <span className="font-extrabold text-amber-900 text-sm mt-0.5 block">10% OFF</span>
                <span className="text-[10px] text-amber-700 block">3 – 5 orders</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-b from-amber-100 to-amber-200/80 border border-amber-400 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-950 uppercase block">Platinum</span>
                <span className="font-black text-amber-950 text-sm mt-0.5 block">20% OFF</span>
                <span className="text-[10px] text-amber-900 font-medium block">&gt; 5 orders</span>
              </div>
            </div>

            {isAuthenticated && (
              <p className="text-[11px] text-amber-900/80 pt-1">
                Signed in as <strong>{user?.name}</strong>. Loyalty tier discounts apply automatically in your cart.
              </p>
            )}
          </div>

          {/* Active Promo Coupons List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5 text-rose-600" />
              <span>Available Promo Coupons</span>
            </div>

            <div className="space-y-2.5">
              {COUPONS.map((cp) => (
                <div
                  key={cp.code}
                  className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-rose-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg tracking-wider">
                        {cp.code}
                      </span>
                      {cp.badge && (
                        <span className="text-[10px] font-bold bg-stone-900 text-white px-2 py-0.2 rounded-full uppercase">
                          {cp.badge}
                        </span>
                      )}
                      <span className="font-bold text-xs text-stone-900 truncate">{cp.discount}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">{cp.description}</p>
                  </div>

                  <button
                    onClick={() => handleCopy(cp.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      copiedCode === cp.code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                  >
                    {copiedCode === cp.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>Offers valid across all Bengaluru delivery zones.</span>
          <button
            onClick={onClose}
            className="text-stone-700 font-semibold hover:text-stone-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
