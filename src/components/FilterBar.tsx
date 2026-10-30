import React from 'react';
import { Search, Star, Leaf, ArrowUpDown, X, Tag } from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCuisine: string;
  onCuisineChange: (cuisine: string) => void;
  cuisines: string[];
  minRating: number | null;
  onMinRatingToggle: () => void;
  pureVeg: boolean;
  onPureVegToggle: () => void;
  priceBracket: string;
  onPriceBracketChange: (bracket: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  totalResults: number;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedCuisine,
  onCuisineChange,
  cuisines,
  minRating,
  onMinRatingToggle,
  pureVeg,
  onPureVegToggle,
  priceBracket,
  onPriceBracketChange,
  sortBy,
  onSortByChange,
  totalResults,
  onResetFilters,
}) => {
  const hasActiveFilters =
    search !== '' ||
    selectedCuisine !== 'all' ||
    minRating !== null ||
    pureVeg ||
    priceBracket !== 'all' ||
    sortBy !== 'recommended';

  return (
    <div className="space-y-4">
      {/* Top Search & Results Counter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search restaurants, cuisines, or dishes..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-stone-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-stone-500">
          <span className="font-semibold text-stone-900 tabular-nums">{totalResults}</span>
          <span>restaurants near you</span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-rose-600 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Filter Chips Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Rating 4.0+ Chip (DA2 Query 2) */}
        <button
          onClick={onMinRatingToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            minRating === 4.0
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${minRating === 4.0 ? 'fill-emerald-700 text-emerald-700' : 'text-stone-400'}`} />
          <span>Rating 4.0+</span>
        </button>

        {/* Pure Veg Chip */}
        <button
          onClick={onPureVegToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            pureVeg
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          }`}
        >
          <Leaf className={`w-3.5 h-3.5 ${pureVeg ? 'text-emerald-700' : 'text-stone-400'}`} />
          <span>Pure Veg</span>
        </button>

        {/* Cuisine Selector */}
        <select
          value={selectedCuisine}
          onChange={(e) => onCuisineChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-stone-700 border border-stone-200 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer shadow-xs"
        >
          <option value="all">All Cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Price Bracket Segmented Chips */}
        <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80">
          <button
            onClick={() => onPriceBracketChange('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              priceBracket === 'all' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Prices
          </button>
          <button
            onClick={() => onPriceBracketChange('low')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              priceBracket === 'low' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            &lt; ₹400
          </button>
          <button
            onClick={() => onPriceBracketChange('mid')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              priceBracket === 'mid' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ₹400-600
          </button>
          <button
            onClick={() => onPriceBracketChange('high')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              priceBracket === 'high' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            &gt; ₹600
          </button>
        </div>

        {/* Sort Selector */}
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-stone-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-stone-800 border border-stone-200 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer shadow-xs"
          >
            <option value="recommended">Recommended</option>
            <option value="rating_desc">Rating: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Most Popular (Sales)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
