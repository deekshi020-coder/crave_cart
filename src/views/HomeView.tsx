import React, { useState, useEffect } from 'react';
import { Sparkles, Utensils, Star, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { Restaurant, Category } from '../types';
import { api } from '../api';
import { RestaurantCard } from '../components/RestaurantCard';
import { FilterBar } from '../components/FilterBar';

interface HomeViewProps {
  onSelectRestaurant: (restaurantId: number) => void;
  onOpenOffersModal: () => void;
}

interface HighestRatedItem {
  restaurant_id: number;
  restaurant_name: string;
  cuisine_type: string;
  image_url: string;
  avg_rating: number | string;
  review_count: number;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectRestaurant, onOpenOffersModal }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [highestRated, setHighestRated] = useState<HighestRatedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [pureVeg, setPureVeg] = useState<boolean>(false);
  const [priceBracket, setPriceBracket] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recommended');

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getRestaurants({
        search,
        cuisine: selectedCuisine,
        category: selectedCategory,
        minRating: minRating || undefined,
        pureVeg: pureVeg ? 'true' : undefined,
        priceBracket,
        sortBy,
      });

      setRestaurants(res.restaurants);
      if (res.cuisines) setCuisines(res.cuisines);
      if (res.categories) setCategories(res.categories);
    } catch (err: any) {
      setError(err.message || 'Failed to load restaurants.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [search, selectedCuisine, selectedCategory, minRating, pureVeg, priceBracket, sortBy]);

  // Fetch top rated restaurants (DA2 Query 6 logic)
  useEffect(() => {
    api.getHighestRatedTiesQuery6()
      .then((res) => {
        if (res.data) setHighestRated(res.data);
      })
      .catch(() => {});
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCuisine('all');
    setSelectedCategory('all');
    setMinRating(null);
    setPureVeg(false);
    setPriceBracket('all');
    setSortBy('recommended');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Showcase Section */}
      <section className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[340px] sm:min-h-[380px] flex items-center shadow-lg">
        {/* Background Image with Scrim */}
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_food_delivery_1793294052688.jpg"
            alt="CraveCart Feast"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-45 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl p-6 sm:p-10 lg:p-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chennai&apos;s Fastest Gourmet Delivery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-balance">
            Good food. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-300 to-amber-200">
              Great mood.
            </span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-base max-w-lg leading-relaxed">
            Order authentic Ambur Dum Biryanis, crisp Ghee Roasts, artisanal woodfired pizzas, and street chaat from premier Chennai kitchens with real-time GPS tracking.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('discovery-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span>Explore Restaurants</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenOffersModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold border border-white/15 backdrop-blur-xs transition-colors flex items-center gap-1.5"
            >
              <Tag className="w-4 h-4 text-rose-400" />
              <span>Offers &amp; Deals</span>
            </button>
          </div>
        </div>
      </section>

      {/* Promotional Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">Code: CRAVE50</h4>
            <p className="text-[11px] text-stone-600">50% OFF up to ₹150 on orders &gt; ₹299</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">CraveRewards Loyalty</h4>
            <p className="text-[11px] text-stone-600">Up to 20% automatic discount on qualifying orders</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">Code: WELCOME100</h4>
            <p className="text-[11px] text-stone-600">Flat ₹100 instant discount on orders &gt; ₹399</p>
          </div>
        </div>
      </section>

      {/* Food Categories Horizontal Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">What&apos;s on your mind?</h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              View all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === String(cat.id)
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Highest-Rated Restaurants Spotlight */}
      {highestRated && highestRated.length > 0 && selectedCuisine === 'all' && selectedCategory === 'all' && !search && (
        <section className="p-5 rounded-2xl bg-gradient-to-r from-stone-50 to-stone-100/70 border border-stone-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <h3 className="font-extrabold text-sm text-stone-900">
                Top-Rated Kitchens in Chennai
              </h3>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              Customer favorite culinary ratings ({highestRated[0]?.avg_rating} ★)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {highestRated.map((item) => (
              <div
                key={item.restaurant_id}
                onClick={() => onSelectRestaurant(item.restaurant_id)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs hover:border-rose-300 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                  <img
                    src={item.image_url || '/src/assets/images/biryani_specialty_1793294053906.jpg'}
                    alt={item.restaurant_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-stone-900 group-hover:text-rose-600 truncate">
                    {item.restaurant_name}
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate">{item.cuisine_type}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold bg-emerald-700 text-white px-1.5 py-0.2 rounded">
                      {item.avg_rating} ★
                    </span>
                    <span className="text-[10px] text-stone-400">({item.review_count} reviews)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Restaurant Discovery Section */}
      <section id="discovery-section" className="space-y-5 pt-2">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedCuisine={selectedCuisine}
          onCuisineChange={setSelectedCuisine}
          cuisines={cuisines}
          minRating={minRating}
          onMinRatingToggle={() => setMinRating(minRating === 4.0 ? null : 4.0)}
          pureVeg={pureVeg}
          onPureVegToggle={() => setPureVeg(!pureVeg)}
          priceBracket={priceBracket}
          onPriceBracketChange={setPriceBracket}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          totalResults={restaurants.length}
          onResetFilters={handleResetFilters}
        />

        {/* Restaurant Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                <div className="aspect-4/3 bg-stone-200 w-full" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                  <div className="h-3 bg-stone-200 rounded w-1/4 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
            <Utensils className="w-8 h-8 text-rose-500 mx-auto" />
            <h4 className="font-bold text-stone-900 text-base">Unable to connect to PostgreSQL</h4>
            <p className="text-xs text-stone-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchRestaurants}
              className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="p-12 text-center bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
            <Utensils className="w-8 h-8 text-stone-400 mx-auto" />
            <h4 className="font-bold text-stone-900 text-base">No restaurants match your filters</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try adjusting your rating threshold, cuisine, or price bracket to see more results.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={onSelectRestaurant}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
