import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Search, Plus, Minus, Check, Tag, MessageSquare, AlertCircle } from 'lucide-react';
import { Restaurant, MenuItem, Review } from '../types';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface RestaurantViewProps {
  restaurantId: number;
  onBack: () => void;
  onOpenAuthModal: () => void;
}

export const RestaurantView: React.FC<RestaurantViewProps> = ({
  restaurantId,
  onBack,
  onOpenAuthModal,
}) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');

  // Conflict modal state if adding item from different restaurant
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5.0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [restRes, menuRes, revRes] = await Promise.all([
        api.getRestaurant(restaurantId),
        api.getRestaurantMenu(restaurantId, {
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          vegOnly,
          search: menuSearch,
          sortBy: sortBy !== 'default' ? sortBy : undefined,
        }),
        api.getRestaurantReviews(restaurantId),
      ]);

      setRestaurant(restRes.restaurant);
      setMenuItems(menuRes.items);
      setCategories(menuRes.categories);
      setReviews(revRes.reviews);
    } catch (err: any) {
      setError(err.message || 'Failed to load restaurant details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId, selectedCategory, vegOnly, menuSearch, sortBy]);

  const handleAddItem = async (item: MenuItem) => {
    try {
      const res = await addToCart(item.id, 1, false, {
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        is_veg: item.is_veg,
        restaurant_id: restaurant?.id || item.restaurant_id,
        restaurant_name: restaurant?.name || 'Selected Restaurant',
      });
      if (res && res.differentRestaurant) {
        setPendingItem(item);
        setConflictModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || 'Could not add item to cart.');
    }
  };

  const handleConfirmReplaceCart = async () => {
    if (!pendingItem) return;
    await addToCart(pendingItem.id, 1, true, {
      name: pendingItem.name,
      price: pendingItem.price,
      image_url: pendingItem.image_url,
      is_veg: pendingItem.is_veg,
      restaurant_id: restaurant?.id || pendingItem.restaurant_id,
      restaurant_name: restaurant?.name || 'Selected Restaurant',
    });
    setConflictModalOpen(false);
    setPendingItem(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }
    try {
      setIsSubmittingReview(true);
      await api.submitReview(restaurantId, {
        rating: reviewRating,
        reviewText,
      });
      setReviewSuccess('Review submitted! Thank you for sharing your feedback.');
      setReviewText('');
      const revRes = await api.getRestaurantReviews(restaurantId);
      setReviews(revRes.reviews);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getCartQuantity = (menuItemId: number): number => {
    if (!cart) return 0;
    const match = cart.items.find((i) => i.menu_item_id === menuItemId);
    return match ? match.quantity : 0;
  };

  const getCartItemId = (menuItemId: number): number | null => {
    if (!cart) return null;
    const match = cart.items.find((i) => i.menu_item_id === menuItemId);
    return match ? match.cart_item_id : null;
  };

  if (isLoading && !restaurant) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500">Loading menu & restaurant data...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-3 max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="font-bold text-stone-900 text-base">Error Loading Restaurant</h4>
        <p className="text-xs text-stone-600">{error || 'Restaurant not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  const ratingNum = typeof restaurant.avg_rating === 'number' 
    ? restaurant.avg_rating 
    : parseFloat(restaurant.avg_rating || '0');

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all restaurants</span>
      </button>

      {/* Restaurant Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="relative h-48 sm:h-64 w-full bg-stone-900">
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          {/* Pure Veg Tag */}
          {restaurant.is_pure_veg && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-emerald-300 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Pure Veg Kitchen</span>
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 text-white space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{restaurant.name}</h1>
            <p className="text-stone-200 text-xs sm:text-sm">{restaurant.cuisine_type} · {restaurant.address}</p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="p-4 sm:p-6 bg-stone-50/70 border-t border-stone-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Rating</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="font-extrabold text-sm text-stone-900 tabular-nums">
                {ratingNum > 0 ? ratingNum.toFixed(1) : 'New'}
              </span>
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
            <span className="text-[10px] text-stone-500">({restaurant.review_count} reviews)</span>
          </div>

          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Delivery Time</span>
            <div className="flex items-center justify-center gap-1 mt-0.5 font-extrabold text-sm text-stone-900 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{restaurant.delivery_time_mins || 30} mins</span>
            </div>
            <span className="text-[10px] text-stone-500">Fast Handcrafted Dispatch</span>
          </div>

          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Cost for Two</span>
            <div className="mt-0.5 font-extrabold text-sm text-stone-900 tabular-nums">
              ₹{Number(restaurant.price_for_two)}
            </div>
            <span className="text-[10px] text-stone-500">Standard Pricing</span>
          </div>
        </div>
      </div>

      {/* Tabs: Menu vs Reviews */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/80 w-fit">
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'menu' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Menu ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'reviews' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Customer Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === 'menu' ? (
        <div className="space-y-6">
          {/* Menu Search and Sub-filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search within menu..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
              {/* Veg Only Toggle */}
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  vegOnly
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Veg Only</span>
              </button>

              {/* Price / Popularity Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-stone-700 border border-stone-200 focus:outline-none cursor-pointer"
              >
                <option value="default">Default Order</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const qty = getCartQuantity(item.id);
              const cartItemId = getCartItemId(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs hover:shadow-sm transition-all flex justify-between gap-4"
                >
                  <div className="flex-1 space-y-1.5">
                    {/* Dietary badge */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        {item.category_name}
                      </span>

                      {/* Chef's Special / Signature Item Indicator */}
                      {item.is_above_restaurant_avg && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Chef&apos;s Special
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-stone-900">{item.name}</h4>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    <p className="font-extrabold text-sm text-stone-900 tabular-nums pt-1">
                      ₹{Number(item.price)}
                    </p>
                  </div>

                  {/* Photo & Add to cart button */}
                  <div className="flex flex-col items-center justify-between shrink-0 w-28">
                    <div className="w-24 h-20 rounded-xl bg-stone-100 overflow-hidden relative">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {qty === 0 ? (
                      <button
                        onClick={() => handleAddItem(item)}
                        className="mt-2 w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-600 font-extrabold text-xs rounded-lg border border-rose-300 shadow-2xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    ) : (
                      <div className="mt-2 flex items-center justify-between w-full bg-rose-600 text-white rounded-lg px-2 py-1 shadow-2xs">
                        <button
                          onClick={() => cartItemId && updateQuantity(cartItemId, qty - 1)}
                          className="hover:text-rose-200 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-extrabold tabular-nums">{qty}</span>
                        <button
                          onClick={() => cartItemId && updateQuantity(cartItemId, qty + 1)}
                          className="hover:text-rose-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Reviews Tab */
        <div className="space-y-6">
          {/* Write Review Form */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Leave a Review</h3>
            {reviewSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{reviewSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {[5.0, 4.5, 4.0, 3.5, 3.0].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReviewRating(r)}
                        className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors ${
                          reviewRating === r
                            ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-500/20'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>{r}</span>
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Describe taste, quality, packaging, and temperature..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Customer Review'}
                </button>
              </form>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-stone-900">{rev.customer_name}</span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-700 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                    <span>{Number(rev.rating).toFixed(1)}</span>
                    <Star className="w-3 h-3 fill-white text-white" />
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{rev.review_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Restaurant Conflict Modal */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm">Replace Cart Items?</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your cart currently contains dishes from <strong>{cart?.restaurantName}</strong>. A CraveCart order can only include items from one restaurant at a time.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConflictModalOpen(false)}
                className="px-3 py-1.5 text-xs text-stone-600 font-medium hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReplaceCart}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
              >
                Start New Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
