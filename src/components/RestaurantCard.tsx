import React, { useState } from 'react';
import { Star, Clock, Tag, Utensils } from 'lucide-react';
import { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (id: number) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  const [imgError, setImgError] = useState(false);

  const ratingNum = typeof restaurant.avg_rating === 'number' 
    ? restaurant.avg_rating 
    : parseFloat(restaurant.avg_rating || '0');

  return (
    <div
      onClick={() => onClick(restaurant.id)}
      className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Image Container with 4:3 Aspect Ratio & measured scrim */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        {!imgError ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 text-center">
            <Utensils className="w-8 h-8 mb-1 text-stone-300" />
            <span className="text-xs font-medium text-stone-500">{restaurant.name}</span>
          </div>
        )}

        {/* Pure Veg Marker */}
        {restaurant.is_pure_veg && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-emerald-300 shadow-xs flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Pure Veg</span>
          </div>
        )}

        {/* Delivery Time Badge */}
        <div className="absolute bottom-3 right-3 bg-stone-900/85 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-stone-300" />
          <span>{restaurant.delivery_time_mins || 30} mins</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Header Row: Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-stone-900 group-hover:text-rose-600 transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
            {ratingNum > 0 ? (
              <div className="flex items-center gap-1 bg-emerald-700 text-white px-1.5 py-0.5 rounded-md text-xs font-bold shrink-0 tabular-nums shadow-xs">
                <span>{ratingNum.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-white text-white" />
              </div>
            ) : (
              <span className="text-[11px] text-stone-400 font-medium">New</span>
            )}
          </div>

          {/* Cuisine & Price Info */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
            <span className="truncate">{restaurant.cuisine_type}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0 font-medium text-stone-700 tabular-nums">
              ₹{Math.round(Number(restaurant.price_for_two))} for two
            </span>
          </div>
        </div>

        {/* Location & Reviews Subtext */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100">
          <span className="truncate max-w-[170px]">{restaurant.address}</span>
          {restaurant.review_count > 0 && (
            <span className="tabular-nums shrink-0">{restaurant.review_count} reviews</span>
          )}
        </div>

        {/* Active Promotion Strip */}
        {restaurant.active_offers && restaurant.active_offers.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-medium bg-rose-50/70 px-2 py-1 rounded-md border border-rose-100">
            <Tag className="w-3 h-3 text-rose-600 shrink-0" />
            <span className="truncate">{restaurant.active_offers[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};
